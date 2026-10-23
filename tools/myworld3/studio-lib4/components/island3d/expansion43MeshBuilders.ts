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

// =========================================================================
// 30 NEW MAJOR WORLD ISLANDS (MW-11 to MW-40)
// =========================================================================

export function build43MajorWorldScene(island: IslandMetadata, variant: IslandVariant): THREE.Group {
  const master = new THREE.Group();

  // Floating terrain base with geological rock underbelly & clouds
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
    // A. Civilization & Heritage (MW-11 to MW-15)
    // ---------------------------------------------------------------------
    case 'world-ancient-civilizations-macro': {
      // 1. Egyptian Pyramid
      const pyr = new THREE.Mesh(new THREE.ConeGeometry(1.6, 1.8, 4), mat('#D4A373'));
      pyr.rotation.y = Math.PI / 4;
      pyr.position.set(-1.6, 0.9, -1.0);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.5, 4), mat('#F59E0B', { metalness: 0.6 }));
      cap.rotation.y = Math.PI / 4;
      cap.position.set(-1.6, 1.55, -1.0);
      content.add(pyr, cap);

      // 2. Greek Temple
      const greek = new THREE.Group();
      greek.position.set(1.4, 0, -1.1);
      const baseSlab = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.15, 1.2), mat('#F8FAFC'));
      greek.add(baseSlab);
      for (let x = -0.7; x <= 0.7; x += 0.45) {
        for (let z = -0.4; z <= 0.4; z += 0.8) {
          const col = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.9, 6), mat('#FFFFFF'));
          col.position.set(x, 0.5, z);
          greek.add(col);
        }
      }
      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.2, 0.45, 4), mat('#F8FAFC'));
      roof.scale.set(1.6, 1, 1);
      roof.rotation.y = Math.PI / 4;
      roof.position.y = 1.1;
      greek.add(roof);
      content.add(greek);

      // 3. Chinese Vermilion Pavilion
      const pag = new THREE.Group();
      pag.position.set(-1.2, 0, 1.1);
      const pPost = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.8, 1.1), mat('#DC2626'));
      pPost.position.y = 0.4;
      const pRoof1 = new THREE.Mesh(new THREE.ConeGeometry(1.3, 0.45, 4), mat('#F59E0B'));
      pRoof1.rotation.y = Math.PI / 4;
      pRoof1.position.y = 0.9;
      const pUpper = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 0.7), mat('#DC2626'));
      pUpper.position.y = 1.3;
      const pRoof2 = new THREE.Mesh(new THREE.ConeGeometry(0.9, 0.4, 4), mat('#F59E0B'));
      pRoof2.rotation.y = Math.PI / 4;
      pRoof2.position.y = 1.7;
      pag.add(pPost, pRoof1, pUpper, pRoof2);
      content.add(pag);

      // 4. Mesoamerican Stepped Pyramid
      const meso = new THREE.Group();
      meso.position.set(1.2, 0, 1.0);
      for (let s = 0; s < 3; s++) {
        const step = new THREE.Mesh(new THREE.BoxGeometry(1.6 - s * 0.4, 0.35, 1.6 - s * 0.4), mat('#78716C'));
        step.position.y = 0.18 + s * 0.35;
        meso.add(step);
      }
      const shrine = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.35, 0.45), mat('#B45309'));
      shrine.position.y = 1.25;
      meso.add(shrine);
      content.add(meso);
      break;
    }

    case 'world-world-history-macro': {
      // Prehistory Megaliths
      const stone1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.9, 0.2), mat('#64748B'));
      stone1.position.set(-1.8, 0.45, -1.0);
      const stone2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.9, 0.2), mat('#64748B'));
      stone2.position.set(-1.3, 0.45, -1.0);
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.18, 0.25), mat('#64748B'));
      lintel.position.set(-1.55, 0.95, -1.0);
      content.add(stone1, stone2, lintel);

      // Medieval Castle Keep
      const keep = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 1.2), mat('#475569'));
      keep.position.set(-0.8, 0.7, 0.4);
      const turret = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.6, 4), mat('#991B1B'));
      turret.rotation.y = Math.PI / 4;
      turret.position.set(-0.8, 1.7, 0.4);
      content.add(keep, turret);

      // Industrial Factory Chimneys
      const factory = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.8, 1.1), mat('#B45309'));
      factory.position.set(0.9, 0.4, -0.8);
      const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.6, 8), mat('#78350F'));
      chimney.position.set(1.2, 1.2, -0.8);
      content.add(factory, chimney);

      // Modern Glass Apex Tower
      const apex = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.6, 0.9), mat('#0284C7', { transparent: true, opacity: 0.85 }));
      apex.position.set(1.2, 1.3, 0.8);
      const spire = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.8, 4), mat('#F8FAFC'));
      spire.position.set(1.2, 2.9, 0.8);
      content.add(apex, spire);
      break;
    }

    case 'world-world-heritage-macro': {
      // Taj Mahal Dome & Minarets
      const taj = new THREE.Group();
      taj.position.set(0, 0, -0.6);
      const hall = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.1, 1.6), mat('#FFFFFF'));
      hall.position.y = 0.55;
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.65, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat('#FFFFFF'));
      dome.position.y = 1.1;
      const finial = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 6), mat('#F59E0B'));
      finial.position.y = 1.75;
      taj.add(hall, dome, finial);
      [[-1.1, -1.1], [1.1, -1.1], [-1.1, 1.1], [1.1, 1.1]].forEach(([mx, mz]) => {
        const minaret = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.8, 6), mat('#FFFFFF'));
        minaret.position.set(mx, 0.9, mz);
        taj.add(minaret);
      });
      content.add(taj);

      // Roman Arched Viaduct / Stone Aqueduct
      const viaduct = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.6, 0.4), mat('#D4A373'));
      viaduct.position.set(0, 0.3, 1.2);
      content.add(viaduct);
      break;
    }

    case 'world-traditions-customs-macro': {
      // Japanese Red Torii Gate
      const torii = new THREE.Group();
      torii.position.set(-1.4, 0, 0);
      const tCol1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 1.4, 6), mat('#DC2626'));
      tCol1.position.set(0, 0.7, -0.4);
      const tCol2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 1.4, 6), mat('#DC2626'));
      tCol2.position.set(0, 0.7, 0.4);
      const tBeam = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 1.4), mat('#DC2626'));
      tBeam.position.set(0, 1.35, 0);
      torii.add(tCol1, tCol2, tBeam);
      content.add(torii);

      // Traditional Market Square & Festival Lantern Stage
      const stage = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.3, 1.6), mat('#78350F'));
      stage.position.set(0.6, 0.15, -0.4);
      const pavilion = new THREE.Mesh(new THREE.ConeGeometry(1.2, 0.6, 4), mat('#DC2626'));
      pavilion.rotation.y = Math.PI / 4;
      pavilion.position.set(0.6, 1.1, -0.4);
      content.add(stage, pavilion);

      // Folk Drum & Banners
      const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.6, 12), mat('#B45309'));
      drum.position.set(0.8, 0.5, 1.0);
      drum.rotation.z = Math.PI / 2;
      content.add(drum);
      break;
    }

    case 'world-archaeology-macro': {
      // Excavation Dig Pit (Grid Trench)
      const trench = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.3, 1.8), mat('#B45309'));
      trench.position.set(-0.6, 0.15, -0.4);
      content.add(trench);

      // Unearthed Stone Colonnade
      for (let i = 0; i < 3; i++) {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.8 + i * 0.2, 6), mat('#E2E8F0'));
        pillar.position.set(-1.2 + i * 0.5, 0.4 + i * 0.1, -0.4);
        content.add(pillar);
      }

      // Expedition Canvas Tents
      const tent = new THREE.Mesh(new THREE.ConeGeometry(0.7, 0.7, 4), mat('#FEF3C7'));
      tent.rotation.y = Math.PI / 4;
      tent.position.set(1.2, 0.35, 0.8);
      content.add(tent);
      break;
    }

    // ---------------------------------------------------------------------
    // B. Earth & Environment (MW-16 to MW-20)
    // ---------------------------------------------------------------------
    case 'world-biomes-macro': {
      // Rainforest Tree Canopy
      const jTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, 1.2, 6), mat('#78350F'));
      jTrunk.position.set(-1.4, 0.6, -1.0);
      const jFoliage = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8), mat('#166534'));
      jFoliage.position.set(-1.4, 1.6, -1.0);
      content.add(jTrunk, jFoliage);

      // Desert Dune Ridge
      const dune = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 1.4, 0.6, 6), mat('#EAB308'));
      dune.position.set(1.2, 0.3, -1.1);
      content.add(dune);

      // Tundra Snow Peak
      const peak = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.5, 5), mat('#475569'));
      peak.position.set(-1.2, 0.75, 1.0);
      const snowCap = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.6, 5), mat('#FFFFFF'));
      snowCap.position.set(-1.2, 1.2, 1.0);
      content.add(peak, snowCap);

      // Savanna Acacia
      const aTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 1.1, 6), mat('#78350F'));
      aTrunk.position.set(1.1, 0.55, 1.0);
      const aCanopy = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.8, 0.2, 8), mat('#65A30D'));
      aCanopy.position.set(1.1, 1.2, 1.0);
      content.add(aTrunk, aCanopy);
      break;
    }

    case 'world-geological-macro': {
      // Smoking Volcano Caldera
      const vol = new THREE.Mesh(new THREE.ConeGeometry(1.6, 1.6, 8, 1, true), mat('#334155'));
      vol.position.set(-0.8, 0.8, -0.5);
      const magma = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.1, 8), mat('#EA580C', { emissive: '#DC2626' }));
      magma.position.set(-0.8, 1.45, -0.5);
      content.add(vol, magma);

      // Blue Glacier Icefall
      const ice = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 1.2), mat('#0284C7'));
      ice.position.set(1.1, 0.35, -0.6);
      content.add(ice);

      // Red Basalt Canyon Walls
      const canyon = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.9, 0.5), mat('#9A3412'));
      canyon.position.set(0.2, 0.45, 1.1);
      content.add(canyon);
      break;
    }

    case 'world-climate-weather-macro': {
      // Thundercloud with Lightning Arc
      const cloud = createCloudCluster([ -0.8, 2.2, -0.4 ], 1.2);
      const lightning = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 4), mat('#FACC15', { emissive: '#FDE047' }));
      lightning.position.set(-0.8, 1.2, -0.4);
      lightning.rotation.z = 0.25;
      content.add(cloud, lightning);

      // Sunny Rainbow Arch
      const rainbow = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.08, 6, 16, Math.PI), mat('#EC4899'));
      rainbow.position.set(0.8, 1.0, 0);
      content.add(rainbow);

      // Weather Radar Station Dome
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.6, 6), mat('#64748B'));
      mast.position.set(1.2, 0.8, 1.0);
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 8), mat('#F8FAFC'));
      dome.position.set(1.2, 1.8, 1.0);
      content.add(mast, dome);
      break;
    }

    case 'world-sustainability-macro': {
      // Wind Turbines
      const tMast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 2.4, 6), mat('#F8FAFC'));
      tMast.position.set(-1.2, 1.2, -0.8);
      const rotor = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.6, 0.02), mat('#FFFFFF'));
      rotor.position.set(-1.2, 2.4, -0.6);
      content.add(tMast, rotor);

      // Solar PV Panels
      for (let i = 0; i < 3; i++) {
        const panel = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.04, 0.6), mat('#1D4ED8', { metalness: 0.8 }));
        panel.position.set(0.8, 0.25 + i * 0.15, -1.0 + i * 0.7);
        panel.rotation.x = 0.35;
        content.add(panel);
      }

      // Green Roof Eco-Building
      const bldg = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.8, 1.2), mat('#FFFFFF'));
      bldg.position.set(-0.6, 0.4, 0.9);
      const greenRoof = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.1, 1.3), mat('#16A34A'));
      greenRoof.position.set(-0.6, 0.85, 0.9);
      content.add(bldg, greenRoof);
      break;
    }

    case 'world-water-macro': {
      // Curved Concrete Dam
      const dam = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.1, 0.6), mat('#94A3B8'));
      dam.position.set(0, 0.55, 0);
      content.add(dam);

      // Reservoir & Downstream River
      const res = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 1.2), createWaterMat('#0284C7'));
      res.position.set(0, 0.9, -0.8);
      const river = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 1.4), createWaterMat('#0284C7'));
      river.position.set(0, 0.15, 0.9);
      content.add(res, river);
      break;
    }

    // ---------------------------------------------------------------------
    // C. Society & Public Life (MW-21 to MW-25)
    // ---------------------------------------------------------------------
    case 'world-government-law-macro': {
      // Domed Parliament Hall
      const hall = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.9, 1.3), mat('#E2E8F0'));
      hall.position.set(0, 0.45, -0.6);
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.65, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat('#0D9488'));
      dome.position.set(0, 0.9, -0.6);
      content.add(hall, dome);

      // Neoclassical Court Portico
      const court = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.8, 1.1), mat('#F8FAFC'));
      court.position.set(-1.1, 0.4, 0.8);
      const pediment = new THREE.Mesh(new THREE.ConeGeometry(0.9, 0.4, 4), mat('#E2E8F0'));
      pediment.rotation.y = Math.PI / 4;
      pediment.position.set(-1.1, 1.0, 0.8);
      content.add(court, pediment);

      // Civic Obelisk Monolith
      const obelisk = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.14, 2.2, 4), mat('#D97706'));
      obelisk.rotation.y = Math.PI / 4;
      obelisk.position.set(1.2, 1.1, 0.8);
      content.add(obelisk);
      break;
    }

    case 'world-finance-economy-macro': {
      // Classical Bank with Columns
      const bank = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.9, 1.2), mat('#E2E8F0'));
      bank.position.set(-1.0, 0.45, -0.6);
      content.add(bank);

      // Glass Stock Exchange Cube with Green Ticker
      const ex = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.8, 1.4), mat('#0284C7', { transparent: true, opacity: 0.85 }));
      ex.position.set(1.0, 0.9, -0.4);
      const ticker = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.15, 1.45), mat('#16A34A', { emissive: '#22C55E' }));
      ticker.position.set(1.0, 0.6, -0.4);
      content.add(ex, ticker);
      break;
    }

    case 'world-healthcare-macro': {
      // Modern Hospital Tower with Helipad
      const hosp = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.6, 1.4), mat('#F8FAFC'));
      hosp.position.set(0, 0.8, -0.4);
      const helipad = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.08, 16), mat('#DC2626'));
      helipad.position.set(0, 1.65, -0.4);
      content.add(hosp, helipad);

      // Medical Research Pod
      const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.8, 8), mat('#0284C7'));
      pod.position.set(-1.2, 0.4, 0.8);
      content.add(pod);
      break;
    }

    case 'world-education-macro': {
      // University Clock Tower
      const tower = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.6, 0.8), mat('#B45309'));
      tower.position.set(-0.8, 1.3, -0.6);
      const belfry = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.8, 4), mat('#78350F'));
      belfry.rotation.y = Math.PI / 4;
      belfry.position.set(-0.8, 2.9, -0.6);
      content.add(tower, belfry);

      // Quadrangle Hall
      const quad = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.9, 1.2), mat('#FEF3C7'));
      quad.position.set(0.8, 0.45, 0.4);
      content.add(quad);
      break;
    }

    case 'world-urban-macro': {
      // High-Rise Skyscraper Cluster
      const s1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.4, 0.8), mat('#334155'));
      s1.position.set(-0.8, 1.2, -0.6);
      const s2 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 3.0, 0.9), mat('#0284C7'));
      s2.position.set(0.4, 1.5, -0.6);
      const s3 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.8, 0.7), mat('#475569'));
      s3.position.set(1.2, 0.9, 0.4);
      content.add(s1, s2, s3);

      // Elevated Monorail Track
      const track = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 0.25), mat('#E2E8F0'));
      track.position.set(0, 0.6, 0.9);
      content.add(track);
      break;
    }

    // ---------------------------------------------------------------------
    // D. Science & Universe (MW-26 to MW-30)
    // ---------------------------------------------------------------------
    case 'world-astronomy-space-macro': {
      // Great Optical Observatory Dome
      const obsBase = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.2, 0.9, 12), mat('#F8FAFC'));
      obsBase.position.set(-0.8, 0.45, -0.5);
      const obsDome = new THREE.Mesh(new THREE.SphereGeometry(1.05, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat('#CBD5E1', { metalness: 0.7 }));
      obsDome.position.set(-0.8, 0.9, -0.5);
      content.add(obsBase, obsDome);

      // Rocket Launch Gantry & Rocket
      const gantry = new THREE.Mesh(new THREE.BoxGeometry(0.35, 2.8, 0.35), mat('#DC2626', { wireframe: true }));
      gantry.position.set(1.2, 1.4, 0.5);
      const rocket = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 2.0, 8), mat('#FFFFFF'));
      rocket.position.set(0.8, 1.0, 0.5);
      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.6, 8), mat('#DC2626'));
      nose.position.set(0.8, 2.2, 0.5);
      content.add(gantry, rocket, nose);
      break;
    }

    case 'world-life-sciences-macro': {
      // Giant Glowing DNA Helix Spire
      for (let i = 0; i < 8; i++) {
        const y = 0.3 + i * 0.32;
        const angle = i * 0.65;
        const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 6), mat(i % 2 === 0 ? '#0D9488' : '#A855F7'));
        rung.position.set(-0.8, y, -0.4);
        rung.rotation.y = angle;
        rung.rotation.z = Math.PI / 2;
        content.add(rung);
      }

      // Geodesic Biosphere Dome
      const bioDome = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2, 1), createGlassMat('#10B981', 0.6));
      bioDome.position.set(1.0, 0.8, 0.4);
      content.add(bioDome);
      break;
    }

    case 'world-chemistry-materials-macro': {
      // C60 Fullerene Buckyball Cluster
      const bucky = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9, 1), mat('#2563EB', { wireframe: true }));
      bucky.position.set(-0.9, 1.2, -0.4);
      content.add(bucky);

      // Glass Distillation Towers
      for (let t = 0; t < 3; t++) {
        const dTower = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.4 + t * 0.4, 8), createGlassMat(t === 0 ? '#DC2626' : t === 1 ? '#FACC15' : '#0284C7', 0.7));
        dTower.position.set(0.6 + t * 0.45, 0.7 + t * 0.2, 0.5);
        content.add(dTower);
      }
      break;
    }

    case 'world-physics-macro': {
      // Circular Particle Accelerator Ring
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.12, 8, 24), mat('#0284C7', { metalness: 0.8 }));
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, 0.4, 0);
      content.add(ring);

      // Newton's Cradle
      const frame = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.0, 0.4), mat('#64748B', { wireframe: true }));
      frame.position.set(0, 1.1, 0);
      content.add(frame);
      break;
    }

    case 'world-mathematics-macro': {
      // Floating Polyhedra Cluster
      const icosa = new THREE.Mesh(new THREE.IcosahedronGeometry(0.7, 0), mat('#6366F1'));
      icosa.position.set(-1.0, 1.3, -0.6);
      const dodeca = new THREE.Mesh(new THREE.DodecahedronGeometry(0.6, 0), mat('#EC4899'));
      dodeca.position.set(1.1, 1.2, -0.5);
      content.add(icosa, dodeca);

      // Fibonacci Golden Spiral Tower
      for (let s = 0; s < 5; s++) {
        const step = new THREE.Mesh(new THREE.BoxGeometry(0.4 + s * 0.2, 0.2, 0.4 + s * 0.2), mat('#F59E0B'));
        step.position.set(0, 0.1 + s * 0.25, 0.6);
        step.rotation.y = s * 0.4;
        content.add(step);
      }
      break;
    }

    // ---------------------------------------------------------------------
    // E. Personal Experience & Imagination (MW-31 to MW-35)
    // ---------------------------------------------------------------------
    case 'world-childhood-macro': {
      // Whimsical Treehouse
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.4, 1.6, 6), mat('#78350F'));
      trunk.position.set(-1.0, 0.8, -0.5);
      const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(1.1), mat('#16A34A'));
      foliage.position.set(-1.0, 2.0, -0.5);
      const shack = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.8), mat('#F59E0B'));
      shack.position.set(-1.0, 1.6, -0.5);
      content.add(trunk, foliage, shack);

      // Carousel with Striped Canopy
      const car = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.2, 12), mat('#F8FAFC'));
      car.position.set(1.0, 0.2, 0.4);
      const top = new THREE.Mesh(new THREE.ConeGeometry(1.2, 0.6, 12), mat('#E11D48'));
      top.position.set(1.0, 1.2, 0.4);
      content.add(car, top);
      break;
    }

    case 'world-relationships-macro': {
      // Arching Suspension Friendship Bridge
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 0.7), mat('#D97706'));
      bridge.position.set(0, 0.5, 0);
      content.add(bridge);

      // Twin Meeting Pavilions
      const p1 = new THREE.Mesh(new THREE.ConeGeometry(0.7, 0.7, 4), mat('#0284C7'));
      p1.position.set(-1.2, 0.9, 0);
      const p2 = new THREE.Mesh(new THREE.ConeGeometry(0.7, 0.7, 4), mat('#EC4899'));
      p2.position.set(1.2, 0.9, 0);
      content.add(p1, p2);
      break;
    }

    case 'world-life-journey-macro': {
      // Ascending Milestone Staircase Spiral
      for (let st = 0; st < 6; st++) {
        const step = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 0.6), mat('#CBD5E1'));
        const a = (st * Math.PI) / 3;
        step.position.set(Math.cos(a) * 1.1, 0.2 + st * 0.35, Math.sin(a) * 1.1);
        content.add(step);
      }

      // Summit Lighthouse Beacon
      const summit = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 1.6, 8), mat('#F59E0B'));
      summit.position.set(0, 1.5, 0);
      content.add(summit);
      break;
    }

    case 'world-fantasy-macro': {
      // Fantasy Castle with Needle Spires
      const keep = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.6, 1.2), mat('#F8FAFC'));
      keep.position.set(0, 0.8, -0.4);
      const spire = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.6, 8), mat('#4F46E5'));
      spire.position.set(0, 2.4, -0.4);
      content.add(keep, spire);

      // Dragon Head Promontory
      const dragon = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.2, 4), mat('#78716C'));
      dragon.rotation.x = Math.PI / 3;
      dragon.position.set(1.2, 0.6, 0.8);
      content.add(dragon);
      break;
    }

    case 'world-science-fiction-macro': {
      // Cyber Skyscraper with Neon Rings
      const tower = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.8, 1.0), mat('#0F172A'));
      tower.position.set(-0.7, 1.4, -0.4);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.08, 6, 16), mat('#06B6D4', { emissive: '#06B6D4' }));
      ring.rotation.x = Math.PI / 2;
      ring.position.set(-0.7, 2.2, -0.4);
      content.add(tower, ring);

      // Spacecraft Landing Pad
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.15, 16), mat('#334155'));
      pad.position.set(1.0, 0.3, 0.6);
      content.add(pad);
      break;
    }

    // ---------------------------------------------------------------------
    // F. Human Activities & Experiences (MW-36 to MW-40)
    // ---------------------------------------------------------------------
    case 'world-performing-arts-macro': {
      // Opera House Shell Roofs
      for (let sh = 0; sh < 3; sh++) {
        const shell = new THREE.Mesh(new THREE.ConeGeometry(0.7 + sh * 0.25, 0.9 + sh * 0.3, 4), mat('#FFFFFF'));
        shell.rotation.y = Math.PI / 4;
        shell.rotation.z = -0.35;
        shell.position.set(-0.6 + sh * 0.6, 0.6 + sh * 0.2, -0.4);
        content.add(shell);
      }
      break;
    }

    case 'world-visual-arts-macro': {
      // Modern Museum Pavilion with Glass Skylight Prism
      const mus = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.0, 1.4), mat('#F1F5F9'));
      mus.position.set(-0.6, 0.5, -0.4);
      const prism = new THREE.Mesh(new THREE.ConeGeometry(0.7, 0.6, 4), createGlassMat('#0284C7', 0.7));
      prism.rotation.y = Math.PI / 4;
      prism.position.set(-0.6, 1.3, -0.4);
      content.add(mus, prism);

      // Outdoor Abstract Sculptures
      const s1 = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.1, 6, 16), mat('#DC2626'));
      s1.position.set(1.1, 0.6, 0.6);
      content.add(s1);
      break;
    }

    case 'world-outdoor-adventure-macro': {
      // Mountain Trail & Climbing Cliff
      const cliff = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.2, 1.2), mat('#64748B'));
      cliff.position.set(-0.8, 1.1, -0.5);
      content.add(cliff);

      // Camping Area with A-Frame Tents
      const tent1 = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.6, 4), mat('#EA580C'));
      tent1.rotation.y = Math.PI / 4;
      tent1.position.set(0.9, 0.3, 0.4);
      content.add(tent1);
      break;
    }

    case 'world-spirituality-macro': {
      // Raked Sand Karesansui Zen Garden
      const sand = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 1.6), mat('#E2E8F0'));
      sand.position.set(-0.4, 0.04, 0.4);
      content.add(sand);

      // Cloud Monastery Pagoda
      const pag = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), mat('#78350F'));
      pag.position.set(0.8, 0.6, -0.6);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.1, 0.6, 4), mat('#78716C'));
      roof.rotation.y = Math.PI / 4;
      roof.position.set(0.8, 1.45, -0.6);
      content.add(pag, roof);
      break;
    }

    case 'world-media-communication-macro': {
      // Tall Broadcast Mast
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.14, 3.2, 6), mat('#DC2626'));
      mast.position.set(-1.0, 1.6, -0.5);
      content.add(mast);

      // TV Soundstage Studio with Satellite Uplink Dishes
      const studio = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 1.4), mat('#1E293B'));
      studio.position.set(0.6, 0.5, 0.4);
      const dish = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat('#F8FAFC'));
      dish.position.set(0.6, 1.2, 0.4);
      dish.rotation.x = -0.5;
      content.add(studio, dish);
      break;
    }

    default: {
      const generic = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), mat(primary));
      generic.position.y = 0.6;
      content.add(generic);
      break;
    }
  }

  master.add(content);
  return master;
}

// =========================================================================
// 30 NEW THEMATIC SUB-ISLANDS (SI-31 to SI-60)
// =========================================================================

export function build43SubIslandScene(island: IslandMetadata, variant: IslandVariant): THREE.Group {
  const master = new THREE.Group();

  // Floating Island Base with Real Geological Underside
  const base = buildRichIslandTerrain(island, variant, 'plateau');
  base.scale.set(0.85, 0.85, 0.85);
  master.add(base);

  const primary = island.palette[0]?.hex || '#4F46E5';
  const secondary = island.palette[1]?.hex || '#06B6D4';
  const accent = island.palette[2]?.hex || '#F59E0B';

  const content = new THREE.Group();
  content.position.set(0, 0.65, 0);

  switch (island.slug) {
    // A. Human Civilization (SI-31 to SI-36)
    case 'subisland-medieval-kingdom': {
      const keep = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.5, 1.4), mat('#64748B'));
      keep.position.y = 0.75;
      const roof = new THREE.Mesh(new THREE.ConeGeometry(0.9, 0.8, 4), mat('#991B1B'));
      roof.rotation.y = Math.PI / 4;
      roof.position.y = 1.9;
      content.add(keep, roof);
      break;
    }

    case 'subisland-ancient-egypt': {
      const pyr = new THREE.Mesh(new THREE.ConeGeometry(1.5, 1.6, 4), mat('#D4A373'));
      pyr.rotation.y = Math.PI / 4;
      pyr.position.set(-0.4, 0.8, -0.3);
      const apex = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.45, 4), mat('#F59E0B', { metalness: 0.7 }));
      apex.rotation.y = Math.PI / 4;
      apex.position.set(-0.4, 1.4, -0.3);
      const sphinx = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.45, 0.5), mat('#D4A373'));
      sphinx.position.set(0.7, 0.22, 0.6);
      content.add(pyr, apex, sphinx);
      break;
    }

    case 'subisland-ancient-greece': {
      const temple = new THREE.Group();
      temple.position.set(0, 0, -0.3);
      const baseSlab = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 1.2), mat('#F8FAFC'));
      temple.add(baseSlab);
      for (let x = -0.7; x <= 0.7; x += 0.45) {
        for (let z = -0.4; z <= 0.4; z += 0.8) {
          const col = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.8, 6), mat('#FFFFFF'));
          col.position.set(x, 0.45, z);
          temple.add(col);
        }
      }
      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.2, 0.4, 4), mat('#F8FAFC'));
      roof.scale.set(1.6, 1, 1);
      roof.rotation.y = Math.PI / 4;
      roof.position.y = 1.0;
      temple.add(roof);
      content.add(temple);
      break;
    }

    case 'subisland-ancient-rome': {
      const colosseum = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.9, 16, 1, true), mat('#E2E8F0'));
      colosseum.position.set(-0.4, 0.45, -0.3);
      const aqueduct = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.6, 0.3), mat('#78716C'));
      aqueduct.position.set(0.5, 0.3, 0.8);
      content.add(colosseum, aqueduct);
      break;
    }

    case 'subisland-imperial-china': {
      const pal = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 1.2), mat('#DC2626'));
      pal.position.set(-0.5, 0.35, -0.3);
      const pRoof = new THREE.Mesh(new THREE.ConeGeometry(1.2, 0.5, 4), mat('#F59E0B'));
      pRoof.rotation.y = Math.PI / 4;
      pRoof.position.set(-0.5, 0.9, -0.3);
      const pagoda = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, 1.8, 8), mat('#78350F'));
      pagoda.position.set(0.8, 0.9, 0.5);
      content.add(pal, pRoof, pagoda);
      break;
    }

    case 'subisland-mesoamerican-civilization': {
      for (let s = 0; s < 3; s++) {
        const step = new THREE.Mesh(new THREE.BoxGeometry(1.8 - s * 0.45, 0.35, 1.8 - s * 0.45), mat('#78716C'));
        step.position.y = 0.18 + s * 0.35;
        content.add(step);
      }
      const top = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.5), mat('#B45309'));
      top.position.y = 1.25;
      content.add(top);
      break;
    }

    // B. Earth & Natural Wonders (SI-37 to SI-42)
    case 'subisland-volcano-island': {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(1.6, 1.5, 8, 1, true), mat('#1E293B'));
      cone.position.y = 0.75;
      const lava = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.1, 8), mat('#EA580C', { emissive: '#DC2626' }));
      lava.position.y = 1.4;
      content.add(cone, lava);
      break;
    }

    case 'subisland-desert-oasis': {
      const dune = new THREE.Mesh(new THREE.ConeGeometry(1.4, 0.7, 6), mat('#EAB308'));
      dune.position.set(-0.6, 0.35, -0.4);
      const pool = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.08, 12), createWaterMat('#06B6D4'));
      pool.position.set(0.4, 0.05, 0.3);
      const palm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.1, 6), mat('#78350F'));
      palm.position.set(0.5, 0.55, 0.8);
      const frond = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.5, 0.15, 6), mat('#16A34A'));
      frond.position.set(0.5, 1.1, 0.8);
      content.add(dune, pool, palm, frond);
      break;
    }

    case 'subisland-glacier-world': {
      const glacier = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.0, 1.5), mat('#0284C7'));
      glacier.position.y = 0.5;
      const iceTop = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.3, 1.2), mat('#E0F2FE'));
      iceTop.position.y = 1.1;
      content.add(glacier, iceTop);
      break;
    }

    case 'subisland-rainforest-world': {
      const tree = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, 1.5, 6), mat('#78350F'));
      tree.position.y = 0.75;
      const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(1.1), mat('#166534'));
      foliage.position.y = 1.9;
      content.add(tree, foliage);
      break;
    }

    case 'subisland-underground-caves': {
      const arch = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.35, 6, 12, Math.PI), mat('#475569'));
      arch.position.y = 0.5;
      content.add(arch);
      break;
    }

    case 'subisland-savanna-world': {
      const aTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.2, 6), mat('#78350F'));
      aTrunk.position.y = 0.6;
      const aCanopy = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.1, 0.2, 8), mat('#65A30D'));
      aCanopy.position.y = 1.3;
      content.add(aTrunk, aCanopy);
      break;
    }

    // C. Society & Human Life (SI-43 to SI-48)
    case 'subisland-healthcare-island': {
      const hosp = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 1.4), mat('#F8FAFC'));
      hosp.position.y = 0.6;
      const helipad = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.06, 16), mat('#DC2626'));
      helipad.position.y = 1.25;
      content.add(hosp, helipad);
      break;
    }

    case 'subisland-government-law': {
      const portico = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 1.2), mat('#E2E8F0'));
      portico.position.y = 0.45;
      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.1, 0.5, 4), mat('#1E293B'));
      roof.rotation.y = Math.PI / 4;
      roof.position.y = 1.1;
      content.add(portico, roof);
      break;
    }

    case 'subisland-finance-island': {
      const bank = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.8, 1.1), mat('#334155'));
      bank.position.set(-0.5, 0.4, 0);
      const exch = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.6, 1.1), mat('#0284C7'));
      exch.position.set(0.6, 0.8, 0);
      content.add(bank, exch);
      break;
    }

    case 'subisland-public-safety': {
      const firehouse = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 1.4), mat('#B45309'));
      firehouse.position.y = 0.45;
      const tower = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.8, 0.5), mat('#DC2626'));
      tower.position.set(0.7, 0.9, 0.5);
      content.add(firehouse, tower);
      break;
    }

    case 'subisland-festivals-traditions': {
      const stage = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.25, 1.4), mat('#78350F'));
      stage.position.y = 0.12;
      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.1, 0.6, 4), mat('#E11D48'));
      roof.rotation.y = Math.PI / 4;
      roof.position.y = 1.0;
      content.add(stage, roof);
      break;
    }

    case 'subisland-archaeology-island': {
      const pit = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.25, 1.6), mat('#B45309'));
      pit.position.y = 0.12;
      const tent = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.6, 4), mat('#FEF3C7'));
      tent.rotation.y = Math.PI / 4;
      tent.position.set(0.6, 0.3, 0.5);
      content.add(pit, tent);
      break;
    }

    // D. Science & Discovery (SI-49 to SI-54)
    case 'subisland-genetics-island': {
      for (let i = 0; i < 6; i++) {
        const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 6), mat(i % 2 === 0 ? '#0D9488' : '#3B82F6'));
        rung.position.set(0, 0.3 + i * 0.28, 0);
        rung.rotation.y = i * 0.6;
        rung.rotation.z = Math.PI / 2;
        content.add(rung);
      }
      break;
    }

    case 'subisland-chemistry-island': {
      const mol = new THREE.Mesh(new THREE.IcosahedronGeometry(0.8, 1), mat('#2563EB', { wireframe: true }));
      mol.position.y = 1.0;
      content.add(mol);
      break;
    }

    case 'subisland-physics-island': {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.1, 8, 20), mat('#0284C7'));
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.5;
      content.add(ring);
      break;
    }

    case 'subisland-weather-climate': {
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 1.5, 6), mat('#64748B'));
      mast.position.y = 0.75;
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 8), mat('#F8FAFC'));
      dome.position.y = 1.7;
      content.add(mast, dome);
      break;
    }

    case 'subisland-prehistoric-life': {
      // Dinosaur Ribs/Arch
      const arch = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.1, 6, 12, Math.PI), mat('#FEF3C7'));
      arch.position.y = 0.5;
      content.add(arch);
      break;
    }

    case 'subisland-geometry-world': {
      const icosa = new THREE.Mesh(new THREE.IcosahedronGeometry(0.7, 0), mat('#6366F1'));
      icosa.position.y = 0.9;
      content.add(icosa);
      break;
    }

    // E. Imagination & Personal Exploration (SI-55 to SI-60)
    case 'subisland-fantasy-kingdom': {
      const castle = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 1.2), mat('#F1F5F9'));
      castle.position.y = 0.7;
      const spire = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.4, 8), mat('#4F46E5'));
      spire.position.y = 2.1;
      content.add(castle, spire);
      break;
    }

    case 'subisland-cyber-city': {
      const tower = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.2, 1.0), mat('#0F172A'));
      tower.position.y = 1.1;
      const neon = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.06, 6, 16), mat('#06B6D4', { emissive: '#06B6D4' }));
      neon.rotation.x = Math.PI / 2;
      neon.position.y = 1.6;
      content.add(tower, neon);
      break;
    }

    case 'subisland-fairy-tale-village': {
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 0.8, 8), mat('#FFFFFF'));
      stem.position.y = 0.4;
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.9, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat('#DC2626'));
      cap.position.y = 0.8;
      content.add(stem, cap);
      break;
    }

    case 'subisland-mystery-labyrinth': {
      for (let r = 0; r < 3; r++) {
        const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.6 + r * 0.45, 0.6 + r * 0.45, 0.4, 16, 1, true), mat('#15803D'));
        ring.position.y = 0.2;
        content.add(ring);
      }
      break;
    }

    case 'subisland-mindfulness-retreat': {
      const zendo = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.15, 1.4), mat('#78350F'));
      zendo.position.y = 0.1;
      const pond = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.06, 12), createWaterMat('#0D9488'));
      pond.position.set(0.6, 0.05, 0.6);
      content.add(zendo, pond);
      break;
    }

    case 'subisland-time-travel-island': {
      const clock = new THREE.Mesh(new THREE.BoxGeometry(0.7, 2.2, 0.7), mat('#475569'));
      clock.position.set(-0.5, 1.1, 0);
      const portal = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.08, 8, 16), mat('#06B6D4', { emissive: '#06B6D4' }));
      portal.position.set(0.6, 0.8, 0);
      content.add(clock, portal);
      break;
    }

    default: {
      const pav = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 1.2), mat(primary));
      pav.position.y = 0.45;
      const pavRoof = new THREE.Mesh(new THREE.ConeGeometry(0.9, 0.5, 4), mat(secondary));
      pavRoof.rotation.y = Math.PI / 4;
      pavRoof.position.y = 1.1;
      content.add(pav, pavRoof);
      break;
    }
  }

  master.add(content);
  return master;
}
