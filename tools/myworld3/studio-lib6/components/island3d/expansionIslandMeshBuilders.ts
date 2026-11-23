import * as THREE from 'three';
import { IslandMetadata, IslandVariant } from '../../types/island';
import { createLowPolyMat, createWaterMat, createGlassMat, createTree, createCloudCluster } from './materials';
import { buildRichIslandTerrain } from './terrain';

/**
 * Creates floating sub-island terrain for Level 2 Thematic Sub-Islands.
 * More compact than Level 1 Major Worlds, featuring a focused floating landmass
 * with faceted underbelly and satellite islets.
 */
export function createSubIslandFloatingBase(
  island: IslandMetadata,
  variant: IslandVariant
): THREE.Group {
  const g = new THREE.Group();

  const grassHex = island.palette[0]?.hex || '#65A30D';
  const stoneHex = island.palette[3]?.hex || '#4B5563';
  const waterHex = island.palette[1]?.hex || '#0284C7';

  const grassMat = createLowPolyMat(grassHex, { roughness: 0.82 });
  const stoneMat = createLowPolyMat(stoneHex, { roughness: 0.88 });
  const soilMat = createLowPolyMat(0x524132, { roughness: 0.9 });
  const waterMat = createWaterMat(waterHex);

  // Main floating top plateau
  const topSlab = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.9, 0.5, 8), grassMat);
  topSlab.position.set(0, 0, 0);
  topSlab.receiveShadow = true;
  topSlab.castShadow = true;
  g.add(topSlab);

  // Subterranean soil layer
  const soilSlab = new THREE.Mesh(new THREE.CylinderGeometry(3.9, 3.5, 0.6, 8), soilMat);
  soilSlab.position.set(0, -0.5, 0);
  soilSlab.receiveShadow = true;
  g.add(soilSlab);

  // Faceted rock underbelly cone
  const coneGeo = new THREE.ConeGeometry(3.5, 2.6, 7);
  coneGeo.rotateX(Math.PI);
  const cone = new THREE.Mesh(coneGeo, stoneMat);
  cone.position.set(0, -1.9, 0);
  cone.castShadow = true;
  cone.receiveShadow = true;
  g.add(cone);

  // Ambient bottom clouds
  g.add(createCloudCluster([2.8, -1.8, 1.8], 0.75));
  g.add(createCloudCluster([-2.6, -2.1, -1.6], 0.7));

  return g;
}

/**
 * 10 Major World Islands (MW-01 to MW-10) 3D Scene Builder
 */
export function buildExpansionMajorWorldScene(
  island: IslandMetadata,
  variant: IslandVariant
): THREE.Group {
  const master = new THREE.Group();

  // 1. Procedural Rich Floating Base (Terrain + Underbelly + Islets)
  const archetype =
    island.slug === 'world-sports-universe'
      ? 'modern_civic'
      : island.slug === 'world-culinary-universe'
      ? 'farmland_terrace'
      : island.slug === 'world-fashion-universe'
      ? 'modern_civic'
      : island.slug === 'world-transportation-universe'
      ? 'coastal_beach'
      : island.slug === 'world-architecture-universe'
      ? 'ancient_ruins'
      : island.slug === 'world-entertainment-universe'
      ? 'plateau'
      : island.slug === 'world-business-universe'
      ? 'modern_civic'
      : island.slug === 'world-hobbies-universe'
      ? 'village_meadow'
      : island.slug === 'world-agriculture-universe'
      ? 'farmland_terrace'
      : 'alpine_crag';

  const base = buildRichIslandTerrain(island, variant, archetype);
  master.add(base);

  // 2. Handcrafted Domain Landmarks & Architectural Clusters
  const content = new THREE.Group();

  switch (island.slug) {
    // MW-01. My Sports Universe
    case 'world-sports-universe': {
      // Oval Olympic Stadium Arena
      const arenaMat = createLowPolyMat(0x1d3557, { roughness: 0.7 });
      const trackMat = createLowPolyMat(0xe63946, { roughness: 0.85 });
      const whiteMat = createLowPolyMat(0xf1faee, { roughness: 0.6 });
      const goldMat = createLowPolyMat(0xe9c46a, { roughness: 0.3, metalness: 0.6 });

      const arena = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.5, 0.8, 16), arenaMat);
      arena.position.set(-0.8, 0.8, 0.2);
      arena.castShadow = true;
      content.add(arena);

      const turf = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 0.1, 16), createLowPolyMat(0x2a9d8f));
      turf.position.set(-0.8, 1.25, 0.2);
      content.add(turf);

      const track = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.18, 6, 16), trackMat);
      track.rotation.x = Math.PI / 2;
      track.position.set(-0.8, 1.26, 0.2);
      content.add(track);

      // Olympic Torch Beacon Peak
      const torchPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 2.6, 8), whiteMat);
      torchPillar.position.set(2.4, 1.8, -1.2);
      torchPillar.castShadow = true;
      const torchBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.2, 0.4, 8), goldMat);
      torchBowl.position.set(2.4, 3.2, -1.2);
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.8, 8), createLowPolyMat(0xe63946, { emissive: 0xff3300 }));
      flame.position.set(2.4, 3.7, -1.2);
      content.add(torchPillar, torchBowl, flame);

      // Velodrome Banking Curve
      const velo = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.25, 8, 12, Math.PI), createLowPolyMat(0xd97706));
      velo.rotation.x = Math.PI / 2 + 0.3;
      velo.position.set(1.2, 0.7, 1.6);
      content.add(velo);
      break;
    }

    // MW-02. My Culinary Universe
    case 'world-culinary-universe': {
      const terrMat = createLowPolyMat(0xf77f00, { roughness: 0.8 });
      const vineMat = createLowPolyMat(0x2a9d8f);
      const woodMat = createLowPolyMat(0x7209b7);

      // Bistro Rotunda Dome
      const bistro = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 1.2, 12), createLowPolyMat(0xffeedd));
      bistro.position.set(0.2, 1.0, -0.4);
      bistro.castShadow = true;
      const bistroDome = new THREE.Mesh(new THREE.SphereGeometry(1.45, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), terrMat);
      bistroDome.position.set(0.2, 1.6, -0.4);
      bistroDome.castShadow = true;
      content.add(bistro, bistroDome);

      // Vineyard Terraces with Wine Press
      for (let i = 0; i < 4; i++) {
        const vineRow = new THREE.Mesh(new THREE.BoxGeometry(2.4 - i * 0.4, 0.35, 0.25), vineMat);
        vineRow.position.set(-1.6 + i * 0.2, 0.6 + i * 0.25, 1.2 - i * 0.5);
        vineRow.castShadow = true;
        content.add(vineRow);
      }

      // Stone Wine Cellar Barrel
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.9, 10), createLowPolyMat(0x8b5a2b));
      barrel.rotation.z = Math.PI / 2;
      barrel.position.set(2.0, 0.8, 1.2);
      content.add(barrel);
      break;
    }

    // MW-03. My Fashion Universe
    case 'world-fashion-universe': {
      // Grand T-Stage Runway Catwalk
      const catwalkMat = createLowPolyMat(0x18181b, { roughness: 0.2, metalness: 0.6 });
      const redMat = createLowPolyMat(0xe01e5a);
      const goldMat = createLowPolyMat(0xd4af37, { metalness: 0.7 });

      const catwalk = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.35, 1.1), catwalkMat);
      catwalk.position.set(0, 0.75, 0);
      catwalk.castShadow = true;
      content.add(catwalk);

      const redCarpet = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.05, 0.45), redMat);
      redCarpet.position.set(0, 0.94, 0);
      content.add(redCarpet);

      // Soaring Strobe Lighting Arches
      for (let i = -1; i <= 1; i++) {
        const arch = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.08, 6, 12, Math.PI), goldMat);
        arch.position.set(i * 1.4, 0.9, 0);
        content.add(arch);
      }

      // Haute Couture Exhibition Pavilion
      const dome = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4, 1), createGlassMat(0xf8f9fa, 0.55));
      dome.position.set(-1.8, 1.4, -1.6);
      content.add(dome);
      break;
    }

    // MW-04. My Transportation Universe
    case 'world-transportation-universe': {
      const asphalt = createLowPolyMat(0x343a40);
      const blueMat = createLowPolyMat(0x0077b6);
      const craneMat = createLowPolyMat(0xffb703);

      // Runway Airstrip Strip extending over edge
      const runway = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.25, 1.2), asphalt);
      runway.position.set(-0.6, 0.65, 0);
      runway.rotation.y = -0.3;
      runway.castShadow = true;
      content.add(runway);

      // Terminal Concourse
      const term = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.1, 1.6), blueMat);
      term.position.set(1.4, 0.9, -1.1);
      term.castShadow = true;
      content.add(term);

      // Gantry Crane over Harbor channel
      const cranePillar1 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.2, 0.15), craneMat);
      cranePillar1.position.set(2.2, 1.1, 1.4);
      const cranePillar2 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.2, 0.15), craneMat);
      cranePillar2.position.set(3.2, 1.1, 1.4);
      const craneBeam = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.18, 0.2), craneMat);
      craneBeam.position.set(2.7, 2.1, 1.4);
      content.add(cranePillar1, cranePillar2, craneBeam);
      break;
    }

    // MW-05. My Architecture Universe
    case 'world-architecture-universe': {
      const marble = createLowPolyMat(0xece4db, { roughness: 0.6 });
      const slate = createLowPolyMat(0x4a5568);
      const glass = createGlassMat(0x63b3ed, 0.7);

      // Classical Doric Peristyle Agora
      const agoraBase = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.25, 1.8), marble);
      agoraBase.position.set(-1.4, 0.7, 0);
      content.add(agoraBase);

      for (let x = -0.9; x <= 0.9; x += 0.6) {
        for (let z = -0.6; z <= 0.6; z += 1.2) {
          const col = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 1.4, 8), marble);
          col.position.set(-1.4 + x, 1.45, z);
          content.add(col);
        }
      }
      const agoraRoof = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.25, 1.8), marble);
      agoraRoof.position.set(-1.4, 2.25, 0);
      content.add(agoraRoof);

      // Modern Cantilever Glass Cube
      const cube = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 1.6), glass);
      cube.position.set(1.4, 1.7, 0.2);
      cube.castShadow = true;
      content.add(cube);

      // Twisting Parametric Spire
      const spire = new THREE.Mesh(new THREE.ConeGeometry(0.8, 3.4, 5), slate);
      spire.position.set(0.4, 2.3, -1.4);
      spire.castShadow = true;
      content.add(spire);
      break;
    }

    // MW-06. My Entertainment Universe
    case 'world-entertainment-universe': {
      const coasterRed = createLowPolyMat(0xff0054);
      const cinemaPurp = createLowPolyMat(0x7209b7);
      const gold = createLowPolyMat(0xffbe0b);

      // Roller Coaster Corkscrew Loop
      const loop = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.15, 6, 16), coasterRed);
      loop.position.set(-1.4, 1.6, 0.2);
      loop.rotation.y = 0.5;
      loop.rotation.z = 0.2;
      content.add(loop);

      // Ferris Wheel Spoke Disc
      const wheelHub = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.08, 6, 16), gold);
      wheelHub.position.set(1.6, 2.0, -0.6);
      wheelHub.rotation.y = Math.PI / 2;
      content.add(wheelHub);

      // Cinema Marquee Palace
      const cinema = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.4, 1.4), cinemaPurp);
      cinema.position.set(0.2, 1.0, 1.2);
      cinema.castShadow = true;
      content.add(cinema);
      break;
    }

    // MW-07. My Business Universe
    case 'world-business-universe': {
      const slate = createLowPolyMat(0x1e293b);
      const glass = createGlassMat(0x0ea5e9, 0.75);

      // Twin Enterprise Headquarters Skyscraper Towers
      const tower1 = new THREE.Mesh(new THREE.BoxGeometry(1.0, 3.8, 1.0), glass);
      tower1.position.set(-0.8, 2.2, -0.2);
      tower1.castShadow = true;

      const tower2 = new THREE.Mesh(new THREE.BoxGeometry(1.0, 3.2, 1.0), glass);
      tower2.position.set(0.8, 1.9, -0.2);
      tower2.castShadow = true;

      // Connecting Skybridge
      const skybridge = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.35, 0.4), slate);
      skybridge.position.set(0, 2.4, -0.2);
      content.add(tower1, tower2, skybridge);

      // Neoclassical Stock Exchange Colonnade
      const exchange = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.1, 1.4), createLowPolyMat(0xf8fafc));
      exchange.position.set(0, 0.8, 1.4);
      exchange.castShadow = true;
      content.add(exchange);
      break;
    }

    // MW-08. My Hobbies Universe
    case 'world-hobbies-universe': {
      const timber = createLowPolyMat(0x8b5a2b);
      const kilnRed = createLowPolyMat(0xd97706);

      // Timber Maker Barn Workshop
      const barn = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.3, 1.6), timber);
      barn.position.set(-0.9, 0.9, -0.2);
      barn.castShadow = true;

      const barnRoof = new THREE.Mesh(new THREE.ConeGeometry(1.7, 0.8, 4), createLowPolyMat(0x451a03));
      barnRoof.rotation.y = Math.PI / 4;
      barnRoof.position.set(-0.9, 1.8, -0.2);
      content.add(barn, barnRoof);

      // Ceramic Cone Kiln
      const kiln = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.6, 8), kilnRed);
      kiln.position.set(1.4, 1.0, 1.2);
      kiln.castShadow = true;
      content.add(kiln);

      // Hobby Astronomy Telescope Dome
      const astroBase = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.9, 1.1, 8), createLowPolyMat(0xf8fafc));
      astroBase.position.set(1.2, 1.3, -1.4);
      const astroDome = new THREE.Mesh(new THREE.SphereGeometry(0.85, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2), createLowPolyMat(0xd4af37));
      astroDome.position.set(1.2, 1.85, -1.4);
      content.add(astroBase, astroDome);
      break;
    }

    // MW-09. My Agriculture Universe
    case 'world-agriculture-universe': {
      const wheat = createLowPolyMat(0xeab308);
      const barnRed = createLowPolyMat(0xdc2626);
      const silver = createLowPolyMat(0xe2e8f0, { metalness: 0.6 });

      // Four-Vane Dutch Windmill
      const millTower = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.9, 2.2, 8), createLowPolyMat(0xf8fafc));
      millTower.position.set(-1.4, 1.4, -0.6);
      millTower.castShadow = true;

      const millCap = new THREE.Mesh(new THREE.ConeGeometry(0.7, 0.6, 8), createLowPolyMat(0x78350f));
      millCap.position.set(-1.4, 2.7, -0.6);

      // Blades
      const blades = new THREE.Group();
      blades.position.set(-1.4, 2.6, 0.05);
      for (let i = 0; i < 4; i++) {
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.8, 0.05), createLowPolyMat(0x78350f));
        blade.position.y = 0.9;
        blade.rotation.z = (i * Math.PI) / 2;
        blades.add(blade);
      }
      content.add(millTower, millCap, blades);

      // Twin Silver Grain Silos
      const silo1 = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 1.8, 12), silver);
      silo1.position.set(1.4, 1.2, -0.8);
      const silo2 = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 1.8, 12), silver);
      silo2.position.set(2.4, 1.2, -0.4);
      content.add(silo1, silo2);

      // Golden Wheat Fields Contour
      const wheatField = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.4, 1.8), wheat);
      wheatField.position.set(0.4, 0.65, 1.1);
      content.add(wheatField);
      break;
    }

    // MW-10. My Energy Universe
    case 'world-energy-universe': {
      const whiteMat = createLowPolyMat(0xf8fafc);
      const hydroMat = createLowPolyMat(0x64748b);
      const solarMat = createLowPolyMat(0x0284c7);

      // Tri-Blade Wind Turbines Ridge
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, 3.2, 8), whiteMat);
      mast.position.set(-1.6, 2.0, -1.0);
      mast.castShadow = true;

      const nacelle = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.7), whiteMat);
      nacelle.position.set(-1.6, 3.6, -1.0);

      const blades = new THREE.Group();
      blades.position.set(-1.6, 3.6, -0.6);
      for (let i = 0; i < 3; i++) {
        const b = new THREE.Mesh(new THREE.ConeGeometry(0.12, 2.0, 4), whiteMat);
        b.rotation.z = (i * Math.PI * 2) / 3;
        b.position.y = 0.9;
        blades.add(b);
      }
      content.add(mast, nacelle, blades);

      // Great Arch Hydroelectric Concrete Dam Wall
      const dam = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.8, 1.6, 12, 1, false, 0, Math.PI), hydroMat);
      dam.position.set(0.4, 0.9, 0.8);
      dam.castShadow = true;
      content.add(dam);

      // Solar Photovoltaic Field Panels
      for (let i = 0; i < 3; i++) {
        const panel = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.6), solarMat);
        panel.rotation.x = -0.4;
        panel.position.set(1.4, 0.8 + i * 0.25, -0.8 + i * 0.7);
        content.add(panel);
      }
      break;
    }

    default:
      break;
  }

  master.add(content);
  return master;
}

/**
 * 30 Thematic Sub-Islands (SI-01 to SI-30) 3D Scene Builder
 */
export function buildThematicSubIslandScene(
  island: IslandMetadata,
  variant: IslandVariant
): THREE.Group {
  const master = new THREE.Group();

  // Floating sub-island landmass base
  const base = createSubIslandFloatingBase(island, variant);
  master.add(base);

  const content = new THREE.Group();

  // Sports (SI-01 to SI-06)
  if (island.slug === 'subisland-basketball') {
    const court = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.15, 2.2), createLowPolyMat(0xea580c));
    court.position.set(0, 0.28, 0);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.8, 8), createLowPolyMat(0x1e293b));
    pole.position.set(-1.4, 1.0, 0);
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 0.9), createLowPolyMat(0xffffff));
    board.position.set(-1.25, 1.7, 0);
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.04, 6, 12), createLowPolyMat(0xea580c));
    hoop.rotation.x = Math.PI / 2;
    hoop.position.set(-1.0, 1.5, 0);
    content.add(court, pole, board, hoop);
  } else if (island.slug === 'subisland-soccer') {
    const pitch = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.15, 2.4), createLowPolyMat(0x16a34a));
    pitch.position.set(0, 0.28, 0);
    const goalPost = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.0, 1.6), createLowPolyMat(0xffffff));
    goalPost.position.set(-1.6, 0.75, 0);
    content.add(pitch, goalPost);
  } else if (island.slug === 'subisland-baseball') {
    const infield = new THREE.Mesh(new THREE.ConeGeometry(2.2, 0.15, 4), createLowPolyMat(0xb45309));
    infield.rotation.y = Math.PI / 4;
    infield.position.set(0, 0.28, 0);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.2, 6), createLowPolyMat(0xeab308));
    pole.position.set(1.4, 1.2, -1.2);
    content.add(infield, pole);
  } else if (island.slug === 'subisland-tennis') {
    const clay = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.15, 2.0), createLowPolyMat(0xc2410c));
    clay.position.set(0, 0.28, 0);
    const net = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 2.0), createLowPolyMat(0xffffff));
    net.position.set(0, 0.45, 0);
    content.add(clay, net);
  } else if (island.slug === 'subisland-racing') {
    const track = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.45, 6, 16, Math.PI * 1.4), createLowPolyMat(0x1f2937));
    track.rotation.x = Math.PI / 2;
    track.position.set(0, 0.32, 0);
    const gantry = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.15, 0.15), createLowPolyMat(0xef4444));
    gantry.position.set(0, 1.4, 0);
    content.add(track, gantry);
  } else if (island.slug === 'subisland-winter-sports') {
    const snowSlope = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 3.4, 1.8, 8), createLowPolyMat(0xf8fafc));
    snowSlope.position.set(0, 0.9, 0);
    const halfpipe = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 2.2, 8, 1, true, 0, Math.PI), createLowPolyMat(0x38bdf8));
    halfpipe.rotation.z = Math.PI / 2;
    halfpipe.position.set(0, 1.7, 0);
    content.add(snowSlope, halfpipe);
  }

  // Food & Cuisine (SI-07 to SI-12)
  else if (island.slug === 'subisland-bakery') {
    const oven = new THREE.Mesh(new THREE.SphereGeometry(1.1, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), createLowPolyMat(0x92400e));
    oven.position.set(-0.6, 0.28, 0);
    const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 1.4, 6), createLowPolyMat(0x78350f));
    chimney.position.set(-0.6, 1.4, -0.4);
    content.add(oven, chimney);
  } else if (island.slug === 'subisland-coffee') {
    const cafeHut = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.2, 1.4), createLowPolyMat(0x451a03));
    cafeHut.position.set(0, 0.8, -0.2);
    const copperRoof = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.8, 4), createLowPolyMat(0xd97706));
    copperRoof.rotation.y = Math.PI / 4;
    copperRoof.position.set(0, 1.7, -0.2);
    content.add(cafeHut, copperRoof);
  } else if (island.slug === 'subisland-dessert') {
    const cake1 = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 0.5, 12), createLowPolyMat(0xf472b6));
    cake1.position.set(0, 0.45, 0);
    const cake2 = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 0.5, 12), createLowPolyMat(0xfde047));
    cake2.position.set(0, 0.95, 0);
    content.add(cake1, cake2);
  } else if (island.slug === 'subisland-street-food') {
    for (let i = -1; i <= 1; i += 2) {
      const cart = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.8, 0.8), createLowPolyMat(0xdc2626));
      cart.position.set(i * 1.1, 0.65, 0);
      content.add(cart);
    }
  } else if (island.slug === 'subisland-fruit-orchard') {
    for (let x = -1; x <= 1; x++) {
      for (let z = -1; z <= 1; z += 2) {
        content.add(createTree('blossom', [x * 1.1, 0.28, z * 0.8], 0.8));
      }
    }
  } else if (island.slug === 'subisland-cheese-dairy') {
    const barn = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.2, 1.4), createLowPolyMat(0x64748b));
    barn.position.set(-0.4, 0.85, 0);
    const cheese1 = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.3, 10), createLowPolyMat(0xfacc15));
    cheese1.position.set(1.2, 0.45, 0.6);
    content.add(barn, cheese1);
  }

  // Fashion & Design (SI-13 to SI-18)
  else if (island.slug === 'subisland-sneaker') {
    const shoebox = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.0, 1.4), createLowPolyMat(0xea580c));
    shoebox.position.set(0, 0.75, 0);
    content.add(shoebox);
  } else if (island.slug === 'subisland-fashion-runway') {
    const stage = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.35, 1.0), createLowPolyMat(0x18181b));
    stage.position.set(0, 0.4, 0);
    content.add(stage);
  } else if (island.slug === 'subisland-jewelry') {
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(1.2, 0), createLowPolyMat(0x0284c7, { roughness: 0.1, metalness: 0.5 }));
    gem.position.set(0, 1.2, 0);
    content.add(gem);
  } else if (island.slug === 'subisland-furniture-design') {
    const chair = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.8, 1.0), createLowPolyMat(0xb45309));
    chair.position.set(0, 0.65, 0);
    content.add(chair);
  } else if (island.slug === 'subisland-watchmaking') {
    const gear = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.3, 12), createLowPolyMat(0xd97706, { metalness: 0.7 }));
    gear.position.set(0, 0.45, 0);
    content.add(gear);
  } else if (island.slug === 'subisland-textile') {
    const loom = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.6, 1.2), createLowPolyMat(0x78350f));
    loom.position.set(0, 1.0, 0);
    content.add(loom);
  }

  // Transportation (SI-19 to SI-24)
  else if (island.slug === 'subisland-aviation') {
    const runway = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.15, 1.1), createLowPolyMat(0x374151));
    runway.position.set(0, 0.28, 0);
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 2.4, 8), createLowPolyMat(0x0284c7));
    tower.position.set(1.2, 1.3, -1.0);
    content.add(runway, tower);
  } else if (island.slug === 'subisland-railway') {
    const turntable = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.15, 16), createLowPolyMat(0x4b5563));
    turntable.position.set(0, 0.28, 0);
    content.add(turntable);
  } else if (island.slug === 'subisland-automobile') {
    const garage = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.3, 1.6), createLowPolyMat(0xdc2626));
    garage.position.set(0, 0.9, 0);
    content.add(garage);
  } else if (island.slug === 'subisland-maritime-transport') {
    const lighthouse = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.7, 2.8, 8), createLowPolyMat(0xdc2626));
    lighthouse.position.set(0.6, 1.5, -0.4);
    content.add(lighthouse);
  } else if (island.slug === 'subisland-cycling') {
    const track = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.4, 6, 16), createLowPolyMat(0xd97706));
    track.rotation.x = Math.PI / 2;
    track.position.set(0, 0.35, 0);
    content.add(track);
  } else if (island.slug === 'subisland-spacecraft') {
    const gantry = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3.2, 0.4), createLowPolyMat(0xdc2626));
    gantry.position.set(-0.8, 1.7, 0);
    const rocket = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 2.6, 8), createLowPolyMat(0xf8fafc));
    rocket.position.set(0, 1.4, 0);
    content.add(gantry, rocket);
  }

  // Technology & Industry (SI-25 to SI-30)
  else if (island.slug === 'subisland-robotics') {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.8, 0.5), createLowPolyMat(0xeab308));
    arm.position.set(0, 1.0, 0);
    content.add(arm);
  } else if (island.slug === 'subisland-renewable-energy') {
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 2.6, 8), createLowPolyMat(0xf8fafc));
    mast.position.set(0, 1.4, 0);
    content.add(mast);
  } else if (island.slug === 'subisland-electronics') {
    const chip = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.35, 1.8), createLowPolyMat(0x1e293b));
    chip.position.set(0, 0.4, 0);
    content.add(chip);
  } else if (island.slug === 'subisland-construction') {
    const crane = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.2, 0.3), createLowPolyMat(0xeab308));
    crane.position.set(-0.4, 1.7, 0);
    content.add(crane);
  } else if (island.slug === 'subisland-agri-tech') {
    const dome = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4, 1), createGlassMat(0x16a34a, 0.6));
    dome.position.set(0, 0.8, 0);
    content.add(dome);
  } else {
    // subisland-industrial-design
    const studio = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 1.6), createLowPolyMat(0x9a3412));
    studio.position.set(0, 0.85, 0);
    content.add(studio);
  }

  master.add(content);
  return master;
}
