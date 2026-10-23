import * as THREE from 'three';
import { IslandMetadata, IslandVariant } from '../../types/island';
import { createLowPolyMat, createWaterMat, createGlassMat } from './materials';

function mat(color: number | string, options: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    flatShading: true,
    roughness: 0.65,
    metalness: 0.15,
    ...options,
  });
}

/**
 * Procedural 3D Mesh Builders for 20 Avatar / Pandora Fantastical Floating Islands (MW-71 to MW-90).
 * Features soaring Hallelujah karst spires, twisting colossal tree vines, hanging aerial roots,
 * bioluminescent canopies, sacred weeping willows, floating shards, and waterfalls plunging into the void.
 */
export function buildAvatarMajorWorldScene(
  island: IslandMetadata,
  variant: IslandVariant
): THREE.Group {
  const g = new THREE.Group();

  const p0 = island.palette[0]?.hex || '#1E293B';
  const p1 = island.palette[1]?.hex || '#0D9488';
  const p2 = island.palette[2]?.hex || '#78350F';
  const p3 = island.palette[3]?.hex || '#10B981';

  const idNum = parseInt(island.id.replace('MW-', ''), 10);

  // -------------------------------------------------------------------------
  // 1. Core Floating Mountain Base & Inverted Underbelly (Pandora Karst Keel)
  // -------------------------------------------------------------------------
  const mainPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.3, 1.6, 9), mat(p0));
  mainPillar.position.y = 0.8;

  // Inverted stalactite underbelly pointing down into the sky
  const underbellyCone = new THREE.Mesh(new THREE.ConeGeometry(1.28, 1.8, 8), mat(p0));
  underbellyCone.rotation.x = Math.PI;
  underbellyCone.position.y = -0.9;

  // Glowing mineral veins on underbelly
  const mineralSpire = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.8, 5), mat(p1, { emissive: p1, emissiveIntensity: 0.9 }));
  mineralSpire.rotation.x = Math.PI;
  mineralSpire.position.set(0.1, -1.2, 0.1);

  g.add(mainPillar, underbellyCone, mineralSpire);

  // -------------------------------------------------------------------------
  // 2. Colossal Twisting Tree Vines & Hanging Aerial Roots (Avatar Lianas)
  // -------------------------------------------------------------------------
  // A spiral root helix wrapping around the mountain pillar
  const vineCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.95, -0.6, 0),
    new THREE.Vector3(0, -0.1, 1.1),
    new THREE.Vector3(-1.05, 0.5, 0),
    new THREE.Vector3(0, 1.0, -1.0),
    new THREE.Vector3(0.9, 1.5, 0),
    new THREE.Vector3(0, 1.8, 0.8),
  ]);
  const primaryVine = new THREE.Mesh(new THREE.TubeGeometry(vineCurve, 32, 0.08, 6, false), mat(p2, { roughness: 0.85 }));
  g.add(primaryVine);

  // Hanging aerial roots descending from cliff edges into the void
  [-0.6, 0.6, -0.2, 0.4].forEach((rx, idx) => {
    const rootLen = 0.8 + (idx % 3) * 0.4;
    const rz = idx % 2 === 0 ? 0.7 : -0.7;
    const aerialRoot = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.03, rootLen, 4), mat(p2));
    aerialRoot.position.set(rx, -0.4 - rootLen / 2, rz);
    g.add(aerialRoot);
  });

  // Hanging curtain vines (fine tendrils)
  for (let cv = 0; cv < 8; cv++) {
    const cang = (cv * Math.PI * 2) / 8;
    const curRoot = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.012, 0.6, 4), mat(p3, { emissive: p1, emissiveIntensity: 0.4 }));
    curRoot.position.set(Math.cos(cang) * 0.9, 0.2 - (cv % 3) * 0.15, Math.sin(cang) * 0.9);
    g.add(curRoot);
  }

  // -------------------------------------------------------------------------
  // 3. Levitating Satellite Shards Locked in Magnetic Flux
  // -------------------------------------------------------------------------
  [
    [-1.5, 0.4, 0.5, 0.35],
    [1.4, -0.2, -0.6, 0.4],
    [-0.8, -0.7, -1.2, 0.28],
  ].forEach(([sx, sy, sz, sr], idx) => {
    const shard = new THREE.Mesh(new THREE.DodecahedronGeometry(sr as number, 1), mat(p0));
    shard.scale.set(1.0, 1.5, 1.0);
    shard.position.set(sx as number, sy as number, sz as number);

    // Tethering vine cable linking shard to main mountain
    const cableCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, (sy as number) + 0.3, 0),
      new THREE.Vector3((sx as number) * 0.5, (sy as number) - 0.1, (sz as number) * 0.5),
      new THREE.Vector3(sx as number, sy as number, sz as number),
    ]);
    const cable = new THREE.Mesh(new THREE.TubeGeometry(cableCurve, 12, 0.03, 5, false), mat(p2));

    // Green moss cap on satellite shard
    const shardMoss = new THREE.Mesh(new THREE.SphereGeometry((sr as number) * 0.8, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2), mat(p3));
    shardMoss.position.set(sx as number, (sy as number) + (sr as number) * 0.7, sz as number);

    g.add(shard, cable, shardMoss);
  });

  // -------------------------------------------------------------------------
  // 4. Island-Specific Landmark Architectural Features
  // -------------------------------------------------------------------------
  if (idNum === 71 || island.slug.includes('hallelujah-spire')) {
    // MW-71: Hallelujah Floating Spire of the Wind — Soaring vertical needle with double vine wrap
    const skyNeedle = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.8, 8), mat(p0));
    skyNeedle.position.set(0, 2.3, 0);

    // Summit weeping tree canopy
    const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.65, 8, 6), mat(p3));
    canopy.scale.set(1.4, 0.5, 1.4);
    canopy.position.set(0, 3.1, 0);

    // Waterfall plume spilling off high precipice
    const waterfall = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 1.5), mat(p1, { roughness: 0.1 }));
    waterfall.position.set(0.65, 1.2, 0.3);

    g.add(skyNeedle, canopy, waterfall);
  } else if (idNum === 72 || island.slug.includes('tree-of-souls')) {
    // MW-72: Tree of Souls Sacred Sanctuary — Magnificent weeping glowing white willow
    const willowTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, 1.0, 8), mat('#F8FAFC', { roughness: 0.3 }));
    willowTrunk.position.y = 1.9;

    // Arching stone roots
    for (let r = 0; r < 4; r++) {
      const ang = (r * Math.PI) / 2;
      const rootArch = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.06, 6, 8, Math.PI), mat(p0));
      rootArch.rotation.z = Math.PI / 2;
      rootArch.rotation.y = ang;
      rootArch.position.set(Math.cos(ang) * 0.25, 1.55, Math.sin(ang) * 0.25);
      g.add(rootArch);
    }

    // Sacred weeping willow crown
    const soulDome = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 8), mat('#D946EF', { emissive: '#D946EF', emissiveIntensity: 0.8 }));
    soulDome.position.y = 2.45;
    g.add(willowTrunk, soulDome);

    // Cascading soul tendrils
    for (let t = 0; t < 12; t++) {
      const tang = (t * Math.PI * 2) / 12;
      const tendril = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.015, 0.9, 4), mat('#F8FAFC', { emissive: '#D946EF', emissiveIntensity: 0.9 }));
      tendril.position.set(Math.cos(tang) * 0.48, 2.0, Math.sin(tang) * 0.48);
      g.add(tendril);
    }

    // Sacred reflection pool
    const pool = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.04, 12), mat('#38BDF8', { roughness: 0.1, emissive: '#38BDF8', emissiveIntensity: 0.5 }));
    pool.position.y = 1.62;
    g.add(pool);
  } else if (idNum === 73 || island.slug.includes('fungal') || island.slug.includes('polyphemus')) {
    // MW-73: Bioluminescent Fungal Canopy — Giant tiered shelf mushrooms
    [
      [0, 1.8, 0, 0.6, '#8B5CF6'],
      [0.45, 2.2, 0.2, 0.45, '#06B6D4'],
      [-0.4, 2.45, -0.2, 0.4, '#10B981'],
    ].forEach(([mx, my, mz, mr, mCol]) => {
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.6, 6), mat(p2));
      stem.position.set(mx as number, (my as number) - 0.25, mz as number);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(mr as number, 0.22, 10), mat(mCol as string, { emissive: mCol as string, emissiveIntensity: 0.8 }));
      cap.position.set(mx as number, my as number, mz as number);
      g.add(stem, cap);
    });

    // Spore geyser bulbs
    for (let sb = 0; sb < 6; sb++) {
      const sang = (sb * Math.PI * 2) / 6;
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 4), mat('#06B6D4', { emissive: '#06B6D4', emissiveIntensity: 1.2 }));
      bulb.position.set(Math.cos(sang) * 0.55, 1.7, Math.sin(sang) * 0.55);
      g.add(bulb);
    }
  } else if (idNum === 74 || island.slug.includes('ikran') || island.slug.includes('archway')) {
    // MW-74: Verdant Sky-Arch of the Ikran — Monumental natural rock bridge
    const arch = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.18, 8, 12, Math.PI), mat(p0));
    arch.position.set(0, 1.6, 0);

    // Twin peaks supporting the arch
    [-0.85, 0.85].forEach((ax) => {
      const peak = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.2, 7), mat(p0));
      peak.position.set(ax, 2.1, 0);
      g.add(peak);
    });

    // Heavy curtain vines looping across the arch
    for (let v = 0; v < 5; v++) {
      const vx = -0.5 + v * 0.25;
      const vineSwag = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.7, 4), mat(p2));
      vineSwag.position.set(vx, 1.8, 0);
      g.add(vineSwag);
    }
    g.add(arch);
  } else if (idNum === 75 || island.slug.includes('void-cascade')) {
    // MW-75: Void Cascade of the Floating Shards — Waterfall leaping across open air
    const upperPool = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.1, 10), mat(p1, { roughness: 0.1 }));
    upperPool.position.set(0, 1.65, 0);

    // Twin waterfalls cascading over the edge into empty space
    [-0.35, 0.35].forEach((wx) => {
      const fall = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 1.8), mat(p1, { roughness: 0.1, emissive: p1, emissiveIntensity: 0.4 }));
      fall.position.set(wx, 0.7, 0.65);
      g.add(fall);
    });
    g.add(upperPool);
  } else if (idNum === 76 || island.slug.includes('dragon-spine')) {
    // MW-76: Dragon-Spine Vine Ridge — Serrated fin karst pinnacles
    for (let sp = 0; sp < 5; sp++) {
      const sx = -0.6 + sp * 0.3;
      const sh = 0.6 + (sp === 2 ? 0.6 : 0.2);
      const fin = new THREE.Mesh(new THREE.ConeGeometry(0.2, sh, 4), mat(p0));
      fin.scale.set(0.6, 1.0, 1.8);
      fin.position.set(sx, 1.6 + sh / 2, 0);
      g.add(fin);
    }
    // Living root suspension bridge along spine
    const spineRoot = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 0.12), mat(p2));
    spineRoot.position.set(0, 1.7, 0.25);
    g.add(spineRoot);
  } else if (idNum === 77 || island.slug.includes('mangrove-atoll')) {
    // MW-77: Floating Luminescent Mangrove Atoll — Stilt prop root cage & lagoon
    const lagoon = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.08, 12), mat('#0284C7', { roughness: 0.1, emissive: '#0284C7', emissiveIntensity: 0.6 }));
    lagoon.position.y = 1.62;

    // Arched stilt prop roots
    for (let pr = 0; pr < 8; pr++) {
      const pang = (pr * Math.PI * 2) / 8;
      const propRoot = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.04, 6, 8, Math.PI), mat(p2));
      propRoot.rotation.z = Math.PI / 2;
      propRoot.rotation.y = pang;
      propRoot.position.set(Math.cos(pang) * 0.65, 1.65, Math.sin(pang) * 0.65);

      const treeTop = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 4), mat(p3));
      treeTop.position.set(Math.cos(pang) * 0.65, 2.05, Math.sin(pang) * 0.65);
      g.add(propRoot, treeTop);
    }
    g.add(lagoon);
  } else if (idNum === 78 || island.slug.includes('spore-hollow') || island.slug.includes('redwood')) {
    // MW-78: Spore-Mist Hollow — Horizontal hollow redwood trunk
    const hollowTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.45, 1.5, 10, 1, true), mat(p2));
    hollowTrunk.rotation.z = Math.PI / 2;
    hollowTrunk.position.y = 1.85;

    // Glowing core interior
    const coreGlow = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 1.4, 8), mat('#D946EF', { emissive: '#D946EF', emissiveIntensity: 0.9 }));
    coreGlow.rotation.z = Math.PI / 2;
    coreGlow.position.y = 1.85;

    // Spore chimney
    const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.45, 6), mat(p2));
    chimney.position.set(0.2, 2.3, 0);
    g.add(hollowTrunk, coreGlow, chimney);
  } else if (idNum === 79 || island.slug.includes('magnetic') || island.slug.includes('vortex')) {
    // MW-79: Magnetic Vortex Needle — Inverted needle & orbiting rings
    const needlePillar = new THREE.Mesh(new THREE.ConeGeometry(0.45, 2.0, 6), mat(p0));
    needlePillar.position.set(0, 2.2, 0);

    // Orbiting magnetic ring
    const orbitRing = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.04, 6, 16), mat('#8B5CF6', { emissive: '#8B5CF6', emissiveIntensity: 1.0 }));
    orbitRing.rotation.x = Math.PI / 3;
    orbitRing.position.set(0, 2.0, 0);
    g.add(needlePillar, orbitRing);
  } else if (idNum === 80 || island.slug.includes('cathedral') || island.slug.includes('navi')) {
    // MW-80: Canopy Cathedral of the Na'vi — Interlocking banyan tree vaulted boughs
    const banyanTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 0.9, 8), mat(p2));
    banyanTrunk.position.y = 1.95;

    // Four vaulted spreading boughs
    for (let b = 0; b < 4; b++) {
      const bang = (b * Math.PI) / 2;
      const bough = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 0.8, 6), mat(p2));
      bough.rotation.z = Math.sin(bang) * 0.6;
      bough.rotation.x = Math.cos(bang) * 0.6;
      bough.position.set(Math.cos(bang) * 0.35, 2.35, Math.sin(bang) * 0.35);

      const leafCloud = new THREE.Mesh(new THREE.SphereGeometry(0.32, 6, 4), mat(p3));
      leafCloud.position.set(Math.cos(bang) * 0.65, 2.65, Math.sin(bang) * 0.65);
      g.add(bough, leafCloud);
    }
    g.add(banyanTrunk);
  } else if (idNum === 81 || island.slug.includes('azure-grotto') || island.slug.includes('abyss')) {
    // MW-81: Azure Abyss Glowing Crystal Grotto — Split mountain with crystal cluster
    [-0.5, 0.5].forEach((gx) => {
      const splitWall = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.4, 0.9), mat(p0));
      splitWall.position.set(gx, 2.0, 0);
      g.add(splitWall);
    });

    // Giant crystal cluster inside the gap
    for (let c = 0; c < 5; c++) {
      const cang = (c * Math.PI * 2) / 5;
      const crystal = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.65, 6), mat('#38BDF8', { emissive: '#38BDF8', emissiveIntensity: 1.0 }));
      crystal.rotation.z = Math.sin(cang) * 0.35;
      crystal.position.set(Math.cos(cang) * 0.15, 2.1, Math.sin(cang) * 0.15);
      g.add(crystal);
    }
  } else if (idNum === 82 || island.slug.includes('banshee-roost')) {
    // MW-82: Cradle of the Storm-Banshee Roost — Perches & braided nests
    const perchCrag = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.8, 6), mat(p0));
    perchCrag.position.set(0, 2.2, 0);

    // Three woven nest bowls perched on ledges
    [
      [0.35, 2.4, 0.2],
      [-0.32, 2.1, -0.2],
      [0, 2.7, 0.3],
    ].forEach(([nx, ny, nz]) => {
      const nest = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.04, 4, 8), mat(p2));
      nest.rotation.x = Math.PI / 2;
      nest.position.set(nx, ny, nz);
      g.add(nest);
    });
    g.add(perchCrag);
  } else if (idNum === 83 || island.slug.includes('sunken-emerald-crater')) {
    // MW-83: Sunken Emerald Crater Valley — Inward caldera with central mist lake
    const craterRim = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.2, 8, 12), mat(p0));
    craterRim.rotation.x = Math.PI / 2;
    craterRim.position.y = 1.8;

    const valleyFloor = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.1, 10), mat(p3));
    valleyFloor.position.y = 1.6;

    const lake = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.02, 10), mat('#38BDF8', { roughness: 0.1 }));
    lake.position.y = 1.66;
    g.add(craterRim, valleyFloor, lake);
  } else if (idNum === 84 || island.slug.includes('twin-pillars')) {
    // MW-84: Twin Pillars of the Aether — Intertwined dual spires
    [-0.45, 0.45].forEach((tx) => {
      const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.35, 1.6, 7), mat(p0));
      spire.position.set(tx, 2.2, 0);
      g.add(spire);
    });
    // Cross-connecting root bridges
    for (let cb = 0; cb < 3; cb++) {
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.04, 0.1), mat(p2));
      bridge.position.set(0, 1.8 + cb * 0.4, (cb % 2 === 0 ? 0.08 : -0.08));
      g.add(bridge);
    }
  } else if (idNum === 85 || island.slug.includes('fern-terraces')) {
    // MW-85: Phosphor Fern Terraces — Stepped limestone pools
    [0.15, 0.38, 0.62].forEach((ty, idx) => {
      const terrace = new THREE.Mesh(new THREE.CylinderGeometry(0.75 - idx * 0.15, 0.8 - idx * 0.15, 0.12, 10), mat('#F1F5F9'));
      terrace.position.set(0, 1.6 + ty, idx * 0.1);
      const water = new THREE.Mesh(new THREE.CylinderGeometry(0.7 - idx * 0.15, 0.7 - idx * 0.15, 0.02, 10), mat('#06B6D4', { roughness: 0.1, emissive: '#06B6D4', emissiveIntensity: 0.6 }));
      water.position.set(0, 1.66 + ty, idx * 0.1);
      g.add(terrace, water);
    });
  } else if (idNum === 86 || island.slug.includes('titan-tree-stump')) {
    // MW-86: Titan Tree Stump Citadel — Mile-wide petrified trunk mesa
    const stumpMesa = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 0.7, 12), mat(p2));
    stumpMesa.position.y = 1.95;

    // Concentric growth rings on top
    const growthRings = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.02, 12), mat(p1));
    growthRings.position.y = 2.31;
    g.add(stumpMesa, growthRings);
  } else if (idNum === 87 || island.slug.includes('mushroom-haven')) {
    // MW-87: Glow-Spore Canopy Haven — Three oversized mushroom umbrellas
    [
      [0, 2.4, 0, 0.55, '#F97316'],
      [-0.4, 2.1, 0.3, 0.42, '#06B6D4'],
      [0.4, 2.1, -0.3, 0.42, '#10B981'],
    ].forEach(([sx, sy, sz, sr, scol]) => {
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.8, 6), mat(p2));
      stem.position.set(sx as number, (sy as number) - 0.4, sz as number);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(sr as number, 0.25, 10), mat(scol as string, { emissive: scol as string, emissiveIntensity: 0.9 }));
      cap.position.set(sx as number, sy as number, sz as number);
      g.add(stem, cap);
    });
  } else if (idNum === 88 || island.slug.includes('mist-falls')) {
    // MW-88: Echoing Mist Falls of Pandora — Towering sheer precipice with twin torrents
    const sheerWall = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.8, 0.5), mat(p0));
    sheerWall.position.set(0, 2.1, 0);

    [-0.25, 0.25].forEach((fx) => {
      const waterTorrent = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 1.7), mat('#38BDF8', { roughness: 0.1, emissive: '#38BDF8', emissiveIntensity: 0.5 }));
      waterTorrent.position.set(fx, 2.0, 0.26);
      g.add(waterTorrent);
    });
    g.add(sheerWall);
  } else if (idNum === 89 || island.slug.includes('root-weaver')) {
    // MW-89: Celestial Root Weaver Mother Island — Radiating root spokes to 4 islets
    const motherPeak = new THREE.Mesh(new THREE.ConeGeometry(0.65, 1.6, 8), mat(p0));
    motherPeak.position.set(0, 2.2, 0);

    for (let r = 0; r < 4; r++) {
      const rang = (r * Math.PI) / 2;
      const spokeCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 2.0, 0),
        new THREE.Vector3(Math.cos(rang) * 0.7, 1.7, Math.sin(rang) * 0.7),
        new THREE.Vector3(Math.cos(rang) * 1.3, 1.4, Math.sin(rang) * 1.3),
      ]);
      const spoke = new THREE.Mesh(new THREE.TubeGeometry(spokeCurve, 12, 0.04, 5, false), mat('#D97706', { emissive: '#D97706', emissiveIntensity: 0.6 }));

      const subIslet = new THREE.Mesh(new THREE.DodecahedronGeometry(0.25, 1), mat(p0));
      subIslet.position.set(Math.cos(rang) * 1.3, 1.4, Math.sin(rang) * 1.3);
      g.add(spoke, subIslet);
    }
    g.add(motherPeak);
  } else {
    // MW-90: Floating Archipelago of Eywa — Sovereign Grand Archipelago
    const centralPeak = new THREE.Mesh(new THREE.ConeGeometry(0.75, 2.0, 8), mat(p0));
    centralPeak.position.set(0, 2.3, 0);

    // Sacred Sovereign Heartwood Tree
    const sacredTree = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.18, 0.8, 6), mat('#F59E0B', { emissive: '#F59E0B', emissiveIntensity: 0.6 }));
    sacredTree.position.set(0, 3.4, 0);

    const sacredCrown = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 6), mat('#0D9488', { emissive: '#0D9488', emissiveIntensity: 0.8 }));
    sacredCrown.position.set(0, 3.9, 0);

    // Interconnecting root bridges between 3 companion peaks
    [
      [-0.8, 1.8, 0.4],
      [0.8, 1.6, -0.3],
      [-0.2, 1.5, -0.8],
    ].forEach(([px, py, pz]) => {
      const peak = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.2, 6), mat(p0));
      peak.position.set(px, py + 0.6, pz);

      const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.9, 4), mat(p2));
      bridge.rotation.z = Math.PI / 3;
      bridge.position.set(px * 0.5, py + 0.8, pz * 0.5);
      g.add(peak, bridge);
    });

    g.add(centralPeak, sacredTree, sacredCrown);
  }

  return g;
}
