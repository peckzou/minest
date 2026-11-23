import * as THREE from 'three';
import { IslandMetadata, IslandVariant } from '../../types/island';

function mat(color: number | string, options: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    flatShading: true,
    roughness: 0.65,
    metalness: 0.1,
    ...options,
  });
}

// Pure Standalone Object Architecture (Completely free of any base or pedestal platform)
export function createObjectStudioBase(): THREE.Group {
  // Returns an empty group: Level 3 objects are 100% pure standalone models without bases or pedestals
  return new THREE.Group();
}

// ---------------------------------------------------------------------------
// 20 Low-Poly Standalone Object Builders
// ---------------------------------------------------------------------------

// 01. Open Book
export function buildOpenBookObject(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  // Leather Cover (Two angled wings)
  [-1, 1].forEach((dir) => {
    const cover = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 2.2), mat('#8D6E63'));
    cover.position.set(dir * 0.85, 0.18, 0);
    cover.rotation.z = dir * -0.12;
    cover.castShadow = true;
    g.add(cover);

    // Layered Pages block
    const pages = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.35, 2.1), mat('#FFF8E7'));
    pages.position.set(dir * 0.8, 0.38, 0);
    pages.rotation.z = dir * -0.15;
    pages.castShadow = true;
    g.add(pages);
  });

  // Curved Spine
  const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 2.2, 12, 1, false, 0, Math.PI), mat('#5D4037'));
  spine.position.set(0, 0.18, 0);
  spine.rotation.x = Math.PI / 2;
  g.add(spine);

  // Red Ribbon Bookmark
  const ribbonGeo = new THREE.BoxGeometry(0.18, 0.02, 2.4);
  const ribbon = new THREE.Mesh(ribbonGeo, mat('#C62828'));
  ribbon.position.set(0.15, 0.6, 0.2);
  ribbon.rotation.y = 0.1;
  g.add(ribbon);

  return g;
}

// 02. Terrestrial Globe
export function buildGlobeObject(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  // Slim Integrated Globe Foot & Brass Meridian Stand
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.85, 0.18, 20), mat('#5D4037'));
  foot.position.set(0, 0.09, 0);
  g.add(foot);

  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 1.3, 16), mat('#5D4037'));
  pillar.position.set(0, 0.8, 0);
  g.add(pillar);

  // Brass Semi-Circle Meridian Ring
  const ringGeo = new THREE.TorusGeometry(1.8, 0.1, 8, 32, Math.PI);
  const ringMat = mat('#D4AF37', { metalness: 0.8, roughness: 0.25 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.set(0, 2.2, 0);
  ring.rotation.z = -Math.PI / 2 + 0.41; // 23.5 deg tilt
  g.add(ring);

  // Planetary Sphere (Tilted)
  const sphereGroup = new THREE.Group();
  sphereGroup.position.set(0, 2.2, 0);
  sphereGroup.rotation.z = 0.41; // 23.5 deg tilt

  const ocean = new THREE.Mesh(new THREE.SphereGeometry(1.5, 16, 12), mat('#1E88E5'));
  ocean.castShadow = true;
  sphereGroup.add(ocean);

  // Continent Facets
  [
    [0.6, 0.4, 1.2, 0.7],
    [-0.8, 0.3, 1.0, 0.6],
    [0.2, -0.6, 1.3, 0.5],
    [-0.5, 0.9, -1.0, 0.8],
    [0.8, -0.4, -1.1, 0.6],
  ].forEach(([x, y, z, s]) => {
    const cont = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), mat('#43A047'));
    cont.position.set(x, y, z);
    sphereGroup.add(cont);
  });

  g.add(sphereGroup);
  return g;
}

// 03. Scientific Microscope
export function buildMicroscopeObject(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  // Heavy Horseshoe Base
  const baseGeo = new THREE.CylinderGeometry(1.2, 1.4, 0.4, 16, 1, false, 0, Math.PI * 1.5);
  const base = new THREE.Mesh(baseGeo, mat('#212121'));
  base.position.set(0, 0.2, 0);
  base.rotation.y = Math.PI / 4;
  g.add(base);

  // Vertical Limb Pillar
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 2.4, 8), mat('#212121'));
  pillar.position.set(-0.5, 1.4, 0);
  g.add(pillar);

  // Specimen Stage
  const stage = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 1.4), mat('#455A64'));
  stage.position.set(0.2, 1.2, 0);
  g.add(stage);

  // Glass Specimen Slide
  const slide = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.04, 0.4), mat('#80DEEA', { transparent: true, opacity: 0.8 }));
  slide.position.set(0.2, 1.28, 0);
  g.add(slide);

  // Angled Eyepiece Tube
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.8, 12), mat('#CFD8DC', { metalness: 0.8 }));
  tube.position.set(0.2, 2.5, 0);
  tube.rotation.z = -0.3;
  g.add(tube);

  // Revolving Objective Turret
  const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.3, 12), mat('#D4AF37', { metalness: 0.7 }));
  turret.position.set(0.2, 1.6, 0);
  g.add(turret);

  // Lenses
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.35, 8), mat('#CFD8DC', { metalness: 0.7 }));
    lens.position.set(0.2 + Math.cos(angle) * 0.25, 1.35, Math.sin(angle) * 0.25);
    g.add(lens);
  }

  return g;
}

// 04. Hourglass
export function buildHourglassObject(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  // Top & Bottom Wooden Endplates
  [-1.5, 1.5].forEach((y) => {
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.2, 24), mat('#5D4037'));
    plate.position.set(0, y + 1.6, 0);
    plate.castShadow = true;
    g.add(plate);
  });

  // Three Wooden Spindle Pillars
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.0, 8), mat('#8D6E63'));
    pillar.position.set(Math.cos(angle) * 1.0, 1.6, Math.sin(angle) * 1.0);
    g.add(pillar);
  }

  // Blown Glass Bulbs (Upper & Lower Cones)
  const bulbMat = mat('#E1F5FE', { transparent: true, opacity: 0.5, metalness: 0.1, roughness: 0.1 });
  const topBulb = new THREE.Mesh(new THREE.ConeGeometry(0.95, 1.4, 16), bulbMat);
  topBulb.position.set(0, 2.3, 0);
  topBulb.rotation.x = Math.PI;
  g.add(topBulb);

  const bottomBulb = new THREE.Mesh(new THREE.ConeGeometry(0.95, 1.4, 16), bulbMat);
  bottomBulb.position.set(0, 0.9, 0);
  g.add(bottomBulb);

  // Golden Sand Cones
  const sandMat = mat('#FFCA28', { roughness: 0.8 });
  const topSand = new THREE.Mesh(new THREE.ConeGeometry(0.7, 0.8, 12), sandMat);
  topSand.position.set(0, 2.5, 0);
  topSand.rotation.x = Math.PI;
  g.add(topSand);

  const bottomSand = new THREE.Mesh(new THREE.ConeGeometry(0.8, 0.7, 12), sandMat);
  bottomSand.position.set(0, 0.55, 0);
  g.add(bottomSand);

  // Stream in the neck
  const trickle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.0, 6), sandMat);
  trickle.position.set(0, 1.5, 0);
  g.add(trickle);

  return g;
}

// 05. Cinema Film Reel
export function buildFilmReelObject(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  // Spoke Wheel Flanges
  [-0.15, 0.15].forEach((y) => {
    const flange = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.04, 32), mat('#B0BEC5', { metalness: 0.8 }));
    flange.position.set(0, y + 1.2, 0);
    flange.rotation.x = Math.PI / 2;
    flange.castShadow = true;
    g.add(flange);
  });

  // Wound Celluloid Film Stock Core
  const filmCore = new THREE.Mesh(new THREE.CylinderGeometry(1.65, 1.65, 0.26, 32), mat('#3E2723'));
  filmCore.position.set(0, 1.2, 0);
  filmCore.rotation.x = Math.PI / 2;
  g.add(filmCore);

  // Center Spindle Hub
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.35, 16), mat('#ECEFF1', { metalness: 0.7 }));
  hub.position.set(0, 1.2, 0);
  hub.rotation.x = Math.PI / 2;
  g.add(hub);

  // Unspooled Curling Film Strip Tail
  const stripGeo = new THREE.TorusGeometry(1.8, 0.08, 6, 24, Math.PI / 1.5);
  const strip = new THREE.Mesh(stripGeo, mat('#3E2723'));
  strip.position.set(0.6, 0.6, 0);
  strip.rotation.z = 0.5;
  g.add(strip);

  return g;
}

// 06. Vinyl Record
export function buildVinylRecordObject(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  // 12-Inch Vinyl Disc
  const vinylGeo = new THREE.CylinderGeometry(2.0, 2.0, 0.04, 32);
  const vinyl = new THREE.Mesh(vinylGeo, mat('#121212', { roughness: 0.3, metalness: 0.2 }));
  vinyl.position.set(-0.2, 1.2, 0.2);
  vinyl.rotation.set(0.3, 0.2, 0);
  vinyl.castShadow = true;
  g.add(vinyl);

  // Scarlet Center Label
  const labelGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.05, 24);
  const label = new THREE.Mesh(labelGeo, mat('#E53935'));
  label.position.set(-0.2, 1.2, 0.2);
  label.rotation.set(0.3, 0.2, 0);
  g.add(label);

  // Propped Album Cardboard Jacket
  const jacketGeo = new THREE.BoxGeometry(2.8, 2.8, 0.08);
  const jacket = new THREE.Mesh(jacketGeo, mat('#FFE082'));
  jacket.position.set(0.5, 1.3, -0.4);
  jacket.rotation.set(0.2, -0.3, 0);
  jacket.castShadow = true;
  g.add(jacket);

  return g;
}

// 07. Artist Palette
export function buildArtistPaletteObject(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  // Kidney-shaped Birch Palette
  const boardGeo = new THREE.CylinderGeometry(1.8, 1.9, 0.08, 24);
  const board = new THREE.Mesh(boardGeo, mat('#D7CCC8'));
  board.scale.set(1.4, 1.0, 1.0);
  board.position.set(0, 0.3, 0);
  board.rotation.set(-0.2, 0.4, 0);
  board.castShadow = true;
  g.add(board);

  // Paint Dollops
  const colors = ['#E53935', '#FDD835', '#1E88E5', '#43A047', '#FFFFFF'];
  colors.forEach((col, idx) => {
    const angle = (idx / colors.length) * Math.PI * 0.9 - 1.2;
    const blob = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), mat(col, { roughness: 0.2 }));
    blob.scale.set(1.0, 0.4, 1.0);
    blob.position.set(Math.cos(angle) * 1.5, 0.45, Math.sin(angle) * 1.1);
    g.add(blob);
  });

  // Paintbrush
  const brushHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 2.4, 8), mat('#5D4037'));
  brushHandle.position.set(0.4, 0.6, 0.2);
  brushHandle.rotation.set(0.8, -0.6, 0.5);
  g.add(brushHandle);

  const brushTip = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.4, 8), mat('#212121'));
  brushTip.position.set(1.2, 0.35, 0.8);
  g.add(brushTip);

  return g;
}

// 08. Game Controller
export function buildGameControllerObject(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  // Main Controller Body
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.55, 1.4), mat('#263238'));
  body.position.set(0, 0.8, 0);
  body.rotation.x = -0.3;
  body.castShadow = true;
  g.add(body);

  // Ergonomic Grip Wings
  [-1.2, 1.2].forEach((x) => {
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 1.2, 12), mat('#263238'));
    grip.position.set(x, 0.65, 0.2);
    grip.rotation.set(-0.3, 0, x > 0 ? -0.3 : 0.3);
    g.add(grip);
  });

  // D-Pad (Left)
  const dpad = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.15, 0.55), mat('#455A64'));
  dpad.position.set(-0.7, 0.95, -0.1);
  dpad.rotation.x = -0.3;
  g.add(dpad);

  // Colored Action Buttons (Right)
  const btnColors = ['#43A047', '#E53935', '#1E88E5', '#FFB300'];
  [
    [0.7, 0.1],
    [0.9, -0.1],
    [0.5, -0.1],
    [0.7, -0.3],
  ].forEach(([bx, bz], i) => {
    const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.1, 8), mat(btnColors[i]));
    btn.position.set(bx, 1.05, bz);
    btn.rotation.x = -0.3;
    g.add(btn);
  });

  // Dual Thumbsticks
  [-0.3, 0.3].forEach((tx) => {
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.1, 0.2, 10), mat('#37474F'));
    stick.position.set(tx, 0.95, 0.3);
    stick.rotation.x = -0.3;
    g.add(stick);
  });

  return g;
}

// 09. Coffee Cup
export function buildCoffeeCupObject(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  // Ceramic Mug Body
  const mugGeo = new THREE.CylinderGeometry(1.1, 0.9, 1.6, 24);
  const mug = new THREE.Mesh(mugGeo, mat('#E0F2F1'));
  mug.position.set(0, 0.9, 0);
  mug.castShadow = true;
  g.add(mug);

  // Dark Espresso Surface
  const coffee = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.05, 24), mat('#3E2723'));
  coffee.position.set(0, 1.6, 0);
  g.add(coffee);

  // Latte Art Heart Foam
  const heart = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), mat('#FFF8E1'));
  heart.scale.set(1.4, 0.1, 1.0);
  heart.position.set(0, 1.63, 0);
  g.add(heart);

  // Loop Handle
  const handleGeo = new THREE.TorusGeometry(0.55, 0.14, 8, 16, Math.PI);
  const handle = new THREE.Mesh(handleGeo, mat('#E0F2F1'));
  handle.position.set(1.15, 0.9, 0);
  handle.rotation.z = -Math.PI / 2;
  g.add(handle);

  // Rising Steam Wisps
  const steamGeo = new THREE.TorusGeometry(0.3, 0.04, 6, 12, Math.PI);
  [-0.3, 0.2].forEach((sx, i) => {
    const steam = new THREE.Mesh(steamGeo, mat('#ECEFF1', { transparent: true, opacity: 0.6 }));
    steam.position.set(sx, 2.2 + i * 0.4, 0);
    steam.rotation.set(0, 0, i === 0 ? 0.4 : -0.4);
    g.add(steam);
  });

  return g;
}

// 10. Adventure Backpack
export function buildBackpackObject(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  // Canvas Main Pack
  const pack = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.2, 1.2), mat('#33691E'));
  pack.position.set(0, 1.25, 0);
  pack.castShadow = true;
  g.add(pack);

  // Front Utility Pouch
  const pouch = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.0, 0.5), mat('#558B2F'));
  pouch.position.set(0, 0.85, 0.7);
  g.add(pouch);

  // Rolled Bedroll on Top
  const bedroll = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 2.0, 16), mat('#C62828'));
  bedroll.position.set(0, 2.45, 0);
  bedroll.rotation.z = Math.PI / 2;
  g.add(bedroll);

  // Leather Straps & Brass Buckles
  [-0.5, 0.5].forEach((sx) => {
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.8, 0.05), mat('#6D4C41'));
    strap.position.set(sx, 1.2, 0.62);
    g.add(strap);

    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.08), mat('#D4AF37', { metalness: 0.8 }));
    buckle.position.set(sx, 1.4, 0.65);
    g.add(buckle);
  });

  return g;
}

// 11. Potted Plant / Succulent
export function buildPlantPotObject(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  // Terracotta Pot
  const potGeo = new THREE.CylinderGeometry(1.2, 0.9, 1.4, 16);
  const pot = new THREE.Mesh(potGeo, mat('#E64A19'));
  pot.position.set(0, 0.75, 0);
  pot.castShadow = true;
  g.add(pot);

  // Pot Rim Lip
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.25, 16), mat('#D84315'));
  rim.position.set(0, 1.4, 0);
  g.add(rim);

  // Soil
  const soil = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.1, 16), mat('#3E2723'));
  soil.position.set(0, 1.45, 0);
  g.add(soil);

  // Succulent Rosette Foliage
  for (let ring = 0; ring < 3; ring++) {
    const count = 6 + ring * 4;
    const radius = 0.4 + ring * 0.35;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.6, 6), mat(ring === 0 ? '#F06292' : '#7CB342'));
      leaf.position.set(Math.cos(angle) * radius, 1.6 + (2 - ring) * 0.12, Math.sin(angle) * radius);
      leaf.rotation.set(Math.sin(angle) * 0.4, 0, -Math.cos(angle) * 0.4);
      g.add(leaf);
    }
  }

  return g;
}

// 12. Mechanical Watch
export function buildMechanicalWatchObject(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  // Steel Watch Casing
  const caseGeo = new THREE.CylinderGeometry(1.4, 1.4, 0.35, 24);
  const wCase = new THREE.Mesh(caseGeo, mat('#CFD8DC', { metalness: 0.8, roughness: 0.2 }));
  wCase.position.set(0, 0.5, 0);
  wCase.castShadow = true;
  g.add(wCase);

  // White Dial Face
  const dial = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.05, 24), mat('#ECEFF1'));
  dial.position.set(0, 0.68, 0);
  g.add(dial);

  // Blued Steel Watch Hands
  const hHand = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 0.6), mat('#1565C0'));
  hHand.position.set(0, 0.72, 0.25);
  hHand.rotation.y = 0.6;
  g.add(hHand);

  const mHand = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.9), mat('#1565C0'));
  mHand.position.set(0, 0.73, 0.35);
  mHand.rotation.y = -1.2;
  g.add(mHand);

  // Leather Wrist Straps (North & South)
  [-1.6, 1.6].forEach((z) => {
    const strap = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.12, 1.6), mat('#5D4037'));
    strap.position.set(0, 0.35, z);
    strap.rotation.x = z > 0 ? 0.2 : -0.2;
    g.add(strap);
  });

  // Winding Crown
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.2, 12), mat('#D4AF37', { metalness: 0.8 }));
  crown.rotation.z = Math.PI / 2;
  crown.position.set(1.5, 0.5, 0);
  g.add(crown);

  return g;
}

// 13. Bonsai Tree
export function buildBonsaiTreeObject(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  // Glazed Oval Bonsai Tray
  const trayGeo = new THREE.CylinderGeometry(1.8, 1.9, 0.35, 16);
  const tray = new THREE.Mesh(trayGeo, mat('#546E7A'));
  tray.scale.set(1.3, 1.0, 1.0);
  tray.position.set(0, 0.2, 0);
  g.add(tray);

  // Soil bed
  const soil = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 0.1, 16), mat('#3E2723'));
  soil.scale.set(1.3, 1.0, 1.0);
  soil.position.set(0, 0.38, 0);
  g.add(soil);

  // Sinuous Gnarled Trunk (S-Curve)
  const t1 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 1.4, 8), mat('#4E342E'));
  t1.position.set(-0.2, 0.9, 0);
  t1.rotation.z = -0.3;
  g.add(t1);

  const t2 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 1.2, 8), mat('#4E342E'));
  t2.position.set(0.2, 1.8, 0);
  t2.rotation.z = 0.4;
  g.add(t2);

  // Cloud Needle Foliage Pads
  [
    [-0.8, 1.6, 0.2, 0.8],
    [0.9, 2.2, -0.1, 0.9],
    [-0.1, 2.8, 0.1, 1.1],
  ].forEach(([x, y, z, s]) => {
    const pad = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 1), mat('#2E7D32'));
    pad.scale.set(1.4, 0.45, 1.1);
    pad.position.set(x, y, z);
    pad.castShadow = true;
    g.add(pad);
  });

  return g;
}

// 14. Seashell (Nautilus)
export function buildSeashellObject(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  // Logarithmic Expanding Shell Spiral
  for (let i = 0; i < 9; i++) {
    const t = i / 8;
    const r = 0.3 + Math.pow(t, 1.4) * 1.5;
    const angle = t * Math.PI * 1.8;
    const seg = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 8), mat(i % 2 === 0 ? '#FFF8E1' : '#E64A19'));
    seg.position.set(Math.cos(angle) * (t * 1.4), 0.4 + t * 1.4, Math.sin(angle) * (t * 1.0));
    seg.castShadow = true;
    g.add(seg);
  }

  // Pearlescent Aperture Rim
  const ap = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.15, 8, 16), mat('#B2EBF2', { roughness: 0.2, metalness: 0.3 }));
  ap.position.set(0.6, 1.6, 0.4);
  ap.rotation.set(0.4, 0.8, 0);
  g.add(ap);

  return g;
}

// 15. Mountain Crystal / Gem Cluster
export function buildCrystalClusterObject(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  // Dark Basalt Rock Host Matrix
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.6, 1), mat('#455A64'));
  rock.scale.set(1.4, 0.5, 1.3);
  rock.position.set(0, 0.3, 0);
  g.add(rock);

  // Amethyst Crystal Prisms
  const crystalColors = ['#AB47BC', '#7E57C2', '#CE93D8'];
  const specs = [
    [0.0, 1.6, 0.0, 0.45, 2.4, 0],
    [-0.6, 1.2, 0.5, 0.35, 1.8, 1],
    [0.7, 1.1, -0.4, 0.35, 1.6, 0],
    [0.5, 0.9, 0.6, 0.25, 1.3, 2],
    [-0.7, 0.8, -0.5, 0.3, 1.4, 1],
  ];

  specs.forEach(([x, y, z, r, h, cIdx]) => {
    const prism = new THREE.Mesh(
      new THREE.CylinderGeometry(r * 0.7, r, h, 6),
      mat(crystalColors[cIdx], { roughness: 0.2, metalness: 0.3 })
    );
    prism.position.set(x, y, z);
    prism.rotation.set((z as number) * 0.3, 0, -(x as number) * 0.3);
    prism.castShadow = true;
    g.add(prism);

    const tip = new THREE.Mesh(
      new THREE.ConeGeometry(r * 0.7, r * 1.2, 6),
      mat(crystalColors[cIdx], { roughness: 0.2, metalness: 0.4 })
    );
    tip.position.set(x, (y as number) + (h as number) / 2 + (r as number) * 0.6, z);
    g.add(tip);
  });

  return g;
}

// 16. Cozy Campfire
export function buildCampfireObject(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  // River Stone Perimeter Ring
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2;
    const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35 + (i % 3) * 0.08, 0), mat('#78909C'));
    stone.position.set(Math.cos(angle) * 1.5, 0.22, Math.sin(angle) * 1.5);
    stone.castShadow = true;
    g.add(stone);
  }

  // Crossed Birch Firewood Logs
  for (let l = 0; l < 4; l++) {
    const angle = (l / 4) * Math.PI;
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 2.2, 6), mat('#5D4037'));
    log.position.set(0, 0.35 + l * 0.1, 0);
    log.rotation.set(0.2, angle, 0);
    log.castShadow = true;
    g.add(log);
  }

  // Tiered Flame Petals (Orange, Yellow, Red)
  const f1 = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.8, 5), mat('#FF5722', { emissive: '#FF5722', emissiveIntensity: 0.7 }));
  f1.position.set(0, 1.3, 0);
  g.add(f1);

  const f2 = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.3, 5), mat('#FFEB3B', { emissive: '#FFEB3B', emissiveIntensity: 0.9 }));
  f2.position.set(0, 1.5, 0);
  f2.rotation.y = 0.6;
  g.add(f2);

  return g;
}

// 17. Filament Lightbulb
export function buildLightbulbObject(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  // Teardrop Glass Bulb Envelope
  const bulbMat = mat('#FFF59D', { transparent: true, opacity: 0.65, roughness: 0.1 });
  const bulbSphere = new THREE.Mesh(new THREE.SphereGeometry(1.2, 16, 12), bulbMat);
  bulbSphere.position.set(0, 2.0, 0);
  g.add(bulbSphere);

  const bulbNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 1.15, 1.0, 16), bulbMat);
  bulbNeck.position.set(0, 1.2, 0);
  g.add(bulbNeck);

  // Glowing Zigzag Tungsten Filament
  const fil = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.05, 6, 12), mat('#FFB300', { emissive: '#FFB300', emissiveIntensity: 1.0 }));
  fil.position.set(0, 2.1, 0);
  g.add(fil);

  // Threaded Brass Edison Screw Base
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.8, 16), mat('#D4AF37', { metalness: 0.8 }));
  base.position.set(0, 0.45, 0);
  g.add(base);

  const contact = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.2, 0.2, 12), mat('#263238'));
  contact.position.set(0, 0.05, 0);
  g.add(contact);

  return g;
}

// 18. Brass Compass
export function buildCompassObject(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  // Brass Pocket Casing
  const caseGeo = new THREE.CylinderGeometry(1.6, 1.6, 0.35, 24);
  const compCase = new THREE.Mesh(caseGeo, mat('#D4AF37', { metalness: 0.85, roughness: 0.2 }));
  compCase.position.set(0, 0.35, 0);
  compCase.castShadow = true;
  g.add(compCase);

  // Enamel Rose Dial Face
  const dial = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.05, 24), mat('#FFF8E7'));
  dial.position.set(0, 0.52, 0);
  g.add(dial);

  // Balanced Magnetic Needle (North Red, South Blue)
  const nArrow = new THREE.Mesh(new THREE.ConeGeometry(0.2, 1.1, 4), mat('#D32F2F'));
  nArrow.position.set(0, 0.65, 0.55);
  nArrow.rotation.x = Math.PI / 2;
  g.add(nArrow);

  const sArrow = new THREE.Mesh(new THREE.ConeGeometry(0.2, 1.1, 4), mat('#1565C0'));
  sArrow.position.set(0, 0.65, -0.55);
  sArrow.rotation.x = -Math.PI / 2;
  g.add(sArrow);

  // Center Pivot Jewel
  const pivot = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), mat('#D4AF37', { metalness: 0.9 }));
  pivot.position.set(0, 0.7, 0);
  g.add(pivot);

  // Top Hinged Lanyard Ring
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.08, 8, 16), mat('#D4AF37', { metalness: 0.8 }));
  ring.position.set(0, 0.35, -1.9);
  ring.rotation.x = Math.PI / 2;
  g.add(ring);

  return g;
}

// 19. Retro Space Rocket
export function buildRocketObject(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  // Aerodynamic Fuselage
  const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.85, 2.4, 16), mat('#ECEFF1'));
  hull.position.set(0, 2.0, 0);
  hull.castShadow = true;
  g.add(hull);

  // Pointed Red Nosecone
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.2, 16), mat('#D32F2F'));
  nose.position.set(0, 3.8, 0);
  g.add(nose);

  // Cabin Porthole
  const port = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 12), mat('#80DEEA', { metalness: 0.4 }));
  port.position.set(0, 2.4, 0.72);
  port.rotation.x = Math.PI / 2;
  g.add(port);

  // Three Swept Delta Stabilizer Fins
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 0.8), mat('#D32F2F'));
    fin.position.set(Math.cos(angle) * 0.9, 1.2, Math.sin(angle) * 0.9);
    fin.rotation.y = -angle;
    fin.rotation.z = -0.3;
    g.add(fin);
  }

  // Propulsion Exhaust Plume
  const plume = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.2, 8), mat('#FF9800', { emissive: '#FF9800', emissiveIntensity: 0.8 }));
  plume.position.set(0, 0.4, 0);
  plume.rotation.x = Math.PI;
  g.add(plume);

  return g;
}

// 20. Antique Golden Key
export function buildGoldenKeyObject(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();

  const keyMat = mat('#FFD54F', { metalness: 0.85, roughness: 0.25 });

  // Fluted Cylindrical Barrel Shaft
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.8, 12), keyMat);
  shaft.position.set(0, 1.6, 0);
  shaft.castShadow = true;
  g.add(shaft);

  // Baroque Filigree Bow (Three concentric intersecting toruses)
  const mainBow = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.12, 8, 24), keyMat);
  mainBow.position.set(0, 3.4, 0);
  g.add(mainBow);

  [-0.35, 0.35].forEach((bx) => {
    const sideBow = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.08, 8, 16), keyMat);
    sideBow.position.set(bx, 3.4, 0);
    g.add(sideBow);
  });

  // Stepped Bit Teeth
  const bitBase = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.12), keyMat);
  bitBase.position.set(0.35, 0.6, 0);
  g.add(bitBase);

  // Teeth Cutouts (low-poly stepped bits)
  const t1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.14), keyMat);
  t1.position.set(0.55, 0.8, 0);
  g.add(t1);

  const t2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.14), keyMat);
  t2.position.set(0.5, 0.4, 0);
  g.add(t2);

  return g;
}

// ---------------------------------------------------------------------------
// 09. Trophy (Pure Standalone) — Sports, Achievements, Awards
// ---------------------------------------------------------------------------
export function buildTrophyObject(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();
  const goldMat = mat('#FFD700', { metalness: 0.8, roughness: 0.2 });
  const darkGoldMat = mat('#FFA000', { metalness: 0.75, roughness: 0.25 });

  // Flared Golden Trophy Cup Foot (Integrated pure chalice base, no marble block)
  const baseFoot = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.4, 0.35, 16), darkGoldMat);
  baseFoot.position.y = 0.18;
  baseFoot.castShadow = true;
  g.add(baseFoot);

  // Stepped Gold Collar Rings
  const baseRing = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.0, 0.25, 16), goldMat);
  baseRing.position.y = 0.45;
  g.add(baseRing);

  // Fluted Tapered Stem
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.6, 0.9, 12), goldMat);
  stem.position.y = 1.0;
  g.add(stem);

  // Stem Collar Ring
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.08, 8, 16), darkGoldMat);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 1.25;
  g.add(collar);

  // Chalice Cup Body
  const cupGeo = new THREE.CylinderGeometry(1.3, 0.5, 1.8, 16);
  const cup = new THREE.Mesh(cupGeo, goldMat);
  cup.position.y = 2.3;
  cup.castShadow = true;
  g.add(cup);

  // Inner Chalice Basin Rim
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.08, 8, 24), darkGoldMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 3.2;
  g.add(rim);

  // Sweeping Wing Handles (Dual opposite Torus arcs)
  [-1, 1].forEach((dir) => {
    const handleGeo = new THREE.TorusGeometry(0.85, 0.12, 8, 24, Math.PI * 0.95);
    const handle = new THREE.Mesh(handleGeo, goldMat);
    handle.position.set(dir * 1.5, 2.35, 0);
    handle.rotation.z = dir * -0.3;
    handle.rotation.y = dir > 0 ? 0 : Math.PI;
    g.add(handle);
  });

  // Star Emblem on Cup Face
  const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.3, 0), mat('#FFF8E1', { metalness: 0.5 }));
  star.position.set(0, 2.45, 1.2);
  g.add(star);

  return g;
}

// ---------------------------------------------------------------------------
// 10. Treasure Chest (REPLACE) — Collections, Favorites
// ---------------------------------------------------------------------------
export function buildTreasureChestObject(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();
  const woodMat = mat('#5D4037', { roughness: 0.75 });
  const ironMat = mat('#37474F', { metalness: 0.65, roughness: 0.35 });
  const goldMat = mat('#FFD54F', { metalness: 0.7, roughness: 0.25 });

  // Main Chest Box Base
  const chestBox = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.3, 1.8), woodMat);
  chestBox.position.y = 0.65;
  chestBox.castShadow = true;
  g.add(chestBox);

  // Arched Hinged Lid (Half Cylinder, propped slightly open by rotation)
  const lidGeo = new THREE.CylinderGeometry(0.9, 0.9, 2.6, 12, 1, false, 0, Math.PI);
  const lid = new THREE.Mesh(lidGeo, woodMat);
  lid.rotation.z = Math.PI / 2;
  lid.rotation.x = -0.38; // Propped open!
  lid.position.set(0, 1.45, -0.2);
  lid.castShadow = true;
  g.add(lid);

  // Iron Corner Straps & Reinforcing Bands
  [-1.1, 1.1].forEach((bx) => {
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.35, 1.84), ironMat);
    band.position.set(bx, 0.65, 0);
    g.add(band);
  });

  // Golden Brass Lock Hasp on Front
  const hasp = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.45, 0.1), mat('#D4AF37', { metalness: 0.7 }));
  hasp.position.set(0, 0.9, 0.95);
  g.add(hasp);

  // Golden Coins & Gem Treasures Spilling from Interior
  for (let i = 0; i < 9; i++) {
    const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.06, 10), goldMat);
    const ox = ((i % 3) - 1) * 0.5 + (Math.random() - 0.5) * 0.2;
    const oz = Math.floor(i / 3) * 0.35 - 0.2;
    coin.position.set(ox, 1.35 + (i % 2) * 0.1, oz + 0.3);
    coin.rotation.set(Math.random() * 0.3, Math.random() * 2, Math.random() * 0.3);
    g.add(coin);
  }

  // Sparkling Ruby Gem
  const ruby = new THREE.Mesh(new THREE.OctahedronGeometry(0.25, 0), mat('#E53935', { roughness: 0.2 }));
  ruby.position.set(0.6, 1.45, 0.4);
  g.add(ruby);

  return g;
}

// ---------------------------------------------------------------------------
// 11. House (REPLACE) — Home, Family, Daily Life
// ---------------------------------------------------------------------------
export function buildHouseObject(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();
  const wallMat = mat('#ECEFF1', { roughness: 0.6 });
  const roofMat = mat('#D87A56', { roughness: 0.5 });
  const doorMat = mat('#5D4037', { roughness: 0.7 });
  const windowMat = mat('#FFF9C4', { roughness: 0.2, metalness: 0.1 });
  const chimneyMat = mat('#78909C', { roughness: 0.7 });

  // Main House Box Body
  const houseBody = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.8, 2.0), wallMat);
  houseBody.position.y = 0.9;
  houseBody.castShadow = true;
  g.add(houseBody);

  // Gabled Triangular Roof (Prism)
  const roofGeo = new THREE.ConeGeometry(1.85, 1.2, 4);
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.rotation.y = Math.PI / 4;
  roof.position.y = 2.35;
  roof.castShadow = true;
  g.add(roof);

  // Stone Chimney Stack
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.2, 0.45), chimneyMat);
  chimney.position.set(0.7, 2.4, -0.4);
  chimney.castShadow = true;
  g.add(chimney);

  // Smoke Puff
  const smokePuff = new THREE.Mesh(new THREE.DodecahedronGeometry(0.25, 0), mat('#CFD8DC', { transparent: true, opacity: 0.8 }));
  smokePuff.position.set(0.7, 3.15, -0.4);
  g.add(smokePuff);

  // Front Timber Door
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.1, 0.08), doorMat);
  door.position.set(0, 0.55, 1.02);
  g.add(door);

  // Warm Windows (Left and Right)
  [-0.65, 0.65].forEach((wx) => {
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.06), windowMat);
    win.position.set(wx, 1.2, 1.02);
    g.add(win);
  });

  return g;
}

// ---------------------------------------------------------------------------
// 12. Shopping Bag (REPLACE) — Brands, Products, Shopping
// ---------------------------------------------------------------------------
export function buildShoppingBagObject(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();
  const bagMat = mat('#263238', { roughness: 0.5 });
  const goldMat = mat('#D4AF37', { metalness: 0.7, roughness: 0.25 });
  const tissueMat = mat('#FFF8E7', { roughness: 0.6 });
  const ropeMat = mat('#CFD8DC', { roughness: 0.5 });

  // Main Bag Body (Crisp Trapezoid Box)
  const bagBody = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.4, 1.1), bagMat);
  bagBody.position.y = 1.2;
  bagBody.castShadow = true;
  g.add(bagBody);

  // Side Accordion Fold Crease Insets
  [-1.01, 1.01].forEach((sx) => {
    const crease = new THREE.Mesh(new THREE.BoxGeometry(0.04, 2.1, 0.15), mat('#1E252B'));
    crease.position.set(sx, 1.2, 0);
    g.add(crease);
  });

  // Tissue Paper Puff Peeking from Top
  const tissue1 = new THREE.Mesh(new THREE.TetrahedronGeometry(0.45, 1), tissueMat);
  tissue1.position.set(-0.35, 2.55, 0.1);
  tissue1.rotation.set(0.3, 0.4, 0.2);
  g.add(tissue1);

  const tissue2 = new THREE.Mesh(new THREE.TetrahedronGeometry(0.4, 1), tissueMat);
  tissue2.position.set(0.35, 2.5, -0.1);
  tissue2.rotation.set(-0.2, 0.6, -0.3);
  g.add(tissue2);

  // Twisted Cord Loop Handles (Front & Back Torus Arcs)
  [-0.45, 0.45].forEach((bz) => {
    const handleGeo = new THREE.TorusGeometry(0.55, 0.05, 8, 24, Math.PI);
    const handle = new THREE.Mesh(handleGeo, ropeMat);
    handle.rotation.z = Math.PI;
    handle.position.set(0, 2.4, bz);
    g.add(handle);

    // Brass Grommets
    [-0.55, 0.55].forEach((gx) => {
      const grommet = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.03, 8, 12), goldMat);
      grommet.position.set(gx, 2.35, bz);
      g.add(grommet);
    });
  });

  // Golden Hang Tag on Ribbon
  const tag = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.5, 0.04), goldMat);
  tag.position.set(0.65, 2.05, 0.58);
  tag.rotation.z = -0.3;
  g.add(tag);

  return g;
}

// ---------------------------------------------------------------------------
// 13. Cooking Pot (REPLACE) — Food, Recipes, Cooking
// ---------------------------------------------------------------------------
export function buildCookingPotObject(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();
  const potMat = mat('#C62828', { roughness: 0.35, metalness: 0.15 });
  const darkRimMat = mat('#37474F', { metalness: 0.6, roughness: 0.3 });
  const brassKnobMat = mat('#D4AF37', { metalness: 0.8, roughness: 0.2 });
  const spoonMat = mat('#5D4037', { roughness: 0.8 });

  // Main Round Dutch Oven Pot Body
  const potBody = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.2, 1.5, 24), potMat);
  potBody.position.y = 0.75;
  potBody.castShadow = true;
  g.add(potBody);

  // Rim Collar
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.08, 8, 24), darkRimMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 1.5;
  g.add(rim);

  // Side Cast Loop Handles
  [-1, 1].forEach((dir) => {
    const handleGeo = new THREE.TorusGeometry(0.35, 0.08, 8, 16, Math.PI);
    const handle = new THREE.Mesh(handleGeo, potMat);
    handle.rotation.z = dir * (Math.PI / 2);
    handle.position.set(dir * 1.55, 1.2, 0);
    g.add(handle);
  });

  // Domed Lid (Propped Slightly Open)
  const lidGeo = new THREE.CylinderGeometry(1.4, 1.45, 0.2, 24);
  const lid = new THREE.Mesh(lidGeo, potMat);
  lid.position.set(-0.15, 1.65, 0);
  lid.rotation.z = 0.15; // Propped open!
  lid.castShadow = true;
  g.add(lid);

  // Brass Knob Finial
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), brassKnobMat);
  knob.position.set(-0.15, 1.85, 0);
  g.add(knob);

  // Beechwood Cooking Spoon
  const spoonHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.8, 8), spoonMat);
  spoonHandle.rotation.set(0.4, 0, 0.8);
  spoonHandle.position.set(0.6, 1.6, 0.4);
  g.add(spoonHandle);

  // Rising Steam Wisps
  const steam = new THREE.Mesh(
    new THREE.TorusGeometry(0.35, 0.05, 6, 16, Math.PI),
    mat('#ECEFF1', { transparent: true, opacity: 0.65 })
  );
  steam.rotation.y = 0.6;
  steam.position.set(0.2, 2.3, -0.2);
  g.add(steam);

  return g;
}

// ---------------------------------------------------------------------------
// 14. Tree (REPLACE) — Nature, Plants, Growth
// ---------------------------------------------------------------------------
export function buildTreeObject(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();
  const trunkMat = mat('#5D4037', { roughness: 0.85 });
  const foliageMat1 = mat('#2E7D32', { roughness: 0.65 });
  const foliageMat2 = mat('#4CAF50', { roughness: 0.6 });
  const foliageMat3 = mat('#1B5E20', { roughness: 0.7 });

  // Faceted Organic Trunk
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.55, 1.8, 8), trunkMat);
  trunk.position.y = 0.9;
  trunk.castShadow = true;
  g.add(trunk);

  // Root Flaring Base
  [-0.35, 0.35].forEach((rx) => {
    const root = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.6, 6), trunkMat);
    root.position.set(rx, 0.3, 0.2);
    g.add(root);
  });

  // Branching Limbs
  [-0.3, 0.3].forEach((bx) => {
    const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 0.9, 6), trunkMat);
    branch.rotation.z = bx * 1.2;
    branch.position.set(bx * 0.8, 1.8, 0);
    g.add(branch);
  });

  // Layered Polygonal Foliage Canopy Volumes
  const mainCanopy = new THREE.Mesh(new THREE.DodecahedronGeometry(1.3, 1), foliageMat1);
  mainCanopy.position.set(0, 2.7, 0);
  mainCanopy.castShadow = true;
  g.add(mainCanopy);

  const topCanopy = new THREE.Mesh(new THREE.DodecahedronGeometry(0.9, 1), foliageMat2);
  topCanopy.position.set(0, 3.5, 0);
  topCanopy.castShadow = true;
  g.add(topCanopy);

  const sideCanopyL = new THREE.Mesh(new THREE.DodecahedronGeometry(0.75, 1), foliageMat3);
  sideCanopyL.position.set(-0.9, 2.3, 0.2);
  g.add(sideCanopyL);

  const sideCanopyR = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8, 1), foliageMat2);
  sideCanopyR.position.set(0.85, 2.4, -0.2);
  g.add(sideCanopyR);

  return g;
}

// ---------------------------------------------------------------------------
// 17. Camera (REPLACE) — Photography, Memories, Places
// ---------------------------------------------------------------------------
export function buildCameraObject(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();
  const chromeMat = mat('#CFD8DC', { metalness: 0.8, roughness: 0.2 });
  const leatherMat = mat('#212121', { roughness: 0.8 });
  const steelMat = mat('#37474F', { metalness: 0.7, roughness: 0.3 });
  const glassMat = mat('#80DEEA', { roughness: 0.1, metalness: 0.2 });
  const redDotMat = mat('#C62828', { roughness: 0.3 });

  // Camera Body Base Wrap
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.3, 0.9), leatherMat);
  body.position.y = 0.65;
  body.castShadow = true;
  g.add(body);

  // Brushed Chrome Top Deck Plate
  const topPlate = new THREE.Mesh(new THREE.BoxGeometry(2.52, 0.45, 0.92), chromeMat);
  topPlate.position.y = 1.45;
  topPlate.castShadow = true;
  g.add(topPlate);

  // Bottom Base Plate
  const botPlate = new THREE.Mesh(new THREE.BoxGeometry(2.52, 0.1, 0.92), chromeMat);
  botPlate.position.y = 0.05;
  g.add(botPlate);

  // Stepped Cylindrical Lens Barrel
  const lensBarrel1 = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.8, 0.6, 24), steelMat);
  lensBarrel1.rotation.x = Math.PI / 2;
  lensBarrel1.position.set(0.2, 0.75, 0.7);
  lensBarrel1.castShadow = true;
  g.add(lensBarrel1);

  const lensBarrel2 = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.7, 0.35, 24), chromeMat);
  lensBarrel2.rotation.x = Math.PI / 2;
  lensBarrel2.position.set(0.2, 0.75, 1.1);
  g.add(lensBarrel2);

  // Coated Glass Lens Element
  const lensGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.08, 20), glassMat);
  lensGlass.rotation.x = Math.PI / 2;
  lensGlass.position.set(0.2, 0.75, 1.25);
  g.add(lensGlass);

  // Viewfinder Window
  const viewfinder = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.22, 0.1), glassMat);
  viewfinder.position.set(-0.75, 1.45, 0.48);
  g.add(viewfinder);

  // Shutter Speed Dial
  const shutterDial = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.2, 16), chromeMat);
  shutterDial.position.set(-0.25, 1.75, 0);
  g.add(shutterDial);

  // Shutter Release Button
  const shutterBtn = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.25, 12), chromeMat);
  shutterBtn.position.set(0.7, 1.75, 0);
  g.add(shutterBtn);

  // Red Dot Emblem
  const redDot = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.05, 12), redDotMat);
  redDot.rotation.x = Math.PI / 2;
  redDot.position.set(-0.75, 1.05, 0.47);
  g.add(redDot);

  return g;
}

// ---------------------------------------------------------------------------
// 18. Heart (REPLACE) — Relationships, Family, Values
// ---------------------------------------------------------------------------
export function buildHeartObject(variant: IslandVariant): THREE.Group {
  const g = new THREE.Group();
  const rubyMat = mat('#E53935', { roughness: 0.3, metalness: 0.2 });
  const darkRubyMat = mat('#B71C1C', { roughness: 0.4, metalness: 0.15 });
  const highlightMat = mat('#FFCDD2', { roughness: 0.2, metalness: 0.1 });

  // Faceted Volumetric Low-Poly Heart Gem
  // Left Upper Lobe
  const leftLobe = new THREE.Mesh(new THREE.DodecahedronGeometry(0.85, 0), rubyMat);
  leftLobe.position.set(-0.65, 2.0, 0);
  leftLobe.castShadow = true;
  g.add(leftLobe);

  // Right Upper Lobe
  const rightLobe = new THREE.Mesh(new THREE.DodecahedronGeometry(0.85, 0), rubyMat);
  rightLobe.position.set(0.65, 2.0, 0);
  rightLobe.castShadow = true;
  g.add(rightLobe);

  // Center Tapered Body Apex
  const heartBody = new THREE.Mesh(new THREE.ConeGeometry(1.4, 2.0, 6), darkRubyMat);
  heartBody.rotation.x = Math.PI;
  heartBody.position.set(0, 1.15, 0);
  heartBody.castShadow = true;
  g.add(heartBody);

  // Sparkling Facet Glint Crystal
  const glint = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), highlightMat);
  glint.position.set(0.4, 2.4, 0.65);
  g.add(glint);

  return g;
}

// ---------------------------------------------------------------------------
// Master Dispatcher for Level 3 Standalone Objects
// ---------------------------------------------------------------------------
export function buildObjectScene(
  island: IslandMetadata,
  variant: IslandVariant = 'classic'
): THREE.Group {
  const masterGroup = new THREE.Group();
  masterGroup.name = `object_${island.slug}`;

  // Pure Standalone 3D Object (100% free of any base, plinth, or turntable platform)
  let content: THREE.Group;
  switch (island.slug) {
    case 'object-open-book':
      content = buildOpenBookObject(variant);
      break;
    case 'object-globe':
      content = buildGlobeObject(variant);
      break;
    case 'object-microscope':
      content = buildMicroscopeObject(variant);
      break;
    case 'object-hourglass':
      content = buildHourglassObject(variant);
      break;
    case 'object-film-reel':
      content = buildFilmReelObject(variant);
      break;
    case 'object-vinyl-record':
      content = buildVinylRecordObject(variant);
      break;
    case 'object-artist-palette':
      content = buildArtistPaletteObject(variant);
      break;
    case 'object-game-controller':
      content = buildGameControllerObject(variant);
      break;
    case 'object-trophy':
      content = buildTrophyObject(variant);
      break;
    case 'object-treasure-chest':
      content = buildTreasureChestObject(variant);
      break;
    case 'object-house':
      content = buildHouseObject(variant);
      break;
    case 'object-shopping-bag':
      content = buildShoppingBagObject(variant);
      break;
    case 'object-cooking-pot':
      content = buildCookingPotObject(variant);
      break;
    case 'object-tree':
      content = buildTreeObject(variant);
      break;
    case 'object-seashell':
      content = buildSeashellObject(variant);
      break;
    case 'object-compass':
      content = buildCompassObject(variant);
      break;
    case 'object-camera':
      content = buildCameraObject(variant);
      break;
    case 'object-heart':
      content = buildHeartObject(variant);
      break;
    case 'object-lightbulb':
      content = buildLightbulbObject(variant);
      break;
    case 'object-crystal':
    case 'object-crystal-cluster':
      content = buildCrystalClusterObject(variant);
      break;
    // Legacy fallbacks
    case 'object-coffee-cup':
      content = buildCoffeeCupObject(variant);
      break;
    case 'object-backpack':
      content = buildBackpackObject(variant);
      break;
    case 'object-plant-pot':
      content = buildPlantPotObject(variant);
      break;
    case 'object-mechanical-watch':
      content = buildMechanicalWatchObject(variant);
      break;
    case 'object-bonsai-tree':
      content = buildBonsaiTreeObject(variant);
      break;
    case 'object-campfire':
      content = buildCampfireObject(variant);
      break;
    case 'object-rocket':
      content = buildRocketObject(variant);
      break;
    case 'object-golden-key':
      content = buildGoldenKeyObject(variant);
      break;
    default:
      content = buildOpenBookObject(variant);
      break;
  }

  masterGroup.add(content);
  return masterGroup;
}
