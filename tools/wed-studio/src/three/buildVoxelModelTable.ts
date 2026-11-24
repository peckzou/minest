import * as THREE from 'three';
import { CustomVoxelBlock, ParkEdition } from '../types/studio';

export interface ModelTableRefs {
  root: THREE.Group;
  tableFurnitureGroup: THREE.Group;
  // Anaheim 1955 Layer Groups
  anaheimGroup: THREE.Group;
  layerTerrainGroup: THREE.Group;
  layerBuildingsGroup: THREE.Group;
  layerSpireRoofsGroup: THREE.Group;
  layerVehiclesGroup: THREE.Group;
  trainCars: THREE.Group[];
  steamPuffs: THREE.Mesh[];
  carouselCanopy: THREE.Group;
  astroJetsRotor: THREE.Group;
  dumboRotor: THREE.Group;
  riverBoatGroup: THREE.Group;
  sternWheelMesh: THREE.Mesh;
  // Orlando 1971–1982 ("The Florida Project") Layer Groups
  orlandoGroup: THREE.Group;
  orlandoUtilidorsGroup: THREE.Group;
  orlandoTerrainGroup: THREE.Group;
  orlandoBuildingsGroup: THREE.Group;
  orlandoSpiresGroup: THREE.Group;
  orlandoVehiclesGroup: THREE.Group;
  monorailCars: THREE.Group[];
  orlandoFerryGroup: THREE.Group;
  orlandoFerryWheel: THREE.Mesh;
  spaceshipEarthPrismCore: THREE.Mesh;
  // Shared Overlays & Voxel Builder
  blueprintWireframeGroup: THREE.Group;
  customVoxelGroup: THREE.Group;
  placementPlane: THREE.Mesh;
  clickablePickTargets: THREE.Object3D[];
  voxelUnitSize: number;
  tableSurfaceY: number;
  rebuildCustomVoxels: (blocks: CustomVoxelBlock[]) => void;
  setParkEdition: (edition: ParkEdition) => void;
  /** Minest: hide the built-in park model so a dream work stands on a clear table */
  showPark: (on: boolean) => void;
}

const _dummy = new THREE.Object3D();
const _color = new THREE.Color();

interface VoxelInstance {
  gx: number;
  gy: number;
  gz: number;
  color: number;
}

export function buildVoxelModelTable(isSoftwareGl: boolean): ModelTableRefs {
  const root = new THREE.Group();
  root.position.set(0.85, 0, 0.35);

  const clickablePickTargets: THREE.Object3D[] = [];
  const tableSurfaceY = 1.32;
  const voxelUnitSize = 0.12;
  const voxelGeo = new THREE.BoxGeometry(
    voxelUnitSize * 0.96,
    voxelUnitSize * 0.96,
    voxelUnitSize * 0.96
  );

  const addVoxel = (list: VoxelInstance[], gx: number, gy: number, gz: number, color: number) => {
    list.push({ gx, gy, gz, color });
  };

  const createVoxelInstancedMesh = (
    instances: VoxelInstance[],
    material: THREE.Material
  ): THREE.InstancedMesh => {
    const mesh = new THREE.InstancedMesh(voxelGeo, material, Math.max(1, instances.length));
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    instances.forEach((inst, i) => {
      _dummy.position.set(
        inst.gx * voxelUnitSize,
        (inst.gy + 0.5) * voxelUnitSize,
        inst.gz * voxelUnitSize
      );
      _dummy.rotation.set(0, 0, 0);
      _dummy.scale.setScalar(1);
      _dummy.updateMatrix();
      mesh.setMatrixAt(i, _dummy.matrix);
      _color.setHex(inst.color);
      mesh.setColorAt(i, _color);
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
    return mesh;
  };

  // ============================================================================
  // 1. ARCHITECT'S SCALE MODEL TABLE FURNITURE (实木与黄铜微缩模型沙盘台)
  // ============================================================================
  const tableFurnitureGroup = new THREE.Group();

  const oakMat = new THREE.MeshStandardMaterial({
    color: 0x6b4426,
    roughness: 0.65,
    metalness: 0.05,
  });
  const darkWalnutMat = new THREE.MeshStandardMaterial({
    color: 0x3b2313,
    roughness: 0.55,
    metalness: 0.08,
  });
  const brassMat = new THREE.MeshPhysicalMaterial({
    color: 0xe3b448,
    roughness: 0.22,
    metalness: 0.92,
    clearcoat: 0.4,
  });
  const feltBaseMat = new THREE.MeshStandardMaterial({
    color: 0x1e3528,
    roughness: 0.85,
    metalness: 0.02,
  });

  const tableW = 6.9;
  const tableD = 5.1;

  const apronBox = new THREE.Mesh(new THREE.BoxGeometry(tableW, 0.24, tableD), oakMat);
  apronBox.position.y = tableSurfaceY - 0.12;
  apronBox.castShadow = true;
  apronBox.receiveShadow = true;
  tableFurnitureGroup.add(apronBox);

  const rimThickness = 0.12;
  const rimHeight = 0.07;
  const northRim = new THREE.Mesh(
    new THREE.BoxGeometry(tableW + 0.08, rimHeight, rimThickness),
    darkWalnutMat
  );
  northRim.position.set(0, tableSurfaceY + 0.015, -tableD / 2);
  tableFurnitureGroup.add(northRim);

  const southRim = northRim.clone();
  southRim.position.z = tableD / 2;
  tableFurnitureGroup.add(southRim);

  const westRim = new THREE.Mesh(
    new THREE.BoxGeometry(rimThickness, rimHeight, tableD + 0.08),
    darkWalnutMat
  );
  westRim.position.set(-tableW / 2, tableSurfaceY + 0.015, 0);
  tableFurnitureGroup.add(westRim);

  const eastRim = westRim.clone();
  eastRim.position.x = tableW / 2;
  tableFurnitureGroup.add(eastRim);

  [
    [-tableW / 2, -tableD / 2],
    [tableW / 2, -tableD / 2],
    [-tableW / 2, tableD / 2],
    [tableW / 2, tableD / 2],
  ].forEach(([cx, cz]) => {
    const cornerBrass = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.28, 0.22), brassMat);
    cornerBrass.position.set(cx, tableSurfaceY - 0.1, cz);
    tableFurnitureGroup.add(cornerBrass);
  });

  const nameplate = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.11, 0.04), brassMat);
  nameplate.position.set(0, tableSurfaceY - 0.12, tableD / 2 + 0.01);
  tableFurnitureGroup.add(nameplate);

  [-1.9, 1.9].forEach((dx) => {
    const drawerFront = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.16, 0.04), darkWalnutMat);
    drawerFront.position.set(dx, tableSurfaceY - 0.12, tableD / 2 + 0.01);
    tableFurnitureGroup.add(drawerFront);

    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.035, 0.05), brassMat);
    handle.position.set(dx, tableSurfaceY - 0.12, tableD / 2 + 0.035);
    tableFurnitureGroup.add(handle);
  });

  [-tableW / 2 + 0.28, 0, tableW / 2 - 0.28].forEach((lx) => {
    [-tableD / 2 + 0.28, tableD / 2 - 0.28].forEach((lz) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.18, tableSurfaceY - 0.22, 0.18), oakMat);
      leg.position.set(lx, (tableSurfaceY - 0.22) / 2, lz);
      leg.castShadow = true;
      tableFurnitureGroup.add(leg);

      const ferrule = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.2), brassMat);
      ferrule.position.set(lx, 0.06, lz);
      tableFurnitureGroup.add(ferrule);
    });
  });

  const lowerShelf = new THREE.Mesh(
    new THREE.BoxGeometry(tableW - 0.6, 0.06, tableD - 0.6),
    darkWalnutMat
  );
  lowerShelf.position.y = 0.34;
  lowerShelf.receiveShadow = true;
  tableFurnitureGroup.add(lowerShelf);

  const baseFelt = new THREE.Mesh(
    new THREE.BoxGeometry(tableW - 0.12, 0.03, tableD - 0.12),
    feltBaseMat
  );
  baseFelt.position.y = tableSurfaceY + 0.01;
  baseFelt.receiveShadow = true;
  tableFurnitureGroup.add(baseFelt);

  // Swing-Arm Magnifying Loupe & Model Paint Jars on Front-Left Corner
  const loupeGroup = new THREE.Group();
  loupeGroup.position.set(-tableW / 2 + 0.42, tableSurfaceY + 0.05, tableD / 2 - 0.32);

  const loupeArm = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.65, 10), brassMat);
  loupeArm.position.set(0.18, 0.28, -0.18);
  loupeArm.rotation.z = -0.55;
  loupeArm.rotation.x = -0.45;
  loupeGroup.add(loupeArm);

  const loupeRing = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.02, 10, 24), brassMat);
  loupeRing.rotation.x = Math.PI / 2;
  loupeRing.position.set(0.36, 0.52, -0.36);
  loupeGroup.add(loupeRing);

  const loupeLens = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.13, 0.015, 20),
    new THREE.MeshPhysicalMaterial({
      color: 0xe0f2fe,
      roughness: 0.08,
      transmission: isSoftwareGl ? 0 : 0.88,
      transparent: true,
      opacity: isSoftwareGl ? 0.38 : 1.0,
      ior: 1.52,
    })
  );
  loupeLens.position.set(0.36, 0.52, -0.36);
  loupeGroup.add(loupeLens);
  tableFurnitureGroup.add(loupeGroup);

  const jarColors = [0xe88d9c, 0x1d4ed8, 0xf59e0b, 0x10b981];
  jarColors.forEach((jc, idx) => {
    const jar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.055, 0.11, 12),
      new THREE.MeshStandardMaterial({ color: jc, roughness: 0.35 })
    );
    jar.position.set(-tableW / 2 + 0.35 + idx * 0.14, tableSurfaceY + 0.08, tableD / 2 - 0.18);
    tableFurnitureGroup.add(jar);
  });

  root.add(tableFurnitureGroup);

  // ============================================================================
  // 2. EDITION A: ANAHEIM 1955 DISNEYLAND VOXEL DIORAMA
  // ============================================================================
  const anaheimGroup = new THREE.Group();
  const layerTerrainGroup = new THREE.Group();
  layerTerrainGroup.position.y = tableSurfaceY + 0.025;
  const layerBuildingsGroup = new THREE.Group();
  layerBuildingsGroup.position.y = tableSurfaceY + 0.025;
  const layerSpireRoofsGroup = new THREE.Group();
  layerSpireRoofsGroup.position.y = tableSurfaceY + 0.025;
  const layerVehiclesGroup = new THREE.Group();
  layerVehiclesGroup.position.y = tableSurfaceY + 0.025;

  const terrainVoxels: VoxelInstance[] = [];
  const waterVoxels: VoxelInstance[] = [];
  const buildingVoxels: VoxelInstance[] = [];
  const roofSpireVoxels: VoxelInstance[] = [];

  for (let gx = -24; gx <= 24; gx++) {
    for (let gz = -17; gz <= 17; gz++) {
      const distHub = Math.hypot(gx, gz - 1);
      const distCastleMoat = Math.hypot(gx, gz + 4.5);
      const normOval = Math.hypot(gx / 22.5, gz / 15.8);

      if (normOval >= 0.93 && normOval <= 1.03) {
        addVoxel(terrainVoxels, gx, 0, gz, 0x3b6e38);
        addVoxel(terrainVoxels, gx, 1, gz, 0x7c6f64);
        continue;
      }
      if (distCastleMoat >= 3.2 && distCastleMoat <= 5.1 && gz < 0.8) {
        if (Math.abs(gx) <= 1 && gz > -4.5) {
          addVoxel(terrainVoxels, gx, 0, gz, 0xc8b89a);
        } else {
          addVoxel(waterVoxels, gx, 0, gz, 0x0ea5e9);
        }
        continue;
      }
      const riverCenterX = -13.5 + Math.sin(gz * 0.35) * 2.5;
      if (gx < -7 && Math.abs(gx - riverCenterX) < 1.9 && Math.abs(gz) < 12.5) {
        addVoxel(waterVoxels, gx, 0, gz, 0x14b8a6);
        continue;
      }

      const isMainStreet = Math.abs(gx) <= 2 && gz >= 2 && gz <= 13;
      const isTownSquare = Math.abs(gx) <= 4 && gz >= 10 && gz <= 13;
      const isHubPlaza = distHub <= 4.2;
      const isEastSpoke = Math.abs(gz - 1) <= 1 && gx >= 3 && gx <= 14;
      const isWestSpoke = Math.abs(gz - 1) <= 1 && gx <= -3 && gx >= -11;

      if (isMainStreet || isTownSquare || isHubPlaza || isEastSpoke || isWestSpoke) {
        const checker = (gx + gz) % 2 === 0 ? 0xd6c7b2 : 0xc2b097;
        addVoxel(terrainVoxels, gx, 0, gz, checker);
      } else if (normOval < 0.93) {
        const grassShade = (gx * 3 + gz * 7) % 3 === 0 ? 0x2f6b3c : 0x387a47;
        addVoxel(terrainVoxels, gx, 0, gz, grassShade);
      }
    }
  }

  addVoxel(terrainVoxels, 0, 1, 13, 0xd93829);
  addVoxel(terrainVoxels, -1, 1, 12, 0xf59e0b);
  addVoxel(terrainVoxels, 1, 1, 12, 0xf59e0b);

  // Sleeping Beauty Castle (77 ft Bavarian Limestone & Rose Stucco)
  const cZ = -5;
  for (let gx = -3; gx <= 3; gx++) {
    for (let gz = cZ - 2; gz <= cZ + 2; gz++) {
      for (let gy = 1; gy <= 5; gy++) {
        if (gx === 0 && gy <= 3 && gz >= cZ) continue;
        if (Math.abs(gx) <= 1 && Math.abs(gz - cZ) <= 1 && gy >= 4) continue;
        const stoneCol = (gx + gy + gz) % 2 === 0 ? 0xf3ead8 : 0xe2d5be;
        addVoxel(buildingVoxels, gx, gy, gz, stoneCol);
      }
    }
  }
  [
    [-3, cZ - 2],
    [3, cZ - 2],
    [-3, cZ + 2],
    [3, cZ + 2],
  ].forEach(([tx, tz]) => {
    for (let gy = 6; gy <= 8; gy++) {
      addVoxel(buildingVoxels, tx, gy, tz, 0xf1e6d2);
    }
    addVoxel(roofSpireVoxels, tx, 9, tz, 0x1d4ed8);
    addVoxel(roofSpireVoxels, tx, 10, tz, 0x2563eb);
    addVoxel(roofSpireVoxels, tx, 11, tz, 0xf59e0b);
  });

  for (let gx = -2; gx <= 2; gx++) {
    for (let gz = cZ - 1; gz <= cZ + 1; gz++) {
      for (let gy = 5; gy <= 9; gy++) {
        const pinkCol = (gx + gy) % 2 === 0 ? 0xf4acb7 : 0xe592a1;
        addVoxel(buildingVoxels, gx, gy, gz, pinkCol);
      }
    }
  }
  [-2, 2].forEach((tx) => {
    for (let gy = 10; gy <= 12; gy++) {
      addVoxel(buildingVoxels, tx, gy, cZ, 0xf4acb7);
    }
    addVoxel(roofSpireVoxels, tx, 13, cZ, 0x1e40af);
    addVoxel(roofSpireVoxels, tx, 14, cZ, 0x2563eb);
    addVoxel(roofSpireVoxels, tx, 15, cZ, 0xfbbf24);
  });
  for (let gy = 10; gy <= 14; gy++) {
    addVoxel(buildingVoxels, 0, gy, cZ, 0xf7cad0);
    addVoxel(buildingVoxels, 1, gy, cZ, 0xe592a1);
  }
  for (let gy = 15; gy <= 18; gy++) {
    addVoxel(roofSpireVoxels, 0, gy, cZ, 0x1d4ed8);
  }
  addVoxel(roofSpireVoxels, 0, 19, cZ, 0xf59e0b);
  addVoxel(roofSpireVoxels, 0, 20, cZ, 0xfde047);

  // Main Street Train Station & Facades
  for (let gx = -4; gx <= 4; gx++) {
    for (let gy = 2; gy <= 4; gy++) {
      const col = gy === 3 && Math.abs(gx) % 2 === 1 ? 0xfef3c7 : 0xb91c1c;
      addVoxel(buildingVoxels, gx, gy, 15, col);
    }
    addVoxel(roofSpireVoxels, gx, 5, 15, 0x334155);
  }
  addVoxel(buildingVoxels, 0, 6, 15, 0xf8fafc);
  addVoxel(buildingVoxels, 0, 7, 15, 0xf8fafc);
  addVoxel(roofSpireVoxels, 0, 8, 15, 0x1e293b);
  addVoxel(roofSpireVoxels, 0, 9, 15, 0xf59e0b);

  const facadeColors = [0xd97736, 0xeab308, 0x4d7c5b, 0xc0564b, 0x64748b, 0xd4a373];
  for (let gz = 4; gz <= 9; gz++) {
    const fColL = facadeColors[gz % facadeColors.length];
    const fColR = facadeColors[(gz + 2) % facadeColors.length];
    for (let gy = 1; gy <= 3 + (gz % 2); gy++) {
      addVoxel(buildingVoxels, -3, gy, gz, fColL);
      addVoxel(buildingVoxels, -4, gy, gz, fColL);
      addVoxel(buildingVoxels, 3, gy, gz, fColR);
      addVoxel(buildingVoxels, 4, gy, gz, fColR);
    }
    addVoxel(roofSpireVoxels, -3, 4 + (gz % 2), gz, 0xf8fafc);
    addVoxel(roofSpireVoxels, 3, 4 + (gz % 2), gz, 0x7f1d1d);
  }

  // Tomorrowland TWA Moonliner Rocket
  const mX = 13;
  const mZ = 1;
  for (let gx = 7; gx <= 10; gx++) {
    for (let gy = 1; gy <= 3; gy++) {
      addVoxel(buildingVoxels, gx, gy, -1, 0xf1f5f9);
      addVoxel(buildingVoxels, gx, gy, 3, 0xf1f5f9);
    }
    addVoxel(roofSpireVoxels, gx, 4, -1, 0x0284c7);
    addVoxel(roofSpireVoxels, gx, 4, 3, 0x0284c7);
  }
  [
    [mX - 1, mZ],
    [mX + 1, mZ],
    [mX, mZ - 1],
    [mX, mZ + 1],
  ].forEach(([fx, fz]) => {
    addVoxel(buildingVoxels, fx, 1, fz, 0xdc2626);
    addVoxel(buildingVoxels, fx, 2, fz, 0xdc2626);
    addVoxel(buildingVoxels, fx, 3, fz, 0xf8fafc);
  });
  for (let gy = 2; gy <= 14; gy++) {
    const rocketCol = gy === 13 || gy === 4 ? 0xdc2626 : 0xffffff;
    addVoxel(buildingVoxels, mX, gy, mZ, rocketCol);
  }
  addVoxel(roofSpireVoxels, mX, 15, mZ, 0xdc2626);
  addVoxel(roofSpireVoxels, mX, 16, mZ, 0xf8fafc);
  addVoxel(roofSpireVoxels, mX, 17, mZ, 0xdc2626);

  // Frontierland Red Buttes & Matterhorn Peak
  const butteCoords = [
    { x: -16, z: -7, h: 7 },
    { x: -15, z: -6, h: 9 },
    { x: -14, z: -7, h: 6 },
    { x: -17, z: -5, h: 5 },
  ];
  butteCoords.forEach((b) => {
    for (let gy = 1; gy <= b.h; gy++) {
      const rockCol = gy % 3 === 0 ? 0xd97736 : gy % 2 === 0 ? 0xb45309 : 0x9a3412;
      addVoxel(buildingVoxels, b.x, gy, b.z, rockCol);
    }
  });

  const mhCenterX = 9;
  const mhCenterZ = -9;
  for (let gx = 7; gx <= 11; gx++) {
    for (let gz = -11; gz <= -7; gz++) {
      const distFromPeak = Math.hypot(gx - mhCenterX, gz - mhCenterZ);
      const maxH = Math.max(0, Math.round(16 - distFromPeak * 5.2));
      for (let gy = 1; gy <= maxH; gy++) {
        if (gx === mhCenterX && gz >= -8 && gy <= 8) {
          addVoxel(waterVoxels, gx, gy, gz, 0x38bdf8);
          continue;
        }
        if (gy >= 10) {
          addVoxel(roofSpireVoxels, gx, gy, gz, gy % 2 === 0 ? 0xffffff : 0xe2e8f0);
        } else {
          const granite = (gx + gy + gz) % 2 === 0 ? 0x64748b : 0x475569;
          addVoxel(buildingVoxels, gx, gy, gz, granite);
        }
      }
    }
  }

  const treePositions = [
    [-9, 5],
    [-10, 8],
    [-16, 4],
    [-17, 7],
    [-11, -4],
    [-8, -8],
    [14, -8],
    [15, -5],
    [16, 7],
    [12, 9],
    [-7, 3],
    [6, 3],
  ];
  treePositions.forEach(([tx, tz], idx) => {
    addVoxel(buildingVoxels, tx, 1, tz, 0x5c3a21);
    addVoxel(buildingVoxels, tx, 2, tz, 0x5c3a21);
    const leafCol = idx % 2 === 0 ? 0x15803d : 0x166534;
    addVoxel(roofSpireVoxels, tx, 3, tz, leafCol);
    addVoxel(roofSpireVoxels, tx - 1, 3, tz, leafCol);
    addVoxel(roofSpireVoxels, tx + 1, 3, tz, leafCol);
    addVoxel(roofSpireVoxels, tx, 3, tz - 1, leafCol);
    addVoxel(roofSpireVoxels, tx, 3, tz + 1, leafCol);
    addVoxel(roofSpireVoxels, tx, 4, tz, 0x22c55e);
  });

  layerTerrainGroup.add(
    createVoxelInstancedMesh(
      terrainVoxels,
      new THREE.MeshStandardMaterial({ roughness: 0.72, metalness: 0.05 })
    )
  );
  layerTerrainGroup.add(
    createVoxelInstancedMesh(
      waterVoxels,
      new THREE.MeshPhysicalMaterial({ roughness: 0.15, metalness: 0.1, clearcoat: 0.9 })
    )
  );
  layerBuildingsGroup.add(
    createVoxelInstancedMesh(
      buildingVoxels,
      new THREE.MeshStandardMaterial({ roughness: 0.48, metalness: 0.08 })
    )
  );
  layerSpireRoofsGroup.add(
    createVoxelInstancedMesh(
      roofSpireVoxels,
      new THREE.MeshPhysicalMaterial({ roughness: 0.28, metalness: 0.35, clearcoat: 0.65 })
    )
  );

  // Anaheim Animated Vehicles
  const trainCars: THREE.Group[] = [];
  const steamPuffs: THREE.Mesh[] = [];
  for (let c = 0; c < 4; c++) {
    const carGroup = new THREE.Group();
    if (c === 0) {
      const boiler = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.16, 0.36),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35, metalness: 0.65 })
      );
      boiler.position.y = 0.12;
      carGroup.add(boiler);
      const cab = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.24, 0.16),
        new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.45 })
      );
      cab.position.set(0, 0.16, -0.12);
      carGroup.add(cab);
      const smokestack = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.035, 0.14, 10),
        brassMat
      );
      smokestack.position.set(0, 0.25, 0.12);
      carGroup.add(smokestack);
      const cowcatcher = new THREE.Mesh(
        new THREE.ConeGeometry(0.09, 0.12, 4),
        new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 })
      );
      cowcatcher.rotation.x = Math.PI / 2;
      cowcatcher.position.set(0, 0.07, 0.22);
      carGroup.add(cowcatcher);
    } else if (c === 1) {
      const tender = new THREE.Mesh(
        new THREE.BoxGeometry(0.19, 0.16, 0.26),
        new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.5 })
      );
      tender.position.y = 0.11;
      carGroup.add(tender);
    } else {
      const coach = new THREE.Mesh(
        new THREE.BoxGeometry(0.21, 0.2, 0.38),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 })
      );
      coach.position.y = 0.13;
      carGroup.add(coach);
      const coachRoof = new THREE.Mesh(
        new THREE.BoxGeometry(0.23, 0.04, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.5 })
      );
      coachRoof.position.y = 0.24;
      carGroup.add(coachRoof);
    }
    layerVehiclesGroup.add(carGroup);
    trainCars.push(carGroup);
  }

  const steamMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.9,
    transparent: true,
    opacity: 0.75,
  });
  for (let p = 0; p < 5; p++) {
    const puff = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.09), steamMat);
    layerVehiclesGroup.add(puff);
    steamPuffs.push(puff);
  }

  const carouselCanopy = new THREE.Group();
  carouselCanopy.position.set(0, voxelUnitSize * 1.0, -10.5 * voxelUnitSize);
  const carouselPillar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.32, 10),
    brassMat
  );
  carouselPillar.position.y = 0.16;
  carouselCanopy.add(carouselPillar);
  const carouselRoof = new THREE.Mesh(
    new THREE.ConeGeometry(0.38, 0.22, 8),
    new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.4 })
  );
  carouselRoof.position.y = 0.36;
  carouselCanopy.add(carouselRoof);
  for (let h = 0; h < 6; h++) {
    const a = (h * Math.PI * 2) / 6;
    const horse = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.09, 0.11),
      new THREE.MeshStandardMaterial({ color: h % 2 === 0 ? 0xffffff : 0xf472b6, roughness: 0.4 })
    );
    horse.position.set(Math.cos(a) * 0.24, 0.12, Math.sin(a) * 0.24);
    horse.rotation.y = -a;
    carouselCanopy.add(horse);
  }
  layerVehiclesGroup.add(carouselCanopy);

  const dumboRotor = new THREE.Group();
  dumboRotor.position.set(-4.5 * voxelUnitSize, voxelUnitSize * 1.0, -9.5 * voxelUnitSize);
  const dumboHub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.09, 0.28, 10),
    new THREE.MeshStandardMaterial({ color: 0xd93829, roughness: 0.4 })
  );
  dumboHub.position.y = 0.14;
  dumboRotor.add(dumboHub);
  for (let d = 0; d < 6; d++) {
    const a = (d * Math.PI * 2) / 6;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.02, 0.02), brassMat);
    arm.position.set(Math.cos(a) * 0.14, 0.22, Math.sin(a) * 0.14);
    arm.rotation.y = -a;
    dumboRotor.add(arm);
    const elephant = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.08, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x93c5fd, roughness: 0.4 })
    );
    elephant.position.set(Math.cos(a) * 0.28, 0.24 + (d % 2) * 0.06, Math.sin(a) * 0.28);
    elephant.rotation.y = -a + Math.PI / 2;
    dumboRotor.add(elephant);
  }
  layerVehiclesGroup.add(dumboRotor);

  const astroJetsRotor = new THREE.Group();
  astroJetsRotor.position.set(13 * voxelUnitSize, voxelUnitSize * 1.0, -4.5 * voxelUnitSize);
  const gantryColumn = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.09, 0.42, 10),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3, metalness: 0.6 })
  );
  gantryColumn.position.y = 0.21;
  astroJetsRotor.add(gantryColumn);
  for (let j = 0; j < 4; j++) {
    const a = (j * Math.PI) / 2;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.025, 0.025), brassMat);
    arm.position.set(Math.cos(a) * 0.17, 0.36, Math.sin(a) * 0.17);
    arm.rotation.y = -a;
    astroJetsRotor.add(arm);
    const jetPod = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.07, 0.14),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 })
    );
    jetPod.position.set(Math.cos(a) * 0.34, 0.38, Math.sin(a) * 0.34);
    jetPod.rotation.y = -a;
    astroJetsRotor.add(jetPod);
  }
  layerVehiclesGroup.add(astroJetsRotor);

  const riverBoatGroup = new THREE.Group();
  const boatHull = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.09, 0.46),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 })
  );
  boatHull.position.y = 0.06;
  riverBoatGroup.add(boatHull);
  const deck2 = new THREE.Mesh(
    new THREE.BoxGeometry(0.19, 0.09, 0.36),
    new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.45 })
  );
  deck2.position.y = 0.15;
  riverBoatGroup.add(deck2);
  const pilothouse = new THREE.Mesh(
    new THREE.BoxGeometry(0.13, 0.08, 0.16),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 })
  );
  pilothouse.position.set(0, 0.23, 0.06);
  riverBoatGroup.add(pilothouse);
  [-0.055, 0.055].forEach((sx) => {
    const stack = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.26, 8),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 })
    );
    stack.position.set(sx, 0.28, 0.14);
    riverBoatGroup.add(stack);
  });
  const sternWheelMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.085, 0.085, 0.16, 10),
    new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.45 })
  );
  sternWheelMesh.rotation.z = Math.PI / 2;
  sternWheelMesh.position.set(0, 0.09, -0.26);
  riverBoatGroup.add(sternWheelMesh);
  layerVehiclesGroup.add(riverBoatGroup);

  anaheimGroup.add(layerTerrainGroup);
  anaheimGroup.add(layerBuildingsGroup);
  anaheimGroup.add(layerSpireRoofsGroup);
  anaheimGroup.add(layerVehiclesGroup);
  root.add(anaheimGroup);

  // ============================================================================
  // 3. EDITION B: ORLANDO 1971–1982 WALT DISNEY WORLD ("THE FLORIDA PROJECT")
  // Includes: Underground Utilidors Layer, 189-ft Cinderella Castle, EPCOT
  // Spaceship Earth Geodesic Sphere, Contemporary Resort A-Frame & Monorail,
  // Space Mountain Conical Dome & Liberty Square Haunted Mansion!
  // ============================================================================
  const orlandoGroup = new THREE.Group();
  const orlandoUtilidorsGroup = new THREE.Group();
  orlandoUtilidorsGroup.position.y = tableSurfaceY + 0.025;

  const orlandoTerrainGroup = new THREE.Group();
  orlandoTerrainGroup.position.y = tableSurfaceY + 0.025;

  const orlandoBuildingsGroup = new THREE.Group();
  orlandoBuildingsGroup.position.y = tableSurfaceY + 0.025;

  const orlandoSpiresGroup = new THREE.Group();
  orlandoSpiresGroup.position.y = tableSurfaceY + 0.025;

  const orlandoVehiclesGroup = new THREE.Group();
  orlandoVehiclesGroup.position.y = tableSurfaceY + 0.025;

  const orlUtilidorVoxels: VoxelInstance[] = [];
  const orlTerrainVoxels: VoxelInstance[] = [];
  const orlWaterVoxels: VoxelInstance[] = [];
  const orlBuildingVoxels: VoxelInstance[] = [];
  const orlSpireVoxels: VoxelInstance[] = [];

  // --- A. LEVEL 0: ORLANDO UNDERGROUND "UTILIDORS" TUNNEL NETWORK ---
  // Revealed underneath Magic Kingdom when user pulls the Exploded View slider!
  for (let gx = -16; gx <= 16; gx++) {
    for (let gz = -13; gz <= 9; gz++) {
      const distRing = Math.hypot(gx, gz + 2);
      const isOuterTunnelLoop = distRing >= 6.8 && distRing <= 8.4;
      const isCentralSpine = Math.abs(gx) <= 1 && gz >= -10 && gz <= 8;
      const isCrossCorridor = Math.abs(gz + 2) <= 1 && Math.abs(gx) <= 8;

      if (isOuterTunnelLoop || isCentralSpine || isCrossCorridor) {
        // Concrete tunnel floor & yellow/blue coded utility pipe stripes
        const utilCol =
          isCentralSpine && Math.abs(gz + 2) <= 2
            ? 0xf59e0b // DACS Central Computer Core under Cinderella Castle!
            : (gx + gz) % 3 === 0
            ? 0x38bdf8 // AVAC Pneumatic Tube line
            : 0x64748b; // Precast Concrete Utilidor Corridor
        addVoxel(orlUtilidorVoxels, gx, 0, gz, utilCol);
      }
    }
  }

  // --- B. LEVEL 1: ORLANDO SECOND-FLOOR PARK DECK, SEVEN SEAS LAGOON & EPCOT PLAZA ---
  for (let gx = -24; gx <= 24; gx++) {
    for (let gz = -17; gz <= 17; gz++) {
      const distHub = Math.hypot(gx, gz + 0.5);
      const distCinderellaMoat = Math.hypot(gx, gz + 5.5);

      // Seven Seas Lagoon & EPCOT Reflection Basin in Southern / Eastern Sector
      const isSevenSeasLagoon =
        gz >= 6 && gz <= 14 && ((gx >= -15 && gx <= -4) || (gx >= 4 && gx <= 13));
      const isEpcotFountainPool = Math.hypot(gx, gz - 10.5) >= 2.2 && Math.hypot(gx, gz - 10.5) <= 4.3;

      if (isSevenSeasLagoon || isEpcotFountainPool) {
        addVoxel(orlWaterVoxels, gx, 0, gz, 0x0284c7);
        continue;
      }

      // Cinderella Castle Swan Moat
      if (distCinderellaMoat >= 3.4 && distCinderellaMoat <= 5.4 && gz < 0.2) {
        if (Math.abs(gx) <= 1 && gz > -5.5) {
          addVoxel(orlTerrainVoxels, gx, 0, gz, 0xe2e8f0);
        } else {
          addVoxel(orlWaterVoxels, gx, 0, gz, 0x0ea5e9);
        }
        continue;
      }

      // Rivers of America (West Liberty Square & Frontierland Waterway)
      const riverX = -14.0 + Math.sin(gz * 0.32) * 2.2;
      if (gx < -8 && Math.abs(gx - riverX) < 2.0 && gz >= -12 && gz <= 5) {
        addVoxel(orlWaterVoxels, gx, 0, gz, 0x0d9488);
        continue;
      }

      // Main Street, Hub, Tomorrowland Avenue of Planets, EPCOT Future World Plaza
      const isMainSt = Math.abs(gx) <= 2 && gz >= 0 && gz <= 15;
      const isHub = distHub <= 4.2;
      const isEpcotPlaza = Math.hypot(gx, gz - 10.5) <= 2.3;
      const isTomorrowlandAve = Math.abs(gz) <= 1 && gx >= 3 && gx <= 13;
      const isLibertySpoke = Math.abs(gz + 2) <= 1 && gx <= -3 && gx >= -11;

      if (isMainSt || isHub || isEpcotPlaza || isTomorrowlandAve || isLibertySpoke) {
        const tileCol = (gx + gz) % 2 === 0 ? 0xe2e8f0 : 0xcbd5e1;
        addVoxel(orlTerrainVoxels, gx, 0, gz, tileCol);
      } else {
        const lushFloridaGreen = (gx * 5 + gz * 3) % 3 === 0 ? 0x15803d : 0x166534;
        addVoxel(orlTerrainVoxels, gx, 0, gz, lushFloridaGreen);
      }
    }
  }

  // --- C. CINDERELLA CASTLE (奥兰多 189英尺高哥特法式灰姑娘城堡 at (0, -6)) ---
  const ccZ = -6;
  // 1. Dove-Grey Granite Lower Curtain Wall & Flying Buttresses (gy = 1..6)
  for (let gx = -3; gx <= 3; gx++) {
    for (let gz = ccZ - 2; gz <= ccZ + 2; gz++) {
      for (let gy = 1; gy <= 6; gy++) {
        if (gx === 0 && gy <= 3 && gz >= ccZ) continue; // Royal Mosaic Breezeway Arch
        const ashlar = (gx + gy + gz) % 2 === 0 ? 0xcbd5e1 : 0x94a3b8;
        addVoxel(orlBuildingVoxels, gx, gy, gz, ashlar);
      }
    }
  }
  // Golden Clock on Front Gothic Entry Tower
  addVoxel(orlBuildingVoxels, 0, 5, ccZ + 2, 0xf59e0b);

  // 4 Outer Bastion Turrets with Sapphire Blue Spires
  [
    [-4, ccZ - 2],
    [4, ccZ - 2],
    [-4, ccZ + 2],
    [4, ccZ + 2],
  ].forEach(([tx, tz]) => {
    for (let gy = 1; gy <= 8; gy++) {
      addVoxel(orlBuildingVoxels, tx, gy, tz, 0xcbd5e1);
    }
    addVoxel(orlSpireVoxels, tx, 9, tz, 0x1e3a8a);
    addVoxel(orlSpireVoxels, tx, 10, tz, 0x1d4ed8);
    addVoxel(orlSpireVoxels, tx, 11, tz, 0xfbbf24);
  });

  // 2. Soaring Alabaster / Ivory French Gothic Upper Keep (gy = 7..14)
  for (let gx = -2; gx <= 2; gx++) {
    for (let gz = ccZ - 1; gz <= ccZ + 1; gz++) {
      for (let gy = 7; gy <= 13; gy++) {
        const ivory = (gx + gy) % 2 === 0 ? 0xf8fafc : 0xf1f5f9;
        addVoxel(orlBuildingVoxels, gx, gy, gz, ivory);
      }
    }
  }

  // Secondary Flanking Slender Towers (gy = 14..18)
  [
    [-2, ccZ],
    [2, ccZ],
    [0, ccZ - 1],
  ].forEach(([tx, tz]) => {
    for (let gy = 14; gy <= 16; gy++) {
      addVoxel(orlBuildingVoxels, tx, gy, tz, 0xf8fafc);
    }
    addVoxel(orlSpireVoxels, tx, 17, tz, 0x1d4ed8);
    addVoxel(orlSpireVoxels, tx, 18, tz, 0x2563eb);
    addVoxel(orlSpireVoxels, tx, 19, tz, 0xf59e0b);
  });

  // 3. Principal 189-ft Royal Spire & 24K Gold Finial (gy = 14..24!)
  for (let gy = 14; gy <= 18; gy++) {
    addVoxel(orlBuildingVoxels, 0, gy, ccZ, 0xffffff);
    addVoxel(orlBuildingVoxels, 1, gy, ccZ, 0xe2e8f0);
  }
  for (let gy = 19; gy <= 22; gy++) {
    addVoxel(orlSpireVoxels, 0, gy, ccZ, 0x1e40af);
  }
  addVoxel(orlSpireVoxels, 0, 23, ccZ, 0xf59e0b);
  addVoxel(orlSpireVoxels, 0, 24, ccZ, 0xfde047);

  // --- D. EPCOT SPACESHIP EARTH 180-FT GEODESIC VOXEL SPHERE (at (0, 10.5)) ---
  const seX = 0;
  const seZ = 10;
  const seCenterY = 7.5;
  const seRadius = 4.2;

  // 3 Pairs of Heavy Steel A-Frame Support Columns
  [
    [-2, seZ - 2],
    [2, seZ - 2],
    [-2, seZ + 2],
    [2, seZ + 2],
    [0, seZ - 3],
    [0, seZ + 3],
  ].forEach(([lx, lz]) => {
    for (let gy = 1; gy <= 4; gy++) {
      addVoxel(orlBuildingVoxels, lx, gy, lz, 0x475569);
    }
  });

  // Complete 360° Geodesic Voxel Sphere Shell
  for (let gx = -4; gx <= 4; gx++) {
    for (let gy = 3; gy <= 12; gy++) {
      for (let gz = seZ - 4; gz <= seZ + 4; gz++) {
        const dist = Math.hypot(gx - seX, gy - seCenterY, gz - seZ);
        if (dist >= seRadius - 1.05 && dist <= seRadius + 0.15) {
          const facetCol =
            (Math.abs(gx) + gy + Math.abs(gz)) % 3 === 0
              ? 0xffffff
              : (gx + gy) % 2 === 0
              ? 0xe2e8f0
              : 0x94a3b8;
          if (gy >= 10) {
            addVoxel(orlSpireVoxels, gx, gy, gz, facetCol);
          } else {
            addVoxel(orlBuildingVoxels, gx, gy, gz, facetCol);
          }
        }
      }
    }
  }

  // Geometric Icosahedral Alucobond Facet Core inside Spaceship Earth for crisp geodesic facets
  const spaceshipEarthPrismCore = new THREE.Mesh(
    new THREE.IcosahedronGeometry(voxelUnitSize * 4.15, 2),
    new THREE.MeshPhysicalMaterial({
      color: 0xe2e8f0,
      roughness: 0.18,
      metalness: 0.85,
      clearcoat: 0.8,
      flatShading: true,
    })
  );
  spaceshipEarthPrismCore.position.set(0, seCenterY * voxelUnitSize, seZ * voxelUnitSize);
  orlandoBuildingsGroup.add(spaceshipEarthPrismCore);

  // --- E. DISNEY'S CONTEMPORARY RESORT 14-STORY A-FRAME HOTEL (at gx = 17, gz = -2) ---
  // Features an open hollow central Grand Canyon Concourse at gy = 4..7 for the Monorail!
  const crX = 17;
  for (let gz = -6; gz <= 2; gz++) {
    for (let gy = 1; gy <= 13; gy++) {
      const slopeSpread = Math.max(1, Math.round(4.2 - gy * 0.25));
      for (let dx = -slopeSpread; dx <= slopeSpread; dx++) {
        // Carve out the open central Grand Canyon Concourse tunnel (dx in [-1..1], gy in [4..7])
        // so the Mark IV Monorail passes straight through the building!
        if (Math.abs(dx) <= 1 && gy >= 4 && gy <= 7) {
          // Place Mary Blair's 90-ft Canyon Mural Column on the west inner wall (dx === -1, gz === -2)
          if (dx === -1 && gz === -2) {
            const muralCol = gy % 2 === 0 ? 0xf59e0b : 0xec4899;
            addVoxel(orlBuildingVoxels, crX + dx, gy, gz, muralCol);
          }
          continue;
        }
        // Only build exterior A-frame structural walls & end facades
        const isSlopedWall = Math.abs(dx) === slopeSpread;
        const isEndFacade = gz === -6 || gz === 2;
        const isTopRoof = gy >= 12;
        if (isSlopedWall || isEndFacade || isTopRoof) {
          const hotelCol =
            gy % 2 === 0 && isSlopedWall
              ? 0xbae6fd // Glass balcony strip
              : 0xd6d3d1; // Precast mid-century concrete
          if (gy >= 11) {
            addVoxel(orlSpireVoxels, crX + dx, gy, gz, hotelCol);
          } else {
            addVoxel(orlBuildingVoxels, crX + dx, gy, gz, hotelCol);
          }
        }
      }
    }
  }

  // --- F. ELEVATED CONCRETE MONORAIL BEAMWAY LOOP (Passes through Contemporary Concourse!) ---
  // Elliptical elevated beamway centered at (6.5, 2.5) with radiusX = 10.5 (reaches gx = 17!), radiusZ = 11.5
  const monoCenterX = 6.5;
  const monoCenterZ = 2.5;
  const monoRx = 10.5;
  const monoRz = 11.5;
  for (let step = 0; step < 72; step++) {
    const theta = (step * Math.PI * 2) / 72;
    const bx = Math.round(monoCenterX + Math.cos(theta) * monoRx);
    const bz = Math.round(monoCenterZ + Math.sin(theta) * monoRz);
    addVoxel(orlBuildingVoxels, bx, 4, bz, 0xf1f5f9);
    // T-Pylon concrete support columns every 6 steps (skip inside Contemporary Resort)
    if (step % 6 === 0 && !(bx >= 15 && bz >= -6 && bz <= 2)) {
      for (let py = 1; py <= 3; py++) {
        addVoxel(orlBuildingVoxels, bx, py, bz, 0x94a3b8);
      }
    }
  }

  // --- G. ORLANDO SPACE MOUNTAIN CONICAL RIBBED DOME (at gx = 11, gz = -9) ---
  const smX = 11;
  const smZ = -9;
  for (let gx = smX - 4; gx <= smX + 4; gx++) {
    for (let gz = smZ - 4; gz <= smZ + 4; gz++) {
      const dist = Math.hypot(gx - smX, gz - smZ);
      if (dist <= 4.3) {
        const coneH = Math.max(1, Math.round(10.5 - dist * 2.2));
        for (let gy = 1; gy <= coneH; gy++) {
          const isRib = (gx - smX === 0 || gz - smZ === 0 || Math.abs(gx - smX) === Math.abs(gz - smZ));
          const smCol = isRib ? 0xffffff : gy === 1 ? 0x0284c7 : 0xe2e8f0;
          if (gy >= 7) {
            addVoxel(orlSpireVoxels, gx, gy, gz, smCol);
          } else {
            addVoxel(orlBuildingVoxels, gx, gy, gz, smCol);
          }
        }
      }
    }
  }

  // --- H. LIBERTY SQUARE HAUNTED MANSION GOTHIC MANOR (at gx = -10, gz = -9) ---
  for (let gx = -12; gx <= -8; gx++) {
    for (let gz = -11; gz <= -7; gz++) {
      for (let gy = 1; gy <= 4; gy++) {
        const hmCol = (gx + gz) % 2 === 0 ? 0x7f1d1d : 0x991b1b;
        addVoxel(orlBuildingVoxels, gx, gy, gz, hmCol);
      }
      addVoxel(orlSpireVoxels, gx, 5, gz, 0x064e3b);
    }
  }
  addVoxel(orlSpireVoxels, -10, 6, -9, 0x065f46);
  addVoxel(orlSpireVoxels, -10, 7, -9, 0xf59e0b);

  // Assemble Orlando Instanced Meshes
  orlandoUtilidorsGroup.add(
    createVoxelInstancedMesh(
      orlUtilidorVoxels,
      new THREE.MeshStandardMaterial({ roughness: 0.65, metalness: 0.15 })
    )
  );
  orlandoTerrainGroup.add(
    createVoxelInstancedMesh(
      orlTerrainVoxels,
      new THREE.MeshStandardMaterial({ roughness: 0.72, metalness: 0.05 })
    )
  );
  orlandoTerrainGroup.add(
    createVoxelInstancedMesh(
      orlWaterVoxels,
      new THREE.MeshPhysicalMaterial({ roughness: 0.12, metalness: 0.1, clearcoat: 0.95 })
    )
  );
  orlandoBuildingsGroup.add(
    createVoxelInstancedMesh(
      orlBuildingVoxels,
      new THREE.MeshStandardMaterial({ roughness: 0.42, metalness: 0.12 })
    )
  );
  orlandoSpiresGroup.add(
    createVoxelInstancedMesh(
      orlSpireVoxels,
      new THREE.MeshPhysicalMaterial({ roughness: 0.25, metalness: 0.4, clearcoat: 0.75 })
    )
  );

  // --- I. ANIMATED MARK IV WALT DISNEY WORLD MONORAIL TRAIN (4 Aerodynamic Cars) ---
  const monorailCars: THREE.Group[] = [];
  for (let mc = 0; mc < 4; mc++) {
    const mCar = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.13, 0.42),
      new THREE.MeshPhysicalMaterial({ color: 0xf8fafc, roughness: 0.2, clearcoat: 0.9 })
    );
    body.position.y = 0.08;
    mCar.add(body);

    // Classic Monorail Red Stripe along Fuselage
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.158, 0.032, 0.425),
      new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3 })
    );
    stripe.position.y = 0.075;
    mCar.add(stripe);

    // Tinted Cockpit Nose on Lead & Tail Cars
    if (mc === 0 || mc === 3) {
      const nose = new THREE.Mesh(
        new THREE.BoxGeometry(0.13, 0.08, 0.12),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.15 })
      );
      nose.position.set(0, 0.09, mc === 0 ? 0.19 : -0.19);
      mCar.add(nose);
    }

    orlandoVehiclesGroup.add(mCar);
    monorailCars.push(mCar);
  }

  // Orlando Liberty Belle Sternwheeler on West Waterway
  const orlandoFerryGroup = riverBoatGroup.clone();
  const orlandoFerryWheel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.085, 0.085, 0.16, 10),
    new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.45 })
  );
  orlandoFerryWheel.rotation.z = Math.PI / 2;
  orlandoFerryWheel.position.set(0, 0.09, -0.26);
  orlandoFerryGroup.add(orlandoFerryWheel);
  orlandoVehiclesGroup.add(orlandoFerryGroup);

  orlandoGroup.add(orlandoUtilidorsGroup);
  orlandoGroup.add(orlandoTerrainGroup);
  orlandoGroup.add(orlandoBuildingsGroup);
  orlandoGroup.add(orlandoSpiresGroup);
  orlandoGroup.add(orlandoVehiclesGroup);
  root.add(orlandoGroup);

  // ============================================================================
  // 4. BLUEPRINT X-RAY WIREFRAME OVERLAY & INTERACTIVE CUSTOM VOXEL BUILDER
  // ============================================================================
  const blueprintWireframeGroup = new THREE.Group();
  blueprintWireframeGroup.position.y = tableSurfaceY + 0.03;
  blueprintWireframeGroup.visible = false;

  const cyanGridMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    wireframe: true,
    transparent: true,
    opacity: 0.32,
  });
  const tableGridOverlay = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 4.4, 48, 34), cyanGridMat);
  tableGridOverlay.rotation.x = -Math.PI / 2;
  blueprintWireframeGroup.add(tableGridOverlay);

  const hubRing = new THREE.Mesh(
    new THREE.RingGeometry(0.45, 0.49, 32),
    new THREE.MeshBasicMaterial({ color: 0xfbbf24, side: THREE.DoubleSide })
  );
  hubRing.rotation.x = -Math.PI / 2;
  hubRing.position.set(0, 0.02, voxelUnitSize);
  blueprintWireframeGroup.add(hubRing);

  root.add(blueprintWireframeGroup);

  const customVoxelGroup = new THREE.Group();
  customVoxelGroup.position.y = tableSurfaceY + 0.025;
  root.add(customVoxelGroup);

  const customVoxelMat = new THREE.MeshStandardMaterial({
    roughness: 0.38,
    metalness: 0.15,
  });

  const rebuildCustomVoxels = (blocks: CustomVoxelBlock[]) => {
    while (customVoxelGroup.children.length > 0) {
      const child = customVoxelGroup.children[0] as THREE.InstancedMesh;
      customVoxelGroup.remove(child);
    }
    if (blocks.length === 0) return;

    const instMesh = new THREE.InstancedMesh(voxelGeo, customVoxelMat, blocks.length);
    instMesh.castShadow = true;
    instMesh.receiveShadow = true;

    blocks.forEach((b, i) => {
      _dummy.position.set(
        b.gx * voxelUnitSize,
        (b.gy + 0.5) * voxelUnitSize,
        b.gz * voxelUnitSize
      );
      _dummy.rotation.set(0, 0, 0);
      _dummy.scale.setScalar(1);
      _dummy.updateMatrix();
      instMesh.setMatrixAt(i, _dummy.matrix);
      _color.setHex(b.colorHex);
      instMesh.setColorAt(i, _color);
    });
    instMesh.instanceMatrix.needsUpdate = true;
    if (instMesh.instanceColor) instMesh.instanceColor.needsUpdate = true;
    instMesh.computeBoundingSphere();
    customVoxelGroup.add(instMesh);
  };

  const placementPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(5.8, 4.2),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  placementPlane.rotation.x = -Math.PI / 2;
  placementPlane.position.y = tableSurfaceY + 0.15;
  root.add(placementPlane);

  // ============================================================================
  // 5. CLICKABLE HITBOXES FOR BOTH ORLANDO & ANAHEIM LANDMARKS
  // ============================================================================
  const cinderellaHitbox = new THREE.Mesh(
    new THREE.BoxGeometry(1.15, 2.8, 1.15),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  cinderellaHitbox.position.set(0, tableSurfaceY + 1.4, -6 * voxelUnitSize);
  cinderellaHitbox.userData = {
    artifactId: 'cinderella-castle-model',
    label: '奥兰多灰姑娘城堡 (189ft) 与地下 Utilidor 管廊',
  };
  orlandoGroup.add(cinderellaHitbox);
  clickablePickTargets.push(cinderellaHitbox);

  const spaceshipEarthHitbox = new THREE.Mesh(
    new THREE.BoxGeometry(1.25, 1.8, 1.25),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  spaceshipEarthHitbox.position.set(0, tableSurfaceY + 0.9, 10 * voxelUnitSize);
  spaceshipEarthHitbox.userData = {
    artifactId: 'spaceship-earth-model',
    label: '艾波卡特「地球飞船 (Spaceship Earth)」测地线球体',
  };
  orlandoGroup.add(spaceshipEarthHitbox);
  clickablePickTargets.push(spaceshipEarthHitbox);

  const contemporaryHitbox = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 1.9, 1.3),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  contemporaryHitbox.position.set(17 * voxelUnitSize, tableSurfaceY + 0.95, -2 * voxelUnitSize);
  contemporaryHitbox.userData = {
    artifactId: 'contemporary-monorail-model',
    label: '当代度假村 14 层 A 字大楼与穿堂 Mark IV 单轨电车',
  };
  orlandoGroup.add(contemporaryHitbox);
  clickablePickTargets.push(contemporaryHitbox);

  const spaceMountainHitbox = new THREE.Mesh(
    new THREE.BoxGeometry(1.15, 1.6, 1.15),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  spaceMountainHitbox.position.set(11 * voxelUnitSize, tableSurfaceY + 0.8, -9 * voxelUnitSize);
  spaceMountainHitbox.userData = {
    artifactId: 'space-mountain-model',
    label: '奥兰多太空山（Space Mountain）锥形肋状穹顶',
  };
  orlandoGroup.add(spaceMountainHitbox);
  clickablePickTargets.push(spaceMountainHitbox);

  // Anaheim Hitboxes (inside anaheimGroup)
  const castleHitbox = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 2.4, 1.1),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  castleHitbox.position.set(0, tableSurfaceY + 1.2, -5 * voxelUnitSize);
  castleHitbox.userData = { artifactId: 'castle-model', label: '加州睡美人城堡 1:48 体素模型' };
  anaheimGroup.add(castleHitbox);
  clickablePickTargets.push(castleHitbox);

  const matterhornHitbox = new THREE.Mesh(
    new THREE.BoxGeometry(0.95, 2.1, 0.95),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  matterhornHitbox.position.set(9 * voxelUnitSize, tableSurfaceY + 1.05, -9 * voxelUnitSize);
  matterhornHitbox.userData = {
    artifactId: 'matterhorn-model',
    label: '加州马特洪峰雪山瀑布与马克·吐温号明轮船',
  };
  anaheimGroup.add(matterhornHitbox);
  clickablePickTargets.push(matterhornHitbox);

  const moonlinerHitbox = new THREE.Mesh(
    new THREE.BoxGeometry(0.85, 2.2, 0.85),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  moonlinerHitbox.position.set(13 * voxelUnitSize, tableSurfaceY + 1.1, 1 * voxelUnitSize);
  moonlinerHitbox.userData = { artifactId: 'moonliner-model', label: '明日世界 TWA 登月火箭模型' };
  anaheimGroup.add(moonlinerHitbox);
  clickablePickTargets.push(moonlinerHitbox);

  const trainStationHitbox = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 1.1, 0.9),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  trainStationHitbox.position.set(0, tableSurfaceY + 0.55, 15 * voxelUnitSize);
  trainStationHitbox.userData = { artifactId: 'steam-train', label: '圣达菲 1号蒸汽火车与小镇车站' };
  anaheimGroup.add(trainStationHitbox);
  clickablePickTargets.push(trainStationHitbox);

  const tableBaseHitbox = new THREE.Mesh(
    new THREE.BoxGeometry(6.8, 1.3, 5.0),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  tableBaseHitbox.position.set(0, 0.65, 0);
  tableBaseHitbox.userData = { artifactId: 'model-table', label: '迪士尼乐园 1:48 微缩总规沙盘台' };
  root.add(tableBaseHitbox);
  clickablePickTargets.push(tableBaseHitbox);

  let parkShown = true;
  let currentEdition: ParkEdition = 'orlando-1971';
  const setParkEdition = (edition: ParkEdition) => {
    currentEdition = edition;
    const isOrlando = edition === 'orlando-1971';
    orlandoGroup.visible = parkShown && isOrlando;
    anaheimGroup.visible = parkShown && !isOrlando;
  };
  const showPark = (on: boolean) => {
    parkShown = on;
    setParkEdition(currentEdition);
  };

  // Default to Orlando 1971 Walt Disney World edition!
  setParkEdition('orlando-1971');

  return {
    root,
    showPark,
    tableFurnitureGroup,
    anaheimGroup,
    layerTerrainGroup,
    layerBuildingsGroup,
    layerSpireRoofsGroup,
    layerVehiclesGroup,
    trainCars,
    steamPuffs,
    carouselCanopy,
    astroJetsRotor,
    dumboRotor,
    riverBoatGroup,
    sternWheelMesh,
    orlandoGroup,
    orlandoUtilidorsGroup,
    orlandoTerrainGroup,
    orlandoBuildingsGroup,
    orlandoSpiresGroup,
    orlandoVehiclesGroup,
    monorailCars,
    orlandoFerryGroup,
    orlandoFerryWheel,
    spaceshipEarthPrismCore,
    blueprintWireframeGroup,
    customVoxelGroup,
    placementPlane,
    clickablePickTargets,
    voxelUnitSize,
    tableSurfaceY,
    rebuildCustomVoxels,
    setParkEdition,
  };
}
