import * as THREE from 'three';
import { IslandMetadata, IslandVariant } from '../../types/island';
import { createGlassMat, createWaterMat } from './materials';

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
 * Handcrafted 3D Low-Poly Architectural Builder for the 50 NEW Distinctive Modular Buildings (BD-51 to BD-100)
 * plus rich typology differentiation for BD-01 to BD-50.
 * Sits on a clean architectural foundation plinth (NO floating island rock underbelly).
 */
export function buildDistinctiveModularBuilding(
  island: IslandMetadata,
  variant: IslandVariant
): THREE.Group {
  const master = new THREE.Group();

  const p0 = island.palette[0]?.hex || '#3B82F6';
  const p1 = island.palette[1]?.hex || '#1E293B';
  const p2 = island.palette[2]?.hex || '#F59E0B';
  const p3 = island.palette[3]?.hex || '#10B981';

  // Clean architectural foundation plinth (circular or rectangular matching terrainSpecs.shape)
  const isCircularPlinth = island.terrainSpecs.shape === 'circular';
  const plinthMat = mat('#E2E8F0', { roughness: 0.88 });
  const trimMat = mat('#CBD5E1', { roughness: 0.8 });

  if (isCircularPlinth) {
    const slab = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.62, 0.12, 24), plinthMat);
    slab.position.y = 0.06;
    slab.receiveShadow = true;
    const step = new THREE.Mesh(new THREE.CylinderGeometry(1.42, 1.48, 0.06, 24), trimMat);
    step.position.y = 0.13;
    master.add(slab, step);
  } else {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.12, 2.5), plinthMat);
    slab.position.y = 0.06;
    slab.receiveShadow = true;
    const step = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.06, 2.3), trimMat);
    step.position.y = 0.13;
    master.add(slab, step);
  }

  const b = new THREE.Group();
  b.position.y = 0.15;

  switch (island.slug) {
    // =====================================================================
    // A. World Heritage & Sacred Architecture (BD-51 to BD-60)
    // =====================================================================
    case 'building-gothic-cathedral': {
      // Cruciform Nave & Transept
      const nave = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.15, 1.85), mat(p0));
      nave.position.set(0, 0.58, -0.05);
      const naveRoof = new THREE.Mesh(new THREE.ConeGeometry(0.72, 0.55, 4), mat(p1));
      naveRoof.rotation.y = Math.PI / 4;
      naveRoof.scale.set(0.95, 1, 1.9);
      naveRoof.position.set(0, 1.42, -0.05);
      b.add(nave, naveRoof);

      // Twin Front Bell Towers & Pointed Spires
      [-0.42, 0.42].forEach((x) => {
        const tower = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.65, 0.42), mat(p0));
        tower.position.set(x, 0.82, 0.72);
        const spire = new THREE.Mesh(new THREE.ConeGeometry(0.28, 1.05, 8), mat(p1));
        spire.position.set(x, 2.15, 0.72);
        const cross = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.22, 6), mat(p3, { metalness: 0.7 }));
        cross.position.set(x, 2.72, 0.72);
        b.add(tower, spire, cross);
      });

      // Stained-Glass Rose Window
      const roseRim = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.035, 8, 16), mat(p0));
      roseRim.position.set(0, 0.92, 0.91);
      const roseGlass = new THREE.Mesh(new THREE.CircleGeometry(0.2, 16), mat(p2, { emissive: p2, emissiveIntensity: 0.35 }));
      roseGlass.position.set(0, 0.92, 0.915);
      b.add(roseRim, roseGlass);

      // Flying Buttresses along sides
      [-0.5, 0, 0.4].forEach((z) => {
        [-0.65, 0.65].forEach((x) => {
          const pier = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.95, 0.12), mat(p0));
          pier.position.set(x, 0.48, z);
          const flyer = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.07, 0.08), mat(p0));
          flyer.position.set(x * 0.82, 0.82, z);
          flyer.rotation.z = x > 0 ? 0.4 : -0.4;
          b.add(pier, flyer);
        });
      });
      break;
    }

    case 'building-onion-dome-basilica': {
      // Red Brick Base & Central Octagonal Tented Tower
      const baseBody = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.85, 1.45), mat(p0));
      baseBody.position.y = 0.42;
      const centralDrum = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.46, 1.15, 8), mat('#F8FAFC'));
      centralDrum.position.y = 1.35;
      const tentSpire = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.95, 8), mat(p0));
      tentSpire.position.y = 2.35;
      const topOnion = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), mat(p1, { metalness: 0.65, roughness: 0.25 }));
      topOnion.scale.set(1, 1.25, 1);
      topOnion.position.y = 2.92;
      b.add(baseBody, centralDrum, tentSpire, topOnion);

      // 4 Polychrome Corner Onion Domes on White Drums
      const domeColors = [p2, p3, '#EC4899', p1];
      [[-0.58, -0.58], [0.58, -0.58], [-0.58, 0.58], [0.58, 0.58]].forEach(([x, z], idx) => {
        const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.75, 8), mat('#FFFFFF'));
        drum.position.set(x, 1.1, z);
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), mat(domeColors[idx], { metalness: 0.35 }));
        bulb.scale.set(1, 1.2, 1);
        bulb.position.set(x, 1.62, z);
        const tip = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.3, 8), mat(domeColors[idx]));
        tip.position.set(x, 1.92, z);
        b.add(drum, bulb, tip);
      });
      break;
    }

    case 'building-stepped-ziggurat-temple': {
      // Three Battered Receding Mud-Brick Terraces
      const t1 = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.48, 0.52, 4), mat(p0));
      t1.rotation.y = Math.PI / 4;
      t1.position.y = 0.26;
      const t2 = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 1.06, 0.48, 4), mat(p0));
      t2.rotation.y = Math.PI / 4;
      t2.position.y = 0.76;
      const t3 = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.68, 0.42, 4), mat(p0));
      t3.rotation.y = Math.PI / 4;
      t3.position.y = 1.21;
      b.add(t1, t2, t3);

      // Glazed Lapis-Blue Summit Shrine
      const shrine = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.44, 0.56), mat(p1));
      shrine.position.y = 1.64;
      const goldHorns = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.08, 0.62), mat('#F59E0B', { metalness: 0.6 }));
      goldHorns.position.y = 1.88;
      b.add(shrine, goldHorns);

      // Triple Processional Staircase Ramp on Front
      const mainRamp = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.18, 1.15), mat(p2));
      mainRamp.position.set(0, 0.55, 0.82);
      mainRamp.rotation.x = 0.58;
      const leftRamp = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.16, 0.24), mat(p2));
      leftRamp.position.set(-0.48, 0.35, 0.92);
      leftRamp.rotation.z = -0.45;
      const rightRamp = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.16, 0.24), mat(p2));
      rightRamp.position.set(0.48, 0.35, 0.92);
      rightRamp.rotation.z = 0.45;
      b.add(mainRamp, leftRamp, rightRamp);
      break;
    }

    case 'building-japanese-castle-tenshu': {
      // Sloped Stone Ishigaki Fortress Base
      const stoneBase = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.35, 0.62, 4), mat(p2));
      stoneBase.rotation.y = Math.PI / 4;
      stoneBase.position.y = 0.31;
      b.add(stoneBase);

      // Five Tiers of White Plaster Walls & Flared Slate Roofs
      for (let tier = 0; tier < 4; tier++) {
        const w = 1.25 - tier * 0.22;
        const y = 0.62 + tier * 0.42;
        const wall = new THREE.Mesh(new THREE.BoxGeometry(w, 0.36, w), mat(p0));
        wall.position.y = y + 0.18;
        const eave = new THREE.Mesh(new THREE.ConeGeometry(w * 0.92, 0.24, 4), mat(p1));
        eave.rotation.y = Math.PI / 4;
        eave.position.y = y + 0.4;
        b.add(wall, eave);
      }

      // Golden Shachihoko Roof Finials at Peak
      [-0.16, 0.16].forEach((x) => {
        const fin = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 5), mat(p3, { metalness: 0.75 }));
        fin.position.set(x, 2.42, 0);
        b.add(fin);
      });
      break;
    }

    case 'building-moorish-courtyard-palace': {
      // Central Emerald Mirror Pool
      const poolRim = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.08, 1.65), mat(p0));
      poolRim.position.y = 0.04;
      const water = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.09, 1.52), createWaterMat(p1));
      water.position.y = 0.05;
      b.add(poolRim, water);

      // Surrounding Arcaded Wings & Domed Pavilions at Both Ends
      [-0.85, 0.85].forEach((z, idx) => {
        const pav = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.95 + idx * 0.25, 0.48), mat(p0));
        pav.position.set(0, (0.95 + idx * 0.25) / 2, z);
        const roof = new THREE.Mesh(new THREE.ConeGeometry(0.95, 0.42, 4), mat(p2));
        roof.rotation.y = Math.PI / 4;
        roof.scale.set(1.3, 1, 0.55);
        roof.position.set(0, 1.12 + idx * 0.25, z);
        b.add(pav, roof);
      });

      // Side Colonnade Walls & Myrtle Hedges
      [-0.56, 0.56].forEach((x) => {
        const hedge = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.22, 1.25), mat(p3));
        hedge.position.set(x * 0.82, 0.11, 0);
        const wall = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.72, 1.35), mat(p0));
        wall.position.set(x * 1.25, 0.36, 0);
        b.add(hedge, wall);
      });
      break;
    }

    case 'building-nordic-stave-church': {
      // Six Cascading Steep Dark Timber Tiers
      for (let t = 0; t < 5; t++) {
        const w = 1.45 - t * 0.26;
        const h = 0.42;
        const y = t * 0.38;
        const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, w * 1.15), mat(p1));
        box.position.y = y + h / 2;
        const roof = new THREE.Mesh(new THREE.ConeGeometry(w * 0.88, 0.48, 4), mat(p0));
        roof.rotation.y = Math.PI / 4;
        roof.position.y = y + h + 0.15;
        b.add(box, roof);

        // Projecting Dragon Head Prows on tiers 1, 2, 3
        if (t >= 1 && t <= 3) {
          [-1, 1].forEach((dir) => {
            const prow = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.32, 4), mat(p2));
            prow.rotation.x = dir * (Math.PI / 3);
            prow.position.set(0, y + h + 0.22, dir * (w * 0.65));
            b.add(prow);
          });
        }
      }
      break;
    }

    case 'building-classical-rotunda-pantheon': {
      // Massive Cylindrical Brick Drum
      const drum = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.08, 1.05, 24), mat(p1));
      drum.position.set(0, 0.52, -0.22);
      // Stepped Saucer Dome
      const dome = new THREE.Mesh(new THREE.SphereGeometry(1.02, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.42), mat(p2));
      dome.position.set(0, 0.85, -0.22);
      // Open Sky Oculus Ring
      const oculus = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.12, 16), mat(p3));
      oculus.position.set(0, 1.82, -0.22);
      b.add(drum, dome, oculus);

      // Front Octastyle Corinthian Portico & Triangular Pediment
      const porchRoof = new THREE.Mesh(new THREE.ConeGeometry(0.78, 0.38, 4), mat(p0));
      porchRoof.rotation.y = Math.PI / 4;
      porchRoof.scale.set(1.35, 1, 0.75);
      porchRoof.position.set(0, 1.15, 0.78);
      b.add(porchRoof);
      for (let x = -0.54; x <= 0.54; x += 0.36) {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.92, 8), mat(p0));
        col.position.set(x, 0.46, 0.95);
        b.add(col);
      }
      break;
    }

    case 'building-tibetan-cliff-monastery': {
      // Battered Inward-Sloping White Stone Lower Massif
      const whiteBase = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.45, 0.95, 4), mat(p0));
      whiteBase.rotation.y = Math.PI / 4;
      whiteBase.scale.set(1.25, 1, 0.95);
      whiteBase.position.y = 0.48;

      // Central Crimson Red Upper Palace Block
      const redPalace = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.88, 0.78, 4), mat(p1));
      redPalace.rotation.y = Math.PI / 4;
      redPalace.scale.set(1.15, 1, 0.9);
      redPalace.position.y = 1.32;

      // Gilded Dharma Summit Roofs
      const goldRoof = new THREE.Mesh(new THREE.ConeGeometry(0.62, 0.32, 4), mat(p2, { metalness: 0.75, roughness: 0.25 }));
      goldRoof.rotation.y = Math.PI / 4;
      goldRoof.position.y = 1.85;
      b.add(whiteBase, redPalace, goldRoof);
      break;
    }

    case 'building-byzantine-mosaic-basilica': {
      // Main Square Body & Cascading Semi-Domes
      const cube = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.95, 1.35), mat(p0));
      cube.position.y = 0.48;
      const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.62, 0.22, 16), mat(p2));
      collar.position.y = 1.02;
      const mainDome = new THREE.Mesh(new THREE.SphereGeometry(0.58, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat(p1));
      mainDome.scale.set(1, 0.65, 1);
      mainDome.position.y = 1.12;
      b.add(cube, collar, mainDome);

      // Four Slender Corner Minarets
      [[-0.88, -0.88], [0.88, -0.88], [-0.88, 0.88], [0.88, 0.88]].forEach(([x, z]) => {
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 1.85, 8), mat(p3));
        shaft.position.set(x, 0.92, z);
        const cap = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.38, 8), mat(p1));
        cap.position.set(x, 2.02, z);
        b.add(shaft, cap);
      });
      break;
    }

    case 'building-maya-observatory-caracol': {
      // Bi-Level Sloped Stone Platforms
      const plat1 = new THREE.Mesh(new THREE.CylinderGeometry(1.32, 1.48, 0.38, 4), mat(p1));
      plat1.rotation.y = Math.PI / 4;
      plat1.position.y = 0.19;
      const plat2 = new THREE.Mesh(new THREE.CylinderGeometry(0.98, 1.12, 0.34, 4), mat(p0));
      plat2.rotation.y = Math.PI / 4;
      plat2.position.y = 0.55;

      // Cylindrical Stone Astronomical Turret
      const drum1 = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.58, 0.62, 16), mat(p0));
      drum1.position.y = 1.02;
      const drum2 = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.48, 16), mat(p1));
      drum2.position.y = 1.55;
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(p0));
      cap.position.y = 1.78;
      b.add(plat1, plat2, drum1, drum2, cap);
      break;
    }

    // =====================================================================
    // B. Iconic Contemporary & Avant-Garde Architecture (BD-61 to BD-70)
    // =====================================================================
    case 'building-twisted-helix-skyscraper': {
      // 10 Rotating Floor Segments Twisting 90 Degrees
      for (let i = 0; i < 10; i++) {
        const y = 0.14 + i * 0.26;
        const rot = (i / 9) * (Math.PI / 2);
        const seg = new THREE.Mesh(
          new THREE.BoxGeometry(0.88, 0.22, 0.62),
          createGlassMat(p0, 0.82)
        );
        seg.position.y = y;
        seg.rotation.y = rot;
        const slabPlate = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.05, 0.68), mat(p1));
        slabPlate.position.y = y + 0.11;
        slabPlate.rotation.y = rot;
        b.add(seg, slabPlate);
      }
      break;
    }

    case 'building-deconstructivist-titanium-museum': {
      // Orthogonal Limestone Base Anchor
      const stoneWing = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.72, 1.1), mat(p2));
      stoneWing.position.set(-0.25, 0.36, -0.2);
      b.add(stoneWing);

      // Billowing Swooping Titanium Ribbon Shells
      const titaniumMat = mat(p0, { metalness: 0.78, roughness: 0.22 });
      const goldMat = mat(p1, { metalness: 0.72, roughness: 0.25 });

      const ribbon1 = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.85, 1.35, 12, 1, true, 0, Math.PI * 1.3), titaniumMat);
      ribbon1.position.set(0.15, 0.75, 0.1);
      ribbon1.rotation.z = 0.32;
      const ribbon2 = new THREE.Mesh(new THREE.ConeGeometry(0.75, 1.55, 8, 1, true), goldMat);
      ribbon2.position.set(-0.2, 0.95, 0.15);
      ribbon2.rotation.x = -0.28;
      const ribbon3 = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.18, 8, 16, Math.PI * 1.2), titaniumMat);
      ribbon3.position.set(0.25, 0.7, -0.1);
      ribbon3.rotation.y = 0.6;
      b.add(ribbon1, ribbon2, ribbon3);
      break;
    }

    case 'building-cantilever-horizon-villa': {
      // Waterfall Stream at Base
      const pool = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 1.2), createWaterMat(p3));
      pool.position.set(0.2, 0.04, 0.35);
      // Vertical Quarried Stone Chimney Core
      const core = new THREE.Mesh(new THREE.BoxGeometry(0.58, 1.85, 0.62), mat(p1));
      core.position.set(-0.25, 0.92, -0.25);
      b.add(pool, core);

      // Three Boldly Cantilevered Ochre Concrete Trays
      const tray1 = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.22, 1.05), mat(p0));
      tray1.position.set(0.18, 0.52, 0.15);
      const tray2 = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.22, 1.45), mat(p0));
      tray2.position.set(-0.1, 1.05, 0.22);
      const tray3 = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.18, 0.95), mat(p0));
      tray3.position.set(-0.2, 1.52, -0.1);
      b.add(tray1, tray2, tray3);
      break;
    }

    case 'building-lotus-art-pavilion': {
      // Circular Lagoon Pond
      const pond = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 0.06, 24), createWaterMat(p1));
      pond.position.y = 0.03;
      b.add(pond);

      // 8 Radial Asymmetric White Lotus Shell Petals
      for (let p = 0; p < 8; p++) {
        const angle = (p / 8) * Math.PI * 2;
        const h = 0.95 + (p % 3) * 0.32;
        const petal = new THREE.Mesh(
          new THREE.ConeGeometry(0.36, h, 5),
          mat(p0, { roughness: 0.35 })
        );
        petal.position.set(Math.cos(angle) * 0.55, 0.58 + (p % 3) * 0.12, Math.sin(angle) * 0.55);
        petal.rotation.z = -Math.cos(angle) * 0.48;
        petal.rotation.x = Math.sin(angle) * 0.48;
        b.add(petal);
      }
      break;
    }

    case 'building-diagrid-gherkin-tower': {
      // Bullet-Shaped Paraboloid Glass Core + Wireframe Diamond Diagrid
      const profilePts = [
        new THREE.Vector2(0.48, 0),
        new THREE.Vector2(0.66, 0.9),
        new THREE.Vector2(0.62, 1.65),
        new THREE.Vector2(0.38, 2.35),
        new THREE.Vector2(0.01, 2.68),
      ];
      const latheGeo = new THREE.LatheGeometry(profilePts, 16);
      const coreMesh = new THREE.Mesh(latheGeo, createGlassMat(p0, 0.85));
      const diagridMesh = new THREE.Mesh(latheGeo, mat(p1, { wireframe: true }));
      diagridMesh.scale.set(1.02, 1.005, 1.02);
      b.add(coreMesh, diagridMesh);
      break;
    }

    case 'building-interlocking-habitat-cubes': {
      // Brutalist Jenga Stack of 12 Interlocking Concrete Cubes + Roof Gardens
      const offsets: [number, number, number][] = [
        [-0.55, 0.25, -0.35], [0.15, 0.25, -0.35], [0.55, 0.25, 0.25], [-0.35, 0.25, 0.35],
        [-0.35, 0.72, -0.15], [0.35, 0.72, -0.15], [0, 0.72, 0.42],
        [-0.15, 1.18, -0.25], [0.32, 1.18, 0.18], [-0.42, 1.18, 0.22],
        [0.05, 1.64, 0], [-0.22, 2.08, -0.05],
      ];
      offsets.forEach(([x, y, z]) => {
        const box = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.44, 0.58), mat(p0));
        box.position.set(x, y, z);
        const greenTop = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.06, 0.52), mat(p1));
        greenTop.position.set(x, y + 0.24, z);
        b.add(box, greenTop);
      });
      break;
    }

    case 'building-mobius-loop-cultural-center': {
      // Tilted Torus Loop with Walkable Green Roof & Cedar Inner Court
      const loopRing = new THREE.Mesh(new THREE.CylinderGeometry(1.18, 1.22, 0.55, 24, 1, true), mat(p1));
      loopRing.position.y = 0.38;
      loopRing.rotation.z = 0.18;
      const greenRamp = new THREE.Mesh(new THREE.TorusGeometry(1.02, 0.22, 8, 24), mat(p0));
      greenRamp.rotation.x = Math.PI / 2;
      greenRamp.rotation.y = 0.22;
      greenRamp.position.y = 0.58;
      const centerPool = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.06, 16), createWaterMat(p2));
      centerPool.position.y = 0.04;
      b.add(loopRing, greenRamp, centerPool);
      break;
    }

    case 'building-pyramid-glass-louvre': {
      // Main Diamond-Lattice Glass Pyramid + Wireframe Space-Frame
      const pyrGeo = new THREE.ConeGeometry(1.12, 1.25, 4);
      const glassPyr = new THREE.Mesh(pyrGeo, createGlassMat(p0, 0.58));
      glassPyr.rotation.y = Math.PI / 4;
      glassPyr.position.y = 0.63;
      const framePyr = new THREE.Mesh(pyrGeo, mat(p1, { wireframe: true }));
      framePyr.rotation.y = Math.PI / 4;
      framePyr.position.y = 0.63;
      // Glowing Warm Interior Core
      const innerGlow = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.55, 4), mat(p3, { emissive: p3, emissiveIntensity: 0.4 }));
      innerGlow.rotation.y = Math.PI / 4;
      innerGlow.position.y = 0.28;
      b.add(glassPyr, framePyr, innerGlow);

      // Triangular Reflecting Water Pools around Base
      [[-0.85, 0], [0.85, 0], [0, 0.85]].forEach(([x, z]) => {
        const miniPyr = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.28, 4), createGlassMat(p0, 0.7));
        miniPyr.rotation.y = Math.PI / 4;
        miniPyr.position.set(x, 0.14, z);
        b.add(miniPyr);
      });
      break;
    }

    case 'building-hyperboloid-lattice-tower': {
      // Hourglass Waisted Hyperboloid Lattice + Elevated Sky Pod
      const hyperPts = [
        new THREE.Vector2(0.75, 0),
        new THREE.Vector2(0.34, 1.15),
        new THREE.Vector2(0.58, 2.15),
      ];
      const hyperGeo = new THREE.LatheGeometry(hyperPts, 12);
      const lattice = new THREE.Mesh(hyperGeo, mat(p0, { wireframe: true }));
      const coreShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 2.2, 10), mat(p1));
      coreShaft.position.y = 1.1;
      const skyPod = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.52, 0.36, 16), mat(p2));
      skyPod.position.y = 2.18;
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.05, 0.65, 6), mat(p3));
      mast.position.y = 2.65;
      b.add(lattice, coreShaft, skyPod, mast);
      break;
    }

    case 'building-suspended-arch-skybridge-gate': {
      // Monumental Hollow Cube Arch (Grande Arche Form)
      const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.48, 2.1, 1.05), mat(p0));
      leftLeg.position.set(-0.68, 1.05, 0);
      const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.48, 2.1, 1.05), mat(p0));
      rightLeg.position.set(0.68, 1.05, 0);
      const topBridge = new THREE.Mesh(new THREE.BoxGeometry(1.84, 0.46, 1.05), mat(p0));
      topBridge.position.set(0, 1.87, 0);
      const bottomSill = new THREE.Mesh(new THREE.BoxGeometry(1.84, 0.24, 1.15), mat(p3));
      bottomSill.position.set(0, 0.12, 0);
      // Red Suspended Scenic Elevator Truss in Hollow Void
      const liftShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.65, 6), mat(p2));
      liftShaft.position.set(-0.18, 0.95, 0.2);
      b.add(leftLeg, rightLeg, topBridge, bottomSill, liftShaft);
      break;
    }

    // =====================================================================
    // C. Civic, Cultural & Public Institutions (BD-71 to BD-80)
    // =====================================================================
    case 'building-symphony-acoustic-shells': {
      // Monumental Red Granite Podium
      const podium = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.36, 1.65), mat(p1));
      podium.position.y = 0.18;
      b.add(podium);

      // Interlocking Vaulted White Sail Shells (3 Pairs)
      [-0.58, 0.05, 0.62].forEach((x, idx) => {
        const sH = 0.85 + (idx === 1 ? 0.42 : idx * 0.15);
        const sail = new THREE.Mesh(new THREE.ConeGeometry(0.48, sH, 5), mat(p0, { roughness: 0.3 }));
        sail.position.set(x, 0.36 + sH * 0.45, -0.05);
        sail.rotation.z = -0.32;
        sail.rotation.y = 0.25;
        b.add(sail);
      });
      break;
    }

    case 'building-victorian-glass-conservatory': {
      // Curvilinear Barrel Vault Wings + Raised Central Transept Dome
      const glassM = createGlassMat(p1, 0.65);
      const wingHull = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 2.05, 12, 1, false, 0, Math.PI), glassM);
      wingHull.rotation.z = Math.PI / 2;
      wingHull.position.y = 0.35;
      const centerDome = new THREE.Mesh(new THREE.SphereGeometry(0.76, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), glassM);
      centerDome.position.y = 0.42;
      const ironWire = new THREE.Mesh(new THREE.SphereGeometry(0.77, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(p0, { wireframe: true }));
      ironWire.position.y = 0.42;
      // Interior Tropical Palm Canopy
      const palm = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45), mat(p2));
      palm.position.y = 0.55;
      b.add(wingHull, centerDome, ironWire, palm);
      break;
    }

    case 'building-art-deco-cinema-palace': {
      // Stepped Ziggurat Art Deco Facade
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.55, 1.35, 1.35), mat(p0));
      body.position.set(0, 0.68, -0.15);
      const stepCrown = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.45, 0.45), mat(p1, { metalness: 0.6 }));
      stepCrown.position.set(0, 1.55, 0.3);
      // Towering Vertical Neon Blade Fin Sign
      const neonFin = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.45, 0.42), mat(p2, { emissive: p2, emissiveIntensity: 0.45 }));
      neonFin.position.set(0, 1.65, 0.62);
      // Cantilevered Illuminated Marquee
      const marquee = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.24, 0.58), mat(p3, { emissive: p3, emissiveIntensity: 0.35 }));
      marquee.position.set(0, 0.68, 0.72);
      b.add(body, stepCrown, neonFin, marquee);
      break;
    }

    case 'building-central-clock-railway-station': {
      // Limestone Headhouse + Vaulted Train Shed + Copper Clock Tower
      const headhouse = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.95, 0.85), mat(p0));
      headhouse.position.set(-0.15, 0.48, 0.35);
      const trainShed = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 1.7, 12, 1, false, 0, Math.PI), mat(p2));
      trainShed.rotation.z = Math.PI / 2;
      trainShed.position.set(-0.15, 0.45, -0.45);
      const clockTower = new THREE.Mesh(new THREE.BoxGeometry(0.46, 2.05, 0.46), mat(p0));
      clockTower.position.set(0.68, 1.02, 0.45);
      const copperDome = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.55, 4), mat(p1));
      copperDome.rotation.y = Math.PI / 4;
      copperDome.position.set(0.68, 2.3, 0.45);
      const clockFace = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.5, 12), mat(p3, { emissive: p3, emissiveIntensity: 0.4 }));
      clockFace.rotation.x = Math.PI / 2;
      clockFace.position.set(0.68, 1.72, 0.45);
      b.add(headhouse, trainShed, clockTower, copperDome, clockFace);
      break;
    }

    case 'building-planetarium-celestial-sphere': {
      // Suspended Glowing Golden Sphere Inside Transparent Glass Cube
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.62, 20, 16), mat(p0, { metalness: 0.55, roughness: 0.3 }));
      sphere.position.y = 0.95;
      const orbitalRamp = new THREE.Mesh(new THREE.TorusGeometry(0.76, 0.045, 8, 24), mat(p2));
      orbitalRamp.rotation.x = 1.25;
      orbitalRamp.position.y = 0.95;
      const glassCube = new THREE.Mesh(new THREE.BoxGeometry(1.72, 1.72, 1.72), createGlassMat(p1, 0.42));
      glassCube.position.y = 0.88;
      const wireframeCube = new THREE.Mesh(new THREE.BoxGeometry(1.74, 1.74, 1.74), mat(p2, { wireframe: true }));
      wireframeCube.position.y = 0.88;
      b.add(sphere, orbitalRamp, glassCube, wireframeCube);
      break;
    }

    case 'building-spiral-ramp-museum': {
      // Inverted Ziggurat Expanding Spiral Rotunda (Guggenheim Form)
      for (let r = 0; r < 4; r++) {
        const rad = 0.68 + r * 0.14;
        const band = new THREE.Mesh(new THREE.CylinderGeometry(rad + 0.06, rad, 0.28, 24), mat(p0));
        band.position.set(-0.15, 0.2 + r * 0.34, 0.1);
        b.add(band);
      }
      const skylight = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.78, 0.08, 16), createGlassMat(p1, 0.75));
      skylight.position.set(-0.15, 1.48, 0.1);
      const annex = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.25, 0.85), mat(p2));
      annex.position.set(0.68, 0.62, -0.35);
      b.add(skylight, annex);
      break;
    }

    case 'building-aquarium-wave-tunnel': {
      // Cresting Blue Wave Hall + Cylindrical Kelp Tank + Acrylic Arch Tunnel
      const hall = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.95, 1.25), mat(p0));
      hall.position.set(-0.2, 0.48, -0.2);
      const waveRoof = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 1.55, 12, 1, false, 0, Math.PI * 0.8), mat(p2));
      waveRoof.rotation.z = Math.PI / 2;
      waveRoof.position.set(-0.2, 0.92, -0.2);
      const kelpTank = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.35, 16), createGlassMat(p1, 0.7));
      kelpTank.position.set(0.68, 0.68, -0.25);
      const kelp = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 1.15, 6), mat(p3));
      kelp.position.set(0.68, 0.6, -0.25);
      const archTunnel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.85, 12, 1, false, 0, Math.PI), createGlassMat(p1, 0.65));
      archTunnel.rotation.x = Math.PI / 2;
      archTunnel.position.set(-0.15, 0.05, 0.65);
      b.add(hall, waveRoof, kelpTank, kelp, archTunnel);
      break;
    }

    case 'building-fire-lookout-timber-tower': {
      // Tall Tapered Timber Stilt Tower + Elevated Ranger Cabin
      const trussTower = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.78, 1.55, 4, 3, true), mat(p0, { wireframe: true }));
      trussTower.rotation.y = Math.PI / 4;
      trussTower.position.y = 0.78;
      // Central Switchback Stair Column
      const stairCore = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.5, 0.28), mat(p0));
      stairCore.position.y = 0.75;
      // Wrap-Around Catwalk Deck & Glass Cabin
      const catwalk = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.08, 1.05), mat(p0));
      catwalk.position.y = 1.56;
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.48, 0.72), mat(p2, { emissive: p2, emissiveIntensity: 0.25 }));
      cabin.position.y = 1.82;
      const hipRoof = new THREE.Mesh(new THREE.ConeGeometry(0.68, 0.38, 4), mat(p1));
      hipRoof.rotation.y = Math.PI / 4;
      hipRoof.position.y = 2.22;
      b.add(trussTower, stairCore, catwalk, cabin, hipRoof);
      break;
    }

    case 'building-amphitheater-tensile-canopy': {
      // Three-Peaked Hyperbolic White Fabric Tent + Raked Yellow Masts
      const stage = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.05, 0.22, 12), mat(p2));
      stage.position.y = 0.11;
      b.add(stage);

      [[-0.55, 0.15, 1.45], [0, -0.35, 1.85], [0.55, 0.15, 1.45]].forEach(([x, z, h]) => {
        const peak = new THREE.Mesh(new THREE.ConeGeometry(0.65, h * 0.65, 6), mat(p0));
        peak.position.set(x, h * 0.55, z);
        const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, h * 1.1, 6), mat(p1));
        mast.position.set(x * 1.15, h * 0.55, z);
        mast.rotation.z = x * -0.25;
        b.add(peak, mast);
      });
      break;
    }

    case 'building-public-bathhouse-onsen': {
      // Multi-Story Timber Bathhouse + Karahafu Porch + Tall Boiler Chimney + Rotenburo
      const mainHall = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.25, 1.15), mat(p0));
      mainHall.position.set(-0.15, 0.62, -0.15);
      const topRoof = new THREE.Mesh(new THREE.ConeGeometry(1.18, 0.55, 4), mat(p1));
      topRoof.rotation.y = Math.PI / 4;
      topRoof.position.set(-0.15, 1.5, -0.15);
      // Red Balustrade Balcony & Karahafu Porch
      const porch = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.55, 0.45), mat(p2));
      porch.position.set(-0.15, 0.28, 0.62);
      // Tall Brick Chimney
      const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.16, 2.25, 8), mat('#991B1B'));
      chimney.position.set(0.68, 1.12, -0.55);
      // Outdoor Steaming Rock Pool
      const bath = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.45, 0.14, 10), createWaterMat(p3));
      bath.position.set(0.62, 0.07, 0.45);
      b.add(mainHall, topRoof, porch, chimney, bath);
      break;
    }

    // =====================================================================
    // D. Vernacular, Artisanal & Fantasy Architecture (BD-81 to BD-90)
    // =====================================================================
    case 'building-dutch-octagonal-windmill': {
      // Brick Base + Wooden Reefing Stage + Tapered Octagonal Smock + 4 Sails
      const brickBase = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.74, 0.55, 8), mat(p3));
      brickBase.position.y = 0.28;
      const stageDeck = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.06, 8), mat(p0));
      stageDeck.position.y = 0.56;
      const smockBody = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.66, 1.15, 8), mat(p0));
      smockBody.position.y = 1.12;
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.46, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), mat(p1));
      cap.position.y = 1.68;
      b.add(brickBase, stageDeck, smockBody, cap);

      // Four Crossed Latticed Sails
      const sailGroup = new THREE.Group();
      sailGroup.position.set(0, 1.82, 0.48);
      sailGroup.rotation.z = Math.PI / 6;
      for (let s = 0; s < 4; s++) {
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.15, 0.03), mat(p2));
        const a = (s * Math.PI) / 2;
        blade.position.set(Math.cos(a) * 0.55, Math.sin(a) * 0.55, 0);
        blade.rotation.z = a + Math.PI / 2;
        sailGroup.add(blade);
      }
      b.add(sailGroup);
      break;
    }

    case 'building-bavarian-half-timber-inn': {
      // Jettied Overhanging Stories (wider as it goes up!) + Steep Red Roof + Corner Turret
      const floor1 = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.52, 1.15), mat('#78716C'));
      floor1.position.y = 0.26;
      const floor2 = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.52, 1.28), mat(p0));
      floor2.position.y = 0.78;
      const floor3 = new THREE.Mesh(new THREE.BoxGeometry(1.46, 0.52, 1.38), mat(p0));
      floor3.position.y = 1.3;
      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.15, 0.88, 4), mat(p2));
      roof.rotation.y = Math.PI / 4;
      roof.position.y = 1.98;
      // Corner Oriel Turret
      const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.95, 8), mat(p0));
      turret.position.set(0.68, 1.25, 0.62);
      const turretSpire = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.52, 8), mat(p2));
      turretSpire.position.set(0.68, 1.98, 0.62);
      b.add(floor1, floor2, floor3, roof, turret, turretSpire);
      break;
    }

    case 'building-mediterranean-windmill-villa': {
      // Interlocking Whitewashed Barrel Vaults + Twin Cobalt Domes + Campanile Bell Wall
      const cube1 = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.82, 1.15), mat(p0));
      cube1.position.set(-0.22, 0.41, -0.15);
      const dome1 = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat(p1));
      dome1.position.set(-0.22, 0.82, -0.15);
      const cube2 = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.62, 0.85), mat(p0));
      cube2.position.set(0.48, 0.31, 0.25);
      const dome2 = new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(p1));
      dome2.position.set(0.48, 0.62, 0.25);
      // Stepped Campanile Bell Wall
      const bellWall = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.65, 0.12), mat(p0));
      bellWall.position.set(-0.65, 1.12, 0.38);
      // Infinity Plunge Pool
      const pool = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.12, 0.55), createWaterMat(p3));
      pool.position.set(-0.35, 0.06, 0.68);
      b.add(cube1, dome1, cube2, dome2, bellWall, pool);
      break;
    }

    case 'building-alpine-a-frame-chalet': {
      // Sharp 60-Degree Equilateral Triangular A-Frame Prism + Tall Stone Chimney
      const prismGeo = new THREE.CylinderGeometry(1.15, 1.15, 1.65, 3);
      const aframe = new THREE.Mesh(prismGeo, mat(p0));
      aframe.rotation.x = Math.PI / 2;
      aframe.rotation.z = Math.PI;
      aframe.position.set(0, 0.58, 0);
      // Glowing Triangular Glass Gable
      const glassGable = new THREE.Mesh(new THREE.ConeGeometry(0.75, 1.25, 3), mat(p2, { emissive: p2, emissiveIntensity: 0.35 }));
      glassGable.position.set(0, 0.68, 0.72);
      // Tall Riverstone Chimney
      const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.26, 1.95, 0.26), mat(p3));
      chimney.position.set(0.58, 0.98, -0.25);
      b.add(aframe, glassGable, chimney);
      break;
    }

    case 'building-moroccan-kasbah-fortress': {
      // Central Keep + Four Inward-Tapering Terracotta Corner Towers with Horn Merlons
      const centerKeep = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.05, 1.15), mat(p0));
      centerKeep.position.y = 0.52;
      b.add(centerKeep);

      [[-0.62, -0.62], [0.62, -0.62], [-0.62, 0.62], [0.62, 0.62]].forEach(([x, z]) => {
        const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.38, 1.55, 4), mat(p0));
        tower.rotation.y = Math.PI / 4;
        tower.position.set(x, 0.78, z);
        const frieze = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.42), mat(p1));
        frieze.position.set(x, 1.38, z);
        b.add(tower, frieze);
      });
      break;
    }

    case 'building-polynesian-longhouse': {
      // Pile Stilts + Carved Chamber + Dramatically Upswept Saddleback Roof
      [-0.65, 0, 0.65].forEach((x) => {
        [-0.32, 0.32].forEach((z) => {
          const stilt = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.65, 6), mat(p3));
          stilt.position.set(x, 0.32, z);
          b.add(stilt);
        });
      });
      const chamber = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.48, 0.78), mat(p1));
      chamber.position.y = 0.85;
      // Saddleback Roof made of two angled intersecting prows
      const prowL = new THREE.Mesh(new THREE.ConeGeometry(0.58, 1.45, 4), mat(p0));
      prowL.position.set(-0.62, 1.45, 0);
      prowL.rotation.z = 0.68;
      const prowR = new THREE.Mesh(new THREE.ConeGeometry(0.58, 1.45, 4), mat(p0));
      prowR.position.set(0.62, 1.45, 0);
      prowR.rotation.z = -0.68;
      b.add(chamber, prowL, prowR);
      break;
    }

    case 'building-steampunk-clockwork-foundry': {
      // Riveted Copper Boiler Dome + 3 External Interlocking Brass Gears + Twin Stacks
      const baseHall = new THREE.Mesh(new THREE.BoxGeometry(1.45, 1.05, 1.25), mat(p2));
      baseHall.position.y = 0.52;
      const boilerDome = new THREE.Mesh(new THREE.SphereGeometry(0.62, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat(p1, { metalness: 0.65, roughness: 0.3 }));
      boilerDome.position.set(-0.15, 1.05, 0);
      // Twin Brass Exhaust Stacks
      [-0.25, 0.25].forEach((z) => {
        const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 1.95, 8), mat(p0, { metalness: 0.75 }));
        stack.position.set(0.52, 0.98, z);
        b.add(stack);
      });
      // Three External Interlocking Brass Cogwheels
      [[-0.38, 0.65, 0.38], [0.15, 0.85, 0.28], [0.48, 0.48, 0.24]].forEach(([x, y, rad]) => {
        const cog = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, 0.1, 12), mat(p0, { metalness: 0.8, roughness: 0.2 }));
        cog.rotation.x = Math.PI / 2;
        cog.position.set(x, y, 0.66);
        b.add(cog);
      });
      b.add(baseHall, boilerDome);
      break;
    }

    case 'building-arcane-mage-sanctum': {
      // Flared Stone Wizard Tower + Levitating Detached Roof Spire + Orbiting Mana Crystals
      const lowerShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.72, 1.35, 8), mat(p2));
      lowerShaft.position.y = 0.68;
      // Glowing Arcane Core in the Levitation Gap
      const coreOrb = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), mat(p1, { emissive: p1, emissiveIntensity: 0.6 }));
      coreOrb.position.y = 1.65;
      // Detached Levitating Upper Turret & Conical Roof
      const upperTurret = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.38, 0.45, 8), mat(p2));
      upperTurret.position.y = 2.12;
      const spireRoof = new THREE.Mesh(new THREE.ConeGeometry(0.56, 0.92, 8), mat(p0));
      spireRoof.position.y = 2.78;
      b.add(lowerShaft, coreOrb, upperTurret, spireRoof);

      // 3 Orbiting Amethyst Shards
      for (let c = 0; c < 3; c++) {
        const a = (c / 3) * Math.PI * 2;
        const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.15, 0), mat(p1, { emissive: p1, emissiveIntensity: 0.45 }));
        shard.scale.set(0.7, 1.6, 0.7);
        shard.position.set(Math.cos(a) * 0.78, 1.65, Math.sin(a) * 0.78);
        b.add(shard);
      }
      break;
    }

    case 'building-elven-tree-observatory': {
      // 4 Spiraling Silver-Bark Trunks Cradling a Leaf Pavilion & Golden Canopy
      for (let t = 0; t < 4; t++) {
        const a = (t / 4) * Math.PI * 2;
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.16, 1.65, 7), mat(p0));
        trunk.position.set(Math.cos(a) * 0.38, 0.82, Math.sin(a) * 0.38);
        trunk.rotation.z = Math.cos(a) * 0.18;
        b.add(trunk);
      }
      const pavilion = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.52, 0.45, 8), mat(p3));
      pavilion.position.y = 1.45;
      const leafRoof = new THREE.Mesh(new THREE.ConeGeometry(0.88, 0.72, 6), mat(p2));
      leafRoof.position.y = 1.98;
      const canopy = new THREE.Mesh(new THREE.DodecahedronGeometry(0.82), mat(p1));
      canopy.scale.set(1.25, 0.65, 1.25);
      canopy.position.y = 1.65;
      b.add(canopy, pavilion, leafRoof);
      break;
    }

    case 'building-dwarven-anvil-forge': {
      // Heavy Basalt Pedestal + Colossal Anvil Roof Silhouette + Molten Magma Troughs
      const forgeBase = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.85, 1.15), mat(p0));
      forgeBase.position.y = 0.42;
      const anvilWaist = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.38, 0.82), mat(p2, { metalness: 0.65 }));
      anvilWaist.position.y = 1.02;
      const anvilTop = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.42, 0.96), mat(p0, { metalness: 0.45 }));
      anvilTop.position.set(-0.12, 1.42, 0);
      const anvilHorn = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.78, 4), mat(p0, { metalness: 0.45 }));
      anvilHorn.rotation.z = -Math.PI / 2;
      anvilHorn.position.set(1.02, 1.42, 0);
      // Glowing Magma Smelter Mouth
      const magmaCore = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.52, 1.22), mat(p1, { emissive: p1, emissiveIntensity: 0.55 }));
      magmaCore.position.y = 0.32;
      b.add(forgeBase, anvilWaist, anvilTop, anvilHorn, magmaCore);
      break;
    }

    // =====================================================================
    // E. Future-Tech, Space & Eco-Infrastructure (BD-91 to BD-100)
    // =====================================================================
    case 'building-tokamak-fusion-reactor': {
      // Glowing Cyan Plasma Torus + 12 Copper Poloidal Field Coils
      const plasmaTorus = new THREE.Mesh(
        new THREE.TorusGeometry(0.68, 0.24, 16, 32),
        mat(p0, { emissive: p0, emissiveIntensity: 0.55 })
      );
      plasmaTorus.rotation.x = Math.PI / 2;
      plasmaTorus.position.y = 0.68;
      b.add(plasmaTorus);

      for (let c = 0; c < 12; c++) {
        const a = (c / 12) * Math.PI * 2;
        const coil = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.045, 6, 12), mat(p2, { metalness: 0.75 }));
        coil.position.set(Math.cos(a) * 0.68, 0.68, Math.sin(a) * 0.68);
        coil.rotation.y = -a;
        b.add(coil);
      }
      const centerSolenoid = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 1.45, 16), mat(p1));
      centerSolenoid.position.y = 0.72;
      b.add(centerSolenoid);
      break;
    }

    case 'building-lunar-regolith-hab': {
      // 3D-Printed Ribbed Regolith Dome + Dual Pressurized Airlock Cylinders + Solar Wings
      for (let r = 0; r < 6; r++) {
        const rad = 0.98 - r * 0.14;
        const ring = new THREE.Mesh(new THREE.CylinderGeometry(rad - 0.06, rad, 0.18, 20), mat(p0));
        ring.position.y = 0.09 + r * 0.17;
        b.add(ring);
      }
      const cupola = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.14, 12), mat(p2, { metalness: 0.8 }));
      cupola.position.y = 1.15;
      const airlock = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.75, 12), mat(p1));
      airlock.rotation.x = Math.PI / 2;
      airlock.position.set(0, 0.28, 0.92);
      const hatch = new THREE.Mesh(new THREE.CircleGeometry(0.22, 12), mat(p2, { metalness: 0.85 }));
      hatch.position.set(0, 0.28, 1.3);
      b.add(cupola, airlock, hatch);
      break;
    }

    case 'building-vertical-forest-eco-tower': {
      // Dark Charcoal Tower Core + 12 Staggered Cantilevered White Balconies with Green Trees
      const core = new THREE.Mesh(new THREE.BoxGeometry(0.88, 2.55, 0.88), mat(p3));
      core.position.y = 1.28;
      b.add(core);

      for (let f = 0; f < 7; f++) {
        const y = 0.35 + f * 0.34;
        const side = f % 2 === 0 ? 1 : -1;
        const tray1 = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.1, 0.55), mat(p2));
        tray1.position.set(side * 0.45, y, 0.25);
        const tree1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22), mat(f % 2 === 0 ? p0 : p1));
        tree1.position.set(side * 0.52, y + 0.2, 0.25);

        const tray2 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.1, 0.48), mat(p2));
        tray2.position.set(-0.2, y + 0.15, -side * 0.45);
        const tree2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2), mat(p0));
        tree2.position.set(-0.2, y + 0.35, -side * 0.52);
        b.add(tray1, tree1, tray2, tree2);
      }
      break;
    }

    case 'building-orbital-dish-array': {
      // Turret Bunker Base + Giant Tilted Parabolic Dish + Feed Horn Spire
      const bunker = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.78, 0.55, 12), mat(p1));
      bunker.position.y = 0.28;
      const mount = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.65, 0.45), mat(p2));
      mount.position.y = 0.78;

      const dishGroup = new THREE.Group();
      dishGroup.position.set(0, 1.25, 0);
      dishGroup.rotation.x = -0.55;
      const dish = new THREE.Mesh(
        new THREE.SphereGeometry(1.05, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.38),
        mat(p0, { side: THREE.DoubleSide })
      );
      dish.rotation.x = Math.PI;
      dish.position.y = 0.85;
      const horn = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.12, 0.85, 8), mat(p2));
      horn.position.y = 0.45;
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), mat(p3, { emissive: p3, emissiveIntensity: 0.6 }));
      beacon.position.y = 0.9;
      dishGroup.add(dish, horn, beacon);
      b.add(bunker, mount, dishGroup);
      break;
    }

    case 'building-quantum-cryo-computing-core': {
      // Multi-Tiered Golden Dilution Chandelier Inside Cylindrical Glass Vault
      const baseDrum = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.98, 0.24, 24), mat(p1));
      baseDrum.position.y = 0.12;
      const topCap = new THREE.Mesh(new THREE.CylinderGeometry(0.98, 0.95, 0.22, 24), mat(p1));
      topCap.position.y = 2.05;
      b.add(baseDrum, topCap);

      // 5 Descending Gold-Plated Chandelier Stages
      for (let s = 0; s < 5; s++) {
        const rad = 0.68 - s * 0.11;
        const y = 1.75 - s * 0.3;
        const plate = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, 0.06, 20), mat(p0, { metalness: 0.85, roughness: 0.18 }));
        plate.position.y = y;
        const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.3, 8), mat(p0, { metalness: 0.8 }));
        rod.position.y = y + 0.15;
        b.add(plate, rod);
      }
      // Glowing Cyan Qubit Core at Bottom of Chandelier
      const qubit = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 1), mat(p2, { emissive: p2, emissiveIntensity: 0.65 }));
      qubit.position.y = 0.38;
      const glassCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.92, 1.75, 24), createGlassMat(p2, 0.38));
      glassCyl.position.y = 1.08;
      b.add(qubit, glassCyl);
      break;
    }

    case 'building-hydroponic-spiral-agritower': {
      // Glowing Magenta LED Core + Double-Helix Spiraling Green Crop Pods + Top Funnel
      const ledCore = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 2.35, 12), mat(p1, { emissive: p1, emissiveIntensity: 0.45 }));
      ledCore.position.y = 1.18;
      const funnel = new THREE.Mesh(new THREE.ConeGeometry(0.78, 0.38, 16, 1, true), mat(p2, { side: THREE.DoubleSide }));
      funnel.rotation.x = Math.PI;
      funnel.position.y = 2.42;
      b.add(ledCore, funnel);

      for (let p = 0; p < 12; p++) {
        const a = p * 0.62;
        const y = 0.25 + p * 0.17;
        const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.12, 10), mat(p0));
        pod.position.set(Math.cos(a) * 0.48, y, Math.sin(a) * 0.48);
        b.add(pod);
      }
      break;
    }

    case 'building-geothermal-cooling-towers': {
      // Twin Waisted Hyperbolic Concrete Cooling Towers + Red Turbine Hall + Blue Lagoon
      const towerPts = [
        new THREE.Vector2(0.46, 0),
        new THREE.Vector2(0.28, 0.95),
        new THREE.Vector2(0.36, 1.55),
      ];
      const towerGeo = new THREE.LatheGeometry(towerPts, 16);
      [-0.48, 0.42].forEach((x, idx) => {
        const tower = new THREE.Mesh(towerGeo, mat(p0));
        tower.position.set(x, 0, -0.25 + idx * 0.2);
        const steam = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28), mat(p3));
        steam.position.set(x, 1.72, -0.25 + idx * 0.2);
        b.add(tower, steam);
      });
      const hall = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.65, 0.72), mat(p1));
      hall.position.set(0.15, 0.32, 0.55);
      const lagoon = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.06, 16), createWaterMat(p2));
      lagoon.position.set(-0.55, 0.03, 0.55);
      b.add(hall, lagoon);
      break;
    }

    case 'building-maglev-aerodynamic-station': {
      // V-Shaped Concrete Piers + Elevated Streamlined Elliptical Tube + Glowing Cyan Track
      [-0.65, 0.65].forEach((x) => {
        const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.85, 0.22), mat(p3));
        leg1.position.set(x, 0.42, -0.22);
        leg1.rotation.x = -0.35;
        const leg2 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.85, 0.22), mat(p3));
        leg2.position.set(x, 0.42, 0.22);
        leg2.rotation.x = 0.35;
        b.add(leg1, leg2);
      });
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 2.15, 16), mat(p0, { metalness: 0.6, roughness: 0.25 }));
      tube.rotation.z = Math.PI / 2;
      tube.scale.set(0.85, 1, 1.15);
      tube.position.y = 1.05;
      const track = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.1, 0.36), mat(p1, { emissive: p1, emissiveIntensity: 0.45 }));
      track.position.y = 0.88;
      b.add(tube, track);
      break;
    }

    case 'building-bionic-coral-arcology': {
      // Twin Organic Tapered Bio-Towers with Voronoi Exoskeleton + 2 Sky-Garden Bridges
      [-0.48, 0.48].forEach((x, idx) => {
        const h = idx === 0 ? 2.35 : 1.95;
        const bioCore = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.45, h, 10), mat(p1));
        bioCore.position.set(x, h / 2, 0);
        const voronoi = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.48, h, 8, 4), mat(p0, { wireframe: true }));
        voronoi.position.set(x, h / 2, 0);
        b.add(bioCore, voronoi);
      });
      // Suspended Sky-Garden Bridges
      [0.85, 1.48].forEach((y) => {
        const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.14, 0.32), mat(p0));
        bridge.position.set(0, y, 0);
        const greenStrip = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.08, 0.28), mat(p1));
        greenStrip.position.set(0, y + 0.1, 0);
        b.add(bridge, greenStrip);
      });
      break;
    }

    case 'building-solar-updraft-chimney': {
      // Broad Circular Glass Solar Collector Skirt + Ultra-Slender Tall White Updraft Chimney
      const basaltFloor = new THREE.Mesh(new THREE.CylinderGeometry(1.38, 1.42, 0.08, 24), mat(p3));
      basaltFloor.position.y = 0.04;
      const glassSkirt = new THREE.Mesh(new THREE.ConeGeometry(1.38, 0.42, 24), createGlassMat(p1, 0.58));
      glassSkirt.position.y = 0.28;
      const turbineRing = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.08, 8, 16), mat(p2, { metalness: 0.7 }));
      turbineRing.rotation.x = Math.PI / 2;
      turbineRing.position.y = 0.48;
      const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.32, 2.65, 16), mat(p0));
      chimney.position.y = 1.35;
      const crownRing = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.04, 8, 16), mat(p2));
      crownRing.rotation.x = Math.PI / 2;
      crownRing.position.y = 2.68;
      b.add(basaltFloor, glassSkirt, turbineRing, chimney, crownRing);
      break;
    }

    // =====================================================================
    // Distinct Typologies for BD-01 to BD-50 (12 Varied Architectural Archetypes)
    // =====================================================================
    default: {
      // Extract deterministic index from id or slug so every BD-01..BD-50 also gets a unique silhouette
      const numMatch = island.id.match(/\d+/);
      const idx = numMatch ? parseInt(numMatch[0], 10) % 10 : 0;

      if (idx === 1) {
        // Barrel-Vaulted Sports Hall with Clerestory & Cantilever Canopy
        const hall = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.95, 1.35), mat(p0));
        hall.position.y = 0.48;
        const vault = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 1.78, 12, 1, false, 0, Math.PI), mat(p3, { metalness: 0.4 }));
        vault.rotation.z = Math.PI / 2;
        vault.position.y = 0.95;
        const canopy = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.1, 0.48), mat(p1));
        canopy.position.set(0, 0.58, 0.82);
        b.add(hall, vault, canopy);
      } else if (idx === 2) {
        // Wave-Roof Natatorium / Glass Curtain Hall + Tower
        const poolHall = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.85, 1.35), createGlassMat(p0, 0.72));
        poolHall.position.y = 0.42;
        const wave1 = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 1.72, 10, 1, false, 0, Math.PI), mat(p1));
        wave1.rotation.z = Math.PI / 2;
        wave1.position.set(0, 0.85, -0.28);
        const wave2 = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 1.72, 10, 1, false, 0, Math.PI), mat(p1));
        wave2.rotation.z = Math.PI / 2;
        wave2.position.set(0, 0.85, 0.28);
        b.add(poolHall, wave1, wave2);
      } else if (idx === 3) {
        // Gabled Clubhouse with Wrap-Around Upper Observation Deck
        const base = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.65, 1.35), mat(p1));
        base.position.y = 0.32;
        const deck = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.08, 1.65), mat(p3));
        deck.position.y = 0.68;
        const upper = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.55, 0.98), mat(p1));
        upper.position.y = 0.98;
        const roof = new THREE.Mesh(new THREE.ConeGeometry(0.92, 0.52, 4), mat(p0));
        roof.rotation.y = Math.PI / 4;
        roof.position.y = 1.5;
        b.add(base, deck, upper, roof);
      } else if (idx === 4) {
        // Sawtooth Factory / Bakery / Studio with Brick Chimney or Silo
        const hall = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.85, 1.25), mat(p0));
        hall.position.set(-0.2, 0.42, 0);
        [-0.38, 0.18].forEach((z) => {
          const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.45, 4), mat(p1));
          tooth.rotation.y = Math.PI / 4;
          tooth.position.set(-0.2, 1.05, z);
          b.add(tooth);
        });
        const silo = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 1.65, 12), mat(p2, { metalness: 0.55 }));
        silo.position.set(0.75, 0.82, 0);
        b.add(hall, silo);
      } else if (idx === 5) {
        // Geodesic / Spherical Dome Facility with Entry Tunnel
        const dome = new THREE.Mesh(new THREE.IcosahedronGeometry(0.98, 1), mat(p0));
        dome.scale.set(1, 0.85, 1);
        dome.position.y = 0.65;
        const wire = new THREE.Mesh(new THREE.IcosahedronGeometry(1.0, 1), mat(p1, { wireframe: true }));
        wire.scale.set(1, 0.85, 1);
        wire.position.y = 0.65;
        const entry = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.52, 0.65), mat(p2));
        entry.position.set(0, 0.26, 0.85);
        b.add(dome, wire, entry);
      } else if (idx === 6) {
        // Twin-Tower Stepped Commercial / Boutique Building with Skybridge
        const t1 = new THREE.Mesh(new THREE.BoxGeometry(0.68, 1.65, 0.85), mat(p0));
        t1.position.set(-0.48, 0.82, 0);
        const t2 = new THREE.Mesh(new THREE.BoxGeometry(0.68, 1.25, 0.85), mat(p1));
        t2.position.set(0.48, 0.62, 0);
        const skybridge = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.28, 0.45), createGlassMat(p2, 0.75));
        skybridge.position.set(0, 0.95, 0);
        b.add(t1, t2, skybridge);
      } else if (idx === 7) {
        // Circular Clarifier / Rotunda Pavilion with Radial Truss
        const ringWall = new THREE.Mesh(new THREE.CylinderGeometry(0.98, 1.02, 0.65, 20), mat(p1));
        ringWall.position.y = 0.32;
        const innerCore = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.25, 16), mat(p0));
        innerCore.position.y = 0.62;
        const bridge = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.14, 0.24), mat(p2));
        bridge.position.y = 0.72;
        b.add(ringWall, innerCore, bridge);
      } else if (idx === 8) {
        // A-Frame / Gambrel Barn / Workshop with Cupola
        const body = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.78, 1.35), mat(p0));
        body.position.y = 0.39;
        const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.95, 0.65, 4), mat(p1));
        roof.rotation.y = Math.PI / 4;
        roof.position.y = 1.08;
        const cupola = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.38, 0.36), mat(p2));
        cupola.position.y = 1.52;
        b.add(body, roof, cupola);
      } else if (idx === 9) {
        // High-Tech Control Tower + Concourse Hangar
        const concourse = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.68, 1.15), mat(p1));
        concourse.position.set(-0.18, 0.34, 0);
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 1.75, 8), mat(p0));
        shaft.position.set(0.68, 0.88, -0.25);
        const cab = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.34, 0.38, 8), createGlassMat(p2, 0.8));
        cab.position.set(0.68, 1.88, -0.25);
        b.add(concourse, shaft, cab);
      } else {
        // Cantilevered Modernist Gallery / Showroom with Awning & Skylight
        const lower = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.75, 1.35), mat(p0));
        lower.position.y = 0.38;
        const upper = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.68, 1.15), mat(p1));
        upper.position.set(0.22, 1.08, 0.12);
        const skylight = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.42, 4), createGlassMat(p2, 0.7));
        skylight.rotation.y = Math.PI / 4;
        skylight.position.set(0.22, 1.62, 0.12);
        b.add(lower, upper, skylight);
      }
      break;
    }
  }

  master.add(b);
  return master;
}
