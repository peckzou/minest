import * as THREE from 'three';
import { IslandMetadata, IslandVariant } from '../../types/island';
import { createLowPolyMat, createWaterMat, createGlassMat, createTree, createCloudCluster } from './materials';
import { buildRichIslandTerrain } from './terrain';

function mat(color: number | string, options: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    flatShading: true,
    roughness: 0.68,
    metalness: 0.12,
    ...options,
  });
}

function createPalmTree(pos: [number, number, number], scale = 1.0): THREE.Group {
  const g = new THREE.Group();
  g.position.set(...pos);
  g.scale.set(scale, scale, scale);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 1.8, 7), mat('#78350F'));
  trunk.position.y = 0.9;
  trunk.rotation.z = 0.15;
  const fronds = new THREE.Mesh(new THREE.ConeGeometry(0.75, 0.45, 6), mat('#15803D'));
  fronds.position.set(0.15, 1.9, 0);
  g.add(trunk, fronds);
  return g;
}

// =========================================================================
// PART I: 30 MAJOR WORLD ISLANDS (MW-41 to MW-70)
// =========================================================================

export function build5MajorWorldScene(island: IslandMetadata, variant: IslandVariant): THREE.Group {
  const master = new THREE.Group();

  // Floating terrain base with geological rock underside & clouds
  const base = buildRichIslandTerrain(island, variant, 'plateau');
  master.add(base);

  const primary = island.palette[0]?.hex || '#4F46E5';
  const secondary = island.palette[1]?.hex || '#06B6D4';
  const accent = island.palette[2]?.hex || '#F59E0B';
  const ground = island.palette[3]?.hex || '#10B981';

  const content = new THREE.Group();
  content.position.set(0, 0.7, 0);

  switch (island.slug) {
    // ---------------------------------------------------------------------
    // Mythologies & Sacred Cosmology (MW-41 to MW-45)
    // ---------------------------------------------------------------------
    case 'world-norse-realm-macro': {
      // Yggdrasil World Tree
      const treeTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 3.2, 8), mat('#78350F'));
      treeTrunk.position.set(-0.8, 1.6, -0.6);
      const treeCanopy = new THREE.Mesh(new THREE.DodecahedronGeometry(1.4, 1), mat('#15803D'));
      treeCanopy.position.set(-0.8, 3.2, -0.6);
      content.add(treeTrunk, treeCanopy);

      // Bifrost Rainbow Bridge
      const bridge = new THREE.Mesh(new THREE.TorusGeometry(2.0, 0.12, 6, 16, Math.PI * 0.6), mat('#D97706', { emissive: '#F59E0B', metalness: 0.4 }));
      bridge.rotation.x = Math.PI / 2;
      bridge.rotation.z = -Math.PI / 4;
      bridge.position.set(0.6, 0.4, 0.2);
      content.add(bridge);

      // Valhalla Longhouse
      const hall = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 1.1), mat('#78350F'));
      hall.position.set(1.4, 0.4, -0.8);
      const hallRoof = new THREE.Mesh(new THREE.ConeGeometry(1.2, 0.7, 4), mat('#F59E0B', { metalness: 0.6 }));
      hallRoof.rotation.y = Math.PI / 4;
      hallRoof.position.set(1.4, 1.15, -0.8);
      content.add(hall, hallRoof);
      break;
    }

    case 'world-celtic-myth-macro': {
      // Megalithic Stone Circle (Stonehenge style)
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI * 2) / 8;
        const stone = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.0, 0.2), mat('#64748B'));
        stone.position.set(Math.cos(angle) * 1.5 - 0.2, 0.5, Math.sin(angle) * 1.5 - 0.2);
        content.add(stone);
      }
      // Lintels
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI * 2) / 4 + Math.PI / 8;
        const lintel = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.18, 0.22), mat('#475569'));
        lintel.position.set(Math.cos(angle) * 1.5 - 0.2, 1.05, Math.sin(angle) * 1.5 - 0.2);
        lintel.rotation.y = -angle;
        content.add(lintel);
      }
      // Fairy Sidhe Mound & Sacred Oak
      const sidheMound = new THREE.Mesh(new THREE.ConeGeometry(1.1, 0.6, 8), mat('#166534'));
      sidheMound.position.set(1.4, 0.3, 1.1);
      const oak = createTree('oak', [1.4, 0.6, 1.1], 1.2);
      content.add(sidheMound, oak);
      break;
    }

    case 'world-mayan-astral-macro': {
      // Stepped Pyramid Temple of Kukulcan
      for (let tier = 0; tier < 5; tier++) {
        const sz = 2.4 - tier * 0.4;
        const step = new THREE.Mesh(new THREE.BoxGeometry(sz, 0.3, sz), mat('#A8A29E'));
        step.position.set(-0.2, 0.15 + tier * 0.3, -0.2);
        content.add(step);
      }
      const templeTop = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.7), mat('#78716C'));
      templeTop.position.set(-0.2, 1.75, -0.2);
      content.add(templeTop);

      // Jungle Foliage & Carved Stele
      content.add(createPalmTree([-1.6, 0, 1.2], 1.2));
      content.add(createPalmTree([1.5, 0, -1.3], 1.1));
      const stele = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.9, 0.15), mat('#D97706'));
      stele.position.set(1.2, 0.45, 1.0);
      content.add(stele);
      break;
    }

    case 'world-shinto-realm-macro': {
      // Vermilion Grand Torii Gate
      const torii = new THREE.Group();
      torii.position.set(0, 0, 1.2);
      const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 1.6, 8), mat('#DC2626'));
      postL.position.set(-0.6, 0.8, 0);
      const postR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 1.6, 8), mat('#DC2626'));
      postR.position.set(0.6, 0.8, 0);
      const lintelTop = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.15, 0.22), mat('#DC2626'));
      lintelTop.position.set(0, 1.6, 0);
      const lintelMid = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.1, 0.18), mat('#18181B'));
      lintelMid.position.set(0, 1.35, 0);
      torii.add(postL, postR, lintelTop, lintelMid);
      content.add(torii);

      // Shinto Shrine Sanctuary & Sacred Cedar
      const shrine = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.8, 1.2), mat('#78350F'));
      shrine.position.set(0, 0.4, -0.6);
      const shrineRoof = new THREE.Mesh(new THREE.ConeGeometry(1.3, 0.6, 4), mat('#D97706'));
      shrineRoof.rotation.y = Math.PI / 4;
      shrineRoof.position.set(0, 1.1, -0.6);
      content.add(shrine, shrineRoof);
      content.add(createTree('pine', [-1.4, 0, -0.6], 1.3));
      content.add(createTree('blossom', [1.3, 0, -0.5], 1.1));
      break;
    }

    case 'world-vedic-temple-macro': {
      // Vedic Shikara Spire Complex
      const mainShikara = new THREE.Mesh(new THREE.ConeGeometry(0.8, 2.4, 8), mat('#EA580C'));
      mainShikara.position.set(0, 1.2, -0.4);
      const subShikara1 = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.6, 8), mat('#F59E0B'));
      subShikara1.position.set(-0.8, 0.8, -0.4);
      const subShikara2 = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.6, 8), mat('#F59E0B'));
      subShikara2.position.set(0.8, 0.8, -0.4);
      content.add(mainShikara, subShikara1, subShikara2);

      // Lotus Pool
      const pool = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.08, 12), createWaterMat());
      pool.position.set(0, 0.05, 1.1);
      content.add(pool);
      break;
    }

    // ---------------------------------------------------------------------
    // Extreme Terrains & Planetary Phenomena (MW-46 to MW-50)
    // ---------------------------------------------------------------------
    case 'world-bioluminescent-chasm-macro': {
      // Canyon Chasm with glowing crystal mushrooms
      [-1.4, 1.4].forEach((cx) => {
        const cliff = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.4, 2.8), mat('#0F172A'));
        cliff.position.set(cx, 0.7, 0);
        content.add(cliff);
      });
      // Giant glowing mushrooms in the chasm
      [[-0.3, 0.3], [0.3, -0.4], [0, 0.6]].forEach(([mx, mz], i) => {
        const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.8 + i * 0.2, 6), mat('#E2E8F0'));
        stalk.position.set(mx, (0.8 + i * 0.2) / 2, mz);
        const cap = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.25, 8), mat(i % 2 === 0 ? '#06B6D4' : '#8B5CF6', { emissive: '#06B6D4', roughness: 0.3 }));
        cap.position.set(mx, 0.8 + i * 0.2, mz);
        content.add(stalk, cap);
      });
      break;
    }

    case 'world-crystal-geode-macro': {
      // Massive multifaceted amethyst crystal clusters
      const angles = [0, 1.2, 2.4, 3.6, 4.8];
      angles.forEach((ang, i) => {
        const h = 1.2 + (i % 3) * 0.5;
        const crystal = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.35, h, 6), mat(i % 2 === 0 ? '#8B5CF6' : '#EC4899', { roughness: 0.2, metalness: 0.4 }));
        crystal.position.set(Math.cos(ang) * 0.8, h / 2, Math.sin(ang) * 0.8);
        crystal.rotation.x = Math.sin(ang) * 0.25;
        crystal.rotation.z = Math.cos(ang) * 0.25;
        content.add(crystal);
      });
      break;
    }

    case 'world-stormchaser-tempest-macro': {
      // Twisting low-poly funnel tornado & lightning
      for (let y = 0; y < 8; y++) {
        const r = 0.15 + y * 0.22;
        const vortexRing = new THREE.Mesh(new THREE.TorusGeometry(r, 0.08, 6, 12), mat('#64748B'));
        vortexRing.position.set(Math.sin(y * 0.8) * 0.2, y * 0.3 + 0.2, Math.cos(y * 0.8) * 0.2);
        vortexRing.rotation.x = Math.PI / 2;
        content.add(vortexRing);
      }
      // Doppler Radar Vehicle
      const truck = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.4, 0.5), mat('#F59E0B'));
      truck.position.set(1.4, 0.2, 0.8);
      const dish = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat('#FFFFFF'));
      dish.position.set(1.4, 0.55, 0.8);
      content.add(truck, dish);
      break;
    }

    case 'world-geothermal-caldera-macro': {
      // Volcano Caldera Crater with Molten Magma Lake
      const crater = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.2, 1.1, 12, 1, true), mat('#1E293B'));
      crater.position.set(0, 0.55, 0);
      const magma = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.1, 12), mat('#EA580C', { emissive: '#DC2626', roughness: 0.4 }));
      magma.position.set(0, 0.45, 0);
      content.add(crater, magma);
      break;
    }

    case 'world-sky-islands-aerodrome-macro': {
      // Suspended Bridges and Landing Strip
      const runway = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 0.7), mat('#334155'));
      runway.position.set(0, 0.2, 0);
      const hangar = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.1, 8, 1, false, 0, Math.PI), mat('#F8FAFC'));
      hangar.position.set(-1.1, 0.2, -0.6);
      hangar.rotation.z = Math.PI / 2;
      hangar.rotation.y = Math.PI / 2;
      content.add(runway, hangar);
      // Miniature Biplane
      const plane = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.15, 0.6), mat('#EF4444'));
      plane.position.set(0.6, 0.35, 0);
      content.add(plane);
      break;
    }

    // ---------------------------------------------------------------------
    // Speculative Architecture & Future Habitats (MW-51 to MW-55)
    // ---------------------------------------------------------------------
    case 'world-solarpunk-arcology-macro': {
      // Spiraling Green Arcology Spire
      for (let i = 0; i < 5; i++) {
        const floor = new THREE.Mesh(new THREE.CylinderGeometry(1.2 - i * 0.18, 1.3 - i * 0.18, 0.35, 8), mat('#F8FAFC'));
        floor.position.y = 0.2 + i * 0.45;
        const garden = new THREE.Mesh(new THREE.TorusGeometry(1.15 - i * 0.18, 0.12, 6, 12), mat('#16A34A'));
        garden.position.y = 0.35 + i * 0.45;
        garden.rotation.x = Math.PI / 2;
        content.add(floor, garden);
      }
      // Top Solar Flower Petals
      const solarCrown = new THREE.Mesh(new THREE.ConeGeometry(0.7, 0.4, 6), mat('#0284C7', { metalness: 0.6 }));
      solarCrown.position.y = 2.65;
      content.add(solarCrown);
      break;
    }

    case 'world-abyssal-seastead-macro': {
      // Hexagonal Modular Ocean Platforms
      [[-0.7, -0.5], [0.7, -0.5], [0, 0.7]].forEach(([px, pz], idx) => {
        const hex = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.8, 0.3, 6), mat('#E2E8F0'));
        hex.position.set(px, 0.15, pz);
        const dome = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat(idx === 0 ? '#38BDF8' : '#22C55E', { roughness: 0.2 }));
        dome.position.set(px, 0.3, pz);
        content.add(hex, dome);
      });
      break;
    }

    case 'world-brutalist-citadel-macro': {
      // Interlocking Geometric Raw Concrete Volumes
      const b1 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.8, 1.0), mat('#64748B'));
      b1.position.set(-0.5, 0.9, -0.2);
      const b2 = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.2, 1.3), mat('#475569'));
      b2.position.set(0.6, 0.6, 0.3);
      const cantilever = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 0.8), mat('#94A3B8'));
      cantilever.position.set(0.1, 1.5, 0.2);
      content.add(b1, b2, cantilever);
      break;
    }

    case 'world-cyberpunk-megacity-macro': {
      // Neon Blade Runner Skyscraper Cluster
      const heights = [2.6, 2.0, 1.7, 2.3];
      const positions = [[-0.8, -0.6], [0.6, -0.5], [-0.5, 0.6], [0.7, 0.7]];
      const colors = ['#0F172A', '#1E293B', '#0F172A', '#1E293B'];
      positions.forEach(([bx, bz], i) => {
        const tower = new THREE.Mesh(new THREE.BoxGeometry(0.7, heights[i], 0.7), mat(colors[i]));
        tower.position.set(bx, heights[i] / 2, bz);
        // Neon accent band
        const neon = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.08, 0.74), mat(i % 2 === 0 ? '#06B6D4' : '#EC4899', { emissive: i % 2 === 0 ? '#06B6D4' : '#EC4899' }));
        neon.position.set(bx, heights[i] * 0.7, bz);
        content.add(tower, neon);
      });
      break;
    }

    case 'world-steppe-caravanserai-macro': {
      // Walled Caravanserai Courtyard & Yurts
      const walls = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.5, 2.4), mat('#D97706'));
      walls.position.set(0, 0.25, 0);
      const courtyard = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 1.6), mat('#78350F'));
      courtyard.position.set(0, 0.3, 0);
      content.add(walls);
      // Traditional Felt Yurts
      [[-0.6, 0], [0.6, 0.4], [0, -0.5]].forEach(([yx, yz]) => {
        const yurtCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.25, 8), mat('#F8FAFC'));
        yurtCyl.position.set(yx, 0.35, yz);
        const yurtRoof = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.2, 8), mat('#DC2626'));
        yurtRoof.position.set(yx, 0.55, yz);
        content.add(yurtCyl, yurtRoof);
      });
      break;
    }

    // ---------------------------------------------------------------------
    // High Sciences & Frontier Frontiers (MW-56 to MW-60)
    // ---------------------------------------------------------------------
    case 'world-quantum-microcosm-macro': {
      // Floating Atomic Electron Orbit Shells & Quantum Core
      const nucleus = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45, 1), mat('#EC4899', { emissive: '#DB2777' }));
      nucleus.position.set(0, 1.4, 0);
      content.add(nucleus);
      for (let o = 0; o < 3; o++) {
        const orbit = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.04, 6, 24), mat('#06B6D4', { emissive: '#06B6D4' }));
        orbit.position.set(0, 1.4, 0);
        orbit.rotation.x = o * (Math.PI / 3);
        orbit.rotation.y = o * (Math.PI / 4);
        content.add(orbit);
      }
      break;
    }

    case 'world-mariana-trench-macro': {
      // Abyssal Chasm with Bathyscaphe & Black Smokers
      const sub = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 6), mat('#EAB308'));
      sub.position.set(0, 1.1, 0);
      const subRotor = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.04), mat('#334155'));
      subRotor.position.set(0, 1.1, -0.42);
      content.add(sub, subRotor);
      // Smokers
      [-0.9, 0.8].forEach((sx) => {
        const smoker = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, 1.2, 7), mat('#0F172A'));
        smoker.position.set(sx, 0.6, -0.6);
        content.add(smoker);
      });
      break;
    }

    case 'world-neural-network-macro': {
      // Glowing Synaptic Network Nodes & Axon Paths
      const nodes = [
        [-1.0, 0.8, -0.8], [0.9, 1.0, -0.7], [0, 1.4, 0.2],
        [-0.8, 0.6, 0.9], [0.8, 0.7, 0.8]
      ];
      nodes.forEach(([nx, ny, nz]) => {
        const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), mat('#A855F7', { emissive: '#9333EA' }));
        sphere.position.set(nx, ny, nz);
        content.add(sphere);
      });
      // Neural Pathway links
      for (let i = 0; i < nodes.length - 1; i++) {
        const p1 = new THREE.Vector3(...nodes[i]);
        const p2 = new THREE.Vector3(...nodes[i + 1]);
        const mid = p1.clone().add(p2).multiplyScalar(0.5);
        const dist = p1.distanceTo(p2);
        const axon = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, dist, 6), mat('#06B6D4'));
        axon.position.copy(mid);
        axon.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p2.clone().sub(p1).normalize());
        content.add(axon);
      }
      break;
    }

    case 'world-cryogenic-superconductor-macro': {
      // Maglev Levitating Disc & Cryogenic Vats
      const track = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.08, 6, 20), mat('#0284C7'));
      track.rotation.x = Math.PI / 2;
      track.position.set(0, 0.5, 0);
      const levitatingDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.1, 12), mat('#E2E8F0', { metalness: 0.8 }));
      levitatingDisc.position.set(0, 1.0, 0);
      content.add(track, levitatingDisc);
      break;
    }

    case 'world-particle-synchrotron-macro': {
      // Circular Beam Storage Ring & Injection Linac
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.12, 8, 24), mat('#1E3A8A'));
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, 0.4, 0);
      const centerDetector = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.7, 8), mat('#F59E0B'));
      centerDetector.position.set(0, 0.45, 0);
      content.add(ring, centerDetector);
      break;
    }

    // ---------------------------------------------------------------------
    // Cultural Arts & Expressive Realms (MW-61 to MW-65)
    // ---------------------------------------------------------------------
    case 'world-cinematic-studio-macro': {
      // Soundstages, Film Clapperboard & Studio Backlot
      const soundstage = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.0, 1.2), mat('#334155'));
      soundstage.position.set(-0.6, 0.5, -0.4);
      const clapper = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.45, 0.08), mat('#18181B'));
      clapper.position.set(0.9, 0.4, 0.6);
      content.add(soundstage, clapper);
      break;
    }

    case 'world-haute-couture-macro': {
      // Runway Ramp, Curved Fabric Canopy & Mannequins
      const catwalk = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 0.8), mat('#F8FAFC'));
      catwalk.position.set(0, 0.2, 0);
      const archCanopy = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.08, 6, 16, Math.PI), mat('#EC4899'));
      archCanopy.rotation.z = Math.PI;
      archCanopy.position.set(0, 0.2, -0.4);
      content.add(catwalk, archCanopy);
      break;
    }

    case 'world-culinary-gastronomy-macro': {
      // Grand Cloche Cover & Chef Kitchen Station
      const cloche = new THREE.Mesh(new THREE.SphereGeometry(0.7, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat('#E2E8F0', { metalness: 0.8 }));
      cloche.position.set(-0.5, 0.2, 0);
      const platter = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.08, 16), mat('#D4AF37', { metalness: 0.7 }));
      platter.position.set(-0.5, 0.16, 0);
      content.add(cloche, platter);
      break;
    }

    case 'world-symphonic-hall-macro': {
      // Acoustic Shell Auditorium & Grand Piano
      const shell = new THREE.Mesh(new THREE.SphereGeometry(1.3, 10, 8, 0, Math.PI, 0, Math.PI / 2), mat('#D97706'));
      shell.rotation.x = Math.PI / 2;
      shell.position.set(0, 0.4, -0.4);
      const piano = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.35, 0.5), mat('#0F172A'));
      piano.position.set(0, 0.25, 0.3);
      content.add(shell, piano);
      break;
    }

    case 'world-kinetic-automata-macro': {
      // Interlocking Kinetic Clockwork Cogs
      for (let g = 0; g < 3; g++) {
        const gear = new THREE.Mesh(new THREE.CylinderGeometry(0.6 - g * 0.12, 0.6 - g * 0.12, 0.1, 10), mat(g === 0 ? '#D97706' : '#94A3B8'));
        gear.position.set((g - 1) * 0.9, 0.4 + g * 0.3, (g % 2) * 0.4);
        content.add(gear);
      }
      break;
    }

    // ---------------------------------------------------------------------
    // Living Culture & Wellness (MW-66 to MW-70)
    // ---------------------------------------------------------------------
    case 'world-thermal-bathhouse-macro': {
      // Japanese Onsen Mineral Pool & Timber Pavilion
      const onsenPool = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.1, 10), createWaterMat());
      onsenPool.position.set(0, 0.1, 0.2);
      const pavilion = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 1.0), mat('#78350F'));
      pavilion.position.set(0, 0.5, -0.9);
      const pavRoof = new THREE.Mesh(new THREE.ConeGeometry(1.0, 0.4, 4), mat('#1E293B'));
      pavRoof.rotation.y = Math.PI / 4;
      pavRoof.position.set(0, 1.05, -0.9);
      content.add(onsenPool, pavilion, pavRoof);
      break;
    }

    case 'world-antiquarian-library-macro': {
      // Bookshelves Tower & Grand Dome
      const bookTower = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.9, 1.6, 8), mat('#78350F'));
      bookTower.position.set(0, 0.8, -0.3);
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat('#38BDF8', { roughness: 0.3 }));
      dome.position.set(0, 1.6, -0.3);
      content.add(bookTower, dome);
      break;
    }

    case 'world-alpine-mountaineering-macro': {
      // Jagged Alpine Peak, Glacier & Mountain Hut
      const peak = new THREE.Mesh(new THREE.ConeGeometry(1.3, 2.2, 4), mat('#475569'));
      peak.position.set(-0.4, 1.1, -0.3);
      const snowCap = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.9, 4), mat('#F8FAFC'));
      snowCap.position.set(-0.4, 1.75, -0.3);
      const hut = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.5), mat('#DC2626'));
      hut.position.set(0.9, 0.2, 0.5);
      content.add(peak, snowCap, hut);
      break;
    }

    case 'world-artisan-ceramic-macro': {
      // Terracotta Kiln & Giant Clay Vases
      const kiln = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.9, 1.0, 8), mat('#EA580C'));
      kiln.position.set(-0.7, 0.5, -0.3);
      const vase = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.15, 0.8, 8), mat('#0284C7'));
      vase.position.set(0.8, 0.4, 0.3);
      content.add(kiln, vase);
      break;
    }

    case 'world-festival-lanterns-macro': {
      // Water Lantern Canal & Festival Pagoda
      const pagoda = new THREE.Group();
      pagoda.position.set(0, 0, -0.6);
      for (let p = 0; p < 3; p++) {
        const floor = new THREE.Mesh(new THREE.BoxGeometry(1.2 - p * 0.25, 0.35, 1.2 - p * 0.25), mat('#DC2626'));
        floor.position.y = 0.2 + p * 0.45;
        const roof = new THREE.Mesh(new THREE.ConeGeometry(1.0 - p * 0.22, 0.25, 4), mat('#18181B'));
        roof.rotation.y = Math.PI / 4;
        roof.position.y = 0.45 + p * 0.45;
        pagoda.add(floor, roof);
      }
      content.add(pagoda);
      // Floating paper lanterns
      [[-0.8, 0.8], [0, 1.1], [0.8, 0.7]].forEach(([lx, lz]) => {
        const lantern = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.18), mat('#F59E0B', { emissive: '#F59E0B' }));
        lantern.position.set(lx, 0.2, lz);
        content.add(lantern);
      });
      break;
    }

    default: {
      // Universal fallback for any custom major world
      const mon = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.8, 6), mat(primary));
      mon.position.y = 0.9;
      content.add(mon);
      break;
    }
  }

  master.add(content);
  return master;
}

// =========================================================================
// PART II: 50 THEMATIC SUB-ISLANDS (SI-61 to SI-110)
// =========================================================================

export function build5SubIslandScene(island: IslandMetadata, variant: IslandVariant): THREE.Group {
  const master = new THREE.Group();

  // Floating Island Base with Rocky Geological Underside
  const base = buildRichIslandTerrain(island, variant, 'plateau');
  base.scale.set(0.85, 0.85, 0.85);
  master.add(base);

  const primary = island.palette[0]?.hex || '#4F46E5';
  const secondary = island.palette[1]?.hex || '#06B6D4';
  const accent = island.palette[2]?.hex || '#F59E0B';

  const content = new THREE.Group();
  content.position.set(0, 0.65, 0);

  switch (island.slug) {
    // ---------------------------------------------------------------------
    // A. Oceanic & Maritime Wonders (SI-61 to SI-70)
    // ---------------------------------------------------------------------
    case 'subisland-coral-reef-sanctuary': {
      // Corals & Shipwreck Prow
      const coral1 = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.8, 5), mat('#F43F5E'));
      coral1.position.set(-0.6, 0.4, 0.3);
      const coral2 = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.6, 5), mat('#F59E0B'));
      coral2.position.set(0.7, 0.3, -0.4);
      const wreck = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 1.0), mat('#78350F'));
      wreck.rotation.x = 0.4;
      wreck.position.set(0.2, 0.3, 0.4);
      content.add(coral1, coral2, wreck);
      break;
    }

    case 'subisland-polar-research-outpost': {
      // Red Geodesic Dome & Pier
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.65, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat('#EF4444'));
      dome.position.set(-0.4, 0.1, -0.2);
      const pier = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 1.2), mat('#78350F'));
      pier.position.set(0.6, 0.05, 0.4);
      content.add(dome, pier);
      break;
    }

    case 'subisland-lighthouse-promontory': {
      // Striped Lighthouse
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.35, 1.6, 8), mat('#FFFFFF'));
      shaft.position.set(0, 0.8, 0);
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.29, 0.35, 8), mat('#DC2626'));
      band.position.set(0, 0.8, 0);
      const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.25, 8), mat('#FEF08A', { emissive: '#F59E0B' }));
      lantern.position.set(0, 1.7, 0);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.2, 8), mat('#DC2626'));
      cap.position.set(0, 1.9, 0);
      content.add(shaft, band, lantern, cap);
      break;
    }

    case 'subisland-pirate-cove-smuggler-bay': {
      // Skull Sea Arch & Pirate Sloop
      const arch = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.2, 6, 8, Math.PI), mat('#64748B'));
      arch.position.set(-0.4, 0.3, -0.3);
      arch.rotation.z = Math.PI;
      const sloop = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.8), mat('#78350F'));
      sloop.position.set(0.6, 0.1, 0.4);
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.8, 6), mat('#78350F'));
      mast.position.set(0.6, 0.5, 0.4);
      content.add(arch, sloop, mast);
      break;
    }

    case 'subisland-hydrothermal-vent': {
      // Black Smoker Chimney & Sub
      const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.3, 1.4, 7), mat('#0F172A'));
      chimney.position.set(-0.3, 0.7, -0.2);
      const sub = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 6), mat('#EAB308'));
      sub.position.set(0.5, 0.5, 0.4);
      content.add(chimney, sub);
      break;
    }

    case 'subisland-floating-kelp-forest': {
      // Vertical Kelp Fronds & Sea Stack
      for (let k = 0; k < 5; k++) {
        const kelp = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.3, 6), mat('#65A30D'));
        kelp.position.set((k - 2) * 0.3, 0.65, Math.sin(k) * 0.4);
        content.add(kelp);
      }
      break;
    }

    case 'subisland-mangrove-lagoon': {
      // Mangrove Stilt Roots
      for (let r = 0; r < 4; r++) {
        const root = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.8, 6), mat('#78350F'));
        root.rotation.z = (r % 2 === 0 ? 0.35 : -0.35);
        root.position.set((r - 1.5) * 0.3, 0.4, 0);
        content.add(root);
      }
      const canopy = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55, 1), mat('#15803D'));
      canopy.position.set(0, 0.95, 0);
      content.add(canopy);
      break;
    }

    case 'subisland-pearl-diver-atoll': {
      // Sandbar, Palms & Canoe
      const hut = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.4, 6), mat('#B45309'));
      hut.position.set(-0.4, 0.4, -0.3);
      const canoe = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.8), mat('#78350F'));
      canoe.position.set(0.5, 0.1, 0.3);
      content.add(hut, canoe);
      content.add(createPalmTree([-0.4, 0.2, 0.5], 1.0));
      break;
    }

    case 'subisland-sunken-atlantis-relic': {
      // Classical Marble Columns & Golden Trident
      for (let c = 0; c < 3; c++) {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.9 - c * 0.15, 6), mat('#F8FAFC'));
        col.position.set((c - 1) * 0.5, (0.9 - c * 0.15) / 2, -0.3);
        content.add(col);
      }
      const trident = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.6, 3), mat('#F59E0B', { metalness: 0.8 }));
      trident.position.set(0.3, 0.5, 0.4);
      content.add(trident);
      break;
    }

    case 'subisland-floating-fish-farming-pod': {
      // Hexagonal Pens & Silo
      for (let p = 0; p < 2; p++) {
        const pen = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.04, 6, 6), mat('#334155'));
        pen.rotation.x = Math.PI / 2;
        pen.position.set((p - 0.5) * 0.9, 0.15, 0);
        content.add(pen);
      }
      const silo = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.6, 8), mat('#E2E8F0'));
      silo.position.set(0, 0.4, -0.6);
      content.add(silo);
      break;
    }

    // ---------------------------------------------------------------------
    // B. Extreme Habitats & Geology (SI-71 to SI-80)
    // ---------------------------------------------------------------------
    case 'subisland-salt-flats-mirage': {
      // Polygonal Salt Surface & Surveyor Rig
      const saltPlate = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.06, 1.8), mat('#F8FAFC'));
      saltPlate.position.set(0, 0.05, 0);
      const rig = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.4), mat('#F59E0B'));
      rig.position.set(0.5, 0.2, 0.3);
      content.add(saltPlate, rig);
      break;
    }

    case 'subisland-redwood-giant-grove': {
      // Giant Redwood Trunk & Walkway
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.65, 2.2, 8), mat('#991B1B'));
      trunk.position.set(0, 1.1, 0);
      const canopy = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.4, 7), mat('#166534'));
      canopy.position.set(0, 2.5, 0);
      content.add(trunk, canopy);
      break;
    }

    case 'subisland-sandstone-canyon-arch': {
      // Natural Red Rock Arch
      const archL = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 1.4, 6), mat('#EA580C'));
      archL.position.set(-0.6, 0.7, 0);
      const archR = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 1.4, 6), mat('#EA580C'));
      archR.position.set(0.6, 0.7, 0);
      const span = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.3, 0.4), mat('#EA580C'));
      span.position.set(0, 1.45, 0);
      content.add(archL, archR, span);
      break;
    }

    case 'subisland-steaming-geothermal-basin': {
      // Prismatic Pool & Geyser Cone
      const pool = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.08, 12), mat('#06B6D4'));
      pool.position.set(-0.3, 0.1, 0);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.08, 6, 12), mat('#FACC15'));
      rim.rotation.x = Math.PI / 2;
      rim.position.set(-0.3, 0.12, 0);
      const geyser = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.8, 6), mat('#F8FAFC'));
      geyser.position.set(0.6, 0.5, -0.3);
      content.add(pool, rim, geyser);
      break;
    }

    case 'subisland-basalt-giants-causeway': {
      // Stepped Hexagonal Columns
      [[-0.4, -0.4], [0, -0.4], [0.4, -0.4], [-0.2, 0], [0.2, 0], [0, 0.4]].forEach(([hx, hz], i) => {
        const colH = 0.5 + (i % 3) * 0.3;
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, colH, 6), mat('#1E293B'));
        col.position.set(hx, colH / 2, hz);
        content.add(col);
      });
      break;
    }

    case 'subisland-bamboo-forest-path': {
      // Bamboo Stalks & Stone Lantern
      for (let b = 0; b < 6; b++) {
        const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 6), mat('#16A34A'));
        stalk.position.set((b - 2.5) * 0.25, 0.7, (b % 2) * 0.4 - 0.2);
        content.add(stalk);
      }
      const lantern = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.4, 0.18), mat('#64748B'));
      lantern.position.set(0.6, 0.3, 0.4);
      content.add(lantern);
      break;
    }

    case 'subisland-alpine-meadow-ridge': {
      // Chalet & Meadow Pasture
      const chalet = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.4, 0.6), mat('#78350F'));
      chalet.position.set(0, 0.3, -0.3);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.3, 4), mat('#DC2626'));
      roof.rotation.y = Math.PI / 4;
      roof.position.set(0, 0.6, -0.3);
      content.add(chalet, roof);
      content.add(createTree('pine', [0.7, 0.1, 0.4], 0.9));
      break;
    }

    case 'subisland-petrified-fossil-forest': {
      // Agate Logs
      for (let l = 0; l < 3; l++) {
        const log = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.8, 6), mat('#D97706'));
        log.rotation.z = Math.PI / 2;
        log.position.set((l - 1) * 0.5, 0.15, (l % 2) * 0.3);
        content.add(log);
      }
      break;
    }

    case 'subisland-oasis-date-palm': {
      // Date Palms & Well
      content.add(createPalmTree([-0.4, 0.1, -0.2], 1.2));
      content.add(createPalmTree([0.4, 0.1, 0.3], 1.0));
      const well = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.25, 8), mat('#D97706'));
      well.position.set(0, 0.2, 0);
      content.add(well);
      break;
    }

    case 'subisland-aurora-borealis-tundra': {
      // Igloo & Green Aurora Arc
      const igloo = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat('#E0F2FE'));
      igloo.position.set(-0.3, 0.1, 0.2);
      const aurora = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.08, 4, 12, Math.PI * 0.7), mat('#22C55E', { emissive: '#22C55E' }));
      aurora.rotation.x = Math.PI / 2;
      aurora.position.set(0, 1.1, -0.4);
      content.add(igloo, aurora);
      break;
    }

    // ---------------------------------------------------------------------
    // C. Urban Crafts, Industry & Infrastructure (SI-81 to SI-90)
    // ---------------------------------------------------------------------
    case 'subisland-artisan-blacksmith-forge': {
      // Anvil & Chimney
      const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.1, 0.4), mat('#475569'));
      chimney.position.set(-0.5, 0.6, -0.3);
      const anvil = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.25, 0.2), mat('#18181B'));
      anvil.position.set(0.3, 0.2, 0.2);
      content.add(chimney, anvil);
      break;
    }

    case 'subisland-windmill-grain-mill': {
      // Smock Windmill
      const mill = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.45, 1.2, 8), mat('#78350F'));
      mill.position.set(0, 0.65, 0);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.3, 8), mat('#DC2626'));
      cap.position.set(0, 1.35, 0);
      const blades = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.02), mat('#FFFFFF'));
      blades.position.set(0, 1.25, 0.26);
      content.add(mill, cap, blades);
      break;
    }

    case 'subisland-steam-locomotive-depot': {
      // Steam Train & Water Tower
      const train = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 1.0), mat('#18181B'));
      train.position.set(-0.3, 0.25, 0);
      const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.25, 6), mat('#D97706'));
      stack.position.set(-0.3, 0.5, 0.3);
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.8, 8), mat('#78350F'));
      tower.position.set(0.6, 0.5, -0.3);
      content.add(train, stack, tower);
      break;
    }

    case 'subisland-alpine-clockmaker-workshop': {
      // Cuckoo Chalet Facade
      const house = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 0.6), mat('#78350F'));
      house.position.set(0, 0.45, 0);
      const clock = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.04, 12), mat('#F59E0B'));
      clock.rotation.x = Math.PI / 2;
      clock.position.set(0, 0.55, 0.32);
      content.add(house, clock);
      break;
    }

    case 'subisland-vineyard-wine-cellar': {
      // Trellises & Barrel
      for (let t = 0; t < 3; t++) {
        const vine = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.3, 0.1), mat('#16A34A'));
        vine.position.set(0, 0.2 + t * 0.15, -0.4 + t * 0.35);
        content.add(vine);
      }
      break;
    }

    case 'subisland-rooftop-hydroponic-farm': {
      // Greenhouse & Grow Columns
      const greenhouse = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.7), mat('#38BDF8', { roughness: 0.2 }));
      greenhouse.position.set(-0.3, 0.4, 0);
      for (let c = 0; c < 3; c++) {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.6, 6), mat('#F8FAFC'));
        col.position.set(0.5, 0.35, (c - 1) * 0.3);
        content.add(col);
      }
      content.add(greenhouse);
      break;
    }

    case 'subisland-canal-lock-houseboat': {
      // Narrowboat & Lock
      const boat = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 1.2), mat('#1E3A8A'));
      boat.position.set(-0.2, 0.15, 0);
      const lockGate = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.4, 0.08), mat('#78350F'));
      lockGate.position.set(0.3, 0.25, 0.4);
      content.add(boat, lockGate);
      break;
    }

    case 'subisland-mountain-cable-car': {
      // Pylon & Red Gondola
      const pylon = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, 1.4, 4), mat('#475569'));
      pylon.position.set(0, 0.7, 0);
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.35), mat('#DC2626'));
      cabin.position.set(0.4, 0.9, 0);
      content.add(pylon, cabin);
      break;
    }

    case 'subisland-printing-press-guild': {
      // Printing Press Frame
      const press = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.5), mat('#78350F'));
      press.position.set(0, 0.45, 0);
      const platen = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.06, 0.35), mat('#18181B'));
      platen.position.set(0, 0.55, 0);
      content.add(press, platen);
      break;
    }

    case 'subisland-radio-transmission-station': {
      // Lattice Radio Mast
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.12, 1.8, 4), mat('#EF4444'));
      mast.position.set(0, 0.9, 0);
      const bunker = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.5), mat('#475569'));
      bunker.position.set(0.5, 0.2, 0.3);
      content.add(mast, bunker);
      break;
    }

    // ---------------------------------------------------------------------
    // D. Frontier Science, Space & High-Tech (SI-91 to SI-100)
    // ---------------------------------------------------------------------
    case 'subisland-lunar-base-habitat': {
      // Lunar Dome & Rover
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat('#F8FAFC'));
      dome.position.set(-0.3, 0.1, -0.2);
      const rover = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.4), mat('#F59E0B'));
      rover.position.set(0.5, 0.15, 0.3);
      content.add(dome, rover);
      break;
    }

    case 'subisland-mars-terraforming-greenhouse': {
      // Martian Bio-Dome
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.65, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat('#38BDF8', { roughness: 0.2 }));
      dome.position.set(0, 0.1, 0);
      const plants = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35, 1), mat('#22C55E'));
      plants.position.set(0, 0.25, 0);
      content.add(dome, plants);
      break;
    }

    case 'subisland-solar-concentrator-tower': {
      // Central Spire & Heliostats
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.15, 1.6, 6), mat('#F8FAFC'));
      tower.position.set(0, 0.8, -0.2);
      const crown = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), mat('#FEF08A', { emissive: '#F59E0B' }));
      crown.position.set(0, 1.65, -0.2);
      content.add(tower, crown);
      break;
    }

    case 'subisland-particle-accelerator-chamber': {
      // Toroidal Beam Ring
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.08, 6, 16), mat('#0284C7'));
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, 0.3, 0);
      content.add(ring);
      break;
    }

    case 'subisland-supercomputing-datacenter': {
      // Server Racks
      for (let s = 0; s < 3; s++) {
        const rack = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.2), mat('#0F172A'));
        rack.position.set(0, 0.35, (s - 1) * 0.4);
        content.add(rack);
      }
      break;
    }

    case 'subisland-deep-space-radio-telescope': {
      // Parabolic Dish
      const dish = new THREE.Mesh(new THREE.SphereGeometry(0.6, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat('#F8FAFC'));
      dish.position.set(0, 0.6, 0);
      dish.rotation.x = 0.5;
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.6, 6), mat('#475569'));
      mast.position.set(0, 0.3, 0);
      content.add(dish, mast);
      break;
    }

    case 'subisland-drone-delivery-skyport': {
      // Hex Pad & Drone
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.65, 0.1, 6), mat('#F8FAFC'));
      pad.position.set(0, 0.15, 0);
      const drone = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.3), mat('#0284C7'));
      drone.position.set(0, 0.3, 0);
      content.add(pad, drone);
      break;
    }

    case 'subisland-fusion-energy-reactor': {
      // Tokamak Ring
      const tokamak = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.16, 8, 16), mat('#0284C7'));
      tokamak.rotation.x = Math.PI / 2;
      tokamak.position.set(0, 0.4, 0);
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), mat('#EC4899', { emissive: '#DB2777' }));
      core.position.set(0, 0.4, 0);
      content.add(tokamak, core);
      break;
    }

    case 'subisland-cryogenic-seed-vault': {
      // Wedge Portal
      const wedge = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.2, 4), mat('#94A3B8'));
      wedge.rotation.z = Math.PI / 4;
      wedge.position.set(0, 0.45, 0);
      content.add(wedge);
      break;
    }

    case 'subisland-bionic-cybernetics-lab': {
      // Robotic Arm
      const armBase = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.2, 8), mat('#334155'));
      armBase.position.set(0, 0.15, 0);
      const limb1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.08), mat('#EAB308'));
      limb1.position.set(0, 0.45, 0);
      content.add(armBase, limb1);
      break;
    }

    // ---------------------------------------------------------------------
    // E. Enchantment, Lore & Wonder (SI-101 to SI-110)
    // ---------------------------------------------------------------------
    case 'subisland-floating-sky-castle': {
      // Mini Castle & Spires
      const keep = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.7), mat('#F8FAFC'));
      keep.position.set(0, 0.5, 0);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.5, 4), mat('#1E40AF'));
      roof.rotation.y = Math.PI / 4;
      roof.position.set(0, 1.15, 0);
      content.add(keep, roof);
      break;
    }

    case 'subisland-glowing-mushroom-hollow': {
      // Giant Glowing Mushroom
      const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 0.8, 8), mat('#E2E8F0'));
      stalk.position.set(0, 0.45, 0);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.35, 10), mat('#8B5CF6', { emissive: '#06B6D4' }));
      cap.position.set(0, 0.9, 0);
      content.add(stalk, cap);
      break;
    }

    case 'subisland-dragon-perch-nest': {
      // Basalt Spire & Dragon Egg
      const spire = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.5, 5), mat('#1E293B'));
      spire.position.set(0, 0.75, 0);
      const egg = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), mat('#DC2626', { emissive: '#991B1B' }));
      egg.position.set(0.3, 0.9, 0.2);
      content.add(spire, egg);
      break;
    }

    case 'subisland-stone-golem-sanctuary': {
      // Golem Head & Shoulders
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.5), mat('#64748B'));
      head.position.set(0, 0.4, 0);
      const eyes = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 0.52), mat('#06B6D4', { emissive: '#06B6D4' }));
      eyes.position.set(0, 0.48, 0);
      content.add(head, eyes);
      break;
    }

    case 'subisland-crystal-cavern-grotto': {
      // Amethyst Spikes
      for (let c = 0; c < 4; c++) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.9, 5), mat('#8B5CF6'));
        spike.position.set((c - 1.5) * 0.3, 0.5, (c % 2) * 0.2);
        content.add(spike);
      }
      break;
    }

    case 'subisland-wizard-orrery-tower': {
      // Orrery Rings & Spire
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 1.0, 6), mat('#64748B'));
      tower.position.set(0, 0.55, 0);
      const orrery = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.03, 6, 12), mat('#D97706'));
      orrery.position.set(0, 1.2, 0);
      content.add(tower, orrery);
      break;
    }

    case 'subisland-sunken-treasure-atoll': {
      // Treasure Chest & Palm
      const chest = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.25), mat('#78350F'));
      chest.position.set(0, 0.2, 0);
      const gold = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.1, 0.2), mat('#F59E0B'));
      gold.position.set(0, 0.32, 0);
      content.add(chest, gold);
      content.add(createPalmTree([-0.5, 0.1, -0.3], 1.0));
      break;
    }

    case 'subisland-steampunk-airship-mast': {
      // Mooring Mast & Blimp
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.1, 1.4, 4), mat('#D97706'));
      mast.position.set(-0.3, 0.7, 0);
      const blimp = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), mat('#E2E8F0'));
      blimp.scale.set(1.6, 0.8, 0.8);
      blimp.position.set(0.3, 1.1, 0);
      content.add(mast, blimp);
      break;
    }

    case 'subisland-bonsai-zen-rock': {
      // Pine Bonsai & Monolith
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3, 0), mat('#64748B'));
      rock.position.set(-0.4, 0.2, 0);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.6, 6), mat('#78350F'));
      trunk.position.set(0.3, 0.35, 0);
      trunk.rotation.z = -0.2;
      const canopy = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35, 1), mat('#166534'));
      canopy.position.set(0.4, 0.65, 0);
      content.add(rock, trunk, canopy);
      break;
    }

    case 'subisland-perpetual-rainbow-island': {
      // Rainbow Arc & Gold Pot
      const rainbow = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.08, 6, 16, Math.PI), mat('#EF4444'));
      rainbow.position.set(0, 0.3, 0);
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.25, 8), mat('#18181B'));
      pot.position.set(0.6, 0.18, 0.3);
      const gold = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), mat('#F59E0B'));
      gold.position.set(0.6, 0.3, 0.3);
      content.add(rainbow, pot, gold);
      break;
    }

    default: {
      const landmark = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.0, 5), mat(primary));
      landmark.position.y = 0.5;
      content.add(landmark);
      break;
    }
  }

  master.add(content);
  return master;
}
