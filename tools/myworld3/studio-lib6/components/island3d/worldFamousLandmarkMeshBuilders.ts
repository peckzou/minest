import * as THREE from 'three';
import { IslandMetadata, IslandVariant } from '../../types/island';
import { FAMOUS_LANDMARK_SEEDS, FamousLandmarkSeed } from '../../data/worldFamousLandmarksData';

function mat(color: number, roughness = 0.65, metalness = 0.1, transparent = false, opacity = 1): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    transparent,
    opacity,
    flatShading: true,
  });
}

function emissiveMat(color: number, emissive: number, intensity = 0.65): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: intensity,
    roughness: 0.3,
    metalness: 0.2,
    flatShading: true,
  });
}

function addBox(
  parent: THREE.Object3D,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  material: THREE.Material,
  rx = 0,
  ry = 0,
  rz = 0
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  if (rx || ry || rz) m.rotation.set(rx, ry, rz);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

function addCyl(
  parent: THREE.Object3D,
  rt: number,
  rb: number,
  h: number,
  segs: number,
  x: number,
  y: number,
  z: number,
  material: THREE.Material,
  rx = 0,
  ry = 0,
  rz = 0
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, segs), material);
  m.position.set(x, y, z);
  if (rx || ry || rz) m.rotation.set(rx, ry, rz);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

function addCone(
  parent: THREE.Object3D,
  r: number,
  h: number,
  segs: number,
  x: number,
  y: number,
  z: number,
  material: THREE.Material,
  ry = 0
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, segs), material);
  m.position.set(x, y, z);
  if (ry) m.rotation.y = ry;
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

function addSphere(
  parent: THREE.Object3D,
  r: number,
  x: number,
  y: number,
  z: number,
  material: THREE.Material,
  sx = 1,
  sy = 1,
  sz = 1
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 12), material);
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

/** Connect two 3D points with a cylinder strut */
function addStrut(
  parent: THREE.Object3D,
  p1: THREE.Vector3,
  p2: THREE.Vector3,
  radius: number,
  material: THREE.Material,
  segs = 6
): THREE.Mesh {
  const dir = new THREE.Vector3().subVectors(p2, p1);
  const len = dir.length();
  const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, len, segs), material);
  mesh.position.copy(mid);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

/** Add an upturned oriental pagoda roof tier */
function addPagodaRoofTier(
  parent: THREE.Object3D,
  radius: number,
  height: number,
  sides: number,
  y: number,
  roofMat: THREE.Material,
  goldMat: THREE.Material
) {
  addCone(parent, radius, height, sides, 0, y, 0, roofMat, Math.PI / sides);
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2;
    const ex = Math.cos(a) * (radius * 0.92);
    const ez = Math.sin(a) * (radius * 0.92);
    addBox(parent, 0.08, 0.06, 0.24, ex, y - height * 0.36, ez, goldMat, 0.35, -a + Math.PI / 2, 0);
  }
}

function getLandmarkSeedByBuilding(island: IslandMetadata): FamousLandmarkSeed {
  const idMatch = island.id.match(/BD-(\d+)/);
  if (idMatch) {
    const num = parseInt(idMatch[1], 10);
    const idx = num - 160; // BD-161 -> 1 .. BD-210 -> 50
    const found = FAMOUS_LANDMARK_SEEDS.find((s) => s.idx === idx);
    if (found) return found;
  }
  const slugMatch = island.slug.match(/building-landmark-(\d+)/);
  if (slugMatch) {
    const idx = parseInt(slugMatch[1], 10);
    const found = FAMOUS_LANDMARK_SEEDS.find((s) => s.idx === idx);
    if (found) return found;
  }
  return FAMOUS_LANDMARK_SEEDS[0];
}

function getLandmarkSeedByInterior(island: IslandMetadata): FamousLandmarkSeed {
  const idMatch = island.id.match(/diorama_dollhouse_(\d+)/);
  if (idMatch) {
    const num = parseInt(idMatch[1], 10);
    const idx = num - 52; // diorama_dollhouse_53 -> 1 .. 102 -> 50
    const found = FAMOUS_LANDMARK_SEEDS.find((s) => s.idx === idx);
    if (found) return found;
  }
  const slugMatch = island.slug.match(/diorama-dollhouse-(\d+)/);
  if (slugMatch) {
    const num = parseInt(slugMatch[1], 10);
    const idx = num - 52;
    const found = FAMOUS_LANDMARK_SEEDS.find((s) => s.idx === idx);
    if (found) return found;
  }
  return FAMOUS_LANDMARK_SEEDS[0];
}

// ============================================================================
// PART 1: 50 BESPOKE WORLD-FAMOUS LANDMARK EXTERIORS (BD-161 to BD-210)
// ============================================================================
export function buildWorldFamousLandmarkScene(island: IslandMetadata, variant: IslandVariant): THREE.Group {
  const root = new THREE.Group();
  root.name = `WorldLandmark_${island.id}`;
  const isMinimal = variant === 'minimal';
  const seed = getLandmarkSeedByBuilding(island);
  const idx = seed.idx;

  const exteriorWrapper = new THREE.Group();
  exteriorWrapper.name = 'floor_2_group';

  const g = new THREE.Group();
  exteriorWrapper.add(g);

  // Common architectural base plaza
  const basePlazaMat = mat(isMinimal ? 0xe2e8f0 : 0xd6d3c9, 0.85, 0.05);
  const baseTrimMat = mat(isMinimal ? 0xcbd5e1 : 0x94a3b8, 0.75, 0.1);
  const lawnMat = mat(isMinimal ? 0xe2e8f0 : 0x4d7c0f, 0.85, 0.02);
  const waterMat = mat(isMinimal ? 0xcbd5e1 : 0x0284c7, 0.2, 0.35, true, 0.88);
  const goldMat = mat(isMinimal ? 0x94a3b8 : 0xfacc15, 0.25, 0.82);
  const glassMat = mat(isMinimal ? 0xcbd5e1 : 0x38bdf8, 0.18, 0.65, true, 0.85);
  const warmGlow = emissiveMat(0xfef08a, 0xf59e0b, 0.85);

  addBox(g, 5.4, 0.18, 5.4, 0, 0.09, 0, baseTrimMat);
  addBox(g, 5.1, 0.1, 5.1, 0, 0.21, 0, basePlazaMat);

  const c0 = parseInt(seed.palette[0].replace('#', ''), 16);
  const c1 = parseInt(seed.palette[1].replace('#', ''), 16);
  const c2 = parseInt(seed.palette[2].replace('#', ''), 16);
  const primaryMat = mat(isMinimal ? 0xf1f5f9 : c0, 0.6, 0.15);
  const secondaryMat = mat(isMinimal ? 0xcbd5e1 : c1, 0.55, 0.2);
  const accentMat = mat(isMinimal ? 0x94a3b8 : c2, 0.35, 0.6);

  switch (idx) {
    // ========================================================================
    // GROUP 1 (1..10): 10 ICONIC TOWERS & SKYSCRAPERS
    // ========================================================================
    case 1: {
      // 1. Eiffel Tower (Paris)
      const iron = mat(isMinimal ? 0xcbd5e1 : 0x785a46, 0.55, 0.45);
      const darkIron = mat(isMinimal ? 0x94a3b8 : 0x5c4333, 0.5, 0.5);
      // Champ de Mars reflecting pool & parterres
      addBox(g, 1.5, 0.04, 1.8, 0, 0.27, 1.45, waterMat);
      for (const sx of [-1, 1]) {
        addBox(g, 1.1, 0.05, 1.8, sx * 1.65, 0.27, 1.45, lawnMat);
      }
      // 4 inclined pylon legs from y=0.26 to 1st deck y=1.45
      const legCorners = [
        [-1.15, -1.15],
        [1.15, -1.15],
        [-1.15, 1.15],
        [1.15, 1.15],
      ];
      for (const [lx, lz] of legCorners) {
        const sx = Math.sign(lx);
        const sz = Math.sign(lz);
        addBox(g, 0.45, 0.16, 0.45, lx, 0.32, lz, baseTrimMat);
        addStrut(g, new THREE.Vector3(lx, 0.35, lz), new THREE.Vector3(sx * 0.62, 1.45, sz * 0.62), 0.13, iron);
        addStrut(g, new THREE.Vector3(lx * 0.82, 0.35, lz * 0.82), new THREE.Vector3(sx * 0.48, 1.45, sz * 0.48), 0.08, darkIron);
      }
      // 4 Iconic Semicircular Base Arches
      for (let i = 0; i < 4; i++) {
        const arch = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.06, 8, 18, Math.PI), darkIron);
        arch.position.set(0, 0.38, 0);
        arch.rotation.y = (i * Math.PI) / 2;
        arch.position.x = Math.sin(arch.rotation.y) * 0.88;
        arch.position.z = Math.cos(arch.rotation.y) * 0.88;
        g.add(arch);
      }
      // 1st Observation Deck (y=1.48)
      addBox(g, 1.62, 0.16, 1.62, 0, 1.48, 0, darkIron);
      addBox(g, 1.48, 0.1, 1.48, 0, 1.6, 0, warmGlow);
      // Middle tapered lattice section to 2nd deck (y=1.65 to 2.75)
      for (const [lx, lz] of legCorners) {
        const sx = Math.sign(lx);
        const sz = Math.sign(lz);
        addStrut(g, new THREE.Vector3(sx * 0.55, 1.62, sz * 0.55), new THREE.Vector3(sx * 0.3, 2.75, sz * 0.3), 0.09, iron);
      }
      for (let h = 1.85; h <= 2.55; h += 0.24) {
        const w = 1.05 - (h - 1.6) * 0.38;
        addBox(g, w, 0.04, w, 0, h, 0, darkIron);
      }
      // 2nd Observation Deck (y=2.8)
      addBox(g, 0.96, 0.14, 0.96, 0, 2.8, 0, darkIron);
      addBox(g, 0.82, 0.09, 0.82, 0, 2.91, 0, warmGlow);
      // Upper tapered shaft (y=2.95 to 4.45)
      addCyl(g, 0.16, 0.36, 1.5, 4, 0, 3.7, 0, iron, 0, Math.PI / 4, 0);
      for (let h = 3.15; h <= 4.3; h += 0.22) {
        const w = 0.52 - (h - 2.95) * 0.2;
        addBox(g, w, 0.035, w, 0, h, 0, darkIron);
      }
      // Summit cupola & golden beacon spire
      addBox(g, 0.38, 0.14, 0.38, 0, 4.5, 0, darkIron);
      addCyl(g, 0.14, 0.18, 0.22, 8, 0, 4.68, 0, warmGlow);
      addCyl(g, 0.015, 0.04, 0.72, 8, 0, 5.12, 0, goldMat);
      break;
    }

    case 2: {
      // 2. Big Ben (Elizabeth Tower) & Palace of Westminster
      const sandstone = mat(isMinimal ? 0xf1f5f9 : 0xd9c39e, 0.65, 0.1);
      const slateRoof = mat(isMinimal ? 0x94a3b8 : 0x1e293b, 0.55, 0.25);
      // Thames River foreground strip
      addBox(g, 5.0, 0.06, 1.1, 0, 0.26, 1.85, waterMat);
      // Palace of Westminster Gothic wing on left
      addBox(g, 2.55, 1.25, 1.35, -0.75, 0.88, -0.15, sandstone);
      addCyl(g, 0.65, 0.65, 2.55, 3, -0.75, 1.72, -0.15, slateRoof, 0, 0, Math.PI / 2);
      for (let x = -1.85; x <= 0.35; x += 0.32) {
        addBox(g, 0.08, 1.45, 1.42, x, 0.96, -0.15, sandstone);
        addCone(g, 0.06, 0.28, 4, x, 1.82, 0.52, goldMat);
        addCone(g, 0.06, 0.28, 4, x, 1.82, -0.82, goldMat);
      }
      // Elizabeth Tower (Big Ben) shaft on right (x = 1.05, z = 0.15)
      const tx = 1.05;
      const tz = 0.15;
      addBox(g, 0.95, 2.85, 0.95, tx, 1.68, tz, sandstone);
      // Vertical Gothic fluting strips
      for (let o = -0.36; o <= 0.36; o += 0.18) {
        addBox(g, 0.04, 2.75, 0.99, tx + o, 1.68, tz, goldMat);
        addBox(g, 0.99, 2.75, 0.04, tx, 1.68, tz + o, goldMat);
      }
      // Projecting Clock Stage (y = 3.35)
      addBox(g, 1.14, 0.78, 1.14, tx, 3.38, tz, sandstone);
      addBox(g, 1.18, 0.1, 1.18, tx, 2.98, tz, goldMat);
      addBox(g, 1.18, 0.1, 1.18, tx, 3.78, tz, goldMat);
      // 4 Opal Clock Dials + Gilded Surrounds + Hands
      const dialMat = emissiveMat(0xffffff, 0xfef08a, 0.55);
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        const dx = tx + Math.sin(a) * 0.58;
        const dz = tz + Math.cos(a) * 0.58;
        addCyl(g, 0.36, 0.36, 0.04, 20, dx, 3.38, dz, goldMat, Math.PI / 2, 0, -a);
        addCyl(g, 0.3, 0.3, 0.05, 20, dx, 3.38, dz, dialMat, Math.PI / 2, 0, -a);
      }
      // Stepped Cast-Iron Belfry & Spire
      addBox(g, 0.88, 0.42, 0.88, tx, 3.98, tz, slateRoof);
      addCone(g, 0.65, 0.72, 4, tx, 4.52, tz, slateRoof, Math.PI / 4);
      addBox(g, 0.42, 0.32, 0.42, tx, 4.88, tz, goldMat);
      addCone(g, 0.32, 0.65, 4, tx, 5.32, tz, slateRoof, Math.PI / 4);
      addSphere(g, 0.07, tx, 5.68, tz, goldMat);
      break;
    }

    case 3: {
      // 3. Leaning Tower of Pisa
      const marble = mat(isMinimal ? 0xf8fafc : 0xf5f2eb, 0.45, 0.1);
      const shadowMarble = mat(isMinimal ? 0xe2e8f0 : 0xd6cfc2, 0.55, 0.1);
      // Piazza dei Miracoli Emerald Lawn
      addBox(g, 4.8, 0.05, 4.8, 0, 0.27, 0, lawnMat);
      addCyl(g, 1.65, 1.75, 0.08, 28, 0, 0.31, 0, marble);
      // Tilted Tower Group (3.97 deg lean!)
      const tiltGroup = new THREE.Group();
      tiltGroup.position.set(-0.15, 0.32, 0);
      tiltGroup.rotation.z = -0.088; // Unmistakable iconic lean
      g.add(tiltGroup);
      // Ground Floor Tall Blind Arcade
      addCyl(g, 0.96, 1.0, 0.88, 24, 0, 0.44, 0, marble);
      for (let i = 0; i < 15; i++) {
        const a = (i / 15) * Math.PI * 2;
        addCyl(tiltGroup, 0.04, 0.04, 0.84, 8, Math.cos(a) * 0.99, 0.44, Math.sin(a) * 0.99, shadowMarble);
      }
      // 6 Open Colonnade Galleries
      for (let tier = 0; tier < 6; tier++) {
        const ty = 0.95 + tier * 0.48;
        addCyl(tiltGroup, 1.04, 1.04, 0.07, 28, 0, ty, 0, marble);
        addCyl(tiltGroup, 0.76, 0.76, 0.42, 24, 0, ty + 0.24, 0, shadowMarble);
        for (let c = 0; c < 18; c++) {
          const a = (c / 18) * Math.PI * 2;
          addCyl(
            tiltGroup,
            0.032,
            0.035,
            0.41,
            8,
            Math.cos(a) * 0.96,
            ty + 0.24,
            Math.sin(a) * 0.96,
            marble
          );
        }
      }
      // Top cornice & 8th-story recessed Belfry Chamber
      addCyl(tiltGroup, 1.05, 1.05, 0.08, 28, 0, 3.85, 0, marble);
      addCyl(tiltGroup, 0.68, 0.72, 0.56, 20, 0, 4.16, 0, marble);
      for (let b = 0; b < 12; b++) {
        const a = (b / 12) * Math.PI * 2;
        addCyl(tiltGroup, 0.03, 0.03, 0.52, 8, Math.cos(a) * 0.71, 4.16, Math.sin(a) * 0.71, shadowMarble);
      }
      addCyl(tiltGroup, 0.74, 0.74, 0.06, 24, 0, 4.46, 0, goldMat);
      break;
    }

    case 4: {
      // 4. Empire State Building (NYC)
      const limestone = mat(isMinimal ? 0xf1f5f9 : 0xd6d3c9, 0.6, 0.15);
      const aluminum = mat(isMinimal ? 0x94a3b8 : 0x64748b, 0.35, 0.75);
      // 5-story Fifth Avenue podium base
      addBox(g, 2.55, 0.48, 1.95, 0, 0.5, 0, limestone);
      // Setback 1
      addBox(g, 1.95, 0.65, 1.55, 0, 1.05, 0, limestone);
      // Main Iconic Tower Shaft with Art Deco Side Wings
      addBox(g, 1.25, 2.25, 1.05, 0, 2.45, 0, limestone);
      addBox(g, 1.58, 1.75, 0.68, 0, 2.2, 0, limestone);
      addBox(g, 0.68, 1.75, 1.38, 0, 2.2, 0, limestone);
      // Brushed Aluminum Vertical Window Strips
      for (let x = -0.48; x <= 0.48; x += 0.16) {
        addBox(g, 0.04, 2.2, 1.08, x, 2.45, 0, aluminum);
      }
      for (let z = -0.36; z <= 0.36; z += 0.18) {
        addBox(g, 1.28, 2.2, 0.04, 0, 2.45, z, aluminum);
      }
      // 72nd & 81st Floor Upper Setbacks
      addBox(g, 0.98, 0.42, 0.84, 0, 3.75, 0, limestone);
      // 86th-Floor Observation Deck & Illuminated Crown
      addBox(g, 0.78, 0.28, 0.68, 0, 4.1, 0, warmGlow);
      // Art Deco Mooring Mast (86th to 102nd floor)
      addCyl(g, 0.22, 0.32, 0.68, 12, 0, 4.55, 0, aluminum);
      addSphere(g, 0.22, 0, 4.92, 0, warmGlow);
      // Broadcast Needle Spire
      addCyl(g, 0.015, 0.05, 0.95, 8, 0, 5.45, 0, aluminum);
      break;
    }

    case 5: {
      // 5. Burj Khalifa (Dubai)
      const silverGlass = mat(isMinimal ? 0xe2e8f0 : 0x93c5fd, 0.18, 0.82);
      const chromeMullion = mat(isMinimal ? 0x94a3b8 : 0xf8fafc, 0.2, 0.9);
      // Turquoise Dubai Fountain Lake at Base
      addCyl(g, 2.35, 2.4, 0.06, 32, 0, 0.27, 0, waterMat);
      addCyl(g, 1.35, 1.45, 0.12, 6, 0, 0.32, 0, basePlazaMat);
      // Central Hexagonal Core + 24 Spiraling Y-Wing Bundled Tubes
      addCyl(g, 0.18, 0.42, 4.35, 6, 0, 2.5, 0, silverGlass);
      const wingCount = 18;
      for (let i = 0; i < wingCount; i++) {
        const wingAngle = ((i % 3) * Math.PI * 2) / 3 + Math.floor(i / 3) * 0.08;
        const dist = 0.88 - i * 0.042;
        const h = 0.85 + i * 0.195;
        const r = Math.max(0.11, 0.24 - i * 0.006);
        const wx = Math.cos(wingAngle) * dist;
        const wz = Math.sin(wingAngle) * dist;
        addCyl(g, r * 0.88, r, h, 6, wx, 0.34 + h / 2, wz, silverGlass);
        // Gleaming horizontal setback terrace ring
        addCyl(g, r * 0.95, r * 0.95, 0.04, 6, wx, 0.34 + h, wz, chromeMullion);
      }
      // Upper central cylinder & 244m telescopic spire
      addCyl(g, 0.08, 0.16, 0.85, 12, 0, 4.85, 0, chromeMullion);
      addCyl(g, 0.012, 0.045, 0.95, 8, 0, 5.65, 0, chromeMullion);
      addSphere(g, 0.045, 0, 6.12, 0, warmGlow);
      break;
    }

    case 6: {
      // 6. Taipei 101 (Bamboo-Joint Pagoda Skyscraper)
      const jadeGlass = mat(isMinimal ? 0xcbd5e1 : 0x2dd4bf, 0.22, 0.65);
      const darkTeal = mat(isMinimal ? 0x94a3b8 : 0x0f766e, 0.4, 0.5);
      // Truncated Pyramid Podium Base
      addCyl(g, 1.05, 1.45, 0.92, 4, 0, 0.72, 0, darkTeal, 0, Math.PI / 4, 0);
      // Giant Golden Ancient Coin Medallions on 4 Sides of Base
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        addCyl(g, 0.22, 0.22, 0.05, 16, Math.sin(a) * 0.86, 1.02, Math.cos(a) * 0.86, goldMat, Math.PI / 2, 0, -a);
      }
      // 8 Stacked Inverted-Trapezoid "Bamboo Joint" Modules
      for (let b = 0; b < 8; b++) {
        const by = 1.38 + b * 0.38;
        const scale = 1 - b * 0.025;
        // Inverted trapezoid module (wider at top than bottom)
        addCyl(g, 0.86 * scale, 0.72 * scale, 0.36, 4, 0, by, 0, jadeGlass, 0, Math.PI / 4, 0);
        addBox(g, 1.24 * scale, 0.04, 1.24 * scale, 0, by + 0.17, 0, goldMat);
        // Ruyi Cloud-Scroll Ornaments on 4 Corners
        for (const cx of [-1, 1]) {
          for (const cz of [-1, 1]) {
            addSphere(g, 0.055, cx * 0.62 * scale, by + 0.14, cz * 0.62 * scale, goldMat);
          }
        }
      }
      // Crown Communications Tower & Spire
      addCyl(g, 0.34, 0.44, 0.42, 4, 0, 4.44, 0, darkTeal, 0, Math.PI / 4, 0);
      addCyl(g, 0.16, 0.22, 0.38, 8, 0, 4.82, 0, goldMat);
      addCyl(g, 0.015, 0.04, 0.72, 8, 0, 5.34, 0, goldMat);
      break;
    }

    case 7: {
      // 7. Oriental Pearl Tower (Shanghai)
      const concrete = mat(isMinimal ? 0xf1f5f9 : 0xe2e8f0, 0.45, 0.2);
      const pearlMagenta = mat(isMinimal ? 0x94a3b8 : 0xe11d48, 0.25, 0.55);
      // Circular Lujiazui Elevated Plaza
      addCyl(g, 1.85, 2.05, 0.18, 28, 0, 0.34, 0, concrete);
      // 3 Central Vertical Columns
      for (let i = 0; i < 3; i++) {
        const a = (i * Math.PI * 2) / 3;
        addCyl(g, 0.11, 0.11, 3.85, 12, Math.cos(a) * 0.22, 2.25, Math.sin(a) * 0.22, concrete);
        // 3 Giant Diagonal Tripod Struts Supporting Lower Sphere
        addStrut(
          g,
          new THREE.Vector3(Math.cos(a + 0.5) * 1.48, 0.35, Math.sin(a + 0.5) * 1.48),
          new THREE.Vector3(Math.cos(a) * 0.35, 1.45, Math.sin(a) * 0.35),
          0.11,
          concrete
        );
      }
      // Lower Giant Magenta Pearl Sphere (50m equivalent, y=1.52)
      addSphere(g, 0.62, 0, 1.52, 0, pearlMagenta);
      addCyl(g, 0.65, 0.65, 0.08, 24, 0, 1.52, 0, glassMat);
      // 3 Small Pearls Between Lower & Upper Spheres
      for (let p = 0; p < 3; p++) {
        addSphere(g, 0.16, 0, 2.28 + p * 0.36, 0, pearlMagenta);
      }
      // Upper Magenta Pearl Sphere (45m equivalent, y=3.55)
      addSphere(g, 0.48, 0, 3.55, 0, pearlMagenta);
      addCyl(g, 0.51, 0.51, 0.08, 24, 0, 3.55, 0, warmGlow);
      // Uppermost Space Capsule Pearl (y=4.48) + Antenna Spire
      addSphere(g, 0.24, 0, 4.48, 0, pearlMagenta);
      addCyl(g, 0.015, 0.05, 1.05, 8, 0, 5.12, 0, concrete);
      break;
    }

    case 8: {
      // 8. Tokyo Tower (International Orange & White Lattice)
      const intlOrange = mat(isMinimal ? 0x94a3b8 : 0xea580c, 0.45, 0.35);
      const pureWhite = mat(isMinimal ? 0xf8fafc : 0xffffff, 0.45, 0.25);
      const sakuraMat = mat(isMinimal ? 0xe2e8f0 : 0xf472b6, 0.75, 0.05);
      // FootTown Base Building + Shiba Park Sakura Trees
      addBox(g, 1.65, 0.36, 1.65, 0, 0.42, 0, pureWhite);
      for (const [tx, tz] of [
        [-1.65, 1.45],
        [1.65, 1.45],
        [-1.65, -1.45],
        [1.65, -1.45],
      ]) {
        addCyl(g, 0.05, 0.07, 0.35, 6, tx, 0.42, tz, primaryMat);
        addSphere(g, 0.28, tx, 0.68, tz, sakuraMat, 1.2, 0.9, 1.2);
      }
      // 4 Curved Pylon Legs (Orange at base, White above)
      for (const [lx, lz] of [
        [-1.08, -1.08],
        [1.08, -1.08],
        [-1.08, 1.08],
        [1.08, 1.08],
      ]) {
        const sx = Math.sign(lx);
        const sz = Math.sign(lz);
        addStrut(g, new THREE.Vector3(lx, 0.35, lz), new THREE.Vector3(sx * 0.56, 1.55, sz * 0.56), 0.1, intlOrange);
      }
      // 150m 2-Story White Main Deck Cube (y=1.68)
      addBox(g, 1.28, 0.34, 1.28, 0, 1.68, 0, pureWhite);
      addBox(g, 1.31, 0.14, 1.31, 0, 1.68, 0, glassMat);
      // 7 Alternating Orange & White Tapered Lattice Bands
      for (let band = 0; band < 7; band++) {
        const by = 2.06 + band * 0.42;
        const rBot = 0.54 - band * 0.055;
        const rTop = 0.54 - (band + 1) * 0.055;
        const bandMat = band % 2 === 0 ? intlOrange : pureWhite;
        addCyl(g, rTop, rBot, 0.42, 4, 0, by, 0, bandMat, 0, Math.PI / 4, 0);
      }
      // 250m Top Deck (y=3.85)
      addCyl(g, 0.34, 0.34, 0.24, 8, 0, 3.85, 0, pureWhite);
      addCyl(g, 0.36, 0.36, 0.1, 8, 0, 3.85, 0, warmGlow);
      // Striped Broadcast Antenna
      addCyl(g, 0.03, 0.06, 0.55, 8, 0, 5.05, 0, intlOrange);
      addCyl(g, 0.015, 0.03, 0.55, 8, 0, 5.58, 0, pureWhite);
      break;
    }

    case 9: {
      // 9. CN Tower (Toronto)
      const concrete = mat(isMinimal ? 0xe2e8f0 : 0xcbd5e1, 0.6, 0.15);
      const podWhite = mat(isMinimal ? 0xf8fafc : 0xffffff, 0.35, 0.25);
      const redAccent = mat(isMinimal ? 0x94a3b8 : 0xef4444, 0.35, 0.4);
      // Hexagonal Core + 3 Sweeping Tapered Y-Fin Buttress Wings
      addCyl(g, 0.2, 0.36, 3.9, 6, 0, 2.2, 0, concrete);
      for (let i = 0; i < 3; i++) {
        const a = (i * Math.PI * 2) / 3;
        const wing = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.25, 0.75), concrete);
        wing.position.set(Math.cos(a) * 0.28, 1.88, Math.sin(a) * 0.28);
        wing.rotation.y = -a + Math.PI / 2;
        wing.rotation.x = 0.12;
        g.add(wing);
      }
      // 7-Story Main Observation Pod (346m equivalent at y=3.68)
      addCyl(g, 0.72, 0.32, 0.22, 24, 0, 3.48, 0, podWhite); // White lower radome donut
      addCyl(g, 0.76, 0.72, 0.24, 24, 0, 3.7, 0, glassMat); // 360 Restaurant & Observation glass
      addCyl(g, 0.62, 0.76, 0.16, 24, 0, 3.9, 0, podWhite);
      addCyl(g, 0.66, 0.66, 0.05, 24, 0, 3.99, 0, redAccent); // EdgeWalk Ledge Ring
      // Upper Shaft & 447m SkyPod
      addCyl(g, 0.14, 0.18, 0.75, 12, 0, 4.35, 0, concrete);
      addCyl(g, 0.24, 0.22, 0.18, 16, 0, 4.78, 0, podWhite);
      // Red & White Broadcast Mast
      addCyl(g, 0.02, 0.06, 0.95, 8, 0, 5.34, 0, redAccent);
      break;
    }

    case 10: {
      // 10. Space Needle (Seattle)
      const needleWhite = mat(isMinimal ? 0xf8fafc : 0xffffff, 0.35, 0.25);
      const galaxyGold = mat(isMinimal ? 0x94a3b8 : 0xd97706, 0.3, 0.65);
      // Glass Pavilion Base
      addCyl(g, 1.35, 1.55, 0.28, 24, 0, 0.38, 0, glassMat);
      // Central Elevator Core
      addCyl(g, 0.22, 0.24, 3.65, 12, 0, 2.08, 0, needleWhite);
      // 3 Pairs of Hourglass-Curved White Steel Legs (waist at y=2.65)
      for (let i = 0; i < 3; i++) {
        const a = (i * Math.PI * 2) / 3;
        for (const offset of [-0.12, 0.12]) {
          const baseP = new THREE.Vector3(Math.cos(a + offset) * 1.18, 0.35, Math.sin(a + offset) * 1.18);
          const waistP = new THREE.Vector3(Math.cos(a + offset * 0.5) * 0.32, 2.65, Math.sin(a + offset * 0.5) * 0.32);
          const topP = new THREE.Vector3(Math.cos(a + offset * 0.8) * 0.78, 3.65, Math.sin(a + offset * 0.8) * 0.78);
          addStrut(g, baseP, waistP, 0.065, needleWhite);
          addStrut(g, waistP, topP, 0.06, needleWhite);
        }
      }
      // Iconic Flying-Saucer Top House (y=3.75..4.28)
      addCyl(g, 1.25, 0.45, 0.2, 28, 0, 3.74, 0, needleWhite); // Lower saucer plate
      addCyl(g, 1.38, 1.22, 0.22, 28, 0, 3.94, 0, glassMat); // Outward-slanted observation glass
      addCyl(g, 1.48, 1.38, 0.07, 28, 0, 4.08, 0, needleWhite); // Open-air promenade rim
      addCone(g, 1.32, 0.32, 28, 0, 4.26, 0, galaxyGold); // Galaxy Gold saucer roof
      addCyl(g, 0.28, 0.38, 0.18, 16, 0, 4.44, 0, needleWhite);
      // Torch Spire
      addCyl(g, 0.015, 0.045, 0.88, 8, 0, 4.95, 0, galaxyGold);
      addSphere(g, 0.055, 0, 5.4, 0, warmGlow);
      break;
    }

    // ========================================================================
    // GROUP 2 (11..20): 10 ANCIENT WONDERS & CLASSICAL MONUMENTS
    // ========================================================================
    case 11: {
      // 11. Roman Colosseum (Flavian Amphitheatre)
      const travertine = mat(isMinimal ? 0xf1f5f9 : 0xd9c39e, 0.7, 0.08);
      const innerStone = mat(isMinimal ? 0xcbd5e1 : 0xb89f7a, 0.75, 0.08);
      const sandMat = mat(isMinimal ? 0xe2e8f0 : 0xe5dec9, 0.85, 0.02);
      const colosseum = new THREE.Group();
      colosseum.scale.set(1.18, 1, 0.96); // Elliptical Flavian Amphitheatre plan
      g.add(colosseum);
      // Exposed Hypogeum Underground Maze Walls + Half-Cutaway Arena Floor
      for (let z = -0.75; z <= 0.75; z += 0.3) {
        addBox(colosseum, 1.65, 0.28, 0.08, 0, 0.4, z, innerStone);
      }
      // Half wood/sand arena floor on right side
      addCyl(colosseum, 1.15, 1.15, 0.06, 24, 0.2, 0.56, 0, sandMat);
      // Stepped Cavea Seating Bowl & 3-Story Inner Wall Ring (full 360)
      for (let tier = 0; tier < 3; tier++) {
        const r = 1.42 + tier * 0.22;
        const h = 0.55 + tier * 0.42;
        const ring = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 32, 1, true), innerStone);
        ring.position.y = 0.28 + h / 2;
        colosseum.add(ring);
      }
      // Iconic Asymmetric Outer Travertine Wall (standing 4 stories on North side)
      const outerArc = new THREE.Mesh(
        new THREE.CylinderGeometry(2.05, 2.05, 2.05, 28, 1, true, -Math.PI * 0.65, Math.PI * 1.25),
        travertine
      );
      outerArc.position.y = 1.3;
      colosseum.add(outerArc);
      // 3 Tiers of Arched Colonnade Columns & Cornices on Outer Ring
      for (let level = 0; level < 3; level++) {
        const ly = 0.55 + level * 0.52;
        for (let a = -Math.PI * 0.62; a <= Math.PI * 0.58; a += 0.22) {
          addCyl(colosseum, 0.055, 0.055, 0.46, 8, Math.sin(a) * 2.08, ly, Math.cos(a) * 2.08, travertine);
        }
      }
      break;
    }

    case 12: {
      // 12. The Parthenon (Acropolis of Athens)
      const pentelicMarble = mat(isMinimal ? 0xf8fafc : 0xf5efe6, 0.55, 0.08);
      const rockMat = mat(isMinimal ? 0xcbd5e1 : 0xa89f91, 0.85, 0.05);
      // Acropolis Rocky Outcrop & 3-Step Stylobate Platform
      addBox(g, 4.6, 0.42, 3.2, 0, 0.44, 0, rockMat);
      addBox(g, 4.2, 0.14, 2.65, 0, 0.72, 0, pentelicMarble);
      addBox(g, 4.0, 0.14, 2.45, 0, 0.86, 0, pentelicMarble);
      // 8 x 11 Peripteral Doric Fluted Column Ring
      for (let ix = 0; ix < 11; ix++) {
        for (let iz = 0; iz < 6; iz++) {
          if (ix > 0 && ix < 10 && iz > 0 && iz < 5) continue;
          const cx = -1.78 + ix * 0.356;
          const cz = -1.04 + iz * 0.416;
          addCyl(g, 0.072, 0.09, 1.38, 12, cx, 1.62, cz, pentelicMarble);
          addBox(g, 0.18, 0.07, 0.18, cx, 2.33, cz, pentelicMarble); // Doric Echinus/Abacus capital
        }
      }
      // Inner Cella Sanctuary Walls + Golden Athena Parthenos Statue
      addBox(g, 2.65, 1.28, 1.35, 0, 1.58, 0, secondaryMat);
      addCyl(g, 0.12, 0.16, 0.95, 12, 0.45, 1.45, 0, goldMat);
      addSphere(g, 0.14, 0.45, 2.02, 0, goldMat);
      // Architrave, Triglyph Frieze & Sculpted East/West Triangular Pediments
      addBox(g, 4.02, 0.24, 2.46, 0, 2.48, 0, pentelicMarble);
      addCyl(g, 1.32, 1.32, 4.04, 3, 0, 2.82, 0, pentelicMarble, 0, 0, Math.PI / 2);
      break;
    }

    case 13: {
      // 13. Taj Mahal (Agra)
      const makranaMarble = mat(isMinimal ? 0xffffff : 0xffffff, 0.3, 0.12);
      // Charbagh Reflecting Pool & Cypress Avenue in Foreground
      addBox(g, 0.75, 0.05, 1.95, 0, 0.27, 1.45, waterMat);
      for (const sx of [-0.62, 0.62]) {
        for (const sz of [0.85, 1.45, 2.05]) {
          addCone(g, 0.11, 0.48, 8, sx, 0.5, sz, lawnMat);
        }
      }
      // Raised Square White Marble Plinth
      addBox(g, 3.65, 0.32, 2.85, 0, 0.42, -0.35, makranaMarble);
      // 4 Slender Corner Minarets with 3 Balconies & Chhatri Crowns
      for (const [mx, mz] of [
        [-1.62, -1.58],
        [1.62, -1.58],
        [-1.62, 0.88],
        [1.62, 0.88],
      ]) {
        addCyl(g, 0.11, 0.15, 2.15, 14, mx, 1.65, mz, makranaMarble);
        addCyl(g, 0.18, 0.18, 0.05, 14, mx, 1.45, mz, makranaMarble);
        addCyl(g, 0.17, 0.17, 0.05, 14, mx, 2.1, mz, makranaMarble);
        addCyl(g, 0.16, 0.16, 0.05, 14, mx, 2.68, mz, makranaMarble);
        addSphere(g, 0.14, mx, 2.88, mz, makranaMarble, 1, 1.25, 1);
        addCyl(g, 0.015, 0.03, 0.22, 8, mx, 3.12, mz, goldMat);
      }
      // Central Chamfered Mausoleum Body & Grand Pishtaq Iwan Arch
      addCyl(g, 1.32, 1.32, 1.48, 8, 0, 1.32, -0.35, makranaMarble, 0, Math.PI / 8, 0);
      addBox(g, 0.95, 1.68, 1.98, 0, 1.42, -0.35, makranaMarble);
      addBox(g, 0.52, 1.15, 2.02, 0, 1.16, -0.35, secondaryMat); // Recessed Iwan niche
      // Central 35m Bulbous Lotus Onion Dome + 4 Corner Chhatris
      addCyl(g, 0.62, 0.62, 0.42, 24, 0, 2.28, -0.35, makranaMarble); // High drum
      addSphere(g, 0.74, 0, 2.86, -0.35, makranaMarble, 1, 1.28, 1); // Bulbous onion dome
      addCone(g, 0.22, 0.35, 16, 0, 3.68, -0.35, makranaMarble);
      addCyl(g, 0.02, 0.04, 0.42, 8, 0, 4.02, -0.35, goldMat);
      for (const [cx, cz] of [
        [-0.68, -1.02],
        [0.68, -1.02],
        [-0.68, 0.32],
        [0.68, 0.32],
      ]) {
        addCyl(g, 0.22, 0.22, 0.28, 8, cx, 2.2, cz, makranaMarble);
        addSphere(g, 0.24, cx, 2.45, cz, makranaMarble, 1, 1.2, 1);
        addCyl(g, 0.012, 0.02, 0.18, 6, cx, 2.75, cz, goldMat);
      }
      break;
    }

    case 14: {
      // 14. Great Pyramid of Giza & The Great Sphinx
      const desertSand = mat(isMinimal ? 0xe2e8f0 : 0xdfc496, 0.8, 0.05);
      const limestone = mat(isMinimal ? 0xcbd5e1 : 0xc2a370, 0.75, 0.08);
      addBox(g, 4.9, 0.08, 4.9, 0, 0.28, 0, desertSand);
      // 14 Stepped Limestone Courses of the Great Pyramid of Khufu
      for (let s = 0; s < 14; s++) {
        const w = 3.25 - s * 0.21;
        const y = 0.42 + s * 0.18;
        addBox(g, w, 0.18, w, -0.35, y, -0.45, s % 2 === 0 ? desertSand : limestone);
      }
      // Golden Electrum Benben Capstone at Summit
      addCone(g, 0.26, 0.32, 4, -0.35, 2.98, -0.45, goldMat, Math.PI / 4);
      // Great Sphinx of Giza in Foreground Right
      const sx = 1.25;
      const sz = 1.25;
      addBox(g, 0.68, 0.44, 1.25, sx, 0.52, sz, limestone); // Lion body
      addBox(g, 0.2, 0.18, 0.68, sx - 0.24, 0.38, sz + 0.78, limestone); // Left paw
      addBox(g, 0.2, 0.18, 0.68, sx + 0.24, 0.38, sz + 0.78, limestone); // Right paw
      addBox(g, 0.12, 0.24, 0.05, sx, 0.42, sz + 0.65, accentMat); // Dream Stele between paws
      // Pharaoh Head & Nemes Striped Headdress
      addCone(g, 0.34, 0.45, 4, sx, 0.96, sz + 0.35, goldMat, Math.PI / 4);
      addSphere(g, 0.2, sx, 0.98, sz + 0.42, limestone);
      break;
    }

    case 15: {
      // 15. Petra Al-Khazneh (The Treasury Rock-Cut Facade)
      const roseRock = mat(isMinimal ? 0xcbd5e1 : 0x9e4b33, 0.85, 0.05);
      const treasuryStone = mat(isMinimal ? 0xf1f5f9 : 0xc86d51, 0.6, 0.12);
      // Towering Rose-Red Sandstone Canyon Cliff Mass
      addBox(g, 4.4, 3.85, 1.85, 0, 2.18, -0.65, roseRock);
      addBox(g, 0.95, 3.95, 2.35, -1.78, 2.22, -0.25, roseRock);
      addBox(g, 0.95, 3.95, 2.35, 1.78, 2.22, -0.25, roseRock);
      // Carved Recessed Facade Cavity
      // Lower 6-Column Corinthian Portico & Triangular Pediment
      for (let i = 0; i < 6; i++) {
        const cx = -1.1 + i * 0.44;
        addCyl(g, 0.068, 0.075, 1.38, 12, cx, 1.05, 0.32, treasuryStone);
      }
      addBox(g, 2.55, 0.22, 0.32, 0, 1.82, 0.32, treasuryStone);
      addCyl(g, 0.88, 0.88, 0.28, 3, 0, 2.08, 0.34, treasuryStone, Math.PI / 2, 0, 0);
      // Upper Story: Broken Pediment Wings + Central Circular Tholos & Pharaoh's Urn
      for (const side of [-0.88, 0.88]) {
        addBox(g, 0.62, 1.05, 0.28, side, 2.68, 0.28, treasuryStone);
        addBox(g, 0.68, 0.16, 0.32, side, 3.26, 0.3, treasuryStone, 0, 0, side < 0 ? 0.28 : -0.28);
      }
      addCyl(g, 0.36, 0.38, 0.95, 16, 0, 2.68, 0.32, treasuryStone);
      addCone(g, 0.42, 0.42, 16, 0, 3.35, 0.32, treasuryStone);
      addSphere(g, 0.15, 0, 3.68, 0.32, goldMat, 1, 1.35, 1); // Pharaoh's Treasury Urn
      break;
    }

    case 16: {
      // 16. Chichen Itza El Castillo (Temple of Kukulcán)
      const mayaStone = mat(isMinimal ? 0xe2e8f0 : 0xcbd5e1, 0.75, 0.08);
      const darkMaya = mat(isMinimal ? 0x94a3b8 : 0x94a3b8, 0.8, 0.08);
      // 9 Stepped Talud-Tablero Limestone Terraces
      for (let t = 0; t < 9; t++) {
        const w = 3.55 - t * 0.31;
        const y = 0.38 + t * 0.26;
        addBox(g, w, 0.25, w, 0, y, 0, t % 2 === 0 ? mayaStone : darkMaya);
      }
      // 4 Steep Axial 91-Step Staircases with Balustrades
      for (let i = 0; i < 4; i++) {
        const stairGroup = new THREE.Group();
        stairGroup.rotation.y = (i * Math.PI) / 2;
        g.add(stairGroup);
        addBox(stairGroup, 0.68, 2.65, 0.22, 0, 1.42, 1.32, mayaStone, -0.52, 0, 0);
        // Feathered Serpent Heads at Base of Stair Balustrades
        addBox(stairGroup, 0.18, 0.22, 0.28, -0.32, 0.38, 1.98, accentMat);
        addBox(stairGroup, 0.18, 0.22, 0.28, 0.32, 0.38, 1.98, accentMat);
      }
      // Summit Square Temple of Kukulcán
      addBox(g, 0.92, 0.58, 0.92, 0, 2.88, 0, mayaStone);
      addBox(g, 0.98, 0.12, 0.98, 0, 3.2, 0, darkMaya);
      break;
    }

    case 17: {
      // 17. Angkor Wat Central Sanctuary (Five-Lotus Quincunx)
      const khmerStone = mat(isMinimal ? 0xe2e8f0 : 0x8c7a6b, 0.75, 0.08);
      const darkKhmer = mat(isMinimal ? 0x94a3b8 : 0x5c4e43, 0.8, 0.1);
      // Twin Reflecting Ponds & Naga Causeway
      addBox(g, 1.45, 0.04, 1.15, -1.35, 0.27, 1.55, waterMat);
      addBox(g, 1.45, 0.04, 1.15, 1.35, 0.27, 1.55, waterMat);
      addBox(g, 0.68, 0.08, 1.65, 0, 0.29, 1.45, khmerStone);
      // 3 Stepped Concentric Sandstone Gallery Terraces
      addBox(g, 3.65, 0.38, 3.15, 0, 0.45, -0.25, khmerStone);
      addBox(g, 2.75, 0.45, 2.45, 0, 0.85, -0.25, darkKhmer);
      addBox(g, 1.85, 0.52, 1.75, 0, 1.32, -0.25, khmerStone);
      // Helper to build a ribbed Khmer Lotus-Bud Prasat Tower
      const addLotusPrasat = (tx: number, ty: number, tz: number, scale: number) => {
        for (let tier = 0; tier < 6; tier++) {
          const r = (0.38 - tier * 0.052) * scale;
          addCyl(g, r * 0.85, r, 0.26 * scale, 12, tx, ty + tier * 0.24 * scale, tz, tier % 2 === 0 ? khmerStone : darkKhmer);
        }
        addCone(g, 0.12 * scale, 0.38 * scale, 12, tx, ty + 1.55 * scale, tz, goldMat);
      };
      // 4 Corner Lotus Towers + Soaring Central Bakan Lotus Tower
      for (const [cx, cz] of [
        [-0.95, -1.05],
        [0.95, -1.05],
        [-0.95, 0.55],
        [0.95, 0.55],
      ]) {
        addLotusPrasat(cx, 1.25, cz, 0.85);
      }
      addLotusPrasat(0, 1.68, -0.25, 1.25);
      break;
    }

    case 18: {
      // 18. The Pantheon (Rome)
      const romanBrick = mat(isMinimal ? 0xcbd5e1 : 0xa8553a, 0.72, 0.08);
      const travertine = mat(isMinimal ? 0xf8fafc : 0xd9c39e, 0.55, 0.1);
      const leadDome = mat(isMinimal ? 0x94a3b8 : 0x64748b, 0.5, 0.35);
      // Massive Cylindrical Roman Brick Rotunda Drum
      addCyl(g, 1.68, 1.68, 1.65, 32, 0, 1.08, -0.38, romanBrick);
      addCyl(g, 1.72, 1.72, 0.08, 32, 0, 1.32, -0.38, travertine);
      addCyl(g, 1.72, 1.72, 0.08, 32, 0, 1.88, -0.38, travertine);
      // 7 Stepped Rings & Hemispherical Dome + Open 9m Central Oculus
      for (let s = 0; s < 5; s++) {
        addCyl(g, 1.58 - s * 0.14, 1.66 - s * 0.14, 0.09, 32, 0, 1.96 + s * 0.08, -0.38, leadDome);
      }
      addSphere(g, 1.58, 0, 1.85, -0.38, leadDome, 1, 0.68, 1);
      addCyl(g, 0.32, 0.32, 0.12, 24, 0, 2.92, -0.38, warmGlow); // Glowing Open Oculus
      // Rectangular Intermediate Block & 8-Column Corinthian Front Portico
      addBox(g, 2.15, 1.68, 0.65, 0, 1.1, 1.15, romanBrick);
      addBox(g, 2.25, 0.16, 0.85, 0, 0.34, 1.65, travertine);
      for (let c = 0; c < 8; c++) {
        const cx = -0.98 + c * 0.28;
        addCyl(g, 0.055, 0.062, 1.15, 10, cx, 0.98, 1.92, travertine);
      }
      addBox(g, 2.25, 0.18, 0.72, 0, 1.62, 1.72, travertine);
      addCyl(g, 0.72, 0.72, 0.72, 3, 0, 1.92, 1.72, travertine, Math.PI / 2, 0, 0);
      break;
    }

    case 19: {
      // 19. Brandenburg Gate (Berlin)
      const sandstone = mat(isMinimal ? 0xf1f5f9 : 0xe2d9c8, 0.6, 0.1);
      const patinaBronze = mat(isMinimal ? 0x94a3b8 : 0x10b981, 0.4, 0.55);
      // Flanking Neoclassical Guardhouse Wings
      addBox(g, 0.88, 1.15, 1.25, -1.85, 0.82, 0, sandstone);
      addBox(g, 0.88, 1.15, 1.25, 1.85, 0.82, 0, sandstone);
      // 12 Fluted Doric Columns (2 Rows of 6) Forming 5 Drive Passages
      const colX = [-1.25, -0.78, -0.32, 0.32, 0.78, 1.25];
      for (const cx of colX) {
        for (const cz of [-0.38, 0.38]) {
          addCyl(g, 0.085, 0.098, 1.75, 14, cx, 1.12, cz, sandstone);
        }
        addBox(g, 0.16, 1.72, 0.68, cx, 1.12, 0, sandstone);
      }
      // Monumental Entablature & Stepped Attic Crown
      addBox(g, 2.95, 0.38, 1.05, 0, 2.18, 0, sandstone);
      addBox(g, 2.55, 0.32, 0.88, 0, 2.52, 0, sandstone);
      addBox(g, 1.25, 0.24, 0.72, 0, 2.78, 0, sandstone);
      // Bronze Quadriga: 4 Horses & Chariot of Winged Victory
      for (const hx of [-0.36, -0.12, 0.12, 0.36]) {
        addBox(g, 0.1, 0.28, 0.34, hx, 3.04, 0.18, patinaBronze);
        addBox(g, 0.08, 0.18, 0.12, hx, 3.2, 0.32, patinaBronze);
      }
      addBox(g, 0.32, 0.24, 0.24, 0, 3.02, -0.15, patinaBronze);
      addCyl(g, 0.07, 0.09, 0.42, 8, 0, 3.28, -0.15, patinaBronze);
      addCyl(g, 0.015, 0.015, 0.55, 6, 0.08, 3.45, -0.12, goldMat); // Victory Staff
      break;
    }

    case 20: {
      // 20. Arc de Triomphe (Paris)
      const parisStone = mat(isMinimal ? 0xf8fafc : 0xeae0d0, 0.58, 0.08);
      const trimStone = mat(isMinimal ? 0xcbd5e1 : 0xcfc1ab, 0.65, 0.1);
      // 12-Ray Star Pavement & Eternal Flame of Unknown Soldier at Center
      addCyl(g, 2.25, 2.25, 0.05, 12, 0, 0.27, 0, trimStone);
      addCyl(g, 0.22, 0.26, 0.08, 16, 0, 0.32, 0, goldMat);
      addSphere(g, 0.11, 0, 0.42, 0, warmGlow);
      // 4 Massive Corner Piers (forming Main Arch & Transverse Arch)
      for (const px of [-0.95, 0.95]) {
        addBox(g, 0.88, 2.15, 1.48, px, 1.32, 0, parisStone);
        // Sculptural High-Reliefs ("La Marseillaise") on Front & Back Pier Faces
        addBox(g, 0.48, 0.72, 0.14, px, 1.18, 0.76, trimStone);
        addBox(g, 0.48, 0.72, 0.14, px, 1.18, -0.76, trimStone);
      }
      // Upper Arch Bridge, Dentil Cornice & Attic Story with 30 Shields
      addBox(g, 2.82, 0.68, 1.54, 0, 2.42, 0, parisStone);
      addBox(g, 2.96, 0.14, 1.66, 0, 2.8, 0, trimStone);
      addBox(g, 2.76, 0.44, 1.44, 0, 3.08, 0, parisStone);
      for (let x = -1.15; x <= 1.15; x += 0.28) {
        addCyl(g, 0.07, 0.07, 0.05, 12, x, 3.08, 0.74, goldMat, Math.PI / 2, 0, 0);
      }
      break;
    }

    // ========================================================================
    // GROUP 3 (21..30): 10 EASTERN PALACES, PAGODAS & SACRED PAVILIONS
    // ========================================================================
    case 21: {
      // 21. Hall of Supreme Harmony (Forbidden City, Beijing)
      const whiteMarble = mat(isMinimal ? 0xf8fafc : 0xf8fafc, 0.45, 0.08);
      const vermilion = mat(isMinimal ? 0xcbd5e1 : 0xdc2626, 0.5, 0.15);
      const imperialYellow = mat(isMinimal ? 0x94a3b8 : 0xeab308, 0.32, 0.45);
      // 3-Tier White Marble Sumeru Terrace (三层汉白玉须弥座台基)
      addBox(g, 4.45, 0.28, 3.15, 0, 0.38, 0, whiteMarble);
      addBox(g, 4.05, 0.28, 2.75, 0, 0.66, 0, whiteMarble);
      addBox(g, 3.65, 0.28, 2.35, 0, 0.94, 0, whiteMarble);
      // Central Cloud-Dragon Carved Imperial Ramp & Flanking Steps
      addBox(g, 0.92, 0.95, 0.24, 0, 0.62, 1.42, whiteMarble, -0.68, 0, 0);
      addBox(g, 0.38, 0.85, 0.12, 0, 0.66, 1.46, goldMat, -0.68, 0, 0);
      // 11-Bay Vermilion Palace Hall & Columns
      addBox(g, 2.95, 0.92, 1.65, 0, 1.54, 0, vermilion);
      for (let ix = -1.35; ix <= 1.35; ix += 0.3) {
        addCyl(g, 0.05, 0.055, 0.92, 10, ix, 1.54, 0.88, vermilion);
        addCyl(g, 0.05, 0.055, 0.92, 10, ix, 1.54, -0.88, vermilion);
      }
      // Double-Eave Imperial Yellow Glazed Hip Roof (重檐庑殿顶)
      addCyl(g, 1.75, 2.25, 0.36, 4, 0, 2.15, 0, imperialYellow, 0, Math.PI / 4, 0);
      addBox(g, 2.45, 0.18, 1.35, 0, 2.38, 0, vermilion);
      addCyl(g, 0.85, 1.92, 0.58, 4, 0, 2.72, 0, imperialYellow, 0, Math.PI / 4, 0);
      // Ridge Bar & Golden Dragon Chiwen (正吻) Finials
      addBox(g, 1.45, 0.1, 0.12, 0, 3.04, 0, goldMat);
      addBox(g, 0.16, 0.24, 0.16, -0.72, 3.12, 0, goldMat);
      addBox(g, 0.16, 0.24, 0.16, 0.72, 3.12, 0, goldMat);
      break;
    }

    case 22: {
      // 22. Temple of Heaven (Hall of Prayer for Good Harvests, Beijing)
      const whiteMarble = mat(isMinimal ? 0xf8fafc : 0xf8fafc, 0.45, 0.08);
      const cobaltBlue = mat(isMinimal ? 0x94a3b8 : 0x1d4ed8, 0.3, 0.45);
      const vermilion = mat(isMinimal ? 0xcbd5e1 : 0xdc2626, 0.5, 0.15);
      // 3-Tier Circular White Marble Qigu Altar
      addCyl(g, 2.15, 2.22, 0.28, 32, 0, 0.38, 0, whiteMarble);
      addCyl(g, 1.78, 1.85, 0.28, 32, 0, 0.66, 0, whiteMarble);
      addCyl(g, 1.42, 1.48, 0.28, 32, 0, 0.94, 0, whiteMarble);
      addBox(g, 0.58, 0.92, 0.24, 0, 0.62, 1.85, whiteMarble, -0.68, 0, 0);
      // Circular Vermilion Drum & Golden Dougong Brackets
      addCyl(g, 1.05, 1.05, 0.92, 24, 0, 1.54, 0, vermilion);
      // Triple-Eave Circular Conical Cobalt-Blue Glazed Roof
      addCone(g, 1.38, 0.48, 28, 0, 2.12, 0, cobaltBlue);
      addCyl(g, 0.85, 0.85, 0.28, 24, 0, 2.38, 0, goldMat);
      addCone(g, 1.14, 0.48, 28, 0, 2.68, 0, cobaltBlue);
      addCyl(g, 0.65, 0.65, 0.26, 24, 0, 2.92, 0, goldMat);
      addCone(g, 0.92, 0.68, 28, 0, 3.36, 0, cobaltBlue);
      // Crowning Gilded Bronze Ball Finial (鎏金宝顶)
      addSphere(g, 0.16, 0, 3.78, 0, goldMat, 1, 1.3, 1);
      break;
    }

    case 23: {
      // 23. Kinkaku-ji (The Golden Pavilion, Kyoto)
      const goldLeaf = mat(isMinimal ? 0xcbd5e1 : 0xeab308, 0.22, 0.85);
      const darkWood = mat(isMinimal ? 0x94a3b8 : 0x5c4033, 0.65, 0.1);
      const whitePlaster = mat(isMinimal ? 0xf8fafc : 0xf5efe6, 0.6, 0.05);
      // Kyōko-chi Mirror Pond & Pine Rock Islets
      addBox(g, 4.6, 0.06, 4.6, 0, 0.27, 0, waterMat);
      addSphere(g, 0.42, 1.45, 0.34, 1.25, baseTrimMat, 1.4, 0.6, 1.1);
      addSphere(g, 0.32, 1.45, 0.65, 1.25, lawnMat, 1.3, 0.8, 1.2);
      // Stone Foundation & 1F Unpainted Wood + White Plaster Hosui-in + Fishing Deck
      addBox(g, 2.25, 0.24, 1.75, -0.15, 0.4, -0.15, baseTrimMat);
      addBox(g, 0.65, 0.12, 0.75, -1.45, 0.36, 0.15, darkWood); // Sosei-tei deck over pond
      addBox(g, 1.85, 0.72, 1.45, -0.15, 0.88, -0.15, whitePlaster);
      addPagodaRoofTier(g, 1.58, 0.42, 4, 1.42, darkWood, goldMat);
      // 2F Pure Gold-Leaf Cho-on-do (Samurai Style)
      addBox(g, 1.55, 0.68, 1.25, -0.15, 1.86, -0.15, goldLeaf);
      addPagodaRoofTier(g, 1.35, 0.42, 4, 2.38, darkWood, goldMat);
      // 3F Pure Gold-Leaf Kukyo-cho (Zen Style with Bell Windows)
      addBox(g, 1.05, 0.62, 0.95, -0.15, 2.78, -0.15, goldLeaf);
      addPagodaRoofTier(g, 1.08, 0.56, 4, 3.32, darkWood, goldMat);
      // Shining Golden Phoenix at Apex
      addSphere(g, 0.12, -0.15, 3.68, -0.15, goldLeaf, 0.8, 1.4, 1.2);
      addBox(g, 0.34, 0.14, 0.04, -0.15, 3.72, -0.15, goldLeaf);
      break;
    }

    case 24: {
      // 24. Fushimi Inari Taisha & Senbon Torii Tunnel (Kyoto)
      const vermilion = mat(isMinimal ? 0xcbd5e1 : 0xea580c, 0.4, 0.2);
      const darkSlate = mat(isMinimal ? 0x94a3b8 : 0x1e293b, 0.55, 0.2);
      // Two-Story Vermilion Romon Shrine Gatehouse in Foreground Left
      addBox(g, 1.75, 0.85, 1.15, -0.95, 0.7, 0.85, vermilion);
      addPagodaRoofTier(g, 1.25, 0.38, 4, 1.28, darkSlate, goldMat);
      addBox(g, 1.35, 0.65, 0.92, -0.95, 1.68, 0.85, vermilion);
      addPagodaRoofTier(g, 1.15, 0.48, 4, 2.22, darkSlate, goldMat);
      // White Guardian Kitsune Fox Statues Flanking Shrine Steps
      for (const fx of [-1.45, -0.45]) {
        addBox(g, 0.22, 0.25, 0.22, fx, 0.38, 1.68, baseTrimMat);
        addCone(g, 0.11, 0.34, 6, fx, 0.65, 1.68, primaryMat);
      }
      // Winding Uphill Tunnel of 16 Vermilion-and-Black Senbon Torii Gates
      for (let t = 0; t < 16; t++) {
        const tz = 1.65 - t * 0.22;
        const tx = 0.88 + Math.sin(t * 0.32) * 0.32;
        const ty = 0.28 + t * 0.065;
        const torii = new THREE.Group();
        torii.position.set(tx, ty, tz);
        torii.rotation.y = Math.cos(t * 0.32) * 0.22;
        g.add(torii);
        // 2 Black-Socked Vermilion Pillars + Kasagi & Nuki Crossbeams
        addCyl(torii, 0.04, 0.045, 0.72, 8, -0.34, 0.36, 0, vermilion);
        addCyl(torii, 0.04, 0.045, 0.72, 8, 0.34, 0.36, 0, vermilion);
        addCyl(torii, 0.046, 0.048, 0.16, 8, -0.34, 0.08, 0, darkSlate);
        addCyl(torii, 0.046, 0.048, 0.16, 8, 0.34, 0.08, 0, darkSlate);
        addBox(torii, 0.98, 0.07, 0.08, 0, 0.74, 0, darkSlate);
        addBox(torii, 0.92, 0.06, 0.07, 0, 0.69, 0, vermilion);
        addBox(torii, 0.82, 0.05, 0.06, 0, 0.56, 0, vermilion);
      }
      break;
    }

    case 25: {
      // 25. Potala Palace (Lhasa)
      const whiteWall = mat(isMinimal ? 0xf8fafc : 0xf8fafc, 0.55, 0.08);
      const redPalace = mat(isMinimal ? 0xcbd5e1 : 0x991b1b, 0.55, 0.12);
      const rockHill = mat(isMinimal ? 0x94a3b8 : 0x78716c, 0.85, 0.05);
      // Marpo Ri Red Hill Base & Zigzag Pilgrimage Stone Stairways
      addCyl(g, 1.85, 2.35, 0.95, 8, 0, 0.72, 0, rockHill);
      addBox(g, 2.25, 0.18, 0.22, -0.35, 0.68, 1.55, whiteWall, 0, 0, 0.22);
      addBox(g, 2.15, 0.18, 0.22, 0.35, 1.05, 1.38, whiteWall, 0, 0, -0.22);
      // Batter-Walled Stepped White Palace Wings (Potrang Karpo)
      addCyl(g, 0.82, 1.02, 1.35, 4, -1.05, 1.65, 0.12, whiteWall, 0, Math.PI / 4, 0);
      addCyl(g, 0.82, 1.02, 1.35, 4, 1.05, 1.65, 0.12, whiteWall, 0, Math.PI / 4, 0);
      addBox(g, 2.85, 1.15, 1.25, 0, 1.58, 0, whiteWall);
      // Central Towering Crimson Red Palace (Potrang Marpo)
      addCyl(g, 1.08, 1.24, 1.45, 4, 0, 2.48, -0.08, redPalace, 0, Math.PI / 4, 0);
      // 5 Crowning Golden Roof Pavilions (Rgya-phib) & Dhvaja Victory Banners
      for (const gx of [-0.65, 0, 0.65]) {
        addPagodaRoofTier(g, 0.42, 0.28, 4, 3.35, goldMat, goldMat);
        addBox(g, 0.48, 0.18, 0.38, gx, 3.24, -0.08, goldMat);
        addCone(g, 0.34, 0.26, 4, gx, 3.46, -0.08, goldMat, Math.PI / 4);
      }
      break;
    }

    case 26: {
      // 26. Yellow Crane Tower (Wuhan)
      const glazedGold = mat(isMinimal ? 0xcbd5e1 : 0xeab308, 0.3, 0.55);
      const vermilion = mat(isMinimal ? 0x94a3b8 : 0xdc2626, 0.48, 0.15);
      const whiteMarble = mat(isMinimal ? 0xf8fafc : 0xf8fafc, 0.45, 0.1);
      // Snake Hill 2-Tier White Marble Terrace
      addBox(g, 3.45, 0.32, 3.45, 0, 0.42, 0, whiteMarble);
      addBox(g, 2.75, 0.28, 2.75, 0, 0.72, 0, whiteMarble);
      // 5 Octagonal Stories with Dramatically Upturned Winged Golden Eaves
      for (let tier = 0; tier < 5; tier++) {
        const ty = 1.05 + tier * 0.62;
        const rCore = 0.96 - tier * 0.12;
        const rRoof = 1.42 - tier * 0.16;
        addCyl(g, rCore, rCore, 0.46, 8, 0, ty, 0, vermilion);
        addPagodaRoofTier(g, rRoof, 0.36, 8, ty + 0.28, glazedGold, goldMat);
      }
      // 5m Cast-Bronze Gilded Gourd Finial
      addSphere(g, 0.14, 0, 4.22, 0, goldMat, 1, 1.35, 1);
      addSphere(g, 0.09, 0, 4.46, 0, goldMat, 1, 1.35, 1);
      addCyl(g, 0.015, 0.03, 0.25, 8, 0, 4.68, 0, goldMat);
      break;
    }

    case 27: {
      // 27. Giant Wild Goose Pagoda (Xi'an)
      const tangBrick = mat(isMinimal ? 0xe2e8f0 : 0xa89f91, 0.78, 0.05);
      const darkBrick = mat(isMinimal ? 0x94a3b8 : 0x6b635b, 0.8, 0.08);
      // 4.2m Raised Square Brick Platform + Master Xuanzang Bronze Statue in Front
      addBox(g, 3.25, 0.42, 3.25, 0, 0.46, -0.15, darkBrick);
      addBox(g, 0.28, 0.24, 0.28, 0, 0.38, 1.92, darkBrick);
      addCyl(g, 0.07, 0.09, 0.42, 8, 0, 0.72, 1.92, goldMat);
      // 7 Distinctly Tapered Square Stories of Tang Masonry with Corbelled Eaves
      for (let s = 0; s < 7; s++) {
        const sy = 0.88 + s * 0.48;
        const w = 1.92 - s * 0.18;
        addBox(g, w, 0.38, w, 0, sy, -0.15, tangBrick);
        // Corbelled brick eave & cardinal arched niche
        addBox(g, w + 0.18, 0.1, w + 0.18, 0, sy + 0.21, -0.15, darkBrick);
        addBox(g, 0.22, 0.26, w + 0.04, 0, sy - 0.03, -0.15, darkBrick);
        addBox(g, w + 0.04, 0.26, 0.22, 0, sy - 0.03, -0.15, darkBrick);
      }
      // Pyramidal Brick Crown & Wheel-of-Law Stupa Finial
      addCone(g, 0.56, 0.28, 4, 0, 4.18, -0.15, darkBrick, Math.PI / 4);
      addCyl(g, 0.04, 0.12, 0.48, 12, 0, 4.52, -0.15, goldMat);
      break;
    }

    case 28: {
      // 28. Gyeongbokgung Geunjeongjeon (Royal Throne Hall, Seoul)
      const whiteGranite = mat(isMinimal ? 0xf8fafc : 0xf1f5f9, 0.55, 0.08);
      const darkTile = mat(isMinimal ? 0x94a3b8 : 0x1e293b, 0.55, 0.2);
      const vermilion = mat(isMinimal ? 0xcbd5e1 : 0xdc2626, 0.5, 0.15);
      const dancheongJade = mat(isMinimal ? 0x94a3b8 : 0x10b981, 0.45, 0.2);
      // 2-Tier White Granite Wolde Terrace + 2 Rows of Official Rank Stones (Pumgyeseok)
      addBox(g, 3.85, 0.3, 2.65, 0, 0.4, -0.35, whiteGranite);
      addBox(g, 3.25, 0.28, 2.15, 0, 0.68, -0.35, whiteGranite);
      for (let r = 0; r < 4; r++) {
        addBox(g, 0.1, 0.24, 0.1, -0.58, 0.36, 1.15 + r * 0.28, whiteGranite);
        addBox(g, 0.1, 0.24, 0.1, 0.58, 0.36, 1.15 + r * 0.28, whiteGranite);
      }
      // Vermilion Column Hall + Jade-Green Dancheong Bracket Frieze
      addBox(g, 2.55, 0.88, 1.55, 0, 1.26, -0.35, vermilion);
      addBox(g, 2.62, 0.16, 1.62, 0, 1.65, -0.35, dancheongJade);
      // Double-Eave Korean Hip-and-Gable Dark Grey Tile Roof (重檐歇山顶)
      addPagodaRoofTier(g, 1.98, 0.38, 4, 1.92, darkTile, dancheongJade);
      addBox(g, 1.95, 0.34, 1.18, 0, 2.2, -0.35, vermilion);
      addBox(g, 2.02, 0.14, 1.24, 0, 2.38, -0.35, dancheongJade);
      addPagodaRoofTier(g, 1.65, 0.55, 4, 2.68, darkTile, goldMat);
      break;
    }

    case 29: {
      // 29. Shwedagon Pagoda (99m Solid-Gold Bell Stupa, Yangon)
      const solidGold = mat(isMinimal ? 0xcbd5e1 : 0xfacc15, 0.2, 0.88);
      const deepGold = mat(isMinimal ? 0x94a3b8 : 0xd97706, 0.28, 0.78);
      // Octagonal Terraced Plinth + Ring of 12 Smaller Golden Planetary Stupas
      addCyl(g, 1.95, 2.15, 0.32, 8, 0, 0.42, 0, deepGold);
      addCyl(g, 1.48, 1.65, 0.34, 8, 0, 0.74, 0, solidGold);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const sx = Math.cos(a) * 1.82;
        const sz = Math.sin(a) * 1.82;
        addCone(g, 0.15, 0.55, 12, sx, 0.82, sz, solidGold);
      }
      // Bell-Shaped Main Stupa Dome, Molded Rings, Lotus Petals & Banana-Bud Spire
      addCyl(g, 0.92, 1.28, 0.65, 28, 0, 1.22, 0, deepGold);
      addSphere(g, 0.92, 0, 1.68, 0, solidGold, 1, 1.15, 1); // Bell dome
      for (let r = 0; r < 5; r++) {
        addCyl(g, 0.62 - r * 0.08, 0.66 - r * 0.08, 0.14, 24, 0, 2.25 + r * 0.14, 0, deepGold);
      }
      addCone(g, 0.34, 1.15, 24, 0, 3.45, 0, solidGold);
      // Jewelled Umbrella Crown (Hti) & 76-Carat Diamond Orb
      addCyl(g, 0.22, 0.08, 0.18, 16, 0, 4.12, 0, goldMat);
      addSphere(g, 0.09, 0, 4.35, 0, warmGlow);
      break;
    }

    case 30: {
      // 30. Borobudur Mandala Stupa (Java)
      const volcanicStone = mat(isMinimal ? 0xcbd5e1 : 0x64748b, 0.82, 0.08);
      const darkAndesite = mat(isMinimal ? 0x94a3b8 : 0x475569, 0.85, 0.1);
      // 6 Concentric Square Andesite Terraces
      for (let t = 0; t < 6; t++) {
        const w = 3.85 - t * 0.42;
        const y = 0.36 + t * 0.22;
        addBox(g, w, 0.22, w, 0, y, 0, t % 2 === 0 ? volcanicStone : darkAndesite);
      }
      // 4 Axial Kala-Makara Stairways
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        addBox(g, 0.45, 1.45, 0.35, Math.sin(a) * 1.45, 0.95, Math.cos(a) * 1.45, darkAndesite);
      }
      // 3 Circular Upper Arupadhatu Terraces Ringed by Perforated Bell Stupas
      for (let c = 0; c < 3; c++) {
        const r = 1.12 - c * 0.26;
        const cy = 1.68 + c * 0.22;
        addCyl(g, r, r, 0.2, 28, 0, cy, 0, volcanicStone);
        const stupaCount = 12 - c * 3;
        for (let s = 0; s < stupaCount; s++) {
          const sa = (s / stupaCount) * Math.PI * 2;
          addCone(g, 0.09, 0.26, 10, Math.cos(sa) * (r - 0.12), cy + 0.2, Math.sin(sa) * (r - 0.12), darkAndesite);
        }
      }
      // Monumental Central Nirvana Main Stupa
      addCyl(g, 0.38, 0.44, 0.45, 20, 0, 2.42, 0, darkAndesite);
      addCone(g, 0.38, 0.55, 20, 0, 2.85, 0, volcanicStone);
      addCyl(g, 0.06, 0.12, 0.45, 10, 0, 3.28, 0, goldMat);
      break;
    }

    // ========================================================================
    // GROUP 4 (31..40): 10 ROYAL PALACES, OPERA HOUSES & CIVIC LANDMARKS
    // ========================================================================
    case 31: {
      // 31. Sydney Opera House (Expressionist Spherical White Shells)
      const shellWhite = mat(isMinimal ? 0xffffff : 0xf8fafc, 0.28, 0.15);
      const redGranite = mat(isMinimal ? 0xcbd5e1 : 0xb45309, 0.72, 0.08);
      const bronzeGlass = mat(isMinimal ? 0x94a3b8 : 0x78350f, 0.25, 0.65);
      // Sydney Harbor Water Surround + Bennelong Red-Granite Podium & Steps
      addBox(g, 5.0, 0.06, 5.0, 0, 0.26, 0, waterMat);
      addBox(g, 3.85, 0.44, 2.65, 0, 0.48, -0.15, redGranite);
      for (let st = 0; st < 5; st++) {
        addBox(g, 3.25, 0.08, 0.25, 0, 0.32 + st * 0.07, 1.25 - st * 0.16, redGranite);
      }
      // Helper to build an interlocking Utzon vaulted white shell
      const addOperaShell = (x: number, y: number, z: number, sx: number, sy: number, sz: number, tiltX: number, rotY = 0) => {
        const shellGroup = new THREE.Group();
        shellGroup.position.set(x, y, z);
        shellGroup.rotation.set(tiltX, rotY, 0);
        g.add(shellGroup);
        const shell = new THREE.Mesh(new THREE.ConeGeometry(0.68, 1.55, 4), shellWhite);
        shell.scale.set(sx, sy, sz);
        shell.rotation.y = Math.PI / 4;
        shellGroup.add(shell);
        const glass = new THREE.Mesh(new THREE.ConeGeometry(0.56, 1.32, 4), bronzeGlass);
        glass.scale.set(sx * 0.85, sy * 0.85, sz * 0.35);
        glass.position.set(0, -0.08, 0.18);
        glass.rotation.y = Math.PI / 4;
        shellGroup.add(glass);
      };
      // Main Concert Hall Cluster (Left: 4 Ascending Shells)
      addOperaShell(-0.68, 1.25, -0.75, 0.9, 1.05, 1.15, 0.38);
      addOperaShell(-0.68, 1.55, -0.25, 1.1, 1.42, 1.35, 0.35);
      addOperaShell(-0.68, 1.75, 0.28, 1.2, 1.65, 1.45, 0.32);
      addOperaShell(-0.68, 1.35, 0.78, 0.88, 1.1, 1.1, -0.35);
      // Joan Sutherland Opera Theatre Cluster (Right: 4 Ascending Shells)
      addOperaShell(0.72, 1.15, -0.68, 0.78, 0.92, 1.0, 0.38, 0.08);
      addOperaShell(0.72, 1.42, -0.18, 0.95, 1.25, 1.2, 0.35, 0.08);
      addOperaShell(0.72, 1.58, 0.32, 1.05, 1.42, 1.3, 0.32, 0.08);
      addOperaShell(0.72, 1.22, 0.78, 0.76, 0.95, 0.98, -0.35, 0.08);
      break;
    }

    case 32: {
      // 32. Palace of Versailles (Hall of Mirrors Wing & Cour d'Honneur)
      const versaillesStone = mat(isMinimal ? 0xf8fafc : 0xe8dcc8, 0.55, 0.1);
      const slateRoof = mat(isMinimal ? 0x94a3b8 : 0x475569, 0.5, 0.25);
      // Latona Parterre Fountain & Gilded Grille Royale Forecourt
      addCyl(g, 0.58, 0.62, 0.08, 24, 0, 0.29, 1.65, waterMat);
      addSphere(g, 0.16, 0, 0.42, 1.65, goldMat);
      // U-Shaped Classical Palace Wings & 17-Bay Hall of Mirrors Central Corps
      addBox(g, 3.85, 1.35, 1.35, 0, 0.94, -0.35, versaillesStone);
      addBox(g, 0.95, 1.28, 1.45, -1.52, 0.9, 0.45, versaillesStone);
      addBox(g, 0.95, 1.28, 1.45, 1.52, 0.9, 0.45, versaillesStone);
      // Arched Hall of Mirrors Windows & Ionic Colonnade on 2nd Story
      for (let x = -1.55; x <= 1.55; x += 0.31) {
        addBox(g, 0.16, 0.52, 1.39, x, 1.08, -0.35, warmGlow);
        addCyl(g, 0.035, 0.035, 0.56, 8, x + 0.15, 1.08, 0.35, versaillesStone);
      }
      // Roof Trophy Balustrade & Gilded Royal Chapel Lead Roof on Right
      addBox(g, 3.92, 0.14, 1.42, 0, 1.66, -0.35, goldMat);
      addBox(g, 0.68, 0.72, 1.15, 1.45, 1.85, -0.45, versaillesStone);
      addCyl(g, 0.36, 0.36, 1.15, 3, 1.45, 2.38, -0.45, slateRoof, Math.PI / 2, 0, 0);
      addBox(g, 0.08, 0.16, 1.18, 1.45, 2.58, -0.45, goldMat);
      break;
    }

    case 33: {
      // 33. Schönbrunn Palace (Vienna)
      const schonbrunnYellow = mat(isMinimal ? 0xf1f5f9 : 0xeab308, 0.55, 0.12);
      const shutterGreen = mat(isMinimal ? 0x94a3b8 : 0x15803d, 0.55, 0.15);
      // Imperial Parterres & Neptune Fountain Basin
      addBox(g, 1.45, 0.05, 0.85, -1.25, 0.27, 1.45, lawnMat);
      addBox(g, 1.45, 0.05, 0.85, 1.25, 0.27, 1.45, lawnMat);
      addCyl(g, 0.52, 0.55, 0.07, 20, 0, 0.28, 1.55, waterMat);
      // 175m Symmetrical "Schönbrunn Yellow" Baroque Palace Facade
      addBox(g, 4.15, 1.38, 1.35, 0, 0.95, -0.35, schonbrunnYellow);
      addBox(g, 1.35, 1.56, 1.52, 0, 1.04, -0.32, schonbrunnYellow);
      // Emerald-Green Window Shutters & White Pilasters
      for (let x = -1.85; x <= 1.85; x += 0.37) {
        addBox(g, 0.18, 0.38, 1.39, x, 1.18, -0.35, shutterGreen);
        addBox(g, 0.18, 0.34, 1.39, x, 0.65, -0.35, shutterGreen);
      }
      // Double-Curving Imperial Garden Staircase
      addBox(g, 1.45, 0.42, 0.55, 0, 0.46, 0.58, basePlazaMat);
      // Rooftop Balustrade & Habsburg Double-Headed Golden Eagle Crest
      addBox(g, 4.22, 0.12, 1.42, 0, 1.68, -0.35, basePlazaMat);
      addSphere(g, 0.22, 0, 1.98, -0.25, goldMat, 1.3, 1, 0.5);
      break;
    }

    case 34: {
      // 34. The Winter Palace / State Hermitage (St. Petersburg)
      const mintTurquoise = mat(isMinimal ? 0xe2e8f0 : 0x2dd4bf, 0.48, 0.15);
      const pureWhite = mat(isMinimal ? 0xffffff : 0xffffff, 0.35, 0.1);
      const redGranite = mat(isMinimal ? 0x94a3b8 : 0x991b1b, 0.45, 0.2);
      // 47m Monolithic Red-Granite Alexander Column in Palace Square Foreground
      addBox(g, 0.42, 0.32, 0.42, 0, 0.42, 1.65, redGranite);
      addCyl(g, 0.08, 0.095, 1.45, 16, 0, 1.28, 1.65, redGranite);
      addSphere(g, 0.11, 0, 2.08, 1.65, goldMat);
      // Mint-Turquoise Baroque Facade with 2 Tiers of Pure White Corinthian Columns
      addBox(g, 4.15, 1.45, 1.45, 0, 0.98, -0.45, mintTurquoise);
      for (let x = -1.92; x <= 1.92; x += 0.32) {
        addCyl(g, 0.042, 0.045, 1.38, 10, x, 0.98, 0.3, pureWhite);
        addBox(g, 0.18, 0.12, 0.08, x, 1.38, 0.3, goldMat); // Gilded Baroque window pediment
      }
      // Central 3-Arch Palace Gate & Golden Onion Chapel Dome
      addBox(g, 1.15, 1.58, 1.58, 0, 1.05, -0.42, mintTurquoise);
      addSphere(g, 0.28, 1.15, 1.92, -0.45, goldMat, 1, 1.25, 1);
      // Rooftop White Statues Along Balustrade
      for (let x = -1.8; x <= 1.8; x += 0.45) {
        addCyl(g, 0.035, 0.04, 0.22, 6, x, 1.82, 0.25, pureWhite);
      }
      break;
    }

    case 35: {
      // 35. Buckingham Palace & Victoria Memorial (London)
      const portlandStone = mat(isMinimal ? 0xf8fafc : 0xe5dec9, 0.55, 0.08);
      const darkGate = mat(isMinimal ? 0x94a3b8 : 0x1e293b, 0.5, 0.4);
      // White Marble Victoria Memorial with Gilded Winged Victory in Forecourt
      addCyl(g, 0.65, 0.72, 0.16, 20, 0, 0.34, 1.58, portlandStone);
      addCyl(g, 0.18, 0.24, 0.78, 12, 0, 0.78, 1.58, portlandStone);
      addSphere(g, 0.14, 0, 1.28, 1.58, goldMat, 1.2, 1.3, 0.8);
      // Black-and-Gold Wrought Iron Forecourt Fence + Red King's Guard Sentry Boxes
      addBox(g, 3.65, 0.24, 0.06, 0, 0.38, 0.82, darkGate);
      addBox(g, 0.18, 0.32, 0.18, -0.85, 0.42, 0.92, darkGate);
      addBox(g, 0.18, 0.32, 0.18, 0.85, 0.42, 0.92, darkGate);
      // Symmetrical Aston Webb Portland-Stone East Facade
      addBox(g, 4.15, 1.48, 1.38, 0, 1.0, -0.42, portlandStone);
      addBox(g, 0.95, 1.62, 1.48, -1.62, 1.06, -0.38, portlandStone);
      addBox(g, 0.95, 1.62, 1.48, 1.62, 1.06, -0.38, portlandStone);
      addBox(g, 1.15, 1.68, 1.52, 0, 1.1, -0.36, portlandStone);
      // Central Crimson-Draped Royal Balcony & Classical Pediments
      addBox(g, 0.62, 0.16, 0.22, 0, 1.05, 0.45, mat(0x991b1b, 0.5, 0.2));
      for (let x = -1.75; x <= 1.75; x += 0.35) {
        addCyl(g, 0.045, 0.045, 1.15, 10, x, 1.08, 0.38, portlandStone);
      }
      addCyl(g, 0.52, 0.52, 0.32, 3, 0, 1.98, 0.32, portlandStone, Math.PI / 2, 0, 0);
      break;
    }

    case 36: {
      // 36. United States Capitol (Washington D.C.)
      const capitolWhite = mat(isMinimal ? 0xffffff : 0xf8fafc, 0.4, 0.1);
      const domeGrey = mat(isMinimal ? 0xcbd5e1 : 0xe2e8f0, 0.45, 0.2);
      // Reflecting Pool & Broad East Front Marble Steps
      addBox(g, 1.85, 0.05, 0.95, 0, 0.27, 1.75, waterMat);
      addBox(g, 1.45, 0.38, 0.65, 0, 0.44, 0.72, capitolWhite);
      // Symmetrical Senate (North) & House (South) White Marble Wings + Central Rotunda Block
      addBox(g, 4.35, 1.08, 1.35, 0, 0.8, -0.2, capitolWhite);
      addBox(g, 1.25, 1.18, 1.55, -1.58, 0.85, -0.2, capitolWhite);
      addBox(g, 1.25, 1.18, 1.55, 1.58, 0.85, -0.2, capitolWhite);
      addBox(g, 1.45, 1.22, 1.65, 0, 0.88, -0.15, capitolWhite);
      addCyl(g, 0.65, 0.65, 0.35, 3, 0, 1.58, 0.55, capitolWhite, Math.PI / 2, 0, 0);
      // 88m Tiered Wedding-Cake Cast-Iron Capitol Dome + 36 Peristyle Columns
      addCyl(g, 0.86, 0.92, 0.55, 28, 0, 1.72, -0.2, capitolWhite);
      for (let c = 0; c < 18; c++) {
        const a = (c / 18) * Math.PI * 2;
        addCyl(g, 0.03, 0.03, 0.52, 8, Math.cos(a) * 0.91, 1.72, -0.2 + Math.sin(a) * 0.91, domeGrey);
      }
      addCyl(g, 0.68, 0.75, 0.38, 24, 0, 2.18, -0.2, capitolWhite);
      addSphere(g, 0.68, 0, 2.38, -0.2, domeGrey, 1, 1.15, 1);
      // Tholos Lantern & Bronze Statue of Freedom
      addCyl(g, 0.16, 0.2, 0.38, 12, 0, 3.22, -0.2, capitolWhite);
      addCyl(g, 0.05, 0.07, 0.32, 8, 0, 3.55, -0.2, goldMat);
      break;
    }

    case 37: {
      // 37. Hungarian Parliament Building (Budapest)
      const stoneCream = mat(isMinimal ? 0xf8fafc : 0xefece6, 0.55, 0.1);
      const redDome = mat(isMinimal ? 0x94a3b8 : 0xb91c1c, 0.45, 0.25);
      // Danube Riverfront Blue Water Channel in Foreground
      addBox(g, 5.0, 0.06, 1.25, 0, 0.27, 1.78, waterMat);
      // 268m Symmetrical Neo-Gothic Riverfront Facade
      addBox(g, 4.35, 1.15, 1.25, 0, 0.84, -0.25, stoneCream);
      addBox(g, 4.15, 0.28, 1.32, 0, 1.32, -0.25, redDome);
      // 18 Lace-Like Neo-Gothic Pinnacles & Flying Buttress Bays
      for (let x = -1.95; x <= 1.95; x += 0.3) {
        addBox(g, 0.07, 1.35, 1.32, x, 0.92, -0.25, stoneCream);
        addCone(g, 0.065, 0.42, 4, x, 1.78, 0.38, stoneCream);
      }
      // Twin Tall Gothic Belfry Spires Flanking the Dome
      for (const sx of [-0.95, 0.95]) {
        addBox(g, 0.36, 1.65, 0.36, sx, 1.55, -0.25, stoneCream);
        addCone(g, 0.26, 0.95, 4, sx, 2.82, -0.25, redDome, Math.PI / 4);
      }
      // 96m Central 16-Sided Red-Ribbed Renaissance Revival Dome
      addCyl(g, 0.68, 0.74, 0.72, 16, 0, 1.68, -0.25, stoneCream);
      addSphere(g, 0.68, 0, 2.08, -0.25, redDome, 1, 1.35, 1);
      addCone(g, 0.14, 0.72, 8, 0, 3.28, -0.25, goldMat);
      break;
    }

    case 38: {
      // 38. Palais Garnier Opera House (Paris)
      const beauxStone = mat(isMinimal ? 0xf8fafc : 0xe5dec9, 0.55, 0.1);
      const copperGreen = mat(isMinimal ? 0x94a3b8 : 0x0f766e, 0.45, 0.35);
      // Monumental Opera Steps & 2-Story Paired-Column Beaux-Arts Loggia Facade
      addBox(g, 2.45, 0.25, 0.65, 0, 0.38, 1.25, beauxStone);
      addBox(g, 3.15, 1.38, 1.55, 0, 0.95, 0.25, beauxStone);
      for (let x = -1.35; x <= 1.35; x += 0.38) {
        addCyl(g, 0.045, 0.045, 0.75, 10, x, 1.12, 1.05, goldMat);
      }
      addBox(g, 3.25, 0.22, 1.62, 0, 1.68, 0.25, goldMat);
      // Patina-Green Copper Auditorium Dome Over Middle Section
      addCyl(g, 0.95, 1.02, 0.32, 24, 0, 1.88, -0.05, beauxStone);
      addSphere(g, 0.95, 0, 1.98, -0.05, copperGreen, 1, 0.62, 1);
      addSphere(g, 0.16, 0, 2.65, -0.05, goldMat);
      // Tall Stage Fly-Tower Gable Behind Dome Crowned by Apollo Raising the Golden Lyre
      addBox(g, 2.65, 2.15, 1.15, 0, 1.35, -0.95, beauxStone);
      addCyl(g, 0.85, 0.85, 1.18, 3, 0, 2.68, -0.95, copperGreen, Math.PI / 2, 0, 0);
      addSphere(g, 0.18, 0, 3.28, -0.95, goldMat, 1, 1.4, 1); // Apollo & Golden Lyre
      addSphere(g, 0.14, -1.18, 2.52, -0.95, goldMat); // Winged Pegasus Left
      addSphere(g, 0.14, 1.18, 2.52, -0.95, goldMat); // Winged Pegasus Right
      break;
    }

    case 39: {
      // 39. Casa Batlló (Antoni Gaudí Dragon House, Barcelona)
      const mosaicBlue = mat(isMinimal ? 0xe2e8f0 : 0x38bdf8, 0.3, 0.35);
      const dragonPink = mat(isMinimal ? 0xcbd5e1 : 0xf472b6, 0.28, 0.45);
      const boneStone = mat(isMinimal ? 0xf8fafc : 0xe5dec9, 0.6, 0.08);
      // Narrow 6-Story Passeig de Gràcia Townhouse Mass
      addBox(g, 2.15, 2.75, 1.45, 0, 1.62, 0, mosaicBlue);
      // Ground & Noble Floor Organic Bone-Shaped Sandstone Columns & Oval Windows
      addBox(g, 2.22, 0.95, 0.28, 0, 0.72, 0.68, boneStone);
      for (let x = -0.78; x <= 0.78; x += 0.39) {
        addCyl(g, 0.045, 0.08, 0.88, 10, x, 0.72, 0.82, boneStone);
      }
      // 9 Sculptural Venetian-Mask Balconies on the Undulating Trencadís Facade
      for (let floor = 0; floor < 3; floor++) {
        for (const bx of [-0.62, 0, 0.62]) {
          addSphere(g, 0.18, bx, 1.45 + floor * 0.46, 0.78, boneStone, 1.2, 0.65, 0.65);
        }
      }
      // Arched Iridescent Ceramic-Scale Dragon-Back Roof & Spine Crests
      addCyl(g, 0.75, 0.75, 2.18, 16, 0, 3.02, 0, dragonPink, 0, 0, Math.PI / 2);
      for (let s = 0; s < 8; s++) {
        addSphere(g, 0.14 - s * 0.01, -0.82 + s * 0.24, 3.72 - Math.abs(s - 3) * 0.05, 0.12, goldMat);
      }
      // Bulbous Garlic Turret & Gaudí's Four-Armed St. George Cross
      addCyl(g, 0.16, 0.22, 0.68, 12, -0.78, 3.45, 0.38, boneStone);
      addSphere(g, 0.22, -0.78, 3.85, 0.38, boneStone, 1, 1.3, 1);
      addBox(g, 0.32, 0.06, 0.06, -0.78, 4.18, 0.38, goldMat);
      addBox(g, 0.06, 0.32, 0.06, -0.78, 4.18, 0.38, goldMat);
      break;
    }

    case 40: {
      // 40. Marina Bay Sands (3 Inclined Towers & Cantilevered SkyPark Ship, Singapore)
      const towerGlass = mat(isMinimal ? 0xcbd5e1 : 0x93c5fd, 0.2, 0.75);
      const hullWhite = mat(isMinimal ? 0xf8fafc : 0xf8fafc, 0.35, 0.25);
      // Marina Bay Waterfront + White Lotus-Shaped ArtScience Museum in Foreground
      addBox(g, 5.0, 0.06, 1.55, 0, 0.27, 1.65, waterMat);
      for (let p = 0; p < 8; p++) {
        const a = (p / 8) * Math.PI * 2;
        addCone(g, 0.16, 0.45, 6, 1.45 + Math.cos(a) * 0.22, 0.52, 1.35 + Math.sin(a) * 0.22, hullWhite);
      }
      // 3 Soaring 55-Story Slanted Hotel Towers (each formed by 2 converging legs)
      for (const tx of [-1.28, 0, 1.28]) {
        addBox(g, 0.56, 3.25, 0.36, tx, 1.88, -0.32, towerGlass, 0.09, 0, 0);
        addBox(g, 0.56, 3.25, 0.36, tx, 1.88, 0.12, towerGlass, -0.04, 0, 0);
      }
      // 340m Cantilevered SkyPark Ship Hull Bridging All 3 Towers at y=3.55
      addBox(g, 3.85, 0.24, 0.85, 0.25, 3.55, -0.1, hullWhite);
      // 67m Cantilevered Ship Bow Overhang on Right + Rounded Stern on Left
      addCyl(g, 0.42, 0.42, 0.24, 16, 2.18, 3.55, -0.1, hullWhite);
      addCyl(g, 0.42, 0.42, 0.24, 16, -1.68, 3.55, -0.1, hullWhite);
      // 150m Rooftop Turquoise Infinity Pool & Tropical Palm Grove
      addBox(g, 2.45, 0.06, 0.38, -0.15, 3.69, 0.12, waterMat);
      for (let px = -1.35; px <= 1.85; px += 0.45) {
        addSphere(g, 0.11, px, 3.78, -0.28, lawnMat);
      }
      break;
    }

    // ========================================================================
    // GROUP 5 (41..50): 10 ICONIC BRIDGES, STATUES & MODERN MARVELS
    // ========================================================================
    case 41: {
      // 41. Tower Bridge (London)
      const gothicStone = mat(isMinimal ? 0xf1f5f9 : 0xd6cfc2, 0.6, 0.1);
      const bridgeBlue = mat(isMinimal ? 0x94a3b8 : 0x38bdf8, 0.35, 0.5);
      const slateRoof = mat(isMinimal ? 0x64748b : 0x1e293b, 0.55, 0.25);
      // River Thames Water Channel & Boat-Shaped Stone Bridge Piers
      addBox(g, 5.0, 0.08, 3.2, 0, 0.27, 0, waterMat);
      for (const px of [-1.05, 1.05]) {
        addCyl(g, 0.48, 0.54, 0.48, 8, px, 0.48, 0, baseTrimMat);
        // Twin 65m Victorian Gothic Bridge Towers with 4 Corner Turrets & Steep Roof
        addBox(g, 0.68, 2.15, 0.68, px, 1.75, 0, gothicStone);
        addCone(g, 0.46, 0.68, 4, px, 3.12, 0, slateRoof, Math.PI / 4);
        for (const cx of [-0.28, 0.28]) {
          for (const cz of [-0.28, 0.28]) {
            addCone(g, 0.11, 0.48, 4, px + cx, 3.05, cz, gothicStone, Math.PI / 4);
          }
        }
      }
      // Twin High-Level Pedestrian Walkways at y=2.48
      addBox(g, 1.55, 0.2, 0.16, 0, 2.48, -0.22, bridgeBlue);
      addBox(g, 1.55, 0.2, 0.16, 0, 2.48, 0.22, bridgeBlue);
      // Central Bascule Leaves Slightly Raised for Passing Ships + Approach Roadways
      addBox(g, 0.68, 0.1, 0.58, -0.58, 0.92, 0, slateRoof, 0, 0, 0.38);
      addBox(g, 0.68, 0.1, 0.58, 0.58, 0.92, 0, slateRoof, 0, 0, -0.38);
      addBox(g, 1.15, 0.1, 0.58, -1.92, 0.78, 0, slateRoof);
      addBox(g, 1.15, 0.1, 0.58, 1.92, 0.78, 0, slateRoof);
      // Iconic Sky-Blue & White Parabolic Suspension Chains on Both Sides
      addStrut(g, new THREE.Vector3(-1.05, 2.35, 0), new THREE.Vector3(-2.42, 0.82, 0), 0.055, bridgeBlue);
      addStrut(g, new THREE.Vector3(1.05, 2.35, 0), new THREE.Vector3(2.42, 0.82, 0), 0.055, bridgeBlue);
      break;
    }

    case 42: {
      // 42. Golden Gate Bridge (San Francisco)
      const intlOrange = mat(isMinimal ? 0x94a3b8 : 0xc2410c, 0.42, 0.45);
      // Golden Gate Strait Ocean Channel & Concrete Pier Fender Rings
      addBox(g, 5.0, 0.08, 3.4, 0, 0.27, 0, waterMat);
      for (const tx of [-1.25, 1.25]) {
        addCyl(g, 0.45, 0.52, 0.38, 16, tx, 0.42, 0, baseTrimMat);
        // 227m Stepped Art Deco Twin-Leg Steel Tower in International Orange
        for (const lz of [-0.28, 0.28]) {
          addBox(g, 0.22, 3.25, 0.2, tx, 2.18, lz, intlOrange);
          addBox(g, 0.16, 0.85, 0.14, tx, 4.05, lz, intlOrange);
        }
        // 4 Horizontal Art Deco Portal Struts Above Roadway
        for (const py of [1.85, 2.55, 3.25, 3.95]) {
          addBox(g, 0.18, 0.16, 0.58, tx, py, 0, intlOrange);
        }
      }
      // 6-Lane Steel Truss Highway Deck
      addBox(g, 4.95, 0.14, 0.68, 0, 1.22, 0, intlOrange);
      // Sweeping Parabolic Main Suspension Cables & Vertical Suspender Ropes
      for (const cz of [-0.28, 0.28]) {
        for (let i = 0; i < 16; i++) {
          const x1 = -1.25 + (i / 16) * 2.5;
          const x2 = -1.25 + ((i + 1) / 16) * 2.5;
          const y1 = 1.48 + Math.pow(x1 / 1.25, 2) * 2.65;
          const y2 = 1.48 + Math.pow(x2 / 1.25, 2) * 2.65;
          addStrut(g, new THREE.Vector3(x1, y1, cz), new THREE.Vector3(x2, y2, cz), 0.035, intlOrange);
          addCyl(g, 0.012, 0.012, y1 - 1.22, 6, x1, 1.22 + (y1 - 1.22) / 2, cz, intlOrange);
        }
        addStrut(g, new THREE.Vector3(-1.25, 4.12, cz), new THREE.Vector3(-2.45, 1.25, cz), 0.035, intlOrange);
        addStrut(g, new THREE.Vector3(1.25, 4.12, cz), new THREE.Vector3(2.45, 1.25, cz), 0.035, intlOrange);
      }
      break;
    }

    case 43: {
      // 43. Statue of Liberty & Star-Fort Pedestal (New York Harbor)
      const granite = mat(isMinimal ? 0xe2e8f0 : 0xd6cfc2, 0.65, 0.08);
      const copperPatina = mat(isMinimal ? 0x94a3b8 : 0x5eead4, 0.45, 0.35);
      // New York Harbor Water + 11-Point Star-Shaped Fort Wood Bastion
      addBox(g, 5.0, 0.06, 5.0, 0, 0.27, 0, waterMat);
      for (let p = 0; p < 11; p++) {
        addCone(g, 1.55, 0.38, 3, 0, 0.45, 0, baseTrimMat, (p / 11) * Math.PI * 2);
      }
      // 47m Richard Morris Hunt Rusticated Granite Pedestal with Loggia Columns
      addBox(g, 1.55, 0.48, 1.55, 0, 0.78, 0, granite);
      addBox(g, 1.18, 1.25, 1.18, 0, 1.62, 0, granite);
      addBox(g, 1.32, 0.16, 1.32, 0, 2.28, 0, granite);
      // 46m Verdigris-Green Copper Statue of Libertas
      addCyl(g, 0.28, 0.42, 1.55, 14, 0, 3.12, 0, copperPatina); // Draped classical robe
      addSphere(g, 0.2, 0, 4.02, 0, copperPatina); // Head
      // 7-Ray Halo Crown
      for (let r = -3; r <= 3; r++) {
        addCone(g, 0.03, 0.24, 6, Math.sin(r * 0.32) * 0.22, 4.18, 0.06, copperPatina);
      }
      // Left Arm Holding Tablet of July IV 1776
      addBox(g, 0.22, 0.34, 0.08, 0.28, 3.45, 0.2, copperPatina, 0.25, 0, -0.35);
      // Right Arm Raised High Holding 24K Gold-Leaf Flame Torch
      addStrut(g, new THREE.Vector3(-0.22, 3.68, 0.05), new THREE.Vector3(-0.38, 4.58, 0.12), 0.075, copperPatina);
      addCyl(g, 0.11, 0.06, 0.14, 12, -0.38, 4.65, 0.12, goldMat);
      addCone(g, 0.1, 0.28, 10, -0.38, 4.86, 0.12, warmGlow);
      break;
    }

    case 44: {
      // 44. Christ the Redeemer (Mt. Corcovado Sanctuary, Rio)
      const soapstone = mat(isMinimal ? 0xf8fafc : 0xf1f5f9, 0.45, 0.12);
      const granite = mat(isMinimal ? 0xcbd5e1 : 0x94a3b8, 0.65, 0.1);
      // Steep Lush-Green Mt. Corcovado Peak & Stepped Panoramic Observation Terraces
      addCone(g, 2.25, 1.35, 12, 0, 0.92, 0, lawnMat);
      addCyl(g, 1.38, 1.55, 0.24, 12, 0, 1.52, 0, granite);
      addCyl(g, 1.05, 1.18, 0.22, 12, 0, 1.74, 0, basePlazaMat);
      // 8m Octagonal Granite Pedestal Housing Chapel of Our Lady of Aparecida
      addCyl(g, 0.48, 0.56, 0.72, 8, 0, 2.18, 0, granite);
      // 30m Art Deco Soapstone Statue of Christ with 28m Outstretched Arms
      addBox(g, 0.48, 1.85, 0.34, 0, 3.45, 0, soapstone); // Vertical Art Deco robe torso
      addBox(g, 2.35, 0.24, 0.22, 0, 3.92, 0, soapstone); // 28m Horizontally outstretched arms
      addBox(g, 0.18, 0.1, 0.12, -1.24, 3.92, 0, soapstone); // Left hand
      addBox(g, 0.18, 0.1, 0.12, 1.24, 3.92, 0, soapstone); // Right hand
      // Slightly Bowed Head Looking Down Over Rio
      addSphere(g, 0.2, 0, 4.52, 0.05, soapstone, 0.9, 1.15, 0.95);
      break;
    }

    case 45: {
      // 45. Burj Al Arab Jumeirah (321m Billowing Sail Hotel, Dubai)
      const sailWhite = mat(isMinimal ? 0xffffff : 0xf8fafc, 0.25, 0.18);
      const blueGlass = mat(isMinimal ? 0xcbd5e1 : 0x38bdf8, 0.2, 0.75);
      const padGreen = mat(isMinimal ? 0x94a3b8 : 0x10b981, 0.45, 0.2);
      // Arabian Gulf Water + Triangular Artificial Island & Pool Terrace
      addBox(g, 5.0, 0.06, 5.0, 0, 0.27, 0, waterMat);
      addCyl(g, 1.65, 1.85, 0.22, 3, 0, 0.36, 0.15, basePlazaMat);
      // Central Tall V-Spine Mast Reaching 4.95m
      addCyl(g, 0.12, 0.22, 4.45, 12, 0, 2.58, -0.68, sailWhite);
      // Billowing Curved White & Blue Sail Body + White Steel Diagrid Exoskeleton Bow
      for (let s = 0; s < 14; s++) {
        const sy = 0.62 + s * 0.25;
        const curve = Math.sin((s / 13) * Math.PI * 0.88);
        const w = 0.25 + curve * 1.18;
        const d = 0.35 + curve * 1.12;
        addCyl(g, w * 0.92, w, 0.26, 3, 0, sy, -0.45 + curve * 0.35, s % 2 === 0 ? blueGlass : sailWhite);
      }
      // 2 Curved Outer Exoskeleton Bow Rib Arches
      for (const sx of [-0.55, 0.55]) {
        addStrut(g, new THREE.Vector3(sx * 1.35, 0.45, 0.25), new THREE.Vector3(sx * 0.85, 2.45, 0.58), 0.06, sailWhite);
        addStrut(g, new THREE.Vector3(sx * 0.85, 2.45, 0.58), new THREE.Vector3(0, 4.18, -0.58), 0.055, sailWhite);
      }
      // 210m Cantilevered Circular Green Helipad + Suspended Al Muntaha Sky-Restaurant Pod
      addCyl(g, 0.44, 0.44, 0.08, 24, 0, 3.48, 0.68, padGreen);
      addCyl(g, 0.38, 0.38, 0.09, 24, 0, 3.48, 0.68, sailWhite);
      addBox(g, 1.55, 0.18, 0.32, 0, 3.22, -0.32, sailWhite);
      break;
    }

    case 46: {
      // 46. Lotus Temple (27-Petal White Marble Baháʼí Temple, New Delhi)
      const greekMarble = mat(isMinimal ? 0xffffff : 0xffffff, 0.28, 0.12);
      const redSandstone = mat(isMinimal ? 0xcbd5e1 : 0xc86d51, 0.7, 0.08);
      // 9 Surrounding Emerald-Turquoise Lotus-Leaf Reflecting Pools
      for (let p = 0; p < 9; p++) {
        const a = (p / 9) * Math.PI * 2;
        addCyl(g, 0.62, 0.65, 0.07, 16, Math.cos(a) * 1.58, 0.28, Math.sin(a) * 1.58, waterMat);
      }
      addCyl(g, 1.48, 1.58, 0.22, 9, 0, 0.38, 0, redSandstone);
      // 3 Concentric Rings of 9 White Marble Lotus Petals (27 Petals Total)
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2;
        // Inner Ring: 9 Tall Closed Lotus Bud Petals Forming Central Dome
        const innerPetal = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 12), greekMarble);
        innerPetal.scale.set(0.55, 2.45, 0.25);
        innerPetal.position.set(Math.cos(a) * 0.42, 1.52, Math.sin(a) * 0.42);
        innerPetal.rotation.y = -a + Math.PI / 2;
        innerPetal.rotation.x = -0.25;
        g.add(innerPetal);
        // Middle Ring: 9 Half-Open Petals
        const midPetal = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 12), greekMarble);
        midPetal.scale.set(0.65, 1.85, 0.24);
        midPetal.position.set(Math.cos(a + 0.35) * 0.78, 1.15, Math.sin(a + 0.35) * 0.78);
        midPetal.rotation.y = -(a + 0.35) + Math.PI / 2;
        midPetal.rotation.x = 0.28;
        g.add(midPetal);
        // Outer Ring: 9 Outward-Curving Entrance Canopy Petals
        const outerPetal = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 12), greekMarble);
        outerPetal.scale.set(0.72, 1.35, 0.22);
        outerPetal.position.set(Math.cos(a) * 1.12, 0.82, Math.sin(a) * 1.12);
        outerPetal.rotation.y = -a + Math.PI / 2;
        outerPetal.rotation.x = 0.65;
        g.add(outerPetal);
      }
      break;
    }

    case 47: {
      // 47. The Atomium (1958 Brussels World's Fair Iron Crystal)
      const chromeSphere = mat(isMinimal ? 0xf8fafc : 0xe2e8f0, 0.12, 0.92);
      const steelTube = mat(isMinimal ? 0x94a3b8 : 0x94a3b8, 0.25, 0.8);
      // Circular Expo 58 Reception Pavilion at Base
      addCyl(g, 0.85, 0.98, 0.28, 24, 0, 0.38, 0, basePlazaMat);
      // 9 Sphere Positions of a Cube Standing on its Corner Diagonal (Body-Centered Cubic Iron Cell)
      const pts: THREE.Vector3[] = [
        new THREE.Vector3(0, 0.92, 0), // 0: Bottom sphere
        new THREE.Vector3(0, 2.58, 0), // 1: Center sphere
        new THREE.Vector3(0, 4.24, 0), // 2: Top sphere
      ];
      // 3 Lower Ring Spheres (y=1.75) + 3 Upper Ring Spheres (y=3.41, rotated 60 deg)
      for (let i = 0; i < 3; i++) {
        const aLow = (i * Math.PI * 2) / 3;
        const aHigh = aLow + Math.PI / 3;
        pts.push(new THREE.Vector3(Math.cos(aLow) * 1.32, 1.75, Math.sin(aLow) * 1.32)); // 3,4,5
        pts.push(new THREE.Vector3(Math.cos(aHigh) * 1.32, 3.41, Math.sin(aHigh) * 1.32)); // 6,7,8
      }
      // Render all 9 Gleaming 18m Stainless-Steel Spheres with Equatorial LED Windows
      for (const p of pts) {
        addSphere(g, 0.38, p.x, p.y, p.z, chromeSphere);
        addCyl(g, 0.39, 0.39, 0.05, 20, p.x, p.y, p.z, glassMat);
      }
      // Central Vertical Tube + Radial Spokes + Cube Edge Tubes + 3 Bipod Support Struts
      addStrut(g, pts[0], pts[2], 0.09, steelTube);
      for (let i = 3; i <= 8; i++) {
        addStrut(g, pts[1], pts[i], 0.065, steelTube);
      }
      for (let i = 0; i < 3; i++) {
        const lowIdx = 3 + i;
        const highIdx1 = 6 + i;
        const highIdx2 = 6 + ((i + 2) % 3);
        addStrut(g, pts[0], pts[lowIdx], 0.07, steelTube);
        addStrut(g, pts[2], pts[highIdx1], 0.07, steelTube);
        addStrut(g, pts[lowIdx], pts[highIdx1], 0.065, steelTube);
        addStrut(g, pts[lowIdx], pts[highIdx2], 0.065, steelTube);
        // Bipod Support Struts Under the 3 Lower Ring Spheres
        addStrut(g, pts[lowIdx], new THREE.Vector3(pts[lowIdx].x * 1.15, 0.28, pts[lowIdx].z * 1.15), 0.06, steelTube);
      }
      break;
    }

    case 48: {
      // 48. Heydar Aliyev Center (Zaha Hadid Parametric Fluid Wave, Baku)
      const gfrcWhite = mat(isMinimal ? 0xffffff : 0xf8fafc, 0.25, 0.12);
      // Cascading White Travertine Plaza Terraces & Water Mirror Pool
      addBox(g, 2.15, 0.05, 0.95, -0.95, 0.27, 1.55, waterMat);
      for (let st = 0; st < 4; st++) {
        addBox(g, 4.45 - st * 0.3, 0.08, 3.25 - st * 0.2, 0, 0.28 + st * 0.06, 0, gfrcWhite);
      }
      // Continuous Parametric Sinusoidal Wave Ribbons Rising from the Ground into 3 Swooping Peaks
      for (let i = 0; i < 28; i++) {
        const t = i / 27;
        const x = -2.05 + t * 4.1;
        const waveH =
          0.35 +
          Math.sin(t * Math.PI) * 1.45 +
          Math.sin(t * Math.PI * 2.6 - 0.4) * 0.58 +
          Math.cos(t * Math.PI * 1.5) * 0.28;
        const h = Math.max(0.28, waveH);
        const d = 1.65 + Math.sin(t * Math.PI * 2) * 0.55;
        addBox(g, 0.22, h, d, x, 0.35 + h / 2, -0.15 + Math.cos(t * Math.PI) * 0.25, gfrcWhite, 0, 0, Math.cos(t * Math.PI * 2.5) * 0.18);
      }
      // Undulating Mullion-Free Blue Glass Curtain Wall Cavities Facing the Plaza
      addCyl(g, 0.78, 0.85, 1.35, 18, -0.45, 1.05, 0.32, glassMat);
      addCyl(g, 0.62, 0.68, 1.65, 18, 0.65, 1.2, 0.18, glassMat);
      break;
    }

    case 49: {
      // 49. Guggenheim Museum Bilbao (Frank Gehry Swirling Titanium Ribbons)
      const titaniumGold = mat(isMinimal ? 0xcbd5e1 : 0xd4af37, 0.22, 0.85);
      const titaniumSilver = mat(isMinimal ? 0xe2e8f0 : 0xcbd5e1, 0.2, 0.88);
      const limestone = mat(isMinimal ? 0xf8fafc : 0xe5dec9, 0.65, 0.08);
      // Nervión Riverfront Reflecting Pool + Louise Bourgeois's Spider Sculpture "Maman"
      addBox(g, 4.6, 0.06, 1.35, 0, 0.27, 1.65, waterMat);
      addSphere(g, 0.12, -1.45, 0.78, 1.45, baseTrimMat);
      for (let leg = 0; leg < 6; leg++) {
        const la = (leg / 6) * Math.PI * 2;
        addStrut(
          g,
          new THREE.Vector3(-1.45, 0.78, 1.45),
          new THREE.Vector3(-1.45 + Math.cos(la) * 0.28, 0.28, 1.45 + Math.sin(la) * 0.28),
          0.02,
          baseTrimMat
        );
      }
      // Orthogonal Beige Limestone Gallery Blocks + Central Glass Atrium Tower
      addBox(g, 1.65, 1.15, 1.35, -1.18, 0.82, -0.35, limestone);
      addCyl(g, 0.58, 0.65, 2.35, 12, 0, 1.42, -0.25, glassMat);
      // 9 Swirling Deconstructivist Titanium Ship-Hull & Metallic Flower Ribbons
      for (let r = 0; r < 9; r++) {
        const a = (r / 9) * Math.PI * 2;
        const rx = 0.25 + Math.cos(a) * 0.85;
        const rz = -0.15 + Math.sin(a) * 0.58;
        const rh = 1.05 + (r % 3) * 0.45;
        const ribbon = new THREE.Mesh(
          new THREE.CylinderGeometry(0.42, 0.62, rh, 14, 1, false, 0, Math.PI * 1.35),
          r % 2 === 0 ? titaniumGold : titaniumSilver
        );
        ribbon.position.set(rx, 0.45 + rh / 2, rz);
        ribbon.rotation.set(Math.sin(r) * 0.28, a, Math.cos(r) * 0.25);
        g.add(ribbon);
      }
      break;
    }

    case 50:
    default: {
      // 50. Gardens by the Bay (Supertree Grove & Cloud Forest Conservatory Dome, Singapore)
      const supertreePurple = mat(isMinimal ? 0x94a3b8 : 0xa855f7, 0.35, 0.45);
      const supertreeMagenta = mat(isMinimal ? 0xcbd5e1 : 0xec4899, 0.35, 0.45);
      const skywayYellow = mat(isMinimal ? 0xe2e8f0 : 0xfacc15, 0.35, 0.5);
      // Gridshell Glass Cloud Forest Conservatory Dome on Left Back
      addSphere(g, 1.25, -1.18, 0.72, -0.78, glassMat, 1.35, 0.82, 0.95);
      addCyl(g, 0.28, 0.45, 0.95, 12, -1.18, 0.75, -0.78, lawnMat); // 35m Indoor Cloud Mountain
      // Helper to build a Biophilic Funnel-Canopy Supertree
      const addSupertree = (tx: number, tz: number, h: number, scale: number, hasObservatory = false) => {
        // Living fern-clad concrete trunk + purple steel branch ribs
        addCyl(g, 0.16 * scale, 0.28 * scale, h * 0.72, 12, tx, 0.28 + h * 0.36, tz, lawnMat);
        addCyl(g, 0.22 * scale, 0.34 * scale, h * 0.75, 8, tx, 0.28 + h * 0.37, tz, supertreePurple);
        // Inverted Umbrella Funnel Canopy
        addCyl(g, 0.95 * scale, 0.22 * scale, h * 0.32, 16, tx, 0.28 + h * 0.85, tz, supertreeMagenta);
        addCyl(g, 1.02 * scale, 0.95 * scale, 0.08, 16, tx, 0.28 + h, tz, warmGlow);
        if (hasObservatory) {
          addCyl(g, 0.42, 0.38, 0.22, 16, tx, 0.38 + h, tz, glassMat);
        }
      };
      // Central 50m Mother Supertree with Rooftop Observatory + 4 Surrounding Supertrees
      addSupertree(0.25, 0.05, 3.35, 1.15, true);
      addSupertree(-1.25, 0.95, 2.45, 0.85);
      addSupertree(1.45, 0.85, 2.65, 0.9);
      addSupertree(1.38, -0.98, 2.35, 0.82);
      addSupertree(-0.25, -1.28, 2.25, 0.78);
      // 128m Suspended Yellow OCBC Skyway Winding Between the Supertrees
      addStrut(g, new THREE.Vector3(-1.25, 1.75, 0.95), new THREE.Vector3(0.25, 1.95, 0.05), 0.065, skywayYellow);
      addStrut(g, new THREE.Vector3(0.25, 1.95, 0.05), new THREE.Vector3(1.45, 1.85, 0.85), 0.065, skywayYellow);
      addStrut(g, new THREE.Vector3(1.45, 1.85, 0.85), new THREE.Vector3(1.38, 1.72, -0.98), 0.065, skywayYellow);
      break;
    }
  }

  root.add(exteriorWrapper);

  // ==========================================================================
  // EMBEDDED 2-STORY LANDMARK CUTAWAY INTERIOR
  // Hidden by default in 'all' mode so the landmark exterior silhouette stays
  // 100% pure; revealed automatically when user clicks '只看 1F' or '只看 2F'.
  // ==========================================================================
  const embeddedInterior = buildWorldLandmarkInteriorScene(island, variant);
  embeddedInterior.scale.setScalar(0.45);
  embeddedInterior.position.set(0, 0.25, 0);
  embeddedInterior.userData.isEmbeddedCutawayInterior = true;
  embeddedInterior.visible = false;
  root.add(embeddedInterior);

  return root;
}

// ============================================================================
// PART 2: 50 PAIRED 2-STORY LANDMARK INTERIORS (diorama_dollhouse_53 to 102)
// ============================================================================
export function buildWorldLandmarkInteriorScene(island: IslandMetadata, variant: IslandVariant): THREE.Group {
  const root = new THREE.Group();
  root.name = `WorldLandmarkInterior_${island.id}`;
  const isMinimal = variant === 'minimal';
  const seed = island.id.startsWith('BD-') ? getLandmarkSeedByBuilding(island) : getLandmarkSeedByInterior(island);
  const idx = seed.idx;

  const floorHex = parseInt(seed.interiorPalette[0].replace('#', ''), 16);
  const wallHex = parseInt(seed.interiorPalette[1].replace('#', ''), 16);
  const accentHex = parseInt(seed.interiorPalette[2].replace('#', ''), 16);

  const floorMat = mat(isMinimal ? 0xe2e8f0 : floorHex, 0.55, 0.15);
  const wallMat = mat(isMinimal ? 0xf1f5f9 : wallHex, 0.6, 0.12);
  const accentMat = mat(isMinimal ? 0x94a3b8 : accentHex, 0.28, 0.72);
  const goldMat = mat(isMinimal ? 0x94a3b8 : 0xd4af37, 0.25, 0.82);
  const redCarpetMat = mat(isMinimal ? 0xcbd5e1 : 0x991b1b, 0.75, 0.05);
  const darkWoodMat = mat(isMinimal ? 0x94a3b8 : 0x5c3a21, 0.65, 0.1);
  const glassMat = mat(isMinimal ? 0xcbd5e1 : 0x38bdf8, 0.18, 0.65, true, 0.78);
  const warmGlow = emissiveMat(0xfef08a, 0xf59e0b, 0.85);

  // ==========================================================================
  // 1F GROUP: GRAND HALL / SANCTUARY / SKY-LOBBY + BESPOKE LANDMARK CENTERPIECE
  // ==========================================================================
  const floor1 = new THREE.Group();
  floor1.name = 'floor_1_group';
  root.add(floor1);

  // 1F Cutaway Dollhouse Plinth & Checkered Marble Tiles
  addBox(floor1, 5.2, 0.22, 4.4, 0, 0.11, 0, floorMat);
  for (let ix = -2.2; ix <= 2.2; ix += 0.55) {
    for (let iz = -1.7; iz <= 1.7; iz += 0.55) {
      if ((Math.round(ix * 2) + Math.round(iz * 2)) % 2 === 0) {
        addBox(floor1, 0.5, 0.02, 0.5, ix, 0.23, iz, wallMat);
      }
    }
  }
  // Ceremonial Axial Runner Carpet
  addBox(floor1, 1.15, 0.03, 3.9, 0, 0.24, 0.1, redCarpetMat);

  // Cutaway Back Wall & Left Wall with Arched Panorama Windows / Columns
  addBox(floor1, 5.2, 2.2, 0.22, 0, 1.32, -2.09, wallMat);
  addBox(floor1, 0.22, 2.2, 4.4, -2.49, 1.32, 0, wallMat);
  for (let x = -2.1; x <= 2.1; x += 0.84) {
    addCyl(floor1, 0.11, 0.13, 2.15, 12, x, 1.3, -1.9, accentMat);
    if (Math.abs(x) > 0.2) {
      addBox(floor1, 0.46, 1.25, 0.08, x, 1.42, -1.96, glassMat);
    }
  }
  for (let z = -1.5; z <= 1.5; z += 1.0) {
    addCyl(floor1, 0.11, 0.13, 2.15, 12, -2.3, 1.3, z, accentMat);
  }

  // Grand Staircase on Back-Right Leading up to 2F Gallery
  for (let s = 0; s < 9; s++) {
    addBox(floor1, 0.65, 0.12, 0.24, 2.05, 0.28 + s * 0.22, -1.55 + s * 0.24, goldMat);
  }

  // Bespoke 1F Landmark Centerpiece (Left Wing) & Gallery/Hall (Right Wing) by Group & Index
  if (idx >= 1 && idx <= 10) {
    // GROUP 1: Towers & Skyscrapers — 1F Michelin Sky-Restaurant / Art Deco Lobby & Elevator Machinery
    // Left: Panoramic Sky-Restaurant Tables & Scale Tower Trophy
    for (const [tx, tz] of [
      [-1.55, -0.55],
      [-1.55, 0.75],
      [-0.75, 0.75],
    ]) {
      addCyl(floor1, 0.28, 0.08, 0.38, 14, tx, 0.42, tz, goldMat);
      addCyl(floor1, 0.32, 0.32, 0.04, 16, tx, 0.62, tz, floorMat);
      addSphere(floor1, 0.06, tx, 0.68, tz, warmGlow);
    }
    // Centerpiece: Illuminated Architectural Scale Model of the Tower on Marble Plinth
    addCyl(floor1, 0.42, 0.48, 0.42, 16, -1.15, 0.44, -1.15, wallMat);
    addCone(floor1, 0.24, 1.15, 8, -1.15, 1.22, -1.15, goldMat);
    // Right: Express Double-Deck Glass Elevator Bank & Brass Gear Wheel (or Taipei 101 Damper / Big Ben Clockwork)
    addBox(floor1, 0.85, 1.85, 0.65, 1.05, 1.15, -1.35, glassMat);
    addBox(floor1, 0.68, 0.65, 0.52, 1.05, 0.88, -1.32, warmGlow);
    addCyl(floor1, 0.38, 0.38, 0.12, 20, 1.15, 0.78, 0.65, goldMat, Math.PI / 2, 0, 0);
  } else if (idx >= 11 && idx <= 20) {
    // GROUP 2: Ancient Wonders & Classical Monuments — 1F Sacred Sanctuary / Hypogeum / Sarcophagus Hall
    // Left: Colossal Cult Statue / Sarcophagus / Cenotaph Shrine on Stepped Podium
    addBox(floor1, 1.45, 0.28, 1.25, -1.15, 0.36, -0.85, goldMat);
    if (idx === 11) {
      // Colosseum Hypogeum Cage Lift & Capstan Winch
      addBox(floor1, 0.75, 0.85, 0.75, -1.15, 0.92, -0.85, darkWoodMat);
      addCyl(floor1, 0.12, 0.12, 0.65, 10, -1.15, 0.55, 0.65, darkWoodMat);
    } else if (idx === 13 || idx === 14) {
      // Taj Mahal Pietra Dura Cenotaphs & Jali Screen / Giza Pharaoh Sarcophagus & Solar Barque
      addBox(floor1, 0.82, 0.48, 0.46, -1.15, 0.72, -0.85, accentMat);
      addCyl(floor1, 0.58, 0.58, 0.65, 8, -1.15, 0.82, -0.85, glassMat);
    } else {
      // Classical Gold-and-Ivory Athena / Pantheon Oculus Altar / Eternal Flame Brazier
      addCyl(floor1, 0.22, 0.28, 1.15, 16, -1.15, 1.05, -0.85, goldMat);
      addSphere(floor1, 0.2, -1.15, 1.72, -0.85, warmGlow);
    }
    // Right: Classical Fluted Peristyle Columns & Relic Pedestals
    for (let c = 0; c < 4; c++) {
      const cx = 0.55 + (c % 2) * 0.78;
      const cz = -0.35 + Math.floor(c / 2) * 1.15;
      addCyl(floor1, 0.1, 0.12, 1.65, 12, cx, 1.05, cz, wallMat);
      addBox(floor1, 0.28, 0.48, 0.28, cx, 0.46, cz + 0.38, accentMat);
    }
  } else if (idx >= 21 && idx <= 30) {
    // GROUP 3: Eastern Palaces, Pagodas & Sacred Pavilions — 1F Imperial Dragon Throne / Golden Buddha Shrine
    // Left: 3-Step Sumeru Dais with Nine-Dragon Screen & Imperial Throne / Golden Buddha Statue
    addBox(floor1, 1.65, 0.32, 1.25, -1.05, 0.38, -0.95, goldMat);
    addBox(floor1, 1.48, 1.18, 0.14, -1.05, 1.12, -1.42, accentMat); // Carved Nine-Dragon / Sun-Moon Five-Peaks Screen
    addBox(floor1, 0.68, 0.58, 0.52, -1.05, 0.82, -0.92, redCarpetMat);
    addSphere(floor1, 0.22, -1.05, 1.28, -0.92, goldMat);
    // Twin Cloisonné Cranes / Bronze Incense Burners Flanking Dais
    addCyl(floor1, 0.12, 0.16, 0.68, 10, -1.75, 0.58, -0.35, goldMat);
    addCyl(floor1, 0.12, 0.16, 0.68, 10, -0.35, 0.58, -0.35, goldMat);
    // Right: Vermilion Dragon-Coiled Pillars, Sutra Cabinets & Ceremonial Drums
    for (const [px, pz] of [
      [0.65, -0.65],
      [1.45, -0.65],
      [0.65, 0.75],
      [1.45, 0.75],
    ]) {
      addCyl(floor1, 0.11, 0.12, 1.85, 12, px, 1.15, pz, redCarpetMat);
      addCyl(floor1, 0.13, 0.13, 0.18, 12, px, 1.45, pz, goldMat);
    }
    addCyl(floor1, 0.28, 0.24, 0.45, 16, 1.05, 0.48, 1.25, goldMat);
  } else if (idx >= 31 && idx <= 40) {
    // GROUP 4: Royal Palaces, Opera Houses & Civic Landmarks — 1F Royal Throne / Concert Stage / Parliament Chamber
    // Left: Royal Canopy Throne / Concert Stage & Grand Piano / Speaker's Rostrum
    addBox(floor1, 1.65, 0.28, 1.35, -1.08, 0.36, -0.88, redCarpetMat);
    addBox(floor1, 1.35, 1.55, 0.18, -1.08, 1.15, -1.45, goldMat);
    // Grand Piano or Royal Chairs of Estate
    addBox(floor1, 0.58, 0.42, 0.68, -1.35, 0.68, -0.78, goldMat);
    addBox(floor1, 0.58, 0.42, 0.68, -0.72, 0.68, -0.78, goldMat);
    // Right: Semicircular Velvet Seating / Versailles Mirrors & Crystal Chandeliers
    for (let row = 0; row < 3; row++) {
      addBox(floor1, 1.25, 0.26, 0.28, 1.02, 0.36, -0.25 + row * 0.55, redCarpetMat);
      addBox(floor1, 1.25, 0.42, 0.08, 1.02, 0.48, -0.14 + row * 0.55, darkWoodMat);
    }
  } else {
    // GROUP 5 (41..50): Iconic Bridges, Statues & Modern Marvels — 1F Victorian Engine / Torch Museum / Aquarium / Waterfall
    if (idx === 41 || idx === 42) {
      // Tower Bridge Steam Engine Flywheel & Golden Gate 27,572-Wire Cable Cross-Section
      addCyl(floor1, 0.52, 0.52, 0.16, 20, -1.15, 0.82, -0.85, accentMat, Math.PI / 2, 0, 0);
      addBox(floor1, 1.25, 0.42, 0.68, -1.15, 0.42, -0.85, darkWoodMat);
      addCyl(floor1, 0.34, 0.34, 0.45, 20, 1.05, 0.52, 0.45, goldMat);
    } else if (idx === 43 || idx === 44) {
      // Statue of Liberty Original 1886 Golden Torch / Christ the Redeemer Sacred Heart Shrine
      addCyl(floor1, 0.38, 0.45, 0.55, 16, -1.15, 0.5, -0.85, wallMat);
      addCone(floor1, 0.28, 0.72, 12, -1.15, 1.15, -0.85, warmGlow);
      addBox(floor1, 0.95, 0.68, 0.65, 1.05, 0.58, 0.45, accentMat);
    } else {
      // Burj Al Arab Aquarium / Lotus Prayer Hall / Atomium / Zaha Wave / Bilbao / Gardens Waterfall
      addCyl(floor1, 0.58, 0.62, 1.65, 20, -1.15, 1.05, -0.85, glassMat);
      addCyl(floor1, 0.35, 0.42, 1.45, 16, -1.15, 0.95, -0.85, warmGlow);
      for (let b = 0; b < 3; b++) {
        addBox(floor1, 1.18, 0.24, 0.32, 1.05, 0.35, -0.25 + b * 0.58, floorMat);
      }
    }
  }

  // ==========================================================================
  // 2F GROUP: SKY-DECK OBSERVATORY / HALL OF MIRRORS / CROWN GALLERY / DOME LOFT
  // ==========================================================================
  const floor2 = new THREE.Group();
  floor2.name = 'floor_2_group';
  floor2.position.y = 2.2;
  root.add(floor2);

  // 2F U-Shaped Mezzanine Balcony Slab (Open Central Atrium Overlooking 1F)
  addBox(floor2, 5.2, 0.16, 1.55, 0, 0.08, -1.42, floorMat);
  addBox(floor2, 1.55, 0.16, 2.85, -1.82, 0.08, 0.78, floorMat);
  addBox(floor2, 1.45, 0.16, 2.85, 1.88, 0.08, 0.78, floorMat);

  // Ornate Gilded Balustrade Around the 2F Gallery Atrium Opening
  addBox(floor2, 2.15, 0.34, 0.08, 0, 0.32, -0.66, goldMat);
  addBox(floor2, 0.08, 0.34, 2.75, -1.06, 0.32, 0.72, goldMat);
  addBox(floor2, 0.08, 0.34, 2.75, 1.16, 0.32, 0.72, goldMat);

  // 2F Upper Cutaway Walls & Iconic Panorama Arch / Rose / Dome Centerpiece
  addBox(floor2, 5.2, 1.75, 0.22, 0, 0.95, -2.09, wallMat);
  addBox(floor2, 0.22, 1.75, 4.4, -2.49, 0.95, 0, wallMat);
  addCyl(floor2, 0.68, 0.68, 0.1, 24, 0, 1.02, -1.96, warmGlow, Math.PI / 2, 0, 0);
  addCyl(floor2, 0.74, 0.74, 0.12, 24, 0, 1.02, -1.95, goldMat, Math.PI / 2, 0, 0);

  // 2F Left Wing: VIP Lounge / Tuned Mass Damper / Crown Observation Binoculars / Royal Reliquary
  if (idx === 6) {
    // Taipei 101 660-Ton Golden Tuned Mass Damper Sphere Suspended in 2F Chamber!
    addSphere(floor2, 0.46, -1.82, 0.92, -0.35, goldMat);
    addCyl(floor2, 0.04, 0.04, 0.65, 8, -1.82, 1.38, -0.35, accentMat);
  } else if (idx === 40 || idx === 45) {
    // Marina Bay Sands SkyPark Infinity Pool / Burj Al Arab 24K Royal Suite Canopy Bed
    addBox(floor2, 1.15, 0.18, 1.85, -1.82, 0.26, 0.55, glassMat);
    addBox(floor2, 0.45, 0.22, 0.65, -1.82, 0.38, -0.85, goldMat);
  } else {
    // High-Altitude Observation Binoculars, Champagne Bar & Panoramic Lounge Seating
    for (const bz of [-0.25, 0.65, 1.45]) {
      addCyl(floor2, 0.04, 0.08, 0.48, 8, -1.35, 0.4, bz, goldMat);
      addBox(floor2, 0.22, 0.1, 0.14, -1.3, 0.66, bz, accentMat);
    }
    addBox(floor2, 0.68, 0.42, 1.25, -1.95, 0.36, 0.55, redCarpetMat);
  }

  // 2F Right Wing: Glass-Bottom Skywalk / Treasury Display Cases & Suspended Chandelier
  for (let c = 0; c < 3; c++) {
    const cz = -0.35 + c * 0.82;
    addBox(floor2, 0.52, 0.45, 0.52, 1.88, 0.38, cz, darkWoodMat);
    addBox(floor2, 0.44, 0.38, 0.44, 1.88, 0.78, cz, glassMat);
    addSphere(floor2, 0.12, 1.88, 0.76, cz, goldMat);
  }

  // Grand Suspended Chandelier / Oculus Lantern Over the Central Atrium
  addCyl(floor2, 0.03, 0.03, 0.65, 8, 0, 1.45, 0.25, goldMat);
  addCyl(floor2, 0.48, 0.32, 0.22, 16, 0, 1.12, 0.25, warmGlow);

  return root;
}
