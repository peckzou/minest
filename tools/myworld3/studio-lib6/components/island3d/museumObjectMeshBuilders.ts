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
 * Handcrafted 3D Low-Poly Builders for 50 Museum Display Stands, Vitrines,
 * Pedestals & Exhibition Apparatuses (OB-101 to OB-150).
 * Pure Standalone Objects: Zero artificial platforms/pedestals.
 * Sits directly on the ground plane.
 */
export function buildMuseumObjectScene(
  island: IslandMetadata,
  variant: IslandVariant
): THREE.Group {
  const g = new THREE.Group();

  const p0 = island.palette[0]?.hex || '#1E293B';
  const p1 = island.palette[1]?.hex || '#38BDF8';
  const p2 = island.palette[2]?.hex || '#F59E0B';
  const p3 = island.palette[3]?.hex || '#10B981';

  switch (island.slug) {
    // ---------------------------------------------------------------------
    // A. Glass Vitrines & Micro-climate Hermetic Cases (OB-101 to OB-110)
    // ---------------------------------------------------------------------
    case 'object-museum-frameless-glass-vitrine': {
      // Base Plinth
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.75, 0.7), mat(p0));
      base.position.y = 0.375;
      // Frameless Glass Hood
      const glass = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.85, 0.66), createGlassMat(p1, 0.65));
      glass.position.y = 1.175;
      // Internal Velvet Deck & Spot
      const deck = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.5), mat(p3));
      deck.position.y = 0.79;
      const spot = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.1, 6), mat(p2, { metalness: 0.8 }));
      spot.position.set(0.2, 0.82, 0.2);
      g.add(base, glass, deck, spot);
      break;
    }

    case 'object-museum-curved-manuscript-showcase': {
      // Slanted legs
      [-0.45, 0.45].forEach((x) => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.65, 0.6), mat(p0));
        leg.position.set(x, 0.325, 0);
        g.add(leg);
      });
      // Slanted reading case
      const caseBody = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.22, 0.75), mat(p0));
      caseBody.position.set(0, 0.72, 0);
      caseBody.rotation.x = -0.22;
      // Curved glass canopy
      const glassCover = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.42, 1.12, 12, 1, false, 0, Math.PI),
        createGlassMat(p1, 0.7)
      );
      glassCover.rotation.z = Math.PI / 2;
      glassCover.rotation.y = -0.22;
      glassCover.position.set(0, 0.85, -0.05);
      // LED Light bar
      const ledBar = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.03, 0.03), mat(p2, { emissive: p2, emissiveIntensity: 0.8 }));
      ledBar.position.set(0, 0.95, -0.22);
      g.add(caseBody, glassCover, ledBar);
      break;
    }

    case 'object-museum-cylindrical-bell-jar': {
      // Turned wood drum
      const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.38, 0.75, 20), mat(p0));
      drum.position.y = 0.375;
      // Glass cylinder & dome
      const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.55, 16), createGlassMat(p1, 0.65));
      cylinder.position.y = 1.025;
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), createGlassMat(p1, 0.65));
      dome.position.y = 1.3;
      const finial = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), mat(p2, { metalness: 0.8 }));
      finial.position.y = 1.62;
      g.add(drum, cylinder, dome, finial);
      break;
    }

    case 'object-museum-hexagonal-honeycomb-island': {
      const towers = [
        { x: -0.35, z: 0.2, h: 0.65, gh: 0.45 },
        { x: 0.35, z: 0.2, h: 0.9, gh: 0.55 },
        { x: 0, z: -0.35, h: 1.15, gh: 0.6 },
      ];
      towers.forEach((tw) => {
        const hexBase = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.4, tw.h, 6), mat(p0));
        hexBase.position.set(tw.x, tw.h / 2, tw.z);
        const hexGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, tw.gh, 6), createGlassMat(p1, 0.7));
        hexGlass.position.set(tw.x, tw.h + tw.gh / 2, tw.z);
        g.add(hexBase, hexGlass);
      });
      break;
    }

    case 'object-museum-wall-recessed-shadowbox': {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 0.28), mat(p0));
      frame.position.y = 0.95;
      const velvet = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.25, 0.04), mat(p1));
      velvet.position.set(0, 0.95, -0.1);
      const glassPane = new THREE.Mesh(new THREE.BoxGeometry(1.08, 1.28, 0.02), createGlassMat(p2, 0.6));
      glassPane.position.set(0, 0.95, 0.12);
      g.add(frame, velvet, glassPane);
      break;
    }

    case 'object-museum-pyramid-top-island-case': {
      const stonePlinth = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.85, 0.85), mat(p0));
      stonePlinth.position.y = 0.425;
      const glassPyramid = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.6, 4), createGlassMat(p1, 0.7));
      glassPyramid.rotation.y = Math.PI / 4;
      glassPyramid.position.y = 1.15;
      const apexCap = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.1, 4), mat(p2, { metalness: 0.85 }));
      apexCap.rotation.y = Math.PI / 4;
      apexCap.position.y = 1.45;
      g.add(stonePlinth, glassPyramid, apexCap);
      break;
    }

    case 'object-museum-octagonal-rotating-jewelry-case': {
      const octBase = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.38, 0.7, 8), mat(p0));
      octBase.position.y = 0.35;
      const octGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.75, 8), createGlassMat(p1, 0.75));
      octGlass.position.y = 1.075;
      const turntableDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.04, 16), mat(p3));
      turntableDisc.position.y = 0.75;
      [-0.15, 0.15].forEach((x) => {
        const spot = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.18, 6), mat(p2, { metalness: 0.8 }));
        spot.position.set(x, 1.25, 0);
        g.add(spot);
      });
      g.add(octBase, octGlass, turntableDisc);
      break;
    }

    case 'object-museum-floor-to-ceiling-wall-case': {
      const cabinetFrame = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.1, 0.45), mat(p0));
      cabinetFrame.position.y = 1.05;
      const frontGlass = new THREE.Mesh(new THREE.BoxGeometry(1.25, 1.85, 0.04), createGlassMat(p1, 0.7));
      frontGlass.position.set(0, 1.05, 0.22);
      // Three cantilevered glass shelves inside
      [-0.4, 0, 0.4].forEach((sy) => {
        const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.02, 0.35), createGlassMat(p3, 0.8));
        shelf.position.set(0, 1.05 + sy, 0);
        g.add(shelf);
      });
      g.add(cabinetFrame, frontGlass);
      break;
    }

    case 'object-museum-three-tier-stepped-riser': {
      const tierLevels = [
        { z: 0.3, y: 0.18, h: 0.36 },
        { z: 0, y: 0.36, h: 0.72 },
        { z: -0.3, y: 0.54, h: 1.08 },
      ];
      tierLevels.forEach((t) => {
        const stepBlock = new THREE.Mesh(new THREE.BoxGeometry(0.85, t.h, 0.3), mat(p0));
        stepBlock.position.set(0, t.y, t.z);
        const glassTop = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.02, 0.28), createGlassMat(p1, 0.7));
        glassTop.position.set(0, t.h + 0.01, t.z);
        g.add(stepBlock, glassTop);
      });
      break;
    }

    case 'object-museum-archival-specimen-drawer-cabinet': {
      const chest = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.72, 0.7), mat(p0));
      chest.position.y = 0.36;
      // Six drawer pull lines
      for (let i = 0; i < 4; i++) {
        const handle = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.02, 0.02), mat(p1, { metalness: 0.8 }));
        handle.position.set(0, 0.15 + i * 0.14, 0.36);
        g.add(handle);
      }
      const topGlassLid = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.14, 0.66), createGlassMat(p2, 0.7));
      topGlassLid.position.set(0, 0.79, 0);
      g.add(chest, topGlassLid);
      break;
    }

    // ---------------------------------------------------------------------
    // B. Sculpture Pedestals, Plinths & Artifact Mounts (OB-111 to OB-120)
    // ---------------------------------------------------------------------
    case 'object-museum-fluted-marble-bust-plinth': {
      // Molded square base
      const sqBase = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.15, 0.52), mat(p0));
      sqBase.position.y = 0.075;
      // Fluted column shaft
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 1.15, 16), mat(p0));
      col.position.y = 0.725;
      // Molded capital
      const capital = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.12, 0.48), mat(p0));
      capital.position.y = 1.36;
      const brassPin = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.15, 6), mat(p2, { metalness: 0.8 }));
      brassPin.position.y = 1.48;
      g.add(sqBase, col, capital, brassPin);
      break;
    }

    case 'object-museum-brutalist-black-basalt-podium': {
      const monolith = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.95, 0.85), mat(p0, { roughness: 0.9 }));
      monolith.position.y = 0.475;
      const topPlate = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.02, 0.82), mat(p1));
      topPlate.position.y = 0.96;
      const plaque = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.01), mat(p2, { metalness: 0.8 }));
      plaque.position.set(0, 0.65, 0.43);
      g.add(monolith, topPlate, plaque);
      break;
    }

    case 'object-museum-magnetic-seismic-plinth': {
      const lowerStation = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.38, 0.55, 20), mat(p2));
      lowerStation.position.y = 0.275;
      const magneticGap = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.03, 8, 20), mat(p1, { emissive: p1, emissiveIntensity: 0.7 }));
      magneticGap.rotation.x = Math.PI / 2;
      magneticGap.position.y = 0.58;
      const upperDeck = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.45, 20), mat(p0));
      upperDeck.position.y = 0.85;
      g.add(lowerStation, magneticGap, upperDeck);
      break;
    }

    case 'object-museum-tri-tier-pyramid-vase-plinth': {
      const plinths = [
        { x: -0.28, z: 0.15, h: 0.55 },
        { x: 0.28, z: 0.15, h: 0.85 },
        { x: 0, z: -0.28, h: 1.15 },
      ];
      plinths.forEach((p) => {
        const cube = new THREE.Mesh(new THREE.BoxGeometry(0.48, p.h, 0.48), mat(p0));
        cube.position.set(p.x, p.h / 2, p.z);
        g.add(cube);
      });
      break;
    }

    case 'object-museum-split-granite-bedrock-base': {
      const boulder = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55, 0), mat(p0, { roughness: 0.95 }));
      boulder.scale.set(1.3, 0.75, 1.2);
      boulder.position.y = 0.4;
      const flatTop = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.04, 16), mat(p1, { roughness: 0.2 }));
      flatTop.position.y = 0.75;
      g.add(boulder, flatTop);
      break;
    }

    case 'object-museum-walnut-brass-pedestal': {
      const walnutShaft = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.2, 0.45), mat(p0));
      walnutShaft.position.y = 0.6;
      const brassBand = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.08, 0.46), mat(p1, { metalness: 0.85 }));
      brassBand.position.y = 0.65;
      const feltDeck = new THREE.Mesh(new THREE.BoxGeometry(0.41, 0.02, 0.41), mat(p3));
      feltDeck.position.y = 1.21;
      g.add(walnutShaft, brassBand, feltDeck);
      break;
    }

    case 'object-museum-motorized-360-turntable': {
      const baseStation = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.85, 20), mat(p0));
      baseStation.position.y = 0.425;
      const rotatingDeck = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.08, 24), mat(p2));
      rotatingDeck.position.y = 0.9;
      const bearingRing = new THREE.Mesh(new THREE.TorusGeometry(0.39, 0.02, 8, 24), mat(p1, { metalness: 0.8 }));
      bearingRing.rotation.x = Math.PI / 2;
      bearingRing.position.y = 0.86;
      g.add(baseStation, rotatingDeck, bearingRing);
      break;
    }

    case 'object-museum-invisible-ceramic-wire-armature': {
      const footPlate = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.06, 0.35), mat(p0));
      footPlate.position.y = 0.03;
      const wireMast = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.85, 6), mat(p1));
      wireMast.position.set(0, 0.45, -0.05);
      // Three curved wire arms
      [-0.15, 0, 0.15].forEach((wx, wi) => {
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.25, 0.15), mat(p1));
        arm.position.set(wx, 0.75 + wi * 0.05, 0.05);
        g.add(arm);
      });
      g.add(footPlate, wireMast);
      break;
    }

    case 'object-museum-solid-acrylic-cube-pedestal': {
      const acrylicBlock = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.1, 0.55), createGlassMat(p0, 0.85));
      acrylicBlock.position.y = 0.55;
      const beveledEdges = new THREE.Mesh(new THREE.BoxGeometry(0.56, 1.11, 0.56), mat(p1, { wireframe: true }));
      beveledEdges.position.y = 0.55;
      g.add(acrylicBlock, beveledEdges);
      break;
    }

    case 'object-museum-cantilevered-concrete-podium': {
      const lowerBlock = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.55, 0.65), mat(p0));
      lowerBlock.position.set(-0.15, 0.275, 0);
      const upperCantilever = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.45, 0.55), mat(p0));
      upperCantilever.position.set(0.2, 0.775, 0);
      g.add(lowerBlock, upperCantilever);
      break;
    }

    // ---------------------------------------------------------------------
    // C. Paleontology, Armature & Heavy Artifact Racks (OB-121 to OB-130)
    // ---------------------------------------------------------------------
    case 'object-museum-dinosaur-skeleton-armature': {
      // Floor stands
      [-0.55, 0.55].forEach((x) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.25, 8), mat(p0));
        post.position.set(x, 0.625, 0);
        g.add(post);
      });
      // S-curved spine beam
      const spine = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.1), mat(p0));
      spine.position.set(0, 1.25, 0);
      // Rib caliper rings
      for (let i = -0.5; i <= 0.5; i += 0.25) {
        const ribRing = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.02, 6, 12, Math.PI), mat(p1));
        ribRing.rotation.x = Math.PI / 2;
        ribRing.position.set(i, 1.2, 0);
        g.add(ribRing);
      }
      g.add(spine);
      break;
    }

    case 'object-museum-pterosaur-ceiling-cable-rig': {
      const spreader = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.04, 0.04), mat(p2));
      spreader.position.set(0, 1.5, 0);
      // Tension cables
      [-0.55, 0.55].forEach((cx) => {
        const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1.5, 4), mat(p0));
        cable.position.set(cx, 0.75, 0);
        const turnbuckle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.12, 6), mat(p1, { metalness: 0.8 }));
        turnbuckle.position.set(cx, 1.1, 0);
        g.add(cable, turnbuckle);
      });
      g.add(spreader);
      break;
    }

    case 'object-museum-angled-sarcophagus-cradle': {
      // Heavy floor channel stanchions
      [-0.45, 0.45].forEach((x) => {
        const baseStanchion = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.8), mat(p0));
        baseStanchion.position.set(x, 0.225, 0);
        g.add(baseStanchion);
      });
      // 15-degree tilted cradle bed
      const tiltBed = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.12, 0.75), mat(p0));
      tiltBed.rotation.x = -0.26;
      tiltBed.position.set(0, 0.65, 0);
      const lining = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.04, 0.65), mat(p2));
      lining.rotation.x = -0.26;
      lining.position.set(0, 0.72, 0);
      g.add(tiltBed, lining);
      break;
    }

    case 'object-museum-heavy-fossil-slab-a-frame': {
      // A-frame sides
      [-0.45, 0.45].forEach((x) => {
        const sideA = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 1.6, 6), mat(p0));
        sideA.rotation.z = x > 0 ? 0.22 : -0.22;
        sideA.position.set(x, 0.75, 0);
        g.add(sideA);
      });
      // Heavy bottom ledge
      const bottomLedge = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.1, 0.25), mat(p1));
      bottomLedge.position.set(0, 0.35, 0.18);
      const topClamp = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.08, 0.12), mat(p3));
      topClamp.position.set(0, 1.35, 0.05);
      g.add(bottomLedge, topClamp);
      break;
    }

    case 'object-museum-suit-of-armor-mannequin': {
      const woodBase = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.14, 0.65), mat(p0));
      woodBase.position.y = 0.07;
      // Twin leg posts
      [-0.15, 0.15].forEach((lx) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.85, 6), mat(p1));
        leg.position.set(lx, 0.56, 0);
        g.add(leg);
      });
      // Padded torso form
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.65, 0.32), mat(p2));
      torso.position.set(0, 1.3, 0);
      // Helmet finial
      const helmetBall = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), mat(p3, { metalness: 0.8 }));
      helmetBall.position.set(0, 1.75, 0);
      g.add(woodBase, torso, helmetBall);
      break;
    }

    case 'object-museum-polearm-spear-vertical-rack': {
      const ironBase = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.45, 0.08, 16), mat(p1));
      ironBase.position.y = 0.04;
      const centerPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.6, 8), mat(p1));
      centerPole.position.y = 0.84;
      const notchedRing = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.05, 8, 16), mat(p0));
      notchedRing.rotation.x = Math.PI / 2;
      notchedRing.position.y = 1.15;
      g.add(ironBase, centerPole, notchedRing);
      break;
    }

    case 'object-museum-slanted-textile-conservation-bed': {
      const frameTable = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.6, 0.85), mat(p0));
      frameTable.position.y = 0.3;
      const velvetBed = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.08, 0.8), mat(p1));
      velvetBed.rotation.x = -0.14;
      velvetBed.position.set(0, 0.68, 0);
      const acrylicLip = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.06, 0.02), createGlassMat(p2, 0.6));
      acrylicLip.position.set(0, 0.72, 0.39);
      g.add(frameTable, velvetBed, acrylicLip);
      break;
    }

    case 'object-museum-ship-keel-drydock-cradle': {
      const teakPlank = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.08, 0.5), mat(p0));
      teakPlank.position.y = 0.04;
      const centerKeelBlock = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.12, 0.15), mat(p3));
      centerKeelBlock.position.y = 0.14;
      // Four bilge stanchions
      [-0.4, 0.4].forEach((bx) => {
        [-0.18, 0.18].forEach((bz) => {
          const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 6), mat(p1, { metalness: 0.8 }));
          strut.position.set(bx, 0.25, bz);
          strut.rotation.z = bx > 0 ? -0.25 : 0.25;
          g.add(strut);
        });
      });
      g.add(teakPlank, centerKeelBlock);
      break;
    }

    case 'object-museum-three-prong-brass-mineral-mount': {
      const graniteDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.06, 16), mat(p1));
      graniteDisc.position.y = 0.03;
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.55, 6), mat(p0, { metalness: 0.8 }));
      stem.position.y = 0.33;
      const ballJoint = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), mat(p0, { metalness: 0.8 }));
      ballJoint.position.y = 0.62;
      // Three curved prongs
      for (let i = 0; i < 3; i++) {
        const ang = (i / 3) * Math.PI * 2;
        const claw = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.15, 0.01), mat(p0, { metalness: 0.8 }));
        claw.position.set(Math.cos(ang) * 0.06, 0.72, Math.sin(ang) * 0.06);
        claw.rotation.z = Math.cos(ang) * 0.3;
        g.add(claw);
      }
      g.add(graniteDisc, stem, ballJoint);
      break;
    }

    case 'object-museum-clear-acrylic-violin-bracket': {
      const wallBackplate = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.75, 0.04), mat(p2));
      wallBackplate.position.set(0, 0.6, 0);
      const neckYoke = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.015, 6, 12, Math.PI), createGlassMat(p0, 0.7));
      neckYoke.rotation.x = Math.PI / 2;
      neckYoke.position.set(0, 0.9, 0.1);
      const tailPinRest = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.12), createGlassMat(p0, 0.7));
      tailPinRest.position.set(0, 0.3, 0.08);
      g.add(wallBackplate, neckYoke, tailPinRest);
      break;
    }

    // ---------------------------------------------------------------------
    // D. Interactive Media, Hologram & Smart Exhibition Units (OB-131 to OB-140)
    // ---------------------------------------------------------------------
    case 'object-museum-slanted-touchscreen-kiosk': {
      const column = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.75, 0.38), mat(p0));
      column.position.y = 0.375;
      const screenHousing = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.52, 0.08), mat(p0));
      screenHousing.position.set(0, 0.88, 0.05);
      screenHousing.rotation.x = -0.75;
      const glassDisplay = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.48, 0.02), mat(p1, { emissive: p1, emissiveIntensity: 0.5 }));
      glassDisplay.position.set(0, 0.89, 0.08);
      glassDisplay.rotation.x = -0.75;
      g.add(column, screenHousing, glassDisplay);
      break;
    }

    case 'object-museum-holographic-pyramid-vitrine': {
      const pedestal = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.8, 0.72), mat(p0));
      pedestal.position.y = 0.4;
      const holoPyramid = new THREE.Mesh(new THREE.ConeGeometry(0.48, 0.45, 4), createGlassMat(p1, 0.75));
      holoPyramid.rotation.x = Math.PI;
      holoPyramid.rotation.y = Math.PI / 4;
      holoPyramid.position.y = 1.05;
      const floatingHolo = new THREE.Mesh(new THREE.IcosahedronGeometry(0.12, 1), mat(p2, { emissive: p2, emissiveIntensity: 0.9 }));
      floatingHolo.position.y = 1.0;
      g.add(pedestal, holoPyramid, floatingHolo);
      break;
    }

    case 'object-museum-directional-sound-acoustic-dome': {
      const archPole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 2.1, 8), mat(p0));
      archPole.position.set(-0.35, 1.05, 0);
      const crossArm = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.04, 0.04), mat(p0));
      crossArm.position.set(0, 2.05, 0);
      const soundDish = new THREE.Mesh(
        new THREE.SphereGeometry(0.38, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
        createGlassMat(p1, 0.6)
      );
      soundDish.rotation.x = Math.PI;
      soundDish.position.set(0.35, 1.95, 0);
      g.add(archPole, crossArm, soundDish);
      break;
    }

    case 'object-museum-tactile-braille-relief-pedestal': {
      const plinthCarcass = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.75, 0.65), mat(p1));
      plinthCarcass.position.y = 0.375;
      const bronzeModel = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.15, 0.45), mat(p0, { metalness: 0.85 }));
      bronzeModel.position.set(0, 0.825, 0);
      const brailleStrip = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.04, 0.08), mat(p2));
      brailleStrip.position.set(0, 0.77, 0.28);
      g.add(plinthCarcass, bronzeModel, brailleStrip);
      break;
    }

    case 'object-museum-e-ink-digital-label-stanchion': {
      const baseDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.03, 16), mat(p0));
      baseDisc.position.y = 0.015;
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.95, 6), mat(p0));
      rod.position.y = 0.48;
      const einkPlate = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.02), mat('#F8FAFC'));
      einkPlate.rotation.x = -0.7;
      einkPlate.position.set(0, 0.95, 0.04);
      g.add(baseDisc, rod, einkPlate);
      break;
    }

    case 'object-museum-projection-mapping-relief-table': {
      const roundTable = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.75, 0.75, 24), mat(p0));
      roundTable.position.y = 0.375;
      const reliefTerrain = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.1, 20), mat(p1, { roughness: 0.8 }));
      reliefTerrain.position.y = 0.8;
      const projectedStream = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.04, 6, 16), mat(p2, { emissive: p2, emissiveIntensity: 0.7 }));
      projectedStream.rotation.x = Math.PI / 2;
      projectedStream.position.y = 0.86;
      g.add(roundTable, reliefTerrain, projectedStream);
      break;
    }

    case 'object-museum-sliding-magnifier-scroll-table': {
      const longTable = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.72, 0.55), mat(p0));
      longTable.position.y = 0.36;
      const scrollBed = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.04, 0.38), mat(p3));
      scrollBed.position.y = 0.74;
      const brassGuide = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.5, 6), mat(p1, { metalness: 0.85 }));
      brassGuide.rotation.z = Math.PI / 2;
      brassGuide.position.set(0, 0.82, -0.22);
      const magnifier = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.02, 8, 16), mat(p1, { metalness: 0.85 }));
      magnifier.rotation.x = Math.PI / 2;
      magnifier.position.set(0.15, 0.85, 0);
      g.add(longTable, scrollBed, brassGuide, magnifier);
      break;
    }

    case 'object-museum-transparent-oled-smart-vitrine': {
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.25, 0.65), mat(p0));
      chassis.position.y = 0.625;
      const toledGlass = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.95, 0.02), mat(p1, { emissive: p1, emissiveIntensity: 0.6 }));
      toledGlass.position.set(0, 0.68, 0.33);
      g.add(chassis, toledGlass);
      break;
    }

    case 'object-museum-audio-guide-charging-tower': {
      const towerCylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.35, 1.65, 20), mat(p0));
      towerCylinder.position.y = 0.825;
      const ringSlots = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.03, 8, 20), mat(p1, { emissive: p1, emissiveIntensity: 0.7 }));
      ringSlots.rotation.x = Math.PI / 2;
      ringSlots.position.y = 1.35;
      g.add(towerCylinder, ringSlots);
      break;
    }

    case 'object-museum-rotary-timeline-drum': {
      [-0.55, 0.55].forEach((x) => {
        const aFrame = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.95, 0.55), mat(p0));
        aFrame.position.set(x, 0.475, 0);
        g.add(aFrame);
      });
      const timelineDrum = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.05, 20), mat(p1, { metalness: 0.5 }));
      timelineDrum.rotation.z = Math.PI / 2;
      timelineDrum.position.y = 0.72;
      const handwheel = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.025, 6, 16), mat(p2, { metalness: 0.8 }));
      handwheel.position.set(0.62, 0.72, 0);
      g.add(timelineDrum, handwheel);
      break;
    }

    // ---------------------------------------------------------------------
    // E. Stanchions, Lighting, Barriers & Environmental Fixtures (OB-141 to OB-150)
    // ---------------------------------------------------------------------
    case 'object-museum-brass-ball-velvet-stanchion': {
      [-0.6, 0.6].forEach((x) => {
        const postBase = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.06, 16), mat(p0, { metalness: 0.85 }));
        postBase.position.set(x, 0.03, 0);
        const postStem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.95, 8), mat(p0, { metalness: 0.85 }));
        postStem.position.set(x, 0.5, 0);
        const ball = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), mat(p0, { metalness: 0.9 }));
        ball.position.set(x, 1.02, 0);
        g.add(postBase, postStem, ball);
      });
      // Catenary velvet rope curve
      const ropeCurve = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.025, 8, 20, Math.PI * 0.75), mat(p1));
      ropeCurve.rotation.z = Math.PI * 0.62;
      ropeCurve.position.set(0, 0.72, 0);
      g.add(ropeCurve);
      break;
    }

    case 'object-museum-minimalist-magnetic-barrier': {
      [-0.65, 0.65].forEach((x) => {
        const baseDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.02, 16), mat(p0));
        baseDisc.position.set(x, 0.01, 0);
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.45, 6), mat(p0));
        stem.position.set(x, 0.23, 0);
        g.add(baseDisc, stem);
      });
      const tautCord = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 1.3, 4), mat(p1));
      tautCord.rotation.z = Math.PI / 2;
      tautCord.position.set(0, 0.44, 0);
      g.add(tautCord);
      break;
    }

    case 'object-museum-dual-spotlight-stanchion': {
      const heavyBase = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.05, 16), mat(p0));
      heavyBase.position.y = 0.025;
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 1.85, 8), mat(p0));
      mast.position.y = 0.95;
      // Twin zoom projectors
      [-0.1, 0.1].forEach((px, idx) => {
        const projector = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.18, 8), mat(p2));
        projector.rotation.x = idx === 0 ? 0.45 : -0.35;
        projector.position.set(px, 1.85, 0.05);
        g.add(projector);
      });
      g.add(heavyBase, mast);
      break;
    }

    case 'object-museum-acoustic-partition-screen': {
      const feet = [-0.65, 0.65];
      feet.forEach((fx) => {
        const foot = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.45), mat(p2));
        foot.position.set(fx, 0.02, 0);
        g.add(foot);
      });
      // Curved acoustic screen
      const screen = new THREE.Mesh(
        new THREE.CylinderGeometry(2.2, 2.2, 1.65, 16, 1, false, 0, Math.PI * 0.25),
        mat(p0)
      );
      screen.rotation.y = -Math.PI * 0.12;
      screen.position.set(0, 0.88, -0.6);
      g.add(screen);
      break;
    }

    case 'object-museum-microclimate-air-filtration-cabinet': {
      const cabinet = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.65, 0.45), mat(p0));
      cabinet.position.y = 0.325;
      const displayReadout = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.02), mat(p1, { emissive: p1, emissiveIntensity: 0.8 }));
      displayReadout.position.set(0.15, 0.52, 0.23);
      const hose = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.65, 8), mat(p3));
      hose.position.set(-0.25, 0.6, 0);
      g.add(cabinet, displayReadout, hose);
      break;
    }

    case 'object-museum-slanted-art-transport-cart': {
      const cartChassis = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.65), mat(p0));
      cartChassis.position.y = 0.12;
      // A-frame carpet rack
      const aFrameRack = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.95, 4), mat(p1));
      aFrameRack.rotation.y = Math.PI / 4;
      aFrameRack.scale.set(1.1, 1, 0.5);
      aFrameRack.position.set(0, 0.62, 0);
      // Four wheels
      [-0.5, 0.5].forEach((wx) => {
        [-0.25, 0.25].forEach((wz) => {
          const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 10), mat('#334155'));
          wheel.rotation.z = Math.PI / 2;
          wheel.position.set(wx, 0.06, wz);
          g.add(wheel);
        });
      });
      g.add(cartChassis, aFrameRack);
      break;
    }

    case 'object-museum-anodized-brochure-floorplan-rack': {
      const rackMast = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.35, 0.12), mat(p0));
      rackMast.position.y = 0.72;
      for (let i = 0; i < 4; i++) {
        const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.15, 0.06), createGlassMat(p1, 0.7));
        pocket.position.set(0, 0.35 + i * 0.25, 0.08);
        g.add(pocket);
      }
      g.add(rackMast);
      break;
    }

    case 'object-museum-faceted-gallery-viewing-bench': {
      const facetedPlinth = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.32, 0.55), mat(p1));
      facetedPlinth.position.y = 0.16;
      const leatherCushion = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.14, 0.5), mat(p0));
      leatherCushion.position.y = 0.39;
      g.add(facetedPlinth, leatherCushion);
      break;
    }

    case 'object-museum-cantilever-wall-wash-picture-light': {
      const wallMount = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.04), mat(p0, { metalness: 0.85 }));
      wallMount.position.set(0, 0.5, 0);
      [-0.35, 0.35].forEach((bx) => {
        const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.38, 6), mat(p0, { metalness: 0.85 }));
        boom.rotation.x = Math.PI / 2;
        boom.position.set(bx, 0.5, 0.2);
        g.add(boom);
      });
      const lightTube = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.15, 8), mat(p0, { metalness: 0.85 }));
      lightTube.rotation.z = Math.PI / 2;
      lightTube.position.set(0, 0.5, 0.39);
      g.add(wallMount, lightTube);
      break;
    }

    case 'object-museum-darkroom-light-trap-baffle': {
      // Z-shaped labyrinth baffle
      const wall1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.85, 0.75), mat(p0));
      wall1.position.set(-0.35, 0.925, -0.2);
      const wall2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.85, 0.75), mat(p0));
      wall2.position.set(0.35, 0.925, 0.2);
      const guideLight = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.02, 0.04), mat(p2, { emissive: p2, emissiveIntensity: 0.8 }));
      guideLight.position.set(0, 0.01, 0);
      g.add(wall1, wall2, guideLight);
      break;
    }

    default: {
      // Clean fallback vitrine
      const baseBlock = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.7, 0.6), mat(p0));
      baseBlock.position.y = 0.35;
      const glassHood = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.6, 0.56), createGlassMat(p1, 0.7));
      glassHood.position.y = 1.0;
      g.add(baseBlock, glassHood);
      break;
    }
  }

  return g;
}
