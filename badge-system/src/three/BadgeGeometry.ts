import * as THREE from 'three';
import { AppleAwardMaterials } from './materials';
import { createConvexCoinGeometry } from './ConvexCoinGeometry';

export { createConvexCoinGeometry };

export interface AppleBadgeMeshGroup extends THREE.Group {
  updateProgress?: (progress: number | number[]) => void;
  updateState?: (isLocked: boolean) => void;
  flipToSide?: (side: 'front' | 'back') => void;
  setExplodedView?: (explodedFactor: number) => void;
}

/**
 * ------------------------------------------------------------------
 * 1. MATHEMATICAL SHIELD BOUNDARY (Apple Continuous Filleted Contour)
 * ------------------------------------------------------------------
 */
function getAppleShieldRadius(theta: number): number {
  let t = theta;
  while (t > Math.PI) t -= Math.PI * 2;
  while (t < -Math.PI) t += Math.PI * 2;

  const cosT = Math.cos(t);
  const sinT = Math.sin(t);
  const absCosT = Math.abs(cosT);

  const halfW = 1.15;
  const topY = 1.85;
  const shoulderY = 0.95;
  const hipY = -0.65;
  const bottomY = -1.85;

  const kTop = (topY - shoulderY) / halfW;
  if (sinT > 0) {
    const denomTop = sinT + kTop * absCosT;
    if (denomTop > 0.001) {
      const rCandidate = topY / denomTop;
      const x = rCandidate * absCosT;
      const y = rCandidate * sinT;
      if (y >= shoulderY && x <= halfW + 0.001) {
        return rCandidate;
      }
    }
  }

  const kBot = (hipY - bottomY) / halfW;
  if (sinT < 0) {
    const denomBot = -sinT + kBot * absCosT;
    if (denomBot > 0.001) {
      const rCandidate = -bottomY / denomBot;
      const x = rCandidate * absCosT;
      const y = rCandidate * sinT;
      if (y <= hipY && x <= halfW + 0.001) {
        return rCandidate;
      }
    }
  }

  if (absCosT > 0.001) {
    return halfW / absCosT;
  }

  return 2.0;
}

/**
 * Master Curvature Function for the Apple Shield (Direction 1) - Authentic Convex Pebble Crown
 */
export function getShieldSurfaceZ(x: number, y: number, isBack: boolean = false, thickness: number = 0.075): number {
  const normY = y / 1.85;
  const normX = x / 1.15;
  const rNorm = Math.min(1.0, Math.sqrt(normX * normX + normY * normY * 0.6));

  const longBow = (1.0 - normY * normY) * 0.06;
  const convexDome = (1.0 - rNorm * rNorm) * 0.14;

  if (!isBack) {
    return longBow + convexDome;
  } else {
    const backDome = (1.0 - rNorm * rNorm) * 0.03;
    return longBow - thickness - backDome;
  }
}

/**
 * Master Curvature Function for the Hexagon Challenge Medal (Direction 3) - Convex Crowned Face
 */
export function getHexSurfaceZ(x: number, y: number, isBack: boolean = false, thickness: number = 0.075): number {
  const rNorm = Math.min(1.0, Math.sqrt(x * x + y * y) / 1.48);
  const normY = y / 1.48;

  const longBow = (1.0 - normY * normY) * 0.05;
  const convexDome = (1.0 - rNorm * rNorm) * 0.14;

  if (!isBack) {
    return longBow + convexDome;
  } else {
    const backDome = (1.0 - rNorm * rNorm) * 0.03;
    return longBow - thickness - backDome;
  }
}

/**
 * ------------------------------------------------------------------
 * 2. SEAMLESS FILLETED SHIELD RIM RIBBON (Watertight)
 * ------------------------------------------------------------------
 */
function createSeamlessShieldRimRibbon(
  scale: number,
  material: THREE.Material,
  thickness: number = 0.075,
  segments: number = 96
): THREE.Mesh {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i < segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    const r = getAppleShieldRadius(theta) * scale;
    const x = r * Math.cos(theta);
    const y = r * Math.sin(theta);

    const zFront = getShieldSurfaceZ(x / scale, y / scale, false, thickness);
    const zBack = getShieldSurfaceZ(x / scale, y / scale, true, thickness);

    // Front vertex on outer edge
    positions.push(x, y, zFront);
    uvs.push(i / segments, 1);

    // Back vertex directly below it (exact watertight alignment)
    positions.push(x, y, zBack);
    uvs.push(i / segments, 0);
  }

  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments;
    const f1 = i * 2;
    const b1 = i * 2 + 1;
    const f2 = next * 2;
    const b2 = next * 2 + 1;

    indices.push(f1, f2, b1);
    indices.push(b1, f2, b2);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * ------------------------------------------------------------------
 * 3. PRISTINE RADIAL CONCENTRIC DISHED SURFACE (Full Plate)
 * ------------------------------------------------------------------
 */
function createSeamlessDishedShieldMesh(
  scale: number,
  isBack: boolean,
  material: THREE.Material,
  thickness: number = 0.075,
  angularSteps: number = 96,
  radialRings: number = 24
): THREE.Mesh {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  // Center vertex
  const centerZ = getShieldSurfaceZ(0, 0, isBack, thickness);
  positions.push(0, 0, centerZ);
  uvs.push(0.5, 0.5);

  // Concentric rings
  for (let ring = 1; ring <= radialRings; ring++) {
    const frac = ring / radialRings;
    for (let step = 0; step < angularSteps; step++) {
      const theta = (step / angularSteps) * Math.PI * 2;
      const boundaryR = getAppleShieldRadius(theta) * scale;
      const r = frac * boundaryR;
      const x = r * Math.cos(theta);
      const y = r * Math.sin(theta);
      const z = getShieldSurfaceZ(x / scale, y / scale, isBack, thickness);

      positions.push(x, y, z);
      const u = isBack
        ? (-(x / (1.15 * scale)) * 0.5 + 0.5)
        : ((x / (1.15 * scale)) * 0.5 + 0.5);
      const v = (y / (1.85 * scale)) * 0.5 + 0.5;
      uvs.push(u, v);
    }
  }

  // Inner cap
  for (let step = 0; step < angularSteps; step++) {
    const next = (step + 1) % angularSteps;
    const v1 = 1 + step;
    const v2 = 1 + next;
    if (!isBack) indices.push(0, v1, v2);
    else indices.push(0, v2, v1);
  }

  // Quads between successive rings
  for (let ring = 1; ring < radialRings; ring++) {
    const ringStart = 1 + (ring - 1) * angularSteps;
    const nextRingStart = 1 + ring * angularSteps;

    for (let step = 0; step < angularSteps; step++) {
      const next = (step + 1) % angularSteps;
      const a = ringStart + step;
      const b = ringStart + next;
      const c = nextRingStart + next;
      const d = nextRingStart + step;

      if (!isBack) {
        indices.push(a, b, c);
        indices.push(a, c, d);
      } else {
        indices.push(a, c, b);
        indices.push(a, d, c);
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * ------------------------------------------------------------------
 * 4. SEAMLESS CHAMPLEVÉ ENAMEL INLAY FACETS
 * ------------------------------------------------------------------
 */
function createShieldEnamelFacet(
  scale: number,
  facet: 'top' | 'bottom',
  material: THREE.Material,
  thickness: number = 0.075
): THREE.Mesh {
  const nu = 40;
  const nv = 32;

  const leftSeam = new THREE.Vector2(-1.15 * scale, 0.46 * scale);
  const rightSeam = new THREE.Vector2(1.15 * scale, 0.14 * scale);

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let j = 0; j <= nv; j++) {
    const v = j / nv;

    for (let i = 0; i <= nu; i++) {
      const u = i / nu;
      const seamPt = new THREE.Vector2().lerpVectors(leftSeam, rightSeam, u);

      let x = 0;
      let y = 0;

      if (facet === 'top') {
        const topTip = new THREE.Vector2(0, 1.85 * scale);
        const boundaryPt = new THREE.Vector2();
        if (u <= 0.5) {
          const t = u * 2;
          boundaryPt.lerpVectors(new THREE.Vector2(-1.15 * scale, 0.95 * scale), topTip, t);
        } else {
          const t = (u - 0.5) * 2;
          boundaryPt.lerpVectors(topTip, new THREE.Vector2(1.15 * scale, 0.95 * scale), t);
        }
        const pt = new THREE.Vector2().lerpVectors(seamPt, boundaryPt, Math.pow(v, 0.92));
        x = pt.x * 0.985;
        y = pt.y * 0.985;
      } else {
        const botTip = new THREE.Vector2(0, -1.85 * scale);
        const boundaryPt = new THREE.Vector2();
        if (u <= 0.5) {
          const t = u * 2;
          boundaryPt.lerpVectors(new THREE.Vector2(-1.15 * scale, -0.65 * scale), botTip, t);
        } else {
          const t = (u - 0.5) * 2;
          boundaryPt.lerpVectors(botTip, new THREE.Vector2(1.15 * scale, -0.65 * scale), t);
        }
        const pt = new THREE.Vector2().lerpVectors(seamPt, boundaryPt, Math.pow(v, 0.92));
        x = pt.x * 0.985;
        y = pt.y * 0.985;
      }

      const z = getShieldSurfaceZ(x / scale, y / scale, false, thickness);
      positions.push(x, y, z);
      uvs.push(u, v);
    }
  }

  for (let j = 0; j < nv; j++) {
    for (let i = 0; i < nu; i++) {
      const a = j * (nu + 1) + i;
      const b = a + 1;
      const c = (j + 1) * (nu + 1) + i + 1;
      const d = (j + 1) * (nu + 1) + i;

      indices.push(a, b, c);
      indices.push(a, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * PROTOTYPE 1: Apple "Perfect Week (Study / Review / Focus / All Goals)" Dished Medal
 */
export function buildAppleFacetedShieldBadge(
  materials: AppleAwardMaterials,
  colorHex: number = 0xfa114f,
  earnedDate: string = 'OCTOBER 20, 2019',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const badge = new THREE.Group() as AppleBadgeMeshGroup;

  const mirrorSilver = materials.getMirrorSilverBezel(isLocked);
  const colorLacquer = materials.getColorLacquer(colorHex, isLocked);
  const boneEnamel = materials.getOffWhiteEnamel(isLocked);
  const backShellMat = materials.getAppleBackShell(earnedDate, 'PERFECT WEEK', isLocked);

  const thickness = 0.075;

  // 1. Seamless Mirror-Polished Chamfered Outer Bezel Rim Ribbon (Watertight)
  const rimMesh = createSeamlessShieldRimRibbon(1.0, mirrorSilver, thickness, 96);
  badge.add(rimMesh);

  // 2. Full Front Base Plate (prevents any see-through voids during flip)
  const baseMesh = createSeamlessDishedShieldMesh(1.0, false, mirrorSilver, thickness, 96, 24);
  badge.add(baseMesh);

  // 3. Front Face Inlay: Top Facet (Colored Lacquer)
  const topMesh = createShieldEnamelFacet(1.0, 'top', colorLacquer, thickness);
  topMesh.position.z = 0.006;
  badge.add(topMesh);

  // 4. Front Face Inlay: Bottom Facet (Satin Bone Ceramic Enamel)
  const bottomMesh = createShieldEnamelFacet(1.0, 'bottom', boneEnamel, thickness);
  bottomMesh.position.z = 0.006;
  badge.add(bottomMesh);

  // 5. Polished Dividing Metallic Razor Rib along the curved seam
  const ridgePts: THREE.Vector3[] = [];
  const rSteps = 32;
  const leftSeam = new THREE.Vector2(-1.15, 0.46);
  const rightSeam = new THREE.Vector2(1.15, 0.14);

  for (let i = 0; i <= rSteps; i++) {
    const t = i / rSteps;
    const pt = new THREE.Vector2().lerpVectors(leftSeam, rightSeam, t);
    const z = getShieldSurfaceZ(pt.x, pt.y, false, thickness) + 0.016;
    ridgePts.push(new THREE.Vector3(pt.x * 0.985, pt.y * 0.985, z));
  }
  const ridgeCurve = new THREE.CatmullRomCurve3(ridgePts);
  const ridgeGeo = new THREE.TubeGeometry(ridgeCurve, 36, 0.016, 16, false);
  const ridgeMesh = new THREE.Mesh(ridgeGeo, mirrorSilver);
  ridgeMesh.castShadow = true;
  badge.add(ridgeMesh);

  // 6. Curved Convex Reverse Shell with Laser Engraving (Watertight)
  const backMesh = createSeamlessDishedShieldMesh(1.0, true, backShellMat, thickness, 96, 24);
  badge.add(backMesh);

  badge.setExplodedView = (f: number) => {
    topMesh.position.z = 0.006 + f * 0.55;
    bottomMesh.position.z = 0.006 + f * 0.55;
    backMesh.position.z = -f * 0.5;
  };

  return badge;
}

/**
 * PROTOTYPE 2: Apple "Tricentric Learning Mastery" (100 Cards Mastered)
 * 100% Watertight Annular Chassis with outer & inner rim cylinder walls!
 */
export function buildAppleConcentricRingsBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'NOVEMBER 9, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const badge = new THREE.Group() as AppleBadgeMeshGroup;

  const mirrorGold = materials.getMirrorGoldBezel(isLocked);
  const coralMat = materials.getColorLacquer(0xfa114f, isLocked); // Study Crimson
  const voltMat = materials.getColorLacquer(0xa6ff00, isLocked);  // Focus Volt
  const cyanMat = materials.getColorLacquer(0x00f0ff, isLocked);  // Review Cyan
  const darkChannelMat = materials.getGrooveChannelMaterial();
  const backShellMat = materials.getAppleBackShell(earnedDate, '100 CARDS MASTERED', isLocked);

  const segments = 96;
  const rings = 20;
  const rOuter = 1.62;
  const rInner = 0.44;

  const getRingZ = (r: number, isBack: boolean = false) => {
    const frac = (r - rInner) / (rOuter - rInner);
    if (!isBack) {
      return (1.0 - frac * frac) * 0.14;
    } else {
      return (1.0 - frac * frac) * 0.14 - 0.075;
    }
  };

  // 1. Front Annular Dished Chassis Face
  const frontPos: number[] = [];
  const frontUv: number[] = [];
  const frontIdx: number[] = [];

  for (let r = 0; r <= rings; r++) {
    const frac = r / rings;
    const rad = rInner + frac * (rOuter - rInner);
    const z = getRingZ(rad, false);

    for (let s = 0; s <= segments; s++) {
      const theta = (s / segments) * Math.PI * 2;
      const x = Math.cos(theta) * rad;
      const y = Math.sin(theta) * rad;
      frontPos.push(x, y, z);
      frontUv.push((x / rOuter) * 0.5 + 0.5, (y / rOuter) * 0.5 + 0.5);
    }
  }

  for (let r = 0; r < rings; r++) {
    for (let s = 0; s < segments; s++) {
      const a = r * (segments + 1) + s;
      const b = a + 1;
      const c = (r + 1) * (segments + 1) + s + 1;
      const d = (r + 1) * (segments + 1) + s;
      frontIdx.push(a, b, c);
      frontIdx.push(a, c, d);
    }
  }

  const chassisGeo = new THREE.BufferGeometry();
  chassisGeo.setAttribute('position', new THREE.Float32BufferAttribute(frontPos, 3));
  chassisGeo.setAttribute('uv', new THREE.Float32BufferAttribute(frontUv, 2));
  chassisGeo.setIndex(frontIdx);
  chassisGeo.computeVertexNormals();
  const chassisMesh = new THREE.Mesh(chassisGeo, mirrorGold);
  chassisMesh.castShadow = true;
  chassisMesh.receiveShadow = true;
  badge.add(chassisMesh);

  // 2. Back Annular Shell Face (Laser Engraved)
  const backPositions: number[] = [];
  const backUvs: number[] = [];
  const backIndices: number[] = [];

  for (let r = 0; r <= rings; r++) {
    const frac = r / rings;
    const rad = rInner + frac * (rOuter - rInner);
    const z = getRingZ(rad, true);

    for (let s = 0; s <= segments; s++) {
      const theta = (s / segments) * Math.PI * 2;
      const x = Math.cos(theta) * rad;
      const y = Math.sin(theta) * rad;
      backPositions.push(x, y, z);
      backUvs.push((-(x / rOuter) * 0.5 + 0.5), (y / rOuter) * 0.5 + 0.5);
    }
  }

  for (let r = 0; r < rings; r++) {
    for (let s = 0; s < segments; s++) {
      const a = r * (segments + 1) + s;
      const b = a + 1;
      const c = (r + 1) * (segments + 1) + s + 1;
      const d = (r + 1) * (segments + 1) + s;
      backIndices.push(a, c, b);
      backIndices.push(a, d, c);
    }
  }

  const backGeo = new THREE.BufferGeometry();
  backGeo.setAttribute('position', new THREE.Float32BufferAttribute(backPositions, 3));
  backGeo.setAttribute('uv', new THREE.Float32BufferAttribute(backUvs, 2));
  backGeo.setIndex(backIndices);
  backGeo.computeVertexNormals();
  const backMesh = new THREE.Mesh(backGeo, backShellMat);
  badge.add(backMesh);

  // 3. WATERTIGHT WALL: Outer Rim Cylinder Strip connecting front and back at rOuter
  const outerWallPos: number[] = [];
  const outerWallIdx: number[] = [];
  const zOuterF = getRingZ(rOuter, false);
  const zOuterB = getRingZ(rOuter, true);

  for (let s = 0; s < segments; s++) {
    const theta = (s / segments) * Math.PI * 2;
    const x = Math.cos(theta) * rOuter;
    const y = Math.sin(theta) * rOuter;
    outerWallPos.push(x, y, zOuterF);
    outerWallPos.push(x, y, zOuterB);
  }

  for (let s = 0; s < segments; s++) {
    const next = (s + 1) % segments;
    const f1 = s * 2;
    const b1 = s * 2 + 1;
    const f2 = next * 2;
    const b2 = next * 2 + 1;
    outerWallIdx.push(f1, f2, b1);
    outerWallIdx.push(b1, f2, b2);
  }

  const outerWallGeo = new THREE.BufferGeometry();
  outerWallGeo.setAttribute('position', new THREE.Float32BufferAttribute(outerWallPos, 3));
  outerWallGeo.setIndex(outerWallIdx);
  outerWallGeo.computeVertexNormals();
  const outerWallMesh = new THREE.Mesh(outerWallGeo, mirrorGold);
  outerWallMesh.castShadow = true;
  badge.add(outerWallMesh);

  // 4. WATERTIGHT WALL: Inner Aperture Cylinder Strip connecting front and back at rInner
  const innerWallPos: number[] = [];
  const innerWallIdx: number[] = [];
  const zInnerF = getRingZ(rInner, false);
  const zInnerB = getRingZ(rInner, true);

  for (let s = 0; s < segments; s++) {
    const theta = (s / segments) * Math.PI * 2;
    const x = Math.cos(theta) * rInner;
    const y = Math.sin(theta) * rInner;
    innerWallPos.push(x, y, zInnerF);
    innerWallPos.push(x, y, zInnerB);
  }

  for (let s = 0; s < segments; s++) {
    const next = (s + 1) % segments;
    const f1 = s * 2;
    const b1 = s * 2 + 1;
    const f2 = next * 2;
    const b2 = next * 2 + 1;
    innerWallIdx.push(f1, b1, f2);
    innerWallIdx.push(f2, b1, b2);
  }

  const innerWallGeo = new THREE.BufferGeometry();
  innerWallGeo.setAttribute('position', new THREE.Float32BufferAttribute(innerWallPos, 3));
  innerWallGeo.setIndex(innerWallIdx);
  innerWallGeo.computeVertexNormals();
  const innerWallMesh = new THREE.Mesh(innerWallGeo, mirrorGold);
  innerWallMesh.castShadow = true;
  badge.add(innerWallMesh);

  // 5. Outer & Inner Chamfer Accent Rings
  const outerRimGeo = new THREE.TorusGeometry(1.62, 0.038, 18, 96);
  const outerRimMesh = new THREE.Mesh(outerRimGeo, mirrorGold);
  outerRimMesh.position.z = zOuterF;
  badge.add(outerRimMesh);

  const innerRimGeo = new THREE.TorusGeometry(0.44, 0.024, 18, 72);
  const innerRimMesh = new THREE.Mesh(innerRimGeo, mirrorGold);
  innerRimMesh.position.z = zInnerF;
  badge.add(innerRimMesh);

  // 6. Recessed Guide Tracks under each ring (Convex arch conform)
  const track1Geo = new THREE.TorusGeometry(1.24, 0.020, 12, 80);
  const track1Mesh = new THREE.Mesh(track1Geo, darkChannelMat);
  track1Mesh.position.z = 0.06;
  badge.add(track1Mesh);

  const track2Geo = new THREE.TorusGeometry(0.94, 0.020, 12, 80);
  const track2Mesh = new THREE.Mesh(track2Geo, darkChannelMat);
  track2Mesh.position.z = 0.10;
  badge.add(track2Mesh);

  const track3Geo = new THREE.TorusGeometry(0.64, 0.020, 12, 80);
  const track3Mesh = new THREE.Mesh(track3Geo, darkChannelMat);
  track3Mesh.position.z = 0.13;
  badge.add(track3Mesh);

  // 7. Floating Vitreous Enamel Activity Rings
  const ring1Geo = new THREE.TorusGeometry(1.24, 0.082, 28, 96);
  const ring1Mesh = new THREE.Mesh(ring1Geo, coralMat);
  ring1Mesh.position.z = 0.08;
  ring1Mesh.castShadow = true;
  badge.add(ring1Mesh);

  const ring2Geo = new THREE.TorusGeometry(0.94, 0.076, 28, 96);
  const ring2Mesh = new THREE.Mesh(ring2Geo, voltMat);
  ring2Mesh.position.z = 0.12;
  ring2Mesh.castShadow = true;
  badge.add(ring2Mesh);

  const ring3Geo = new THREE.TorusGeometry(0.64, 0.070, 28, 96);
  const ring3Mesh = new THREE.Mesh(ring3Geo, cyanMat);
  ring3Mesh.position.z = 0.15;
  ring3Mesh.castShadow = true;
  badge.add(ring3Mesh);

  // 8. Sculptural 24K Gold "100" Numeral Ribbon Loops
  const knotGroup = new THREE.Group();
  knotGroup.position.z = 0.18;

  const oneGeo = new THREE.CylinderGeometry(0.048, 0.048, 0.68, 24);
  const oneMesh = new THREE.Mesh(oneGeo, mirrorGold);
  oneMesh.position.set(-0.48, 0, 0);
  oneMesh.castShadow = true;
  knotGroup.add(oneMesh);

  const oneSerifGeo = new THREE.CylinderGeometry(0.042, 0.042, 0.22, 18);
  const oneSerif = new THREE.Mesh(oneSerifGeo, mirrorGold);
  oneSerif.rotation.z = 0.65;
  oneSerif.position.set(-0.55, 0.24, 0);
  knotGroup.add(oneSerif);

  const zero1Geo = new THREE.TorusGeometry(0.22, 0.044, 24, 64);
  const zero1Mesh = new THREE.Mesh(zero1Geo, mirrorGold);
  zero1Mesh.position.set(-0.08, 0, 0);
  zero1Mesh.castShadow = true;
  knotGroup.add(zero1Mesh);

  const zero2Geo = new THREE.TorusGeometry(0.22, 0.044, 24, 64);
  const zero2Mesh = new THREE.Mesh(zero2Geo, mirrorGold);
  zero2Mesh.position.set(0.34, 0, 0);
  zero2Mesh.castShadow = true;
  knotGroup.add(zero2Mesh);

  badge.add(knotGroup);

  badge.setExplodedView = (f: number) => {
    ring1Mesh.position.z = 0.08 + f * 0.35;
    ring2Mesh.position.z = 0.12 + f * 0.55;
    ring3Mesh.position.z = 0.15 + f * 0.75;
    knotGroup.position.z = 0.18 + f * 0.95;
    backMesh.position.z = -f * 0.5;
  };

  return badge;
}

/**
 * PROTOTYPE 3: Apple "September Learning Sprint" (Challenge Hexagon)
 * 100% Watertight Hexagon Chassis
 */
export function buildAppleChallengeHexBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'SEPTEMBER 17, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const badge = new THREE.Group() as AppleBadgeMeshGroup;

  const mirrorGold = materials.getMirrorGoldBezel(isLocked);
  const amberLacquer = materials.getColorLacquer(0xff9f0a, isLocked); // Golden Sun
  const azureLacquer = materials.getColorLacquer(0x0a84ff, isLocked); // Azure Lagoon
  const yellowLacquer = materials.getColorLacquer(0xffd60a, isLocked);// Terra Gold
  const backShellMat = materials.getAppleBackShell(earnedDate, 'SEPTEMBER SPRINT', isLocked);

  const thickness = 0.075;

  const pts: [number, number][] = [];
  const numSteps = 72;
  const rHex = 1.48;

  for (let i = 0; i < 6; i++) {
    const a1 = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const a2 = ((i + 1) / 6) * Math.PI * 2 + Math.PI / 6;
    const x1 = Math.cos(a1) * rHex;
    const y1 = Math.sin(a1) * rHex;
    const x2 = Math.cos(a2) * rHex;
    const y2 = Math.sin(a2) * rHex;

    for (let s = 0; s < numSteps / 6; s++) {
      const t = s / (numSteps / 6);
      pts.push([x1 + (x2 - x1) * t, y1 + (y2 - y1) * t]);
    }
  }

  const len = pts.length;

  // 1. Watertight Outer Rim Ribbon connecting front to back
  const rimPos: number[] = [];
  const rimIdx: number[] = [];
  for (let i = 0; i < len; i++) {
    const x = pts[i][0];
    const y = pts[i][1];
    const zFront = getHexSurfaceZ(x, y, false, thickness);
    const zBack = getHexSurfaceZ(x, y, true, thickness);

    rimPos.push(x, y, zFront);
    rimPos.push(x, y, zBack);
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
  const rimMesh = new THREE.Mesh(rimGeo, mirrorGold);
  rimMesh.castShadow = true;
  rimMesh.receiveShadow = true;
  badge.add(rimMesh);

  // 2. Base Dished Radial Front Plate (Full coverage)
  const hexPos: number[] = [];
  const hexUv: number[] = [];
  const hexIdx: number[] = [];
  const rings = 20;

  hexPos.push(0, 0, getHexSurfaceZ(0, 0, false, thickness));
  hexUv.push(0.5, 0.5);

  for (let rg = 1; rg <= rings; rg++) {
    const frac = rg / rings;
    for (let i = 0; i < len; i++) {
      const x = pts[i][0] * frac;
      const y = pts[i][1] * frac;
      const z = getHexSurfaceZ(x, y, false, thickness);
      hexPos.push(x, y, z);
      hexUv.push((x / rHex) * 0.5 + 0.5, (y / rHex) * 0.5 + 0.5);
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
  const baseMesh = new THREE.Mesh(baseGeo, mirrorGold);
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  badge.add(baseMesh);

  // 3. Multi-Segment Landscape Enamel Plates
  const makeHexBand = (yMin: number, yMax: number, mat: THREE.Material, zOffset: number) => {
    const bandPos: number[] = [];
    const bandIdx: number[] = [];
    const nu = 36;
    const nv = 12;

    for (let j = 0; j <= nv; j++) {
      const v = j / nv;
      const y = yMin + v * (yMax - yMin);
      const maxW = (1.42 - Math.abs(y) * 0.57735) * 1.68;
      const halfW = Math.max(0.1, Math.min(1.22, maxW * 0.5));

      for (let i = 0; i <= nu; i++) {
        const u = i / nu;
        const x = -halfW + u * (halfW * 2);
        const z = getHexSurfaceZ(x, y, false, thickness) + zOffset;
        bandPos.push(x, y, z);
      }
    }

    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        const a = j * (nu + 1) + i;
        const b = a + 1;
        const c = (j + 1) * (nu + 1) + i + 1;
        const d = (j + 1) * (nu + 1) + i;
        bandIdx.push(a, b, c);
        bandIdx.push(a, c, d);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(bandPos, 3));
    geo.setIndex(bandIdx);
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    return m;
  };

  const topMesh = makeHexBand(0.36, 1.35, amberLacquer, 0.008);
  badge.add(topMesh);

  const midMesh = makeHexBand(-0.36, 0.36, azureLacquer, 0.008);
  badge.add(midMesh);

  const botMesh = makeHexBand(-1.35, -0.36, yellowLacquer, 0.008);
  badge.add(botMesh);

  // 4. Continuous Sculptural 3D Woven Ribbon
  const curvePts: THREE.Vector3[] = [];
  const n = 72;
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2;
    const x = Math.sin(t) * 0.88;
    const y = Math.cos(t * 2) * 0.38 - 0.18;
    const dishZ = getHexSurfaceZ(x, y, false, thickness);
    const weave = Math.sin(t * 2) * 0.13 + 0.05;
    curvePts.push(new THREE.Vector3(x, y, dishZ + weave));
  }
  const ribbonCurve = new THREE.CatmullRomCurve3(curvePts);
  const ribbonGeo = new THREE.TubeGeometry(ribbonCurve, 80, 0.052, 18, true);
  const ribbonMesh = new THREE.Mesh(ribbonGeo, mirrorGold);
  ribbonMesh.castShadow = true;
  badge.add(ribbonMesh);

  // 5. Curved Convex Unibody Reverse Shell (Full coverage)
  const backPos: number[] = [];
  const backUv: number[] = [];
  const backIdx: number[] = [];
  backPos.push(0, 0, getHexSurfaceZ(0, 0, true, thickness));
  backUv.push(0.5, 0.5);

  for (let rg = 1; rg <= rings; rg++) {
    const frac = rg / rings;
    for (let i = 0; i < len; i++) {
      const x = pts[i][0] * frac;
      const y = pts[i][1] * frac;
      const z = getHexSurfaceZ(x, y, true, thickness);
      backPos.push(x, y, z);
      backUv.push((-(x / rHex) * 0.5 + 0.5), (y / rHex) * 0.5 + 0.5);
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
  const backMesh = new THREE.Mesh(backGeo, backShellMat);
  badge.add(backMesh);

  badge.setExplodedView = (f: number) => {
    topMesh.position.z = 0.008 + f * 0.45;
    midMesh.position.z = 0.008 + f * 0.55;
    botMesh.position.z = 0.008 + f * 0.65;
    ribbonMesh.position.z = f * 0.85;
    backMesh.position.z = -f * 0.5;
  };

  return badge;
}

/**
 * PROTOTYPE 4: Apple "Longest Study Streak" (Fluid Teardrop / Solar Flame Medal)
 * 100% Watertight Teardrop Chassis
 */
export function buildAppleTeardropStreakBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'SEPTEMBER 24, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const badge = new THREE.Group() as AppleBadgeMeshGroup;

  const mirrorGold = materials.getMirrorGoldBezel(isLocked);
  const flameRed = materials.getColorLacquer(0xff453a, isLocked);
  const flameAmber = materials.getColorLacquer(0xff9f0a, isLocked);
  const backShellMat = materials.getAppleBackShell(earnedDate, 'LONGEST STUDY STREAK', isLocked);

  const thickness = 0.075;

  const controlPts = [
    new THREE.Vector2(0, 1.82),
    new THREE.Vector2(0.55, 1.05),
    new THREE.Vector2(1.18, -0.05),
    new THREE.Vector2(1.02, -0.92),
    new THREE.Vector2(0.55, -1.45),
    new THREE.Vector2(0, -1.62),
    new THREE.Vector2(-0.55, -1.45),
    new THREE.Vector2(-1.02, -0.92),
    new THREE.Vector2(-1.18, -0.05),
    new THREE.Vector2(-0.55, 1.05),
  ];
  const dropCurve = new THREE.SplineCurve(controlPts);
  const perimeter = dropCurve.getPoints(96);
  const numPts = perimeter.length;

  const getDropZ = (x: number, y: number, isBack: boolean = false) => {
    const normY = y / 1.7;
    const bulbDist = Math.min(1.0, Math.sqrt(x * x + (y + 0.35) * (y + 0.35)) / 1.25);
    const bow = (1.0 - normY * normY) * 0.05;
    const convexDome = (1.0 - bulbDist * bulbDist) * 0.14;

    if (!isBack) return bow + convexDome;
    const backDome = (1.0 - bulbDist * bulbDist) * 0.03;
    return bow - thickness - backDome;
  };

  // 1. Watertight Outer Rim Ribbon connecting front to back
  const rimPos: number[] = [];
  const rimIdx: number[] = [];
  for (let i = 0; i < numPts; i++) {
    const pt = perimeter[i];
    const zF = getDropZ(pt.x, pt.y, false);
    const zB = getDropZ(pt.x, pt.y, true);
    rimPos.push(pt.x, pt.y, zF);
    rimPos.push(pt.x, pt.y, zB);
  }
  for (let i = 0; i < numPts; i++) {
    const next = (i + 1) % numPts;
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
  const rimMesh = new THREE.Mesh(rimGeo, mirrorGold);
  rimMesh.castShadow = true;
  rimMesh.receiveShadow = true;
  badge.add(rimMesh);

  // 2. Full Front Base Plate
  const basePos: number[] = [];
  const baseIdx: number[] = [];
  const rings = 20;
  basePos.push(0, -0.35, getDropZ(0, -0.35, false));
  for (let r = 1; r <= rings; r++) {
    const frac = r / rings;
    for (let i = 0; i < numPts; i++) {
      const pt = perimeter[i];
      const x = pt.x * frac;
      const y = -0.35 + (pt.y - -0.35) * frac;
      basePos.push(x, y, getDropZ(x, y, false));
    }
  }
  for (let i = 0; i < numPts; i++) {
    const next = (i + 1) % numPts;
    baseIdx.push(0, 1 + i, 1 + next);
  }
  for (let r = 1; r < rings; r++) {
    const curStart = 1 + (r - 1) * numPts;
    const nextStart = 1 + r * numPts;
    for (let i = 0; i < numPts; i++) {
      const next = (i + 1) % numPts;
      const a = curStart + i;
      const b = curStart + next;
      const c = nextStart + next;
      const d = nextStart + i;
      baseIdx.push(a, b, c);
      baseIdx.push(a, c, d);
    }
  }
  const baseGeo = new THREE.BufferGeometry();
  baseGeo.setAttribute('position', new THREE.Float32BufferAttribute(basePos, 3));
  baseGeo.setIndex(baseIdx);
  baseGeo.computeVertexNormals();
  const baseMesh = new THREE.Mesh(baseGeo, mirrorGold);
  baseMesh.castShadow = true;
  badge.add(baseMesh);

  // 3. Radial Dished Enamel Face (Left Amber Flame, Right Crimson Flame)
  const makeFlameFacet = (mat: THREE.Material, isRight: boolean) => {
    const pos: number[] = [];
    const idx: number[] = [];

    pos.push(0, -0.35, getDropZ(0, -0.35, false) + 0.008);
    const halfCount = Math.floor(numPts / 2);
    const startIdx = isRight ? 0 : halfCount;

    for (let r = 1; r <= rings; r++) {
      const frac = r / rings;
      for (let s = 0; s <= halfCount; s++) {
        const pIdx = (startIdx + s) % numPts;
        const pt = perimeter[pIdx];
        const x = pt.x * frac * 0.985;
        const y = -0.35 + (pt.y - -0.35) * frac * 0.985;
        const z = getDropZ(x, y, false) + 0.008;
        pos.push(x, y, z);
      }
    }

    for (let s = 0; s < halfCount; s++) {
      idx.push(0, 1 + s, 1 + s + 1);
    }
    for (let r = 1; r < rings; r++) {
      const curStart = 1 + (r - 1) * (halfCount + 1);
      const nextStart = 1 + r * (halfCount + 1);
      for (let s = 0; s < halfCount; s++) {
        const a = curStart + s;
        const b = curStart + s + 1;
        const c = nextStart + s + 1;
        const d = nextStart + s;
        idx.push(a, b, c);
        idx.push(a, c, d);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    return m;
  };

  const leftFlame = makeFlameFacet(flameAmber, false);
  badge.add(leftFlame);

  const rightFlame = makeFlameFacet(flameRed, true);
  badge.add(rightFlame);

  // 4. Sculptural 24K Gold Spine
  const spinePts: THREE.Vector3[] = [];
  const sSteps = 32;
  for (let i = 0; i <= sSteps; i++) {
    const t = i / sSteps;
    const y = -1.45 + t * (1.80 - -1.45);
    const x = Math.sin(t * Math.PI) * 0.08;
    const z = getDropZ(x, y, false) + 0.024;
    spinePts.push(new THREE.Vector3(x, y, z));
  }
  const spineCurve = new THREE.CatmullRomCurve3(spinePts);
  const spineGeo = new THREE.TubeGeometry(spineCurve, 36, 0.022, 16, false);
  const spineMesh = new THREE.Mesh(spineGeo, mirrorGold);
  spineMesh.castShadow = true;
  badge.add(spineMesh);

  // 5. Teardrop Convex Reverse Shell (Full coverage)
  const backPos: number[] = [];
  const backUv: number[] = [];
  const backIdx: number[] = [];
  backPos.push(0, -0.35, getDropZ(0, -0.35, true));
  backUv.push(0.5, 0.42);

  for (let r = 1; r <= rings; r++) {
    const frac = r / rings;
    for (let i = 0; i < numPts; i++) {
      const pt = perimeter[i];
      const x = pt.x * frac;
      const y = -0.35 + (pt.y - -0.35) * frac;
      const z = getDropZ(x, y, true);
      backPos.push(x, y, z);
      backUv.push((-(x / 1.35) * 0.5 + 0.5), (y / 1.85) * 0.5 + 0.5);
    }
  }
  for (let i = 0; i < numPts; i++) {
    const next = (i + 1) % numPts;
    backIdx.push(0, 1 + next, 1 + i);
  }
  for (let r = 1; r < rings; r++) {
    const curStart = 1 + (r - 1) * numPts;
    const nextStart = 1 + r * numPts;
    for (let i = 0; i < numPts; i++) {
      const next = (i + 1) % numPts;
      const a = curStart + i;
      const b = curStart + next;
      const c = nextStart + next;
      const d = nextStart + i;
      backIdx.push(a, c, b);
      backIdx.push(a, d, c);
    }
  }
  const backGeo = new THREE.BufferGeometry();
  backGeo.setAttribute('position', new THREE.Float32BufferAttribute(backPos, 3));
  backGeo.setAttribute('uv', new THREE.Float32BufferAttribute(backUv, 2));
  backGeo.setIndex(backIdx);
  backGeo.computeVertexNormals();
  const backMesh = new THREE.Mesh(backGeo, backShellMat);
  badge.add(backMesh);

  badge.setExplodedView = (f: number) => {
    leftFlame.position.z = f * 0.55;
    rightFlame.position.z = f * 0.55;
    spineMesh.position.z = f * 0.85;
    backMesh.position.z = -f * 0.5;
  };

  return badge;
}

/**
 * PROTOTYPE 5: Apple "Seven-Day Deep Immersion" (Faceted Octagon / Radial Star)
 * 100% Watertight Octagon Chassis
 */
export function buildAppleOctagonMilestoneBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'SEPTEMBER 20, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const badge = new THREE.Group() as AppleBadgeMeshGroup;

  const mirrorSilver = materials.getMirrorSilverBezel(isLocked);
  const cobaltMat = materials.getColorLacquer(0x0a84ff, isLocked);
  const indigoMat = materials.getColorLacquer(0x5e5ce6, isLocked);
  const backShellMat = materials.getAppleBackShell(earnedDate, 'SEVEN-DAY MASTERY', isLocked);

  const thickness = 0.075;
  const radius = 1.55;

  const octPts: THREE.Vector2[] = [];
  const segments = 96;
  for (let s = 0; s < segments; s++) {
    const theta = (s / segments) * Math.PI * 2;
    const octSection = Math.PI / 4;
    const localTheta = Math.abs((theta % octSection) - octSection / 2);
    const r = (radius * Math.cos(octSection / 2)) / Math.cos(localTheta);
    octPts.push(new THREE.Vector2(r * Math.cos(theta), r * Math.sin(theta)));
  }

  const getOctZ = (x: number, y: number, isBack: boolean = false) => {
    const dist = Math.min(1.0, Math.sqrt(x * x + y * y) / radius);
    const convexDome = (1.0 - dist * dist) * 0.14;
    if (!isBack) return convexDome;
    const backDome = (1.0 - dist * dist) * 0.03;
    return -thickness - backDome;
  };

  // 1. Watertight Mirror-Polished Silver Octagon Rim Ribbon
  const rimPos: number[] = [];
  const rimIdx: number[] = [];
  for (let i = 0; i < segments; i++) {
    const pt = octPts[i];
    rimPos.push(pt.x, pt.y, getOctZ(pt.x, pt.y, false));
    rimPos.push(pt.x, pt.y, getOctZ(pt.x, pt.y, true));
  }
  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments;
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
  const rimMesh = new THREE.Mesh(rimGeo, mirrorSilver);
  rimMesh.castShadow = true;
  badge.add(rimMesh);

  // 2. Full Front Base Plate
  const basePos: number[] = [];
  const baseIdx: number[] = [];
  const rings = 16;
  basePos.push(0, 0, getOctZ(0, 0, false));
  for (let r = 1; r <= rings; r++) {
    const frac = r / rings;
    for (let i = 0; i < segments; i++) {
      const pt = octPts[i];
      basePos.push(pt.x * frac, pt.y * frac, getOctZ(pt.x * frac, pt.y * frac, false));
    }
  }
  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments;
    baseIdx.push(0, 1 + i, 1 + next);
  }
  for (let r = 1; r < rings; r++) {
    const curStart = 1 + (r - 1) * segments;
    const nextStart = 1 + r * segments;
    for (let i = 0; i < segments; i++) {
      const next = (i + 1) % segments;
      const a = curStart + i;
      const b = curStart + next;
      const c = nextStart + next;
      const d = nextStart + i;
      baseIdx.push(a, b, c);
      baseIdx.push(a, c, d);
    }
  }
  const baseGeo = new THREE.BufferGeometry();
  baseGeo.setAttribute('position', new THREE.Float32BufferAttribute(basePos, 3));
  baseGeo.setIndex(baseIdx);
  baseGeo.computeVertexNormals();
  const baseMesh = new THREE.Mesh(baseGeo, mirrorSilver);
  badge.add(baseMesh);

  // 3. Eight Alternating Radial Enamel Sectors
  const facetMeshes: THREE.Mesh[] = [];
  const ptsPerSector = segments / 8;

  for (let sec = 0; sec < 8; sec++) {
    const mat = sec % 2 === 0 ? cobaltMat : indigoMat;
    const pos: number[] = [];
    const idx: number[] = [];

    pos.push(0, 0, getOctZ(0, 0, false) + 0.008);

    for (let r = 1; r <= rings; r++) {
      const frac = r / rings;
      for (let s = 0; s <= ptsPerSector; s++) {
        const pIdx = (sec * ptsPerSector + s) % segments;
        const pt = octPts[pIdx];
        const x = pt.x * frac * 0.985;
        const y = pt.y * frac * 0.985;
        const z = getOctZ(x, y, false) + 0.008;
        pos.push(x, y, z);
      }
    }

    for (let s = 0; s < ptsPerSector; s++) {
      idx.push(0, 1 + s, 1 + s + 1);
    }
    for (let r = 1; r < rings; r++) {
      const curStart = 1 + (r - 1) * (ptsPerSector + 1);
      const nextStart = 1 + r * (ptsPerSector + 1);
      for (let s = 0; s < ptsPerSector; s++) {
        const a = curStart + s;
        const b = curStart + s + 1;
        const c = nextStart + s + 1;
        const d = nextStart + s;
        idx.push(a, b, c);
        idx.push(a, c, d);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    badge.add(m);
    facetMeshes.push(m);
  }

  // 4. Central Sculptural 8-Pointed Platinum Compass Star
  const starGroup = new THREE.Group();
  starGroup.position.z = 0.16;
  for (let i = 0; i < 8; i++) {
    const theta = (i / 8) * Math.PI * 2;
    const isMajor = i % 2 === 0;
    const len = isMajor ? 0.68 : 0.44;
    const starRayGeo = new THREE.ConeGeometry(0.06, len, 4);
    const starRayMesh = new THREE.Mesh(starRayGeo, mirrorSilver);
    starRayMesh.rotation.z = -theta + Math.PI / 2;
    starRayMesh.position.set(Math.cos(theta) * (len * 0.5), Math.sin(theta) * (len * 0.5), 0.02);
    starRayMesh.castShadow = true;
    starGroup.add(starRayMesh);
  }
  badge.add(starGroup);

  // 5. Reverse Octagonal Convex Shell (Full coverage)
  const backPos: number[] = [];
  const backUv: number[] = [];
  const backIdx: number[] = [];
  backPos.push(0, 0, getOctZ(0, 0, true));
  backUv.push(0.5, 0.5);

  for (let r = 1; r <= rings; r++) {
    const frac = r / rings;
    for (let i = 0; i < segments; i++) {
      const pt = octPts[i];
      const x = pt.x * frac;
      const y = pt.y * frac;
      const z = getOctZ(x, y, true);
      backPos.push(x, y, z);
      backUv.push((-(x / radius) * 0.5 + 0.5), (y / radius) * 0.5 + 0.5);
    }
  }
  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments;
    backIdx.push(0, 1 + next, 1 + i);
  }
  for (let r = 1; r < rings; r++) {
    const curStart = 1 + (r - 1) * segments;
    const nextStart = 1 + r * segments;
    for (let i = 0; i < segments; i++) {
      const next = (i + 1) % segments;
      const a = curStart + i;
      const b = curStart + next;
      const c = nextStart + next;
      const d = nextStart + i;
      backIdx.push(a, c, b);
      backIdx.push(a, d, c);
    }
  }
  const backGeo = new THREE.BufferGeometry();
  backGeo.setAttribute('position', new THREE.Float32BufferAttribute(backPos, 3));
  backGeo.setAttribute('uv', new THREE.Float32BufferAttribute(backUv, 2));
  backGeo.setIndex(backIdx);
  backGeo.computeVertexNormals();
  const backMesh = new THREE.Mesh(backGeo, backShellMat);
  badge.add(backMesh);

  badge.setExplodedView = (f: number) => {
    facetMeshes.forEach((m) => (m.position.z = f * 0.55));
    starGroup.position.z = 0.16 + f * 0.85;
    backMesh.position.z = -f * 0.5;
  };

  return badge;
}

/**
 * PROTOTYPE 6: Apple "365 Days Infinity Loop" (Dual-Well Squircle Pill & Möbius Ribbon)
 * 100% Watertight Squircle Chassis
 */
export function buildAppleInfinityMasteryBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'JANUARY 1, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const badge = new THREE.Group() as AppleBadgeMeshGroup;

  const mirrorGold = materials.getMirrorGoldBezel(isLocked);
  const emeraldMat = materials.getColorLacquer(0x30d158, isLocked); // Apple Emerald
  const cyanMat = materials.getColorLacquer(0x00f0ff, isLocked);    // Apple Cyan
  const backShellMat = materials.getAppleBackShell(earnedDate, '365 DAYS INFINITY', isLocked);

  const thickness = 0.075;

  const segments = 96;
  const pillPts: THREE.Vector2[] = [];
  for (let s = 0; s < segments; s++) {
    const theta = (s / segments) * Math.PI * 2;
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);
    const a = 1.55;
    const b = 0.98;
    const r = 1 / Math.pow(Math.pow(Math.abs(cosT) / a, 4) + Math.pow(Math.pow(Math.abs(sinT) / b, 4), 1), 0.25);
    pillPts.push(new THREE.Vector2(r * cosT, r * sinT));
  }

  const getPillZ = (x: number, y: number, isBack: boolean = false) => {
    const dLeft = Math.sqrt((x + 0.72) * (x + 0.72) + y * y);
    const dRight = Math.sqrt((x - 0.72) * (x - 0.72) + y * y);
    const minD = Math.min(dLeft, dRight) / 0.85;
    const convexPill = (1.0 - Math.min(1.0, minD * minD)) * 0.14;

    if (!isBack) return convexPill;
    const backDome = (1.0 - Math.min(1.0, minD * minD)) * 0.03;
    return -thickness - backDome;
  };

  // 1. Watertight Squircle Rim Ribbon connecting front to back
  const rimPos: number[] = [];
  const rimIdx: number[] = [];
  for (let i = 0; i < segments; i++) {
    const pt = pillPts[i];
    rimPos.push(pt.x, pt.y, getPillZ(pt.x, pt.y, false));
    rimPos.push(pt.x, pt.y, getPillZ(pt.x, pt.y, true));
  }
  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments;
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
  const rimMesh = new THREE.Mesh(rimGeo, mirrorGold);
  rimMesh.castShadow = true;
  badge.add(rimMesh);

  // 2. Full Front Base Plate
  const basePos: number[] = [];
  const baseIdx: number[] = [];
  const rings = 16;
  basePos.push(0, 0, getPillZ(0, 0, false));
  for (let r = 1; r <= rings; r++) {
    const frac = r / rings;
    for (let i = 0; i < segments; i++) {
      const pt = pillPts[i];
      basePos.push(pt.x * frac, pt.y * frac, getPillZ(pt.x * frac, pt.y * frac, false));
    }
  }
  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments;
    baseIdx.push(0, 1 + i, 1 + next);
  }
  for (let r = 1; r < rings; r++) {
    const curStart = 1 + (r - 1) * segments;
    const nextStart = 1 + r * segments;
    for (let i = 0; i < segments; i++) {
      const next = (i + 1) % segments;
      const a = curStart + i;
      const b = curStart + next;
      const c = nextStart + next;
      const d = nextStart + i;
      baseIdx.push(a, b, c);
      baseIdx.push(a, c, d);
    }
  }
  const baseGeo = new THREE.BufferGeometry();
  baseGeo.setAttribute('position', new THREE.Float32BufferAttribute(basePos, 3));
  baseGeo.setIndex(baseIdx);
  baseGeo.computeVertexNormals();
  const baseMesh = new THREE.Mesh(baseGeo, mirrorGold);
  badge.add(baseMesh);

  // 3. Left Emerald Well & Right Cyan Well Enamel Inlays
  const makeWellMesh = (xCenter: number, mat: THREE.Material) => {
    const pos: number[] = [];
    const idx: number[] = [];
    const wR = 0.76;

    pos.push(xCenter, 0, getPillZ(xCenter, 0, false) + 0.008);

    for (let r = 1; r <= 16; r++) {
      const frac = r / 16;
      for (let s = 0; s < 48; s++) {
        const theta = (s / 48) * Math.PI * 2;
        const x = xCenter + Math.cos(theta) * (wR * frac);
        const y = Math.sin(theta) * (wR * frac);
        const z = getPillZ(x, y, false) + 0.008;
        pos.push(x, y, z);
      }
    }

    for (let s = 0; s < 48; s++) {
      const next = (s + 1) % 48;
      idx.push(0, 1 + s, 1 + next);
    }
    for (let r = 1; r < 16; r++) {
      const cStart = 1 + (r - 1) * 48;
      const nStart = 1 + r * 48;
      for (let s = 0; s < 48; s++) {
        const next = (s + 1) % 48;
        const a = cStart + s;
        const b = cStart + next;
        const c = nStart + next;
        const d = nStart + s;
        idx.push(a, b, c);
        idx.push(a, c, d);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    return m;
  };

  const leftWell = makeWellMesh(-0.72, emeraldMat);
  badge.add(leftWell);

  const rightWell = makeWellMesh(0.72, cyanMat);
  badge.add(rightWell);

  // 4. Continuous Sculptural 3D Gold Möbius Infinity Ribbon
  const infCurvePts: THREE.Vector3[] = [];
  const numKnot = 80;
  for (let i = 0; i <= numKnot; i++) {
    const t = (i / numKnot) * Math.PI * 2;
    const denom = 1 + Math.sin(t) * Math.sin(t);
    const x = (1.18 * Math.cos(t)) / denom;
    const y = (0.75 * Math.sin(t) * Math.cos(t)) / denom;
    const zBase = getPillZ(x, y, false);
    const zWeave = Math.sin(t * 2) * 0.12 + 0.08;
    infCurvePts.push(new THREE.Vector3(x, y, zBase + zWeave));
  }
  const infCurve = new THREE.CatmullRomCurve3(infCurvePts);
  const infGeo = new THREE.TubeGeometry(infCurve, 88, 0.052, 18, true);
  const infMesh = new THREE.Mesh(infGeo, mirrorGold);
  infMesh.castShadow = true;
  badge.add(infMesh);

  // 5. Reverse Squircle Shell (Full coverage)
  const backPos: number[] = [];
  const backUv: number[] = [];
  const backIdx: number[] = [];
  backPos.push(0, 0, getPillZ(0, 0, true));
  backUv.push(0.5, 0.5);

  for (let r = 1; r <= 16; r++) {
    const frac = r / 16;
    for (let i = 0; i < segments; i++) {
      const pt = pillPts[i];
      const x = pt.x * frac;
      const y = pt.y * frac;
      const z = getPillZ(x, y, true);
      backPos.push(x, y, z);
      backUv.push((-(x / 1.6) * 0.5 + 0.5), (y / 1.05) * 0.5 + 0.5);
    }
  }
  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments;
    backIdx.push(0, 1 + next, 1 + i);
  }
  for (let r = 1; r < 16; r++) {
    const curStart = 1 + (r - 1) * segments;
    const nextStart = 1 + r * segments;
    for (let i = 0; i < segments; i++) {
      const next = (i + 1) % segments;
      const a = curStart + i;
      const b = curStart + next;
      const c = nextStart + next;
      const d = nextStart + i;
      backIdx.push(a, c, b);
      backIdx.push(a, d, c);
    }
  }
  const backGeo = new THREE.BufferGeometry();
  backGeo.setAttribute('position', new THREE.Float32BufferAttribute(backPos, 3));
  backGeo.setAttribute('uv', new THREE.Float32BufferAttribute(backUv, 2));
  backGeo.setIndex(backIdx);
  backGeo.computeVertexNormals();
  const backMesh = new THREE.Mesh(backGeo, backShellMat);
  badge.add(backMesh);

  badge.setExplodedView = (f: number) => {
    leftWell.position.z = f * 0.55;
    rightWell.position.z = f * 0.55;
    infMesh.position.z = f * 0.85;
    backMesh.position.z = -f * 0.5;
  };

  return badge;
}

/**
 * GENERIC PARAMETRIC WATERPROOF BADGE BUILDER
 * Generates watertight front dish, rim ribbon, and white ceramic laser backplate
 */
function buildGenericParametricBadge(
  materials: AppleAwardMaterials,
  earnedDate: string,
  badgeTitle: string,
  isLocked: boolean,
  bezelMat: THREE.Material,
  pts: THREE.Vector2[],
  getZ: (x: number, y: number, isBack: boolean) => number,
  scaleU: number = 1.5,
  scaleV: number = 1.5
): { badge: AppleBadgeMeshGroup; baseMesh: THREE.Mesh; backMesh: THREE.Mesh } {
  const badge = new THREE.Group() as AppleBadgeMeshGroup;
  const backShellMat = materials.getAppleBackShell(earnedDate, badgeTitle, isLocked);
  const segments = pts.length;
  const rings = 16;

  // 1. Watertight Rim Ribbon
  const rimPos: number[] = [];
  const rimIdx: number[] = [];
  for (let i = 0; i < segments; i++) {
    const pt = pts[i];
    rimPos.push(pt.x, pt.y, getZ(pt.x, pt.y, false));
    rimPos.push(pt.x, pt.y, getZ(pt.x, pt.y, true));
  }
  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments;
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
  badge.add(rimMesh);

  // 2. Front Dished Base Plate
  const basePos: number[] = [];
  const baseIdx: number[] = [];
  basePos.push(0, 0, getZ(0, 0, false));
  for (let r = 1; r <= rings; r++) {
    const frac = r / rings;
    for (let i = 0; i < segments; i++) {
      const pt = pts[i];
      basePos.push(pt.x * frac, pt.y * frac, getZ(pt.x * frac, pt.y * frac, false));
    }
  }
  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments;
    baseIdx.push(0, 1 + i, 1 + next);
  }
  for (let r = 1; r < rings; r++) {
    const curStart = 1 + (r - 1) * segments;
    const nextStart = 1 + r * segments;
    for (let i = 0; i < segments; i++) {
      const next = (i + 1) % segments;
      const a = curStart + i;
      const b = curStart + next;
      const c = nextStart + next;
      const d = nextStart + i;
      baseIdx.push(a, b, c);
      baseIdx.push(a, c, d);
    }
  }
  const baseGeo = new THREE.BufferGeometry();
  baseGeo.setAttribute('position', new THREE.Float32BufferAttribute(basePos, 3));
  baseGeo.setIndex(baseIdx);
  baseGeo.computeVertexNormals();
  const baseMesh = new THREE.Mesh(baseGeo, bezelMat);
  badge.add(baseMesh);

  // 3. Reverse Shell with White Ceramic Laser Texture
  const backPos: number[] = [];
  const backUv: number[] = [];
  const backIdx: number[] = [];
  backPos.push(0, 0, getZ(0, 0, true));
  backUv.push(0.5, 0.5);

  for (let r = 1; r <= rings; r++) {
    const frac = r / rings;
    for (let i = 0; i < segments; i++) {
      const pt = pts[i];
      const x = pt.x * frac;
      const y = pt.y * frac;
      const z = getZ(x, y, true);
      backPos.push(x, y, z);
      backUv.push(-(x / scaleU) * 0.5 + 0.5, (y / scaleV) * 0.5 + 0.5);
    }
  }
  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments;
    backIdx.push(0, 1 + next, 1 + i);
  }
  for (let r = 1; r < rings; r++) {
    const curStart = 1 + (r - 1) * segments;
    const nextStart = 1 + r * segments;
    for (let i = 0; i < segments; i++) {
      const next = (i + 1) % segments;
      const a = curStart + i;
      const b = curStart + next;
      const c = nextStart + next;
      const d = nextStart + i;
      backIdx.push(a, c, b);
      backIdx.push(a, d, c);
    }
  }
  const backGeo = new THREE.BufferGeometry();
  backGeo.setAttribute('position', new THREE.Float32BufferAttribute(backPos, 3));
  backGeo.setAttribute('uv', new THREE.Float32BufferAttribute(backUv, 2));
  backGeo.setIndex(backIdx);
  backGeo.computeVertexNormals();
  const backMesh = new THREE.Mesh(backGeo, backShellMat);
  badge.add(backMesh);

  return { badge, baseMesh, backMesh };
}

/**
 * 7. PROTOTYPE 7: Classical Olympic Medallion Coin (Circular Coin)
 */
export function buildAppleCircularCoinBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 10, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const mirrorGold = materials.getMirrorGoldBezel(isLocked);
  const royalBlue = materials.getColorLacquer(0x0a84ff, isLocked);

  const radius = 1.55;
  const segments = 96;
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i < segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    pts.push(new THREE.Vector2(Math.cos(theta) * radius, Math.sin(theta) * radius));
  }

  const getZ = (x: number, y: number, isBack: boolean) => {
    const r = Math.min(1.0, Math.sqrt(x * x + y * y) / radius);
    const convex = (1.0 - r * r) * 0.14;
    if (!isBack) return convex;
    return -(1 - r * r) * 0.03 - 0.075;
  };

  const { badge, backMesh } = buildGenericParametricBadge(
    materials, earnedDate, 'CLASSICAL COIN', isLocked, mirrorGold, pts, getZ, 1.55, 1.55
  );

  // Stepped Laurel Beaded Inner Ring
  const laurelTorus = new THREE.TorusGeometry(1.22, 0.038, 16, 80);
  const laurelMesh = new THREE.Mesh(laurelTorus, mirrorGold);
  laurelMesh.position.z = 0.065;
  badge.add(laurelMesh);

  // Deep Royal Blue Central Disc
  const discGeo = new THREE.CircleGeometry(1.20, 64);
  const discMesh = new THREE.Mesh(discGeo, royalBlue);
  discMesh.position.z = 0.08;
  badge.add(discMesh);

  // Embossed 3D Academic Crest Laurel Sprigs (Gold)
  const sprigGeo = new THREE.TorusGeometry(0.65, 0.032, 12, 48, Math.PI * 1.5);
  const sprigMesh = new THREE.Mesh(sprigGeo, mirrorGold);
  sprigMesh.rotation.z = Math.PI * 0.75;
  sprigMesh.position.z = 0.16;
  badge.add(sprigMesh);

  badge.setExplodedView = (f: number) => {
    discMesh.position.z = 0.08 + f * 0.45;
    sprigMesh.position.z = 0.16 + f * 0.75;
    backMesh.position.z = -f * 0.5;
  };

  return badge;
}

/**
 * 8. PROTOTYPE 8: Heritage Oxford / Ivy Crested Shield
 */
export function buildAppleShieldCrestedBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'NOVEMBER 1, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const mirrorGold = materials.getMirrorGoldBezel(isLocked);
  const crimsonMat = materials.getColorLacquer(0xfa114f, isLocked);
  const ivoryCeramic = materials.getOffWhiteEnamel(isLocked);

  const segments = 96;
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i < segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    // Crested shield with dip top: y = 1.35 + 0.28*|cos(t)|, scalloped ear
    const cosT = Math.cos(t);
    const sinT = Math.sin(t);
    let x = cosT * 1.25;
    let y = sinT * 1.65;
    if (sinT > 0.4) {
      y -= Math.abs(cosT) * 0.25; // Top central heraldic dip
    }
    pts.push(new THREE.Vector2(x, y));
  }

  const getZ = (x: number, y: number, isBack: boolean) => {
    const dist = Math.min(1.0, Math.sqrt((x / 1.25) ** 2 + (y / 1.65) ** 2));
    const convex = (1.0 - dist * dist) * 0.14;
    return isBack ? -(1 - dist * dist) * 0.03 - 0.075 : convex;
  };

  const { badge, backMesh } = buildGenericParametricBadge(
    materials, earnedDate, 'ACADEMIC CREST', isLocked, mirrorGold, pts, getZ, 1.3, 1.7
  );

  // Chevron Inlay 1 (Crimson Top)
  const topCrestGeo = new THREE.PlaneGeometry(1.8, 1.2, 24, 16);
  const topCrestMesh = new THREE.Mesh(topCrestGeo, crimsonMat);
  topCrestMesh.position.set(0, 0.45, 0.08);
  badge.add(topCrestMesh);

  // Chevron Inlay 2 (Ivory Bottom)
  const botCrestGeo = new THREE.PlaneGeometry(1.8, 1.4, 24, 16);
  const botCrestMesh = new THREE.Mesh(botCrestGeo, ivoryCeramic);
  botCrestMesh.position.set(0, -0.65, 0.08);
  badge.add(botCrestMesh);

  // Sculptural Chevron Dividing Bar
  const barGeo = new THREE.BoxGeometry(1.8, 0.07, 0.04);
  const barMesh = new THREE.Mesh(barGeo, mirrorGold);
  barMesh.position.set(0, 0.05, 0.16);
  badge.add(barMesh);

  badge.setExplodedView = (f: number) => {
    topCrestMesh.position.z = 0.08 + f * 0.45;
    botCrestMesh.position.z = 0.08 + f * 0.45;
    barMesh.position.z = 0.16 + f * 0.75;
    backMesh.position.z = -f * 0.5;
  };

  return badge;
}

/**
 * 9. PROTOTYPE 9: Precision Brilliant Rhombus / Diamond
 */
export function buildAppleRhombusDiamondBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'DECEMBER 5, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const mirrorSilver = materials.getMirrorSilverBezel(isLocked);
  const cyanMat = materials.getColorLacquer(0x00f0ff, isLocked);
  const cobaltMat = materials.getColorLacquer(0x0a84ff, isLocked);

  const halfW = 1.25;
  const halfH = 1.75;
  const segments = 96;
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i < segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    // Diamond contour: |x/halfW| + |y/halfH| = 1
    const cosT = Math.cos(t);
    const sinT = Math.sin(t);
    const denom = Math.abs(cosT) / halfW + Math.abs(sinT) / halfH;
    pts.push(new THREE.Vector2(cosT / denom, sinT / denom));
  }

  const getZ = (x: number, y: number, isBack: boolean) => {
    const d = Math.min(1.0, Math.abs(x) / halfW + Math.abs(y) / halfH);
    const convex = (1.0 - d * d) * 0.14;
    return isBack ? -(1 - d * d) * 0.03 - 0.075 : convex;
  };

  const { badge, backMesh } = buildGenericParametricBadge(
    materials, earnedDate, 'BRILLIANT DIAMOND', isLocked, mirrorSilver, pts, getZ, 1.3, 1.8
  );

  // 4 Radiant Diamond Facets (Convex diamond pyramid crown)
  const quad1Geo = new THREE.BufferGeometry();
  quad1Geo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.14, halfW * 0.94, 0, 0.01, 0, halfH * 0.94, 0.01], 3));
  quad1Geo.computeVertexNormals();
  const q1Mesh = new THREE.Mesh(quad1Geo, cyanMat);
  badge.add(q1Mesh);

  const quad2Geo = new THREE.BufferGeometry();
  quad2Geo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.14, 0, halfH * 0.94, 0.01, -halfW * 0.94, 0, 0.01], 3));
  quad2Geo.computeVertexNormals();
  const q2Mesh = new THREE.Mesh(quad2Geo, cobaltMat);
  badge.add(q2Mesh);

  const quad3Geo = new THREE.BufferGeometry();
  quad3Geo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.14, -halfW * 0.94, 0, 0.01, 0, -halfH * 0.94, 0.01], 3));
  quad3Geo.computeVertexNormals();
  const q3Mesh = new THREE.Mesh(quad3Geo, cyanMat);
  badge.add(q3Mesh);

  const quad4Geo = new THREE.BufferGeometry();
  quad4Geo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.14, 0, -halfH * 0.94, 0.01, halfW * 0.94, 0, 0.01], 3));
  quad4Geo.computeVertexNormals();
  const q4Mesh = new THREE.Mesh(quad4Geo, cobaltMat);
  badge.add(q4Mesh);

  // Central Platinum Diamond Crosshair Ribs
  const ribV = new THREE.Mesh(new THREE.BoxGeometry(0.04, halfH * 2 * 0.96, 0.03), mirrorSilver);
  ribV.position.z = 0.15;
  badge.add(ribV);

  const ribH = new THREE.Mesh(new THREE.BoxGeometry(halfW * 2 * 0.96, 0.04, 0.03), mirrorSilver);
  ribH.position.z = 0.15;
  badge.add(ribH);

  badge.setExplodedView = (f: number) => {
    q1Mesh.position.z = f * 0.5;
    q2Mesh.position.z = f * 0.5;
    q3Mesh.position.z = f * 0.5;
    q4Mesh.position.z = f * 0.5;
    ribV.position.z = 0.15 + f * 0.75;
    ribH.position.z = 0.15 + f * 0.75;
    backMesh.position.z = -f * 0.5;
  };

  return badge;
}

/**
 * 10. PROTOTYPE 10: Citadel Pentagon Star Fortress
 */
export function buildApplePentagonStarBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 15, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const mirrorGold = materials.getMirrorGoldBezel(isLocked);
  const amberMat = materials.getColorLacquer(0xff9f0a, isLocked);
  const coralMat = materials.getColorLacquer(0xfa114f, isLocked);

  const radius = 1.55;
  const segments = 95;
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i < segments; i++) {
    const t = (i / segments) * Math.PI * 2 - Math.PI / 2;
    const sec = (Math.PI * 2) / 5;
    const local = Math.abs((t % sec) - sec / 2);
    const r = (radius * Math.cos(sec / 2)) / Math.cos(local);
    pts.push(new THREE.Vector2(r * Math.cos(t), r * Math.sin(t)));
  }

  const getZ = (x: number, y: number, isBack: boolean) => {
    const r = Math.min(1.0, Math.sqrt(x * x + y * y) / radius);
    const convex = (1.0 - r * r) * 0.14;
    return isBack ? -(1 - r * r) * 0.03 - 0.075 : convex;
  };

  const { badge, backMesh } = buildGenericParametricBadge(
    materials, earnedDate, 'PENTAGON CITADEL', isLocked, mirrorGold, pts, getZ, 1.55, 1.55
  );

  // 5 Star Bastion Radial Sectors
  const starSectors: THREE.Mesh[] = [];
  for (let s = 0; s < 5; s++) {
    const a1 = (s / 5) * Math.PI * 2 - Math.PI / 2;
    const a2 = ((s + 1) / 5) * Math.PI * 2 - Math.PI / 2;
    const secGeo = new THREE.BufferGeometry();
    secGeo.setAttribute('position', new THREE.Float32BufferAttribute([
      0, 0, 0.14,
      Math.cos(a1) * radius * 0.94, Math.sin(a1) * radius * 0.94, 0.01,
      Math.cos(a2) * radius * 0.94, Math.sin(a2) * radius * 0.94, 0.01,
    ], 3));
    secGeo.computeVertexNormals();
    const mesh = new THREE.Mesh(secGeo, s % 2 === 0 ? amberMat : coralMat);
    badge.add(mesh);
    starSectors.push(mesh);
  }

  // Central 3D Embossed Golden 5-Point Star Core
  const starCoreGeo = new THREE.ConeGeometry(0.48, 0.14, 5);
  const starCore = new THREE.Mesh(starCoreGeo, mirrorGold);
  starCore.rotation.x = Math.PI / 2;
  starCore.position.z = 0.16;
  badge.add(starCore);

  badge.setExplodedView = (f: number) => {
    starSectors.forEach((m) => (m.position.z = f * 0.45));
    starCore.position.z = 0.16 + f * 0.8;
    backMesh.position.z = -f * 0.5;
  };

  return badge;
}

/**
 * 11. PROTOTYPE 11: Apple Watch Squircle Pebble with Folio Book
 */
export function buildAppleRoundedSquircleBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'SEPTEMBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const mirrorSilver = materials.getMirrorSilverBezel(isLocked);
  const voltMat = materials.getColorLacquer(0xa6ff00, isLocked);
  const mirrorGold = materials.getMirrorGoldBezel(isLocked);

  const radius = 1.48;
  const segments = 96;
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i < segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    const cosT = Math.cos(t);
    const sinT = Math.sin(t);
    // Squircle formula
    const r = radius / Math.pow(Math.pow(Math.abs(cosT), 4) + Math.pow(Math.abs(sinT), 4), 0.25);
    pts.push(new THREE.Vector2(r * cosT, r * sinT));
  }

  const getZ = (x: number, y: number, isBack: boolean) => {
    const d = Math.min(1.0, Math.sqrt(x * x + y * y) / radius);
    const convex = (1.0 - d * d) * 0.14;
    return isBack ? -(1 - d * d) * 0.03 - 0.075 : convex;
  };

  const { badge, backMesh } = buildGenericParametricBadge(
    materials, earnedDate, 'KNOWLEDGE SQUIRCLE', isLocked, mirrorSilver, pts, getZ, 1.5, 1.5
  );

  // Inlay Face
  const faceGeo = new THREE.CircleGeometry(1.42, 64);
  const faceMesh = new THREE.Mesh(faceGeo, voltMat);
  faceMesh.position.z = 0.08;
  badge.add(faceMesh);

  // 3D Sculptural Open Folio Book in Center
  const bookGroup = new THREE.Group();
  bookGroup.position.z = 0.16;
  const leftPageGeo = new THREE.BoxGeometry(0.42, 0.58, 0.04);
  const leftPage = new THREE.Mesh(leftPageGeo, mirrorGold);
  leftPage.rotation.y = 0.35;
  leftPage.position.set(-0.24, 0, 0);
  bookGroup.add(leftPage);

  const rightPageGeo = new THREE.BoxGeometry(0.42, 0.58, 0.04);
  const rightPage = new THREE.Mesh(rightPageGeo, mirrorGold);
  rightPage.rotation.y = -0.35;
  rightPage.position.set(0.24, 0, 0);
  bookGroup.add(rightPage);

  badge.add(bookGroup);

  badge.setExplodedView = (f: number) => {
    faceMesh.position.z = 0.08 + f * 0.45;
    bookGroup.position.z = 0.16 + f * 0.8;
    backMesh.position.z = -f * 0.5;
  };

  return badge;
}

/**
 * 12. PROTOTYPE 12: Cathedral Quatrefoil / 4-Leaf Lucky Bloom
 */
export function buildAppleCloverQuatrefoilBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 22, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const mirrorGold = materials.getMirrorGoldBezel(isLocked);
  const emeraldMat = materials.getColorLacquer(0x30d158, isLocked);
  const cyanMat = materials.getColorLacquer(0x00f0ff, isLocked);

  const segments = 96;
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i < segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    // Quatrefoil formula: r = 1.30 + 0.30 * cos(4t)
    const r = 1.30 + 0.30 * Math.cos(4 * t);
    pts.push(new THREE.Vector2(r * Math.cos(t), r * Math.sin(t)));
  }

  const getZ = (x: number, y: number, isBack: boolean) => {
    const r = Math.min(1.0, Math.sqrt(x * x + y * y) / 1.6);
    const convex = (1.0 - r * r) * 0.14;
    return isBack ? -(1 - r * r) * 0.03 - 0.075 : convex;
  };

  const { badge, backMesh } = buildGenericParametricBadge(
    materials, earnedDate, 'QUATREFOIL BLOOM', isLocked, mirrorGold, pts, getZ, 1.6, 1.6
  );

  // 4 Petal Inlay Meshes
  const petals: THREE.Mesh[] = [];
  for (let p = 0; p < 4; p++) {
    const angle = (p / 4) * Math.PI * 2;
    const pGeo = new THREE.CircleGeometry(0.55, 32);
    const pMesh = new THREE.Mesh(pGeo, p % 2 === 0 ? emeraldMat : cyanMat);
    pMesh.position.set(Math.cos(angle) * 0.65, Math.sin(angle) * 0.65, 0.08);
    badge.add(pMesh);
    petals.push(pMesh);
  }

  // Central Gold Bloom Button
  const centerSphere = new THREE.Mesh(new THREE.SphereGeometry(0.24, 24, 24), mirrorGold);
  centerSphere.scale.set(1, 1, 0.4);
  centerSphere.position.z = 0.16;
  badge.add(centerSphere);

  badge.setExplodedView = (f: number) => {
    petals.forEach((m) => (m.position.z = 0.08 + f * 0.5));
    centerSphere.position.z = 0.16 + f * 0.85;
    backMesh.position.z = -f * 0.5;
  };

  return badge;
}

/**
 * 13. PROTOTYPE 13: Classical Roman Oval Cameo
 */
export function buildAppleOvalCameoBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'NOVEMBER 12, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const mirrorGold = materials.getMirrorGoldBezel(isLocked);
  const midnightBlue = materials.getColorLacquer(0x0a84ff, isLocked);

  const a = 1.20;
  const b = 1.68;
  const segments = 96;
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i < segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    pts.push(new THREE.Vector2(Math.cos(t) * a, Math.sin(t) * b));
  }

  const getZ = (x: number, y: number, isBack: boolean) => {
    const d = Math.min(1.0, Math.sqrt((x / a) ** 2 + (y / b) ** 2));
    const convex = (1.0 - d * d) * 0.14;
    return isBack ? -(1 - d * d) * 0.03 - 0.075 : convex;
  };

  const { badge, backMesh } = buildGenericParametricBadge(
    materials, earnedDate, 'ROMAN CAMEO', isLocked, mirrorGold, pts, getZ, 1.25, 1.7
  );

  // Deep Lapis Lazuli Oval Well
  const ovalWellGeo = new THREE.CircleGeometry(1.05, 48);
  const ovalWell = new THREE.Mesh(ovalWellGeo, midnightBlue);
  ovalWell.scale.set(1.0, 1.45, 1.0);
  ovalWell.position.z = 0.08;
  badge.add(ovalWell);

  // Concentric Beveled Oval Inner Ring
  const innerRing = new THREE.TorusGeometry(0.85, 0.035, 16, 64);
  const innerRingMesh = new THREE.Mesh(innerRing, mirrorGold);
  innerRingMesh.scale.set(1.0, 1.42, 1.0);
  innerRingMesh.position.z = 0.15;
  badge.add(innerRingMesh);

  badge.setExplodedView = (f: number) => {
    ovalWell.position.z = 0.08 + f * 0.45;
    innerRingMesh.position.z = 0.15 + f * 0.75;
    backMesh.position.z = -f * 0.5;
  };

  return badge;
}

/**
 * 14. PROTOTYPE 14: Delta Prism Triad (Equilateral Spaced Repetition Triangle)
 */
export function buildAppleTrianglePrismBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 30, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const mirrorSilver = materials.getMirrorSilverBezel(isLocked);
  const crimsonMat = materials.getColorLacquer(0xfa114f, isLocked);
  const voltMat = materials.getColorLacquer(0xa6ff00, isLocked);
  const cyanMat = materials.getColorLacquer(0x00f0ff, isLocked);

  const radius = 1.68;
  const segments = 96;
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i < segments; i++) {
    const t = (i / segments) * Math.PI * 2 + Math.PI / 2;
    const sec = (Math.PI * 2) / 3;
    const local = Math.abs((t % sec) - sec / 2);
    const r = (radius * Math.cos(sec / 2)) / Math.cos(local);
    pts.push(new THREE.Vector2(r * Math.cos(t), r * Math.sin(t)));
  }

  const getZ = (x: number, y: number, isBack: boolean) => {
    const d = Math.min(1.0, Math.sqrt(x * x + y * y) / radius);
    const convex = (1.0 - d * d) * 0.14;
    return isBack ? -(1 - d * d) * 0.03 - 0.075 : convex;
  };

  const { badge, backMesh } = buildGenericParametricBadge(
    materials, earnedDate, 'DELTA PRISM', isLocked, mirrorSilver, pts, getZ, 1.7, 1.7
  );

  // 3 Triangular Sectors
  const mats = [crimsonMat, voltMat, cyanMat];
  const triSectors: THREE.Mesh[] = [];
  for (let s = 0; s < 3; s++) {
    const a1 = (s / 3) * Math.PI * 2 + Math.PI / 2;
    const a2 = ((s + 1) / 3) * Math.PI * 2 + Math.PI / 2;
    const triGeo = new THREE.BufferGeometry();
    triGeo.setAttribute('position', new THREE.Float32BufferAttribute([
      0, 0, 0.14,
      Math.cos(a1) * radius * 0.94, Math.sin(a1) * radius * 0.94, 0.01,
      Math.cos(a2) * radius * 0.94, Math.sin(a2) * radius * 0.94, 0.01,
    ], 3));
    triGeo.computeVertexNormals();
    const mesh = new THREE.Mesh(triGeo, mats[s]);
    badge.add(mesh);
    triSectors.push(mesh);
  }

  // Floating Delta Inner Ring
  const deltaInnerPts = [
    new THREE.Vector3(0, 0.85, 0.16),
    new THREE.Vector3(0.74, -0.42, 0.16),
    new THREE.Vector3(-0.74, -0.42, 0.16),
    new THREE.Vector3(0, 0.85, 0.16),
  ];
  const deltaCurve = new THREE.CatmullRomCurve3(deltaInnerPts);
  const deltaMesh = new THREE.Mesh(new THREE.TubeGeometry(deltaCurve, 32, 0.042, 12, true), mirrorSilver);
  badge.add(deltaMesh);

  badge.setExplodedView = (f: number) => {
    triSectors.forEach((m) => (m.position.z = f * 0.5));
    deltaMesh.position.z = 0.16 + f * 0.85;
    backMesh.position.z = -f * 0.5;
  };

  return badge;
}

/**
 * 15. PROTOTYPE 15: Decimal Sunburst Decagon Wheel
 */
export function buildAppleDecagonWheelBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'DECEMBER 1, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const mirrorGold = materials.getMirrorGoldBezel(isLocked);
  const amberMat = materials.getColorLacquer(0xff9f0a, isLocked);
  const yellowMat = materials.getColorLacquer(0xffd60a, isLocked);

  const radius = 1.55;
  const segments = 100;
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i < segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    const sec = (Math.PI * 2) / 10;
    const local = Math.abs((t % sec) - sec / 2);
    const r = (radius * Math.cos(sec / 2)) / Math.cos(local);
    pts.push(new THREE.Vector2(r * Math.cos(t), r * Math.sin(t)));
  }

  const getZ = (x: number, y: number, isBack: boolean) => {
    const d = Math.min(1.0, Math.sqrt(x * x + y * y) / radius);
    const convex = (1.0 - d * d) * 0.14;
    return isBack ? -(1 - d * d) * 0.03 - 0.075 : convex;
  };

  const { badge, backMesh } = buildGenericParametricBadge(
    materials, earnedDate, 'DECAGON WHEEL', isLocked, mirrorGold, pts, getZ, 1.55, 1.55
  );

  // 10 Sunburst Decimal Segments
  const wheelSectors: THREE.Mesh[] = [];
  for (let s = 0; s < 10; s++) {
    const a1 = (s / 10) * Math.PI * 2;
    const a2 = ((s + 1) / 10) * Math.PI * 2;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute([
      0, 0, 0.14,
      Math.cos(a1) * radius * 0.94, Math.sin(a1) * radius * 0.94, 0.01,
      Math.cos(a2) * radius * 0.94, Math.sin(a2) * radius * 0.94, 0.01,
    ], 3));
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, s % 2 === 0 ? amberMat : yellowMat);
    badge.add(mesh);
    wheelSectors.push(mesh);
  }

  // Central Sunburst Core Ring
  const coreMesh = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.05, 16, 48), mirrorGold);
  coreMesh.position.z = 0.16;
  badge.add(coreMesh);

  badge.setExplodedView = (f: number) => {
    wheelSectors.forEach((m) => (m.position.z = f * 0.5));
    coreMesh.position.z = 0.16 + f * 0.8;
    backMesh.position.z = -f * 0.5;
  };

  return badge;
}

/**
 * 16. PROTOTYPE 16: Roman Keystone Portal Arch
 */
export function buildAppleShieldArchBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'NOVEMBER 20, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const mirrorGold = materials.getMirrorGoldBezel(isLocked);
  const cobaltMat = materials.getColorLacquer(0x0a84ff, isLocked);
  const ivoryCeramic = materials.getOffWhiteEnamel(isLocked);

  const segments = 96;
  const pts: THREE.Vector2[] = [];
  const archW = 1.25;
  const archH = 1.75;
  for (let i = 0; i < segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    const cosT = Math.cos(t);
    const sinT = Math.sin(t);
    let x = cosT * archW;
    let y = sinT * archH;
    if (sinT < -0.2) {
      y = -archH * 0.85; // Flat arch base
    }
    pts.push(new THREE.Vector2(x, y));
  }

  const getZ = (x: number, y: number, isBack: boolean) => {
    const d = Math.min(1.0, Math.sqrt((x / archW) ** 2 + (y / archH) ** 2));
    const convex = (1.0 - d * d) * 0.14;
    return isBack ? -(1 - d * d) * 0.03 - 0.075 : convex;
  };

  const { badge, backMesh } = buildGenericParametricBadge(
    materials, earnedDate, 'KEYSTONE ARCH', isLocked, mirrorGold, pts, getZ, 1.3, 1.8
  );

  // Left & Right Pillar Inlays
  const leftPillar = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 1.6), cobaltMat);
  leftPillar.position.set(-0.55, -0.15, 0.08);
  badge.add(leftPillar);

  const rightPillar = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 1.6), ivoryCeramic);
  rightPillar.position.set(0.55, -0.15, 0.08);
  badge.add(rightPillar);

  // Top Keystone Wedge in Gold
  const keystoneGeo = new THREE.BoxGeometry(0.42, 0.42, 0.06);
  const keystone = new THREE.Mesh(keystoneGeo, mirrorGold);
  keystone.position.set(0, 1.48, 0.05);
  badge.add(keystone);

  badge.setExplodedView = (f: number) => {
    leftPillar.position.z = 0.08 + f * 0.45;
    rightPillar.position.z = 0.08 + f * 0.45;
    keystone.position.z = 0.05 + f * 0.8;
    backMesh.position.z = -f * 0.5;
  };

  return badge;
}

/**
 * 17. PROTOTYPE 17: Midnight Lunar Crescent & Night Owl Star
 */
export function buildAppleWaveCrescentBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'DECEMBER 18, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const mirrorSilver = materials.getMirrorSilverBezel(isLocked);
  const indigoMat = materials.getColorLacquer(0x5e5ce6, isLocked);
  const mirrorGold = materials.getMirrorGoldBezel(isLocked);

  const radius = 1.55;
  const segments = 96;
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i < segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    pts.push(new THREE.Vector2(Math.cos(t) * radius, Math.sin(t) * radius));
  }

  const getZ = (x: number, y: number, isBack: boolean) => {
    const d = Math.min(1.0, Math.sqrt(x * x + y * y) / radius);
    const convex = (1.0 - d * d) * 0.14;
    return isBack ? -(1 - d * d) * 0.03 - 0.075 : convex;
  };

  const { badge, backMesh } = buildGenericParametricBadge(
    materials, earnedDate, 'LUNAR CRESCENT', isLocked, mirrorSilver, pts, getZ, 1.55, 1.55
  );

  // Twilight Blue Pond
  const pondGeo = new THREE.CircleGeometry(1.44, 64);
  const pond = new THREE.Mesh(pondGeo, indigoMat);
  pond.position.z = 0.08;
  badge.add(pond);

  // Waxing Silver Crescent Moon Ribbon
  const crescentPts: THREE.Vector3[] = [];
  for (let i = 0; i <= 48; i++) {
    const t = (i / 48) * Math.PI - Math.PI / 2;
    crescentPts.push(new THREE.Vector3(Math.cos(t) * 1.15 - 0.25, Math.sin(t) * 1.15, 0.14));
  }
  const crescentCurve = new THREE.CatmullRomCurve3(crescentPts);
  const crescentMesh = new THREE.Mesh(new THREE.TubeGeometry(crescentCurve, 48, 0.08, 16, false), mirrorSilver);
  badge.add(crescentMesh);

  // Golden Solitary Polaris Star
  const starMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), mirrorGold);
  starMesh.position.set(0.48, 0.35, 0.16);
  badge.add(starMesh);

  badge.setExplodedView = (f: number) => {
    pond.position.z = 0.08 + f * 0.45;
    crescentMesh.position.z = 0.14 + f * 0.75;
    starMesh.position.z = 0.16 + f * 0.9;
    backMesh.position.z = -f * 0.5;
  };

  return badge;
}

/**
 * 18. PROTOTYPE 18: Dual-Venn Overlocking Rings
 */
export function buildAppleInterlockingRingsBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'NOVEMBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const mirrorGold = materials.getMirrorGoldBezel(isLocked);
  const mirrorSilver = materials.getMirrorSilverBezel(isLocked);
  const cyanMat = materials.getColorLacquer(0x00f0ff, isLocked);
  const coralMat = materials.getColorLacquer(0xfa114f, isLocked);

  const a = 1.72;
  const b = 1.18;
  const segments = 96;
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i < segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    pts.push(new THREE.Vector2(Math.cos(t) * a, Math.sin(t) * b));
  }

  const getZ = (x: number, y: number, isBack: boolean) => {
    const d = Math.min(1.0, Math.sqrt((x / a) ** 2 + (y / b) ** 2));
    const convex = (1.0 - d * d) * 0.14;
    return isBack ? -(1 - d * d) * 0.03 - 0.075 : convex;
  };

  const { badge, backMesh } = buildGenericParametricBadge(
    materials, earnedDate, 'DUAL-VENN RINGS', isLocked, mirrorGold, pts, getZ, 1.75, 1.2
  );

  // Left Ring (Gold Torus + Coral Inlay)
  const leftTorus = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.055, 18, 64), mirrorGold);
  leftTorus.position.set(-0.48, 0, 0.14);
  badge.add(leftTorus);

  const leftFill = new THREE.Mesh(new THREE.CircleGeometry(0.66, 32), coralMat);
  leftFill.position.set(-0.48, 0, 0.09);
  badge.add(leftFill);

  // Right Ring (Silver Torus + Cyan Inlay)
  const rightTorus = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.055, 18, 64), mirrorSilver);
  rightTorus.position.set(0.48, 0, 0.15);
  badge.add(rightTorus);

  const rightFill = new THREE.Mesh(new THREE.CircleGeometry(0.66, 32), cyanMat);
  rightFill.position.set(0.48, 0, 0.09);
  badge.add(rightFill);

  badge.setExplodedView = (f: number) => {
    leftFill.position.z = 0.09 + f * 0.45;
    rightFill.position.z = 0.09 + f * 0.45;
    leftTorus.position.z = 0.14 + f * 0.8;
    rightTorus.position.z = 0.15 + f * 0.8;
    backMesh.position.z = -f * 0.5;
  };

  return badge;
}

/**
 * 19. PROTOTYPE 19: Pomodoro Hourglass Nexus
 */
export function buildAppleHourglassNexusBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'DECEMBER 12, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const mirrorGold = materials.getMirrorGoldBezel(isLocked);
  const amberMat = materials.getColorLacquer(0xff9f0a, isLocked);
  const voltMat = materials.getColorLacquer(0xa6ff00, isLocked);

  const segments = 96;
  const pts: THREE.Vector2[] = [];
  const maxW = 1.35;
  const halfH = 1.75;
  for (let i = 0; i < segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    const y = Math.sin(t) * halfH;
    // Hourglass waist constriction
    const w = maxW * (0.42 + 0.58 * (y / halfH) ** 2);
    const x = Math.cos(t) > 0 ? w : -w;
    pts.push(new THREE.Vector2(x, y));
  }

  const getZ = (x: number, y: number, isBack: boolean) => {
    const d = Math.min(1.0, Math.sqrt((x / maxW) ** 2 + (y / halfH) ** 2));
    const convex = (1.0 - d * d) * 0.14;
    return isBack ? -(1 - d * d) * 0.03 - 0.075 : convex;
  };

  const { badge, backMesh } = buildGenericParametricBadge(
    materials, earnedDate, 'POMODORO HOURGLASS', isLocked, mirrorGold, pts, getZ, 1.4, 1.8
  );

  // Top Sand Chamber (Amber)
  const topSand = new THREE.Mesh(new THREE.CircleGeometry(0.82, 32), amberMat);
  topSand.position.set(0, 0.72, 0.08);
  badge.add(topSand);

  // Bottom Sand Chamber (Volt)
  const botSand = new THREE.Mesh(new THREE.CircleGeometry(0.82, 32), voltMat);
  botSand.position.set(0, -0.72, 0.08);
  badge.add(botSand);

  // Golden Waist Pinch Collar
  const waistCollar = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.14, 0.06), mirrorGold);
  waistCollar.position.set(0, 0, 0.16);
  badge.add(waistCollar);

  badge.setExplodedView = (f: number) => {
    topSand.position.z = 0.08 + f * 0.45;
    botSand.position.z = 0.08 + f * 0.45;
    waistCollar.position.z = 0.16 + f * 0.8;
    backMesh.position.z = -f * 0.5;
  };

  return badge;
}

/**
 * 20. PROTOTYPE 20: Helios 12-Ray Radiant Sunburst
 */
export function buildAppleSunburstRadiantBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'JANUARY 10, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const mirrorGold = materials.getMirrorGoldBezel(isLocked);
  const yellowMat = materials.getColorLacquer(0xffd60a, isLocked);
  const amberMat = materials.getColorLacquer(0xff9f0a, isLocked);

  const rOuter = 1.62;
  const rInner = 1.22;
  const segments = 96;
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i < segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    // 12 rays formula
    const r = rInner + (rOuter - rInner) * Math.pow(Math.abs(Math.cos(6 * t)), 1.5);
    pts.push(new THREE.Vector2(r * Math.cos(t), r * Math.sin(t)));
  }

  const getZ = (x: number, y: number, isBack: boolean) => {
    const d = Math.min(1.0, Math.sqrt(x * x + y * y) / rOuter);
    const convex = (1.0 - d * d) * 0.14;
    return isBack ? -(1 - d * d) * 0.03 - 0.075 : convex;
  };

  const { badge, backMesh } = buildGenericParametricBadge(
    materials, earnedDate, 'HELIOS SUNBURST', isLocked, mirrorGold, pts, getZ, 1.65, 1.65
  );

  // 12 Radiant Enamel Rays
  const sunRays: THREE.Mesh[] = [];
  for (let i = 0; i < 12; i++) {
    const a1 = (i / 12) * Math.PI * 2;
    const a2 = ((i + 1) / 12) * Math.PI * 2;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute([
      0, 0, 0.14,
      Math.cos(a1) * rOuter * 0.92, Math.sin(a1) * rOuter * 0.92, 0.01,
      Math.cos(a2) * rOuter * 0.92, Math.sin(a2) * rOuter * 0.92, 0.01,
    ], 3));
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, i % 2 === 0 ? yellowMat : amberMat);
    badge.add(mesh);
    sunRays.push(mesh);
  }

  // Central Sun Core Disc in Mirror Gold
  const sunCore = new THREE.Mesh(new THREE.SphereGeometry(0.55, 32, 32), mirrorGold);
  sunCore.scale.set(1, 1, 0.35);
  sunCore.position.z = 0.16;
  badge.add(sunCore);

  badge.setExplodedView = (f: number) => {
    sunRays.forEach((m) => (m.position.z = f * 0.5));
    sunCore.position.z = 0.16 + f * 0.85;
    backMesh.position.z = -f * 0.5;
  };

  return badge;
}

/**
 * 21. PROTOTYPE 21: Athena's Owl of Nocturnal Wisdom (Owl Badge)
 */
export function buildAppleOwlBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 24, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const mirrorGold = materials.getMirrorGoldBezel(isLocked);
  const spaceGray = materials.getSpaceGrayBezel(isLocked);
  const sapphireMat = materials.getColorLacquer(0x5e5ce6, isLocked); // Deep Indigo / Sapphire
  const amberMat = materials.getColorLacquer(0xffd60a, isLocked); // Radiant Luminous Amber
  const cyanMat = materials.getColorLacquer(0x00f0ff, isLocked); // Apple Cyan

  // Parametric Owl Silhouette with sculpted ear tufts, winged shoulders, and tapered body
  const segments = 96;
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i < segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    const sinT = Math.sin(t);
    const cosT = Math.cos(t);

    // Ear tufts peaks at ~55° and ~125°
    const angleFromEarL = Math.atan2(sinT - 0.72, cosT + 0.52);
    const distEarL = Math.hypot(cosT + 0.52, sinT - 0.72);
    const distEarR = Math.hypot(cosT - 0.52, sinT - 0.72);
    const earEffect = 0.35 * (Math.exp(-distEarL * 3.8) + Math.exp(-distEarR * 3.8));

    // Scalloped crown dip between ears
    let topDip = 0;
    if (sinT > 0.65 && Math.abs(cosT) < 0.3) {
      topDip = -0.22 * (1 - Math.abs(cosT) / 0.3);
    }

    const baseW = 1.34;
    const baseH = 1.76;
    let rX = baseW * (0.92 + 0.12 * Math.cos(2 * t));
    let rY = baseH;

    // Body taper towards talons
    if (sinT < -0.2) {
      rX *= 0.78 + 0.22 * ((sinT + 1) / 0.8);
    }

    const x = cosT * rX + (cosT > 0 ? earEffect * 0.4 : -earEffect * 0.4);
    const y = sinT * rY + earEffect * 0.65 + topDip;
    pts.push(new THREE.Vector2(x, y));
  }

  const getZ = (x: number, y: number, isBack: boolean) => {
    const d = Math.min(1.0, Math.sqrt((x / 1.35) ** 2 + (y / 1.76) ** 2));
    const convex = (1.0 - d * d) * 0.14;
    return isBack ? -(1 - d * d) * 0.03 - 0.075 : convex;
  };

  const { badge, backMesh } = buildGenericParametricBadge(
    materials, earnedDate, 'NIGHT OWL SCHOLAR', isLocked, mirrorGold, pts, getZ, 1.4, 1.8
  );

  // Midnight Enamel Face Fill
  const faceGeo = new THREE.PlaneGeometry(2.5, 3.2, 32, 32);
  const faceMesh = new THREE.Mesh(faceGeo, sapphireMat);
  faceMesh.position.set(0, 0, 0.08);
  badge.add(faceMesh);

  // Group for Owl's Dual Concentric Ocular Eyes (Apple Fitness Rings motif)
  const eyesGroup = new THREE.Group();
  eyesGroup.position.set(0, 0.42, 0.14);

  const leftEyeGroup = new THREE.Group();
  leftEyeGroup.position.set(-0.46, 0, 0);

  const rightEyeGroup = new THREE.Group();
  rightEyeGroup.position.set(0.46, 0, 0);

  // Outer Gold Bezel Eyering
  const outerTorusGeo = new THREE.TorusGeometry(0.38, 0.038, 16, 48);
  const leftOuterRing = new THREE.Mesh(outerTorusGeo, mirrorGold);
  const rightOuterRing = new THREE.Mesh(outerTorusGeo, mirrorGold);
  leftEyeGroup.add(leftOuterRing);
  rightEyeGroup.add(rightOuterRing);

  // Middle Luminous Amber Iris Disc
  const irisGeo = new THREE.CircleGeometry(0.36, 32);
  const leftIris = new THREE.Mesh(irisGeo, amberMat);
  const rightIris = new THREE.Mesh(irisGeo, amberMat);
  leftEyeGroup.add(leftIris);
  rightEyeGroup.add(rightIris);

  // Inner Space-Gray Obsidian Pupil with Cyan Halo
  const pupilGeo = new THREE.CircleGeometry(0.18, 32);
  const leftPupil = new THREE.Mesh(pupilGeo, spaceGray);
  const rightPupil = new THREE.Mesh(pupilGeo, spaceGray);
  leftPupil.position.z = 0.01;
  rightPupil.position.z = 0.01;
  leftEyeGroup.add(leftPupil);
  rightEyeGroup.add(rightPupil);

  // Brilliant Cyan Catchlight glints
  const glintGeo = new THREE.CircleGeometry(0.045, 16);
  const leftGlint = new THREE.Mesh(glintGeo, cyanMat);
  const rightGlint = new THREE.Mesh(glintGeo, cyanMat);
  leftGlint.position.set(-0.06, 0.06, 0.02);
  rightGlint.position.set(-0.06, 0.06, 0.02);
  leftEyeGroup.add(leftGlint);
  rightEyeGroup.add(rightGlint);

  eyesGroup.add(leftEyeGroup);
  eyesGroup.add(rightEyeGroup);
  badge.add(eyesGroup);

  // Golden Faceted Beak Prism
  const beakGeo = new THREE.ConeGeometry(0.14, 0.36, 3);
  beakGeo.rotateZ(Math.PI);
  const beakMesh = new THREE.Mesh(beakGeo, mirrorGold);
  beakMesh.position.set(0, 0.16, 0.18);
  beakMesh.scale.set(1.2, 1, 0.45);
  badge.add(beakMesh);

  // Breast Chevrons / Feather Armor Plates
  const chevronsGroup = new THREE.Group();
  chevronsGroup.position.set(0, -0.45, 0.12);
  const chevronCount = 3;
  const chevronMeshes: THREE.Mesh[] = [];

  for (let c = 0; c < chevronCount; c++) {
    const yPos = -c * 0.32;
    const widthScale = 1 - c * 0.16;
    const arcGeo = new THREE.TorusGeometry(0.45 * widthScale, 0.03, 12, 32, Math.PI * 0.75);
    arcGeo.rotateZ(Math.PI * 0.625);
    const chevronMesh = new THREE.Mesh(arcGeo, c % 2 === 0 ? mirrorGold : cyanMat);
    chevronMesh.position.set(0, yPos, 0);
    chevronsGroup.add(chevronMesh);
    chevronMeshes.push(chevronMesh);
  }
  badge.add(chevronsGroup);

  badge.setExplodedView = (f: number) => {
    faceMesh.position.z = 0.08 + f * 0.3;
    eyesGroup.position.z = 0.14 + f * 0.75;
    beakMesh.position.z = 0.18 + f * 0.95;
    chevronsGroup.position.z = 0.12 + f * 0.6;
    backMesh.position.z = -f * 0.5;
  };

  return badge;
}

/**
 * 22. PROTOTYPE 22: Octopus Polymath / Eight-Fold Mastery (Octopus Badge)
 */
export function buildAppleOctopusBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 26, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const mirrorGold = materials.getMirrorGoldBezel(isLocked);
  const coralMat = materials.getColorLacquer(0xff2d55, isLocked); // Radiant Coral Pink
  const cyanMat = materials.getColorLacquer(0x00f0ff, isLocked); // Electric Ocean Cyan
  const amberMat = materials.getColorLacquer(0xffd60a, isLocked); // Golden Luminous Amber

  // 8-Lobe Radial Harmonic Perimeter (Undulating cephalopod tentacles)
  const segments = 96;
  const pts: THREE.Vector2[] = [];
  const baseR = 1.34;
  const waveAmp = 0.32;
  for (let i = 0; i < segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    // 8 rhythmic lobes
    const r = baseR + waveAmp * Math.cos(8 * t);
    pts.push(new THREE.Vector2(r * Math.cos(t), r * Math.sin(t)));
  }

  const getZ = (x: number, y: number, isBack: boolean) => {
    const d = Math.min(1.0, Math.sqrt(x * x + y * y) / (baseR + waveAmp));
    const convex = (1.0 - d * d) * 0.14;
    return isBack ? -(1 - d * d) * 0.03 - 0.075 : convex;
  };

  const { badge, backMesh } = buildGenericParametricBadge(
    materials, earnedDate, 'OCTOPUS POLYMATH', isLocked, mirrorGold, pts, getZ, 1.65, 1.65
  );

  // Ocean Cyan Base Enamel Channel
  const oceanGeo = new THREE.CircleGeometry(1.58, 64);
  const oceanMesh = new THREE.Mesh(oceanGeo, cyanMat);
  oceanMesh.position.z = 0.08;
  badge.add(oceanMesh);

  // Central Cephalopod Mantle Dome (Sculpted in Coral Vitreous Lacquer)
  const mantleGroup = new THREE.Group();
  mantleGroup.position.set(0, 0.15, 0.14);

  const mantleGeo = new THREE.SphereGeometry(0.54, 32, 24);
  mantleGeo.scale(1, 1.15, 0.38);
  const mantleMesh = new THREE.Mesh(mantleGeo, coralMat);
  mantleGroup.add(mantleMesh);

  // Cephalopod Intelligent Eyes (Horizontal slit pupils)
  const eyeL = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.022, 12, 24), mirrorGold);
  eyeL.position.set(-0.25, 0.05, 0.16);
  mantleGroup.add(eyeL);

  const pupilL = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.025, 0.01), amberMat);
  pupilL.position.set(-0.25, 0.05, 0.16);
  mantleGroup.add(pupilL);

  const eyeR = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.022, 12, 24), mirrorGold);
  eyeR.position.set(0.25, 0.05, 0.16);
  mantleGroup.add(eyeR);

  const pupilR = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.025, 0.01), amberMat);
  pupilR.position.set(0.25, 0.05, 0.16);
  mantleGroup.add(pupilR);

  badge.add(mantleGroup);

  // 8 Curving Tentacles with Golden Suction Nodes
  const tentaclesGroup = new THREE.Group();
  tentaclesGroup.position.z = 0.12;
  const suctionNodes: THREE.Mesh[] = [];

  for (let k = 0; k < 8; k++) {
    const angle = (k / 8) * Math.PI * 2;
    // Curved tentacle arm
    const armGeo = new THREE.TorusGeometry(0.68, 0.045, 12, 32, Math.PI * 0.65);
    armGeo.rotateZ(angle);
    const armMesh = new THREE.Mesh(armGeo, coralMat);
    tentaclesGroup.add(armMesh);

    // 2 Suction-cup rings along each arm
    for (let s = 1; s <= 2; s++) {
      const dist = 0.85 + s * 0.35;
      const suctionAngle = angle + s * 0.12;
      const suctionMesh = new THREE.Mesh(
        new THREE.TorusGeometry(0.07, 0.02, 10, 20),
        mirrorGold
      );
      suctionMesh.position.set(
        Math.cos(suctionAngle) * dist,
        Math.sin(suctionAngle) * dist,
        0.02
      );
      tentaclesGroup.add(suctionMesh);
      suctionNodes.push(suctionMesh);
    }
  }
  badge.add(tentaclesGroup);

  // Central Knowledge Pearl Core (Unified multi-disciplinary nexus)
  const pearlGeo = new THREE.SphereGeometry(0.22, 28, 28);
  pearlGeo.scale(1, 1, 0.5);
  const pearlMesh = new THREE.Mesh(pearlGeo, amberMat);
  pearlMesh.position.set(0, -0.42, 0.16);
  badge.add(pearlMesh);

  const pearlRing = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.028, 16, 36), mirrorGold);
  pearlRing.position.set(0, -0.42, 0.16);
  badge.add(pearlRing);

  badge.setExplodedView = (f: number) => {
    oceanMesh.position.z = 0.08 + f * 0.25;
    tentaclesGroup.position.z = 0.12 + f * 0.55;
    mantleGroup.position.z = 0.14 + f * 0.85;
    pearlMesh.position.z = 0.16 + f * 1.05;
    pearlRing.position.z = 0.16 + f * 1.05;
    backMesh.position.z = -f * 0.5;
  };

  return badge;
}

/**
 * 23. PROTOTYPE 23: Deep Abyss Octopus (Subconscious Memory Vault)
 */
export function buildAbyssOctopusBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 26, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const spaceGray = materials.getSpaceGrayBezel(isLocked);
  const cyanMat = materials.getColorLacquer(0x00f0ff, isLocked); // Bioluminescent Trench Cyan
  const navyMat = materials.getColorLacquer(0x0a192f, isLocked); // Midnight Deep Trench
  const indigoMat = materials.getColorLacquer(0x5e5ce6, isLocked); // Deep Trench Indigo
  const backMat = materials.getAppleBackShell(earnedDate, 'DEEP ABYSS OCTOPUS', isLocked);

  const badge = new THREE.Group() as AppleBadgeMeshGroup;

  // Base Parabolic Trench Dish (Convex crowned outer coin)
  const baseGeo = createConvexCoinGeometry(1.65, 0.16, 0.08);
  const baseMesh = new THREE.Mesh(baseGeo, [spaceGray, navyMat, backMat]);
  baseMesh.rotation.x = Math.PI / 2;
  badge.add(baseMesh);

  // Outer Aerospace Bezel Rim with Micro-Chamfer
  const rimMesh = new THREE.Mesh(
    new THREE.TorusGeometry(1.65, 0.08, 16, 64),
    spaceGray
  );
  badge.add(rimMesh);

  // Cephalopod Mantle Dome (Abyssal Crest)
  const mantleGroup = new THREE.Group();
  const mantleGeo = new THREE.SphereGeometry(0.55, 32, 24);
  mantleGeo.scale(1.0, 1.35, 0.45);
  const mantleMesh = new THREE.Mesh(mantleGeo, indigoMat);
  mantleMesh.position.set(0, 0.35, 0.06);
  mantleGroup.add(mantleMesh);

  // Bioluminescent Ocular Sensors
  const eyeL = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 12, 24), cyanMat);
  eyeL.position.set(-0.28, 0.28, 0.15);
  const eyeR = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 12, 24), cyanMat);
  eyeR.position.set(0.28, 0.28, 0.15);
  mantleGroup.add(eyeL, eyeR);
  badge.add(mantleGroup);

  // 8 Spiraling Abyssal Tentacles with Bioluminescent Suction Nodes
  const tentacleGroup = new THREE.Group();
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const spiralArm = new THREE.Mesh(
      new THREE.TorusGeometry(0.72, 0.045, 12, 32, Math.PI * 0.75),
      cyanMat
    );
    spiralArm.rotation.z = angle + 0.2;
    tentacleGroup.add(spiralArm);

    // Glowing trench suckers
    for (let s = 1; s <= 3; s++) {
      const dist = 0.75 + s * 0.3;
      const sucker = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.05, 0.02, 12),
        spaceGray
      );
      sucker.position.set(Math.cos(angle + s * 0.15) * dist, Math.sin(angle + s * 0.15) * dist, 0.02);
      sucker.rotation.x = Math.PI / 2;
      tentacleGroup.add(sucker);
    }
  }
  badge.add(tentacleGroup);

  // Central Abyssal Core
  const coreGeo = new THREE.SphereGeometry(0.24, 24, 24);
  coreGeo.scale(1, 1, 0.4);
  const coreMesh = new THREE.Mesh(coreGeo, cyanMat);
  coreMesh.position.set(0, -0.35, 0.08);
  badge.add(coreMesh);

  badge.setExplodedView = (f: number) => {
    baseMesh.position.z = -f * 0.2;
    tentacleGroup.position.z = 0.02 + f * 0.6;
    mantleGroup.position.z = 0.06 + f * 0.9;
    coreMesh.position.z = 0.08 + f * 1.1;
  };

  return badge;
}

/**
 * 24. PROTOTYPE 24: Quantum Weaver Octopus (Cross-Discipline Synaptic Nexus)
 */
export function buildQuantumOctopusBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 27, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const mirrorGold = materials.getMirrorGoldBezel(isLocked);
  const voltMat = materials.getColorLacquer(0xa6ff00, isLocked); // Electric Volt Green
  const magentaMat = materials.getColorLacquer(0xff2d55, isLocked); // Quantum Magenta
  const amberMat = materials.getColorLacquer(0xffd60a, isLocked); // Luminous Amber
  const backMat = materials.getAppleBackShell(earnedDate, 'QUANTUM WEAVER OCTOPUS', isLocked);

  const badge = new THREE.Group() as AppleBadgeMeshGroup;

  // Interlocking 8-Lobe Golden Base Star (Convex crowned coin)
  const baseMesh = new THREE.Mesh(
    createConvexCoinGeometry(1.68, 0.16, 0.08),
    [mirrorGold, magentaMat, backMat]
  );
  baseMesh.rotation.x = Math.PI / 2;
  badge.add(baseMesh);

  // Outer 24K Gold Ring
  const ringMesh = new THREE.Mesh(
    new THREE.TorusGeometry(1.68, 0.08, 16, 64),
    mirrorGold
  );
  badge.add(ringMesh);

  // Interconnected Quantum Lattice Tentacles
  const latticeGroup = new THREE.Group();
  for (let k = 0; k < 8; k++) {
    const angle = (k / 8) * Math.PI * 2;
    // Outer volt arc
    const arcMesh = new THREE.Mesh(
      new THREE.TorusGeometry(0.8, 0.04, 12, 32, Math.PI * 0.5),
      voltMat
    );
    arcMesh.rotation.z = angle;
    latticeGroup.add(arcMesh);

    // Inner magenta diagonal nexus
    const beam = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.9, 0.03),
      mirrorGold
    );
    beam.position.set(Math.cos(angle) * 0.55, Math.sin(angle) * 0.55, 0.02);
    beam.rotation.z = angle + Math.PI / 4;
    latticeGroup.add(beam);
  }
  badge.add(latticeGroup);

  // Central Multifaceted Chronosphere Core
  const coreGroup = new THREE.Group();
  const sphereGeo = new THREE.IcosahedronGeometry(0.32, 1);
  sphereGeo.scale(1, 1, 0.5);
  const sphereMesh = new THREE.Mesh(sphereGeo, amberMat);
  sphereMesh.position.z = 0.08;
  coreGroup.add(sphereMesh);

  const sphereRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.36, 0.03, 16, 36),
    mirrorGold
  );
  sphereRing.position.z = 0.08;
  coreGroup.add(sphereRing);
  badge.add(coreGroup);

  badge.setExplodedView = (f: number) => {
    baseMesh.position.z = -f * 0.25;
    latticeGroup.position.z = 0.02 + f * 0.65;
    coreGroup.position.z = 0.08 + f * 1.15;
  };

  return badge;
}

/**
 * 25. PROTOTYPE 25: Flow State Jellyfish (Pure Pelagic Flow)
 */
export function buildFlowJellyfishBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 25, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const mirrorSilver = materials.getMirrorSilverBezel(isLocked);
  const azureMat = materials.getColorLacquer(0x70d7ff, isLocked); // Iridescent Pelagic Azure
  const lavenderMat = materials.getColorLacquer(0xe5b8f4, isLocked); // Bioluminescent Lavender
  const enamelMat = materials.getOffWhiteEnamel(isLocked);
  const backMat = materials.getAppleBackShell(earnedDate, 'FLOW STATE JELLYFISH', isLocked);

  const badge = new THREE.Group() as AppleBadgeMeshGroup;

  // Parabolic Bell Umbrella Canopy (Top Dome Half)
  const bellGroup = new THREE.Group();
  const bellGeo = new THREE.SphereGeometry(1.45, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.55);
  bellGeo.scale(1.05, 0.95, 0.4);
  const bellMesh = new THREE.Mesh(bellGeo, azureMat);
  bellMesh.position.set(0, 0.35, 0.02);
  bellGroup.add(bellMesh);

  // Scalloped Filleted Umbrella Rim
  const rimGeo = new THREE.TorusGeometry(1.4, 0.07, 16, 64, Math.PI * 1.05);
  rimGeo.rotateZ(Math.PI * 0.97);
  const rimMesh = new THREE.Mesh(rimGeo, mirrorSilver);
  rimMesh.position.set(0, 0.35, 0.02);
  bellGroup.add(rimMesh);

  // Inner Bell Radiating Channels
  for (let r = 0; r < 7; r++) {
    const angle = Math.PI * 0.15 + (r / 6) * Math.PI * 0.7;
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.75, 0.02), enamelMat);
    rib.position.set(Math.cos(angle) * 0.65, 0.35 + Math.sin(angle) * 0.45, 0.06);
    rib.rotation.z = angle - Math.PI / 2;
    bellGroup.add(rib);
  }
  badge.add(bellGroup);

  // Descending Undulating Tentacle Ribbons
  const tentacleGroup = new THREE.Group();
  const ribbonCount = 7;
  for (let t = 0; t < ribbonCount; t++) {
    const xPos = -0.9 + (t / (ribbonCount - 1)) * 1.8;
    const waveMat = t % 2 === 0 ? lavenderMat : mirrorSilver;
    const curve = new THREE.Mesh(
      new THREE.TorusGeometry(0.45, 0.035, 10, 24, Math.PI * 0.85),
      waveMat
    );
    curve.position.set(xPos, -0.45 - (t % 3) * 0.15, 0.04 + (t % 2) * 0.03);
    curve.rotation.z = (t % 2 === 0 ? 1 : -1) * 0.45;
    tentacleGroup.add(curve);
  }
  badge.add(tentacleGroup);

  // Ceramic Back Base Plate (Convex crowned coin)
  const backBaseGeo = createConvexCoinGeometry(1.65, 0.14, 0.06);
  const backBase = new THREE.Mesh(backBaseGeo, [mirrorSilver, azureMat, backMat]);
  backBase.rotation.x = Math.PI / 2;
  backBase.position.z = -0.06;
  badge.add(backBase);

  badge.setExplodedView = (f: number) => {
    backBase.position.z = -0.06 - f * 0.35;
    bellGroup.position.z = 0.02 + f * 0.65;
    tentacleGroup.position.z = 0.04 + f * 1.1;
  };

  return badge;
}

/**
 * 26. PROTOTYPE 26: Cosmic Nebula Jellyfish (Celestial Curiosity Pulse)
 */
export function buildNebulaJellyfishBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 26, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const spaceGray = materials.getSpaceGrayBezel(isLocked);
  const violetMat = materials.getColorLacquer(0xbf5af2, isLocked); // Deep Galactic Nebula Violet
  const solarMat = materials.getColorLacquer(0xffd60a, isLocked); // Solar Gold
  const cyanMat = materials.getColorLacquer(0x00f0ff, isLocked); // Cosmic Cyan
  const backMat = materials.getAppleBackShell(earnedDate, 'COSMIC NEBULA JELLYFISH', isLocked);

  const badge = new THREE.Group() as AppleBadgeMeshGroup;

  // Space Gray Titanium Unibody Base Disc (Convex crowned coin)
  const baseMesh = new THREE.Mesh(
    createConvexCoinGeometry(1.65, 0.16, 0.08),
    [spaceGray, violetMat, backMat]
  );
  baseMesh.rotation.x = Math.PI / 2;
  badge.add(baseMesh);

  // Outer Space Gray Chamfer Rim
  const rimMesh = new THREE.Mesh(
    new THREE.TorusGeometry(1.65, 0.08, 16, 64),
    spaceGray
  );
  badge.add(rimMesh);

  // Dual Concentric Cosmic Bell Dome
  const domeGroup = new THREE.Group();
  const outerDome = new THREE.Mesh(
    new THREE.TorusGeometry(1.15, 0.06, 16, 48, Math.PI * 1.1),
    solarMat
  );
  outerDome.position.set(0, 0.3, 0.04);
  outerDome.rotation.z = Math.PI * 0.95;
  domeGroup.add(outerDome);

  const innerDome = new THREE.Mesh(
    new THREE.SphereGeometry(0.85, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5),
    violetMat
  );
  innerDome.scale.set(1.0, 0.75, 0.35);
  innerDome.position.set(0, 0.35, 0.03);
  domeGroup.add(innerDome);
  badge.add(domeGroup);

  // Trailing Cosmic Stellar Ribbons with Cyan Nodes
  const tendrilGroup = new THREE.Group();
  for (let k = 0; k < 6; k++) {
    const x = -0.7 + (k / 5) * 1.4;
    const tendril = new THREE.Mesh(
      new THREE.TorusGeometry(0.5, 0.035, 10, 24, Math.PI * 0.8),
      k % 2 === 0 ? spaceGray : solarMat
    );
    tendril.position.set(x, -0.4 - (k % 2) * 0.2, 0.05);
    tendril.rotation.z = (k % 2 === 0 ? 0.35 : -0.35);
    tendrilGroup.add(tendril);

    const starNode = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 12, 12),
      cyanMat
    );
    starNode.position.set(x + (k % 2 === 0 ? 0.2 : -0.2), -0.85, 0.07);
    tendrilGroup.add(starNode);
  }
  badge.add(tendrilGroup);

  badge.setExplodedView = (f: number) => {
    baseMesh.position.z = -f * 0.25;
    domeGroup.position.z = 0.03 + f * 0.75;
    tendrilGroup.position.z = 0.05 + f * 1.15;
  };

  return badge;
}

/**
 * 27. PROTOTYPE 27: Aquila Sovereign Eagle (Pinnacle Macro-Synthesis Framework)
 */
export function buildSovereignEagleBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const mirrorGold = materials.getMirrorGoldBezel(isLocked);
  const crimsonMat = materials.getColorLacquer(0xfa114f, isLocked); // Imperial Crimson
  const amberMat = materials.getColorLacquer(0xffd60a, isLocked); // Piercing Luminous Gaze
  const darkChannel = materials.getGrooveChannelMaterial();
  const backMat = materials.getAppleBackShell(earnedDate, 'AQUILA SOVEREIGN EAGLE', isLocked);

  const badge = new THREE.Group() as AppleBadgeMeshGroup;

  // Swept Aerodynamic Base Medallion (Convex crowned coin)
  const baseMesh = new THREE.Mesh(
    createConvexCoinGeometry(1.68, 0.16, 0.08),
    [mirrorGold, crimsonMat, backMat]
  );
  baseMesh.rotation.x = Math.PI / 2;
  badge.add(baseMesh);

  // 24K Outer Mirror Rim
  const rimMesh = new THREE.Mesh(
    new THREE.TorusGeometry(1.68, 0.08, 16, 64),
    mirrorGold
  );
  badge.add(rimMesh);

  // Swept Golden Wing Blades (Left & Right)
  const wingGroup = new THREE.Group();
  for (let side = -1; side <= 1; side += 2) {
    for (let f = 0; f < 4; f++) {
      const featherGeo = new THREE.BoxGeometry(0.65 + f * 0.18, 0.14, 0.04);
      const feather = new THREE.Mesh(featherGeo, mirrorGold);
      feather.position.set(side * (0.65 + f * 0.2), 0.25 + f * 0.28, 0.04 + f * 0.015);
      feather.rotation.z = side * (0.35 + f * 0.16);
      wingGroup.add(feather);
    }
  }
  badge.add(wingGroup);

  // Sculpted Eagle Head & Raptor Beak Crest
  const headGroup = new THREE.Group();
  // Skull crest
  const skullGeo = new THREE.SphereGeometry(0.38, 24, 24);
  skullGeo.scale(0.85, 1.15, 0.55);
  const skull = new THREE.Mesh(skullGeo, crimsonMat);
  skull.position.set(0, 0.15, 0.06);
  headGroup.add(skull);

  // Brow Ridge visor
  const browGeo = new THREE.TorusGeometry(0.32, 0.04, 12, 24, Math.PI * 0.7);
  browGeo.rotateZ(Math.PI * 0.15);
  const brow = new THREE.Mesh(browGeo, mirrorGold);
  brow.position.set(0, 0.32, 0.12);
  headGroup.add(brow);

  // Curving Sharp Beak
  const beakGeo = new THREE.ConeGeometry(0.18, 0.48, 8);
  const beak = new THREE.Mesh(beakGeo, mirrorGold);
  beak.position.set(0, -0.15, 0.14);
  beak.rotation.z = Math.PI;
  beak.rotation.x = -0.35;
  headGroup.add(beak);

  // Piercing Eyes
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), amberMat);
  eyeL.position.set(-0.2, 0.22, 0.12);
  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), amberMat);
  eyeR.position.set(0.2, 0.22, 0.12);
  headGroup.add(eyeL, eyeR);
  badge.add(headGroup);

  badge.setExplodedView = (f: number) => {
    baseMesh.position.z = -f * 0.25;
    wingGroup.position.z = 0.04 + f * 0.65;
    headGroup.position.z = 0.06 + f * 1.1;
  };

  return badge;
}

/**
 * 28. PROTOTYPE 28: Archimedes Clockwork Owl (Chrono-Analytical Rigor)
 */
export function buildClockworkOwlBadge(
  materials: AppleAwardMaterials,
  earnedDate: string = 'OCTOBER 28, 2026',
  isLocked: boolean = false
): AppleBadgeMeshGroup {
  const mirrorGold = materials.getMirrorGoldBezel(isLocked);
  const emeraldMat = materials.getColorLacquer(0x30d158, isLocked); // Precision Emerald Green
  const cyanMat = materials.getColorLacquer(0x00f0ff, isLocked); // Sapphire Pivot Jewel
  const brassMat = materials.getColorLacquer(0xffd97d, isLocked); // Brushed Brass
  const backMat = materials.getAppleBackShell(earnedDate, 'ARCHIMEDES CLOCKWORK OWL', isLocked);

  const badge = new THREE.Group() as AppleBadgeMeshGroup;

  // Mechanical Outer Bezel with Lathe-turned Notches (Convex crowned coin)
  const baseMesh = new THREE.Mesh(
    createConvexCoinGeometry(1.65, 0.16, 0.08),
    [mirrorGold, emeraldMat, backMat]
  );
  baseMesh.rotation.x = Math.PI / 2;
  badge.add(baseMesh);

  // Outer 24K Gold Chamfer
  const rimMesh = new THREE.Mesh(
    new THREE.TorusGeometry(1.65, 0.08, 16, 64),
    mirrorGold
  );
  badge.add(rimMesh);

  // Clockwork Epicyclic Ear Gears
  const gearGroup = new THREE.Group();
  for (let side = -1; side <= 1; side += 2) {
    const gearEar = new THREE.Mesh(
      new THREE.TorusGeometry(0.35, 0.05, 12, 16),
      mirrorGold
    );
    gearEar.position.set(side * 0.72, 1.25, 0.04);
    gearGroup.add(gearEar);
  }
  badge.add(gearGroup);

  // Stereoscopic Geared Ocular Apertures (Eyes)
  const ocularGroup = new THREE.Group();
  for (let side = -1; side <= 1; side += 2) {
    // Outer Gear Rim
    const eyeGear = new THREE.Mesh(
      new THREE.TorusGeometry(0.38, 0.05, 16, 24),
      mirrorGold
    );
    eyeGear.position.set(side * 0.48, 0.35, 0.08);
    ocularGroup.add(eyeGear);

    // Inner Concentric Brass Ring
    const innerRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.24, 0.035, 12, 20),
      brassMat
    );
    innerRing.position.set(side * 0.48, 0.35, 0.09);
    ocularGroup.add(innerRing);

    // Central Sapphire Jewel Pivot
    const pivotJewel = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 16, 16),
      cyanMat
    );
    pivotJewel.scale.set(1, 1, 0.5);
    pivotJewel.position.set(side * 0.48, 0.35, 0.12);
    ocularGroup.add(pivotJewel);
  }
  badge.add(ocularGroup);

  // Mechanical Beak Escapement
  const escapement = new THREE.Mesh(
    new THREE.ConeGeometry(0.18, 0.38, 4),
    mirrorGold
  );
  escapement.position.set(0, 0.05, 0.11);
  escapement.rotation.z = Math.PI;
  badge.add(escapement);

  // Layered Emerald Breast Plates (Micro-Machined Scales)
  const scalesGroup = new THREE.Group();
  for (let row = 0; row < 3; row++) {
    const count = 3 + row;
    for (let c = 0; c < count; c++) {
      const x = -0.45 + (c / (count - 1)) * 0.9;
      const y = -0.25 - row * 0.28;
      const scaleMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.14, 0.03, 16),
        row % 2 === 0 ? emeraldMat : brassMat
      );
      scaleMesh.position.set(x, y, 0.05 + row * 0.02);
      scaleMesh.rotation.x = Math.PI / 2;
      scalesGroup.add(scaleMesh);
    }
  }
  badge.add(scalesGroup);

  badge.setExplodedView = (f: number) => {
    baseMesh.position.z = -f * 0.25;
    gearGroup.position.z = 0.04 + f * 0.55;
    ocularGroup.position.z = 0.08 + f * 0.95;
    scalesGroup.position.z = 0.05 + f * 0.75;
    escapement.position.z = 0.11 + f * 1.15;
  };

  return badge;
}

export {
  buildCutePandaBadge,
  buildCuteShibaBadge,
  buildCuteRedPandaBadge,
  buildCuteKoalaBadge,
  buildCuteHamsterBadge,
  buildCuteFoxBadge,
  buildCutePenguinBadge,
  buildCuteBunnyBadge,
  buildCuteOtterBadge,
  buildCuteAlpacaBadge,
  buildOceanWhaleBadge,
  buildOceanMantaBadge,
  buildOceanTurtleBadge,
  buildOceanDolphinBadge,
  buildOceanSharkBadge,
  buildOceanSeahorseBadge,
  buildOceanNarwhalBadge,
  buildOceanOctopusBadge,
  buildOceanJellyfishBadge,
  buildOceanFlyingFishBadge,
} from './AnimalBadgeGeometry';

export {
  buildCartoonWizardBadge,
  buildCartoonAstronautBadge,
  buildCartoonMechaBadge,
  buildCartoonKnightBadge,
  buildCartoonPrinceBadge,
  buildCartoonPirateBadge,
  buildCartoonPixelHeroBadge,
  buildCartoonAviatorBadge,
  buildCartoonElfBadge,
  buildCartoonNinjaBadge,
} from './CartoonBadgeGeometry';

export {
  buildMinecraftSteveBadge,
  buildMinecraftAlexBadge,
  buildMinecraftCreeperBadge,
  buildMinecraftEndermanBadge,
  buildMinecraftSkeletonBadge,
  buildMinecraftZombieBadge,
  buildMinecraftIronGolemBadge,
  buildMinecraftPigBadge,
  buildMinecraftEnderDragonBadge,
  buildMinecraftAxolotlBadge,
} from './MinecraftBadgeGeometry';





