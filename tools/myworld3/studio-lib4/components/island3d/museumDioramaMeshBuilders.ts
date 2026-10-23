import * as THREE from 'three';
import { IslandMetadata, IslandVariant } from '../../types/island';
import { createGlassMat, createWaterMat, createTree } from './materials';

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
 * Creates the base architectural gallery foundation slab for Museum Interior Compositions.
 * High-end architectural foundation floor with beveled plinths, recessed perimeter glow, or natural wood/stone finish.
 */
function createGalleryFloorSlab(
  palette: IslandMetadata['palette'],
  slabRadius: number = 4.8,
  slabHeight: number = 0.25,
  rimColorHex?: string
): THREE.Group {
  const g = new THREE.Group();
  const baseColor = palette[0]?.hex || '#1E293B';
  const accentRim = rimColorHex || palette[2]?.hex || '#D4AF37';

  // Sub-foundation ring
  const lowerGeo = new THREE.CylinderGeometry(slabRadius + 0.15, slabRadius + 0.25, 0.2, 32);
  const lowerMesh = new THREE.Mesh(lowerGeo, mat('#0F172A', { roughness: 0.85 }));
  lowerMesh.position.y = -0.1;
  lowerMesh.receiveShadow = true;
  g.add(lowerMesh);

  // Main gallery floor slab
  const upperGeo = new THREE.CylinderGeometry(slabRadius, slabRadius + 0.05, slabHeight, 32);
  const upperMesh = new THREE.Mesh(upperGeo, mat(baseColor, { roughness: 0.5 }));
  upperMesh.position.y = slabHeight / 2;
  upperMesh.receiveShadow = true;
  g.add(upperMesh);

  // Inlaid perimeter edge band
  const bandGeo = new THREE.TorusGeometry(slabRadius - 0.1, 0.035, 6, 32);
  const bandMesh = new THREE.Mesh(bandGeo, mat(accentRim, { metalness: 0.7, roughness: 0.3 }));
  bandMesh.rotation.x = Math.PI / 2;
  bandMesh.position.y = slabHeight + 0.01;
  g.add(bandMesh);

  return g;
}

/**
 * 20 Grand Museum Interior Exhibition Compositions (diorama_museum_01 to diorama_museum_20)
 * Richly detailed low-poly interior scenes capturing the spatial volume, exhibition architecture,
 * display stands, hero artifacts, lighting rigs, and viewer circulation.
 */
export function buildMuseumDioramaScene(
  island: IslandMetadata,
  variant: IslandVariant = 'classic'
): THREE.Group {
  const root = new THREE.Group();

  const p0 = island.palette[0]?.hex || '#1E293B';
  const p1 = island.palette[1]?.hex || '#38BDF8';
  const p2 = island.palette[2]?.hex || '#F59E0B';
  const p3 = island.palette[3]?.hex || '#10B981';

  // 1. Add base architectural gallery floor
  const floorSlab = createGalleryFloorSlab(island.palette, 4.6, 0.24, p2);
  root.add(floorSlab);

  const room = new THREE.Group();
  room.position.y = 0.24; // Align to top of floor slab

  switch (island.slug) {
    // -----------------------------------------------------------------------
    // 01. Neoclassical Statuary & Rotunda Hall Interior
    // -----------------------------------------------------------------------
    case 'diorama-museum-classical-statuary': {
      // Curved rotunda rear wall with 3 arched statuary niches
      const wallCurve = new THREE.Group();
      for (let i = -2; i <= 2; i++) {
        const ang = (i * Math.PI) / 8;
        const pilaster = new THREE.Mesh(new THREE.BoxGeometry(0.35, 3.4, 0.35), mat(p0));
        pilaster.position.set(Math.sin(ang) * 3.8, 1.7, -Math.cos(ang) * 3.8);
        wallCurve.add(pilaster);
      }
      // Wall panels between pilasters
      for (let i = -1.5; i <= 1.5; i += 1) {
        const ang = (i * Math.PI) / 8;
        const panel = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3.2, 0.15), mat('#E2E8F0'));
        panel.position.set(Math.sin(ang) * 3.85, 1.6, -Math.cos(ang) * 3.85);
        panel.rotation.y = -ang;

        // Arched recess niche in center panels
        const niche = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 1.2, 12, 1, false, 0, Math.PI), mat('#CBD5E1'));
        niche.rotation.y = Math.PI / 2;
        niche.position.set(0, 0.2, 0.1);
        panel.add(niche);

        // Classical bust inside niche
        const bustHead = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), mat('#FFFFFF'));
        bustHead.position.set(0, 0.35, 0.15);
        const bustChest = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.25, 7), mat('#FFFFFF'));
        bustChest.rotation.x = Math.PI;
        bustChest.position.set(0, 0.1, 0.15);
        panel.add(bustHead, bustChest);

        wallCurve.add(panel);
      }
      room.add(wallCurve);

      // Checkerboard marble floor tiles (black & white grid)
      const tileGrid = new THREE.Group();
      for (let x = -3; x <= 3; x++) {
        for (let z = -3; z <= 3; z++) {
          if (x * x + z * z <= 12) {
            const isWhite = (x + z) % 2 === 0;
            const tile = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.02, 0.75), mat(isWhite ? '#F8FAFC' : '#1E293B', { roughness: 0.35 }));
            tile.position.set(x * 0.8, 0.01, z * 0.8);
            tileGrid.add(tile);
          }
        }
      }
      room.add(tileGrid);

      // Central Venus Statuary Plinth
      const plinthBase = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.72, 0.5, 16), mat(p0));
      plinthBase.position.y = 0.25;
      const statueTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 0.9, 10), mat('#FFFFFF'));
      statueTorso.position.y = 0.95;
      const statueHead = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 10), mat('#FFFFFF'));
      statueHead.position.y = 1.55;
      const drapedToga = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.7, 10), mat('#F1F5F9'));
      drapedToga.position.y = 0.65;
      room.add(plinthBase, statueTorso, statueHead, drapedToga);

      // Brass velvet rope stanchions around central sculpture
      for (let i = 0; i < 6; i++) {
        const ang = (i * Math.PI * 2) / 6;
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.7, 8), mat(p2, { metalness: 0.85, roughness: 0.2 }));
        post.position.set(Math.sin(ang) * 1.45, 0.35, Math.cos(ang) * 1.45);
        const ball = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), mat(p2, { metalness: 0.9 }));
        ball.position.set(Math.sin(ang) * 1.45, 0.72, Math.cos(ang) * 1.45);
        room.add(post, ball);
      }
      break;
    }

    // -----------------------------------------------------------------------
    // 02. Paleontology Great Hall & Dinosaur Skeleton Interior
    // -----------------------------------------------------------------------
    case 'diorama-museum-dinosaur-atrium': {
      // Victorian arched iron trusses overhead
      [-2.2, 0, 2.2].forEach((z) => {
        const arch = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.12, 6, 16, Math.PI), mat(p2, { metalness: 0.8 }));
        arch.position.set(0, 1.2, z);
        const colL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 3.2, 0.35), mat(p0));
        colL.position.set(-3.6, 1.6, z);
        const colR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 3.2, 0.35), mat(p0));
        colR.position.set(3.6, 1.6, z);
        room.add(arch, colL, colR);
      });

      // Terracotta brick rear gallery wall
      const brickWall = new THREE.Mesh(new THREE.BoxGeometry(7.2, 3.2, 0.3), mat(p0));
      brickWall.position.set(0, 1.6, -3.4);
      room.add(brickWall);

      // Colossal Sauropod Dinosaur Fossil Skeleton Mount!
      const dinoGroup = new THREE.Group();
      dinoGroup.position.set(0, 0, 0);

      // Pelvis & Spine Arch
      const boneMat = mat(p1, { roughness: 0.75 });
      const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.5, 0.8), boneMat);
      pelvis.position.set(0, 1.6, 0);
      dinoGroup.add(pelvis);

      // Ribcage
      for (let r = -0.6; r <= 0.6; r += 0.25) {
        const rib = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.05, 6, 10, Math.PI), boneMat);
        rib.rotation.y = Math.PI / 2;
        rib.position.set(0, 1.5, r);
        dinoGroup.add(rib);
      }

      // Long curving neck & skull
      for (let n = 0; n < 6; n++) {
        const vert = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.35, 6), boneMat);
        vert.rotation.x = -0.4;
        vert.position.set(0, 1.8 + n * 0.25, 0.8 + n * 0.3);
        dinoGroup.add(vert);
      }
      const skull = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.2, 0.42), boneMat);
      skull.position.set(0, 3.3, 2.7);
      dinoGroup.add(skull);

      // Long sweeping tail
      for (let t = 0; t < 6; t++) {
        const tailVert = new THREE.Mesh(new THREE.CylinderGeometry(0.08 - t * 0.01, 0.09 - t * 0.01, 0.4, 6), boneMat);
        tailVert.rotation.x = 0.5;
        tailVert.position.set(Math.sin(t * 0.4) * 0.25, 1.4 - t * 0.16, -0.6 - t * 0.4);
        dinoGroup.add(tailVert);
      }

      // 4 Pillar-like Fossil Legs
      const legPositions = [
        [-0.55, 0.75, 0.45],
        [0.55, 0.75, 0.45],
        [-0.55, 0.75, -0.45],
        [0.55, 0.75, -0.45],
      ];
      legPositions.forEach(([lx, ly, lz]) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 1.5, 8), boneMat);
        leg.position.set(lx, ly, lz);
        dinoGroup.add(leg);
      });

      // Black steel mounting armature rods
      const armature = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.8, 6), mat('#0F172A', { metalness: 0.9 }));
      armature.position.set(0, 0.9, 0);
      dinoGroup.add(armature);
      room.add(dinoGroup);

      // Perimeter Amber & Fossil Specimen Vitrines
      [-2.6, 2.6].forEach((vx) => {
        const vBase = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 1.6), mat(p0));
        vBase.position.set(vx, 0.35, 0);
        const vGlass = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.55, 1.5), createGlassMat(p3, 0.65));
        vGlass.position.set(vx, 0.95, 0);
        const amberRock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.16, 0), mat(p3, { emissive: p3, emissiveIntensity: 0.4 }));
        amberRock.position.set(vx, 0.85, 0);
        room.add(vBase, vGlass, amberRock);
      });
      break;
    }

    // -----------------------------------------------------------------------
    // 03. Contemporary White Cube & Kinetic Sculpture Interior
    // -----------------------------------------------------------------------
    case 'diorama-museum-contemporary-white-cube': {
      // Pristine white gallery partition walls
      const backWall = new THREE.Mesh(new THREE.BoxGeometry(6.4, 3.2, 0.2), mat('#FFFFFF'));
      backWall.position.set(0, 1.6, -3.2);
      const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.2, 5.0), mat('#FFFFFF'));
      leftWall.position.set(-3.2, 1.6, -0.7);
      room.add(backWall, leftWall);

      // Ceiling track spotlight grid
      const track1 = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.05, 0.05), mat('#0F172A'));
      track1.position.set(0, 3.1, -1.0);
      const track2 = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.05, 0.05), mat('#0F172A'));
      track2.position.set(0, 3.1, 1.0);
      room.add(track1, track2);

      // Giant Colorfield Minimalist Canvas on Wall
      const canvas1 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.8, 0.05), mat(p2, { roughness: 0.9 }));
      canvas1.position.set(-0.5, 1.8, -3.05);
      const canvas2 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 0.05), mat(p1, { roughness: 0.9 }));
      canvas2.position.set(-3.05, 1.8, 0.2);
      canvas2.rotation.y = Math.PI / 2;
      room.add(canvas1, canvas2);

      // Suspended Red Calder-inspired Kinetic Mobile
      const mobileGroup = new THREE.Group();
      mobileGroup.position.set(0.6, 2.5, 0.2);
      const wireMain = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.8, 4), mat('#0F172A'));
      wireMain.position.y = -0.4;
      mobileGroup.add(wireMain);

      const arm1 = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.8, 6), mat('#0F172A'));
      arm1.rotation.z = Math.PI / 2;
      arm1.position.set(0, -0.8, 0);
      const petal1 = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.02, 12), mat(p2));
      petal1.position.set(-0.9, -0.8, 0);
      const petal2 = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.45, 3), mat(p0));
      petal2.position.set(0.9, -0.8, 0);
      mobileGroup.add(arm1, petal1, petal2);

      const arm2 = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.2, 6), mat('#0F172A'));
      arm2.rotation.z = Math.PI / 2.2;
      arm2.rotation.y = 0.8;
      arm2.position.set(0.4, -1.2, 0);
      const petal3 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 0), mat('#F59E0B'));
      petal3.position.set(0.8, -1.3, 0.3);
      mobileGroup.add(arm2, petal3);
      room.add(mobileGroup);

      // Floating modern geometric bench
      const bench = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.32, 0.6), mat('#F1F5F9', { roughness: 0.2 }));
      bench.position.set(0.5, 0.16, 2.0);
      room.add(bench);
      break;
    }

    // -----------------------------------------------------------------------
    // 04. Apollo Lunar Exploration & Space Hangar Interior
    // -----------------------------------------------------------------------
    case 'diorama-museum-aerospace-lunar-lander': {
      // Dark deep space curved backdrops
      const spaceDome = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.4, 3.2, 24, 1, true, -Math.PI / 2, Math.PI), mat(p0));
      spaceDome.position.set(0, 1.6, 0);
      room.add(spaceDome);

      // Textured Lunar Regolith mound bed
      const regolith = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.8, 0.15, 20), mat(p2, { roughness: 0.95 }));
      regolith.position.set(0, 0.08, 0.2);
      room.add(regolith);

      // Apollo Lunar Module (LEM)
      const lemGroup = new THREE.Group();
      lemGroup.position.set(-0.2, 0.15, 0.2);

      // Gold-foil descent stage (octagonal prism)
      const descentStage = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.95, 0.65, 8), mat(p1, { metalness: 0.85, roughness: 0.3 }));
      descentStage.position.y = 0.65;
      lemGroup.add(descentStage);

      // 4 Landing Struts with Footpads
      for (let s = 0; s < 4; s++) {
        const ang = (s * Math.PI) / 2 + Math.PI / 4;
        const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 1.0, 6), mat(p1, { metalness: 0.9 }));
        strut.rotation.z = 0.55;
        strut.rotation.y = ang;
        strut.position.set(Math.sin(ang) * 0.95, 0.35, Math.cos(ang) * 0.95);
        const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.04, 10), mat(p1, { metalness: 0.9 }));
        pad.position.set(Math.sin(ang) * 1.35, 0.02, Math.cos(ang) * 1.35);
        lemGroup.add(strut, pad);
      }

      // Ascent Stage (faceted crew cabin)
      const ascentStage = new THREE.Mesh(new THREE.DodecahedronGeometry(0.65, 0), mat('#E2E8F0', { metalness: 0.5 }));
      ascentStage.position.y = 1.35;
      const rendezvousRadar = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.02, 0.1, 8), mat(p1));
      rendezvousRadar.position.set(0, 1.95, 0);
      lemGroup.add(ascentStage, rendezvousRadar);
      room.add(lemGroup);

      // Freestanding Apollo Spacesuit Mannequin
      const suitBody = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.9, 8), mat('#FFFFFF'));
      suitBody.position.set(1.9, 0.6, 1.4);
      const suitHelmet = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), mat(p1, { metalness: 0.9, roughness: 0.1 }));
      suitHelmet.position.set(1.9, 1.15, 1.4);
      const backpackPLSS = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.45, 0.18), mat('#E2E8F0'));
      backpackPLSS.position.set(1.9, 0.75, 1.25);
      room.add(suitBody, suitHelmet, backpackPLSS);

      // Suspended Solar Research Satellite overhead
      const sat = new THREE.Group();
      sat.position.set(1.2, 2.7, -1.0);
      const satBody = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.6), mat(p1, { metalness: 0.8 }));
      const solarL = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.02, 0.45), mat('#0284C7', { metalness: 0.7 }));
      solarL.position.set(-0.8, 0, 0);
      const solarR = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.02, 0.45), mat('#0284C7', { metalness: 0.7 }));
      solarR.position.set(0.8, 0, 0);
      sat.add(satBody, solarL, solarR);
      room.add(sat);
      break;
    }

    // -----------------------------------------------------------------------
    // 05. Age of Exploration & Maritime Shipwreck Interior
    // -----------------------------------------------------------------------
    case 'diorama-museum-maritime-diving-bell': {
      // Weathered Timber Boardwalk gallery floor
      const plankCount = 10;
      for (let p = 0; p < plankCount; p++) {
        const plank = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.04, 0.42), mat(p0, { roughness: 0.9 }));
        plank.position.set(0, 0.02, -2.2 + p * 0.45);
        room.add(plank);
      }

      // Galleon Cutaway Hull ribs along back wall
      for (let i = -3; i <= 3; i++) {
        const rib = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.12, 6, 12, Math.PI * 0.5), mat('#451A03'));
        rib.rotation.y = Math.PI / 2;
        rib.position.set(i * 0.9, 1.2, -2.6);
        room.add(rib);
      }

      // Massive Historic Brass Diving Helmet on Display Pedestal
      const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 0.8, 12), mat(p3));
      pedestal.position.set(0, 0.4, 0.3);
      const helmetDome = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), mat(p1, { metalness: 0.88, roughness: 0.25 }));
      helmetDome.position.set(0, 1.05, 0.3);
      const viewingPort = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.03, 6, 12), mat(p1, { metalness: 0.9 }));
      viewingPort.position.set(0, 1.05, 0.58);
      const breastplate = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.42, 0.25, 10), mat(p1, { metalness: 0.85 }));
      breastplate.position.set(0, 0.85, 0.3);
      room.add(pedestal, helmetDome, viewingPort, breastplate);

      // Mooring Bollards and Coiled Rope
      [-1.8, 1.8].forEach((bx) => {
        const bollard = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.6, 8), mat('#334155'));
        bollard.position.set(bx, 0.3, 1.6);
        const coil = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.08, 6, 12), mat(p1));
        coil.rotation.x = Math.PI / 2;
        coil.position.set(bx, 0.08, 1.6);
        room.add(bollard, coil);
      });
      break;
    }

    // -----------------------------------------------------------------------
    // 06. Pharaoh’s Golden Sarcophagus Crypt Interior
    // -----------------------------------------------------------------------
    case 'diorama-museum-egyptian-crypt': {
      // Monumental Sandstone Pylon wall with carved hieroglyphic relief bands
      const rearPylon = new THREE.Mesh(new THREE.BoxGeometry(6.6, 3.4, 0.4), mat(p0));
      rearPylon.position.set(0, 1.7, -3.0);
      room.add(rearPylon);

      // Two Giant Sandstone Lotus-Capital Sanctuary Columns
      [-2.2, 2.2].forEach((cx) => {
        const colShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.45, 2.8, 12), mat(p0));
        colShaft.position.set(cx, 1.4, -1.2);
        const lotusCap = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.38, 0.5, 12), mat(p0));
        lotusCap.position.set(cx, 3.0, -1.2);
        room.add(colShaft, lotusCap);
      });

      // Central Black Basalt Sarcophagus Platform
      const basaltPlinth = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 2.6), mat(p2));
      basaltPlinth.position.set(0, 0.2, 0.2);
      room.add(basaltPlinth);

      // Gilded Egyptian Anthropoid Sarcophagus
      const sarcophagusBody = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.4, 2.1), mat(p1, { metalness: 0.88, roughness: 0.2 }));
      sarcophagusBody.position.set(0, 0.58, 0.2);
      const nemesHeaddress = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.32, 0.45, 8), mat(p1, { metalness: 0.9 }));
      nemesHeaddress.rotation.x = Math.PI / 2;
      nemesHeaddress.position.set(0, 0.65, -0.6);
      const goldenMask = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), mat(p1, { metalness: 0.95, roughness: 0.15 }));
      goldenMask.position.set(0, 0.72, -0.55);
      room.add(sarcophagusBody, nemesHeaddress, goldenMask);

      // Flanking Canopic Jar Vitrines
      [-1.8, 1.8].forEach((jx) => {
        const jBase = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.75, 0.6), mat(p2));
        jBase.position.set(jx, 0.375, 1.4);
        const jGlass = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.6, 0.55), createGlassMat('#38BDF8', 0.65));
        jGlass.position.set(jx, 1.05, 1.4);
        const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.35, 8), mat('#FEF08A'));
        jar.position.set(jx, 0.925, 1.4);
        room.add(jBase, jGlass, jar);
      });
      break;
    }

    // -----------------------------------------------------------------------
    // 07. Gemology & Earth Minerals Dark Vault Interior
    // -----------------------------------------------------------------------
    case 'diorama-museum-mineral-crystal-vault': {
      // Dark Charcoal Acoustic Cylindrical Vault Wall
      const darkWall = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.4, 3.2, 24, 1, true, -Math.PI / 2, Math.PI), mat(p0));
      darkWall.position.set(0, 1.6, 0);
      room.add(darkWall);

      // Hero Giant Split Purple Amethyst Geode
      const geodeGroup = new THREE.Group();
      geodeGroup.position.set(0, 0, -0.2);

      // Rough outer basalt rock shell
      const rockShell = new THREE.Mesh(new THREE.SphereGeometry(1.2, 10, 8, 0, Math.PI, 0, Math.PI), mat('#1E293B', { roughness: 0.9 }));
      rockShell.rotation.x = Math.PI / 2;
      rockShell.position.y = 1.0;
      geodeGroup.add(rockShell);

      // Sparkling inner amethyst quartz crystals
      for (let c = 0; c < 24; c++) {
        const crystal = new THREE.Mesh(
          new THREE.ConeGeometry(0.12, 0.35, 5),
          mat(p1, { emissive: p1, emissiveIntensity: 0.45, roughness: 0.2 })
        );
        const ang = (c * Math.PI * 2) / 24;
        const dist = 0.5 + (c % 3) * 0.2;
        crystal.position.set(Math.cos(ang) * dist, 1.0 + Math.sin(ang) * dist * 0.7, 0.2 - (c % 2) * 0.1);
        crystal.rotation.z = -ang;
        geodeGroup.add(crystal);
      }
      room.add(geodeGroup);

      // Modern faceted hexagonal crystal vitrines with fiber-optic micro-spots
      [-2.0, 2.0].forEach((vx, idx) => {
        const hexStand = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 0.85, 6), mat(p0));
        hexStand.position.set(vx, 0.425, 1.4);
        const hexGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.7, 6), createGlassMat(p2, 0.7));
        hexGlass.position.set(vx, 1.2, 1.4);
        const gemColor = idx === 0 ? p3 : '#38BDF8';
        const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 0), mat(gemColor, { emissive: gemColor, emissiveIntensity: 0.6 }));
        gem.position.set(vx, 1.15, 1.4);
        room.add(hexStand, hexGlass, gem);
      });
      break;
    }

    // -----------------------------------------------------------------------
    // 08. Imperial Porcelain & Masterwork Scroll Salon Interior
    // -----------------------------------------------------------------------
    case 'diorama-museum-oriental-porcelain-scroll': {
      // Circular Rosewood Moon Gate Architectural Portal
      const moonGateGroup = new THREE.Group();
      moonGateGroup.position.set(0, 0, -1.8);

      const ringOuter = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.18, 8, 32), mat(p0));
      ringOuter.position.y = 1.9;
      const leftLattice = new THREE.Mesh(new THREE.BoxGeometry(1.4, 3.4, 0.12), mat(p0));
      leftLattice.position.set(-2.5, 1.7, 0);
      const rightLattice = new THREE.Mesh(new THREE.BoxGeometry(1.4, 3.4, 0.12), mat(p0));
      rightLattice.position.set(2.5, 1.7, 0);
      moonGateGroup.add(ringOuter, leftLattice, rightLattice);
      room.add(moonGateGroup);

      // Long Horizontal Landscape Scroll Showcase
      const scrollCase = new THREE.Group();
      scrollCase.position.set(0, 0, 0.4);
      const scBase = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.75, 0.8), mat(p0));
      scBase.position.y = 0.375;
      const scGlass = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.4, 0.7), createGlassMat('#38BDF8', 0.7));
      scGlass.position.y = 0.95;
      // Silk unrolled handscroll paper inside
      const paperScroll = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.02, 0.45), mat(p2));
      paperScroll.position.y = 0.78;
      // Scroll roller rods at each end
      const rollerL = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.55, 8), mat(p0));
      rollerL.rotation.x = Math.PI / 2;
      rollerL.position.set(-1.5, 0.8, 0);
      const rollerR = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.55, 8), mat(p0));
      rollerR.rotation.x = Math.PI / 2;
      rollerR.position.set(1.5, 0.8, 0);
      scrollCase.add(scBase, scGlass, paperScroll, rollerL, rollerR);
      room.add(scrollCase);

      // Blue-and-White Porcelain Vases on stepped pedestals
      [-2.4, 2.4].forEach((px) => {
        const pPed = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.85, 8), mat(p0));
        pPed.position.set(px, 0.425, 1.6);
        const vase = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 0.65, 12), mat('#FFFFFF'));
        vase.position.set(px, 1.175, 1.6);
        const cobaltRing = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.03, 6, 12), mat(p1));
        cobaltRing.rotation.x = Math.PI / 2;
        cobaltRing.position.set(px, 1.15, 1.6);
        room.add(pPed, vase, cobaltRing);
      });
      break;
    }

    // -----------------------------------------------------------------------
    // 09. Industrial Revolution & Giant Steam Engine Interior
    // -----------------------------------------------------------------------
    case 'diorama-museum-industrial-steam-revolution': {
      // Victorian Red Brick Wall
      const brickWall = new THREE.Mesh(new THREE.BoxGeometry(6.8, 3.4, 0.35), mat(p0));
      brickWall.position.set(0, 1.7, -3.2);
      room.add(brickWall);

      // Overhead Yellow Traveling Crane Gantry Girder
      const gantryBeam = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.45, 0.35), mat(p3));
      gantryBeam.position.set(0, 3.1, -1.0);
      const hoistTrolley = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.3, 0.5), mat(p1));
      hoistTrolley.position.set(0.5, 3.0, -1.0);
      room.add(gantryBeam, hoistTrolley);

      // Massive Spoked Cast-Iron Flywheel & Steam Piston
      const engineGroup = new THREE.Group();
      engineGroup.position.set(0, 0, 0.2);

      // Spoked Flywheel (rim and central hub)
      const flywheelRim = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.12, 8, 24), mat(p1, { metalness: 0.85 }));
      flywheelRim.rotation.y = Math.PI / 2;
      flywheelRim.position.set(0, 1.7, 0);
      const flywheelHub = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.4, 12), mat(p1, { metalness: 0.9 }));
      flywheelHub.rotation.z = Math.PI / 2;
      flywheelHub.position.set(0, 1.7, 0);
      engineGroup.add(flywheelRim, flywheelHub);

      // 8 Flywheel Spokes
      for (let s = 0; s < 8; s++) {
        const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.1, 6), mat(p1, { metalness: 0.85 }));
        spoke.rotation.x = (s * Math.PI) / 8;
        spoke.position.set(0, 1.7, 0);
        engineGroup.add(spoke);
      }

      // Horizontal Steam Cylinder Piston & Brass Governor
      const pistonCylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.4, 12), mat(p1, { metalness: 0.8 }));
      pistonCylinder.rotation.x = Math.PI / 2;
      pistonCylinder.position.set(1.4, 0.7, 0);
      const governorPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 6), mat(p2, { metalness: 0.9 }));
      governorPillar.position.set(1.4, 1.5, 0);
      const governorBall1 = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), mat(p2, { metalness: 0.95 }));
      governorBall1.position.set(1.25, 1.8, 0);
      const governorBall2 = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), mat(p2, { metalness: 0.95 }));
      governorBall2.position.set(1.55, 1.8, 0);
      engineGroup.add(pistonCylinder, governorPillar, governorBall1, governorBall2);
      room.add(engineGroup);
      break;
    }

    // -----------------------------------------------------------------------
    // 10. Living Rainforest Biosphere & Canopy Walkway Interior
    // -----------------------------------------------------------------------
    case 'diorama-museum-rainforest-biome': {
      // Hexagonal Geodesic Glass Spaceframe Dome
      const bioDome = new THREE.Mesh(
        new THREE.SphereGeometry(4.2, 12, 8, 0, Math.PI, 0, Math.PI * 0.55),
        createGlassMat(p1, 0.55)
      );
      bioDome.position.set(0, 0, 0);
      room.add(bioDome);

      // Natural Rock Cliff & Indoor Waterfall
      const rockCliff = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 2.2, 2.6, 7), mat('#475569', { roughness: 0.95 }));
      rockCliff.position.set(0, 1.3, -2.2);
      const waterCascade = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 2.4), createWaterMat(p2));
      waterCascade.position.set(0, 1.3, -1.35);
      const splashPool = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.1, 14), createWaterMat(p2));
      splashPool.position.set(0, 0.05, -0.6);
      room.add(rockCliff, waterCascade, splashPool);

      // Suspended Timber Canopy Skybridge
      const skybridge = new THREE.Group();
      skybridge.position.set(0, 1.6, 0.4);
      const deckPlanks = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.08, 0.7), mat(p3, { roughness: 0.8 }));
      const handrailL = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 4.8, 6), mat('#0F172A'));
      handrailL.rotation.z = Math.PI / 2;
      handrailL.position.set(0, 0.45, -0.32);
      const handrailR = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 4.8, 6), mat('#0F172A'));
      handrailR.rotation.z = Math.PI / 2;
      handrailR.position.set(0, 0.45, 0.32);
      skybridge.add(deckPlanks, handrailL, handrailR);
      room.add(skybridge);

      // Tropical Palm Foliage
      [-2.2, 2.2].forEach((tx) => {
        const palmTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 2.2, 7), mat('#78350F'));
        palmTrunk.position.set(tx, 1.1, -0.5);
        const palmCanopy = new THREE.Mesh(new THREE.ConeGeometry(0.9, 0.6, 6), mat(p0, { roughness: 0.85 }));
        palmCanopy.position.set(tx, 2.3, -0.5);
        room.add(palmTrunk, palmCanopy);
      });
      break;
    }

    // -----------------------------------------------------------------------
    // 11. Cyber Matrix & Immersive Digital Media Darkroom
    // -----------------------------------------------------------------------
    case 'diorama-museum-cyber-digital-immersive': {
      // Pitch Black Infinity Room walls
      const darkBox = new THREE.Mesh(new THREE.BoxGeometry(6.6, 3.4, 0.2), mat(p0));
      darkBox.position.set(0, 1.7, -3.2);
      room.add(darkBox);

      // Neon Cyan and Magenta Floor Grid Lines
      const gridLines = new THREE.Group();
      for (let i = -3; i <= 3; i++) {
        const lineX = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.01, 6.0), mat(p1, { emissive: p1, emissiveIntensity: 0.8 }));
        lineX.position.set(i * 0.9, 0.02, 0);
        const lineZ = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.01, 0.03), mat(p2, { emissive: p2, emissiveIntensity: 0.8 }));
        lineZ.position.set(0, 0.02, i * 0.9);
        gridLines.add(lineX, lineZ);
      }
      room.add(gridLines);

      // Central Floating Holographic Projection Pyramid & Polyhedron
      const holoCore = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.7, 0),
        mat(p1, { emissive: p1, emissiveIntensity: 0.9, wireframe: true })
      );
      holoCore.position.set(0, 1.6, 0);
      const holoRing = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.04, 6, 20), mat(p2, { emissive: p2, emissiveIntensity: 0.9 }));
      holoRing.rotation.x = Math.PI / 3;
      holoRing.position.set(0, 1.6, 0);
      room.add(holoCore, holoRing);

      // Interactive Glowing Touch Pillars
      [-1.8, 1.8].forEach((px) => {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.4, 0.35), mat(p0));
        pillar.position.set(px, 0.7, 1.4);
        const sensorRing = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.06, 0.38), mat(p3, { emissive: p3, emissiveIntensity: 0.9 }));
        sensorRing.position.set(px, 1.25, 1.4);
        room.add(pillar, sensorRing);
      });
      break;
    }

    // -----------------------------------------------------------------------
    // 12. Islamic Arabesque & Illuminated Manuscript Court
    // -----------------------------------------------------------------------
    case 'diorama-museum-islamic-mosaic-court': {
      // Horseshoe Arched Wall Colonnade
      const colonnade = new THREE.Group();
      colonnade.position.set(0, 0, -2.4);
      [-1.6, 0, 1.6].forEach((ax) => {
        const arch = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.1, 6, 16, Math.PI * 1.25), mat(p0));
        arch.rotation.z = Math.PI;
        arch.position.set(ax, 2.0, 0);
        const col1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.6, 8), mat('#F1F5F9'));
        col1.position.set(ax - 0.65, 0.8, 0);
        const col2 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.6, 8), mat('#F1F5F9'));
        col2.position.set(ax + 0.65, 0.8, 0);
        colonnade.add(arch, col1, col2);
      });
      room.add(colonnade);

      // Central Octagonal Mosaic Fountain Basin
      const fountainGroup = new THREE.Group();
      fountainGroup.position.set(0, 0, 0.2);
      const basinOuter = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.3, 0.35, 8), mat(p1));
      basinOuter.position.y = 0.175;
      const basinWater = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.36, 8), createWaterMat('#06B6D4'));
      basinWater.position.y = 0.18;
      const fountainSpout = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 0.6, 8), mat(p0));
      fountainSpout.position.y = 0.5;
      fountainGroup.add(basinOuter, basinWater, fountainSpout);
      room.add(fountainGroup);

      // Gilded Manuscript Vitrines with Perforated Brass Lanterns
      [-2.2, 2.2].forEach((vx) => {
        const vCase = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.75, 0.85), mat(p0));
        vCase.position.set(vx, 0.375, 1.2);
        const vGlass = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.45, 0.8), createGlassMat('#38BDF8', 0.65));
        vGlass.position.set(vx, 0.95, 1.2);
        const goldLeafBook = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.35), mat(p2, { metalness: 0.85 }));
        goldLeafBook.position.set(vx, 0.75, 1.2);
        // Hanging brass filigree lantern
        const lantern = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), mat(p2, { metalness: 0.9, wireframe: true }));
        lantern.position.set(vx, 2.2, 1.2);
        room.add(vCase, vGlass, goldLeafBook, lantern);
      });
      break;
    }

    // -----------------------------------------------------------------------
    // 13. Nordic Timber Craft & Organic Design Salon
    // -----------------------------------------------------------------------
    case 'diorama-museum-nordic-sculpture-salon': {
      // Vertical Pine Slat Acoustic Wall
      const slatGroup = new THREE.Group();
      slatGroup.position.set(0, 0, -2.8);
      for (let s = -3.0; s <= 3.0; s += 0.22) {
        const slat = new THREE.Mesh(new THREE.BoxGeometry(0.08, 3.2, 0.15), mat(p0, { roughness: 0.7 }));
        slat.position.set(s, 1.6, 0);
        slatGroup.add(slat);
      }
      room.add(slatGroup);

      // Curved Glulam Timber Ceiling Ribs
      [-1.5, 0.5].forEach((rz) => {
        const glulam = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.1, 6, 16, Math.PI * 0.7), mat(p0));
        glulam.position.set(0, 1.6, rz);
        room.add(glulam);
      });

      // Central Birch Tree Lightwell Basin
      const lightwellBasin = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.2, 0.2, 16), mat(p2));
      lightwellBasin.position.set(0, 0.1, 0.2);
      const birchTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3.2, 8), mat('#F8FAFC'));
      birchTrunk.position.set(0, 1.6, 0.2);
      const birchCanopy = new THREE.Mesh(new THREE.DodecahedronGeometry(0.65, 0), mat('#84CC16'));
      birchCanopy.position.set(0, 3.0, 0.2);
      room.add(lightwellBasin, birchTrunk, birchCanopy);

      // Sculptured Mid-century Wooden Lounge Chairs on white plinths
      [-2.0, 2.0].forEach((cx) => {
        const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 1.2), mat(p1));
        plinth.position.set(cx, 0.1, 1.2);
        // Curving bentwood chair
        const seat = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.08, 0.6), mat(p0));
        seat.position.set(cx, 0.4, 1.2);
        const back = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.08), mat(p0));
        back.position.set(cx, 0.65, 1.45);
        back.rotation.x = -0.2;
        room.add(plinth, seat, back);
      });
      break;
    }

    // -----------------------------------------------------------------------
    // 14. Medieval Knight Plate Armor & Royal Armory Interior
    // -----------------------------------------------------------------------
    case 'diorama-museum-medieval-knights-armory': {
      // Gothic Rib-Vaulted Stone Ashlar Arcade
      const stoneWall = new THREE.Mesh(new THREE.BoxGeometry(6.6, 3.4, 0.35), mat(p0));
      stoneWall.position.set(0, 1.7, -3.0);
      room.add(stoneWall);

      // Heraldic Crimson Wall Shields and Banners
      [-1.8, 1.8].forEach((sx) => {
        const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.05, 3), mat(p2));
        shield.rotation.z = Math.PI;
        shield.position.set(sx, 2.4, -2.8);
        const banner = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 1.2), mat(p2));
        banner.position.set(sx, 1.6, -2.8);
        room.add(shield, banner);
      });

      // Masterpiece Centerpiece: Knight in Plate Armor mounted on Armored Warhorse!
      const horseGroup = new THREE.Group();
      horseGroup.position.set(0, 0, 0.2);

      // Horse body & neck
      const horseTorso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.75, 1.8), mat(p2)); // Crimson caparison
      horseTorso.position.y = 1.3;
      const horseNeck = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.75, 0.6), mat(p1, { metalness: 0.9 })); // Steel chanfron
      horseNeck.position.set(0, 1.85, 0.85);
      horseNeck.rotation.x = 0.4;
      horseGroup.add(horseTorso, horseNeck);

      // 4 Armored Horse Legs
      [
        [-0.3, 0.55, 0.6],
        [0.3, 0.55, 0.6],
        [-0.3, 0.55, -0.6],
        [0.3, 0.55, -0.6],
      ].forEach(([hx, hy, hz]) => {
        const hLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.1, 6), mat(p1, { metalness: 0.85 }));
        hLeg.position.set(hx, hy, hz);
        horseGroup.add(hLeg);
      });

      // Mounted Knight in full plate steel with Lance
      const knightTorso = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.6, 0.4), mat(p1, { metalness: 0.95 }));
      knightTorso.position.set(0, 1.95, 0.1);
      const knightHelm = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.3, 8), mat(p1, { metalness: 0.95 }));
      knightHelm.position.set(0, 2.4, 0.1);
      // Tournament Lance
      const lance = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.06, 3.2, 6), mat(p3));
      lance.rotation.x = -0.6;
      lance.position.set(0.4, 2.2, 0.8);
      horseGroup.add(knightTorso, knightHelm, lance);
      room.add(horseGroup);
      break;
    }

    // -----------------------------------------------------------------------
    // 15. Haute Couture Catwalk & Silk Drapery Rotunda
    // -----------------------------------------------------------------------
    case 'diorama-museum-haute-couture-fashion': {
      // Mirror-black elevated catwalk runway
      const catwalk = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.3, 5.2), mat(p0, { roughness: 0.1, metalness: 0.4 }));
      catwalk.position.set(0, 0.15, 0);
      room.add(catwalk);

      // Overhead circular champagne gold spotlight ring
      const spotRing = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.06, 6, 24), mat(p2, { metalness: 0.9 }));
      spotRing.rotation.x = Math.PI / 2;
      spotRing.position.set(0, 3.1, 0);
      room.add(spotRing);

      // 3 Stylized Mannequins in sculpted Haute Couture gowns
      [-1.4, 0, 1.4].forEach((mz, idx) => {
        const mannequin = new THREE.Group();
        mannequin.position.set(0, 0.3, mz);
        // Slender chrome mannequin
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.9, 8), mat('#E2E8F0', { metalness: 0.9 }));
        body.position.y = 0.95;
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), mat('#E2E8F0', { metalness: 0.9 }));
        head.position.y = 1.5;
        // Flowing sculptured silk gown (varied silhouette per model)
        const gownColor = idx === 1 ? p3 : p1;
        const gown = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.1, 10), mat(gownColor, { roughness: 0.3 }));
        gown.position.y = 0.55;
        mannequin.add(body, head, gown);
        room.add(mannequin);
      });
      break;
    }

    // -----------------------------------------------------------------------
    // 16. Symphony Acoustic & Stradivarius Violin Hall
    // -----------------------------------------------------------------------
    case 'diorama-museum-musical-instruments-acoustic': {
      // Undulating Convex Amber Wood Acoustic Wall Baffles
      const baffleGroup = new THREE.Group();
      baffleGroup.position.set(0, 0, -2.8);
      for (let b = -2.8; b <= 2.8; b += 0.8) {
        const baffle = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 3.2, 12, 1, false, 0, Math.PI), mat(p0, { roughness: 0.6 }));
        baffle.position.set(b, 1.6, 0);
        baffleGroup.add(baffle);
      }
      room.add(baffleGroup);

      // Centerpiece: Hero Vitrine holding Antique Stradivarius Violin!
      const heroCase = new THREE.Group();
      heroCase.position.set(0, 0, 0.2);
      const casePlinth = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 0.85, 16), mat(p3));
      casePlinth.position.y = 0.425;
      const glassCylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.85, 16), createGlassMat(p2, 0.7));
      glassCylinder.position.y = 1.25;
      // Detailed low-poly violin
      const violinBody = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.42, 0.08), mat(p0, { roughness: 0.4 }));
      violinBody.position.y = 1.25;
      const violinNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 6), mat('#1E293B'));
      violinNeck.position.set(0, 1.55, 0);
      heroCase.add(casePlinth, glassCylinder, violinBody, violinNeck);
      room.add(heroCase);

      // Towering Golden Concert Harp on Stage Riser
      const harpGroup = new THREE.Group();
      harpGroup.position.set(1.8, 0, 0.6);
      const harpPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 1.8, 8), mat(p1, { metalness: 0.9 }));
      harpPillar.position.y = 0.9;
      const harpHarmonicCurve = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.05, 6, 12, Math.PI * 0.8), mat(p1, { metalness: 0.9 }));
      harpHarmonicCurve.rotation.z = Math.PI * 0.9;
      harpHarmonicCurve.position.set(-0.35, 1.6, 0);
      harpGroup.add(harpPillar, harpHarmonicCurve);
      room.add(harpGroup);
      break;
    }

    // -----------------------------------------------------------------------
    // 17. Cosmology Orrery & Pitted Meteorite Dome Interior
    // -----------------------------------------------------------------------
    case 'diorama-museum-cosmology-meteorite': {
      // Deep Starfield Dome with Pinpoint Lights
      const starDome = new THREE.Mesh(
        new THREE.SphereGeometry(4.2, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5),
        mat(p0)
      );
      room.add(starDome);

      // Colossal Multi-tiered Clockwork Brass Solar Orrery
      const orreryGroup = new THREE.Group();
      orreryGroup.position.set(0, 0, 0);
      const centralPedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 0.8, 12), mat(p0));
      centralPedestal.position.y = 0.4;
      // Golden Sun Sphere
      const sunSphere = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 12), mat(p1, { emissive: p1, emissiveIntensity: 0.8 }));
      sunSphere.position.y = 1.3;
      orreryGroup.add(centralPedestal, sunSphere);

      // 4 Concentric Orbit Rings with Brass Planet Spheres
      const orbitRadii = [0.8, 1.3, 1.8, 2.3];
      orbitRadii.forEach((rad, idx) => {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(rad, 0.02, 4, 32), mat(p1, { metalness: 0.9 }));
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 1.25 + idx * 0.08;
        // Planet bead
        const ang = idx * 1.6;
        const planet = new THREE.Mesh(new THREE.SphereGeometry(0.08 + idx * 0.03, 8, 8), mat(p3));
        planet.position.set(Math.cos(ang) * rad, 1.25 + idx * 0.08, Math.sin(ang) * rad);
        orreryGroup.add(ring, planet);
      });
      room.add(orreryGroup);

      // Giant Pitted Iron Meteorite on Vibration-Isolated Plinth
      const metGroup = new THREE.Group();
      metGroup.position.set(2.4, 0, 1.4);
      const metBase = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.9), mat(p2));
      metBase.position.y = 0.25;
      const meteorite = new THREE.Mesh(new THREE.DodecahedronGeometry(0.38, 1), mat(p2, { metalness: 0.8, roughness: 0.8 }));
      meteorite.position.y = 0.75;
      metGroup.add(metBase, meteorite);
      room.add(metGroup);
      break;
    }

    // -----------------------------------------------------------------------
    // 18. Mesoamerican Sun God & Aztec Gold Treasury Interior
    // -----------------------------------------------------------------------
    case 'diorama-museum-mesoamerican-sun-god': {
      // Stepped Dark Volcanic Basalt Temple Altar Wall
      const basaltWall = new THREE.Mesh(new THREE.BoxGeometry(6.6, 3.4, 0.4), mat(p0));
      basaltWall.position.set(0, 1.7, -3.0);
      room.add(basaltWall);

      // Monumental Golden Aztec Sun Calendar Disc (Tonatiuh)
      const sunDisc = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.12, 16), mat(p1, { metalness: 0.9, roughness: 0.2 }));
      sunDisc.rotation.x = Math.PI / 2;
      sunDisc.position.set(0, 1.9, -2.75);
      const discRim = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.06, 6, 20), mat(p1, { metalness: 0.95 }));
      discRim.position.set(0, 1.9, -2.7);
      room.add(sunDisc, discRim);

      // Jadeite Funerary Death Mask Showcase on central altar
      const altarPlinth = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 1.0), mat(p0));
      altarPlinth.position.set(0, 0.3, 0.2);
      const maskGlass = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.6), createGlassMat('#38BDF8', 0.65));
      maskGlass.position.set(0, 0.85, 0.2);
      const jadeMask = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 0), mat(p2, { emissive: p2, emissiveIntensity: 0.5 }));
      jadeMask.position.set(0, 0.78, 0.2);
      room.add(altarPlinth, maskGlass, jadeMask);

      // Sunken Black Obsidian Reflecting Pool in foreground
      const obsidianPool = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.05, 1.4), mat('#0F172A', { roughness: 0.05, metalness: 0.8 }));
      obsidianPool.position.set(0, 0.02, 1.8);
      room.add(obsidianPool);
      break;
    }

    // -----------------------------------------------------------------------
    // 19. First Peoples Longhouse & Carved Totem Interior
    // -----------------------------------------------------------------------
    case 'diorama-museum-indigenous-totem-lodge': {
      // Adzed Red Cedar Timber Posts and Crossbeams
      [-2.4, 2.4].forEach((tx) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 3.4, 8), mat(p0));
        post.position.set(tx, 1.7, -1.8);
        room.add(post);
      });
      const crossbeam = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.35, 0.35), mat(p0));
      crossbeam.position.set(0, 3.2, -1.8);
      room.add(crossbeam);

      // Towering Carved Eagle & Raven Totem Pole
      const totemGroup = new THREE.Group();
      totemGroup.position.set(0, 0, -1.8);
      const totemTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 3.2, 10), mat(p0));
      totemTrunk.position.y = 1.6;
      // Thunderbird outstretched wings
      const wings = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.45, 0.08), mat(p1));
      wings.position.set(0, 2.8, 0.2);
      // Carved formline beak
      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.45, 4), mat(p3));
      beak.rotation.x = Math.PI / 2;
      beak.position.set(0, 2.7, 0.4);
      totemGroup.add(totemTrunk, wings, beak);
      room.add(totemGroup);

      // Suspended Authentic Birchbark River Canoe
      const canoe = new THREE.Group();
      canoe.position.set(0, 1.5, 0.8);
      const canoeHull = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 3.2, 8, 1, false, 0, Math.PI), mat(p3));
      canoeHull.rotation.x = Math.PI;
      canoeHull.rotation.z = Math.PI / 2;
      canoe.add(canoeHull);
      room.add(canoe);
      break;
    }

    // -----------------------------------------------------------------------
    // 20. Quantum Core & AI Singularity Future Interior
    // -----------------------------------------------------------------------
    case 'diorama-museum-quantum-ai-singularity': {
      // Pristine White Cleanroom Enclosure
      const cleanWall = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.4, 3.2, 24, 1, true, -Math.PI / 2, Math.PI), mat(p0));
      cleanWall.position.set(0, 1.6, 0);
      room.add(cleanWall);

      // Multi-tier Golden Quantum Dilution Chandelier inside glass cryostat
      const qCoreGroup = new THREE.Group();
      qCoreGroup.position.set(0, 0, 0);

      // Cylindrical glass cryostat vessel
      const cryoGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 2.6, 16), createGlassMat(p2, 0.6));
      cryoGlass.position.y = 1.5;
      qCoreGroup.add(cryoGlass);

      // 4 Tiered Gold-plated Cooling Flanges
      const flangeHeights = [2.4, 1.9, 1.4, 0.9];
      const flangeRadii = [0.65, 0.52, 0.4, 0.28];
      flangeHeights.forEach((fh, idx) => {
        const flange = new THREE.Mesh(new THREE.CylinderGeometry(flangeRadii[idx], flangeRadii[idx], 0.06, 16), mat(p1, { metalness: 0.95 }));
        flange.position.y = fh;
        qCoreGroup.add(flange);
      });

      // Superconducting coaxial coils & helium tubes
      for (let c = 0; c < 8; c++) {
        const ang = (c * Math.PI * 2) / 8;
        const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.5, 6), mat(p1, { metalness: 0.9 }));
        tube.position.set(Math.cos(ang) * 0.35, 1.6, Math.sin(ang) * 0.35);
        qCoreGroup.add(tube);
      }
      room.add(qCoreGroup);

      // Levitating Cyan Holographic Data Toroids
      const dataRing1 = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.035, 6, 24), mat(p2, { emissive: p2, emissiveIntensity: 0.9 }));
      dataRing1.rotation.x = Math.PI / 2;
      dataRing1.position.y = 1.8;
      const dataRing2 = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.03, 6, 24), mat(p2, { emissive: p2, emissiveIntensity: 0.9 }));
      dataRing2.rotation.x = 0.4;
      dataRing2.position.y = 1.4;
      room.add(dataRing1, dataRing2);

      // Carbon Fiber Neural Network Touch Consoles
      [-1.8, 1.8].forEach((cx) => {
        const term = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.9, 0.4), mat(p3));
        term.position.set(cx, 0.45, 1.6);
        const screen = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.02, 0.3), mat(p2, { emissive: p2, emissiveIntensity: 0.7 }));
        screen.position.set(cx, 0.91, 1.6);
        screen.rotation.x = -0.3;
        room.add(term, screen);
      });
      break;
    }

    default: {
      // Default museum interior composition
      const centerPlinth = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.65, 0.7, 12), mat(p0));
      centerPlinth.position.y = 0.35;
      const centerGlass = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.7), createGlassMat(p1, 0.65));
      centerGlass.position.y = 1.1;
      const sculpture = new THREE.Mesh(new THREE.DodecahedronGeometry(0.25, 0), mat(p2));
      sculpture.position.y = 1.0;
      room.add(centerPlinth, centerGlass, sculpture);
      break;
    }
  }

  root.add(room);
  return root;
}
