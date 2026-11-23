import * as THREE from 'three';
import { IslandMetadata, IslandVariant } from '../../types/island';
import { createLowPolyMat, createGlassMat, createWaterMat, createTree } from './materials';
import { buildRichIslandTerrain, TerrainArchetype } from './terrain';
import { createEmbeddedDetailedInterior } from './luxuryResidenceAndDollhouseMeshBuilders';

function hexToInt(hex: string | undefined, fallback: number): number {
  if (!hex) return fallback;
  const cleaned = hex.replace('#', '');
  const parsed = parseInt(cleaned, 16);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function addShadows(group: THREE.Object3D) {
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
}

// ============================================================================
// MINEST · MY WORLD CURATED SCENES 3D BUILDER (MW-MYWORLD-01 to MW-MYWORLD-12)
// Built following the 6 Core Principles:
// 1. 小而精 (Compact & Iconic Slice)
// 2. 风格化写实 (Stylized Realism)
// 3. 流畅优先 (60 FPS Mobile Poly-Budget)
// 4. 内外空间独立 (Independent Exterior & Interior Spaces)
// 5. 收藏与居住 (Living, Vehicles, Books, Artworks & Life Memories)
// ============================================================================
export function buildMyWorldCandidateScene(
  island: IslandMetadata,
  variant: IslandVariant = 'classic'
): THREE.Group {
  const master = new THREE.Group();
  const mwNum = parseInt(island.id.replace('MW-MYWORLD-', ''), 10) || 1;
  const idx = Math.max(1, Math.min(12, mwNum));

  // Select appropriate floating island terrain archetype
  let archetype: TerrainArchetype = 'village_meadow';
  if (idx === 1 || idx === 11 || idx === 12) archetype = 'coastal_beach';
  else if (idx === 3 || idx === 5) archetype = 'alpine_crag';
  else if (idx === 4 || idx === 6 || idx === 10) archetype = 'farmland_terrace';
  else if (idx === 7 || idx === 9) archetype = 'sacred_forest';
  else if (idx === 8) archetype = 'plateau';

  const baseTerrain = buildRichIslandTerrain(island, variant, archetype);
  master.add(baseTerrain);

  const g = new THREE.Group();
  const pHex = hexToInt(island.palette[0]?.hex, 0xe8b4a2);
  const sHex = hexToInt(island.palette[1]?.hex, 0x1d7874);
  const aHex = hexToInt(island.palette[2]?.hex, 0xd4af37);

  const primaryMat = createLowPolyMat(pHex, { roughness: 0.62 });
  const secondaryMat = createLowPolyMat(sHex, { roughness: 0.56 });
  const accentMat = createLowPolyMat(aHex, { roughness: 0.42 });
  const trimStoneMat = createLowPolyMat(0xf5f0e6, { roughness: 0.68 });
  const darkStoneMat = createLowPolyMat(0x525866, { roughness: 0.82 });
  const woodMat = createLowPolyMat(0x6e472b, { roughness: 0.75 });
  const darkWoodMat = createLowPolyMat(0x3e2723, { roughness: 0.72 });
  const whiteMat = createLowPolyMat(0xfaf8f5, { roughness: 0.55 });
  const goldMat = createLowPolyMat(0xd4af37, { metalness: 0.6, roughness: 0.26 });
  const glowMat = createLowPolyMat(variant === 'fantasy' ? 0xffd166 : 0xfff3b0, {
    emissive: 0xf59e0b,
    roughness: 0.3,
  });
  const glassMat = createGlassMat(0xbae6fd, 0.7);
  const waterMat = createWaterMat(0x1d8a8a);

  switch (idx) {
    case 1: {
      // ======================================================================
      // #1 VENICE — GRAND CANAL, RIALTO BRIDGE & GOTHIC PALAZZO RESIDENCE
      // ======================================================================
      // Wide Emerald Grand Canal cutting across the center + marble embankments (Fondamenta)
      const grandCanal = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.16, 2.15), waterMat);
      grandCanal.position.set(0, 0.72, 0.25);
      const bankNorth = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.28, 2.2), trimStoneMat);
      bankNorth.position.set(0, 0.84, -1.35);
      const bankSouth = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.24, 1.35), trimStoneMat);
      bankSouth.position.set(0, 0.82, 1.72);
      g.add(grandCanal, bankNorth, bankSouth);

      // Iconic White Istrian-Stone Rialto Arch Bridge with Covered Arcade & Balustrades
      const rialtoGroup = new THREE.Group();
      rialtoGroup.position.set(-0.95, 0.85, 0.25);
      const bridgeDeck = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.24, 2.35), trimStoneMat);
      bridgeDeck.position.y = 0.52;
      const bridgeArcade = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.48, 1.45), whiteMat);
      bridgeArcade.position.y = 0.86;
      const bridgePediment = new THREE.Mesh(new THREE.ConeGeometry(0.68, 0.36, 4), goldMat);
      bridgePediment.rotation.y = Math.PI / 4;
      bridgePediment.scale.set(1, 1, 1.4);
      bridgePediment.position.y = 1.28;
      rialtoGroup.add(bridgeDeck, bridgeArcade, bridgePediment);
      g.add(rialtoGroup);

      // User's Venetian Gothic Rose-Marble Palazzo Residence (Right North Bank)
      const palazzo = new THREE.Mesh(new THREE.BoxGeometry(2.45, 2.05, 1.55), primaryMat);
      palazzo.position.set(1.15, 1.92, -1.25);
      const quatrefoilLoggia = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.68, 0.14), whiteMat);
      quatrefoilLoggia.position.set(1.15, 1.95, -0.45);
      const palazzoRoof = new THREE.Mesh(new THREE.ConeGeometry(1.82, 0.65, 4), createLowPolyMat(0xc85a32));
      palazzoRoof.rotation.y = Math.PI / 4;
      palazzoRoof.scale.set(1.12, 1, 0.72);
      palazzoRoof.position.set(1.15, 3.25, -1.25);
      const altana = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.34, 0.75), woodMat);
      altana.position.set(1.15, 3.55, -1.25);
      g.add(palazzo, quatrefoilLoggia, palazzoRoof, altana);

      for (const wx of [0.55, 1.15, 1.75]) {
        const win = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.48, 0.08), glowMat);
        win.position.set(wx, 1.95, -0.42);
        g.add(win);
      }

      // St. Mark's Style Terracotta Brick Campanile Bell Tower (Left North Bank)
      const campanile = new THREE.Mesh(
        new THREE.BoxGeometry(0.68, 2.85, 0.68),
        createLowPolyMat(0xb8523b, { roughness: 0.75 })
      );
      campanile.position.set(-1.85, 2.28, -1.45);
      const belfry = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.48, 0.74), whiteMat);
      belfry.position.set(-1.85, 3.85, -1.45);
      const spire = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.95, 4), secondaryMat);
      spire.rotation.y = Math.PI / 4;
      spire.position.set(-1.85, 4.55, -1.45);
      const angel = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), goldMat);
      angel.position.set(-1.85, 5.08, -1.45);
      g.add(campanile, belfry, spire, angel);

      // Collector Vehicles: Black-and-Gold Royal Gondola + Mahogany Riva Speedboat + Barber-Pole Pali
      const vehicleGroup = new THREE.Group();
      vehicleGroup.userData.collectionType = 'vehicles';
      for (const px of [0.35, 0.85, 1.45, 1.95]) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.78, 8), secondaryMat);
        pole.position.set(px, 1.05, -0.18);
        const cap = new THREE.Mesh(new THREE.SphereGeometry(0.055, 6, 6), goldMat);
        cap.position.set(px, 1.45, -0.18);
        vehicleGroup.add(pole, cap);
      }
      const gondola = new THREE.Mesh(new THREE.ConeGeometry(0.2, 1.25, 8), createLowPolyMat(0x18181b));
      gondola.rotation.z = Math.PI / 2;
      gondola.scale.set(0.6, 1, 0.35);
      gondola.position.set(0.75, 0.84, 0.35);
      const rivaBoat = new THREE.Mesh(new THREE.ConeGeometry(0.28, 1.15, 8), woodMat);
      rivaBoat.rotation.z = Math.PI / 2;
      rivaBoat.scale.set(0.85, 1, 0.45);
      rivaBoat.position.set(1.85, 0.85, 0.55);
      vehicleGroup.add(gondola, rivaBoat);
      g.add(vehicleGroup);
      break;
    }

    case 2: {
      // ======================================================================
      // #2 ENGLISH COUNTRYSIDE — AUTHENTIC COTSWOLDS (BIBURY ARLINGTON ROW & BOURTON)
      // ======================================================================
      // Clear River Coln Trout Stream flowing diagonally + Lush Meadow Banks
      const riverColn = new THREE.Mesh(
        new THREE.BoxGeometry(5.6, 0.12, 1.28),
        createWaterMat(0x3b9ab2)
      );
      riverColn.position.set(0, 0.72, 0.85);
      g.add(riverColn);

      // Authentic Bourton-on-the-Water Low 3-Arch Honey-Limestone Footbridge
      const lowBridge = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.24, 1.48), primaryMat);
      lowBridge.position.set(-0.45, 0.88, 0.85);
      const parapetL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.18, 1.48), primaryMat);
      parapetL.position.set(-0.92, 1.04, 0.85);
      const parapetR = parapetL.clone();
      parapetR.position.x = 0.02;
      g.add(lowBridge, parapetL, parapetR);

      // Pair of White Swans gliding on the River Coln
      for (const [sx, sz] of [
        [0.65, 0.82],
        [1.15, 0.95],
      ]) {
        const swan = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), whiteMat);
        swan.scale.set(1.4, 0.8, 0.9);
        swan.position.set(sx, 0.82, sz);
        g.add(swan);
      }

      // Authentic Bibury Arlington Row — Continuous Row of Honey-Limestone Weavers' Cottages
      // with Steep Horsham Stone-Slate Pitched Roofs, Cross-Gables, Leaded Casement Windows & Stone Chimneys
      const cottagePositions = [-1.85, -0.85, 0.15, 1.15];
      cottagePositions.forEach((cx, i) => {
        const h = i === 1 ? 1.48 : 1.32;
        const cottage = new THREE.Mesh(new THREE.BoxGeometry(1.05, h, 1.45), primaryMat);
        cottage.position.set(cx, 0.75 + h / 2, -0.95);

        // Steep 52-degree Cotswold Stone-Slate Roof + Cross Gable Dormer
        const mainRoof = new THREE.Mesh(new THREE.ConeGeometry(0.92, 0.95, 4), secondaryMat);
        mainRoof.rotation.y = Math.PI / 4;
        mainRoof.scale.set(0.95, 1, 1.15);
        mainRoof.position.set(cx, 0.75 + h + 0.42, -0.95);

        const frontGable = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.68, 4), primaryMat);
        frontGable.rotation.y = Math.PI / 4;
        frontGable.position.set(cx, 0.75 + h + 0.15, -0.35);

        const win1F = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.34, 0.06), glowMat);
        win1F.position.set(cx, 1.15, -0.21);
        const win2F = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.28, 0.06), glowMat);
        win2F.position.set(cx, 1.68, -0.21);

        const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.75, 0.24), primaryMat);
        chimney.position.set(cx + 0.38, 0.75 + h + 0.55, -0.95);

        g.add(cottage, mainRoof, frontGable, win1F, win2F, chimney);
      });

      // Traditional Hand-Stacked Cotswold Dry-Stone Wall + Climbing Pink Roses
      const dryStoneWall = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.28, 0.16), secondaryMat);
      dryStoneWall.position.set(-0.35, 0.88, 0.05);
      g.add(dryStoneWall);
      for (let rx = -2.1; rx <= 1.4; rx += 0.7) {
        const roseBush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24, 0), accentMat);
        roseBush.position.set(rx, 1.12, 0.05);
        g.add(roseBush);
      }

      // Collector Vehicle: British Racing Green Vintage Roadster parked in Courtyard (Right)
      const roadsterGroup = new THREE.Group();
      roadsterGroup.userData.collectionType = 'vehicles';
      const carBody = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.2, 0.32), createLowPolyMat(0x14532d));
      carBody.position.set(2.05, 0.88, -0.25);
      const carSeat = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 0.26), woodMat);
      carSeat.position.set(2.05, 0.98, -0.25);
      roadsterGroup.add(carBody, carSeat);
      g.add(roadsterGroup);

      const willow = createTree('willow', [2.15, 0.75, 0.95], 0.95);
      const oak = createTree('oak', [-2.35, 0.75, -0.25], 0.9);
      g.add(willow, oak);
      break;
    }

    case 3: {
      // ======================================================================
      // #3 SWISS ALPS — ZERMATT MATTERHORN, GLACIER VIADUCT & CHALET HOME
      // ======================================================================
      // Iconic Matterhorn Pyramid Snow Peak in Background Left
      const matterhorn = new THREE.Mesh(
        new THREE.ConeGeometry(1.55, 3.45, 5),
        createLowPolyMat(0x64748b, { roughness: 0.88 })
      );
      matterhorn.position.set(-1.45, 2.35, -1.25);
      const snowCap = new THREE.Mesh(new THREE.ConeGeometry(0.95, 1.85, 5), whiteMat);
      snowCap.position.set(-1.45, 3.22, -1.25);
      g.add(matterhorn, snowCap);

      // Glacier Express Stone Arch Viaduct & Red Panorama Train
      const viaduct = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.65, 0.42), darkStoneMat);
      viaduct.position.set(-0.85, 1.15, 0.55);
      const redTrain = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.26, 0.3), accentMat);
      redTrain.position.set(-0.85, 1.6, 0.55);
      g.add(viaduct, redTrain);

      // User's Luxury Zermatt Larch Timber Chalet + Outdoor Steaming Hot Tub (Right)
      const chalet = new THREE.Mesh(new THREE.BoxGeometry(2.15, 1.45, 1.65), primaryMat);
      chalet.position.set(1.15, 1.48, -0.35);
      const chaletWin = new THREE.Mesh(new THREE.BoxGeometry(1.25, 1.05, 0.08), glowMat);
      chaletWin.position.set(1.15, 1.52, 0.48);
      const snowRoof = new THREE.Mesh(new THREE.ConeGeometry(1.75, 1.15, 4), secondaryMat);
      snowRoof.rotation.y = Math.PI / 4;
      snowRoof.scale.set(1.1, 1, 0.85);
      snowRoof.position.set(1.15, 2.72, -0.35);
      const hotTub = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.34, 12), primaryMat);
      hotTub.position.set(1.35, 0.92, 1.18);
      const tubWater = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.36, 12), waterMat);
      tubWater.position.set(1.35, 0.93, 1.18);
      g.add(chalet, chaletWin, snowRoof, hotTub, tubWater);

      const p1 = createTree('pine', [0.1, 0.78, -1.35], 0.95);
      const p2 = createTree('pine', [2.25, 0.78, -1.1], 0.88);
      g.add(p1, p2);
      break;
    }

    case 4: {
      // ======================================================================
      // #4 HOBBITON — BAG END HILLSIDE BURROW, ROUND GREEN DOOR & SHIRE MILL
      // ======================================================================
      // Rolling Emerald Shire Hillside Mound (Bag End Turf Roof)
      const shireHill = new THREE.Mesh(
        new THREE.SphereGeometry(2.45, 18, 14, 0, Math.PI * 2, 0, Math.PI / 2),
        primaryMat
      );
      shireHill.scale.set(1.28, 0.78, 0.92);
      shireHill.position.set(0, 0.72, -0.55);

      // Stone & Timber Retaining Facade Wall cut into the Hill
      const burrowWall = new THREE.Mesh(
        new THREE.BoxGeometry(3.45, 1.15, 0.35),
        createLowPolyMat(0xeaddbe, { roughness: 0.78 })
      );
      burrowWall.position.set(0, 1.25, 0.58);
      const timberArch = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.14, 0.42), woodMat);
      timberArch.position.set(0, 1.82, 0.58);
      g.add(shireHill, burrowWall, timberArch);

      // Iconic Round Emerald-Green Wooden Door with Central Brass Door Knob!
      const roundDoorFrame = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.16, 18), woodMat);
      roundDoorFrame.rotation.x = Math.PI / 2;
      roundDoorFrame.position.set(0, 1.25, 0.74);
      const roundGreenDoor = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.18, 18), secondaryMat);
      roundGreenDoor.rotation.x = Math.PI / 2;
      roundGreenDoor.position.set(0, 1.25, 0.75);
      const centerBrassKnob = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), goldMat);
      centerBrassKnob.position.set(0, 1.25, 0.86);
      g.add(roundDoorFrame, roundGreenDoor, centerBrassKnob);

      // Twin Round Mullioned Hobbit Windows flanking the Round Door
      for (const wx of [-1.08, 1.08]) {
        const winFrame = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.14, 14), woodMat);
        winFrame.rotation.x = Math.PI / 2;
        winFrame.position.set(wx, 1.32, 0.73);
        const winGlow = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.16, 14), glowMat);
        winGlow.rotation.x = Math.PI / 2;
        winGlow.position.set(wx, 1.32, 0.74);
        g.add(winFrame, winGlow);
      }

      // Ancient Party Oak Tree crowning the top of Bag End Hill + Red Brick Chimneys
      const partyOak = createTree('oak', [0, 2.45, -0.65], 1.25);
      const chimney1 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.18, 0.68, 8),
        createLowPolyMat(0xb84a39)
      );
      chimney1.position.set(-0.95, 2.38, -0.35);
      g.add(partyOak, chimney1);

      // Cobblestone Garden Steps, Wooden Picket Fence & Golden Pumpkins / Sunflowers
      for (let px = -1.6; px <= 1.6; px += 0.4) {
        if (Math.abs(px) < 0.45) continue;
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.32, 0.08), woodMat);
        post.position.set(px, 0.9, 1.48);
        g.add(post);
      }
      for (const [gx, gz] of [
        [-1.15, 1.15],
        [-0.85, 1.25],
        [0.95, 1.18],
        [1.35, 1.22],
      ]) {
        const pumpkin = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), accentMat);
        pumpkin.scale.set(1.2, 0.85, 1.2);
        pumpkin.position.set(gx, 0.84, gz);
        g.add(pumpkin);
      }
      break;
    }

    case 5: {
      // ======================================================================
      // #5 HOGWARTS — CLIFFSIDE MAGIC CASTLE, GREAT HALL & ASTRONOMY TOWER
      // ======================================================================
      // Black Lake at the cliff base + Highland Crag Pedestal
      const blackLake = new THREE.Mesh(
        new THREE.CylinderGeometry(2.35, 2.4, 0.14, 18),
        createWaterMat(0x1e3a5f)
      );
      blackLake.position.set(0, 0.72, 0.35);
      const castleCrag = new THREE.Mesh(
        new THREE.ConeGeometry(2.35, 1.45, 8),
        createLowPolyMat(0x57534e, { roughness: 0.92 })
      );
      castleCrag.scale.set(1.25, 0.75, 0.9);
      castleCrag.position.set(0, 1.15, -0.35);
      g.add(blackLake, castleCrag);

      // The Great Hall with Steep Slate Roof, Lancet Windows & Quad Entrance Turrets
      const greatHall = new THREE.Mesh(new THREE.BoxGeometry(1.55, 1.65, 2.35), primaryMat);
      greatHall.position.set(-0.65, 2.12, -0.15);
      const hallRoof = new THREE.Mesh(new THREE.ConeGeometry(1.35, 0.95, 4), secondaryMat);
      hallRoof.rotation.y = Math.PI / 4;
      hallRoof.scale.set(0.85, 1, 1.35);
      hallRoof.position.set(-0.65, 3.38, -0.15);
      g.add(greatHall, hallRoof);

      for (let wz = -0.85; wz <= 0.65; wz += 0.5) {
        const lancet = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.68, 0.22), glowMat);
        lancet.position.set(-1.43, 2.18, wz);
        g.add(lancet);
      }

      // Soaring Astronomy Tower & Clustered Wizard Spires (Right)
      const towers = [
        { x: 0.85, z: -0.55, r: 0.44, h: 3.15, ch: 1.25 },
        { x: 1.55, z: -0.15, r: 0.32, h: 2.45, ch: 0.95 },
        { x: 0.25, z: -1.15, r: 0.36, h: 2.75, ch: 1.05 },
        { x: -1.45, z: -1.05, r: 0.28, h: 2.35, ch: 0.88 },
      ];
      towers.forEach((t) => {
        const cyl = new THREE.Mesh(new THREE.CylinderGeometry(t.r, t.r * 1.06, t.h, 12), primaryMat);
        cyl.position.set(t.x, 1.1 + t.h / 2, t.z);
        const cone = new THREE.Mesh(new THREE.ConeGeometry(t.r * 1.28, t.ch, 12), secondaryMat);
        cone.position.set(t.x, 1.1 + t.h + t.ch / 2, t.z);
        g.add(cyl, cone);
      });

      // Stone Arch Viaduct Bridge connecting Great Hall to Astronomy Wing
      const viaduct = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.75, 0.34), primaryMat);
      viaduct.position.set(0.25, 1.65, 0.65);
      g.add(viaduct);
      break;
    }

    case 6: {
      // ======================================================================
      // #6 GREEN GABLES — ANNE'S WHITE & EMERALD-GREEN GABLE FARMHOUSE & ORCHARD
      // ======================================================================
      // Prince Edward Island Red-Clay Country Lane + White Picket Fence
      const redSoilLane = new THREE.Mesh(
        new THREE.BoxGeometry(5.1, 0.05, 0.85),
        createLowPolyMat(0xb85d43, { roughness: 0.9 })
      );
      redSoilLane.position.set(0, 0.78, 1.28);
      g.add(redSoilLane);

      // Iconic White Clapboard L-Shaped Farmhouse with Emerald-Green Cross Gables
      const mainHouse = new THREE.Mesh(new THREE.BoxGeometry(2.55, 1.38, 1.55), primaryMat);
      mainHouse.position.set(-0.35, 1.44, -0.45);
      const eastWing = new THREE.Mesh(new THREE.BoxGeometry(1.45, 1.38, 1.65), primaryMat);
      eastWing.position.set(0.65, 1.44, -0.15);

      const greenRoofMain = new THREE.Mesh(new THREE.ConeGeometry(1.88, 0.88, 4), secondaryMat);
      greenRoofMain.rotation.y = Math.PI / 4;
      greenRoofMain.scale.set(1.12, 1, 0.72);
      greenRoofMain.position.set(-0.35, 2.52, -0.45);

      const greenRoofEast = new THREE.Mesh(new THREE.ConeGeometry(1.22, 0.88, 4), secondaryMat);
      greenRoofEast.rotation.y = Math.PI / 4;
      greenRoofEast.scale.set(0.85, 1, 1.1);
      greenRoofEast.position.set(0.65, 2.52, -0.15);

      // Anne's East Gable Window with Green Shutters
      const anneWin = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.42, 0.08), glowMat);
      anneWin.position.set(0.65, 1.88, 0.68);
      const shutterL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.42, 0.09), secondaryMat);
      shutterL.position.set(0.42, 1.88, 0.68);
      const shutterR = shutterL.clone();
      shutterR.position.x = 0.88;
      g.add(mainHouse, eastWing, greenRoofMain, greenRoofEast, anneWin, shutterL, shutterR);

      // "White Way of Delight" — Blooming Pink-White Apple Blossom Orchard Trees
      for (const [bx, bz] of [
        [-2.05, -0.35],
        [-1.85, 0.65],
        [1.95, -0.45],
        [1.85, 0.55],
      ]) {
        const blossomTree = createTree('blossom', [bx, 0.78, bz], 0.95);
        g.add(blossomTree);
      }
      break;
    }

    case 7: {
      // ======================================================================
      // #7 THE SECRET GARDEN — IVY STONE WALLS, HIDDEN DOOR & ROSE SANCTUARY
      // ======================================================================
      // Four-Sided Ancient Yorkshire Stone Perimeter Walls draped in Ivy & Roses
      const wallBack = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.35, 0.24), primaryMat);
      wallBack.position.set(0, 1.42, -1.65);
      const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.25, 3.1), primaryMat);
      wallLeft.position.set(-2.2, 1.38, -0.15);
      const wallRight = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.25, 3.1), primaryMat);
      wallRight.position.set(2.2, 1.38, -0.15);
      const wallFrontL = new THREE.Mesh(new THREE.BoxGeometry(1.75, 1.15, 0.24), primaryMat);
      wallFrontL.position.set(-1.35, 1.32, 1.35);
      const wallFrontR = new THREE.Mesh(new THREE.BoxGeometry(1.75, 1.15, 0.24), primaryMat);
      wallFrontR.position.set(1.35, 1.32, 1.35);
      g.add(wallBack, wallLeft, wallRight, wallFrontL, wallFrontR);

      // The Hidden Arched Wooden Door in the Front Ivy Wall + Golden Keyhole Glow!
      const secretDoor = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.98, 0.28), woodMat);
      secretDoor.position.set(0, 1.25, 1.35);
      const keyGlow = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), goldMat);
      keyGlow.position.set(0.24, 1.25, 1.52);
      g.add(secretDoor, keyGlow);

      // Central Sundial & Waterlily Fountain + Cross Rose Pergola Arches inside the Walled Garden
      const fountainPool = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.72, 0.18, 16), waterMat);
      fountainPool.position.set(0, 0.85, -0.15);
      const sundialPedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 0.58, 10), trimStoneMat);
      sundialPedestal.position.set(0, 1.12, -0.15);
      g.add(fountainPool, sundialPedestal);

      // Blooming Crimson & Pink Rose Clusters along Walls & Arches
      for (const [rx, rz] of [
        [-1.35, -0.15],
        [1.35, -0.15],
        [-1.65, -1.45],
        [1.65, -1.45],
        [-0.55, 1.35],
        [0.55, 1.35],
      ]) {
        const ivy = new THREE.Mesh(new THREE.DodecahedronGeometry(0.38, 0), secondaryMat);
        ivy.position.set(rx, 1.65, rz);
        const roses = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 0), accentMat);
        roses.position.set(rx, 1.88, rz + 0.08);
        g.add(ivy, roses);
      }
      break;
    }

    case 8: {
      // ======================================================================
      // #8 PEMBERLEY ESTATE — PRIDE & PREJUDICE PALLADIAN PALACE & SERPENTINE LAKE
      // ======================================================================
      // Broad Serpentine Mirror Lake & Three-Arch Stone Bridge in Foreground
      const pemberleyLake = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.14, 1.65), waterMat);
      pemberleyLake.position.set(0, 0.74, 1.15);
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.26, 0.58), trimStoneMat);
      bridge.position.set(-0.85, 0.92, 1.15);
      g.add(pemberleyLake, bridge);

      // Grand Chatsworth-Style Golden Palladian Mansion with Corinthian Portico & Pediment
      const mainPalace = new THREE.Mesh(new THREE.BoxGeometry(3.75, 1.68, 1.85), primaryMat);
      mainPalace.position.set(-0.2, 1.62, -0.58);
      const roofBalustrade = new THREE.Mesh(new THREE.BoxGeometry(3.85, 0.16, 1.95), trimStoneMat);
      roofBalustrade.position.set(-0.2, 2.52, -0.58);
      const porticoPediment = new THREE.Mesh(new THREE.ConeGeometry(1.15, 0.52, 4), trimStoneMat);
      porticoPediment.rotation.y = Math.PI / 4;
      porticoPediment.scale.set(1.35, 1, 0.4);
      porticoPediment.position.set(-0.2, 2.75, 0.28);
      g.add(mainPalace, roofBalustrade, porticoPediment);

      for (let cx = -0.95; cx <= 0.55; cx += 0.3) {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 1.48, 8), whiteMat);
        col.position.set(cx, 1.55, 0.38);
        g.add(col);
      }

      // Classical Domed Temple Folly on the Wooded Hill (Right)
      const follyBase = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.52, 0.68, 12), whiteMat);
      follyBase.position.set(2.05, 1.35, -0.35);
      const follyDome = new THREE.Mesh(new THREE.SphereGeometry(0.48, 12, 10), goldMat);
      follyDome.position.set(2.05, 1.78, -0.35);
      g.add(follyBase, follyDome);
      break;
    }

    default: {
      // ======================================================================
      // #9–#12 RECOMMENDED CANDIDATE SCENES (Kyoto / Provence / Amalfi / Adriatic Bakery)
      // ======================================================================
      const waterFeature = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.14, 1.45), waterMat);
      waterFeature.position.set(0, 0.74, 1.15);
      const mainVilla = new THREE.Mesh(new THREE.BoxGeometry(2.85, 1.55, 1.65), primaryMat);
      mainVilla.position.set(-0.35, 1.52, -0.45);
      const villaRoof = new THREE.Mesh(new THREE.ConeGeometry(2.15, 0.85, 4), secondaryMat);
      villaRoof.rotation.y = Math.PI / 4;
      villaRoof.scale.set(1.18, 1, 0.78);
      villaRoof.position.set(-0.35, 2.68, -0.45);
      const tower = new THREE.Mesh(new THREE.BoxGeometry(0.75, 2.65, 0.75), primaryMat);
      tower.position.set(1.45, 2.08, -0.45);
      const towerCap = new THREE.Mesh(new THREE.ConeGeometry(0.62, 0.75, 4), accentMat);
      towerCap.rotation.y = Math.PI / 4;
      towerCap.position.set(1.45, 3.75, -0.45);
      g.add(waterFeature, mainVilla, villaRoof, tower, towerCap);

      const t1 = createTree(idx === 9 ? 'maple' : 'cypress', [-2.05, 0.78, -0.35], 0.95);
      const t2 = createTree(idx === 9 ? 'blossom' : 'oak', [2.05, 0.78, 0.35], 0.9);
      g.add(t1, t2);
      break;
    }
  }

  // Tag main residence roof & solid exterior wall shells so 1F/2F Cutaway mode peels them back
  // to reveal the complete 2-story detailed interior right on the island!
  g.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      if (child.position.y >= 2.25) {
        child.userData.isRoof = true;
        child.userData.floorLevel = 3;
      } else if (
        child.geometry instanceof THREE.BoxGeometry &&
        child.geometry.parameters.width >= 1.4 &&
        child.geometry.parameters.height >= 0.95 &&
        child.geometry.parameters.depth >= 1.1 &&
        child.position.y >= 1.1
      ) {
        child.userData.isExteriorWallShell = true;
      } else if (
        child.geometry instanceof THREE.SphereGeometry &&
        child.geometry.parameters.radius >= 2.0 &&
        child.position.y >= 0.65
      ) {
        // Hobbiton Bag End turf mound shell lifts off in 1F/2F interior inspection mode
        child.userData.isExteriorWallShell = true;
      }
    }
  });

  // Embed bespoke 2-story detailed interior (diorama_dollhouse_21 to 32) directly inside the main residence!
  const interiorPosMap: Record<number, [number, number, number]> = {
    1: [1.15, 0.92, -1.25], // Venice Palazzo
    2: [-0.35, 0.78, -0.95], // Cotswolds Bibury Row
    3: [1.15, 0.78, -0.35], // Swiss Alps Chalet
    4: [0, 0.76, -0.45], // Hobbiton Bag End Burrow
    5: [-0.45, 1.25, -0.15], // Hogwarts Great Hall
    6: [0.1, 0.78, -0.35], // Green Gables Farmhouse
    7: [0, 0.78, -0.55], // Secret Garden Conservatory Manor
    8: [-0.2, 0.82, -0.58], // Pemberley Palladian Palace
    9: [-0.35, 0.78, -0.45], // Kyoto Machiya
    10: [-0.35, 0.78, -0.45], // Provence Stone Mas
    11: [-0.35, 0.78, -0.45], // Amalfi & Como Villa
    12: [-0.35, 0.78, -0.45], // Adriatic Seaside Bakery
  };
  const interiorScaleMap: Record<number, number> = {
    1: 0.44,
    2: 0.52,
    3: 0.42,
    4: 0.52,
    5: 0.46,
    6: 0.48,
    7: 0.48,
    8: 0.54,
    9: 0.48,
    10: 0.48,
    11: 0.48,
    12: 0.48,
  };

  const embeddedInterior = createEmbeddedDetailedInterior(
    island,
    variant,
    20 + idx,
    interiorPosMap[idx] || [0, 0.78, -0.45],
    interiorScaleMap[idx] || 0.48
  );
  g.add(embeddedInterior);

  addShadows(g);
  master.add(g);
  return master;
}
