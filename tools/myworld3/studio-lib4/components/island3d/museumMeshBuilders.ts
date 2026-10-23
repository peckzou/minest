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
 * Handcrafted 3D Low-Poly Architectural Builder for the 20 Grand Museum Complexes (BD-101 to BD-120).
 * Monumental multi-wing museum layouts with grand colonnades, domes, atriums,
 * reflecting pools, and distinctive architectural signatures on clean foundation plinths.
 */
export function buildMuseumBuildingScene(
  island: IslandMetadata,
  variant: IslandVariant
): THREE.Group {
  const master = new THREE.Group();

  const p0 = island.palette[0]?.hex || '#3B82F6';
  const p1 = island.palette[1]?.hex || '#1E293B';
  const p2 = island.palette[2]?.hex || '#F59E0B';
  const p3 = island.palette[3]?.hex || '#10B981';

  // Monumental Architectural Plinth (3.6 x 0.14 x 3.2 for grand museum complexes)
  const isCircularPlinth = island.terrainSpecs.shape === 'circular';
  const plinthMat = mat('#F1F5F9', { roughness: 0.85 });
  const trimMat = mat('#E2E8F0', { roughness: 0.78 });

  if (isCircularPlinth) {
    const slab = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.18, 0.14, 32), plinthMat);
    slab.position.y = 0.07;
    slab.receiveShadow = true;
    const step = new THREE.Mesh(new THREE.CylinderGeometry(1.95, 2.02, 0.08, 32), trimMat);
    step.position.y = 0.16;
    master.add(slab, step);
  } else {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.14, 3.2), plinthMat);
    slab.position.y = 0.07;
    slab.receiveShadow = true;
    const step = new THREE.Mesh(new THREE.BoxGeometry(3.35, 0.08, 2.95), trimMat);
    step.position.y = 0.16;
    master.add(slab, step);
  }

  const b = new THREE.Group();
  b.position.y = 0.18;

  switch (island.slug) {
    // =====================================================================
    // 1. Grand Neoclassical Fine Arts Museum
    // =====================================================================
    case 'building-museum-neoclassical-fine-arts': {
      // Main central gallery block
      const centralHall = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.25, 1.4), mat(p0));
      centralHall.position.set(0, 0.625, -0.1);
      b.add(centralHall);

      // Flanking East and West Gallery Wings
      [-1.15, 1.15].forEach((x) => {
        const wing = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.95, 1.2), mat(p0));
        wing.position.set(x, 0.475, -0.15);
        const wingRoof = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.1, 1.25), mat(p1));
        wingRoof.position.set(x, 0.975, -0.15);
        b.add(wing, wingRoof);
      });

      // Monumental Octastyle Portico (8 Corinthian Columns)
      const porticoFloor = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 0.55), mat(p0));
      porticoFloor.position.set(0, 0.18, 0.72);
      b.add(porticoFloor);

      const colSpacing = [-0.55, -0.38, -0.22, -0.07, 0.07, 0.22, 0.38, 0.55];
      colSpacing.forEach((x) => {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 1.05, 8), mat(p0));
        col.position.set(x, 0.74, 0.88);
        b.add(col);
      });

      // Triangular Pediment over Portico
      const pediment = new THREE.Mesh(new THREE.ConeGeometry(0.82, 0.38, 4), mat(p0));
      pediment.rotation.y = Math.PI / 4;
      pediment.scale.set(1.15, 1, 0.45);
      pediment.position.set(0, 1.42, 0.76);

      // Gold Tympanum Relief Accent
      const tympanumGold = new THREE.Mesh(new THREE.CircleGeometry(0.12, 8), mat(p2, { metalness: 0.75 }));
      tympanumGold.position.set(0, 1.35, 0.94);
      b.add(pediment, tympanumGold);

      // Central Drum & Ribbed Dome
      const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.62, 0.38, 16), mat(p0));
      drum.position.set(0, 1.38, -0.1);
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.56, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat(p1));
      dome.position.set(0, 1.57, -0.1);
      const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.25, 8), mat(p0));
      lantern.position.set(0, 2.2, -0.1);
      const finial = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), mat(p2, { metalness: 0.8 }));
      finial.position.set(0, 2.36, -0.1);
      b.add(drum, dome, lantern, finial);

      // Monumental Cascading Steps
      const stairs = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.14, 0.45), mat(p0));
      stairs.position.set(0, 0.07, 1.15);
      b.add(stairs);

      // Twin Symmetry Reflecting Pools with Water Jets
      [-1.0, 1.0].forEach((x) => {
        const poolBorder = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.06, 0.65), mat(p0));
        poolBorder.position.set(x, 0.03, 0.85);
        const water = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.07, 0.55), createWaterMat(p3));
        water.position.set(x, 0.04, 0.85);
        const jet = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.16, 6), mat(p2, { metalness: 0.6 }));
        jet.position.set(x, 0.11, 0.85);
        b.add(poolBorder, water, jet);
      });
      break;
    }

    // =====================================================================
    // 2. Paleontology & Natural History Grand Hall
    // =====================================================================
    case 'building-museum-paleontology-natural-history': {
      // Main central vaulted body
      const mainBody = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.15, 1.6), mat(p0));
      mainBody.position.set(0, 0.58, 0);
      b.add(mainBody);

      // Soaring Central Glass Barrel Vault (Clerestory Skylight)
      const barrelVault = new THREE.Mesh(
        new THREE.CylinderGeometry(0.65, 0.65, 1.65, 16, 1, false, 0, Math.PI),
        createGlassMat(p2, 0.65)
      );
      barrelVault.rotation.z = Math.PI / 2;
      barrelVault.position.set(0, 1.15, 0);

      // Iron vault ribs
      [-0.6, -0.2, 0.2, 0.6].forEach((z) => {
        const rib = new THREE.Mesh(
          new THREE.CylinderGeometry(0.67, 0.67, 0.06, 16, 1, false, 0, Math.PI),
          mat(p1, { metalness: 0.5 })
        );
        rib.rotation.z = Math.PI / 2;
        rib.position.set(0, 1.15, z);
        b.add(rib);
      });
      b.add(barrelVault);

      // Dinosaur Silhouette Model inside Atrium (Sauropod silhouette visible through glass)
      const dinoSpine = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.9), mat(p3));
      dinoSpine.position.set(0, 0.75, 0);
      const dinoNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.5, 6), mat(p3));
      dinoNeck.position.set(0, 1.05, 0.4);
      dinoNeck.rotation.x = -0.35;
      const dinoHead = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.15), mat(p3));
      dinoHead.position.set(0, 1.25, 0.55);
      b.add(dinoSpine, dinoNeck, dinoHead);

      // Twin Romanesque Towers with Pyramid Caps
      [-0.85, 0.85].forEach((x) => {
        const tower = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.65, 0.45), mat(p0));
        tower.position.set(x, 0.825, 0.7);
        const roof = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.65, 4), mat(p1));
        roof.rotation.y = Math.PI / 4;
        roof.position.set(x, 1.95, 0.7);
        b.add(tower, roof);
      });

      // Triple Concentric Arched Romanesque Portal
      const portalWall = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.85, 0.15), mat(p0));
      portalWall.position.set(0, 0.425, 0.82);
      const portalArch = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.06, 8, 12, Math.PI), mat(p3));
      portalArch.position.set(0, 0.42, 0.88);
      b.add(portalWall, portalArch);

      // Sunken Fossil Dig Court with Ammonite Spiral
      const fossilPit = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.06, 16), mat('#78350F'));
      fossilPit.position.set(0, 0.03, 1.15);
      const ammonite = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.04, 6, 12), mat(p3, { roughness: 0.9 }));
      ammonite.rotation.x = Math.PI / 2;
      ammonite.position.set(0, 0.06, 1.15);
      b.add(fossilPit, ammonite);
      break;
    }

    // =====================================================================
    // 3. Contemporary Cantilevered Cube Art Museum
    // =====================================================================
    case 'building-museum-contemporary-cantilever-art': {
      // Transparent Glass Lobby Cube (Base)
      const glassLobby = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.75, 1.4), createGlassMat(p2, 0.7));
      glassLobby.position.set(0, 0.375, 0);
      b.add(glassLobby);

      // Interlocking Solid Cantilever Volumes
      // Main Upper White Block (Projecting forward and to the left)
      const upperCubeA = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.7, 1.25), mat(p0));
      upperCubeA.position.set(-0.35, 1.05, 0.25);
      upperCubeA.rotation.y = 0.08;
      b.add(upperCubeA);

      // Secondary Zinc Dark Block (Offsetting back and right)
      const upperCubeB = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.65, 1.4), mat(p1));
      upperCubeB.position.set(0.35, 1.45, -0.2);
      upperCubeB.rotation.y = -0.06;
      b.add(upperCubeB);

      // Sculptural Rooftop Skydeck Terrace with Glass Railing
      const skydeck = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.6), mat(p0));
      skydeck.position.set(-0.4, 1.44, 0.4);
      const railing = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.16, 0.58), createGlassMat('#38BDF8', 0.5));
      railing.position.set(-0.4, 1.54, 0.4);
      b.add(skydeck, railing);

      // Black Granite Reflecting Pool beneath the cantilever
      const pool = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.04, 0.95), createWaterMat('#0F172A'));
      pool.position.set(-0.55, 0.02, 0.85);
      b.add(pool);

      // Red Calder Kinetic Mobile in Plaza
      const mobilePole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.7, 6), mat('#1E293B'));
      mobilePole.position.set(0.75, 0.35, 0.85);
      const mobileArm1 = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.02, 0.02), mat(p3));
      mobileArm1.position.set(0.75, 0.68, 0.85);
      mobileArm1.rotation.y = 0.4;
      const redDisc = new THREE.Mesh(new THREE.CircleGeometry(0.12, 10), mat(p3));
      redDisc.position.set(0.95, 0.68, 0.85);
      b.add(mobilePole, mobileArm1, redDisc);
      break;
    }

    // =====================================================================
    // 4. Aerospace & Planetarium Mega Museum
    // =====================================================================
    case 'building-museum-aerospace-planetarium-complex': {
      // Runway tarmac plinth lines
      const runwayLine = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 2.6), mat('#FACC15'));
      runwayLine.position.set(1.0, 0.01, 0);
      b.add(runwayLine);

      // Giant Geodesic Planetarium Sphere (Faceted icosahedron)
      const sphere = new THREE.Mesh(new THREE.IcosahedronGeometry(0.75, 2), mat(p1, { roughness: 0.4 }));
      sphere.position.set(0, 0.85, -0.15);
      const sphereRing = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.04, 8, 24), mat(p0));
      sphereRing.rotation.x = Math.PI / 2;
      sphereRing.position.set(0, 0.85, -0.15);
      b.add(sphere, sphereRing);

      // Sweeping Aerodynamic Supersonic Wing Concourses
      [-0.95, 0.95].forEach((x, idx) => {
        const wing = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.65, 1.8), mat(p0));
        wing.position.set(x, 0.42, 0.1);
        wing.rotation.y = idx === 0 ? 0.18 : -0.18;

        const wingRoof = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.85, 8, 1, false, 0, Math.PI), mat(p0));
        wingRoof.rotation.z = Math.PI / 2;
        wingRoof.rotation.y = idx === 0 ? 0.18 : -0.18;
        wingRoof.position.set(x, 0.72, 0.1);

        const glassFacade = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.35, 0.1), createGlassMat(p1, 0.7));
        glassFacade.position.set(x, 0.35, 0.95);
        glassFacade.rotation.y = idx === 0 ? 0.18 : -0.18;

        b.add(wing, wingRoof, glassFacade);
      });

      // Rocket Launch Gantry Tower with Multi-Stage Rocket
      const gantry = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.85, 0.24), mat(p2, { wireframe: true }));
      gantry.position.set(-1.15, 0.925, 0.75);
      const rocket = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 1.6, 8), mat('#F8FAFC'));
      rocket.position.set(-0.85, 0.8, 0.75);
      const rocketCone = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.38, 8), mat(p2));
      rocketCone.position.set(-0.85, 1.75, 0.75);
      b.add(gantry, rocket, rocketCone);
      break;
    }

    // =====================================================================
    // 5. Oceanic & Maritime Mega Museum
    // =====================================================================
    case 'building-museum-oceanic-maritime-heritage': {
      // Seawater moat base surrounding the drydock
      const moat = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.05, 1.0), createWaterMat('#0284C7'));
      moat.position.set(0, 0.02, 0.85);
      b.add(moat);

      // Cascading Wave-Form Titanium Roof Shells (3 Sweeping Arches)
      const waveShelves = [
        { x: -0.7, y: 0.65, z: -0.2, w: 1.1, h: 0.7, rz: 0.25 },
        { x: 0.1, y: 0.9, z: -0.3, w: 1.3, h: 0.9, rz: 0.15 },
        { x: 0.9, y: 0.75, z: -0.1, w: 1.1, h: 0.75, rz: 0.3 },
      ];
      waveShelves.forEach((s) => {
        const shell = new THREE.Mesh(new THREE.BoxGeometry(s.w, 0.65, 1.6), mat(p1));
        shell.position.set(s.x, s.y / 2, s.z);

        const curve = new THREE.Mesh(
          new THREE.CylinderGeometry(s.w * 0.55, s.w * 0.55, 1.65, 12, 1, false, 0, Math.PI),
          mat(p0)
        );
        curve.rotation.z = Math.PI / 2 + s.rz;
        curve.position.set(s.x, s.y, s.z);
        b.add(shell, curve);
      });

      // Modern Glass & Titanium Lighthouse Spire
      const lighthouse = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, 1.75, 8), mat(p1));
      lighthouse.position.set(-1.15, 0.875, -0.4);
      const beaconGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.16, 0.28, 8), createGlassMat(p3, 0.8));
      beaconGlass.position.set(-1.15, 1.82, -0.4);
      const beaconCap = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.2, 8), mat(p0));
      beaconCap.position.set(-1.15, 2.05, -0.4);
      b.add(lighthouse, beaconGlass, beaconCap);

      // Dry-Dock Historic Timber Galleon Display
      const dockWalls = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.16, 0.75), mat('#475569'));
      dockWalls.position.set(0.25, 0.08, 0.85);
      const shipHull = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.24, 0.32), mat(p2));
      shipHull.position.set(0.25, 0.2, 0.85);

      // 3 Masts and Spars
      [-0.15, 0.25, 0.55].forEach((mx, mi) => {
        const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.65 + mi * 0.08, 6), mat(p2));
        mast.position.set(mx, 0.5 + mi * 0.04, 0.85);
        const yard = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.015, 0.35), mat(p2));
        yard.position.set(mx, 0.65, 0.85);
        b.add(mast, yard);
      });
      b.add(dockWalls, shipHull);
      break;
    }

    // =====================================================================
    // 6. Ancient Civilizations & Archaeological Vault
    // =====================================================================
    case 'building-museum-ancient-antiquities-hypostyle': {
      // Monumental Battered Sandstone Pylon (Twin Towers with Sloped Walls)
      [-0.65, 0.65].forEach((x) => {
        const pylon = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.55, 1.45, 4), mat(p0));
        pylon.rotation.y = Math.PI / 4;
        pylon.position.set(x, 0.725, 0.4);
        const cornice = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.1, 0.7), mat(p2));
        cornice.position.set(x, 1.48, 0.4);
        b.add(pylon, cornice);
      });

      // Central Portal Gate
      const gateArch = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.95, 0.4), mat(p0));
      gateArch.position.set(0, 0.475, 0.4);
      b.add(gateArch);

      // Twin Black Granite Obelisks with Golden Pyramidions
      [-0.95, 0.95].forEach((x) => {
        const obelisk = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.09, 1.55, 4), mat(p1));
        obelisk.rotation.y = Math.PI / 4;
        obelisk.position.set(x, 0.775, 0.95);
        const pyramidion = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.18, 4), mat(p3, { metalness: 0.85 }));
        pyramidion.rotation.y = Math.PI / 4;
        pyramidion.position.set(x, 1.62, 0.95);
        b.add(obelisk, pyramidion);
      });

      // Rear Hypostyle Courtyard & Sanctuary Vault
      const rearSanctuary = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.95, 1.3), mat(p0));
      rearSanctuary.position.set(0, 0.475, -0.5);
      b.add(rearSanctuary);

      // Hypostyle Lotus Columns inside Courtyard
      const colX = [-0.65, -0.22, 0.22, 0.65];
      const colZ = [-0.25, -0.55, -0.85];
      colX.forEach((cx) => {
        colZ.forEach((cz) => {
          const col = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.95, 8), mat(p0));
          col.position.set(cx, 0.475, cz);
          const capital = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.12, 8), mat(p2));
          capital.position.set(cx, 0.98, cz);
          b.add(col, capital);
        });
      });

      // Linear Papyrus Canal
      const canal = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, 1.4), createWaterMat('#0D9488'));
      canal.position.set(0, 0.03, -0.45);
      b.add(canal);
      break;
    }

    // =====================================================================
    // 7. Prismatic Crystal & Origami Glass Museum
    // =====================================================================
    case 'building-museum-origami-crystal-glass': {
      // 360-Degree Infinity Mirror Moat Base
      const mirrorMoat = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.04, 2.9), createWaterMat(p3));
      mirrorMoat.position.set(0, 0.02, 0);
      b.add(mirrorMoat);

      // Central Podium Island
      const islandBase = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.1, 2.3), mat('#F8FAFC'));
      islandBase.position.set(0, 0.06, 0);
      b.add(islandBase);

      // Folded Origami Facets & Prismatic Crystals (4 Asymmetric Folded Pyramids)
      const crystalPyramids = [
        { x: -0.5, z: -0.3, r: 0.95, h: 1.6, matChoice: p0 },
        { x: 0.5, z: -0.2, r: 0.85, h: 1.35, matChoice: p1 },
        { x: -0.4, z: 0.45, r: 0.75, h: 1.15, matChoice: p2 },
        { x: 0.45, z: 0.4, r: 0.8, h: 1.25, matChoice: p0 },
      ];
      crystalPyramids.forEach((cp) => {
        const prism = new THREE.Mesh(new THREE.ConeGeometry(cp.r, cp.h, 5), createGlassMat(cp.matChoice, 0.75));
        prism.rotation.y = Math.PI / 5 + cp.x;
        prism.position.set(cp.x, cp.h / 2 + 0.1, cp.z);

        const wire = new THREE.Mesh(new THREE.ConeGeometry(cp.r * 1.01, cp.h * 1.01, 5), mat('#FFFFFF', { wireframe: true }));
        wire.rotation.y = Math.PI / 5 + cp.x;
        wire.position.set(cp.x, cp.h / 2 + 0.1, cp.z);
        b.add(prism, wire);
      });

      // Folded Titanium Origami Wing Canopies flanking the entrance
      [-1.0, 1.0].forEach((x, idx) => {
        const wing = new THREE.Mesh(new THREE.ConeGeometry(0.7, 0.9, 3), mat(p1));
        wing.rotation.z = idx === 0 ? 0.7 : -0.7;
        wing.rotation.y = Math.PI / 3;
        wing.position.set(x, 0.55, 0.1);
        b.add(wing);
      });

      // Pedestrian Cable-Stayed Bridge across Moat
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.06, 0.7), mat('#CBD5E1'));
      bridge.position.set(0, 0.09, 1.15);
      b.add(bridge);
      break;
    }

    // =====================================================================
    // 8. Imperial Palace Garden & Heritage Museum
    // =====================================================================
    case 'building-museum-oriental-imperial-palace': {
      // Tiered White Marble Balustrade Terraces (3 Tiers)
      [
        { w: 2.9, d: 2.4, y: 0.06 },
        { w: 2.5, d: 2.0, y: 0.14 },
        { w: 2.1, d: 1.6, y: 0.22 },
      ].forEach((tier) => {
        const t = new THREE.Mesh(new THREE.BoxGeometry(tier.w, 0.08, tier.d), mat(p2));
        t.position.set(0, tier.y, -0.2);
        b.add(t);
      });

      // Monumental Double-Eaved Imperial Throne Hall
      const hallBody = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.75, 1.1), mat(p1));
      hallBody.position.set(0, 0.65, -0.2);
      b.add(hallBody);

      // Vermilion Pillars around the Perimeter
      [-0.75, -0.38, 0, 0.38, 0.75].forEach((px) => {
        [-0.45, 0.45].forEach((pz) => {
          const col = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.75, 8), mat(p1));
          col.position.set(px, 0.65, -0.2 + pz);
          b.add(col);
        });
      });

      // Lower Eave (Flying Swallow Eaves)
      const eave1 = new THREE.Mesh(new THREE.ConeGeometry(1.55, 0.4, 4), mat(p0));
      eave1.rotation.y = Math.PI / 4;
      eave1.scale.set(1.4, 1, 0.95);
      eave1.position.set(0, 1.1, -0.2);

      // Upper Eave & Ridge Finial
      const eave2 = new THREE.Mesh(new THREE.ConeGeometry(1.25, 0.45, 4), mat(p0));
      eave2.rotation.y = Math.PI / 4;
      eave2.scale.set(1.3, 1, 0.9);
      eave2.position.set(0, 1.48, -0.2);

      const ridgeFinial = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.08, 0.12), mat(p0));
      ridgeFinial.position.set(0, 1.72, -0.2);
      b.add(eave1, eave2, ridgeFinial);

      // Serpentine Lotus Canal Moat
      const lotusMoat = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.04, 0.6), createWaterMat(p3));
      lotusMoat.position.set(0, 0.03, 0.85);
      b.add(lotusMoat);

      // Three Arched White Marble Moon Bridges
      [-0.7, 0, 0.7].forEach((bx) => {
        const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.22, 12, 1, false, 0, Math.PI), mat(p2));
        bridge.rotation.z = Math.PI / 2;
        bridge.position.set(bx, 0.08, 0.85);
        b.add(bridge);
      });
      break;
    }

    // =====================================================================
    // 9. Industrial Heritage & Locomotive Museum
    // =====================================================================
    case 'building-museum-industrial-train-locomotive': {
      // Victorian Red Brick Terminal Train Shed (Vaulted Body)
      const shed = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.15, 1.7), mat(p0));
      shed.position.set(-0.35, 0.58, 0);

      const shedArch = new THREE.Mesh(
        new THREE.CylinderGeometry(0.85, 0.85, 1.72, 16, 1, false, 0, Math.PI),
        mat(p1)
      );
      shedArch.rotation.z = Math.PI / 2;
      shedArch.position.set(-0.35, 1.15, 0);

      // Glazed Clerestory Roof Monitor along Ridge
      const monitor = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, 1.55), createGlassMat(p2, 0.65));
      monitor.position.set(-0.35, 1.7, 0);
      b.add(shed, shedArch, monitor);

      // Tall Victorian Brick Clock Tower with Copper Roof
      const clockTower = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.1, 0.5), mat(p0));
      clockTower.position.set(0.85, 1.05, -0.55);
      const clockRoof = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.65, 4), mat(p3));
      clockRoof.rotation.y = Math.PI / 4;
      clockRoof.position.set(0.85, 2.38, -0.55);
      const clockFace = new THREE.Mesh(new THREE.CircleGeometry(0.12, 12), mat('#FFFFFF'));
      clockFace.position.set(0.85, 1.85, -0.29);
      b.add(clockTower, clockRoof, clockFace);

      // Outdoor Locomotive Turntable with Tracks
      const turntableBase = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.68, 0.06, 20), mat('#334155'));
      turntableBase.position.set(0.85, 0.03, 0.65);
      const railBridge = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.08, 0.25), mat(p1));
      railBridge.position.set(0.85, 0.07, 0.65);
      railBridge.rotation.y = 0.35;
      b.add(turntableBase, railBridge);

      // Historic Steam Locomotive on Turntable
      const engineBoiler = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.6, 10), mat(p1, { metalness: 0.7 }));
      engineBoiler.rotation.z = Math.PI / 2;
      engineBoiler.position.set(0.85, 0.22, 0.65);
      engineBoiler.rotation.y = 0.35;

      const engineCab = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.28, 0.22), mat(p0));
      engineCab.position.set(0.65, 0.24, 0.65);
      engineCab.rotation.y = 0.35;

      const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.18, 8), mat(p3));
      stack.position.set(1.05, 0.38, 0.65);
      b.add(engineBoiler, engineCab, stack);
      break;
    }

    // =====================================================================
    // 10. Living Biosphere & Botanical Conservatory Museum
    // =====================================================================
    case 'building-museum-biodiversity-living-biomes': {
      // Outdoor perimeter pond
      const pond = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.95, 0.04, 28), createWaterMat(p2));
      pond.position.set(0, 0.02, 0);
      b.add(pond);

      // 3 Interconnected Geodesic Bio-Domes
      const biomes = [
        { x: -0.45, z: -0.2, r: 0.95, hScale: 1.1, c: p0 }, // Main Tropical Rainforest
        { x: 0.65, z: -0.15, r: 0.75, hScale: 0.95, c: p0 }, // Subtropical/Desert
        { x: 0.1, z: 0.65, r: 0.65, hScale: 0.85, c: p0 }, // Alpine/Orchid
      ];
      biomes.forEach((bm) => {
        const dome = new THREE.Mesh(new THREE.IcosahedronGeometry(bm.r, 2), createGlassMat(bm.c, 0.7));
        dome.scale.set(1, bm.hScale, 1);
        dome.position.set(bm.x, bm.r * bm.hScale * 0.65, bm.z);

        const frame = new THREE.Mesh(new THREE.IcosahedronGeometry(bm.r * 1.01, 2), mat(p1, { wireframe: true }));
        frame.scale.set(1, bm.hScale, 1);
        frame.position.set(bm.x, bm.r * bm.hScale * 0.65, bm.z);
        b.add(dome, frame);
      });

      // Suspended Canopy Skywalk weaving between the biomes
      const bridgeA = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.06, 0.18), mat(p3));
      bridgeA.position.set(0.1, 0.75, -0.18);
      bridgeA.rotation.y = 0.2;
      const bridgeB = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.06, 0.18), mat(p3));
      bridgeB.position.set(0.35, 0.6, 0.25);
      bridgeB.rotation.y = -0.7;
      b.add(bridgeA, bridgeB);

      // Indoor Mountain Waterfall Rockwork inside Main Dome
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.4, 0), mat('#475569'));
      rock.position.set(-0.45, 0.45, -0.2);
      b.add(rock);
      break;
    }

    // =====================================================================
    // 11. Digital Media & Holographic Cyber Museum
    // =====================================================================
    case 'building-museum-digital-media-cyber-matrix': {
      // Obsidian Monolith Main Gallery Cube
      const monolith = new THREE.Mesh(new THREE.BoxGeometry(1.65, 1.45, 1.5), mat(p0, { roughness: 0.2 }));
      monolith.position.set(0, 0.725, -0.1);
      b.add(monolith);

      // Glowing Neon Optical Circuit Grooves (Horizontal and Vertical Inlays)
      const circuit1 = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.06, 0.06), mat(p1, { emissive: p1, emissiveIntensity: 0.6 }));
      circuit1.position.set(0, 0.85, 0.66);
      const circuit2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.46, 0.06), mat(p1, { emissive: p1, emissiveIntensity: 0.6 }));
      circuit2.position.set(0.45, 0.73, 0.66);
      b.add(circuit1, circuit2);

      // Elevated Glazed Skyway with Magenta Edge Glow
      const skyway = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.28, 0.45), createGlassMat(p2, 0.8));
      skyway.position.set(0.2, 1.15, 0.85);
      b.add(skyway);

      // Interactive Voxel Pillar Plaza (12 pillars of varying heights)
      const pillarCoords = [
        [-0.8, 0.6], [-0.5, 0.75], [-0.2, 0.85], [0.1, 0.7], [0.4, 0.9], [0.7, 0.75],
        [-0.7, 1.05], [-0.4, 1.15], [-0.1, 1.25], [0.2, 1.1], [0.5, 1.25], [0.8, 1.1],
      ];
      pillarCoords.forEach(([px, pz], idx) => {
        const ph = 0.25 + (idx % 4) * 0.18;
        const col = (idx % 2 === 0) ? p1 : p3;
        const voxel = new THREE.Mesh(new THREE.BoxGeometry(0.16, ph, 0.16), mat(col, { emissive: col, emissiveIntensity: 0.4 }));
        voxel.position.set(px, ph / 2, pz);
        b.add(voxel);
      });
      break;
    }

    // =====================================================================
    // 12. Islamic Arts & Arabesque Court Museum
    // =====================================================================
    case 'building-museum-islamic-arts-arabesque': {
      // Cream Limestone Palace Body
      const palace = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.15, 1.55), mat(p0));
      palace.position.set(0, 0.575, -0.2);
      b.add(palace);

      // Monumental Horseshoe-Arched Iwan Entrance Portal
      const iwanRecess = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.95, 0.35), mat(p1));
      iwanRecess.position.set(0, 0.475, 0.5);
      const horseshoeArch = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.06, 8, 16, Math.PI * 1.15), mat(p2));
      horseshoeArch.position.set(0, 0.65, 0.68);
      b.add(iwanRecess, horseshoeArch);

      // High Turquoise Onion Dome & Crescent Finial
      const domeDrum = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.55, 0.35, 16), mat(p0));
      domeDrum.position.set(0, 1.325, -0.2);
      const onionDome = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 12), mat(p1));
      onionDome.scale.set(1, 1.25, 1);
      onionDome.position.set(0, 1.7, -0.2);
      const finial = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.28, 6), mat(p2, { metalness: 0.8 }));
      finial.position.set(0, 2.45, -0.2);
      b.add(domeDrum, onionDome, finial);

      // Twin Flanking Minaret Towers
      [-1.0, 1.0].forEach((x) => {
        const minaret = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 2.1, 8), mat(p0));
        minaret.position.set(x, 1.05, 0.45);
        const balcony = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.18, 0.1, 8), mat(p2));
        balcony.position.set(x, 1.85, 0.45);
        const topCupola = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.35, 8), mat(p1));
        topCupola.position.set(x, 2.22, 0.45);
        b.add(minaret, balcony, topCupola);
      });

      // Charbagh Crossed Water Channels (Four-Garden Court)
      const waterN_S = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 1.0), createWaterMat(p3));
      waterN_S.position.set(0, 0.02, 0.95);
      const waterE_W = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.04, 0.18), createWaterMat(p3));
      waterE_W.position.set(0, 0.02, 0.95);
      const fountain = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.08, 8), mat(p0));
      fountain.position.set(0, 0.04, 0.95);
      b.add(waterN_S, waterE_W, fountain);
      break;
    }

    // =====================================================================
    // 13. Nordic Timber Craft & Sculpture Museum
    // =====================================================================
    case 'building-museum-nordic-wood-sculpture': {
      // Stepped Granite Foundation
      const baseStone = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.25, 2.2), mat(p3));
      baseStone.position.set(0, 0.125, 0);
      b.add(baseStone);

      // Glass Gallery Pavilion below the timber canopy
      const glassBody = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.75, 1.7), createGlassMat(p2, 0.6));
      glassBody.position.set(0, 0.625, 0);
      b.add(glassBody);

      // Sweeping Curved Glulam Timber Wave Roof (Organic Hyperbolic Wave)
      const waveSegments = [-0.9, -0.45, 0, 0.45, 0.9];
      waveSegments.forEach((x, idx) => {
        const hOffset = Math.sin((idx / 4) * Math.PI) * 0.35;
        const glulamBeam = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.12, 2.05), mat(p0));
        glulamBeam.position.set(x, 1.05 + hOffset, 0);
        glulamBeam.rotation.z = Math.cos((idx / 4) * Math.PI) * 0.15;
        b.add(glulamBeam);
      });

      // Vertical Cedar Slats on side facades
      [-1.15, 1.15].forEach((x) => {
        for (let sz = -0.7; sz <= 0.7; sz += 0.2) {
          const slat = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.72, 0.06), mat(p1));
          slat.position.set(x, 0.62, sz);
          b.add(slat);
        }
      });

      // Stepped Outdoor Pine Amphitheater
      [
        { r: 0.75, y: 0.15 },
        { r: 0.6, y: 0.25 },
        { r: 0.45, y: 0.35 },
      ].forEach((tier) => {
        const bench = new THREE.Mesh(new THREE.CylinderGeometry(tier.r, tier.r + 0.1, 0.08, 12, 1, false, 0, Math.PI), mat(p0));
        bench.rotation.y = Math.PI / 2;
        bench.position.set(-0.75, tier.y, 0.95);
        b.add(bench);
      });
      break;
    }

    // =====================================================================
    // 14. Fortress Bastion & Military Armory Museum
    // =====================================================================
    case 'building-museum-military-bastion-armory': {
      // Pentagonal Star Bastion Ramparts (5 Points)
      const rampartBase = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.85, 0.55, 5), mat(p0));
      rampartBase.position.set(0, 0.275, 0);
      b.add(rampartBase);

      // Central Octagonal Citadel Keep
      const citadel = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.85, 1.25, 8), mat(p0));
      citadel.position.set(0, 0.95, 0);
      const crenellations = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.82, 0.15, 8), mat(p1));
      crenellations.position.set(0, 1.65, 0);
      const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.75, 6), mat('#FFFFFF'));
      flagPole.position.set(0, 2.05, 0);
      const flag = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.18, 0.02), mat(p2));
      flag.position.set(0.15, 2.25, 0);
      b.add(citadel, crenellations, flagPole, flag);

      // Historic Bronze Cannons in Casemates (4 corner guns)
      const gunAngles = [0.3, 1.5, 2.8, 4.0];
      gunAngles.forEach((ang) => {
        const gun = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.45, 8), mat(p3, { metalness: 0.8 }));
        gun.rotation.z = Math.PI / 2;
        gun.rotation.y = ang;
        const gx = Math.cos(ang) * 1.15;
        const gz = Math.sin(ang) * 1.15;
        gun.position.set(gx, 0.58, gz);
        b.add(gun);
      });

      // Timber Drawbridge & Gateway
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.06, 0.85), mat(p1));
      bridge.position.set(0, 0.28, 1.25);
      const gateArch = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.65, 0.25), mat(p0));
      gateArch.position.set(0, 0.65, 0.95);
      b.add(bridge, gateArch);
      break;
    }

    // =====================================================================
    // 15. Haute Couture & Textile Design Museum
    // =====================================================================
    case 'building-museum-haute-couture-fashion': {
      // Black Granite Reflecting Runway Pool Base
      const blackPool = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.04, 2.7), createWaterMat('#0F172A'));
      blackPool.position.set(0, 0.02, 0);
      b.add(blackPool);

      // Central Glazed Spiraling Catwalk Rotunda
      const rotunda = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 1.6, 24), createGlassMat(p3, 0.65));
      rotunda.position.set(0, 0.8, 0);
      const rotundaCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.78, 0.1, 24), mat(p1, { metalness: 0.7 }));
      rotundaCrown.position.set(0, 1.65, 0);
      b.add(rotunda, rotundaCrown);

      // Undulating Billowing Silk Ribbon Shells (2 Spiraling Curved Bands)
      [-0.45, 0.45].forEach((offsetY, idx) => {
        const ribbon = new THREE.Mesh(
          new THREE.TorusGeometry(0.95 + idx * 0.2, 0.12, 8, 32, Math.PI * 1.4),
          mat(p0, { roughness: 0.35 })
        );
        ribbon.rotation.x = Math.PI / 2 + (idx === 0 ? 0.35 : -0.35);
        ribbon.position.set(0, 0.85 + offsetY, 0);
        b.add(ribbon);
      });

      // Golden Vertical Flute Louvers
      for (let i = 0; i < 16; i++) {
        const ang = (i / 16) * Math.PI * 2;
        const flute = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.55, 6), mat(p1, { metalness: 0.8 }));
        flute.position.set(Math.cos(ang) * 0.76, 0.8, Math.sin(ang) * 0.76);
        b.add(flute);
      }

      // Runway Access Bridge
      const runwayBridge = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.95), mat('#0F172A'));
      runwayBridge.position.set(0, 0.06, 1.15);
      b.add(runwayBridge);
      break;
    }

    // =====================================================================
    // 16. Musical Instrument & Acoustic Science Museum
    // =====================================================================
    case 'building-museum-musical-instruments-acoustic': {
      // Main Curved Cello-Form Resonator Auditorium
      const lowerCello = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 0.85, 16), mat(p0));
      lowerCello.position.set(-0.35, 0.425, -0.2);
      const upperCello = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.75, 0.75, 16), mat(p0));
      upperCello.position.set(-0.35, 0.95, -0.2);
      b.add(lowerCello, upperCello);

      // Soaring Harp Mast & Radiating Cable Canopy
      const harpMast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 2.2, 8), mat(p1, { metalness: 0.7 }));
      harpMast.position.set(0.65, 1.1, -0.15);
      harpMast.rotation.z = -0.18;
      b.add(harpMast);

      // Harp String Radiating Tensile Cables (8 strings)
      for (let s = 0; s < 8; s++) {
        const t = s / 7;
        const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1.45, 4), mat(p2));
        cable.position.set(0.1 + t * 0.6, 0.85 - t * 0.2, 0.3 + t * 0.5);
        cable.rotation.z = 0.55;
        b.add(cable);
      }

      // Stepped Concert Lawn Amphitheater
      [
        { r: 0.85, y: 0.1 },
        { r: 0.65, y: 0.18 },
        { r: 0.45, y: 0.26 },
      ].forEach((tier) => {
        const step = new THREE.Mesh(new THREE.CylinderGeometry(tier.r, tier.r + 0.1, 0.08, 12, 1, false, 0, Math.PI), mat('#16A34A'));
        step.rotation.y = -Math.PI / 4;
        step.position.set(0.6, tier.y, 0.7);
        b.add(step);
      });

      // Brass Horn Sound Collector Pavilion
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.45, 12), mat(p1, { metalness: 0.8 }));
      horn.rotation.x = Math.PI / 2;
      horn.position.set(-0.95, 0.45, 0.75);
      b.add(horn);
      break;
    }

    // =====================================================================
    // 17. Deep Space Cosmology & Radio Telescope Museum
    // =====================================================================
    case 'building-museum-cosmology-radio-telescope': {
      // Brutalist Concrete Base Complex
      const baseBlockA = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.85, 1.4), mat(p1));
      baseBlockA.position.set(-0.25, 0.425, 0);
      const baseBlockB = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.65, 1.1), mat(p1));
      baseBlockB.position.set(0.65, 0.325, -0.2);
      b.add(baseBlockA, baseBlockB);

      // Colossal Steerable Parabolic Radio Telescope Dish
      const dishPivot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.45, 8), mat('#334155'));
      dishPivot.position.set(-0.25, 1.05, 0);

      // Hollow parabolic dish (Sphere segment)
      const dish = new THREE.Mesh(
        new THREE.SphereGeometry(0.95, 20, 12, 0, Math.PI * 2, 0, Math.PI / 3),
        mat(p0)
      );
      dish.rotation.x = -Math.PI / 3.5;
      dish.position.set(-0.25, 1.5, 0);

      // Sub-reflector Feed Tripod
      const feedHorn = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.22, 6), mat(p3, { metalness: 0.85 }));
      feedHorn.rotation.x = -Math.PI / 3.5;
      feedHorn.position.set(-0.25, 1.95, 0.45);
      b.add(dishPivot, dish, feedHorn);

      // Twin Optical Telescope Revolving Domes
      [-0.15, 0.45].forEach((dz, idx) => {
        const domeBase = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.35, 0.3, 12), mat(p1));
        domeBase.position.set(0.75, 0.8, dz);
        const optDome = new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(p2));
        optDome.position.set(0.75, 0.95, dz);
        b.add(domeBase, optDome);
      });

      // Planetary Orbit Concentric Rings Plaza
      [0.4, 0.65, 0.9].forEach((or) => {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(or, 0.015, 6, 24), mat(p3));
        ring.rotation.x = Math.PI / 2;
        ring.position.set(0.2, 0.02, 0.95);
        b.add(ring);
      });
      break;
    }

    // =====================================================================
    // 18. Mesoamerican Gold & Solar Artifact Museum
    // =====================================================================
    case 'building-museum-mesoamerican-gold-solar': {
      // 4-Tiered Basalt Stepped Pyramid
      const pyramidTiers = [
        { w: 2.6, d: 2.4, y: 0.12, h: 0.24 },
        { w: 2.1, d: 1.9, y: 0.36, h: 0.24 },
        { w: 1.6, d: 1.4, y: 0.6, h: 0.24 },
        { w: 1.1, d: 0.95, y: 0.84, h: 0.24 },
      ];
      pyramidTiers.forEach((tier) => {
        const t = new THREE.Mesh(new THREE.BoxGeometry(tier.w, tier.h, tier.d), mat(p0));
        t.position.set(0, tier.y, -0.15);
        b.add(t);
      });

      // Crowning Gilded Sun Altar Temple Sanctuary
      const temple = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.45, 0.65), mat(p0));
      temple.position.set(0, 1.15, -0.15);
      const goldRoof = new THREE.Mesh(new THREE.ConeGeometry(0.65, 0.35, 4), mat(p1, { metalness: 0.85 }));
      goldRoof.rotation.y = Math.PI / 4;
      goldRoof.position.set(0, 1.55, -0.15);
      const sunDisc = new THREE.Mesh(new THREE.CircleGeometry(0.16, 12), mat(p1, { metalness: 0.9 }));
      sunDisc.position.set(0, 1.25, 0.19);
      b.add(temple, goldRoof, sunDisc);

      // Ceremonial Grand Staircase Ramp with Serpent Balustrades
      const stair = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.75, 1.1), mat(p0));
      stair.rotation.x = -0.55;
      stair.position.set(0, 0.45, 0.45);
      b.add(stair);

      // Feathered Serpent Stone Heads at Base
      [-0.32, 0.32].forEach((sx) => {
        const serpent = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 0.22), mat(p2));
        serpent.position.set(sx, 0.12, 0.95);
        b.add(serpent);
      });

      // Sunken Obsidian Reflecting Pool
      const pool = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.04, 0.5), createWaterMat('#0F172A'));
      pool.position.set(0, 0.02, 1.25);
      b.add(pool);
      break;
    }

    // =====================================================================
    // 19. Earth-Sheltered Indigenous Anthropology Museum
    // =====================================================================
    case 'building-museum-earth-sheltered-indigenous': {
      // Undulating Green Turf-Covered Earth Mounds (3 Overlapping Domes)
      const mounds = [
        { x: -0.55, z: -0.2, r: 1.1, hScale: 0.5 },
        { x: 0.45, z: -0.3, r: 0.95, hScale: 0.55 },
        { x: 0, z: 0.25, r: 0.85, hScale: 0.45 },
      ];
      mounds.forEach((m) => {
        const turf = new THREE.Mesh(new THREE.SphereGeometry(m.r, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(p0, { roughness: 0.9 }));
        turf.scale.set(1, m.hScale, 1);
        turf.position.set(m.x, 0.05, m.z);
        b.add(turf);
      });

      // Spiraling Conical Timber Skylight Horn
      const timberHorn = new THREE.Mesh(new THREE.ConeGeometry(0.48, 1.55, 10), mat(p2));
      timberHorn.position.set(-0.25, 0.85, -0.2);
      timberHorn.rotation.z = -0.15;
      const oculusGlass = new THREE.Mesh(new THREE.CircleGeometry(0.14, 10), createGlassMat(p3, 0.7));
      oculusGlass.position.set(-0.25, 1.62, -0.2);
      oculusGlass.rotation.x = -Math.PI / 2;
      b.add(timberHorn, oculusGlass);

      // Trio of Carved Cedar Totem Poles
      [-0.8, -0.55, -0.3].forEach((tx, idx) => {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 1.2 + idx * 0.15, 6), mat(p1));
        pole.position.set(tx, 0.6 + idx * 0.075, 0.85);

        // Wings on central totem
        if (idx === 1) {
          const wings = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.1, 0.03), mat(p2));
          wings.position.set(tx, 1.05, 0.85);
          b.add(wings);
        }
        b.add(pole);
      });

      // Sunken Circular Council Fire Hearth
      const pitRing = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 0.08, 16), mat('#78350F'));
      pitRing.position.set(0.55, 0.04, 0.85);
      const fireGlow = new THREE.Mesh(new THREE.CircleGeometry(0.2, 10), mat('#EA580C', { emissive: '#EA580C', emissiveIntensity: 0.6 }));
      fireGlow.rotation.x = -Math.PI / 2;
      fireGlow.position.set(0.55, 0.06, 0.85);
      b.add(pitRing, fireGlow);
      break;
    }

    // =====================================================================
    // 20. Futuristic AI Innovation & Civilization Center
    // =====================================================================
    case 'building-museum-future-ai-innovation-hall': {
      // Twin Streamlined Aerodynamic White Towers
      [-0.85, 0.85].forEach((x, idx) => {
        const tower = new THREE.Mesh(new THREE.BoxGeometry(0.75, 2.2, 0.85), mat(p0));
        tower.position.set(x, 1.1, -0.1);
        tower.rotation.y = idx === 0 ? 0.18 : -0.18;

        const towerCrown = new THREE.Mesh(new THREE.ConeGeometry(0.52, 0.65, 4), mat(p0));
        towerCrown.rotation.y = Math.PI / 4;
        towerCrown.position.set(x, 2.5, -0.1);

        const glassStrip = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.8, 0.86), createGlassMat(p1, 0.8));
        glassStrip.position.set(x, 1.1, -0.1);

        b.add(tower, towerCrown, glassStrip);
      });

      // Suspended Double-Helix Skyway Bridge between Towers
      const skywayA = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.08, 8, 24, Math.PI * 0.9), createGlassMat(p1, 0.75));
      skywayA.rotation.x = Math.PI / 2 + 0.35;
      skywayA.position.set(0, 1.45, -0.1);

      const skywayB = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.08, 8, 24, Math.PI * 0.9), createGlassMat(p1, 0.75));
      skywayB.rotation.x = Math.PI / 2 - 0.35;
      skywayB.position.set(0, 1.05, -0.1);
      b.add(skywayA, skywayB);

      // Floating Magnetic Halo Singularity Ring (Toroid in Golden Metal)
      const halo = new THREE.Mesh(
        new THREE.TorusGeometry(0.65, 0.08, 12, 32),
        mat(p2, { metalness: 0.9, roughness: 0.25 })
      );
      halo.rotation.x = Math.PI / 3;
      halo.position.set(0, 2.05, -0.1);
      b.add(halo);

      // Central Liquid-Cooling Reflecting Canal with Glass Footbridge
      const canal = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.04, 2.2), createWaterMat(p1));
      canal.position.set(0, 0.02, 0.3);
      const glassPath = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.06, 0.35), createGlassMat('#FFFFFF', 0.8));
      glassPath.position.set(0, 0.06, 0.75);
      b.add(canal, glassPath);
      break;
    }

    default: {
      // Fallback monumental museum composition
      const mainHall = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.2, 1.6), mat(p0));
      mainHall.position.y = 0.6;
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.6, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat(p1));
      dome.position.y = 1.2;
      b.add(mainHall, dome);
      break;
    }
  }

  master.add(b);
  return master;
}
