import * as THREE from 'three';
import { IslandMetadata, IslandVariant } from '../../types/island';
import { createLowPolyMat, createWaterMat, createGlassMat, createTree, createCloudCluster } from './materials';
import { buildRichIslandTerrain } from './terrain';

import { build43MajorWorldScene, build43SubIslandScene } from './expansion43MeshBuilders';
import { build5MajorWorldScene, build5SubIslandScene } from './expansion5MeshBuilders';
import { buildAvatarMajorWorldScene } from './avatarMeshBuilders';
import { buildDistinctiveModularBuilding } from './building51To100MeshBuilders';
import { buildMuseumBuildingScene } from './museumMeshBuilders';
import { buildMuseumObjectScene } from './museumObjectMeshBuilders';

function mat(color: number | string, options: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    flatShading: true,
    roughness: 0.65,
    metalness: 0.1,
    ...options,
  });
}

// =========================================================================
// PART II: MAJOR WORLD ISLANDS (MW-01 to MW-90)
// =========================================================================
export function buildExpansionMajorWorld(island: IslandMetadata, variant: IslandVariant): THREE.Group {
  // Check if it's one of the 20 Avatar / Pandora Fantastical Major Worlds (MW-71 to MW-90)
  if (
    (island.id.startsWith('MW-') && parseInt(island.id.replace('MW-', ''), 10) >= 71) ||
    island.slug.startsWith('avatar-')
  ) {
    return buildAvatarMajorWorldScene(island, variant);
  }

  // Check if it's one of the 30 5.0 Major Worlds (MW-41 to MW-70)
  if (
    (island.id.startsWith('MW-') && parseInt(island.id.replace('MW-', ''), 10) >= 41) ||
    [
      'world-norse-realm-macro', 'world-celtic-myth-macro', 'world-mayan-astral-macro',
      'world-shinto-realm-macro', 'world-vedic-temple-macro', 'world-bioluminescent-chasm-macro',
      'world-crystal-geode-macro', 'world-stormchaser-tempest-macro', 'world-geothermal-caldera-macro',
      'world-sky-islands-aerodrome-macro', 'world-solarpunk-arcology-macro', 'world-abyssal-seastead-macro',
      'world-brutalist-citadel-macro', 'world-cyberpunk-megacity-macro', 'world-steppe-caravanserai-macro',
      'world-quantum-microcosm-macro', 'world-mariana-trench-macro', 'world-neural-network-macro',
      'world-cryogenic-superconductor-macro', 'world-particle-synchrotron-macro', 'world-cinematic-studio-macro',
      'world-haute-couture-macro', 'world-culinary-gastronomy-macro', 'world-symphonic-hall-macro',
      'world-kinetic-automata-macro', 'world-thermal-bathhouse-macro', 'world-antiquarian-library-macro',
      'world-alpine-mountaineering-macro', 'world-artisan-ceramic-macro', 'world-festival-lanterns-macro'
    ].includes(island.slug)
  ) {
    return build5MajorWorldScene(island, variant);
  }

  // Check if it's one of the 30 4.3 Major Worlds (MW-11 to MW-40)
  if (
    (island.id.startsWith('MW-') && parseInt(island.id.replace('MW-', ''), 10) >= 11) ||
    island.slug.endsWith('-macro')
  ) {
    return build43MajorWorldScene(island, variant);
  }

  const master = new THREE.Group();

  // 1. Procedural Rich Floating Base (Floating island with geological rock underside & clouds)
  const base = buildRichIslandTerrain(island, variant, 'plateau');
  master.add(base);

  const primary = island.palette[0]?.hex || '#4F46E5';
  const secondary = island.palette[1]?.hex || '#06B6D4';
  const accent = island.palette[2]?.hex || '#F59E0B';
  const ground = island.palette[3]?.hex || '#10B981';

  const content = new THREE.Group();

  switch (island.slug) {
    case 'world-sports-universe': {
      // Stadium Bowl with Track Oval
      const stadium = new THREE.Group();
      stadium.position.set(0, 0.7, 0);

      // Running track oval (orange-red)
      const track = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.08, 16), mat('#EA580C', { roughness: 0.85 }));
      track.scale.set(1.4, 1, 0.9);
      stadium.add(track);

      // Inner green turf
      const turf = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.1, 16), mat('#16A34A', { roughness: 0.8 }));
      turf.scale.set(1.4, 1, 0.9);
      turf.position.y = 0.02;
      stadium.add(turf);

      // Tiered stadium grandstands
      const grandstand = new THREE.Mesh(new THREE.CylinderGeometry(2.7, 2.3, 0.6, 16, 1, true), mat('#E2E8F0', { roughness: 0.7 }));
      grandstand.scale.set(1.4, 1, 0.9);
      grandstand.position.y = 0.35;
      stadium.add(grandstand);

      // Stadium floodlight towers (4 corners)
      const pylonMat = mat('#64748B', { metalness: 0.6 });
      const lampMat = mat('#FEF08A', { emissive: '#FDE047', roughness: 0.2 });
      [[-2.2, -1.3], [2.2, -1.3], [-2.2, 1.3], [2.2, 1.3]].forEach(([x, z]) => {
        const pylon = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 2.2, 6), pylonMat);
        pylon.position.set(x, 1.1, z);
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 0.15), lampMat);
        head.position.set(x, 2.2, z);
        stadium.add(pylon, head);
      });

      content.add(stadium);
      break;
    }

    case 'world-culinary-universe': {
      // Terraced international culinary district
      const village = new THREE.Group();
      village.position.set(0, 0.7, 0);

      // Italian Pizzeria with brick dome oven
      const pizzeria = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.1, 1.3), mat('#FEF3C7'));
      pizzeria.position.set(-1.1, 0.55, -0.6);
      const pizzaRoof = new THREE.Mesh(new THREE.ConeGeometry(1.1, 0.7, 4), mat('#DC2626'));
      pizzaRoof.rotation.y = Math.PI / 4;
      pizzaRoof.position.set(-1.1, 1.45, -0.6);
      const pizzaChimney = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.8, 6), mat('#78350F'));
      pizzaChimney.position.set(-0.7, 1.6, -0.9);
      village.add(pizzeria, pizzaRoof, pizzaChimney);

      // French Bistro with striped awning
      const bistro = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.3, 1.2), mat('#FFFFFF'));
      bistro.position.set(0.9, 0.65, -0.5);
      const awning = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 0.6), mat('#2563EB'));
      awning.position.set(0.9, 0.85, 0.2);
      awning.rotation.x = 0.2;
      village.add(bistro, awning);

      // Farmers Market Stalls
      [-0.8, 0, 0.8].forEach((x, i) => {
        const stall = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.5, 0.6), mat('#D97706'));
        stall.position.set(x, 0.25, 1.1);
        const stallRoof = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.08, 0.7), mat(i % 2 === 0 ? '#16A34A' : '#DC2626'));
        stallRoof.position.set(x, 0.6, 1.1);
        village.add(stall, stallRoof);
      });

      content.add(village);
      break;
    }

    case 'world-fashion-universe': {
      // Modernist glass runway pavilion
      const fashion = new THREE.Group();
      fashion.position.set(0, 0.7, 0);

      // Elevated illuminated catwalk runway
      const catwalk = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 3.2), mat('#FFFFFF', { metalness: 0.3, roughness: 0.3 }));
      catwalk.position.set(0, 0.2, 0);
      const glowEdgeL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 3.2), mat('#EC4899', { emissive: '#F472B6' }));
      glowEdgeL.position.set(-0.44, 0.2, 0);
      const glowEdgeR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 3.2), mat('#EC4899', { emissive: '#F472B6' }));
      glowEdgeR.position.set(0.44, 0.2, 0);
      fashion.add(catwalk, glowEdgeL, glowEdgeR);

      // Headliner Arch / Backdrop
      const arch = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.15, 8, 24, Math.PI), mat('#0F172A', { metalness: 0.8 }));
      arch.position.set(0, 0.2, -1.6);
      fashion.add(arch);

      // Atelier design studio tower
      const studio = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.4, 1.2), mat('#F1F5F9'));
      studio.position.set(1.5, 1.2, -0.6);
      const glassRibbon = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.6, 1.25), createGlassMat('#38BDF8', 0.6));
      glassRibbon.position.set(1.5, 1.4, -0.6);
      fashion.add(studio, glassRibbon);

      content.add(fashion);
      break;
    }

    case 'world-transportation-universe': {
      const trans = new THREE.Group();
      trans.position.set(0, 0.7, 0);

      // Runway strip with markings
      const runway = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.08, 1.0), mat('#334155'));
      runway.position.set(0, 0.04, 0.4);
      runway.rotation.y = -0.2;
      trans.add(runway);

      // Airport Control Tower with octagonal glass cab
      const towerBase = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 2.2, 8), mat('#F8FAFC'));
      towerBase.position.set(-1.2, 1.1, -1.0);
      const towerCab = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.45, 0.6, 8), createGlassMat('#38BDF8', 0.65));
      towerCab.position.set(-1.2, 2.4, -1.0);
      const towerRoof = new THREE.Mesh(new THREE.ConeGeometry(0.7, 0.35, 8), mat('#EF4444'));
      towerRoof.position.set(-1.2, 2.85, -1.0);
      trans.add(towerBase, towerCab, towerRoof);

      // Monorail track & train
      const railBeam = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.14, 0.2), mat('#CBD5E1', { metalness: 0.5 }));
      railBeam.position.set(0, 1.2, -0.2);
      const trainCar = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.4, 0.32), mat('#0284C7'));
      trainCar.position.set(0.4, 1.45, -0.2);
      trans.add(railBeam, trainCar);

      content.add(trans);
      break;
    }

    case 'world-architecture-universe': {
      const arch = new THREE.Group();
      arch.position.set(0, 0.7, 0);

      // Classical Greco-Roman temple with fluted columns
      const temple = new THREE.Group();
      temple.position.set(-1.0, 0, -0.4);
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.2, 1.2), mat('#F1F5F9'));
      temple.add(plinth);
      [[-0.6, -0.4], [0.6, -0.4], [-0.6, 0.4], [0.6, 0.4], [0, -0.4], [0, 0.4]].forEach(([cx, cz]) => {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.1, 8), mat('#E2E8F0'));
        col.position.set(cx, 0.65, cz);
        temple.add(col);
      });
      const pediment = new THREE.Mesh(new THREE.ConeGeometry(1.1, 0.5, 4), mat('#F8FAFC'));
      pediment.rotation.y = Math.PI / 4;
      pediment.scale.set(1.2, 1, 0.9);
      pediment.position.set(0, 1.45, 0);
      temple.add(pediment);
      arch.add(temple);

      // Modern twisted cantilever skyscraper
      const skyscraper = new THREE.Group();
      skyscraper.position.set(1.1, 0, -0.2);
      for (let i = 0; i < 6; i++) {
        const floor = new THREE.Mesh(new THREE.BoxGeometry(1.0 - i * 0.06, 0.35, 1.0 - i * 0.06), mat('#38BDF8', { metalness: 0.7, roughness: 0.2 }));
        floor.position.y = 0.2 + i * 0.4;
        floor.rotation.y = i * 0.15;
        skyscraper.add(floor);
      }
      arch.add(skyscraper);

      content.add(arch);
      break;
    }

    case 'world-entertainment-universe': {
      const ent = new THREE.Group();
      ent.position.set(0, 0.7, 0);

      // Colorful Ferris Wheel
      const wheelGroup = new THREE.Group();
      wheelGroup.position.set(-1.0, 1.6, -0.5);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.06, 8, 24), mat('#E11D48'));
      wheelGroup.add(rim);
      // Spokes
      for (let a = 0; a < 6; a++) {
        const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.6, 6), mat('#CBD5E1'));
        spoke.rotation.z = (a * Math.PI) / 6;
        wheelGroup.add(spoke);
      }
      // A-frame stand
      const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.8, 6), mat('#475569'));
      legL.position.set(-0.5, -0.8, 0);
      legL.rotation.z = 0.3;
      const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.8, 6), mat('#475569'));
      legR.position.set(0.5, -0.8, 0);
      legR.rotation.z = -0.3;
      wheelGroup.add(legL, legR);
      ent.add(wheelGroup);

      // Cinema Marquee Theater
      const theater = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 1.2), mat('#6B21A8'));
      theater.position.set(1.0, 0.6, 0.2);
      const marquee = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.35, 0.6), mat('#FBBF24', { emissive: '#F59E0B' }));
      marquee.position.set(1.0, 1.1, 0.8);
      ent.add(theater, marquee);

      content.add(ent);
      break;
    }

    case 'world-business-universe': {
      const biz = new THREE.Group();
      biz.position.set(0, 0.7, 0);

      // Financial District Skyscrapers Cluster
      const tower1 = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.8, 1.0), mat('#1E293B', { metalness: 0.6 }));
      tower1.position.set(-0.6, 1.4, -0.5);
      const tower2 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 3.4, 0.9), mat('#0284C7', { metalness: 0.7 }));
      tower2.position.set(0.5, 1.7, -0.6);
      const towerSpire = new THREE.Mesh(new THREE.ConeGeometry(0.08, 1.0, 6), mat('#E2E8F0', { metalness: 0.8 }));
      towerSpire.position.set(0.5, 3.9, -0.6);

      // Stock Exchange with classical portico & digital banner
      const exchange = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.0, 1.2), mat('#F8FAFC'));
      exchange.position.set(0, 0.5, 0.8);
      const tickerBanner = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.18, 0.05), mat('#22C55E', { emissive: '#16A34A' }));
      tickerBanner.position.set(0, 0.75, 1.41);
      biz.add(tower1, tower2, towerSpire, exchange, tickerBanner);

      content.add(biz);
      break;
    }

    case 'world-hobbies-universe': {
      const hob = new THREE.Group();
      hob.position.set(0, 0.7, 0);

      // Woodworking Workshop with timber siding & roof
      const workshop = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.1, 1.2), mat('#78350F'));
      workshop.position.set(-0.9, 0.55, -0.5);
      const workRoof = new THREE.Mesh(new THREE.ConeGeometry(1.1, 0.65, 4), mat('#92400E'));
      workRoof.rotation.y = Math.PI / 4;
      workRoof.position.set(-0.9, 1.4, -0.5);
      hob.add(workshop, workRoof);

      // Greenhouse Glasshouse with translucent panels
      const greenhouse = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.0, 1.3), createGlassMat('#86EFAC', 0.6));
      greenhouse.position.set(0.9, 0.5, -0.4);
      const ghRoof = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 1.3, 8, 1, false, 0, Math.PI), createGlassMat('#86EFAC', 0.65));
      ghRoof.position.set(0.9, 1.0, -0.4);
      ghRoof.rotation.z = Math.PI / 2;
      ghRoof.rotation.y = Math.PI / 2;
      hob.add(greenhouse, ghRoof);

      // Large Outdoor Painter Easel
      const easelLegs = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.4, 6), mat('#D97706'));
      easelLegs.position.set(0, 0.7, 0.8);
      const canvas = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.06), mat('#FFFFFF'));
      canvas.position.set(0, 0.85, 0.8);
      canvas.rotation.x = -0.15;
      hob.add(easelLegs, canvas);

      content.add(hob);
      break;
    }

    case 'world-agriculture-universe': {
      const agri = new THREE.Group();
      agri.position.set(0, 0.7, 0);

      // Classic Red Gambrel Barn
      const barn = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.1, 1.3), mat('#DC2626'));
      barn.position.set(-0.8, 0.55, -0.5);
      const barnRoof = new THREE.Mesh(new THREE.ConeGeometry(1.2, 0.7, 4), mat('#FEF2F2'));
      barnRoof.rotation.y = Math.PI / 4;
      barnRoof.position.set(-0.8, 1.45, -0.5);

      // Silver Silo
      const silo = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.8, 12), mat('#CBD5E1', { metalness: 0.7 }));
      silo.position.set(-1.8, 0.9, -0.5);
      const siloDome = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat('#94A3B8', { metalness: 0.8 }));
      siloDome.position.set(-1.8, 1.8, -0.5);
      agri.add(barn, barnRoof, silo, siloDome);

      // Traditional Windmill
      const millTower = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, 1.6, 8), mat('#F1F5F9'));
      millTower.position.set(1.1, 0.8, -0.6);
      const millCap = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.4, 8), mat('#78350F'));
      millCap.position.set(1.1, 1.8, -0.6);
      const blades = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.02), mat('#FEF3C7'));
      blades.position.set(1.1, 1.7, -0.25);
      agri.add(millTower, millCap, blades);

      // Furrowed Wheat Fields
      for (let r = 0; r < 4; r++) {
        const furrow = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 0.18), mat('#F59E0B'));
        furrow.position.set(0.2, 0.05, 0.5 + r * 0.28);
        agri.add(furrow);
      }

      content.add(agri);
      break;
    }

    case 'world-energy-universe': {
      const nrg = new THREE.Group();
      nrg.position.set(0, 0.7, 0);

      // Wind Turbines (3-blade tall turbine)
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.16, 2.8, 8), mat('#F8FAFC'));
      tower.position.set(-1.1, 1.4, -0.6);
      const nacelle = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.2, 0.5), mat('#E2E8F0'));
      nacelle.position.set(-1.1, 2.8, -0.6);
      const blade1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.5, 0.02), mat('#FFFFFF'));
      blade1.position.set(-1.1, 2.8, -0.35);
      nrg.add(tower, nacelle, blade1);

      // Blue Solar Photovoltaic Array (tilted banks)
      for (let i = 0; i < 3; i++) {
        const panel = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.04, 0.6), mat('#1E40AF', { metalness: 0.8, roughness: 0.2 }));
        panel.position.set(0.7, 0.2 + i * 0.12, -0.8 + i * 0.7);
        panel.rotation.x = 0.35;
        nrg.add(panel);
      }

      // Concrete Hydro Dam Wall with Water Channel
      const dam = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.9, 0.8), mat('#94A3B8'));
      dam.position.set(-0.2, 0.45, 1.0);
      const waterChannel = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 1.2), createWaterMat('#0284C7'));
      waterChannel.position.set(-0.2, 0.5, 1.0);
      nrg.add(dam, waterChannel);

      content.add(nrg);
      break;
    }

    default:
      content.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat(primary)));
      break;
  }

  master.add(content);
  return master;
}

// =========================================================================
// PART III: THEMATIC SUB-ISLANDS (SI-01 to SI-110)
// =========================================================================
export function buildExpansionSubIsland(island: IslandMetadata, variant: IslandVariant): THREE.Group {
  // Check if it's one of the 50 5.0 Sub-Islands (SI-61 to SI-110)
  if (
    (island.id.startsWith('SI-') && parseInt(island.id.replace('SI-', ''), 10) >= 61) ||
    island.slug.startsWith('subisland-coral-reef-') ||
    island.slug.startsWith('subisland-polar-research-') ||
    island.slug.startsWith('subisland-lighthouse-') ||
    island.slug.startsWith('subisland-pirate-cove-') ||
    island.slug.startsWith('subisland-hydrothermal-') ||
    island.slug.startsWith('subisland-floating-kelp-') ||
    island.slug.startsWith('subisland-mangrove-') ||
    island.slug.startsWith('subisland-pearl-diver-') ||
    island.slug.startsWith('subisland-sunken-atlantis-') ||
    island.slug.startsWith('subisland-floating-fish-') ||
    island.slug.startsWith('subisland-salt-flats-') ||
    island.slug.startsWith('subisland-redwood-giant-') ||
    island.slug.startsWith('subisland-sandstone-canyon-') ||
    island.slug.startsWith('subisland-steaming-geothermal-') ||
    island.slug.startsWith('subisland-basalt-giants-') ||
    island.slug.startsWith('subisland-bamboo-forest-') ||
    island.slug.startsWith('subisland-alpine-meadow-') ||
    island.slug.startsWith('subisland-petrified-fossil-') ||
    island.slug.startsWith('subisland-oasis-date-') ||
    island.slug.startsWith('subisland-aurora-borealis-') ||
    island.slug.startsWith('subisland-artisan-blacksmith-') ||
    island.slug.startsWith('subisland-windmill-grain-') ||
    island.slug.startsWith('subisland-steam-locomotive-') ||
    island.slug.startsWith('subisland-alpine-clockmaker-') ||
    island.slug.startsWith('subisland-vineyard-wine-') ||
    island.slug.startsWith('subisland-rooftop-hydroponic-') ||
    island.slug.startsWith('subisland-canal-lock-') ||
    island.slug.startsWith('subisland-mountain-cable-') ||
    island.slug.startsWith('subisland-printing-press-') ||
    island.slug.startsWith('subisland-radio-transmission-') ||
    island.slug.startsWith('subisland-lunar-base-') ||
    island.slug.startsWith('subisland-mars-terraforming-') ||
    island.slug.startsWith('subisland-solar-concentrator-') ||
    island.slug.startsWith('subisland-particle-accelerator-') ||
    island.slug.startsWith('subisland-supercomputing-') ||
    island.slug.startsWith('subisland-deep-space-') ||
    island.slug.startsWith('subisland-drone-delivery-') ||
    island.slug.startsWith('subisland-fusion-energy-') ||
    island.slug.startsWith('subisland-cryogenic-seed-') ||
    island.slug.startsWith('subisland-bionic-cybernetics-') ||
    island.slug.startsWith('subisland-floating-sky-') ||
    island.slug.startsWith('subisland-glowing-mushroom-') ||
    island.slug.startsWith('subisland-dragon-perch-') ||
    island.slug.startsWith('subisland-stone-golem-') ||
    island.slug.startsWith('subisland-crystal-cavern-') ||
    island.slug.startsWith('subisland-wizard-orrery-') ||
    island.slug.startsWith('subisland-sunken-treasure-') ||
    island.slug.startsWith('subisland-steampunk-airship-') ||
    island.slug.startsWith('subisland-bonsai-zen-') ||
    island.slug.startsWith('subisland-perpetual-rainbow-')
  ) {
    return build5SubIslandScene(island, variant);
  }

  // Check if it's one of the 30 4.3 Sub-Islands (SI-31 to SI-60)
  if (
    (island.id.startsWith('SI-') && parseInt(island.id.replace('SI-', ''), 10) >= 31) ||
    [
      'subisland-medieval-kingdom', 'subisland-ancient-egypt', 'subisland-ancient-greece',
      'subisland-ancient-rome', 'subisland-imperial-china', 'subisland-mesoamerican-civilization',
      'subisland-volcano-island', 'subisland-desert-oasis', 'subisland-glacier-world',
      'subisland-rainforest-world', 'subisland-underground-caves', 'subisland-savanna-world',
      'subisland-healthcare-island', 'subisland-government-law', 'subisland-finance-island',
      'subisland-public-safety', 'subisland-festivals-traditions', 'subisland-archaeology-island',
      'subisland-genetics-island', 'subisland-chemistry-island', 'subisland-physics-island',
      'subisland-weather-climate', 'subisland-prehistoric-life', 'subisland-geometry-world',
      'subisland-fantasy-kingdom', 'subisland-cyber-city', 'subisland-fairy-tale-village',
      'subisland-mystery-labyrinth', 'subisland-mindfulness-retreat', 'subisland-time-travel-island'
    ].includes(island.slug)
  ) {
    return build43SubIslandScene(island, variant);
  }

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

  // Distinguish the 30 sub-islands with their unique landmarks
  if (island.slug === 'subisland-basketball') {
    // Basketball court & hoop
    const court = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.06, 1.4), mat('#EA580C'));
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 6), mat('#334155'));
    pole.position.set(0.85, 0.6, 0);
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.4, 0.6), mat('#FFFFFF'));
    board.position.set(0.82, 1.1, 0);
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.02, 6, 12), mat('#DC2626'));
    hoop.rotation.x = Math.PI / 2;
    hoop.position.set(0.68, 0.98, 0);
    content.add(court, pole, board, hoop);
  } else if (island.slug === 'subisland-soccer') {
    // Soccer turf & goal
    const turf = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.06, 1.5), mat('#16A34A'));
    const goalNet = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.5, 0.9), mat('#FFFFFF', { wireframe: true }));
    goalNet.position.set(0.9, 0.25, 0);
    content.add(turf, goalNet);
  } else if (island.slug === 'subisland-baseball') {
    // Baseball diamond
    const diamond = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.06, 1.8), mat('#B45309'));
    diamond.rotation.y = Math.PI / 4;
    const homePlate = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.2), mat('#FFFFFF'));
    content.add(diamond, homePlate);
  } else if (island.slug === 'subisland-tennis') {
    // Tennis clay court & net
    const court = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.06, 1.3), mat('#C2410C'));
    const net = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.25, 1.3), mat('#FFFFFF', { wireframe: true }));
    net.position.y = 0.15;
    content.add(court, net);
  } else if (island.slug === 'subisland-racing') {
    // Checkered race curve
    const track = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.35, 6, 16, Math.PI), mat('#1E293B'));
    track.rotation.x = Math.PI / 2;
    const gantry = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 1.4), mat('#DC2626'));
    gantry.position.set(0, 0.4, 1.0);
    content.add(track, gantry);
  } else if (island.slug === 'subisland-winter-sports') {
    // Snow peak & A-frame ski chalet
    const snowSlope = new THREE.Mesh(new THREE.ConeGeometry(1.6, 1.4, 6), mat('#F8FAFC'));
    snowSlope.position.set(-0.3, 0.7, -0.2);
    const chalet = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.8, 4), mat('#78350F'));
    chalet.rotation.y = Math.PI / 4;
    chalet.position.set(0.6, 0.4, 0.4);
    content.add(snowSlope, chalet);
  } else if (island.slug === 'subisland-bakery') {
    // Brick oven bakery
    const shop = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.9, 1.1), mat('#FEF3C7'));
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.0, 0.6, 4), mat('#DC2626'));
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 0.75;
    const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.6, 6), mat('#78350F'));
    chimney.position.set(0.4, 0.9, -0.3);
    content.add(shop, roof, chimney);
  } else if (island.slug === 'subisland-coffee') {
    // Coffee roaster cafe
    const cafe = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.0, 1.2), mat('#451A03'));
    const cupSign = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.3, 8), mat('#FFFFFF'));
    cupSign.position.set(0, 0.8, 0.7);
    content.add(cafe, cupSign);
  } else if (island.slug === 'subisland-dessert') {
    // Layered pastel cake / macaron tower
    [0, 1, 2].forEach((lvl) => {
      const cakeTier = new THREE.Mesh(new THREE.CylinderGeometry(0.8 - lvl * 0.22, 0.8 - lvl * 0.22, 0.35, 12), mat(lvl === 0 ? '#F472B6' : lvl === 1 ? '#FDE047' : '#67E8F9'));
      cakeTier.position.y = 0.18 + lvl * 0.35;
      content.add(cakeTier);
    });
  } else if (island.slug === 'subisland-aviation') {
    // Airport strip & hangar
    const hangar = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 1.4, 8, 1, false, 0, Math.PI), mat('#64748B', { metalness: 0.5 }));
    hangar.position.set(-0.4, 0.35, -0.2);
    hangar.rotation.z = Math.PI / 2;
    hangar.rotation.y = Math.PI / 2;
    const strip = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.05, 0.6), mat('#1E293B'));
    strip.position.set(0, 0.03, 0.5);
    content.add(hangar, strip);
  } else if (island.slug === 'subisland-spacecraft') {
    // Rocket launch gantry & rocket
    const tower = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.2, 0.3), mat('#DC2626', { wireframe: true }));
    tower.position.set(-0.4, 1.1, 0);
    const rocket = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 1.6, 8), mat('#F8FAFC'));
    rocket.position.set(0.1, 0.8, 0);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.45, 8), mat('#DC2626'));
    nose.position.set(0.1, 1.8, 0);
    content.add(tower, rocket, nose);
  } else if (island.slug === 'subisland-robotics') {
    // Robotic Arm Cell
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 0.4, 8), mat('#334155'));
    const arm1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.8, 6), mat('#F59E0B'));
    arm1.position.set(0, 0.6, 0);
    arm1.rotation.z = 0.35;
    const arm2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.7, 6), mat('#F59E0B'));
    arm2.position.set(0.3, 1.1, 0);
    arm2.rotation.z = -0.5;
    content.add(pedestal, arm1, arm2);
  } else {
    // Thematic pavilion with palette accent
    const pav = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.0, 1.4), mat(primary));
    const pavRoof = new THREE.Mesh(new THREE.ConeGeometry(1.1, 0.6, 4), mat(secondary));
    pavRoof.rotation.y = Math.PI / 4;
    pavRoof.position.y = 0.8;
    content.add(pav, pavRoof);
  }

  master.add(content);
  return master;
}

// =========================================================================
// PART IV: 120 MODULAR BUILDINGS (BD-01 to BD-120)
// Independent 3D Architecture, NO attached island terrain!
// =========================================================================
export function buildExpansionBuilding(island: IslandMetadata, variant: IslandVariant): THREE.Group {
  if (island.collection === 'buildings_museums' || island.slug.startsWith('building-museum-') || island.id.startsWith('BD-1')) {
    return buildMuseumBuildingScene(island, variant);
  }
  return buildDistinctiveModularBuilding(island, variant);
}

// =========================================================================
// PART V: 100 STANDALONE LOW-POLY OBJECTS (OB-001 to OB-100)
// Pure Standalone Objects: ZERO pedestals, ZERO circular platforms!
// Sits directly on ground contact plane.
// =========================================================================
export function buildExpansionObject(island: IslandMetadata, variant: IslandVariant): THREE.Group {
  if (
    island.slug.startsWith('object-museum-') ||
    (island.id.startsWith('OB-') && parseInt(island.id.replace('OB-', ''), 10) >= 101)
  ) {
    return buildMuseumObjectScene(island, variant);
  }

  const g = new THREE.Group();

  const primary = island.palette[0]?.hex || '#4F46E5';
  const secondary = island.palette[1]?.hex || '#06B6D4';
  const accent = island.palette[2]?.hex || '#F59E0B';

  const slug = island.slug;

  // Pure standalone geometry (no platform, no base, no pedestal)
  if (slug === 'object-basketball-hoop') {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.4, 8), mat('#334155'));
    pole.position.set(0.7, 1.2, 0);
    const backboard = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.9, 1.3), mat('#FFFFFF'));
    backboard.position.set(0.65, 2.0, 0);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.03, 8, 16), mat('#EA580C'));
    rim.rotation.x = Math.PI / 2;
    rim.position.set(0.35, 1.75, 0);
    g.add(pole, backboard, rim);
  } else if (slug === 'object-baseball-bat') {
    const bat = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.05, 2.2, 10), mat('#D97706'));
    bat.rotation.z = 0.4;
    bat.position.set(0, 0.9, 0);
    g.add(bat);
  } else if (slug === 'object-tennis-ball') {
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.7, 16, 12), mat('#CCFF00', { roughness: 0.9 }));
    ball.position.y = 0.7;
    g.add(ball);
  } else if (slug === 'object-croissant') {
    const crescent = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.35, 8, 16, Math.PI * 0.8), mat('#D97706', { roughness: 0.7 }));
    crescent.position.y = 0.5;
    g.add(crescent);
  } else if (slug === 'object-donut') {
    const dough = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.35, 12, 24), mat('#D97706'));
    dough.position.y = 0.5;
    const icing = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.36, 12, 24, Math.PI), mat('#F43F5E'));
    icing.position.y = 0.55;
    g.add(dough, icing);
  } else if (slug === 'object-chocolate-bar') {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.25, 0.9), mat('#451A03'));
    bar.position.y = 0.15;
    const foil = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.26, 0.92), mat('#E2E8F0', { metalness: 0.9 }));
    foil.position.set(0.4, 0.15, 0);
    g.add(bar, foil);
  } else if (slug === 'object-sneaker') {
    const sole = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.25, 0.8), mat('#FFFFFF'));
    sole.position.y = 0.12;
    const upper = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.6, 0.75), mat(primary));
    upper.position.set(-0.1, 0.5, 0);
    g.add(sole, upper);
  } else if (slug === 'object-bicycle') {
    const frameMat = mat(primary);
    const wheelMat = mat('#1E293B');
    const wheelF = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.06, 8, 16), wheelMat);
    wheelF.position.set(0.9, 0.5, 0);
    const wheelR = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.06, 8, 16), wheelMat);
    wheelR.position.set(-0.9, 0.5, 0);
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.8, 6), frameMat);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, 0.8, 0);
    g.add(wheelF, wheelR, bar);
  } else if (slug === 'object-microchip') {
    const chip = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.18, 1.4), mat('#0F172A', { roughness: 0.3 }));
    chip.position.y = 0.1;
    // Pins
    for (let p = -0.5; p <= 0.5; p += 0.25) {
      const pinL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.1), mat('#F59E0B', { metalness: 0.9 }));
      pinL.position.set(-0.8, 0.1, p);
      const pinR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.1), mat('#F59E0B', { metalness: 0.9 }));
      pinR.position.set(0.8, 0.1, p);
      g.add(pinL, pinR);
    }
    g.add(chip);
  } else if (slug === 'object-double-helix-model') {
    for (let i = 0; i < 10; i++) {
      const y = 0.2 + i * 0.18;
      const angle = i * 0.6;
      const r = 0.45;
      const ballA = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), mat('#3B82F6'));
      ballA.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
      const ballB = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), mat('#EF4444'));
      ballB.position.set(-Math.cos(angle) * r, y, -Math.sin(angle) * r);
      const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, r * 2, 6), mat('#E2E8F0'));
      rung.position.set(0, y, 0);
      rung.rotation.z = Math.PI / 2;
      rung.rotation.y = angle;
      g.add(ballA, ballB, rung);
    }
  } else {
    // Pure geometric low-poly standalone model rendered with themed primary & accent facets
    const mainMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8, 0), mat(primary, { roughness: 0.5 }));
    mainMesh.position.y = 0.8;
    const accentBand = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.08, 6, 16), mat(accent, { metalness: 0.6 }));
    accentBand.position.y = 0.8;
    accentBand.rotation.x = 0.3;
    g.add(mainMesh, accentBand);
  }

  return g;
}
