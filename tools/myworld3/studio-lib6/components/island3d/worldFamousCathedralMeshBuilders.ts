import * as THREE from 'three';
import { IslandMetadata, IslandVariant } from '../../types/island';
import { FAMOUS_CATHEDRAL_SEEDS } from '../../data/worldFamousCathedralsData';

function mat(color: number, roughness = 0.72, metalness = 0.08, opacity = 1): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    transparent: opacity < 1,
    opacity,
  });
}

function emissiveMat(color: number, intensity = 0.9, opacity = 0.9): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: intensity,
    roughness: 0.25,
    metalness: 0.05,
    transparent: opacity < 1,
    opacity,
  });
}

function addCrossFinial(
  parent: THREE.Group,
  x: number,
  y: number,
  z: number,
  height = 0.34,
  color = 0xd4af37,
  isOrthodox = false
) {
  const goldMat = mat(color, 0.25, 0.85);
  const vPost = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.016, height, 8), goldMat);
  vPost.position.set(x, y + height / 2, z);
  parent.add(vPost);

  const hBar = new THREE.Mesh(new THREE.BoxGeometry(height * 0.56, 0.024, 0.024), goldMat);
  hBar.position.set(x, y + height * 0.72, z);
  parent.add(hBar);

  if (isOrthodox) {
    const topBar = new THREE.Mesh(new THREE.BoxGeometry(height * 0.3, 0.018, 0.018), goldMat);
    topBar.position.set(x, y + height * 0.88, z);
    parent.add(topBar);

    const slantBar = new THREE.Mesh(new THREE.BoxGeometry(height * 0.34, 0.018, 0.018), goldMat);
    slantBar.position.set(x, y + height * 0.36, z);
    slantBar.rotation.z = 0.35;
    parent.add(slantBar);
  }
}

function addRoseWindow(
  parent: THREE.Group,
  x: number,
  y: number,
  z: number,
  radius: number,
  stoneColor: number,
  glassColor = 0x38bdf8,
  faceAxis: 'z' | 'x' = 'z'
) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  if (faceAxis === 'x') g.rotation.y = Math.PI / 2;

  const rim = new THREE.Mesh(new THREE.TorusGeometry(radius, radius * 0.12, 8, 24), mat(stoneColor, 0.78));
  g.add(rim);

  const glass = new THREE.Mesh(new THREE.CircleGeometry(radius * 0.9, 24), emissiveMat(glassColor, 0.85, 0.92));
  glass.position.z = -0.01;
  g.add(glass);

  const innerRing = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.48, radius * 0.06, 6, 16), mat(stoneColor, 0.75));
  innerRing.position.z = 0.01;
  g.add(innerRing);

  for (let i = 0; i < 8; i++) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(radius * 1.8, radius * 0.06, radius * 0.08), mat(stoneColor, 0.78));
    spoke.rotation.z = (i * Math.PI) / 8;
    spoke.position.z = 0.01;
    g.add(spoke);
  }
  parent.add(g);
}

/**
 * True pitched gable hall with optional clerestory lancet windows, flying buttresses, and roof cresting
 */
function addCathedralGableHall(
  parent: THREE.Group,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
  wallColor: number,
  roofColor: number,
  trimColor: number,
  opts: {
    roofH?: number;
    gableAlongX?: boolean;
    lancetBays?: number;
    flyingButtresses?: boolean;
    glassColor?: number;
  } = {}
) {
  const g = new THREE.Group();
  g.position.set(x, y, z);

  const wallMat = mat(wallColor, 0.78, 0.06);
  const roofMat = mat(roofColor, 0.62, 0.16);
  const trimMat = mat(trimColor, 0.68, 0.12);
  const winMat = emissiveMat(opts.glassColor ?? 0x60a5fa, 0.65, 0.88);

  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
  body.position.y = h / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);

  const plinth = new THREE.Mesh(new THREE.BoxGeometry(w + 0.08, 0.14, d + 0.08), trimMat);
  plinth.position.y = 0.07;
  g.add(plinth);

  const cornice = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, 0.09, d + 0.1), trimMat);
  cornice.position.y = h;
  g.add(cornice);

  const rH = opts.roofH ?? Math.min(w, d) * 0.48;
  const span = opts.gableAlongX ? d : w;
  const length = opts.gableAlongX ? w : d;

  const shape = new THREE.Shape();
  shape.moveTo(-span / 2 - 0.08, 0);
  shape.lineTo(0, rH);
  shape.lineTo(span / 2 + 0.08, 0);
  shape.closePath();

  const roofGeo = new THREE.ExtrudeGeometry(shape, {
    depth: length + 0.12,
    bevelEnabled: false,
  });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  if (opts.gableAlongX) {
    roof.rotation.y = Math.PI / 2;
    roof.position.set(-length / 2 - 0.06, h, 0);
  } else {
    roof.position.set(0, h, -length / 2 - 0.06);
  }
  roof.castShadow = true;
  g.add(roof);

  // Golden or lead roof ridge
  const ridge = new THREE.Mesh(
    new THREE.BoxGeometry(opts.gableAlongX ? length + 0.14 : 0.06, 0.06, opts.gableAlongX ? 0.06 : length + 0.14),
    mat(0xd4af37, 0.35, 0.7)
  );
  ridge.position.set(0, h + rH + 0.02, 0);
  g.add(ridge);

  // Side lancet windows & optional flying buttresses
  const bays = opts.lancetBays ?? 5;
  if (!opts.gableAlongX) {
    for (let i = 0; i < bays; i++) {
      const bz = -d * 0.38 + (i / Math.max(1, bays - 1)) * (d * 0.76);
      [-1, 1].forEach((side) => {
        const win = new THREE.Mesh(new THREE.BoxGeometry(0.05, h * 0.56, 0.16), winMat);
        win.position.set(side * (w / 2 + 0.01), h * 0.52, bz);
        g.add(win);

        if (opts.flyingButtresses) {
          const pierX = side * (w / 2 + 0.38);
          const pier = new THREE.Mesh(new THREE.BoxGeometry(0.14, h * 0.85, 0.16), trimMat);
          pier.position.set(pierX, h * 0.425, bz);
          pier.castShadow = true;
          g.add(pier);

          const pinnacle = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.34, 4), trimMat);
          pinnacle.position.set(pierX, h * 0.85 + 0.17, bz);
          pinnacle.rotation.y = Math.PI / 4;
          g.add(pinnacle);

          // Upper & lower flying flyers
          [0.52, 0.78].forEach((ratio) => {
            const flyer = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.07, 0.1), trimMat);
            flyer.position.set(side * (w / 2 + 0.19), h * ratio, bz);
            flyer.rotation.z = side * 0.36;
            g.add(flyer);
          });
        }
      });
    }
  } else {
    for (let i = 0; i < bays; i++) {
      const bx = -w * 0.38 + (i / Math.max(1, bays - 1)) * (w * 0.76);
      [-1, 1].forEach((side) => {
        const win = new THREE.Mesh(new THREE.BoxGeometry(0.16, h * 0.56, 0.05), winMat);
        win.position.set(bx, h * 0.52, side * (d / 2 + 0.01));
        g.add(win);
      });
    }
  }

  parent.add(g);
  return g;
}

/**
 * Ribbed cathedral dome with colonnaded drum, ribs, lantern, and golden cross
 */
function addRibbedCathedralDome(
  parent: THREE.Group,
  x: number,
  y: number,
  z: number,
  radius: number,
  drumH: number,
  domeH: number,
  drumColor: number,
  domeColor: number,
  ribColor: number,
  segments = 16
) {
  const g = new THREE.Group();
  g.position.set(x, y, z);

  const drumMat = mat(drumColor, 0.74, 0.08);
  const domeMat = mat(domeColor, 0.56, 0.2);
  const ribMat = mat(ribColor, 0.65, 0.15);
  const winMat = emissiveMat(0xfde68a, 0.7, 0.88);

  if (drumH > 0) {
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 1.03, drumH, segments), drumMat);
    drum.position.y = drumH / 2;
    drum.castShadow = true;
    g.add(drum);

    const drumCornice = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.07, radius * 1.07, 0.1, segments), ribMat);
    drumCornice.position.y = drumH;
    g.add(drumCornice);

    const colCount = Math.min(16, segments);
    for (let i = 0; i < colCount; i++) {
      const ang = (i * Math.PI * 2) / colCount;
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, drumH * 0.85, 8), ribMat);
      col.position.set(Math.cos(ang) * (radius * 1.03), drumH * 0.46, Math.sin(ang) * (radius * 1.03));
      g.add(col);

      const winAng = ang + Math.PI / colCount;
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.12, drumH * 0.45, 0.12), winMat);
      win.position.set(Math.cos(winAng) * (radius * 0.99), drumH * 0.5, Math.sin(winAng) * (radius * 0.99));
      win.rotation.y = -winAng;
      g.add(win);
    }
  }

  // Cupola
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(radius, segments, 14, 0, Math.PI * 2, 0, Math.PI * 0.52),
    domeMat
  );
  dome.scale.y = domeH / radius;
  dome.position.y = drumH;
  dome.castShadow = true;
  g.add(dome);

  // Exterior ribs along meridian lines
  const ribCount = segments === 8 ? 8 : 12;
  for (let i = 0; i < ribCount; i++) {
    const ang = (i * Math.PI * 2) / ribCount;
    const ribGroup = new THREE.Group();
    ribGroup.position.y = drumH;
    ribGroup.rotation.y = ang;
    const ribArc = new THREE.Mesh(
      new THREE.TorusGeometry(radius * 1.005, 0.032, 6, 16, Math.PI * 0.48),
      ribMat
    );
    ribArc.scale.y = domeH / radius;
    ribGroup.add(ribArc);
    g.add(ribGroup);
  }

  // Lantern
  const lanternY = drumH + domeH * 0.96;
  const lanternR = radius * 0.24;
  const lanternH = domeH * 0.36;
  const lantern = new THREE.Mesh(new THREE.CylinderGeometry(lanternR, lanternR * 1.08, lanternH, 8), ribMat);
  lantern.position.y = lanternY + lanternH / 2;
  g.add(lantern);

  const lanternCupola = new THREE.Mesh(new THREE.ConeGeometry(lanternR * 1.15, lanternH * 0.65, 8), mat(0xd4af37, 0.3, 0.8));
  lanternCupola.position.y = lanternY + lanternH + lanternH * 0.32;
  g.add(lanternCupola);

  addCrossFinial(g, 0, lanternY + lanternH + lanternH * 0.62, 0, 0.36);

  parent.add(g);
  return g;
}

/**
 * Onion Dome for Russian Orthodox St. Basil's Cathedral with vertical/spiral vivid stripes
 */
function addOnionDomeTower(
  parent: THREE.Group,
  x: number,
  y: number,
  z: number,
  drumR: number,
  drumH: number,
  domeR: number,
  primaryColor: number,
  secondaryColor: number,
  drumColor = 0xc2410c
) {
  const g = new THREE.Group();
  g.position.set(x, y, z);

  // Octagonal drum with white kokoshnik arches at base
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(drumR, drumR * 1.06, drumH, 8), mat(drumColor, 0.72));
  drum.position.y = drumH / 2;
  drum.castShadow = true;
  g.add(drum);

  for (let i = 0; i < 8; i++) {
    const ang = (i * Math.PI) / 4;
    const kokoshnik = new THREE.Mesh(new THREE.ConeGeometry(drumR * 0.38, 0.24, 4), mat(0xf8fafc, 0.65));
    kokoshnik.position.set(Math.cos(ang) * (drumR * 1.02), 0.18, Math.sin(ang) * (drumR * 1.02));
    kokoshnik.rotation.y = ang + Math.PI / 4;
    g.add(kokoshnik);
  }

  // White cornice neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(drumR * 1.06, drumR * 1.06, 0.1, 12), mat(0xf8fafc, 0.6));
  neck.position.y = drumH;
  g.add(neck);

  // Onion bulb using LatheGeometry profile + contrasting ribs
  const pts = [
    new THREE.Vector2(0.01, 0),
    new THREE.Vector2(domeR * 0.72, domeR * 0.18),
    new THREE.Vector2(domeR * 1.05, domeR * 0.55),
    new THREE.Vector2(domeR * 0.88, domeR * 0.95),
    new THREE.Vector2(domeR * 0.42, domeR * 1.32),
    new THREE.Vector2(domeR * 0.14, domeR * 1.65),
    new THREE.Vector2(0.01, domeR * 1.95),
  ];
  const onionGeo = new THREE.LatheGeometry(pts, 16);
  const onion = new THREE.Mesh(onionGeo, mat(primaryColor, 0.45, 0.18));
  onion.position.y = drumH + 0.04;
  onion.castShadow = true;
  g.add(onion);

  // Secondary color faceted ribs around the bulb
  for (let i = 0; i < 8; i++) {
    const ang = (i * Math.PI) / 4;
    const rib = new THREE.Mesh(new THREE.SphereGeometry(domeR * 0.96, 8, 10), mat(secondaryColor, 0.42, 0.22));
    rib.scale.set(0.24, 1.08, 0.98);
    rib.position.y = drumH + domeR * 0.66;
    rib.rotation.y = ang;
    g.add(rib);
  }

  addCrossFinial(g, 0, drumH + domeR * 1.95, 0, 0.34, 0xfacc15, true);
  parent.add(g);
  return g;
}

// ============================================================================
// 1. ST. PETER'S BASILICA, VATICAN CITY (BD-151)
// ============================================================================
function buildStPetersBasilica(scene: THREE.Group) {
  const travertine = 0xf3ead8;
  const warmStone = 0xe6dac3;
  const leadDome = 0x64748b;

  // Elliptical Piazza San Pietro cobblestone pavement with radial white marble lines
  const piazza = new THREE.Mesh(new THREE.CylinderGeometry(7.2, 7.4, 0.28, 48), mat(0x9ca3af, 0.85));
  piazza.position.set(0, -0.14, 0.6);
  piazza.receiveShadow = true;
  scene.add(piazza);

  for (let i = 0; i < 16; i++) {
    const ray = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, 7.6), mat(0xf8fafc, 0.7));
    ray.position.set(0, 0.01, 1.8);
    ray.rotation.y = (i * Math.PI) / 16;
    scene.add(ray);
  }

  // Bernini's twin semi-circular quadruple Doric colonnades embracing the elliptical piazza
  [-1, 1].forEach((side) => {
    const armSegments = 14;
    for (let i = 0; i < armSegments; i++) {
      const t = i / (armSegments - 1);
      const ang = -0.95 + t * 1.9;
      const rx = 4.65;
      const rz = 2.95;
      const cx = side * (1.2 + Math.cos(ang) * rx);
      const cz = 2.25 + Math.sin(ang) * rz;

      // Inner & outer paired travertine columns
      [-0.22, 0.22].forEach((dr) => {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 1.15, 10), mat(travertine, 0.7));
        col.position.set(cx + side * Math.cos(ang) * dr, 0.58, cz + Math.sin(ang) * dr);
        col.castShadow = true;
        scene.add(col);
      });

      // Entablature segment + saint statue on balustrade
      const ent = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.22, 0.68), mat(warmStone, 0.72));
      ent.position.set(cx, 1.24, cz);
      ent.rotation.y = -side * ang;
      scene.add(ent);

      if (i % 2 === 0) {
        const saint = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.24, 6), mat(0xffffff, 0.6));
        saint.position.set(cx, 1.46, cz);
        scene.add(saint);
      }
    }
  });

  // Central Vatican Egyptian Obelisk + Twin Piazza Fountains
  const obeliskBase = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.42, 0.48), mat(travertine, 0.7));
  obeliskBase.position.set(0, 0.21, 2.35);
  scene.add(obeliskBase);

  const obeliskShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.16, 2.15, 4), mat(0xb45309, 0.65));
  obeliskShaft.position.set(0, 1.48, 2.35);
  obeliskShaft.rotation.y = Math.PI / 4;
  obeliskShaft.castShadow = true;
  scene.add(obeliskShaft);
  addCrossFinial(scene, 0, 2.56, 2.35, 0.28);

  [-1.95, 1.95].forEach((fx) => {
    const basin = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.42, 0.18, 16), mat(travertine, 0.65));
    basin.position.set(fx, 0.09, 2.35);
    scene.add(basin);
    const water = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.05, 16), emissiveMat(0x38bdf8, 0.4, 0.85));
    water.position.set(fx, 0.17, 2.35);
    scene.add(water);
    const plume = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.55, 12), emissiveMat(0xe0f2fe, 0.5, 0.75));
    plume.position.set(fx, 0.45, 2.35);
    scene.add(plume);
  });

  // Grand ceremonial steps (Sagrato) leading to Maderno's facade
  for (let s = 0; s < 3; s++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(5.6 - s * 0.25, 0.1, 1.2 - s * 0.22), mat(travertine, 0.75));
    step.position.set(0, 0.05 + s * 0.08, -0.35 - s * 0.12);
    scene.add(step);
  }

  // Carlo Maderno's monumental Corinthian Facade (width 5.2, height 2.35)
  const facade = new THREE.Mesh(new THREE.BoxGeometry(5.2, 2.35, 0.95), mat(travertine, 0.72));
  facade.position.set(0, 1.38, -1.25);
  facade.castShadow = true;
  scene.add(facade);

  // 8 giant Corinthian columns across the front + central triangular pediment + Benediction Loggia
  for (let i = 0; i < 8; i++) {
    const cx = -2.24 + i * 0.64;
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 1.85, 12), mat(0xffffff, 0.65));
    col.position.set(cx, 1.15, -0.74);
    col.castShadow = true;
    scene.add(col);
  }

  const pediment = new THREE.Mesh(new THREE.ConeGeometry(1.35, 0.52, 4), mat(travertine, 0.7));
  pediment.scale.set(1.4, 1, 0.35);
  pediment.rotation.y = Math.PI / 4;
  pediment.position.set(0, 2.32, -0.72);
  scene.add(pediment);

  // 13 Rooftop Statues of Christ, John the Baptist, and the Apostles + twin facade clocks
  for (let i = -6; i <= 6; i++) {
    const statue = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.34, 6), mat(0xffffff, 0.6));
    statue.position.set(i * 0.38, 2.72, -0.82);
    scene.add(statue);
  }
  [-2.15, 2.15].forEach((cx) => {
    const clockArch = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.28, 16), mat(travertine, 0.7));
    clockArch.rotation.x = Math.PI / 2;
    clockArch.position.set(cx, 2.68, -0.95);
    scene.add(clockArch);
    const dial = new THREE.Mesh(new THREE.CircleGeometry(0.22, 16), emissiveMat(0xfef3c7, 0.6));
    dial.position.set(cx, 2.68, -0.8);
    scene.add(dial);
  });

  // Nave, Transept & Apse behind facade
  addCathedralGableHall(scene, 0, 0.2, -3.1, 3.8, 2.15, 3.6, warmStone, 0x94a3b8, travertine, {
    roofH: 0.55,
    lancetBays: 5,
  });
  addCathedralGableHall(scene, 0, 0.2, -3.45, 5.4, 2.05, 1.85, warmStone, 0x94a3b8, travertine, {
    roofH: 0.48,
    gableAlongX: true,
    lancetBays: 5,
  });

  // Two smaller flanking cupola domes (Vignola domes)
  [-1.45, 1.45].forEach((dx) => {
    addRibbedCathedralDome(scene, dx, 2.35, -2.55, 0.55, 0.52, 0.68, travertine, leadDome, travertine, 12);
  });

  // Michelangelo's Colossal Central Ribbed Dome over the Papal Altar
  addRibbedCathedralDome(scene, 0, 2.35, -3.45, 1.48, 1.18, 1.85, travertine, leadDome, travertine, 16);
}

// ============================================================================
// 2. NOTRE-DAME DE PARIS, FRANCE (BD-152)
// ============================================================================
function buildNotreDameDeParis(scene: THREE.Group) {
  const limestone = 0xe7dfd3;
  const paleStone = 0xf5f0e6;
  const leadRoof = 0x475569;

  // Île de la Cité river embankment + Seine water border + Parvis square
  const seineWater = new THREE.Mesh(new THREE.CylinderGeometry(7.3, 7.5, 0.24, 40), mat(0x0369a1, 0.25, 0.15));
  seineWater.position.set(0, -0.16, 0);
  scene.add(seineWater);

  const quayIsland = new THREE.Mesh(new THREE.BoxGeometry(10.6, 0.36, 12.2), mat(0xd6d3d1, 0.82));
  quayIsland.position.set(0, -0.06, 0);
  quayIsland.receiveShadow = true;
  scene.add(quayIsland);

  // Cruciform Nave + Choir + Semi-Circular Apse
  addCathedralGableHall(scene, 0, 0.12, -0.2, 2.45, 2.35, 6.8, limestone, leadRoof, paleStone, {
    roofH: 1.05,
    lancetBays: 7,
    flyingButtresses: true,
    glassColor: 0x3b82f6,
  });

  // Transept with North & South Rose Windows
  addCathedralGableHall(scene, 0, 0.12, -0.45, 4.85, 2.35, 1.75, limestone, leadRoof, paleStone, {
    roofH: 1.02,
    gableAlongX: true,
    lancetBays: 5,
    glassColor: 0xa855f7,
  });
  addRoseWindow(scene, -2.44, 1.58, -0.45, 0.56, paleStone, 0xc084fc, 'x');
  addRoseWindow(scene, 2.44, 1.58, -0.45, 0.56, paleStone, 0x38bdf8, 'x');

  // Semi-circular East Apse with radiating chapels and long Choir Flying Buttresses
  const apse = new THREE.Mesh(new THREE.CylinderGeometry(1.22, 1.28, 2.35, 16), mat(limestone, 0.78));
  apse.position.set(0, 1.3, -3.65);
  scene.add(apse);
  const apseRoof = new THREE.Mesh(new THREE.ConeGeometry(1.28, 1.05, 16), mat(leadRoof, 0.6));
  apseRoof.position.set(0, 3.0, -3.65);
  scene.add(apseRoof);

  for (let i = 0; i < 7; i++) {
    const ang = Math.PI + (i / 6) * Math.PI;
    const bx = Math.cos(ang) * 1.95;
    const bz = -3.65 + Math.sin(ang) * 1.95;
    const pier = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.1, 0.18), mat(paleStone, 0.72));
    pier.position.set(bx, 1.17, bz);
    scene.add(pier);
    const pinnacle = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.38, 4), mat(paleStone, 0.7));
    pinnacle.position.set(bx, 2.41, bz);
    scene.add(pinnacle);
  }

  // Iconic Tripartite West Facade & Twin 69m Flat-Topped Bell Towers
  [-1.08, 1.08].forEach((tx) => {
    const tower = new THREE.Mesh(new THREE.BoxGeometry(1.22, 4.35, 1.32), mat(limestone, 0.74));
    tower.position.set(tx, 2.3, 3.25);
    tower.castShadow = true;
    scene.add(tower);

    // Tall louvered belfry lancets on upper stage
    [-0.24, 0.24].forEach((lx) => {
      const louver = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.15, 0.08), mat(0x334155, 0.8));
      louver.position.set(tx + lx, 3.45, 3.92);
      scene.add(louver);
    });

    // Balustrade & corner gargoyle turret
    const balustrade = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.18, 1.4), mat(paleStone, 0.68));
    balustrade.position.set(tx, 4.52, 3.25);
    scene.add(balustrade);
  });

  // Central West Facade screen between towers: 3 sculpted gothic portals, Gallery of Kings, West Rose Window, Openwork Arcade
  const westCenter = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3.15, 1.15), mat(limestone, 0.74));
  westCenter.position.set(0, 1.7, 3.22);
  scene.add(westCenter);

  // Three deep Gothic pointed portals (Virgin, Last Judgment, St. Anne)
  [-1.08, 0, 1.08].forEach((px, idx) => {
    const portalW = idx === 1 ? 0.68 : 0.56;
    const portalH = idx === 1 ? 0.92 : 0.82;
    const arch = new THREE.Mesh(new THREE.BoxGeometry(portalW, portalH, 0.24), mat(paleStone, 0.65));
    arch.position.set(px, 0.12 + portalH / 2, 3.88);
    scene.add(arch);
    const door = new THREE.Mesh(new THREE.BoxGeometry(portalW * 0.68, portalH * 0.78, 0.28), mat(0x451a03, 0.85));
    door.position.set(px, 0.12 + portalH * 0.39, 3.88);
    scene.add(door);
  });

  // Galerie des Rois (28 Old Testament Kings frieze above the portals)
  const kingsLedge = new THREE.Mesh(new THREE.BoxGeometry(3.42, 0.32, 0.18), mat(paleStone, 0.68));
  kingsLedge.position.set(0, 1.28, 3.88);
  scene.add(kingsLedge);
  for (let k = -8; k <= 8; k++) {
    const king = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.036, 0.24, 6), mat(0xfef3c7, 0.6));
    king.position.set(k * 0.19, 1.28, 3.96);
    scene.add(king);
  }

  // West Rose Window + Grande Galerie tracery screen connecting the towers
  addRoseWindow(scene, 0, 2.12, 3.86, 0.54, paleStone, 0x38bdf8, 'z');
  const traceryGallery = new THREE.Mesh(new THREE.BoxGeometry(3.38, 0.52, 0.16), mat(paleStone, 0.65));
  traceryGallery.position.set(0, 3.02, 3.84);
  scene.add(traceryGallery);

  // Viollet-le-Duc's Iconic 96m Lead & Oak Crossing Spire (Flèche) with 12 Apostles at its base
  const flecheBase = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.38, 0.75, 8), mat(leadRoof, 0.5, 0.3));
  flecheBase.position.set(0, 3.75, -0.45);
  scene.add(flecheBase);

  const flecheNeedle = new THREE.Mesh(new THREE.ConeGeometry(0.28, 2.35, 8), mat(0x334155, 0.45, 0.35));
  flecheNeedle.position.set(0, 5.28, -0.45);
  flecheNeedle.castShadow = true;
  scene.add(flecheNeedle);
  addCrossFinial(scene, 0, 6.45, -0.45, 0.32);
}

// ============================================================================
// 3. BASÍLICA DE LA SAGRADA FAMÍLIA, BARCELONA (BD-153)
// ============================================================================
function buildSagradaFamilia(scene: THREE.Group) {
  const montjuicSand = 0xd6c3a5;
  const gaudiCream = 0xeaddc7;
  const passionGrey = 0xcbd5e1;

  // Barcelona Eixample stone plaza with reflection pond in front of Nativity facade
  const plaza = new THREE.Mesh(new THREE.CylinderGeometry(7.2, 7.4, 0.28, 36), mat(0xd6d3d1, 0.82));
  plaza.position.set(0, -0.14, 0);
  plaza.receiveShadow = true;
  scene.add(plaza);

  const pond = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.08, 24), emissiveMat(0x0284c7, 0.35, 0.85));
  pond.position.set(2.95, 0.04, 0);
  scene.add(pond);

  // High-vaulted organic Cruciform Nave + Apse
  addCathedralGableHall(scene, 0, 0.12, 0, 3.4, 2.55, 5.2, montjuicSand, 0xb45309, gaudiCream, {
    roofH: 0.88,
    lancetBays: 6,
    glassColor: 0xf59e0b,
  });

  // Helper for Gaudí's signature perforated paraboloid spindled towers with polychrome Venetian mosaic finials
  const addGaudiSpindleTower = (
    tx: number,
    tz: number,
    baseR: number,
    height: number,
    stoneCol: number,
    finialCol: number
  ) => {
    const pts = [
      new THREE.Vector2(baseR, 0),
      new THREE.Vector2(baseR * 0.96, height * 0.38),
      new THREE.Vector2(baseR * 0.82, height * 0.68),
      new THREE.Vector2(baseR * 0.54, height * 0.88),
      new THREE.Vector2(baseR * 0.22, height),
    ];
    const towerGeo = new THREE.LatheGeometry(pts, 12);
    const tower = new THREE.Mesh(towerGeo, mat(stoneCol, 0.72));
    tower.position.set(tx, 0.12, tz);
    tower.castShadow = true;
    scene.add(tower);

    // Vertical sound-louver ribs along the paraboloid
    for (let r = 0; r < 6; r++) {
      const ang = (r * Math.PI) / 3;
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.06, height * 0.78, baseR * 1.92), mat(0xfef3c7, 0.65));
      rib.position.set(tx, 0.12 + height * 0.42, tz);
      rib.rotation.y = ang;
      scene.add(rib);
    }

    // Polychrome mosaic Cubist/Venetian glass pinnacle
    const finial = new THREE.Mesh(new THREE.OctahedronGeometry(baseR * 0.52, 0), emissiveMat(finialCol, 0.75));
    finial.position.set(tx, 0.12 + height + baseR * 0.35, tz);
    scene.add(finial);
    const topSphere = new THREE.Mesh(new THREE.SphereGeometry(baseR * 0.26, 10, 10), mat(0xfacc15, 0.25, 0.8));
    topSphere.position.set(tx, 0.12 + height + baseR * 0.82, tz);
    scene.add(topSphere);
  };

  // 4 Nativity Facade Bell Towers (East: warm sandstone, organic stalactite portals + Green Cypress Tree of Life)
  [-1.08, -0.36, 0.36, 1.08].forEach((tz, idx) => {
    const h = idx === 1 || idx === 2 ? 4.95 : 4.45;
    addGaudiSpindleTower(1.85, tz, 0.34, h, montjuicSand, 0xf59e0b);
  });
  // Green Cypress Tree of Life with white doves between the central Nativity towers
  const cypress = new THREE.Mesh(new THREE.ConeGeometry(0.28, 1.05, 8), mat(0x15803d, 0.65));
  cypress.position.set(1.92, 3.25, 0);
  scene.add(cypress);
  const tauCross = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.26, 0.08), emissiveMat(0xef4444, 0.8));
  tauCross.position.set(1.92, 3.85, 0);
  scene.add(tauCross);

  // 4 Passion Facade Bell Towers (West: pale stone + Subirachs angular skeletal bone columns)
  [-1.08, -0.36, 0.36, 1.08].forEach((tz, idx) => {
    const h = idx === 1 || idx === 2 ? 4.85 : 4.35;
    addGaudiSpindleTower(-1.85, tz, 0.34, h, passionGrey, 0x38bdf8);
  });
  // Angular inclined skeletal columns on the Passion porch
  [-0.75, -0.25, 0.25, 0.75].forEach((pz) => {
    const boneCol = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 1.65, 6), mat(0xe2e8f0, 0.68));
    boneCol.position.set(-2.32, 0.9, pz);
    boneCol.rotation.z = -0.26;
    scene.add(boneCol);
  });

  // Tower of the Virgin Mary (North Apse) crowned by the glowing 12-pointed glass morning star
  addGaudiSpindleTower(0, -1.85, 0.56, 5.35, gaudiCream, 0x38bdf8);
  const maryStar = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 1), emissiveMat(0xe0f2fe, 1.2));
  maryStar.position.set(0, 6.05, -1.85);
  scene.add(maryStar);

  // 4 Towers of the Evangelists (Matthew, Mark, Luke, John) surrounding the central spire
  [
    [-0.78, -0.78],
    [0.78, -0.78],
    [-0.78, 0.78],
    [0.78, 0.78],
  ].forEach(([ex, ez]) => {
    addGaudiSpindleTower(ex, ez, 0.44, 5.45, gaudiCream, 0xfde047);
  });

  // Colossal 172.5m Central Tower of Jesus Christ crowned by the four-armed ceramic & glass cross
  addGaudiSpindleTower(0, 0, 0.78, 6.55, gaudiCream, 0xffffff);
  const jesusCrossV = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.05, 0.28), emissiveMat(0xffffff, 0.95));
  jesusCrossV.position.set(0, 7.25, 0);
  scene.add(jesusCrossV);
  const jesusCrossX = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.24, 0.24), emissiveMat(0xfef08a, 0.9));
  jesusCrossX.position.set(0, 7.35, 0);
  scene.add(jesusCrossX);
  const jesusCrossZ = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.88), emissiveMat(0xfef08a, 0.9));
  jesusCrossZ.position.set(0, 7.35, 0);
  scene.add(jesusCrossZ);
}

// ============================================================================
// 4. DUOMO DI MILANO, ITALY (BD-154)
// ============================================================================
function buildDuomoDiMilano(scene: THREE.Group) {
  const candogliaPinkWhite = 0xfaf5f0;
  const roseMarble = 0xf3e5dc;

  // Piazza del Duomo geometric white/red/black marble patterned pavement
  const piazza = new THREE.Mesh(new THREE.BoxGeometry(11.4, 0.28, 12.6), mat(0x78716c, 0.8));
  piazza.position.set(0, -0.14, 0);
  piazza.receiveShadow = true;
  scene.add(piazza);

  for (let i = -3; i <= 3; i++) {
    const pattern = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.02, 3.6), mat(i % 2 === 0 ? 0xf8fafc : 0x991b1b, 0.7));
    pattern.position.set(i * 1.35, 0.01, 4.1);
    scene.add(pattern);
  }

  // Broad 5-Aisle Flamboyant Gothic Body in Candoglia Pink-White Marble
  addCathedralGableHall(scene, 0, 0.14, -0.4, 4.4, 2.25, 6.4, candogliaPinkWhite, candogliaPinkWhite, roseMarble, {
    roofH: 1.25,
    lancetBays: 7,
    flyingButtresses: true,
    glassColor: 0x60a5fa,
  });

  // Transept arms
  addCathedralGableHall(scene, 0, 0.14, -1.1, 5.8, 2.2, 1.9, candogliaPinkWhite, candogliaPinkWhite, roseMarble, {
    roofH: 1.05,
    gableAlongX: true,
    lancetBays: 5,
  });

  // Iconic Triangular Stepped West Facade with 5 Bronze Portals, 6 Buttress Pilasters & Pinnacles
  const facadeScreen = new THREE.Mesh(new THREE.BoxGeometry(4.65, 2.25, 0.35), mat(candogliaPinkWhite, 0.58));
  facadeScreen.position.set(0, 1.26, 2.82);
  scene.add(facadeScreen);

  const shape = new THREE.Shape();
  shape.moveTo(-2.35, 0);
  shape.lineTo(0, 1.55);
  shape.lineTo(2.35, 0);
  shape.closePath();
  const frontGable = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, { depth: 0.36, bevelEnabled: false }),
    mat(candogliaPinkWhite, 0.56)
  );
  frontGable.position.set(0, 2.38, 2.64);
  scene.add(frontGable);

  // 6 Vertical Facade Buttresses + Tall Marble Pinnacles & 5 Bronze Portals
  for (let i = 0; i < 6; i++) {
    const bx = -2.15 + i * 0.86;
    const distFromCenter = Math.abs(bx);
    const pilasterH = 3.85 - distFromCenter * 0.62;
    const pilaster = new THREE.Mesh(new THREE.BoxGeometry(0.16, pilasterH, 0.45), mat(0xffffff, 0.5));
    pilaster.position.set(bx, 0.14 + pilasterH / 2, 2.86);
    scene.add(pilaster);

    const spire = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.72, 6), mat(0xffffff, 0.48));
    spire.position.set(bx, 0.14 + pilasterH + 0.36, 2.86);
    scene.add(spire);

    if (i < 5) {
      const px = bx + 0.43;
      const portalH = i === 2 ? 0.98 : 0.76;
      const door = new THREE.Mesh(new THREE.BoxGeometry(0.42, portalH, 0.12), mat(0x3f2e21, 0.5, 0.4));
      door.position.set(px, 0.14 + portalH / 2, 3.01);
      scene.add(door);

      const gothWin = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.72, 0.1), emissiveMat(0x38bdf8, 0.75));
      gothWin.position.set(px, 1.65 + (i === 2 ? 0.28 : 0), 3.01);
      scene.add(gothWin);
    }
  }

  // Dense Forest of 135 Marble Pinnacles & Spires across the roof ridges and side aisles
  for (let zIdx = 0; zIdx < 7; zIdx++) {
    const sz = -3.1 + zIdx * 0.95;
    [-2.25, -1.35, -0.55, 0.55, 1.35, 2.25].forEach((sx) => {
      const baseH = Math.abs(sx) < 0.8 ? 3.15 : Math.abs(sx) < 1.6 ? 2.65 : 2.35;
      const needle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.075, 0.75, 6), mat(0xffffff, 0.5));
      needle.position.set(sx, baseH + 0.37, sz);
      scene.add(needle);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.42, 6), mat(0xffffff, 0.48));
      tip.position.set(sx, baseH + 0.95, sz);
      scene.add(tip);
    });
  }

  // Octagonal Tiburio Lantern Dome + Soaring Main Spire topped by the Golden Madonnina (108.5m)
  const tiburio = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.92, 1.15, 8), mat(candogliaPinkWhite, 0.58));
  tiburio.position.set(0, 3.55, -1.1);
  scene.add(tiburio);

  const mainSpire = new THREE.Mesh(new THREE.ConeGeometry(0.45, 2.15, 8), mat(0xffffff, 0.5));
  mainSpire.position.set(0, 5.2, -1.1);
  mainSpire.castShadow = true;
  scene.add(mainSpire);

  // Golden Madonnina statue at the highest pinnacle
  const madonnina = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.42, 8), emissiveMat(0xfacc15, 0.95));
  madonnina.position.set(0, 6.45, -1.1);
  scene.add(madonnina);
}

// ============================================================================
// 5. FLORENCE CATHEDRAL - SANTA MARIA DEL FIORE (BD-155)
// ============================================================================
function buildFlorenceDuomo(scene: THREE.Group) {
  const carraraWhite = 0xfafaf9;
  const pratoGreen = 0x1e3a2f;
  const maremmaPink = 0xe11d48;
  const terracottaTile = 0xc2410c;

  // Piazza del Duomo stone base
  const piazza = new THREE.Mesh(new THREE.BoxGeometry(11.4, 0.28, 12.8), mat(0xa8a29e, 0.84));
  piazza.position.set(0, -0.14, 0);
  piazza.receiveShadow = true;
  scene.add(piazza);

  // Polychrome Marble Nave (Carrara White + Prato Dark Green + Siena/Maremma Rose Pink geometric bands)
  addCathedralGableHall(scene, 0, 0.14, 1.15, 3.15, 2.15, 4.2, carraraWhite, terracottaTile, pratoGreen, {
    roofH: 0.68,
    lancetBays: 4,
    glassColor: 0xfbbf24,
  });

  // Green & pink marble geometric striping along nave walls
  [-1.59, 1.59].forEach((nx) => {
    for (let b = 0; b < 4; b++) {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(0.03, 1.65, 0.85), mat(pratoGreen, 0.6));
      panel.position.set(nx, 1.18, -0.35 + b * 1.02);
      scene.add(panel);
      const innerPink = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.35, 0.65), mat(0xfda4af, 0.62));
      innerPink.position.set(nx, 1.18, -0.35 + b * 1.02);
      scene.add(innerPink);
    }
  });

  // Neo-Gothic Polychrome West Facade with 3 Rose Windows & Gabled Portals
  const westFacade = new THREE.Mesh(new THREE.BoxGeometry(3.35, 2.65, 0.26), mat(carraraWhite, 0.58));
  westFacade.position.set(0, 1.46, 3.28);
  scene.add(westFacade);

  const greenTrim = new THREE.Mesh(new THREE.BoxGeometry(3.38, 0.18, 0.28), mat(pratoGreen, 0.55));
  greenTrim.position.set(0, 2.68, 3.28);
  scene.add(greenTrim);

  addRoseWindow(scene, 0, 2.02, 3.42, 0.46, pratoGreen, 0xf59e0b, 'z');
  addRoseWindow(scene, -1.05, 1.62, 3.42, 0.28, pratoGreen, 0x38bdf8, 'z');
  addRoseWindow(scene, 1.05, 1.62, 3.42, 0.28, pratoGreen, 0x38bdf8, 'z');

  [-1.05, 0, 1.05].forEach((px, idx) => {
    const gable = new THREE.Mesh(new THREE.ConeGeometry(idx === 1 ? 0.45 : 0.34, 0.55, 4), mat(maremmaPink, 0.6));
    gable.rotation.y = Math.PI / 4;
    gable.position.set(px, 1.18, 3.42);
    scene.add(gable);
  });

  // Giotto's Campanile (84.7m freestanding square polychrome marble bell tower at SW corner)
  const campanileX = -2.42;
  const campanileZ = 2.95;
  const campanile = new THREE.Mesh(new THREE.BoxGeometry(0.98, 4.85, 0.98), mat(carraraWhite, 0.58));
  campanile.position.set(campanileX, 2.56, campanileZ);
  campanile.castShadow = true;
  scene.add(campanile);

  for (let tier = 0; tier < 5; tier++) {
    const band = new THREE.Mesh(
      new THREE.BoxGeometry(1.02, 0.14, 1.02),
      mat(tier % 2 === 0 ? pratoGreen : 0xfda4af, 0.58)
    );
    band.position.set(campanileX, 0.85 + tier * 0.88, campanileZ);
    scene.add(band);
  }

  // Massive Octagonal Crossing Drum + 3 Tribuna Semi-Octagonal Apse Half-Domes
  const drumZ = -1.95;
  const octDrum = new THREE.Mesh(new THREE.CylinderGeometry(2.05, 2.12, 2.55, 8), mat(carraraWhite, 0.62));
  octDrum.position.set(0, 1.42, drumZ);
  octDrum.rotation.y = Math.PI / 8;
  octDrum.castShadow = true;
  scene.add(octDrum);

  // 8 Oculi round windows in the octagonal drum
  for (let i = 0; i < 8; i++) {
    const ang = (i * Math.PI) / 4;
    const oculus = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.14, 16), emissiveMat(0xfef08a, 0.7));
    oculus.rotation.x = Math.PI / 2;
    oculus.rotation.z = -ang;
    oculus.position.set(Math.cos(ang) * 1.96, 2.18, drumZ + Math.sin(ang) * 1.96);
    scene.add(oculus);
  }

  // Three Tribuna apse exedrae with terracotta half-domes (North, South, East)
  [
    [-1.95, drumZ],
    [1.95, drumZ],
    [0, drumZ - 1.95],
  ].forEach(([tx, tz]) => {
    const tribuna = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.1, 1.65, 8), mat(carraraWhite, 0.62));
    tribuna.position.set(tx, 0.96, tz);
    scene.add(tribuna);
    const halfDome = new THREE.Mesh(
      new THREE.SphereGeometry(1.05, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      mat(terracottaTile, 0.65)
    );
    halfDome.position.set(tx, 1.78, tz);
    scene.add(halfDome);
  });

  // Brunelleschi's Monumental Octagonal Red-Brick Cupola with 8 White Marble Ribs & White Marble Lantern
  const cupola = new THREE.Mesh(
    new THREE.SphereGeometry(2.05, 8, 14, 0, Math.PI * 2, 0, Math.PI * 0.52),
    mat(terracottaTile, 0.62, 0.08)
  );
  cupola.scale.y = 1.32;
  cupola.rotation.y = Math.PI / 8;
  cupola.position.set(0, 2.68, drumZ);
  cupola.castShadow = true;
  scene.add(cupola);

  // 8 bold white Carrara marble ribs converging on the lantern
  for (let i = 0; i < 8; i++) {
    const ang = (i * Math.PI) / 4 + Math.PI / 8;
    const ribGroup = new THREE.Group();
    ribGroup.position.set(0, 2.68, drumZ);
    ribGroup.rotation.y = ang;
    const ribArc = new THREE.Mesh(
      new THREE.TorusGeometry(2.06, 0.065, 6, 16, Math.PI * 0.48),
      mat(0xffffff, 0.5)
    );
    ribArc.scale.y = 1.32;
    ribGroup.add(ribArc);
    scene.add(ribGroup);
  }

  // White marble lantern + Verrocchio's golden copper sphere & cross
  const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 0.92, 8), mat(0xffffff, 0.52));
  lantern.position.set(0, 5.68, drumZ);
  scene.add(lantern);
  const lanternRoof = new THREE.Mesh(new THREE.ConeGeometry(0.46, 0.55, 8), mat(0xffffff, 0.5));
  lanternRoof.position.set(0, 6.42, drumZ);
  scene.add(lanternRoof);
  const goldBall = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), mat(0xfacc15, 0.25, 0.85));
  goldBall.position.set(0, 6.78, drumZ);
  scene.add(goldBall);
  addCrossFinial(scene, 0, 6.92, drumZ, 0.34);
}

// ============================================================================
// 6. COLOGNE CATHEDRAL - KÖLNER DOM, GERMANY (BD-156)
// ============================================================================
function buildCologneCathedral(scene: THREE.Group) {
  const weatheredBasalt = 0x57534e;
  const darkSandstone = 0x78716c;
  const copperRoof = 0x334155;

  // Domplatte stone plaza overlooking the Rhine
  const plaza = new THREE.Mesh(new THREE.BoxGeometry(10.8, 0.3, 12.6), mat(0xa8a29e, 0.84));
  plaza.position.set(0, -0.15, 0);
  plaza.receiveShadow = true;
  scene.add(plaza);

  // High-Gothic 5-Aisle Nave & Choir with Double-Tier Flying Buttresses
  addCathedralGableHall(scene, 0, 0.14, -0.45, 2.75, 2.65, 6.6, darkSandstone, copperRoof, weatheredBasalt, {
    roofH: 1.25,
    lancetBays: 7,
    flyingButtresses: true,
    glassColor: 0xf59e0b,
  });

  // Transept
  addCathedralGableHall(scene, 0, 0.14, -0.85, 4.95, 2.6, 1.85, darkSandstone, copperRoof, weatheredBasalt, {
    roofH: 1.18,
    gableAlongX: true,
    lancetBays: 5,
    glassColor: 0xec4899,
  });

  // Central Crossing Flèche Spire
  const fleche = new THREE.Mesh(new THREE.ConeGeometry(0.24, 1.75, 8), mat(0x1e293b, 0.5, 0.3));
  fleche.position.set(0, 4.75, -0.85);
  scene.add(fleche);

  // Colossal Twin 157m West Towers with Openwork Filigree Gothic Spires & Crocketed Ribs
  [-1.12, 1.12].forEach((tx) => {
    // Lower square belfry stages
    const stage1 = new THREE.Mesh(new THREE.BoxGeometry(1.32, 3.35, 1.42), mat(weatheredBasalt, 0.78));
    stage1.position.set(tx, 1.82, 2.95);
    stage1.castShadow = true;
    scene.add(stage1);

    // Corner pinnacles at transition to octagonal drum
    [
      [-0.58, -0.58],
      [0.58, -0.58],
      [-0.58, 0.58],
      [0.58, 0.58],
    ].forEach(([px, pz]) => {
      const pin = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.95, 4), mat(darkSandstone, 0.72));
      pin.position.set(tx + px, 3.95, 2.95 + pz);
      scene.add(pin);
    });

    // Octagonal upper belfry lantern stage
    const octStage = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.64, 1.25, 8), mat(darkSandstone, 0.74));
    octStage.position.set(tx, 4.1, 2.95);
    octStage.castShadow = true;
    scene.add(octStage);

    // Tall openwork Gothic spire (height 2.55) with crocket rings
    const spire = new THREE.Mesh(new THREE.ConeGeometry(0.58, 2.55, 8), mat(weatheredBasalt, 0.68));
    spire.position.set(tx, 6.0, 2.95);
    spire.castShadow = true;
    scene.add(spire);

    for (let r = 1; r <= 4; r++) {
      const ringR = 0.58 * (1 - r * 0.19);
      const crocketRing = new THREE.Mesh(
        new THREE.TorusGeometry(ringR, 0.035, 6, 8),
        mat(0xd6d3d1, 0.65)
      );
      crocketRing.rotation.x = Math.PI / 2;
      crocketRing.position.set(tx, 4.72 + r * 0.48, 2.95);
      scene.add(crocketRing);
    }

    // Giant stone finial bouquet (Kreuzblume) at the summit
    const kreuzblume = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), mat(0xd6d3d1, 0.6));
    kreuzblume.position.set(tx, 7.35, 2.95);
    scene.add(kreuzblume);
  });

  // Central West Gable Portal & Great West Lancet Window between the twin towers
  const westGable = new THREE.Mesh(new THREE.BoxGeometry(1.15, 3.15, 1.15), mat(weatheredBasalt, 0.76));
  westGable.position.set(0, 1.72, 2.92);
  scene.add(westGable);

  const greatWindow = new THREE.Mesh(new THREE.BoxGeometry(0.68, 1.45, 0.1), emissiveMat(0xfbbf24, 0.8));
  greatWindow.position.set(0, 2.18, 3.52);
  scene.add(greatWindow);

  [-1.12, 0, 1.12].forEach((px, idx) => {
    const portalGable = new THREE.Mesh(new THREE.ConeGeometry(idx === 1 ? 0.46 : 0.36, 0.85, 4), mat(0xa8a29e, 0.7));
    portalGable.rotation.y = Math.PI / 4;
    portalGable.position.set(px, 1.15, 3.66);
    scene.add(portalGable);
  });
}

// ============================================================================
// 7. SAINT BASIL'S CATHEDRAL, MOSCOW (BD-157)
// ============================================================================
function buildSaintBasilsCathedral(scene: THREE.Group) {
  const redBrick = 0xb91c1c;
  const whiteStone = 0xf8fafc;

  // Red Square cobblestone plaza + bronze statue of Minin and Pozharsky in front
  const redSquare = new THREE.Mesh(new THREE.CylinderGeometry(6.8, 7.1, 0.28, 36), mat(0x57534e, 0.86));
  redSquare.position.set(0, -0.14, 0);
  redSquare.receiveShadow = true;
  scene.add(redSquare);

  const statuePedestal = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.48, 0.48), mat(0x7f1d1d, 0.65));
  statuePedestal.position.set(0, 0.24, 3.45);
  scene.add(statuePedestal);
  const bronzeMonument = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.48, 8), mat(0x365314, 0.45, 0.6));
  bronzeMonument.position.set(0, 0.72, 3.45);
  scene.add(bronzeMonument);

  // Raised White-Stone Arched Podium (Podklet) supporting all 9 chapels + Covered Exterior Staircases
  const podklet = new THREE.Mesh(new THREE.CylinderGeometry(3.45, 3.65, 1.15, 8), mat(whiteStone, 0.72));
  podklet.position.set(0, 0.58, 0);
  podklet.rotation.y = Math.PI / 8;
  podklet.castShadow = true;
  scene.add(podklet);

  const redGallery = new THREE.Mesh(new THREE.CylinderGeometry(3.25, 3.35, 0.55, 8), mat(redBrick, 0.74));
  redGallery.position.set(0, 1.38, 0);
  redGallery.rotation.y = Math.PI / 8;
  scene.add(redGallery);

  // Covered tent-roofed porch staircase at the front
  const porchStair = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.95, 1.65), mat(whiteStone, 0.7));
  porchStair.position.set(0, 0.48, 2.55);
  scene.add(porchStair);
  const porchTent = new THREE.Mesh(new THREE.ConeGeometry(0.75, 1.25, 4), mat(0x15803d, 0.55));
  porchTent.position.set(0, 1.55, 2.85);
  porchTent.rotation.y = Math.PI / 4;
  scene.add(porchTent);

  // Central Tallest Church of the Intercession: 65m Octagonal Tent Roof (Shayor) + Golden Onion Cupola
  const centralOctagon = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.18, 2.35, 8), mat(redBrick, 0.72));
  centralOctagon.position.set(0, 2.65, 0);
  centralOctagon.castShadow = true;
  scene.add(centralOctagon);

  // Rows of white decorative Kokoshnik gables at the base of the central tent spire
  for (let i = 0; i < 8; i++) {
    const ang = (i * Math.PI) / 4;
    const kokosh = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.52, 4), mat(whiteStone, 0.65));
    kokosh.position.set(Math.cos(ang) * 1.05, 3.85, Math.sin(ang) * 1.05);
    kokosh.rotation.y = ang + Math.PI / 4;
    scene.add(kokosh);
  }

  const centralTent = new THREE.Mesh(new THREE.ConeGeometry(0.95, 2.45, 8), mat(redBrick, 0.62));
  centralTent.position.set(0, 5.05, 0);
  centralTent.castShadow = true;
  scene.add(centralTent);

  // Gold horizontal bands on the central tent spire
  for (let b = 1; b <= 3; b++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.95 * (1 - b * 0.22), 0.04, 6, 8), mat(0xfacc15, 0.3, 0.8));
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, 3.85 + b * 0.55, 0);
    scene.add(ring);
  }

  addOnionDomeTower(scene, 0, 6.15, 0, 0.28, 0.35, 0.42, 0xfacc15, 0xf59e0b, whiteStone);

  // 8 Surrounding Polychrome Onion-Domed Chapels (4 Larger Cardinal + 4 Diagonal)
  const cardinalConfigs = [
    { x: 0, z: -2.15, c1: 0x2563eb, c2: 0xfacc15, drumCol: redBrick },
    { x: 0, z: 2.15, c1: 0x16a34a, c2: 0xef4444, drumCol: whiteStone },
    { x: -2.15, z: 0, c1: 0xdc2626, c2: 0xffffff, drumCol: redBrick },
    { x: 2.15, z: 0, c1: 0xf59e0b, c2: 0x15803d, drumCol: whiteStone },
  ];
  cardinalConfigs.forEach((cfg) => {
    addOnionDomeTower(scene, cfg.x, 1.55, cfg.z, 0.62, 1.95, 0.82, cfg.c1, cfg.c2, cfg.drumCol);
  });

  const diagonalConfigs = [
    { x: -1.52, z: -1.52, c1: 0x0d9488, c2: 0xfde047, drumCol: whiteStone },
    { x: 1.52, z: -1.52, c1: 0x9333ea, c2: 0xffffff, drumCol: redBrick },
    { x: -1.52, z: 1.52, c1: 0xea580c, c2: 0x16a34a, drumCol: redBrick },
    { x: 1.52, z: 1.52, c1: 0x0284c7, c2: 0xf43f5e, drumCol: whiteStone },
  ];
  diagonalConfigs.forEach((cfg) => {
    addOnionDomeTower(scene, cfg.x, 1.55, cfg.z, 0.46, 1.35, 0.62, cfg.c1, cfg.c2, cfg.drumCol);
  });
}

// ============================================================================
// 8. HAGIA SOPHIA, ISTANBUL (BD-158)
// ============================================================================
function buildHagiaSophia(scene: THREE.Group) {
  const byzantineRose = 0xd98a6c;
  const creamStone = 0xf3e5ab;
  const leadDome = 0x64748b;

  // Sultanahmet Courtyard with marble pavement, cypress trees & Ottoman Ablution Fountain (Şadırvan)
  const plaza = new THREE.Mesh(new THREE.CylinderGeometry(7.2, 7.4, 0.28, 36), mat(0xd6d3d1, 0.84));
  plaza.position.set(0, -0.14, 0);
  plaza.receiveShadow = true;
  scene.add(plaza);

  // Octagonal domed Ablution Fountain in front courtyard
  const fountain = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.66, 0.55, 8), mat(creamStone, 0.68));
  fountain.position.set(0, 0.28, 3.65);
  scene.add(fountain);
  const fountainDome = new THREE.Mesh(new THREE.ConeGeometry(0.72, 0.45, 8), mat(leadDome, 0.55));
  fountainDome.position.set(0, 0.78, 3.65);
  scene.add(fountainDome);

  // Main Square Byzantine Basilica Body + Massive Exterior Seismic Buttresses
  const mainBody = new THREE.Mesh(new THREE.BoxGeometry(4.45, 2.35, 4.65), mat(byzantineRose, 0.76));
  mainBody.position.set(0, 1.18, -0.2);
  mainBody.castShadow = true;
  scene.add(mainBody);

  // Cream stone horizontal striping bands (Byzantine brick-and-stone courses)
  for (let b = 0; b < 3; b++) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.14, 4.7), mat(creamStone, 0.72));
    stripe.position.set(0, 0.65 + b * 0.68, -0.2);
    scene.add(stripe);
  }

  // 4 Heavy Exterior Buttresses on North & South flanks
  [-1, 1].forEach((side) => {
    [-1.15, 0.75].forEach((bz) => {
      const buttress = new THREE.Mesh(new THREE.BoxGeometry(0.65, 2.45, 0.58), mat(byzantineRose, 0.78));
      buttress.position.set(side * 2.42, 1.22, bz);
      buttress.castShadow = true;
      scene.add(buttress);
      const slope = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.65, 4), mat(leadDome, 0.6));
      slope.position.set(side * 2.42, 2.75, bz);
      slope.rotation.y = Math.PI / 4;
      scene.add(slope);
    });
  });

  // Cascading East & West Half-Domes (Semi-Domes) + Smaller Exedra Conches
  [-1.75, 1.35].forEach((dz) => {
    const semiDrum = new THREE.Mesh(new THREE.CylinderGeometry(1.48, 1.54, 0.75, 16), mat(byzantineRose, 0.74));
    semiDrum.position.set(0, 2.45, dz);
    scene.add(semiDrum);

    const semiDome = new THREE.Mesh(
      new THREE.SphereGeometry(1.48, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.48),
      mat(leadDome, 0.55, 0.25)
    );
    semiDome.scale.y = 0.68;
    semiDome.position.set(0, 2.82, dz);
    scene.add(semiDome);
  });

  // Famous 55.6m Central Byzantine Dome ringed by 40 Arched Clerestory Windows ("Suspended from Heaven")
  const centralDrum = new THREE.Mesh(new THREE.CylinderGeometry(1.78, 1.85, 0.68, 24), mat(creamStone, 0.7));
  centralDrum.position.set(0, 2.68, -0.2);
  scene.add(centralDrum);

  for (let w = 0; w < 20; w++) {
    const ang = (w * Math.PI) / 10;
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.34, 0.14), emissiveMat(0xfde047, 0.85));
    win.position.set(Math.cos(ang) * 1.81, 2.72, -0.2 + Math.sin(ang) * 1.81);
    win.rotation.y = -ang;
    scene.add(win);
  }

  const mainDome = new THREE.Mesh(
    new THREE.SphereGeometry(1.78, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.48),
    mat(leadDome, 0.52, 0.25)
  );
  mainDome.scale.y = 0.66;
  mainDome.position.set(0, 3.02, -0.2);
  mainDome.castShadow = true;
  scene.add(mainDome);

  const crescentFinial = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.025, 8, 16, Math.PI * 1.45), mat(0xfacc15, 0.25, 0.85));
  crescentFinial.position.set(0, 4.35, -0.2);
  crescentFinial.rotation.z = Math.PI / 4;
  scene.add(crescentFinial);

  // 4 Soaring Ottoman Minarets at the Four Corners (1 Red-Brick SE Minaret + 3 Pale Limestone Minarets)
  [
    [-2.85, -2.65, creamStone],
    [2.85, -2.65, 0xb91c1c],
    [-2.85, 2.25, creamStone],
    [2.85, 2.25, creamStone],
  ].forEach(([mx, mz, col]) => {
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.58, 1.15, 0.58), mat(creamStone, 0.72));
    base.position.set(mx, 0.58, mz);
    scene.add(base);

    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.24, 3.85, 12), mat(col, 0.68));
    shaft.position.set(mx, 3.05, mz);
    shaft.castShadow = true;
    scene.add(shaft);

    // Şerefe (Muezzin balcony with muqarnas ring)
    const balcony = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.24, 0.18, 12), mat(0xffffff, 0.6));
    balcony.position.set(mx, 4.35, mz);
    scene.add(balcony);

    // Pencil-shaped lead spire (Külah)
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.2, 1.15, 12), mat(leadDome, 0.5, 0.3));
    cone.position.set(mx, 5.55, mz);
    scene.add(cone);
  });
}

// ============================================================================
// 9. WESTMINSTER ABBEY, LONDON (BD-159)
// ============================================================================
function buildWestminsterAbbey(scene: THREE.Group) {
  const portlandWhite = 0xf5f2eb;
  const abbeyBuff = 0xe5dec9;
  const leadRoof = 0x475569;

  // Parliament Square Sanctuary Green & ceremonial gravel approach
  const base = new THREE.Mesh(new THREE.BoxGeometry(10.8, 0.28, 12.6), mat(0xa8a29e, 0.84));
  base.position.set(0, -0.14, 0);
  base.receiveShadow = true;
  scene.add(base);

  const northGreen = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.04, 5.8), mat(0x3f6212, 0.88));
  northGreen.position.set(-3.3, 0.02, -0.2);
  scene.add(northGreen);

  // High-Vaulted English Gothic Nave + Choir with 3-Tier Flying Buttresses
  addCathedralGableHall(scene, 0, 0.14, -0.1, 2.35, 2.45, 6.8, abbeyBuff, leadRoof, portlandWhite, {
    roofH: 0.98,
    lancetBays: 8,
    flyingButtresses: true,
    glassColor: 0x38bdf8,
  });

  // Steep Transept with Iconic North Transept Rose Window & Solomon's Triple Porch
  addCathedralGableHall(scene, 0, 0.14, -0.95, 4.85, 2.45, 1.75, abbeyBuff, leadRoof, portlandWhite, {
    roofH: 0.95,
    gableAlongX: true,
    lancetBays: 5,
    glassColor: 0xf43f5e,
  });
  addRoseWindow(scene, -2.44, 1.68, -0.95, 0.56, portlandWhite, 0xf59e0b, 'x');
  addRoseWindow(scene, 2.44, 1.68, -0.95, 0.54, portlandWhite, 0x38bdf8, 'x');

  // Low square Central Crossing Tower
  const crossingTower = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.85, 1.85), mat(portlandWhite, 0.72));
  crossingTower.position.set(0, 3.15, -0.95);
  scene.add(crossingTower);

  // Henry VII Lady Chapel at the East End (Perpendicular Gothic with turreted buttresses)
  addCathedralGableHall(scene, 0, 0.14, -4.15, 2.05, 1.95, 1.95, abbeyBuff, leadRoof, portlandWhite, {
    roofH: 0.55,
    lancetBays: 4,
    glassColor: 0xfbbf24,
  });

  // Octagonal Chapter House with steep conical lead roof on the South side
  const chapterHouse = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.98, 1.65, 8), mat(abbeyBuff, 0.74));
  chapterHouse.position.set(2.35, 0.96, -2.25);
  scene.add(chapterHouse);
  const chapterRoof = new THREE.Mesh(new THREE.ConeGeometry(1.02, 0.95, 8), mat(leadRoof, 0.6));
  chapterRoof.position.set(2.35, 2.26, -2.25);
  scene.add(chapterRoof);

  // Nicholas Hawksmoor's Twin 68.5m White Portland-Stone West Towers with 4 Corner Pinnacles each
  [-0.98, 0.98].forEach((tx) => {
    const tower = new THREE.Mesh(new THREE.BoxGeometry(1.18, 4.55, 1.25), mat(portlandWhite, 0.65));
    tower.position.set(tx, 2.41, 3.32);
    tower.castShadow = true;
    scene.add(tower);

    // Horizontal string courses + clock dial on North-West tower
    [1.8, 3.0, 4.1].forEach((hy) => {
      const cornice = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.09, 1.32), mat(0xffffff, 0.6));
      cornice.position.set(tx, hy, 3.32);
      scene.add(cornice);
    });

    // Tall Gothic belfry windows
    const belfryWin = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.92, 0.08), mat(0x334155, 0.8));
    belfryWin.position.set(tx, 3.55, 3.95);
    scene.add(belfryWin);

    // 4 Corner Pinnacles crowning each Hawksmoor tower
    [
      [-0.48, -0.5],
      [0.48, -0.5],
      [-0.48, 0.5],
      [0.48, 0.5],
    ].forEach(([px, pz]) => {
      const pin = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.68, 4), mat(0xffffff, 0.6));
      pin.position.set(tx + px, 5.02, 3.32 + pz);
      pin.rotation.y = Math.PI / 4;
      scene.add(pin);
    });
  });

  // Great Perpendicular West Window & Modern Martyrs Statues above the West Door
  const westWindow = new THREE.Mesh(new THREE.BoxGeometry(0.88, 1.55, 0.1), emissiveMat(0x60a5fa, 0.8));
  westWindow.position.set(0, 2.15, 3.38);
  scene.add(westWindow);
}

// ============================================================================
// 10. HALLGRÍMSKIRKJA, REYKJAVIK, ICELAND (BD-160)
// ============================================================================
function buildHallgrimskirkja(scene: THREE.Group) {
  const basaltConcrete = 0xf1f5f9;
  const coolSlate = 0xe2e8f0;

  // Skólavörðuholt volcanic basalt plaza
  const plaza = new THREE.Mesh(new THREE.CylinderGeometry(6.8, 7.1, 0.28, 32), mat(0x475569, 0.85));
  plaza.position.set(0, -0.14, 0);
  plaza.receiveShadow = true;
  scene.add(plaza);

  // Nave Hall behind the basalt facade
  addCathedralGableHall(scene, 0, 0.14, -1.35, 2.55, 2.05, 4.85, basaltConcrete, 0x64748b, coolSlate, {
    roofH: 0.78,
    lancetBays: 6,
    glassColor: 0xe0f2fe,
  });

  // Central 74.5m Expressionist Concrete Bell Tower
  const centralTower = new THREE.Mesh(new THREE.BoxGeometry(1.18, 5.85, 1.28), mat(basaltConcrete, 0.62));
  centralTower.position.set(0, 3.05, 1.35);
  centralTower.castShadow = true;
  scene.add(centralTower);

  // Tall vertical glazed slot windows running up the central shaft
  [-0.24, 0, 0.24].forEach((wx) => {
    const slotWin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 3.15, 0.08), emissiveMat(0xbae6fd, 0.8));
    slotWin.position.set(wx, 2.65, 1.98);
    scene.add(slotWin);
  });

  // Iconic Clock Face & Observation Louvers near the summit of the central tower
  const clockDial = new THREE.Mesh(new THREE.CircleGeometry(0.34, 20), emissiveMat(0xfef9c3, 0.9));
  clockDial.position.set(0, 4.95, 2.0);
  scene.add(clockDial);
  const clockRim = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.03, 8, 20), mat(0x1e293b, 0.5));
  clockRim.position.set(0, 4.95, 2.0);
  scene.add(clockRim);

  // Crown spire & weathervane cross atop the 74.5m tower
  const crown = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.75, 0.76), mat(basaltConcrete, 0.6));
  crown.position.set(0, 6.32, 1.35);
  scene.add(crown);
  addCrossFinial(scene, 0, 6.7, 1.35, 0.45, 0x94a3b8);

  // Signature Sweeping Stepped Hexagonal Basalt-Column Wings (14 graduated columns on each side!)
  [-1, 1].forEach((side) => {
    for (let i = 1; i <= 14; i++) {
      const t = i / 14;
      // Exponential parabolic curve mimicking Svartifoss volcanic basalt columns
      const colH = 0.68 + Math.pow(1 - t, 1.85) * 4.55;
      const cx = side * (0.52 + i * 0.22);
      // Slight gentle curve forward
      const cz = 1.35 + Math.sin(t * Math.PI * 0.65) * 0.48;

      const basaltCol = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.145, colH, 6),
        mat(i % 2 === 0 ? basaltConcrete : coolSlate, 0.62)
      );
      basaltCol.position.set(cx, 0.14 + colH / 2, cz);
      basaltCol.rotation.y = Math.PI / 6;
      basaltCol.castShadow = true;
      basaltCol.receiveShadow = true;
      scene.add(basaltCol);

      // Slanted dark cap on each stepped basalt column
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.145, 0.06, 6), mat(0x64748b, 0.55));
      cap.position.set(cx, 0.14 + colH + 0.03, cz);
      cap.rotation.y = Math.PI / 6;
      scene.add(cap);
    }
  });

  // Sculpted Bronze Statue of Leif Eriksson (by Alexander Stirling Calder) on a Viking ship-prow pedestal in front
  const prowPedestal = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.62, 4), mat(0x64748b, 0.75));
  prowPedestal.scale.set(0.65, 1, 1.45);
  prowPedestal.position.set(0, 0.31, 3.65);
  scene.add(prowPedestal);

  const leifStatue = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 0.46, 8), mat(0x1e293b, 0.4, 0.7));
  leifStatue.position.set(0, 0.82, 3.65);
  scene.add(leifStatue);
}

// ============================================================================
// PAIRED 2-STORY SACRED CATHEDRAL INTERIORS (diorama_dollhouse_43 to 52)
// ============================================================================
export function buildWorldCathedralInteriorScene(
  island: IslandMetadata,
  _variant: IslandVariant = 'classic'
): THREE.Group {
  const scene = new THREE.Group();
  const dhMatch = island.id.match(/diorama_dollhouse_(\d+)/);
  const dhNum = dhMatch ? parseInt(dhMatch[1], 10) : 43;
  const idx = Math.max(1, Math.min(10, dhNum - 42));
  const seed = FAMOUS_CATHEDRAL_SEEDS[idx - 1] || FAMOUS_CATHEDRAL_SEEDS[0];

  const floor1Group = new THREE.Group();
  floor1Group.name = 'floor_1_group';
  const floor2Group = new THREE.Group();
  floor2Group.name = 'floor_2_group';
  scene.add(floor1Group, floor2Group);

  const W = 7.4;
  const D = 5.4;
  const H1 = 2.4;
  const H2 = 2.2;

  const wallColor = parseInt((seed.interiorPalette[0] || '#FAF5EC').replace('#', ''), 16);
  const trimColor = parseInt((seed.interiorPalette[1] || '#E8DEC8').replace('#', ''), 16);
  const wallMat = mat(wallColor, 0.72, 0.06);
  const trimMat = mat(trimColor, 0.62, 0.12);
  const goldMat = mat(0xd4af37, 0.28, 0.82);
  const darkOak = mat(0x451a03, 0.78, 0.05);
  const crimsonCarpet = mat(0x991b1b, 0.85, 0.02);

  // ── 1F SACRED NAVE & SANCTUARY SHELL ──
  const slab1 = new THREE.Mesh(new THREE.BoxGeometry(W, 0.22, D), mat(0x334155, 0.82));
  slab1.position.set(0, -0.11, 0);
  slab1.receiveShadow = true;
  floor1Group.add(slab1);

  // Checkered marble cathedral pavement tiles
  for (let ix = -6; ix <= 6; ix++) {
    for (let iz = -4; iz <= 4; iz++) {
      const tileCol = (ix + iz) % 2 === 0 ? wallColor : trimColor;
      const tile = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.02, 0.52), mat(tileCol, 0.42, 0.1));
      tile.position.set(ix * 0.54, 0.01, iz * 0.54);
      tile.receiveShadow = true;
      floor1Group.add(tile);
    }
  }

  // Ceremonial Processional Carpet from Nave to Sanctuary Dais
  const aisleCarpet = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.025, 1.05), crimsonCarpet);
  aisleCarpet.position.set(0, 0.02, 0);
  floor1Group.add(aisleCarpet);

  // Back & Left Sanctuary Walls with Stained-Glass Lancet Windows & Vaulted Ribs
  const backWall1 = new THREE.Mesh(new THREE.BoxGeometry(W, H1, 0.22), wallMat);
  backWall1.position.set(0, H1 / 2, -D / 2 + 0.11);
  floor1Group.add(backWall1);

  const leftWall1 = new THREE.Mesh(new THREE.BoxGeometry(0.22, H1, D), wallMat);
  leftWall1.position.set(-W / 2 + 0.11, H1 / 2, 0);
  floor1Group.add(leftWall1);

  // Clustered Cathedral Columns & Stained Glass Windows along back wall
  for (let i = 0; i < 5; i++) {
    const px = -2.8 + i * 1.4;
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.19, H1, 12), trimMat);
    pillar.position.set(px, H1 / 2, -D / 2 + 0.26);
    pillar.castShadow = true;
    floor1Group.add(pillar);

    const capital = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.16, 0.44), goldMat);
    capital.position.set(px, H1 - 0.1, -D / 2 + 0.26);
    floor1Group.add(capital);

    if (i < 4) {
      const wx = px + 0.7;
      const glassColors = [0x38bdf8, 0xf59e0b, 0xa855f7, 0xec4899];
      const stainedWin = new THREE.Mesh(
        new THREE.BoxGeometry(0.56, 1.45, 0.06),
        emissiveMat(glassColors[(i + idx) % glassColors.length], 0.78, 0.9)
      );
      stainedWin.position.set(wx, H1 * 0.56, -D / 2 + 0.24);
      floor1Group.add(stainedWin);
    }
  }

  // ── 1F LEFT: HIGH ALTAR SANCTUARY & BESPOKE CATHEDRAL MASTERPIECE ──
  const dais = new THREE.Mesh(new THREE.BoxGeometry(2.85, 0.24, 3.85), trimMat);
  dais.position.set(-1.95, 0.12, -0.2);
  floor1Group.add(dais);

  const highAltar = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.62, 1.85), mat(0xffffff, 0.4, 0.15));
  highAltar.position.set(-2.15, 0.55, -0.2);
  highAltar.castShadow = true;
  floor1Group.add(highAltar);

  const altarFrontal = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.46, 1.65), goldMat);
  altarFrontal.position.set(-1.56, 0.55, -0.2);
  floor1Group.add(altarFrontal);

  // 6 Golden Altar Candlesticks + Central Crucifix
  [-0.65, -0.42, -0.18, 0.18, 0.42, 0.65].forEach((cz) => {
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.04, 0.28, 8), goldMat);
    stick.position.set(-2.15, 1.0, -0.2 + cz);
    floor1Group.add(stick);
    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), emissiveMat(0xfef08a, 1.2));
    flame.position.set(-2.15, 1.16, -0.2 + cz);
    floor1Group.add(flame);
  });
  addCrossFinial(floor1Group, -2.15, 0.86, -0.2, 0.48);

  // Bespoke Historical Centerpiece per Cathedral (idx 1..10):
  if (idx === 1) {
    // St. Peter's: Bernini's 4 Twisted Solomonic Bronze Columns Baldacchino
    const bronzeMat = mat(0x292524, 0.35, 0.75);
    [
      [-2.65, -0.95],
      [-1.55, -0.95],
      [-2.65, 0.55],
      [-1.55, 0.55],
    ].forEach(([bx, bz]) => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 1.75, 10), bronzeMat);
      col.position.set(bx, 1.12, bz);
      floor1Group.add(col);
    });
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.24, 1.75), bronzeMat);
    canopy.position.set(-2.1, 2.05, -0.2);
    floor1Group.add(canopy);
    const goldSunburst = new THREE.Mesh(new THREE.CircleGeometry(0.42, 16), emissiveMat(0xfacc15, 1.1));
    goldSunburst.rotation.y = Math.PI / 2;
    goldSunburst.position.set(-3.45, 1.55, -0.2);
    floor1Group.add(goldSunburst);
  } else if (idx === 3) {
    // Sagrada Família: Gaudí's Branching Hyperboloid Tree Columns + Glowing Suspended Canopy
    [-0.95, 0.95].forEach((tz) => {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.45, 8), trimMat);
      trunk.position.set(-0.95, 0.85, tz);
      floor1Group.add(trunk);
      [-0.28, 0.28].forEach((ang) => {
        const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 0.85, 8), trimMat);
        branch.position.set(-0.95, 1.85, tz + ang * 0.65);
        branch.rotation.x = ang;
        floor1Group.add(branch);
      });
    });
    const parachuteCanopy = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.35, 0.25, 12), emissiveMat(0xfde047, 0.85));
    parachuteCanopy.position.set(-2.15, 1.95, -0.2);
    floor1Group.add(parachuteCanopy);
  } else if (idx === 6) {
    // Cologne Cathedral: Golden Shrine of the Three Kings (Dreikönigenschrein)
    const shrine = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.58, 1.05), goldMat);
    shrine.position.set(-2.15, 1.15, -0.2);
    floor1Group.add(shrine);
  } else if (idx === 7) {
    // St. Basil's Cathedral: 5-Tiered Golden Orthodox Iconostasis Screen
    const iconostasis = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.05, 3.6), goldMat);
    iconostasis.position.set(-2.85, 1.15, -0.2);
    floor1Group.add(iconostasis);
    for (let r = 0; r < 3; r++) {
      for (let c = -2; c <= 2; c++) {
        const icon = new THREE.Mesh(
          new THREE.BoxGeometry(0.06, 0.36, 0.42),
          mat((r + c) % 2 === 0 ? 0xb91c1c : 0x1d4ed8, 0.5)
        );
        icon.position.set(-2.74, 0.65 + r * 0.52, -0.2 + c * 0.58);
        floor1Group.add(icon);
      }
    }
  } else if (idx === 8) {
    // Hagia Sophia: Giant Black-and-Gold Ottoman Calligraphy Medallions + Golden Mihrab & Minbar
    [-1.45, 1.05].forEach((mz) => {
      const roundel = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.06, 20), mat(0x1c1917, 0.4));
      roundel.rotation.z = Math.PI / 2;
      roundel.position.set(-3.45, 1.68, mz);
      floor1Group.add(roundel);
      const goldBorder = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.035, 8, 20), goldMat);
      goldBorder.rotation.y = Math.PI / 2;
      goldBorder.position.set(-3.41, 1.68, mz);
      floor1Group.add(goldBorder);
    });
  } else if (idx === 9) {
    // Westminster Abbey: King Edward's Oak Coronation Chair + Chivalric Banners of the Order of the Bath
    const throne = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.85, 0.48), darkOak);
    throne.position.set(-1.35, 0.65, -0.2);
    floor1Group.add(throne);
  }

  // ── 1F RIGHT: SYMMETRICAL CATHEDRAL OAK PEWS, PULPIT & VOTIVE CANDLE RACK ──
  for (let row = 0; row < 4; row++) {
    const px = 0.25 + row * 0.78;
    [-1.35, 1.35].forEach((pz) => {
      const benchSeat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.1, 1.45), darkOak);
      benchSeat.position.set(px, 0.28, pz);
      benchSeat.castShadow = true;
      floor1Group.add(benchSeat);

      const benchBack = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.48, 1.45), darkOak);
      benchBack.position.set(px + 0.17, 0.48, pz);
      floor1Group.add(benchBack);
    });
  }

  // Glowing Votive Candle Stand & Marble Holy Water Stoup near entrance
  const candleStand = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.58, 0.85), goldMat);
  candleStand.position.set(3.15, 0.29, -1.65);
  floor1Group.add(candleStand);
  const candleGlow = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.12, 0.72), emissiveMat(0xfef08a, 1.1));
  candleGlow.position.set(3.15, 0.62, -1.65);
  floor1Group.add(candleGlow);

  // Spiral Sacristy Stone Staircase ascending to the 2F Organ & Choir Loft
  for (let s = 0; s < 10; s++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 0.28), trimMat);
    step.position.set(3.15, 0.18 + s * 0.22, 1.95 - s * 0.22);
    floor1Group.add(step);
  }

  // ── 2F UPPER MEZZANINE: GRAND PIPE ORGAN LOFT & SACRED RELIQUARY TREASURY ──
  // Open central lightwell so the nave looks up into the rose window and pipe organ
  const loftLeft = new THREE.Mesh(new THREE.BoxGeometry(2.85, 0.18, D), trimMat);
  loftLeft.position.set(-2.25, H1, 0);
  floor2Group.add(loftLeft);

  const loftBack = new THREE.Mesh(new THREE.BoxGeometry(W, 0.18, 1.85), trimMat);
  loftBack.position.set(0, H1, -D / 2 + 0.92);
  floor2Group.add(loftBack);

  // Balustrade overlooking the 1F Sanctuary
  const balustrade2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.52, D - 0.4), goldMat);
  balustrade2.position.set(-0.85, H1 + 0.32, 0);
  floor2Group.add(balustrade2);

  // Back & Left Upper Walls + Giant Glowing Rose Window on Left Clerestory
  const backWall2 = new THREE.Mesh(new THREE.BoxGeometry(W, H2, 0.22), wallMat);
  backWall2.position.set(0, H1 + H2 / 2, -D / 2 + 0.11);
  floor2Group.add(backWall2);

  const leftWall2 = new THREE.Mesh(new THREE.BoxGeometry(0.22, H2, D), wallMat);
  leftWall2.position.set(-W / 2 + 0.11, H1 + H2 / 2, 0);
  floor2Group.add(leftWall2);

  addRoseWindow(floor2Group, -W / 2 + 0.26, H1 + 1.15, 0.45, 0.72, trimColor, 0x38bdf8, 'x');

  // Monumental Cathedral Pipe Organ (Cavaillé-Coll / Willis style) with 19 Gleaming Brass & Silver Pipes
  const organCase = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.45, 2.45), darkOak);
  organCase.position.set(-2.95, H1 + 0.82, -0.65);
  organCase.castShadow = true;
  floor2Group.add(organCase);

  for (let p = -9; p <= 9; p++) {
    const dist = Math.abs(p);
    const pipeH = 1.65 - dist * 0.08 + (p % 2 === 0 ? 0.18 : 0);
    const pipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.038, 0.038, pipeH, 8),
      p % 3 === 0 ? goldMat : mat(0xe2e8f0, 0.25, 0.85)
    );
    pipe.position.set(-2.58, H1 + 0.45 + pipeH / 2, -0.65 + p * 0.12);
    floor2Group.add(pipe);
  }

  // Organist 4-Manual Console & Bench
  const consoleBox = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.58, 0.85), darkOak);
  consoleBox.position.set(-1.75, H1 + 0.38, -0.65);
  floor2Group.add(consoleBox);
  const keyboards = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.68), mat(0xffffff, 0.3));
  keyboards.position.set(-1.55, H1 + 0.56, -0.65);
  floor2Group.add(keyboards);

  // Sacred Treasury Reliquary Display Cases & Golden Monstrances on Upper Gallery
  [-0.2, 1.25, 2.45].forEach((vx, vIdx) => {
    const pedestal = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.58, 0.68), trimMat);
    pedestal.position.set(vx, H1 + 0.38, -1.95);
    floor2Group.add(pedestal);

    const glassCase = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.65, 0.62),
      mat(0xbae6fd, 0.15, 0.1, 0.38)
    );
    glassCase.position.set(vx, H1 + 0.98, -1.95);
    floor2Group.add(glassCase);

    const reliquary = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.18, 0),
      vIdx === 1 ? emissiveMat(0xfacc15, 0.95) : goldMat
    );
    reliquary.position.set(vx, H1 + 0.95, -1.95);
    floor2Group.add(reliquary);
  });

  // Hanging Golden Sanctuary Chandeliers
  [-1.95, 1.25].forEach((cx) => {
    const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.95, 6), goldMat);
    chain.position.set(cx, H1 + H2 - 0.48, 0);
    floor2Group.add(chain);
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.04, 8, 16), emissiveMat(0xfde047, 0.95));
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(cx, H1 + H2 - 0.95, 0);
    floor2Group.add(wheel);
  });

  scene.scale.setScalar(0.95);
  return scene;
}

// ============================================================================
// MAIN DISPATCHER FOR EXTERIOR CATHEDRALS (BD-151 to BD-160)
// ============================================================================
export function buildWorldFamousCathedralScene(
  island: IslandMetadata,
  variant: IslandVariant = 'classic'
): THREE.Group {
  const scene = new THREE.Group();
  const bdMatch = island.id.match(/BD-(\d+)/i);
  const bdNum = bdMatch ? parseInt(bdMatch[1], 10) : 151;
  const cathedralIdx = Math.max(1, Math.min(10, bdNum - 150));

  switch (cathedralIdx) {
    case 1:
      buildStPetersBasilica(scene);
      break;
    case 2:
      buildNotreDameDeParis(scene);
      break;
    case 3:
      buildSagradaFamilia(scene);
      break;
    case 4:
      buildDuomoDiMilano(scene);
      break;
    case 5:
      buildFlorenceDuomo(scene);
      break;
    case 6:
      buildCologneCathedral(scene);
      break;
    case 7:
      buildSaintBasilsCathedral(scene);
      break;
    case 8:
      buildHagiaSophia(scene);
      break;
    case 9:
      buildWestminsterAbbey(scene);
      break;
    case 10:
      buildHallgrimskirkja(scene);
      break;
  }

  // Tag all exterior meshes so they belong cleanly to floor_2_group / exterior shell
  const exteriorWrapper = new THREE.Group();
  exteriorWrapper.name = 'floor_2_group';
  while (scene.children.length > 0) {
    exteriorWrapper.add(scene.children[0]);
  }
  scene.add(exteriorWrapper);

  // Embed the paired 2-story cathedral sanctuary interior for cutaway floor inspection ('1f_only' / '2f_only')
  // Hidden in 'all' mode so the exterior cathedral silhouette is 100% pure with zero protruding boxes
  const pairedDollhouseIsland: IslandMetadata = {
    ...island,
    id: `diorama_dollhouse_${42 + cathedralIdx}`,
  };
  const embeddedInterior = buildWorldCathedralInteriorScene(pairedDollhouseIsland, variant);
  embeddedInterior.scale.setScalar(0.45);
  embeddedInterior.position.set(0, 0.25, 0);
  embeddedInterior.userData.isEmbeddedCutawayInterior = true;
  embeddedInterior.visible = false;
  scene.add(embeddedInterior);

  return scene;
}
