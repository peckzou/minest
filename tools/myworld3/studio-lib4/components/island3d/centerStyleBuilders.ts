import * as THREE from 'three';
import { CenterStyleId } from '../../types/universe';

function mat(color: number | string, options: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.65,
    metalness: 0.08,
    flatShading: true,
    ...options,
  });
}

function addTree(parent: THREE.Group, x: number, y: number, z: number, foliageColor = '#10b981', scale = 1) {
  const trunkGeo = new THREE.CylinderGeometry(0.08 * scale, 0.12 * scale, 0.6 * scale, 5);
  const trunk = new THREE.Mesh(trunkGeo, mat('#5d4037'));
  trunk.position.set(x, y + 0.3 * scale, z);
  trunk.castShadow = true;
  parent.add(trunk);

  const foliageGeo = new THREE.ConeGeometry(0.45 * scale, 1.1 * scale, 5);
  const foliage = new THREE.Mesh(foliageGeo, mat(foliageColor));
  foliage.position.set(x, y + 0.85 * scale, z);
  foliage.castShadow = true;
  parent.add(foliage);
}

// Base large floating island for central landmarks (prominent sovereign core)
function createCentralBase(accentGrass: string, rockColor = '#475569') {
  const baseGroup = new THREE.Group();

  // 1. Layered irregular top landmasses
  const topGeo = new THREE.CylinderGeometry(5.4, 5.8, 0.7, 10);
  const topMesh = new THREE.Mesh(topGeo, mat(accentGrass));
  topMesh.position.y = 0;
  topMesh.receiveShadow = true;
  baseGroup.add(topMesh);

  // Terraced inner rim
  const terraceGeo = new THREE.CylinderGeometry(4.7, 5.1, 0.45, 10);
  const terraceMesh = new THREE.Mesh(terraceGeo, mat(accentGrass));
  terraceMesh.position.y = 0.35;
  terraceMesh.receiveShadow = true;
  baseGroup.add(terraceMesh);

  // Upper tiered plateau
  const plateauGeo = new THREE.CylinderGeometry(3.9, 4.3, 0.35, 10);
  const plateauMesh = new THREE.Mesh(plateauGeo, mat(accentGrass));
  plateauMesh.position.y = 0.65;
  plateauMesh.receiveShadow = true;
  baseGroup.add(plateauMesh);

  // 2. Hanging underbelly inverted cone - deeper, more imposing geological strata
  const coneGeo = new THREE.ConeGeometry(5.7, 5.2, 10);
  const coneMesh = new THREE.Mesh(coneGeo, mat(rockColor));
  coneMesh.rotation.x = Math.PI;
  coneMesh.position.y = -2.6;
  baseGroup.add(coneMesh);

  // Secondary stratified rock crags and stalactites underneath
  const rock1 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.3, 0), mat(rockColor));
  rock1.position.set(2.2, -2.4, -1.4);
  baseGroup.add(rock1);

  const rock2 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.0, 0), mat(rockColor));
  rock2.position.set(-2.0, -2.8, 1.6);
  baseGroup.add(rock2);

  const rock3 = new THREE.Mesh(new THREE.ConeGeometry(0.7, 2.2, 5), mat(rockColor));
  rock3.rotation.x = Math.PI;
  rock3.position.set(0.4, -4.8, 0.2);
  baseGroup.add(rock3);

  // Floating subordinate miniature satellite crags around perimeter
  const miniSatellite1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55, 0), mat(accentGrass));
  miniSatellite1.position.set(-6.2, -0.6, -2.2);
  baseGroup.add(miniSatellite1);

  const miniSatellite2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45, 0), mat(accentGrass));
  miniSatellite2.position.set(6.0, -0.8, 2.0);
  baseGroup.add(miniSatellite2);

  return baseGroup;
}

// 1. Castle World Center (Majestic Citadel & Sovereign Sky Spire)
export function buildCentralCastleWorld(): THREE.Group {
  const group = new THREE.Group();
  group.add(createCentralBase('#4ade80', '#475569'));

  // Castle rock hill massif
  const rockBase = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 4.2, 1.2, 9), mat('#64748b'));
  rockBase.position.y = 0.9;
  group.add(rockBase);

  // Main Castle Lower Citadel Ramparts
  const lowerCitadel = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.6, 2.6), mat('#cbd5e1'));
  lowerCitadel.position.set(0, 2.0, 0);
  lowerCitadel.castShadow = true;
  group.add(lowerCitadel);

  // Main Castle Keep
  const keep = new THREE.Mesh(new THREE.BoxGeometry(2.0, 3.2, 1.8), mat('#f1f5f9'));
  keep.position.set(0, 3.8, -0.2);
  keep.castShadow = true;
  group.add(keep);

  // Soaring Central Sovereign Sky Spire (Reaches Y = 8.5)
  const highTower = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.85, 4.4, 8), mat('#e2e8f0'));
  highTower.position.set(0, 5.2, -0.3);
  highTower.castShadow = true;
  group.add(highTower);

  // Conical Royal Azure Roof
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.2, 8), mat('#1d4ed8'));
  roof.position.set(0, 7.8, -0.3);
  roof.castShadow = true;
  group.add(roof);

  // Gold Sovereign Finial & Spire Needle
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), mat('#f59e0b', { metalness: 0.9, roughness: 0.15 }));
  tip.position.set(0, 8.8, -0.3);
  group.add(tip);

  // Sovereign Pennant Banner
  const banner = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.35, 0.8), mat('#ef4444'));
  banner.position.set(0.2, 8.8, 0.1);
  group.add(banner);

  // 4 Grand Flanking Battlements / Corner Towers
  const cornerCoords = [
    [-1.4, -1.2],
    [1.4, -1.2],
    [-1.4, 1.2],
    [1.4, 1.2],
  ];
  cornerCoords.forEach(([cx, cz]) => {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 3.2, 8), mat('#e2e8f0'));
    t.position.set(cx, 2.8, cz);
    t.castShadow = true;
    group.add(t);

    const r = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.4, 8), mat('#2563eb'));
    r.position.set(cx, 4.7, cz);
    r.castShadow = true;
    group.add(r);

    const f = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), mat('#fbbf24'));
    f.position.set(cx, 5.4, cz);
    group.add(f);
  });

  // Rampart battlements & Grand Gatehouse
  const gatehouse = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 1.2), mat('#94a3b8'));
  gatehouse.position.set(0, 1.4, 1.8);
  group.add(gatehouse);

  const arch = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.0, 1.3), mat('#0f172a'));
  arch.position.set(0, 1.0, 1.8);
  group.add(arch);

  // Arched Stone Bridge over Moat
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.25, 2.0), mat('#78716c'));
  bridge.position.set(0, 0.8, 3.2);
  group.add(bridge);

  // Luminescent Azure Moat Basin
  const moat = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 4.6, 0.15, 14), mat('#38bdf8', { roughness: 0.15 }));
  moat.position.y = 0.65;
  group.add(moat);

  // Courtyard Gardens & Trees
  addTree(group, -3.0, 0.7, -1.0, '#15803d', 1.4);
  addTree(group, -2.6, 0.7, 1.8, '#16a34a', 1.2);
  addTree(group, 3.0, 0.7, -1.4, '#15803d', 1.3);
  addTree(group, 2.8, 0.7, 1.6, '#22c55e', 1.1);

  return group;
}

// 2. Knowledge World Center
export function buildCentralKnowledgeWorld(): THREE.Group {
  const group = new THREE.Group();
  group.add(createCentralBase('#86efac', '#334155'));

  // Classical marble plaza podium
  const podium = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.4, 0.4, 12), mat('#f1f5f9'));
  podium.position.y = 0.6;
  group.add(podium);

  // Grand Library central rotunda
  const rotunda = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.7, 1.6, 16), mat('#e2e8f0'));
  rotunda.position.set(0, 1.5, -0.3);
  rotunda.castShadow = true;
  group.add(rotunda);

  // Great dome
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1.5, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat('#4f46e5'));
  dome.position.set(0, 2.3, -0.3);
  group.add(dome);

  // Golden lantern cupola on dome
  const cupola = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.5, 8), mat('#f59e0b'));
  cupola.position.set(0, 3.85, -0.3);
  group.add(cupola);

  // Grand portico & Colonnade entrance
  const portico = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 0.8), mat('#f8fafc'));
  portico.position.set(0, 1.2, 1.1);
  group.add(portico);

  const pediment = new THREE.Mesh(new THREE.ConeGeometry(1.1, 0.6, 4), mat('#4f46e5'));
  pediment.rotation.y = Math.PI / 4;
  pediment.position.set(0, 2.0, 1.1);
  group.add(pediment);

  // Pillars
  for (let i = -0.6; i <= 0.6; i += 0.4) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.1, 6), mat('#cbd5e1'));
    col.position.set(i, 1.15, 1.55);
    group.add(col);
  }

  // Observatory dome tower on East wing
  const obsTower = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.65, 1.8, 10), mat('#cbd5e1'));
  obsTower.position.set(1.9, 1.5, -0.6);
  group.add(obsTower);

  const obsDome = new THREE.Mesh(new THREE.SphereGeometry(0.65, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat('#818cf8'));
  obsDome.position.set(1.9, 2.4, -0.6);
  group.add(obsDome);

  // Telescope barrel
  const telescope = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.2, 6), mat('#fbbf24'));
  telescope.rotation.x = -Math.PI / 3;
  telescope.rotation.z = Math.PI / 6;
  telescope.position.set(1.9, 2.9, -0.6);
  group.add(telescope);

  // Clock / bell tower on West wing
  const clockTower = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.6, 0.9), mat('#cbd5e1'));
  clockTower.position.set(-1.8, 1.9, -0.6);
  group.add(clockTower);

  const clockRoof = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.1, 4), mat('#4338ca'));
  clockRoof.rotation.y = Math.PI / 4;
  clockRoof.position.set(-1.8, 3.6, -0.6);
  group.add(clockRoof);

  // Central Fountain of Wisdom
  const fountainBase = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.8, 0.25, 10), mat('#94a3b8'));
  fountainBase.position.set(0, 0.8, 2.0);
  group.add(fountainBase);

  const fountainWater = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.2, 10), mat('#38bdf8', { roughness: 0.1 }));
  fountainWater.position.set(0, 0.9, 2.0);
  group.add(fountainWater);

  const fountainSpout = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.6, 6), mat('#f1f5f9'));
  fountainSpout.position.set(0, 1.1, 2.0);
  group.add(fountainSpout);

  // Reading trees & hedges
  addTree(group, -2.4, 0.7, 1.1, '#15803d', 1.0);
  addTree(group, 2.4, 0.7, 1.1, '#15803d', 1.0);

  return group;
}

// 3. Cozy Village Center
export function buildCentralCozyVillage(): THREE.Group {
  const group = new THREE.Group();
  group.add(createCentralBase('#86efac', '#78350f'));

  // Terraced village slope
  const slope = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 3.4, 0.5, 10), mat('#bbf7d0'));
  slope.position.y = 0.6;
  group.add(slope);

  // Hilltop with Windmill
  const hill = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.6, 0.8, 8), mat('#4ade80'));
  hill.position.set(-1.4, 1.1, -1.0);
  group.add(hill);

  // Windmill Tower
  const millBody = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.6, 1.6, 7), mat('#fde68a'));
  millBody.position.set(-1.4, 2.2, -1.0);
  group.add(millBody);

  const millRoof = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.7, 7), mat('#b45309'));
  millRoof.position.set(-1.4, 3.3, -1.0);
  group.add(millRoof);

  // 4 Windmill Blades
  const bladeHub = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), mat('#78350f'));
  bladeHub.position.set(-1.4, 2.8, -0.42);
  group.add(bladeHub);

  for (let b = 0; b < 4; b++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.4, 0.04), mat('#fef3c7'));
    blade.position.set(-1.4, 2.8, -0.4);
    blade.rotation.z = (b * Math.PI) / 2 + Math.PI / 8;
    group.add(blade);
  }

  // Village Houses (Cozy warm colors)
  const houseConfigs = [
    { x: 0.8, z: -0.8, w: 1.1, h: 0.9, d: 0.9, wall: '#fed7aa', roof: '#ea580c', rot: 0.2 },
    { x: 1.4, z: 0.6, w: 1.0, h: 0.8, d: 0.8, wall: '#fef08a', roof: '#dc2626', rot: -0.4 },
    { x: -0.6, z: 1.2, w: 1.2, h: 1.0, d: 0.9, wall: '#fed7aa', roof: '#b45309', rot: 0.5 },
    { x: 0.3, z: 1.7, w: 0.9, h: 0.8, d: 0.8, wall: '#e2e8f0', roof: '#059669', rot: -0.1 },
  ];

  houseConfigs.forEach((h) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(h.w, h.h, h.d), mat(h.wall));
    wall.position.set(h.x, 0.6 + h.h / 2, h.z);
    wall.rotation.y = h.rot;
    group.add(wall);

    const roof = new THREE.Mesh(new THREE.ConeGeometry(h.w * 0.75, h.h * 0.7, 4), mat(h.roof));
    roof.position.set(h.x, 0.6 + h.h + (h.h * 0.7) / 2, h.z);
    roof.rotation.y = h.rot + Math.PI / 4;
    group.add(roof);

    // Chimney with small puff
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.45, 0.18), mat('#78350f'));
    chimney.position.set(h.x + 0.25, 0.6 + h.h + 0.35, h.z);
    group.add(chimney);
  });

  // Village Square Fountain / Well
  const well = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 0.3, 8), mat('#94a3b8'));
  well.position.set(0.1, 0.85, 0.1);
  group.add(well);

  const wellRoof = new THREE.Mesh(new THREE.ConeGeometry(0.48, 0.4, 4), mat('#b45309'));
  wellRoof.position.set(0.1, 1.4, 0.1);
  group.add(wellRoof);

  // Cobblestone path winding
  const path = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.05, 2.8), mat('#d6d3d1'));
  path.position.set(0.1, 0.7, 0.6);
  path.rotation.y = 0.3;
  group.add(path);

  // Orchard trees & sheep
  addTree(group, -2.1, 0.6, 0.8, '#15803d', 0.9);
  addTree(group, -0.4, 0.6, -1.5, '#65a30d', 1.0);
  addTree(group, 2.3, 0.6, -1.2, '#16a34a', 0.9);
  addTree(group, 2.2, 0.6, 1.4, '#15803d', 1.1);

  return group;
}

// 4. Tree of Life Center
export function buildCentralTreeOfLife(): THREE.Group {
  const group = new THREE.Group();
  group.add(createCentralBase('#6ee7b7', '#064e3b'));

  // Terraced mossy roots hill
  const hill = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 3.4, 0.7, 10), mat('#34d399'));
  hill.position.y = 0.6;
  group.add(hill);

  // Sacred crystalline pond at the base
  const pond = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 0.15, 12), mat('#67e8f9', { roughness: 0.1 }));
  pond.position.set(0, 0.95, 0.8);
  group.add(pond);

  // Massive Trunk of the Tree of Life
  const trunkBase = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.4, 2.4, 8), mat('#78350f'));
  trunkBase.position.set(0, 2.0, -0.2);
  trunkBase.castShadow = true;
  group.add(trunkBase);

  // Major twisting boughs
  const branchCoords = [
    { x: -0.9, y: 3.2, z: 0.3, rx: 0.4, rz: 0.6 },
    { x: 0.9, y: 3.1, z: 0.4, rx: 0.3, rz: -0.6 },
    { x: -0.7, y: 3.3, z: -0.8, rx: -0.5, rz: 0.4 },
    { x: 0.8, y: 3.4, z: -0.7, rx: -0.4, rz: -0.5 },
  ];

  branchCoords.forEach((b) => {
    const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 1.6, 6), mat('#78350f'));
    branch.position.set(b.x, b.y, b.z);
    branch.rotation.x = b.rx;
    branch.rotation.z = b.rz;
    group.add(branch);
  });

  // Vast layered emerald & jade canopy
  const canopyLayers = [
    { x: 0, y: 4.6, z: -0.2, r: 2.4, color: '#059669' },
    { x: -1.2, y: 4.1, z: 0.4, r: 1.6, color: '#10b981' },
    { x: 1.2, y: 4.2, z: 0.3, r: 1.7, color: '#10b981' },
    { x: -0.8, y: 4.3, z: -1.0, r: 1.5, color: '#047857' },
    { x: 0.9, y: 4.4, z: -0.9, r: 1.6, color: '#34d399' },
    { x: 0, y: 5.6, z: -0.2, r: 1.8, color: '#6ee7b7' },
    { x: 0, y: 6.5, z: -0.2, r: 1.1, color: '#a7f3d0' },
  ];

  canopyLayers.forEach((c) => {
    const sphere = new THREE.Mesh(new THREE.DodecahedronGeometry(c.r, 1), mat(c.color, { roughness: 0.7 }));
    sphere.position.set(c.x, c.y, c.z);
    sphere.castShadow = true;
    group.add(sphere);
  });

  // Elevated Treehouse observation platform wrapped around trunk
  const platform = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.2, 8), mat('#b45309'));
  platform.position.set(0, 2.8, -0.2);
  group.add(platform);

  const treehut = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 0.8), mat('#fed7aa'));
  treehut.position.set(-0.6, 3.25, 0.3);
  group.add(treehut);

  const treehutRoof = new THREE.Mesh(new THREE.ConeGeometry(0.65, 0.6, 4), mat('#ea580c'));
  treehutRoof.position.set(-0.6, 3.85, 0.3);
  group.add(treehutRoof);

  // Glowing magic crystal orbs hanging or sprouting
  const crystal = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.35),
    mat('#fef08a', { emissive: '#eab308', emissiveIntensity: 0.4 })
  );
  crystal.position.set(0, 1.5, 0.8);
  group.add(crystal);

  return group;
}

// 5. Modern City Center
export function buildCentralModernCity(): THREE.Group {
  const group = new THREE.Group();
  group.add(createCentralBase('#38bdf8', '#1e293b'));

  // Futuristic city grid plaza
  const plaza = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.5, 0.4, 12), mat('#e2e8f0'));
  plaza.position.y = 0.55;
  group.add(plaza);

  // Central Supertall Tower
  const mainTower = new THREE.Mesh(new THREE.BoxGeometry(1.2, 4.4, 1.2), mat('#0284c7'));
  mainTower.position.set(0, 2.6, 0);
  mainTower.castShadow = true;
  group.add(mainTower);

  // Tower angled glass spire
  const spire = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.4, 4), mat('#38bdf8'));
  spire.rotation.y = Math.PI / 4;
  spire.position.set(0, 5.4, 0);
  group.add(spire);

  // Antenna
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.0, 4), mat('#f8fafc'));
  antenna.position.set(0, 6.4, 0);
  group.add(antenna);

  // Surrounding skyscrapers of various modern silhouettes
  const towers = [
    { x: -1.3, z: -0.8, w: 0.9, h: 3.2, d: 0.8, color: '#0369a1' },
    { x: 1.4, z: -0.7, w: 0.8, h: 3.6, d: 1.0, color: '#0284c7' },
    { x: -1.2, z: 1.0, w: 1.0, h: 2.6, d: 0.8, color: '#38bdf8' },
    { x: 1.3, z: 1.0, w: 0.9, h: 2.8, d: 0.9, color: '#0ea5e9' },
    { x: 0, z: -1.5, w: 1.0, h: 2.2, d: 0.8, color: '#64748b' },
  ];

  towers.forEach((t) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(t.w, t.h, t.d), mat(t.color));
    mesh.position.set(t.x, 0.6 + t.h / 2, t.z);
    mesh.castShadow = true;
    group.add(mesh);

    // Rooftop helipad or garden
    const roofFeature = new THREE.Mesh(new THREE.BoxGeometry(t.w * 0.85, 0.1, t.d * 0.85), mat('#475569'));
    roofFeature.position.set(t.x, 0.6 + t.h + 0.05, t.z);
    group.add(roofFeature);
  });

  // Elevated Skybridge connecting main tower to East tower
  const skybridge = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.25, 0.3), mat('#cbd5e1'));
  skybridge.position.set(0.7, 3.2, -0.4);
  group.add(skybridge);

  // Modern transit ring / monorail loop
  const transitRing = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.08, 6, 24), mat('#94a3b8'));
  transitRing.rotation.x = Math.PI / 2;
  transitRing.position.y = 1.4;
  group.add(transitRing);

  // Modernist waterfront / fountain promenade
  const promenade = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 2.2), mat('#38bdf8'));
  promenade.position.set(0, 0.75, 1.8);
  group.add(promenade);

  return group;
}

// 6. Zen Garden Center
export function buildCentralZenGarden(): THREE.Group {
  const group = new THREE.Group();
  group.add(createCentralBase('#86efac', '#451a03'));

  // Raked sand and flagstone base
  const sandPlaza = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.5, 0.4, 12), mat('#fef08a'));
  sandPlaza.position.y = 0.55;
  group.add(sandPlaza);

  // Serene Koi Pond
  const pond = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.9, 0.18, 12), mat('#38bdf8', { roughness: 0.1 }));
  pond.position.set(0.6, 0.7, 0.4);
  group.add(pond);

  // Red Arched Moon Bridge spanning the pond
  const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.4, 12, 1, false, 0, Math.PI), mat('#dc2626'));
  bridge.rotation.z = Math.PI;
  bridge.rotation.y = Math.PI / 4;
  bridge.position.set(0.6, 0.9, 0.4);
  group.add(bridge);

  // Five-Tier Red Pagoda on West side
  const pagodaBase = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 0.5, 8), mat('#78716c'));
  pagodaBase.position.set(-1.4, 0.8, -0.5);
  group.add(pagodaBase);

  let currentY = 1.1;
  const tiers = [
    { bodyW: 1.1, bodyH: 0.6, roofW: 1.6 },
    { bodyW: 0.95, bodyH: 0.5, roofW: 1.4 },
    { bodyW: 0.8, bodyH: 0.45, roofW: 1.2 },
    { bodyW: 0.65, bodyH: 0.4, roofW: 1.0 },
    { bodyW: 0.5, bodyH: 0.35, roofW: 0.8 },
  ];

  tiers.forEach((tier) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(tier.bodyW, tier.bodyH, tier.bodyW), mat('#fef2f2'));
    wall.position.set(-1.4, currentY + tier.bodyH / 2, -0.5);
    group.add(wall);

    currentY += tier.bodyH;

    const roof = new THREE.Mesh(new THREE.ConeGeometry(tier.roofW * 0.7, 0.35, 4), mat('#dc2626'));
    roof.rotation.y = Math.PI / 4;
    roof.position.set(-1.4, currentY + 0.17, -0.5);
    group.add(roof);

    currentY += 0.3;
  });

  // Pagoda Finial (Kurugata spire)
  const finial = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.9, 6), mat('#f59e0b'));
  finial.position.set(-1.4, currentY + 0.45, -0.5);
  group.add(finial);

  // Red Torii Gate at entrance
  const toriiGroup = new THREE.Group();
  toriiGroup.position.set(0.2, 0.75, 2.2);

  const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.4, 6), mat('#dc2626'));
  postL.position.x = -0.5;
  postL.position.y = 0.7;
  toriiGroup.add(postL);

  const postR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.4, 6), mat('#dc2626'));
  postR.position.x = 0.5;
  postR.position.y = 0.7;
  toriiGroup.add(postR);

  const lintelTop = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 0.15), mat('#dc2626'));
  lintelTop.position.y = 1.35;
  toriiGroup.add(lintelTop);

  const lintelSub = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.08, 0.12), mat('#b91c1c'));
  lintelSub.position.y = 1.15;
  toriiGroup.add(lintelSub);

  group.add(toriiGroup);

  // Pink Cherry Blossom Trees (Sakura)
  const sakuraColors = ['#f472b6', '#fb7185', '#fbcfe8'];
  addTree(group, -2.2, 0.7, 1.2, sakuraColors[0], 1.1);
  addTree(group, 2.0, 0.7, -1.2, sakuraColors[1], 1.2);
  addTree(group, 2.2, 0.7, 1.0, sakuraColors[2], 0.9);

  return group;
}

// 7. Cosmic World Center
export function buildCentralCosmicWorld(): THREE.Group {
  const group = new THREE.Group();
  group.add(createCentralBase('#c084fc', '#0f172a'));

  // Astral obsidian stone platform
  const astralPlaza = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.5, 0.4, 12), mat('#1e1b4b'));
  astralPlaza.position.y = 0.55;
  group.add(astralPlaza);

  // Central Stargate Arch Portal
  const stargateTorus = new THREE.Mesh(
    new THREE.TorusGeometry(1.8, 0.22, 10, 32),
    mat('#8b5cf6', { metalness: 0.6, roughness: 0.3 })
  );
  stargateTorus.position.set(0, 2.4, 0);
  group.add(stargateTorus);

  // Inner shimmering event horizon portal disc
  const horizon = new THREE.Mesh(
    new THREE.CircleGeometry(1.6, 24),
    mat('#38bdf8', { transparent: true, opacity: 0.85, roughness: 0.1 })
  );
  horizon.position.set(0, 2.4, 0);
  group.add(horizon);

  // Golden Gyroscopic Gimbal Rings around portal
  const ring1 = new THREE.Mesh(
    new THREE.TorusGeometry(2.3, 0.08, 8, 32),
    mat('#fbbf24', { metalness: 0.8, roughness: 0.2 })
  );
  ring1.position.set(0, 2.4, 0);
  ring1.rotation.x = Math.PI / 4;
  group.add(ring1);

  const ring2 = new THREE.Mesh(
    new THREE.TorusGeometry(2.6, 0.08, 8, 32),
    mat('#c084fc', { metalness: 0.5, roughness: 0.3 })
  );
  ring2.position.set(0, 2.4, 0);
  ring2.rotation.y = Math.PI / 3;
  group.add(ring2);

  // Levitating planetary orbs around the citadel
  const planets = [
    { x: -2.1, y: 3.5, z: 1.2, r: 0.5, color: '#38bdf8' },
    { x: 2.2, y: 3.8, z: -1.0, r: 0.45, color: '#fb923c' },
    { x: 1.8, y: 1.8, z: 2.0, r: 0.35, color: '#e879f9' },
    { x: -1.9, y: 1.6, z: -1.8, r: 0.4, color: '#4ade80' },
  ];

  planets.forEach((p) => {
    const orb = new THREE.Mesh(new THREE.SphereGeometry(p.r, 12, 10), mat(p.color));
    orb.position.set(p.x, p.y, p.z);
    group.add(orb);

    // Planet ring
    const planetRing = new THREE.Mesh(new THREE.RingGeometry(p.r * 1.3, p.r * 1.8, 16), mat('#fef08a', { side: THREE.DoubleSide }));
    planetRing.rotation.x = Math.PI / 2.5;
    planetRing.position.set(p.x, p.y, p.z);
    group.add(planetRing);
  });

  // Cosmic crystal obelisks anchoring the site
  const obeliskCoords = [
    [-1.8, 1.2],
    [1.8, 1.2],
    [-1.8, -1.2],
    [1.8, -1.2],
  ];

  obeliskCoords.forEach(([ox, oz]) => {
    const ob = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.8, 4), mat('#a855f7'));
    ob.position.set(ox, 1.6, oz);
    group.add(ob);

    // Glow crystal cap
    const cap = new THREE.Mesh(new THREE.OctahedronGeometry(0.18), mat('#f472b6', { emissive: '#c084fc', emissiveIntensity: 0.5 }));
    cap.position.set(ox, 2.6, oz);
    group.add(cap);
  });

  return group;
}

// 8. Nature Paradise Center (Monumental Alpine Landmark Summit)
export function buildCentralNatureParadise(): THREE.Group {
  const group = new THREE.Group();
  group.add(createCentralBase('#4ade80', '#1f2937'));

  // Terraced mountain foothills & granite massif
  const foothills = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.6, 0.8, 10), mat('#22c55e'));
  foothills.position.y = 0.7;
  group.add(foothills);

  const graniteMassif = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.8, 1.4, 9), mat('#64748b'));
  graniteMassif.position.set(-0.3, 1.6, -0.4);
  graniteMassif.castShadow = true;
  group.add(graniteMassif);

  // 1. Soaring Majestic Alpine Peak (Monumental Landmark Summit reaching Y = 8.6)
  const peak1 = new THREE.Mesh(new THREE.ConeGeometry(2.4, 6.2, 7), mat('#475569'));
  peak1.position.set(-0.9, 4.2, -0.6);
  peak1.castShadow = true;
  group.add(peak1);

  // Gleaming Glacial Snow Cap
  const snow1 = new THREE.Mesh(new THREE.ConeGeometry(1.4, 2.8, 7), mat('#f8fafc', { roughness: 0.4 }));
  snow1.position.set(-0.9, 6.0, -0.6);
  snow1.castShadow = true;
  group.add(snow1);

  // Summit Marker / Alpine Beacon Finial
  const beacon = new THREE.Mesh(new THREE.OctahedronGeometry(0.22), mat('#38bdf8', { emissive: '#0284c7', emissiveIntensity: 0.5 }));
  beacon.position.set(-0.9, 7.6, -0.6);
  group.add(beacon);

  // 2. Secondary Sharp Needle Crag (Reaching Y = 6.4)
  const peak2 = new THREE.Mesh(new THREE.ConeGeometry(1.6, 4.2, 6), mat('#52525b'));
  peak2.position.set(1.5, 3.2, -0.8);
  peak2.castShadow = true;
  group.add(peak2);

  const snow2 = new THREE.Mesh(new THREE.ConeGeometry(0.85, 1.8, 6), mat('#f8fafc'));
  snow2.position.set(1.5, 4.5, -0.8);
  snow2.castShadow = true;
  group.add(snow2);

  // 3. High-altitude Suspension Walkway spanning the twin peaks
  const bridgeCurve = new THREE.CylinderGeometry(0.12, 0.12, 2.4, 6);
  const mountainBridge = new THREE.Mesh(bridgeCurve, mat('#b45309'));
  mountainBridge.rotation.z = Math.PI / 2.3;
  mountainBridge.position.set(0.3, 4.5, -0.7);
  group.add(mountainBridge);

  // 4. Grand Alpine Observatory & Ranger Citadel
  const towerBase = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.9, 1.8, 8), mat('#334155'));
  towerBase.position.set(2.2, 1.8, 1.0);
  towerBase.castShadow = true;
  group.add(towerBase);

  const obsDeck = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 0.9, 0.4, 8), mat('#78350f'));
  obsDeck.position.set(2.2, 2.8, 1.0);
  group.add(obsDeck);

  const obsDome = new THREE.Mesh(new THREE.SphereGeometry(0.75, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat('#38bdf8', { roughness: 0.2 }));
  obsDome.position.set(2.2, 3.0, 1.0);
  group.add(obsDome);

  const telescope = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 1.2, 6), mat('#f59e0b', { metalness: 0.8 }));
  telescope.rotation.x = -Math.PI / 4;
  telescope.rotation.y = Math.PI / 5;
  telescope.position.set(2.2, 3.7, 1.0);
  group.add(telescope);

  // 5. Radiant Mountain Lake / Emerald Lagoon
  const lake = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.6, 0.2, 14), mat('#0284c7', { roughness: 0.15 }));
  lake.position.set(0.2, 0.95, 1.2);
  group.add(lake);

  // Shoreline timber jetty
  const dock = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.15, 1.4), mat('#92400e'));
  dock.position.set(0.2, 1.05, 2.5);
  group.add(dock);

  // 6. Multi-tier Cascading High Waterfalls plunging into lake
  const waterfall1 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 2.8, 0.12), mat('#bae6fd'));
  waterfall1.position.set(-0.4, 2.4, 0.3);
  waterfall1.rotation.x = 0.25;
  group.add(waterfall1);

  const waterfall2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.0, 0.12), mat('#7dd3fc'));
  waterfall2.position.set(0.8, 2.0, 0.2);
  waterfall2.rotation.x = 0.3;
  group.add(waterfall2);

  // Foam splash at waterfall base
  const splash = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.0, 0.15, 8), mat('#ffffff', { transparent: true, opacity: 0.85 }));
  splash.position.set(-0.2, 1.05, 0.8);
  group.add(splash);

  // 7. Dense Alpine Pine and Fir Forest at varied elevations
  addTree(group, -2.8, 0.8, 0.6, '#15803d', 1.6);
  addTree(group, -2.4, 0.8, 2.0, '#166534', 1.4);
  addTree(group, -1.8, 1.4, 2.4, '#15803d', 1.2);
  addTree(group, -1.2, 2.0, 1.8, '#14532d', 1.1);
  addTree(group, 1.2, 1.0, 2.6, '#16a34a', 1.3);
  addTree(group, 3.0, 0.8, -0.4, '#15803d', 1.5);
  addTree(group, 2.6, 0.8, -1.8, '#166534', 1.3);
  addTree(group, -2.6, 0.8, -1.8, '#14532d', 1.4);

  return group;
}

// Master dispatcher for Center styles
export function buildCenterStyleScene(styleId: CenterStyleId): THREE.Group {
  switch (styleId) {
    case 'center_castle':
      return buildCentralCastleWorld();
    case 'center_knowledge':
      return buildCentralKnowledgeWorld();
    case 'center_cozy_village':
      return buildCentralCozyVillage();
    case 'center_tree_of_life':
      return buildCentralTreeOfLife();
    case 'center_modern_city':
      return buildCentralModernCity();
    case 'center_zen_garden':
      return buildCentralZenGarden();
    case 'center_cosmic':
      return buildCentralCosmicWorld();
    case 'center_nature_paradise':
      return buildCentralNatureParadise();
    default:
      return buildCentralCastleWorld();
  }
}
