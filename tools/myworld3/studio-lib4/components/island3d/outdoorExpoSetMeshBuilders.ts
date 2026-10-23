import * as THREE from 'three';
import { IslandMetadata, IslandVariant } from '../../types/island';
import { createGlassMat } from './materials';

function mat(color: number | string, options: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    flatShading: true,
    roughness: 0.65,
    metalness: 0.12,
    ...options,
  });
}

/**
 * Creates the base architectural plaza foundation slab for Outdoor Expo Sets.
 * Paved plaza slab with beveled edges, inlaid LED ground channels, and optional boundary details.
 */
function createExpoPlazaFloorSlab(
  palette: IslandMetadata['palette'],
  radius: number = 4.8,
  slabHeight: number = 0.28,
  accentColorHex?: string
): THREE.Group {
  const g = new THREE.Group();
  const baseColor = palette[1]?.hex || '#0F172A';
  const rimColor = accentColorHex || palette[0]?.hex || '#0EA5E9';

  // Sub-ground pedestal rim
  const lowerGeo = new THREE.CylinderGeometry(radius + 0.15, radius + 0.25, 0.2, 36);
  const lowerMesh = new THREE.Mesh(lowerGeo, mat('#090D16', { roughness: 0.9 }));
  lowerMesh.position.y = -0.1;
  lowerMesh.receiveShadow = true;
  g.add(lowerMesh);

  // Main plaza slab
  const upperGeo = new THREE.CylinderGeometry(radius, radius + 0.05, slabHeight, 36);
  const upperMesh = new THREE.Mesh(upperGeo, mat(baseColor, { roughness: 0.7 }));
  upperMesh.position.y = slabHeight / 2;
  upperMesh.receiveShadow = true;
  g.add(upperMesh);

  // Inlaid perimeter LED border ring
  const ringGeo = new THREE.TorusGeometry(radius - 0.12, 0.04, 6, 36);
  const ringMesh = new THREE.Mesh(
    ringGeo,
    mat(rimColor, {
      metalness: 0.5,
      roughness: 0.2,
      emissive: new THREE.Color(rimColor),
      emissiveIntensity: 0.4,
    })
  );
  ringMesh.rotation.x = Math.PI / 2;
  ringMesh.position.y = slabHeight + 0.01;
  g.add(ringMesh);

  // Secondary inner accent tile circle
  const innerRingGeo = new THREE.TorusGeometry(radius - 1.2, 0.02, 6, 32);
  const innerRingMesh = new THREE.Mesh(innerRingGeo, mat(rimColor, { roughness: 0.4 }));
  innerRingMesh.rotation.x = Math.PI / 2;
  innerRingMesh.position.y = slabHeight + 0.01;
  g.add(innerRingMesh);

  return g;
}

/**
 * Procedural 3D Mesh Builder for 20 Large Outdoor Expo Sets (diorama_expo_01 to diorama_expo_20)
 */
export function buildOutdoorExpoSetScene(
  island: IslandMetadata,
  variant: IslandVariant = 'classic'
): THREE.Group {
  const root = new THREE.Group();

  const p0 = island.palette[0]?.hex || '#0EA5E9';
  const p1 = island.palette[1]?.hex || '#0F172A';
  const p2 = island.palette[2]?.hex || '#F8FAFC';
  const p3 = island.palette[3]?.hex || '#64748B';
  const p4 = island.palette[4]?.hex || '#10B981';

  // Base plaza slab
  const floorSlab = createExpoPlazaFloorSlab(island.palette, 4.7, 0.26, p0);
  root.add(floorSlab);

  const id = island.id;

  // =========================================================================
  // 01. Future Green Mobility & Concept EV Pavilion Set
  // =========================================================================
  if (id.includes('01_green_mobility')) {
    // 1. Dual Cantilevered Tensile Wing Canopy
    const mastGeo = new THREE.CylinderGeometry(0.08, 0.12, 3.8, 12);
    const mastMat = mat(p3, { metalness: 0.8, roughness: 0.2 });
    [-2.2, 2.2].forEach((x) => {
      const mast = new THREE.Mesh(mastGeo, mastMat);
      mast.position.set(x, 1.9, -1.8);
      mast.rotation.z = x > 0 ? -0.15 : 0.15;
      root.add(mast);
    });

    // Double-curved tensile canopy sail
    const sailGeo = new THREE.ConeGeometry(3.6, 1.2, 4, 1, true);
    const sailMat = mat(p2, { side: THREE.DoubleSide, roughness: 0.35 });
    const sail = new THREE.Mesh(sailGeo, sailMat);
    sail.rotation.x = Math.PI / 1.15;
    sail.rotation.y = Math.PI / 4;
    sail.scale.set(1.2, 0.4, 1.0);
    sail.position.set(0, 3.4, -0.6);
    root.add(sail);

    // 2. Centerpiece: Turntable with Aerodynamic Concept EV
    const stageGeo = new THREE.CylinderGeometry(1.8, 1.9, 0.2, 32);
    const stage = new THREE.Mesh(stageGeo, mat(p1, { roughness: 0.3 }));
    stage.position.set(0, 0.36, 0.3);
    root.add(stage);

    const ringHaloGeo = new THREE.TorusGeometry(1.85, 0.04, 6, 32);
    const ringHalo = new THREE.Mesh(
      ringHaloGeo,
      mat(p0, { emissive: new THREE.Color(p0), emissiveIntensity: 0.6 })
    );
    ringHalo.rotation.x = Math.PI / 2;
    ringHalo.position.set(0, 0.46, 0.3);
    root.add(ringHalo);

    // Concept EV Car Body
    const carGroup = new THREE.Group();
    const chassisGeo = new THREE.BoxGeometry(1.4, 0.35, 2.6);
    const chassis = new THREE.Mesh(chassisGeo, mat(p0, { metalness: 0.7, roughness: 0.2 }));
    chassis.position.y = 0.25;
    carGroup.add(chassis);

    const cabinGeo = new THREE.CylinderGeometry(0.5, 0.65, 1.4, 8);
    const cabin = new THREE.Mesh(cabinGeo, mat('#1E293B', { roughness: 0.1, metalness: 0.9 }));
    cabin.rotation.x = Math.PI / 2;
    cabin.position.set(0, 0.52, -0.1);
    carGroup.add(cabin);

    // 4 Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.16, 16);
    const wheelMat = mat('#0F172A', { roughness: 0.8 });
    [
      [-0.72, 0.28, 0.8],
      [0.72, 0.28, 0.8],
      [-0.72, 0.28, -0.8],
      [0.72, 0.28, -0.8],
    ].forEach(([wx, wy, wz]) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, wy, wz);
      carGroup.add(wheel);
    });
    carGroup.position.set(0, 0.46, 0.3);
    carGroup.rotation.y = 0.4;
    root.add(carGroup);

    // 3. Dual Liquid-Cooled Charging Pillars
    [-1.2, 1.2].forEach((cx, idx) => {
      const charger = new THREE.Group();
      const colGeo = new THREE.BoxGeometry(0.25, 1.4, 0.25);
      const col = new THREE.Mesh(colGeo, mat('#334155', { metalness: 0.5 }));
      col.position.y = 0.7;
      charger.add(col);

      // Light strip
      const stripGeo = new THREE.BoxGeometry(0.04, 1.1, 0.04);
      const strip = new THREE.Mesh(
        stripGeo,
        mat(p0, { emissive: new THREE.Color(p0), emissiveIntensity: 0.8 })
      );
      strip.position.set(0, 0.7, 0.13);
      charger.add(strip);

      charger.position.set(cx, 0.26, -2.4);
      root.add(charger);
    });

    // 4. Tiered Battery Pack & Powertrain Display Rack
    const rackGroup = new THREE.Group();
    const shelfBackGeo = new THREE.BoxGeometry(2.0, 1.6, 0.1);
    const shelfBack = new THREE.Mesh(shelfBackGeo, mat('#1E293B', { roughness: 0.4 }));
    shelfBack.position.set(0, 1.0, 0);
    rackGroup.add(shelfBack);

    for (let s = 0; s < 3; s++) {
      const tierGeo = new THREE.BoxGeometry(1.8, 0.06, 0.45);
      const tier = new THREE.Mesh(tierGeo, mat(p3, { metalness: 0.6 }));
      tier.position.set(0, 0.4 + s * 0.45, 0.22);
      rackGroup.add(tier);

      // Modular battery cells
      for (let b = -2; b <= 2; b++) {
        const cellGeo = new THREE.BoxGeometry(0.25, 0.18, 0.3);
        const cell = new THREE.Mesh(
          cellGeo,
          mat(p0, { emissive: new THREE.Color(p0), emissiveIntensity: 0.2 })
        );
        cell.position.set(b * 0.34, 0.52 + s * 0.45, 0.22);
        rackGroup.add(cell);
      }
    }
    rackGroup.position.set(-2.8, 0.26, 0.5);
    rackGroup.rotation.y = Math.PI / 3;
    root.add(rackGroup);

    // 5. Interactive Specs Totem & Planter Hedges
    const totemGeo = new THREE.BoxGeometry(0.35, 1.25, 0.15);
    const totem = new THREE.Mesh(totemGeo, mat('#0F172A', { metalness: 0.8 }));
    totem.position.set(2.4, 0.88, 1.2);
    totem.rotation.y = -0.5;
    root.add(totem);

    const screenGeo = new THREE.PlaneGeometry(0.25, 0.6);
    const screen = new THREE.Mesh(
      screenGeo,
      mat(p0, { emissive: new THREE.Color(p0), emissiveIntensity: 0.7 })
    );
    screen.position.set(2.33, 1.05, 1.25);
    screen.rotation.y = -0.5;
    root.add(screen);

    // Modernist hedges in steel troughs
    [-2.6, 2.6].forEach((hx) => {
      const trough = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.35, 0.4),
        mat(p3, { metalness: 0.7 })
      );
      trough.position.set(hx, 0.43, -1.2);
      root.add(trough);

      const hedge = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.45, 0.35), mat(p4));
      hedge.position.set(hx, 0.75, -1.2);
      root.add(hedge);
    });
  }

  // =========================================================================
  // 02. Aerospace & Orbital Satellite Open-Air Expo Set
  // =========================================================================
  else if (id.includes('02_aerospace_satellite')) {
    // 1. Heavy Industrial Aluminum Space Truss Gantry
    const trussMat = mat(p0, { metalness: 0.9, roughness: 0.2 });
    [-2.2, 2.2].forEach((x) => {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4.0, 0.2), trussMat);
      pillar.position.set(x, 2.0, -1.8);
      root.add(pillar);
    });

    const crossBeam = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.25, 0.25), trussMat);
    crossBeam.position.set(0, 3.8, -1.8);
    root.add(crossBeam);

    // Cross brace diagonals
    const brace1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.6), trussMat);
    brace1.rotation.z = Math.PI / 4;
    brace1.position.set(-0.8, 3.8, -1.8);
    root.add(brace1);
    const brace2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.6), trussMat);
    brace2.rotation.z = -Math.PI / 4;
    brace2.position.set(0.8, 3.8, -1.8);
    root.add(brace2);

    // 2. Suspended 1:5 Scale Satellite with Gold Polyimide Arrays
    const satGroup = new THREE.Group();
    const satBusGeo = new THREE.BoxGeometry(0.9, 0.9, 1.2);
    const satBus = new THREE.Mesh(satBusGeo, mat(p1, { metalness: 0.8, roughness: 0.3 }));
    satGroup.add(satBus);

    // Dish antenna
    const dishGeo = new THREE.CylinderGeometry(0.6, 0.1, 0.25, 16);
    const dish = new THREE.Mesh(dishGeo, mat(p0, { metalness: 0.9 }));
    dish.rotation.x = Math.PI / 3;
    dish.position.set(0, 0.7, 0.2);
    satGroup.add(dish);

    // Dual Gold Solar Array Wings
    [-1.8, 1.8].forEach((ax) => {
      const solarGeo = new THREE.BoxGeometry(1.6, 0.04, 0.9);
      const solarMat = mat(p1, { metalness: 0.9, roughness: 0.1, color: '#F59E0B' });
      const solar = new THREE.Mesh(solarGeo, solarMat);
      solar.position.set(ax, 0, 0);
      satGroup.add(solar);
    });

    satGroup.position.set(0, 2.8, -1.0);
    satGroup.rotation.y = 0.2;
    satGroup.rotation.x = 0.15;
    root.add(satGroup);

    // 3. Rocket Engine Nozzle on Tilting Skid Cradle
    const cradleGeo = new THREE.BoxGeometry(1.6, 0.35, 1.2);
    const cradle = new THREE.Mesh(cradleGeo, mat('#334155', { metalness: 0.8 }));
    cradle.position.set(1.8, 0.43, 0.8);
    root.add(cradle);

    const nozzleGeo = new THREE.ConeGeometry(0.65, 1.1, 16, 1, true);
    const nozzleMat = mat('#64748B', { metalness: 0.9, roughness: 0.2 });
    const nozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
    nozzle.rotation.x = -Math.PI / 3;
    nozzle.position.set(1.8, 0.9, 0.8);
    root.add(nozzle);

    // 4. Glass-Enclosed Meteorite Specimen Vitrines
    [-1.8, -0.6].forEach((vx, i) => {
      const plinth = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.35, 0.8, 16),
        mat(p2, { metalness: 0.5 })
      );
      plinth.position.set(vx, 0.66, 1.2);
      root.add(plinth);

      const glassCube = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.5, 0.5),
        createGlassMat(0.2, 0.1)
      );
      glassCube.position.set(vx, 1.3, 1.2);
      root.add(glassCube);

      // Meteorite specimen inside
      const met = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.12, 1),
        mat('#1E293B', { roughness: 0.9 })
      );
      met.position.set(vx, 1.28, 1.2);
      root.add(met);
    });

    // 5. Tiered Avionics Server Rack Tower
    const serverRack = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 1.8, 0.5),
      mat('#0F172A', { metalness: 0.8 })
    );
    serverRack.position.set(-2.8, 1.16, -0.2);
    serverRack.rotation.y = 0.5;
    root.add(serverRack);

    // Glowing server LEDs
    for (let l = 0; l < 5; l++) {
      const led = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 0.08, 0.04),
        mat(p3, { emissive: new THREE.Color(p3), emissiveIntensity: 0.8 })
      );
      led.position.set(-2.7, 0.6 + l * 0.28, -0.0);
      led.rotation.y = 0.5;
      root.add(led);
    }
  }

  // =========================================================================
  // 03. Smart Robotics & Bionic AI Interactive Demo Set
  // =========================================================================
  else if (id.includes('03_robotics_ai')) {
    // 1. Hexagonal Polycarbonate Sunshade Canopy
    const canopyMat = mat(p2, { roughness: 0.3 });
    const canopyGeo = new THREE.CylinderGeometry(2.8, 2.8, 0.15, 6);
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.set(0, 3.5, 0);
    root.add(canopy);

    // Angled support legs
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.1, 3.6),
        mat(p1, { metalness: 0.7 })
      );
      leg.position.set(Math.cos(angle) * 2.4, 1.8, Math.sin(angle) * 2.4);
      leg.rotation.x = Math.sin(angle) * -0.15;
      leg.rotation.z = Math.cos(angle) * 0.15;
      root.add(leg);
    }

    // 2. Central 6-Axis Robotic Arm on Safety Arena
    const arenaFloor = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 1.6, 0.15, 24),
      mat('#1E293B', { roughness: 0.4 })
    );
    arenaFloor.position.set(0, 0.33, 0);
    root.add(arenaFloor);

    // Glowing laser boundary
    const laserRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.5, 0.03, 6, 24),
      mat(p3, { emissive: new THREE.Color(p3), emissiveIntensity: 0.9 })
    );
    laserRing.rotation.x = Math.PI / 2;
    laserRing.position.set(0, 0.42, 0);
    root.add(laserRing);

    // Robot Arm Joint Assembly
    const armGroup = new THREE.Group();
    const basePillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.45, 0.4, 16),
      mat(p0, { metalness: 0.6 })
    );
    basePillar.position.y = 0.2;
    armGroup.add(basePillar);

    const shoulder = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 12, 12),
      mat('#0F172A', { metalness: 0.8 })
    );
    shoulder.position.y = 0.5;
    armGroup.add(shoulder);

    const bicep = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.9, 0.2),
      mat(p0, { metalness: 0.5 })
    );
    bicep.position.set(0.2, 0.9, 0);
    bicep.rotation.z = -0.35;
    armGroup.add(bicep);

    const elbow = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 12, 12),
      mat('#0F172A', { metalness: 0.8 })
    );
    elbow.position.set(0.45, 1.35, 0);
    armGroup.add(elbow);

    const forearm = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.8, 0.16),
      mat(p0, { metalness: 0.5 })
    );
    forearm.position.set(0.15, 1.7, 0);
    forearm.rotation.z = 0.5;
    armGroup.add(forearm);

    // Vacuum Gripper End-Effector
    const gripper = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.18, 0.2, 12),
      mat(p3, { metalness: 0.9 })
    );
    gripper.position.set(-0.15, 2.05, 0);
    armGroup.add(gripper);

    armGroup.position.set(0, 0.33, 0);
    root.add(armGroup);

    // 3. Quadruped Robotic Dog Charging Dock
    const dogGroup = new THREE.Group();
    const dogBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.22, 0.6),
      mat(p0, { metalness: 0.5 })
    );
    dogBody.position.y = 0.35;
    dogGroup.add(dogBody);

    const dogHead = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.18, 0.25),
      mat('#0F172A', { metalness: 0.8 })
    );
    dogHead.position.set(0, 0.45, 0.38);
    dogGroup.add(dogHead);

    // 4 legs
    [
      [-0.18, 0.18, 0.2],
      [0.18, 0.18, 0.2],
      [-0.18, 0.18, -0.2],
      [0.18, 0.18, -0.2],
    ].forEach(([dx, dy, dz]) => {
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.35),
        mat('#334155', { metalness: 0.8 })
      );
      leg.position.set(dx, dy, dz);
      dogGroup.add(leg);
    });

    dogGroup.position.set(-1.8, 0.26, 1.2);
    dogGroup.rotation.y = 0.8;
    root.add(dogGroup);

    // 4. Tiered End-Effector Tool Slatwall Display Rack
    const toolRack = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 1.6, 0.15),
      mat('#1E293B', { roughness: 0.5 })
    );
    toolRack.position.set(2.4, 1.06, -0.8);
    toolRack.rotation.y = -0.6;
    root.add(toolRack);

    for (let t = 0; t < 3; t++) {
      const shelf = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.05, 0.3),
        mat(p0, { metalness: 0.6 })
      );
      shelf.position.set(2.35, 0.55 + t * 0.45, -0.75);
      shelf.rotation.y = -0.6;
      root.add(shelf);
    }
  }

  // =========================================================================
  // 04. Renewable Energy & Solar Eco-Plaza Set
  // =========================================================================
  else if (id.includes('04_renewable_energy')) {
    // 1. Parametric Timber Pergola with Solar Glass Panels
    const timberMat = mat(p0, { roughness: 0.6 });
    for (let i = -3; i <= 3; i++) {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.2, 4.4), timberMat);
      rib.position.set(i * 0.6, 1.8 + Math.sin(i * 0.4) * 0.3, 0);
      rib.rotation.x = Math.PI / 16;
      root.add(rib);

      // Solar glass panel insert
      const pvPane = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.03, 4.2),
        mat(p1, { roughness: 0.1, metalness: 0.7 })
      );
      pvPane.position.set(i * 0.6, 3.4 + Math.sin(i * 0.4) * 0.3, 0);
      root.add(pvPane);
    }

    // 2. Wind Turbine Aerodynamic Blade Section
    const bladeGroup = new THREE.Group();
    const bladeGeo = new THREE.ConeGeometry(0.4, 3.8, 16);
    const blade = new THREE.Mesh(bladeGeo, mat(p3, { roughness: 0.2 }));
    blade.rotation.z = Math.PI / 2.3;
    blade.scale.set(0.6, 1.0, 0.25);
    bladeGroup.add(blade);

    // Timber sawhorses
    [-1.2, 1.2].forEach((hx) => {
      const trestle = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.6, 0.6), timberMat);
      trestle.position.set(hx, -0.3, 0);
      bladeGroup.add(trestle);
    });

    bladeGroup.position.set(0, 0.8, 1.2);
    root.add(bladeGroup);

    // 3. Modular Battery Storage Inverter Rack
    const battCabinet = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.8, 0.5),
      mat('#0F172A', { metalness: 0.8 })
    );
    battCabinet.position.set(-2.4, 1.16, -1.2);
    root.add(battCabinet);

    // Battery modules drawers
    for (let b = 0; b < 4; b++) {
      const battMod = new THREE.Mesh(
        new THREE.BoxGeometry(1.0, 0.22, 0.06),
        mat(p1, { emissive: new THREE.Color(p1), emissiveIntensity: 0.3 })
      );
      battMod.position.set(-2.4, 0.5 + b * 0.35, -0.92);
      root.add(battMod);
    }

    // 4. Vertical Succulent Living Wall
    const mossWall = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.2, 0.2), mat(p2));
    mossWall.position.set(2.4, 1.36, -1.2);
    mossWall.rotation.y = -0.3;
    root.add(mossWall);
  }

  // =========================================================================
  // 05. Outdoor Adventure & Overland Glamping Expo Set
  // =========================================================================
  else if (id.includes('05_adventure_glamping')) {
    // 1. Raised Cedar Timber Decking Platform
    const deckMat = mat(p0, { roughness: 0.7 });
    const deck = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.3, 0.2, 24), deckMat);
    deck.position.set(0, 0.36, 0);
    root.add(deck);

    // 2. Geodesic Glamping Dome Tent
    const domeGeo = new THREE.IcosahedronGeometry(1.8, 1);
    const domeMat = mat(p1, { roughness: 0.6 });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.set(-1.6, 1.2, -1.0);
    root.add(dome);

    // Bay window cutaway
    const windowMat = createGlassMat(0.3, 0.1);
    const winGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.2, 12);
    const win = new THREE.Mesh(winGeo, windowMat);
    win.rotation.x = Math.PI / 2;
    win.position.set(-1.1, 1.2, -0.2);
    root.add(win);

    // 3. Overland 4x4 Vehicle Rig with Rooftop Tent
    const suvGroup = new THREE.Group();
    const suvBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.65, 2.2),
      mat(p3, { metalness: 0.6, roughness: 0.3 })
    );
    suvBody.position.y = 0.55;
    suvGroup.add(suvBody);

    // Rooftop tent folded box
    const rtt = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.25, 1.5), mat(p1));
    rtt.position.set(0, 0.95, -0.1);
    suvGroup.add(rtt);

    // 4 chunky all-terrain wheels
    [
      [-0.62, 0.32, 0.7],
      [0.62, 0.32, 0.7],
      [-0.62, 0.32, -0.7],
      [0.62, 0.32, -0.7],
    ].forEach(([wx, wy, wz]) => {
      const tire = new THREE.Mesh(
        new THREE.CylinderGeometry(0.32, 0.32, 0.22, 16),
        mat('#0F172A', { roughness: 0.9 })
      );
      tire.rotation.z = Math.PI / 2;
      tire.position.set(wx, wy, wz);
      suvGroup.add(tire);
    });

    suvGroup.position.set(1.8, 0.36, -0.5);
    suvGroup.rotation.y = -0.2;
    root.add(suvGroup);

    // 4. Gear Pegboard Rack & Titanium Kitchen
    const pegboard = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 1.5, 0.08),
      mat('#1E293B', { metalness: 0.7 })
    );
    pegboard.position.set(-2.4, 1.2, 1.2);
    pegboard.rotation.y = 0.6;
    root.add(pegboard);

    // Camp axes and cookware hanging
    for (let c = 0; c < 3; c++) {
      const mug = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.12, 12),
        mat('#94A3B8', { metalness: 0.9 })
      );
      mug.position.set(-2.2 + c * 0.25, 1.0, 1.1 + c * 0.15);
      root.add(mug);
    }

    // 5. Sunken Campfire Lounge Ring
    const firePit = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.6, 0.18, 16),
      mat('#0F172A', { roughness: 0.9 })
    );
    firePit.position.set(0.2, 0.45, 1.4);
    root.add(firePit);

    const flame = new THREE.Mesh(
      new THREE.ConeGeometry(0.2, 0.4, 8),
      mat(p2, { emissive: new THREE.Color(p2), emissiveIntensity: 0.9 })
    );
    flame.position.set(0.2, 0.65, 1.4);
    root.add(flame);
  }

  // =========================================================================
  // 06. Superyacht & Marine Nautical Expo Set
  // =========================================================================
  else if (id.includes('06_superyacht_marine')) {
    // 1. Teak Yacht-Decking Platform
    const deckMat = mat(p0, { roughness: 0.5 });
    const deck = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.24, 4.6), deckMat);
    deck.position.set(0, 0.38, 0);
    root.add(deck);

    // Polished 316 Stainless Steel Railings
    const railMat = mat(p1, { metalness: 0.95, roughness: 0.1 });
    for (let r = -2.0; r <= 2.0; r += 0.8) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.8), railMat);
      post.position.set(r, 0.88, 2.2);
      root.add(post);
    }
    const handrail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 4.4), railMat);
    handrail.rotation.z = Math.PI / 2;
    handrail.position.set(0, 1.28, 2.2);
    root.add(handrail);

    // 2. 1:20 Scale Luxury Motor Yacht Model on Mahogany Cradle
    const yachtGroup = new THREE.Group();
    // Sleek hull
    const hullGeo = new THREE.CylinderGeometry(0.5, 0.2, 2.8, 12);
    const hull = new THREE.Mesh(hullGeo, mat('#F8FAFC', { roughness: 0.2, metalness: 0.3 }));
    hull.rotation.x = Math.PI / 2;
    hull.scale.set(1.4, 0.8, 1.0);
    yachtGroup.add(hull);

    // Navy hull stripe
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.08, 2.7),
      mat(p2, { roughness: 0.2 })
    );
    stripe.position.y = -0.1;
    yachtGroup.add(stripe);

    // Yacht Superstructure & flybridge
    const superGeo = new THREE.BoxGeometry(0.8, 0.45, 1.6);
    const superMesh = new THREE.Mesh(superGeo, mat('#F8FAFC', { roughness: 0.2 }));
    superMesh.position.set(0, 0.4, -0.2);
    yachtGroup.add(superMesh);

    // Cradle stand
    [-0.8, 0.8].forEach((cx) => {
      const cr = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.25, 0.2), mat('#78350F'));
      cr.position.set(0, -0.4, cx);
      yachtGroup.add(cr);
    });

    yachtGroup.position.set(-0.8, 1.0, -0.4);
    yachtGroup.rotation.y = 0.3;
    root.add(yachtGroup);

    // 3. Glass-Bridge Marine Helm Console
    const helm = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.1, 0.5),
      mat('#0F172A', { metalness: 0.8 })
    );
    helm.position.set(1.8, 0.93, 0.8);
    helm.rotation.y = -0.5;
    root.add(helm);

    // Dual GPS displays
    [-0.25, 0.25].forEach((gx) => {
      const gps = new THREE.Mesh(
        new THREE.PlaneGeometry(0.35, 0.25),
        mat(p3, { emissive: new THREE.Color(p3), emissiveIntensity: 0.6 })
      );
      gps.position.set(1.65 + gx * 0.4, 1.25, 0.95);
      gps.rotation.y = -0.5;
      root.add(gps);
    });
  }

  // =========================================================================
  // 07. Luxury Botanical & Landscape Floral Pavilion Set
  // =========================================================================
  else if (id.includes('07_botanical_floral')) {
    // 1. Wrought-Iron Victorian Orangerie Gazebo Dome
    const ironMat = mat(p2, { metalness: 0.8, roughness: 0.2 });
    for (let a = 0; a < 6; a++) {
      const ang = (a * Math.PI * 2) / 6;
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 3.2), ironMat);
      col.position.set(Math.cos(ang) * 2.4, 1.86, Math.sin(ang) * 2.4);
      root.add(col);

      // Rib arch
      const arch = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.03, 6, 16, Math.PI), ironMat);
      arch.rotation.y = ang;
      arch.position.y = 3.2;
      root.add(arch);
    }

    // 2. Central Three-Tier Copper Fountain
    const fountGroup = new THREE.Group();
    const basinMat = mat(p3, { metalness: 0.85, roughness: 0.3 });
    [
      [1.1, 0.25, 0.3],
      [0.75, 0.2, 0.7],
      [0.45, 0.16, 1.1],
    ].forEach(([rad, hgt, y]) => {
      const basin = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad * 0.8, hgt, 16), basinMat);
      basin.position.y = y;
      fountGroup.add(basin);
    });
    fountGroup.position.set(0, 0.26, 0);
    root.add(fountGroup);

    // 3. Stepped Semi-Circular Marble Plant Bleachers
    const marbleMat = mat('#F1F5F9', { roughness: 0.3 });
    for (let s = 0; s < 3; s++) {
      const stepGeo = new THREE.CylinderGeometry(
        2.2 + s * 0.4,
        2.2 + s * 0.4,
        0.25,
        16,
        1,
        false,
        0,
        Math.PI
      );
      const step = new THREE.Mesh(stepGeo, marbleMat);
      step.position.set(0, 0.38 + s * 0.25, -0.6);
      root.add(step);

      // Potted plants & flowers
      for (let p = 0; p < 5; p++) {
        const flower = new THREE.Mesh(new THREE.DodecahedronGeometry(0.16, 1), mat(p1));
        const ang = (p * Math.PI) / 4;
        flower.position.set(Math.cos(ang) * (2.1 + s * 0.4), 0.62 + s * 0.25, -0.6 - Math.sin(ang) * 0.5);
        root.add(flower);
      }
    }
  }

  // =========================================================================
  // 08. Architectural Tech & Modular Prefab Living Set
  // =========================================================================
  else if (id.includes('08_architectural_prefab')) {
    // 1. Cantilevered CLT Timber Portal Frame Canopy
    const cltMat = mat(p0, { roughness: 0.6 });
    const cltPost = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3.4, 0.4), cltMat);
    cltPost.position.set(-2.2, 1.96, -1.8);
    root.add(cltPost);

    const cltBeam = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.35, 3.2), cltMat);
    cltBeam.position.set(0, 3.5, -0.4);
    root.add(cltBeam);

    // 2. 1:1 Scale Exposed Structural Wall Cross-Section Cutaway
    const wallCut = new THREE.Group();
    const studWall = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 2.2, 0.15),
      mat('#64748B', { metalness: 0.5 })
    );
    studWall.position.set(0, 1.1, 0);
    wallCut.add(studWall);

    const insulation = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 1.8, 0.08),
      mat(p0, { roughness: 0.9 })
    );
    insulation.position.set(0, 1.1, 0.1);
    wallCut.add(insulation);

    wallCut.position.set(-1.8, 0.26, 0.6);
    wallCut.rotation.y = 0.5;
    root.add(wallCut);

    // 3. Sliding Material Sample Swatch Rack
    const rack = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 1.8, 0.4),
      mat(p1, { metalness: 0.8 })
    );
    rack.position.set(2.2, 1.16, -1.2);
    rack.rotation.y = -0.4;
    root.add(rack);

    // 4. Masterplan Scale Model on Acrylic Vitrine Plinth
    const plinth = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.7, 1.0),
      mat('#0F172A', { metalness: 0.7 })
    );
    plinth.position.set(0.6, 0.61, 0.8);
    root.add(plinth);

    const glassVit = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 0.5, 0.9),
      createGlassMat(0.2, 0.1)
    );
    glassVit.position.set(0.6, 1.15, 0.8);
    root.add(glassVit);

    // Mini skyscraper models inside
    [-0.2, 0.2].forEach((mx) => {
      const bldg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.4, 0.2), mat(p3));
      bldg.position.set(0.6 + mx, 1.1, 0.8);
      root.add(bldg);
    });
  }

  // =========================================================================
  // 09. Smart Agriculture & Drone Farming Field Set
  // =========================================================================
  else if (id.includes('09_smart_agriculture')) {
    // 1. Green Permeable Agro-Mesh Sunshade Canopy
    const meshMat = mat(p0, { transparent: true, opacity: 0.75, roughness: 0.7 });
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.05, 3.8), meshMat);
    canopy.position.set(0, 3.4, 0);
    root.add(canopy);

    // Galvanized pipe posts
    [
      [-2.1, -1.8],
      [2.1, -1.8],
      [-2.1, 1.8],
      [2.1, 1.8],
    ].forEach(([px, pz]) => {
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 3.4),
        mat('#94A3B8', { metalness: 0.8 })
      );
      pole.position.set(px, 1.7, pz);
      root.add(pole);
    });

    // 2. Large Octocopter Agricultural Spray Drone on Landing Pad
    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(1.4, 1.4, 0.15, 24),
      mat('#1E293B', { roughness: 0.5 })
    );
    pad.position.set(-0.8, 0.33, -0.4);
    root.add(pad);

    // Yellow H Helipad Decal
    const hDecal = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.02, 0.15),
      mat(p1, { emissive: new THREE.Color(p1), emissiveIntensity: 0.5 })
    );
    hDecal.position.set(-0.8, 0.42, -0.4);
    root.add(hDecal);

    // Octocopter Drone Model
    const droneGroup = new THREE.Group();
    const dBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.35, 0.25, 8),
      mat('#0F172A', { metalness: 0.8 })
    );
    droneGroup.add(dBody);

    // Tank
    const dTank = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.3), mat(p0));
    dTank.position.y = -0.15;
    droneGroup.add(dTank);

    // 8 Rotor Arms & Propellers
    for (let a = 0; a < 8; a++) {
      const ang = (a * Math.PI * 2) / 8;
      const arm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 0.7),
        mat('#64748B', { metalness: 0.9 })
      );
      arm.rotation.z = Math.PI / 2;
      arm.rotation.y = ang;
      arm.position.set(Math.cos(ang) * 0.4, 0.05, Math.sin(ang) * 0.4);
      droneGroup.add(arm);

      // Propeller
      const prop = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.01, 0.03),
        mat('#334155', { metalness: 0.7 })
      );
      prop.position.set(Math.cos(ang) * 0.75, 0.08, Math.sin(ang) * 0.75);
      droneGroup.add(prop);
    }
    droneGroup.position.set(-0.8, 0.65, -0.4);
    root.add(droneGroup);

    // 3. Dual A-Frame Hydroponic Tower Racks
    [-1.2, 1.2].forEach((hx) => {
      const hydroA = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.8, 4), mat('#F8FAFC'));
      hydroA.position.set(1.8, 1.16, hx);
      root.add(hydroA);

      // Green lettuce leaves along rack
      for (let l = 0; l < 4; l++) {
        const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.15, 0.7), mat(p0));
        leaf.position.set(1.8, 0.5 + l * 0.35, hx);
        root.add(leaf);
      }
    });
  }

  // =========================================================================
  // 10. International Contemporary Sculpture Biennale Set
  // =========================================================================
  else if (id.includes('10_sculpture_biennale')) {
    // 1. Towering Corten Steel Twisted Monolith Sculpture
    const cortenMat = mat(p0, { roughness: 0.85, metalness: 0.2 });
    const monolith = new THREE.Mesh(new THREE.ConeGeometry(0.7, 3.6, 5), cortenMat);
    monolith.rotation.y = 0.4;
    monolith.rotation.z = 0.15;
    monolith.scale.set(0.8, 1.0, 0.5);
    monolith.position.set(-1.0, 2.06, -0.5);
    root.add(monolith);

    // 2. Mirror-Polished Stainless Ribbon Arc Sculpture
    const ribbonMat = mat(p1, { metalness: 0.98, roughness: 0.05 });
    const ribbon = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.12, 12, 32), ribbonMat);
    ribbon.rotation.x = Math.PI / 3;
    ribbon.rotation.y = 0.5;
    ribbon.position.set(1.4, 1.46, 0.6);
    root.add(ribbon);

    // 3. Basalt Plinths with Cast Bronze Figurines
    [-1.8, 1.8].forEach((bx, idx) => {
      const plinth = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.5, 0.6),
        mat(p3, { roughness: 0.9 })
      );
      plinth.position.set(bx, 0.51, idx === 0 ? 1.5 : -1.5);
      root.add(plinth);

      const figurine = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.18, 1),
        mat('#B45309', { metalness: 0.8, roughness: 0.3 })
      );
      figurine.position.set(bx, 0.95, idx === 0 ? 1.5 : -1.5);
      root.add(figurine);
    });

    // Minimalist concrete bench
    const bench = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.35, 0.45), mat(p2));
    bench.position.set(0.2, 0.43, -2.0);
    root.add(bench);
  }

  // =========================================================================
  // 11. Motorsport Pit Lane & Formula Racing Expo Set
  // =========================================================================
  else if (id.includes('11_motorsport_paddock')) {
    // 1. Red & Black Paddock Team Awning
    const awningMat = mat(p0, { roughness: 0.4 });
    const awning = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.15, 3.8), awningMat);
    awning.position.set(0, 3.4, 0);
    root.add(awning);

    // Red support struts
    [
      [-2.0, -1.8],
      [2.0, -1.8],
      [-2.0, 1.8],
      [2.0, 1.8],
    ].forEach(([ax, az]) => {
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 3.4),
        mat(p0, { metalness: 0.7 })
      );
      post.position.set(ax, 1.7, az);
      root.add(post);
    });

    // 2. Hydraulic Scissor Lift with Formula Racing Car
    const liftGeo = new THREE.BoxGeometry(1.6, 0.35, 2.8);
    const lift = new THREE.Mesh(liftGeo, mat('#334155', { metalness: 0.8 }));
    lift.position.set(0, 0.43, 0);
    root.add(lift);

    // Formula car body
    const carGroup = new THREE.Group();
    const monocoque = new THREE.Mesh(
      new THREE.ConeGeometry(0.35, 2.4, 8),
      mat(p0, { metalness: 0.8, roughness: 0.2 })
    );
    monocoque.rotation.x = Math.PI / 2;
    monocoque.scale.set(1.2, 1.0, 0.6);
    monocoque.position.y = 0.2;
    carGroup.add(monocoque);

    // Front wing
    const fWing = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 0.3), mat(p1));
    fWing.position.set(0, 0.1, 1.2);
    carGroup.add(fWing);

    // Rear wing
    const rWing = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.35, 0.2), mat(p1));
    rWing.position.set(0, 0.4, -1.1);
    carGroup.add(rWing);

    carGroup.position.set(0, 0.62, 0);
    root.add(carGroup);

    // 3. Carbon-Fiber Slick Tire Rack Towers
    [-1.8, 1.8].forEach((tx) => {
      const rack = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 1.8, 0.6),
        mat('#0F172A', { metalness: 0.9 })
      );
      rack.position.set(tx, 1.16, -1.2);
      root.add(rack);

      // Stacked tires
      for (let t = 0; t < 3; t++) {
        const tire = new THREE.Mesh(
          new THREE.CylinderGeometry(0.26, 0.26, 0.2, 16),
          mat('#1E293B', { roughness: 0.9 })
        );
        tire.position.set(tx, 0.45 + t * 0.45, -1.2);
        root.add(tire);
      }
    });

    // Rolling Red Tool Chest Stack
    const toolChest = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 1.2, 0.5),
      mat(p0, { metalness: 0.6, roughness: 0.3 })
    );
    toolChest.position.set(-1.8, 0.86, 1.0);
    root.add(toolChest);
  }

  // =========================================================================
  // 12. Eco Water Sports & Surf Culture Festival Set
  // =========================================================================
  else if (id.includes('12_surf_culture')) {
    // 1. Bamboo & Palm Thatch Pergola
    const bambooMat = mat(p2, { roughness: 0.7 });
    for (let b = 0; b < 4; b++) {
      const bx = b % 2 === 0 ? -1.8 : 1.8;
      const bz = b < 2 ? -1.6 : 1.6;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.2, 8), bambooMat);
      post.position.set(bx, 1.86, bz);
      root.add(post);
    }
    const thatch = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.2, 3.8), mat(p2));
    thatch.position.set(0, 3.46, 0);
    root.add(thatch);

    // 2. Vertical Slotted Surfboard Rack
    const boardRack = new THREE.Group();
    const rackFrame = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.2, 0.8), mat(p3));
    rackFrame.position.y = 0.1;
    boardRack.add(rackFrame);

    // 4 surfboards standing vertically in slots
    const colors = [p0, '#F59E0B', '#EF4444', p1];
    colors.forEach((col, idx) => {
      const boardGeo = new THREE.ConeGeometry(0.24, 1.8, 8);
      const board = new THREE.Mesh(boardGeo, mat(col, { roughness: 0.2 }));
      board.scale.set(1.0, 1.0, 0.2);
      board.position.set(-0.9 + idx * 0.6, 1.0, 0);
      boardRack.add(board);
    });
    boardRack.position.set(-1.4, 0.26, -0.6);
    boardRack.rotation.y = 0.3;
    root.add(boardRack);

    // 3. Vintage Beach Cruiser Bike Stand
    const bikeGroup = new THREE.Group();
    const bFrame = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 0.1), mat(p0));
    bFrame.position.y = 0.45;
    bikeGroup.add(bFrame);

    // Wheels
    [-0.45, 0.45].forEach((wx) => {
      const w = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.03, 6, 16), mat('#0F172A'));
      w.position.set(wx, 0.28, 0);
      bikeGroup.add(w);
    });
    bikeGroup.position.set(1.6, 0.26, 0.8);
    bikeGroup.rotation.y = -0.5;
    root.add(bikeGroup);
  }

  // =========================================================================
  // 13. Heavy Machinery & Precision Mining Expo Set
  // =========================================================================
  else if (id.includes('13_heavy_machinery')) {
    // 1. Massive Industrial Yellow Steel Portal Canopy
    const steelMat = mat(p0, { metalness: 0.7, roughness: 0.3 });
    [-2.2, 2.2].forEach((x) => {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.35, 4.0, 0.35), steelMat);
      col.position.set(x, 2.26, -1.8);
      root.add(col);
    });
    const header = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.45, 0.4), steelMat);
    header.position.set(0, 4.16, -1.8);
    root.add(header);

    // 2. Colossal 3-Meter Excavator Rock Bucket with Teeth
    const bucketGroup = new THREE.Group();
    const bucket = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.4, 1.8, 12, 1, false, 0, Math.PI),
      mat(p1, { metalness: 0.8, roughness: 0.4 })
    );
    bucket.rotation.z = Math.PI / 2;
    bucket.rotation.x = Math.PI / 1.5;
    bucketGroup.add(bucket);

    // 4 Chisel Teeth
    for (let t = -1.5; t <= 1.5; t++) {
      const tooth = new THREE.Mesh(
        new THREE.ConeGeometry(0.12, 0.4, 4),
        mat(p2, { metalness: 0.95, roughness: 0.1 })
      );
      tooth.rotation.x = -Math.PI / 3;
      tooth.position.set(t * 0.4, -0.6, 1.1);
      bucketGroup.add(tooth);
    }

    bucketGroup.position.set(-0.8, 1.2, 0);
    root.add(bucketGroup);

    // 3. Chrome Hydraulic Cylinder on Timber Cribbing
    const cyl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 2.2, 16),
      mat(p2, { metalness: 0.95, roughness: 0.05 })
    );
    cyl.rotation.z = Math.PI / 2;
    cyl.position.set(1.6, 0.55, 0.8);
    root.add(cyl);

    // 4. Precision Planetary Gear Display Stand
    const gear = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.45, 0.15, 24),
      mat(p1, { metalness: 0.85 })
    );
    gear.position.set(1.8, 0.85, -1.2);
    root.add(gear);
  }

  // =========================================================================
  // 14. VR & Metaverse Experiential Outdoor Pod Set
  // =========================================================================
  else if (id.includes('14_metaverse_vr')) {
    // 1. Geodesic Cyber-Dome Canopy
    const domeGeo = new THREE.IcosahedronGeometry(2.8, 1);
    const domeMat = mat(p0, { wireframe: true, emissive: new THREE.Color(p0), emissiveIntensity: 0.6 });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.set(0, 1.8, 0);
    root.add(dome);

    // 2. Twin Omnidirectional VR Motion Treadmills
    [-1.2, 1.2].forEach((tx) => {
      const treadmill = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.85, 0.18, 20),
        mat('#0F172A', { metalness: 0.8 })
      );
      treadmill.position.set(tx, 0.35, 0);
      root.add(treadmill);

      // Neon ring
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.78, 0.03, 6, 20),
        mat(p1, { emissive: new THREE.Color(p1), emissiveIntensity: 0.9 })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(tx, 0.45, 0);
      root.add(ring);
    });

    // 3. Central Volumetric Hologram Projector Column
    const holoPillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 2.4, 16),
      createGlassMat(0.3, 0.2)
    );
    holoPillar.position.set(0, 1.46, 0);
    root.add(holoPillar);

    const hologram = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.28, 0),
      mat(p0, { emissive: new THREE.Color(p0), emissiveIntensity: 1.0, wireframe: true })
    );
    hologram.position.set(0, 1.46, 0);
    root.add(hologram);
  }

  // =========================================================================
  // 15. Heritage Crafts & Artisan Marketplace Set
  // =========================================================================
  else if (id.includes('15_heritage_crafts')) {
    // 1. Mortise-and-Tenon Douglas Fir Wooden Pavilion
    const woodMat = mat(p1, { roughness: 0.7 });
    for (let c = 0; c < 4; c++) {
      const cx = c % 2 === 0 ? -2.0 : 2.0;
      const cz = c < 2 ? -1.8 : 1.8;
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.4, 0.18), woodMat);
      post.position.set(cx, 1.96, cz);
      root.add(post);
    }
    const roof = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.2, 4.2), woodMat);
    roof.position.set(0, 3.56, 0);
    root.add(roof);

    // Indigo Batik Draped Banners
    const bannerMat = mat(p0, { roughness: 0.5 });
    [-1.2, 1.2].forEach((bx) => {
      const banner = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.8, 0.04), bannerMat);
      banner.position.set(bx, 2.4, -1.8);
      root.add(banner);
    });

    // 2. Working Potter’s Wheel Workstation
    const wheelGroup = new THREE.Group();
    const bench = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.45, 0.8), woodMat);
    bench.position.y = 0.23;
    wheelGroup.add(bench);

    const wheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 0.08, 16),
      mat('#0F172A', { metalness: 0.7 })
    );
    wheel.position.set(0, 0.5, 0);
    wheelGroup.add(wheel);

    // Wet clay vase
    const vase = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 0.35, 12), mat('#A16207'));
    vase.position.set(0, 0.72, 0);
    wheelGroup.add(vase);

    wheelGroup.position.set(-1.4, 0.26, 0.4);
    root.add(wheelGroup);

    // 3. Tiered Solid Walnut Ceramic Display Shelves
    const shelfGroup = new THREE.Group();
    for (let s = 0; s < 3; s++) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.05, 0.4), woodMat);
      plank.position.set(0, 0.4 + s * 0.45, 0);
      shelfGroup.add(plank);

      // Celadon ceramic pots
      for (let p = -1; p <= 1; p++) {
        const celadon = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12, 1), mat(p2));
        celadon.position.set(p * 0.45, 0.55 + s * 0.45, 0);
        shelfGroup.add(celadon);
      }
    }
    shelfGroup.position.set(1.6, 0.26, -0.6);
    shelfGroup.rotation.y = -0.4;
    root.add(shelfGroup);
  }

  // =========================================================================
  // 16. Pro Audio & Concert Stage Lighting Truss Set
  // =========================================================================
  else if (id.includes('16_pro_audio_lighting')) {
    // 1. Quad-Truss Festival Stage Arch
    const trussMat = mat(p0, { metalness: 0.9, roughness: 0.2 });
    [-2.2, 2.2].forEach((x) => {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.25, 4.2, 0.25), trussMat);
      col.position.set(x, 2.36, -1.8);
      root.add(col);
    });
    const topTruss = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.25, 0.25), trussMat);
    topTruss.position.set(0, 4.36, -1.8);
    root.add(topTruss);

    // 2. Hanging Curved Line-Array Speaker Stacks
    [-1.6, 1.6].forEach((sx) => {
      for (let s = 0; s < 4; s++) {
        const speaker = new THREE.Mesh(
          new THREE.BoxGeometry(0.6, 0.22, 0.4),
          mat(p1, { roughness: 0.6 })
        );
        speaker.position.set(sx, 3.8 - s * 0.28, -1.8);
        speaker.rotation.x = 0.08 * s;
        root.add(speaker);
      }
    });

    // 3. Motorized Moving-Head Stage Beams
    [-0.8, 0, 0.8].forEach((lx) => {
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 12, 12),
        mat(p2, { emissive: new THREE.Color(p2), emissiveIntensity: 0.8 })
      );
      head.position.set(lx, 4.1, -1.8);
      root.add(head);
    });

    // 4. Pro Audio Digital Mixing Console Desk
    const consoleTable = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.8, 0.7),
      mat('#0F172A', { metalness: 0.8 })
    );
    consoleTable.position.set(0, 0.66, 0.6);
    root.add(consoleTable);

    // Glowing VU meters
    const vu = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 0.3),
      mat(p3, { emissive: new THREE.Color(p3), emissiveIntensity: 0.8 })
    );
    vu.position.set(0, 1.1, 0.75);
    vu.rotation.x = -Math.PI / 4;
    root.add(vu);

    // Road Flight Cases Stack
    const flightCase = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.9, 0.8),
      mat(p1, { metalness: 0.7 })
    );
    flightCase.position.set(-2.0, 0.71, 0.8);
    root.add(flightCase);
  }

  // =========================================================================
  // 17. Artisanal Gastronomy & Craft Brewery Expo Set
  // =========================================================================
  else if (id.includes('17_craft_brewery')) {
    // 1. Black Steel & Reclaimed Oak Pergola
    const steelMat = mat(p3, { metalness: 0.8, roughness: 0.3 });
    [-2.1, 2.1].forEach((x) => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.15, 3.4, 0.15), steelMat);
      post.position.set(x, 1.96, -1.6);
      root.add(post);
    });
    const pergolaRoof = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.12, 3.6), mat(p2));
    pergolaRoof.position.set(0, 3.56, 0);
    root.add(pergolaRoof);

    // 2. Twin Stainless Steel Micro-Brewery Fermentation Tanks
    const tankMat = mat(p1, { metalness: 0.95, roughness: 0.1 });
    [-0.7, 0.7].forEach((tx) => {
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.8, 16), tankMat);
      tank.position.set(tx, 1.46, -1.2);
      root.add(tank);

      // Conical bottom
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.5, 16), tankMat);
      cone.rotation.x = Math.PI;
      cone.position.set(tx, 0.46, -1.2);
      root.add(cone);
    });

    // 3. Tiered Oak Craft Beer Bottle Display Shelves
    const bottleRack = new THREE.Group();
    for (let s = 0; s < 3; s++) {
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.05, 0.3), mat(p2));
      shelf.position.set(0, 0.4 + s * 0.45, 0);
      bottleRack.add(shelf);

      // Amber glass bottles
      for (let b = -2; b <= 2; b++) {
        const bottle = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.04, 0.22, 8),
          mat(p0, { roughness: 0.2 })
        );
        bottle.position.set(b * 0.28, 0.53 + s * 0.45, 0);
        bottleRack.add(bottle);
      }
    }
    bottleRack.position.set(-2.2, 0.26, 0.8);
    bottleRack.rotation.y = 0.6;
    root.add(bottleRack);

    // 4. Oak Whiskey Barrel High-Top Tables
    [-0.8, 1.2].forEach((bx) => {
      const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.45, 0.9, 12),
        mat(p2, { roughness: 0.7 })
      );
      barrel.position.set(bx, 0.71, 1.2);
      root.add(barrel);
    });
  }

  // =========================================================================
  // 18. Mobile Medical & Emergency Rescue Expo Set
  // =========================================================================
  else if (id.includes('18_mobile_medical')) {
    // 1. Inflatable Emergency Relief Tent
    const tentMat = mat(p2, { roughness: 0.5 });
    const tent = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.2, 2.2, 12, 1, false, 0, Math.PI), tentMat);
    tent.rotation.z = Math.PI / 2;
    tent.position.set(-1.0, 1.36, -0.6);
    root.add(tent);

    // Red Cross emblem
    const cross1 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.15, 0.02), mat(p0));
    cross1.position.set(-1.0, 2.0, -1.8);
    root.add(cross1);
    const cross2 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.6, 0.02), mat(p0));
    cross2.position.set(-1.0, 2.0, -1.8);
    root.add(cross2);

    // 2. Emergency Triage Stretcher & IV Stand
    const gurney = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.65, 1.8),
      mat('#64748B', { metalness: 0.7 })
    );
    gurney.position.set(-0.8, 0.58, 0.6);
    root.add(gurney);

    // IV Stand
    const iv = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.6), mat('#E2E8F0', { metalness: 0.9 }));
    iv.position.set(-1.3, 1.06, 0.6);
    root.add(iv);

    // 3. Stacked Orange Pelican Medical Cases
    for (let c = 0; c < 3; c++) {
      const pelican = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.28, 0.45),
        mat(p1, { roughness: 0.5 })
      );
      pelican.position.set(1.8, 0.4 + c * 0.3, -0.8);
      root.add(pelican);
    }

    // 4. AED Defibrillator Kiosk Totem
    const aed = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 1.3, 0.2),
      mat('#0F172A', { metalness: 0.8 })
    );
    aed.position.set(1.8, 0.91, 0.8);
    root.add(aed);

    const aedScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.25, 0.3),
      mat(p3, { emissive: new THREE.Color(p3), emissiveIntensity: 0.8 })
    );
    aedScreen.position.set(1.78, 1.25, 0.91);
    root.add(aedScreen);
  }

  // =========================================================================
  // 19. Urban Micro-Mobility & E-Bike Hub Expo Set
  // =========================================================================
  else if (id.includes('19_micro_mobility')) {
    // 1. Curved Perforated Metal Transit Shelter
    const canopyMat = mat(p2, { metalness: 0.8, roughness: 0.2 });
    const canopy = new THREE.Mesh(
      new THREE.CylinderGeometry(2.4, 2.4, 3.8, 16, 1, false, 0, Math.PI / 1.5),
      canopyMat
    );
    canopy.rotation.z = Math.PI / 2;
    canopy.position.set(-0.4, 2.6, -0.8);
    root.add(canopy);

    // 2. Integrated E-Bike & E-Scooter Docking Rack
    const dockGeo = new THREE.BoxGeometry(2.8, 0.25, 0.6);
    const dock = new THREE.Mesh(dockGeo, mat(p2, { metalness: 0.7 }));
    dock.position.set(-0.4, 0.38, 0.6);
    root.add(dock);

    // Commuter E-Bikes docked
    [-1.0, -0.2, 0.6].forEach((bx) => {
      const bike = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 1.4), mat(p1));
      bike.position.set(bx, 0.78, 0.6);
      root.add(bike);
    });

    // 3. 12-Slot Smart Battery Swap Cabinet Station
    const swapCab = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.8, 0.5),
      mat('#0F172A', { metalness: 0.8 })
    );
    swapCab.position.set(2.0, 1.16, -1.0);
    root.add(swapCab);

    // 12 green battery slots
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 3; c++) {
        const slot = new THREE.Mesh(
          new THREE.BoxGeometry(0.25, 0.25, 0.04),
          mat(p0, { emissive: new THREE.Color(p0), emissiveIntensity: 0.8 })
        );
        slot.position.set(1.65 + c * 0.35, 0.55 + r * 0.35, -0.73);
        root.add(slot);
      }
    }
  }

  // =========================================================================
  // 20. Haute Horlogerie & Luxury Jewelry Salon Set
  // =========================================================================
  else if (id.includes('20_haute_horlogerie')) {
    // 1. Gilded Champagne Bronze Pavilion with Velvet Drapes
    const goldMat = mat(p0, { metalness: 0.95, roughness: 0.15 });
    for (let a = 0; a < 4; a++) {
      const ang = (a * Math.PI * 2) / 4 + Math.PI / 4;
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.4), goldMat);
      col.position.set(Math.cos(ang) * 2.4, 1.96, Math.sin(ang) * 2.4);
      root.add(col);
    }
    const crown = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.06, 8, 32), goldMat);
    crown.rotation.x = Math.PI / 2;
    crown.position.set(0, 3.56, 0);
    root.add(crown);

    // Velvet Drapes
    const velvetMat = mat(p1, { roughness: 0.8 });
    [-2.0, 2.0].forEach((vx) => {
      const drape = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 2.8, 12), velvetMat);
      drape.position.set(vx, 1.7, -1.8);
      root.add(drape);
    });

    // 2. Central Revolving Grand Complication Watch Vitrine
    const vitPlinth = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.6, 0.9, 24),
      mat(p2, { roughness: 0.2 })
    );
    vitPlinth.position.set(0, 0.71, 0);
    root.add(vitPlinth);

    const glassCyl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.45, 0.8, 24),
      createGlassMat(0.15, 0.1)
    );
    glassCyl.position.set(0, 1.46, 0);
    root.add(glassCyl);

    // Watch Tourbillon Bezel inside
    const watch = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.04, 8, 24), goldMat);
    watch.position.set(0, 1.46, 0);
    watch.rotation.y = 0.5;
    root.add(watch);

    // 3. Perimeter Jewelry Showcase Vitrines
    for (let j = 0; j < 3; j++) {
      const jAng = (j * Math.PI * 2) / 3;
      const jx = Math.cos(jAng) * 1.8;
      const jz = Math.sin(jAng) * 1.8;

      const pStand = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.9, 0.4), goldMat);
      pStand.position.set(jx, 0.71, jz);
      root.add(pStand);

      const jGlass = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.4, 0.35),
        createGlassMat(0.15, 0.1)
      );
      jGlass.position.set(jx, 1.26, jz);
      root.add(jGlass);
    }
  }

  // Fallback if none matched
  else {
    const fallbackBox = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), mat(p0));
    fallbackBox.position.set(0, 1.26, 0);
    root.add(fallbackBox);
  }

  return root;
}
