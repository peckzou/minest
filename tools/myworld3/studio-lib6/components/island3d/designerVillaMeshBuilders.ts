import * as THREE from 'three';
import { IslandMetadata } from '../../types/island';
import { DESIGNER_VILLA_SEEDS, DesignerVillaSeed } from '../../data/designerVillasData';

// ============================================================================
// MATERIAL & GEOMETRY HELPERS
// ============================================================================
function stdMat(
  color: number | string,
  roughness = 0.65,
  metalness = 0.08,
  opacity = 1.0,
  emissive: number | string = 0x000000,
  emissiveIntensity = 0
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness,
    metalness,
    transparent: opacity < 1.0,
    opacity,
    emissive: new THREE.Color(emissive),
    emissiveIntensity,
  });
}

function addBox(
  parent: THREE.Object3D,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  color: number | string,
  opts: {
    roughness?: number;
    metalness?: number;
    opacity?: number;
    emissive?: number | string;
    emissiveIntensity?: number;
    rotX?: number;
    rotY?: number;
    rotZ?: number;
  } = {}
): THREE.Mesh {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = stdMat(
    color,
    opts.roughness ?? 0.65,
    opts.metalness ?? 0.08,
    opts.opacity ?? 1.0,
    opts.emissive ?? 0x000000,
    opts.emissiveIntensity ?? 0
  );
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  if (opts.rotX) mesh.rotation.x = opts.rotX;
  if (opts.rotY) mesh.rotation.y = opts.rotY;
  if (opts.rotZ) mesh.rotation.z = opts.rotZ;
  mesh.castShadow = (opts.opacity ?? 1) > 0.5;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addCyl(
  parent: THREE.Object3D,
  rTop: number,
  rBot: number,
  h: number,
  x: number,
  y: number,
  z: number,
  color: number | string,
  segs = 16,
  opts: {
    roughness?: number;
    metalness?: number;
    opacity?: number;
    emissive?: number | string;
    emissiveIntensity?: number;
    rotX?: number;
    rotY?: number;
    rotZ?: number;
  } = {}
): THREE.Mesh {
  const geo = new THREE.CylinderGeometry(rTop, rBot, h, segs);
  const mat = stdMat(
    color,
    opts.roughness ?? 0.6,
    opts.metalness ?? 0.1,
    opts.opacity ?? 1.0,
    opts.emissive ?? 0x000000,
    opts.emissiveIntensity ?? 0
  );
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  if (opts.rotX) mesh.rotation.x = opts.rotX;
  if (opts.rotY) mesh.rotation.y = opts.rotY;
  if (opts.rotZ) mesh.rotation.z = opts.rotZ;
  mesh.castShadow = (opts.opacity ?? 1) > 0.5;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addSphere(
  parent: THREE.Object3D,
  r: number,
  x: number,
  y: number,
  z: number,
  color: number | string,
  opts: {
    roughness?: number;
    metalness?: number;
    opacity?: number;
    emissive?: number | string;
    emissiveIntensity?: number;
    scaleX?: number;
    scaleY?: number;
    scaleZ?: number;
    phiLength?: number;
  } = {}
): THREE.Mesh {
  const geo = new THREE.SphereGeometry(r, 18, 14, 0, Math.PI * 2, 0, opts.phiLength ?? Math.PI);
  const mat = stdMat(
    color,
    opts.roughness ?? 0.55,
    opts.metalness ?? 0.12,
    opts.opacity ?? 1.0,
    opts.emissive ?? 0x000000,
    opts.emissiveIntensity ?? 0
  );
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.scale.set(opts.scaleX ?? 1, opts.scaleY ?? 1, opts.scaleZ ?? 1);
  mesh.castShadow = (opts.opacity ?? 1) > 0.5;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addCone(
  parent: THREE.Object3D,
  r: number,
  h: number,
  x: number,
  y: number,
  z: number,
  color: number | string,
  segs = 8,
  rotY = 0,
  metalness = 0.12
): THREE.Mesh {
  const geo = new THREE.ConeGeometry(r, h, segs);
  const mat = stdMat(color, 0.55, metalness);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.rotation.y = rotY;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addPitchedRoof(
  parent: THREE.Object3D,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  color: number | string,
  rotY = 0,
  gableWallColor?: number | string,
  bargeboardColor?: number | string
): THREE.Group {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = rotY;

  const halfW = w / 2;
  const slopeLen = Math.hypot(halfW, h) + 0.12;
  const angle = Math.atan2(h, halfW);

  // Left and Right roof slopes
  addBox(g, slopeLen, 0.1, d + 0.16, -halfW / 2, h / 2, 0, color, { rotZ: angle, roughness: 0.65 });
  addBox(g, slopeLen, 0.1, d + 0.16, halfW / 2, h / 2, 0, color, { rotZ: -angle, roughness: 0.65 });
  // Ridge cap
  addBox(g, 0.14, 0.12, d + 0.2, 0, h + 0.02, 0, bargeboardColor ?? color, { metalness: 0.2 });

  // Stepped triangular gable fill so there is never an empty gap under the pitched roof
  if (gableWallColor !== undefined) {
    const steps = 6;
    for (let i = 0; i < steps; i++) {
      const frac = i / steps;
      const stepW = Math.max(0.12, w * (1 - frac) - 0.08);
      const stepH = h / steps + 0.02;
      const sy = (i + 0.5) * (h / steps);
      addBox(g, stepW, stepH, d - 0.04, 0, sy, 0, gableWallColor, { roughness: 0.7 });
    }
  }

  // Carved bargeboards on front & back gable edges
  if (bargeboardColor !== undefined) {
    for (const zSide of [-d / 2 - 0.06, d / 2 + 0.06]) {
      addBox(g, slopeLen + 0.06, 0.09, 0.06, -halfW / 2, h / 2 - 0.02, zSide, bargeboardColor, { rotZ: angle });
      addBox(g, slopeLen + 0.06, 0.09, 0.06, halfW / 2, h / 2 - 0.02, zSide, bargeboardColor, { rotZ: -angle });
      // Gable apex finial & kingpost drop pendant
      addCyl(g, 0.03, 0.03, 0.36, 0, h + 0.1, zSide, bargeboardColor, 8);
      addSphere(g, 0.055, 0, h + 0.28, zSide, 0xd4af37, { metalness: 0.7, roughness: 0.25 });
    }
  }

  parent.add(g);
  return g;
}

function addHippedRoof(
  parent: THREE.Object3D,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  color: number | string,
  trimColor?: number | string
): THREE.Group {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  const tiers = 7;
  for (let i = 0; i < tiers; i++) {
    const t = i / tiers;
    const nextT = (i + 1) / tiers;
    const tw = w * (1 - t * 0.62);
    const td = d * (1 - t * 0.62);
    const th = (h / tiers) + 0.02;
    const ty = (t + nextT) * 0.5 * h;
    addBox(g, tw, th, td, 0, ty, 0, color, { roughness: 0.65 });
  }
  // Top ridge beam + finials
  const ridgeW = Math.max(0.3, w * 0.36);
  addBox(g, ridgeW, 0.1, 0.12, 0, h + 0.03, 0, trimColor ?? 0xd4af37, { metalness: 0.35 });
  addSphere(g, 0.06, -ridgeW / 2, h + 0.1, 0, 0xd4af37, { metalness: 0.7, roughness: 0.25 });
  addSphere(g, 0.06, ridgeW / 2, h + 0.1, 0, 0xd4af37, { metalness: 0.7, roughness: 0.25 });
  parent.add(g);
  return g;
}

// ============================================================================
// HIGH-CRAFT CLASSICAL ARCHITECTURAL SUB-BUILDERS
// ============================================================================

/**
 * Alternating corner stone blocks (Quoins) on all 4 vertical edges of a building mass
 */
function addCornerQuoins(
  parent: THREE.Object3D,
  cx: number,
  by: number,
  cz: number,
  w: number,
  h: number,
  d: number,
  color: number | string,
  courses = 9
) {
  const stepH = h / courses;
  const bh = stepH * 0.78;
  for (let i = 0; i < courses; i++) {
    const y = by + (i + 0.5) * stepH;
    const isLongX = i % 2 === 0;
    const qx = isLongX ? 0.26 : 0.16;
    const qz = isLongX ? 0.16 : 0.26;
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        addBox(
          parent,
          qx,
          bh,
          qz,
          cx + sx * (w / 2 - qx / 2 + 0.035),
          y,
          cz + sz * (d / 2 - qz / 2 + 0.035),
          color,
          { roughness: 0.55 }
        );
      }
    }
  }
}

/**
 * Multi-tier molded cornice with 3D dentil frieze around a building perimeter
 */
function addMoldedCornice(
  parent: THREE.Object3D,
  cx: number,
  y: number,
  cz: number,
  w: number,
  d: number,
  color: number | string,
  dentilColor?: number | string
) {
  // Lower architrave band
  addBox(parent, w + 0.12, 0.07, d + 0.12, cx, y - 0.05, cz, color, { roughness: 0.5 });
  // Upper projecting crown molding
  addBox(parent, w + 0.26, 0.09, d + 0.26, cx, y + 0.04, cz, color, { roughness: 0.45 });
  // 3D Dentil blocks along front and back
  const dc = dentilColor ?? color;
  const numX = Math.max(4, Math.floor(w / 0.24));
  for (let i = 0; i <= numX; i++) {
    const dx = cx - w / 2 + (i / numX) * w;
    addBox(parent, 0.08, 0.06, 0.07, dx, y - 0.01, cz + d / 2 + 0.06, dc);
    addBox(parent, 0.08, 0.06, 0.07, dx, y - 0.01, cz - d / 2 - 0.06, dc);
  }
  const numZ = Math.max(3, Math.floor(d / 0.24));
  for (let i = 1; i < numZ; i++) {
    const dz = cz - d / 2 + (i / numZ) * d;
    addBox(parent, 0.07, 0.06, 0.08, cx + w / 2 + 0.06, y - 0.01, dz, dc);
    addBox(parent, 0.07, 0.06, 0.08, cx - w / 2 - 0.06, y - 0.01, dz, dc);
  }
}

/**
 * Rich Classical Window with outer casing, muntin grid, pediment/arch, shutters & flower box
 */
function addClassicalWindow(
  parent: THREE.Object3D,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  opts: {
    rotY?: number;
    frameColor?: number | string;
    glassColor?: number | string;
    shutterColor?: number | string;
    pediment?: 'triangular' | 'segmental' | 'keystone' | 'gothic' | 'none';
    flowerBoxColor?: number | string;
    warmGlow?: boolean;
  } = {}
) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  if (opts.rotY) g.rotation.y = opts.rotY;

  const fc = opts.frameColor ?? 0xffffff;
  const gc = opts.glassColor ?? 0x1e3a5f;
  const emissive = opts.warmGlow !== false ? 0xfef3c7 : 0x000000;
  const emissiveInt = opts.warmGlow !== false ? 0.22 : 0;

  // Recessed glass pane
  addBox(g, w - 0.06, h - 0.06, 0.04, 0, 0, 0.01, gc, {
    roughness: 0.12,
    metalness: 0.75,
    emissive,
    emissiveIntensity: emissiveInt,
  });

  // Outer architrave casing (left, right, top)
  addBox(g, 0.055, h + 0.04, 0.07, -w / 2 - 0.01, 0, 0.025, fc, { roughness: 0.5 });
  addBox(g, 0.055, h + 0.04, 0.07, w / 2 + 0.01, 0, 0.025, fc, { roughness: 0.5 });
  addBox(g, w + 0.12, 0.06, 0.08, 0, h / 2 + 0.02, 0.03, fc, { roughness: 0.5 });

  // Projecting windowsill + 2 stone corbel brackets
  addBox(g, w + 0.16, 0.055, 0.11, 0, -h / 2 - 0.02, 0.04, fc, { roughness: 0.5 });
  addBox(g, 0.05, 0.07, 0.07, -w / 2 + 0.05, -h / 2 - 0.06, 0.035, fc);
  addBox(g, 0.05, 0.07, 0.07, w / 2 - 0.05, -h / 2 - 0.06, 0.035, fc);

  // Fine window muntins (vertical & horizontal dividers)
  addBox(g, 0.022, h - 0.06, 0.055, 0, 0, 0.025, fc);
  addBox(g, w - 0.06, 0.022, 0.055, 0, 0.06, 0.025, fc);
  if (h >= 0.48) {
    addBox(g, w - 0.06, 0.02, 0.055, 0, -h * 0.22, 0.025, fc);
  }

  // Top Pediment / Arch
  const ped = opts.pediment ?? 'triangular';
  if (ped === 'triangular') {
    const pw = w + 0.18;
    const ph = 0.14;
    const slope = Math.hypot(pw / 2, ph);
    const ang = Math.atan2(ph, pw / 2);
    addBox(g, slope, 0.045, 0.09, -pw / 4, h / 2 + 0.05 + ph / 2, 0.04, fc, { rotZ: ang });
    addBox(g, slope, 0.045, 0.09, pw / 4, h / 2 + 0.05 + ph / 2, 0.04, fc, { rotZ: -ang });
    addBox(g, pw * 0.7, 0.06, 0.06, 0, h / 2 + 0.07, 0.025, fc);
  } else if (ped === 'segmental') {
    addCyl(g, w * 0.55, w * 0.55, 0.08, 0, h / 2 + 0.03, 0.03, fc, 12, { rotX: Math.PI / 2 });
    addBox(g, 0.07, 0.1, 0.09, 0, h / 2 + 0.1, 0.045, 0xd4af37, { metalness: 0.4 });
  } else if (ped === 'keystone') {
    addBox(g, 0.08, 0.11, 0.095, 0, h / 2 + 0.05, 0.045, fc);
  } else if (ped === 'gothic') {
    addCone(g, w * 0.55, 0.22, 0, h / 2 + 0.11, 0.03, fc, 4, Math.PI / 4);
    addSphere(g, 0.04, 0, h / 2 + 0.23, 0.04, 0xd4af37, { metalness: 0.6 });
  }

  // Paired Louvered Shutters
  if (opts.shutterColor !== undefined) {
    const sw = Math.max(0.11, w * 0.38);
    for (const side of [-1, 1]) {
      const sx = side * (w / 2 + sw / 2 + 0.025);
      addBox(g, sw, h, 0.035, sx, 0, 0.025, opts.shutterColor, { roughness: 0.6 });
      // Louver slats
      for (let sl = -2; sl <= 2; sl++) {
        addBox(g, sw - 0.03, 0.018, 0.045, sx, sl * (h * 0.16), 0.03, opts.shutterColor);
      }
    }
  }

  // Flower Box with greenery & blossoms
  if (opts.flowerBoxColor !== undefined) {
    addBox(g, w + 0.04, 0.08, 0.1, 0, -h / 2 - 0.05, 0.07, 0x5c3a21);
    addBox(g, w + 0.02, 0.06, 0.09, 0, -h / 2 + 0.0, 0.075, 0x15803d);
    for (let f = -1.5; f <= 1.5; f += 1) {
      addSphere(g, 0.038, f * (w * 0.24), -h / 2 + 0.035, 0.09, opts.flowerBoxColor);
    }
  }

  parent.add(g);
}

/**
 * Projecting 3-sided polygonal Bay / Oriel Window (1-story or 2-story)
 */
function addBayWindow(
  parent: THREE.Object3D,
  x: number,
  by: number,
  z: number,
  w: number,
  h: number,
  d: number,
  wallColor: number | string,
  trimColor: number | string,
  roofColor: number | string,
  rotY = 0,
  stories: 1 | 2 = 1
) {
  const g = new THREE.Group();
  g.position.set(x, by, z);
  g.rotation.y = rotY;

  // Main polygonal core + angled flanks
  addBox(g, w * 0.56, h, d, 0, h / 2, d / 2, wallColor);
  addBox(g, w * 0.34, h, d * 0.85, -w * 0.34, h / 2, d * 0.35, wallColor, { rotY: 0.45 });
  addBox(g, w * 0.34, h, d * 0.85, w * 0.34, h / 2, d * 0.35, wallColor, { rotY: -0.45 });

  // Base plinth & top cornice
  addBox(g, w * 0.92, 0.14, d + 0.06, 0, 0.07, d * 0.45, trimColor);
  addBox(g, w * 0.96, 0.1, d + 0.1, 0, h, d * 0.45, trimColor);

  // Windows on each story
  const levels = stories === 2 ? [h * 0.27, h * 0.74] : [h * 0.52];
  const winH = stories === 2 ? h * 0.34 : h * 0.56;
  for (const wy of levels) {
    // Center window
    addClassicalWindow(g, 0, wy, d + 0.01, w * 0.42, winH, {
      frameColor: trimColor,
      pediment: 'none',
    });
    // Angled side windows
    addClassicalWindow(g, -w * 0.37, wy, d * 0.62, w * 0.22, winH, {
      rotY: -0.48,
      frameColor: trimColor,
      pediment: 'none',
    });
    addClassicalWindow(g, w * 0.37, wy, d * 0.62, w * 0.22, winH, {
      rotY: 0.48,
      frameColor: trimColor,
      pediment: 'none',
    });
  }
  if (stories === 2) {
    addBox(g, w * 0.92, 0.09, d + 0.06, 0, h * 0.5, d * 0.45, trimColor);
  }

  // Faceted hood roof + finial
  addCone(g, w * 0.56, 0.38, 0, h + 0.22, d * 0.42, roofColor, 6, Math.PI / 6);
  addSphere(g, 0.045, 0, h + 0.43, d * 0.42, 0xd4af37, { metalness: 0.7, roughness: 0.25 });

  parent.add(g);
}

/**
 * Classical Temple Portico with Fluted Columns, Capitals, Entablature & Triangular Pediment
 */
function addClassicalPortico(
  parent: THREE.Object3D,
  cx: number,
  by: number,
  z: number,
  w: number,
  h: number,
  d: number,
  colColor: number | string,
  roofColor: number | string,
  opts: {
    numCols?: number;
    rotY?: number;
    hasPediment?: boolean;
    hasBalcony?: boolean;
    tympanumColor?: number | string;
    goldAccent?: boolean;
  } = {}
) {
  const g = new THREE.Group();
  g.position.set(cx, by, z);
  if (opts.rotY) g.rotation.y = opts.rotY;

  const numCols = opts.numCols ?? 4;
  // Stepped podium + front stairs
  addBox(g, w + 0.2, 0.18, d + 0.16, 0, 0.09, 0, colColor);
  for (let s = 0; s < 3; s++) {
    addBox(g, w * 0.68, 0.06, 0.22, 0, 0.03 + s * 0.055, d / 2 + 0.28 - s * 0.1, colColor);
  }

  // Columns with plinths, torus bases, shafts & capitals
  const colH = h - 0.36;
  for (let i = 0; i < numCols; i++) {
    const frac = numCols === 1 ? 0.5 : i / (numCols - 1);
    const xPos = -w / 2 + 0.16 + frac * (w - 0.32);
    const zPos = d / 2 - 0.1;
    // Square plinth & torus base
    addBox(g, 0.22, 0.1, 0.22, xPos, 0.23, zPos, colColor);
    addCyl(g, 0.095, 0.11, 0.06, xPos, 0.31, zPos, colColor, 14);
    // Column shaft
    addCyl(g, 0.075, 0.088, colH - 0.22, xPos, 0.18 + colH / 2, zPos, colColor, 16, { roughness: 0.4 });
    // Corinthian/Ionic Capital
    addCyl(g, 0.115, 0.078, 0.1, xPos, 0.18 + colH - 0.06, zPos, opts.goldAccent ? 0xd4af37 : colColor, 12);
    addBox(g, 0.22, 0.05, 0.22, xPos, 0.18 + colH, zPos, colColor);
  }

  // Entablature & Dentil Cornice
  addBox(g, w + 0.16, 0.2, d + 0.12, 0, h - 0.08, 0, colColor);
  addMoldedCornice(g, 0, h + 0.02, 0, w + 0.16, d + 0.12, colColor);

  // Pediment with relief oculus
  if (opts.hasPediment !== false) {
    const pedH = Math.min(0.68, w * 0.28);
    addPitchedRoof(
      g,
      w + 0.28,
      pedH,
      d + 0.16,
      0,
      h + 0.05,
      0,
      roofColor,
      0,
      opts.tympanumColor ?? colColor,
      colColor
    );
    // Sculpted circular oculus / heraldic crest inside tympanum
    addCyl(g, 0.15, 0.15, 0.06, 0, h + 0.05 + pedH * 0.42, d / 2 + 0.08, 0xd4af37, 16, {
      rotX: Math.PI / 2,
      metalness: 0.65,
      roughness: 0.25,
    });
    addCyl(g, 0.1, 0.1, 0.07, 0, h + 0.05 + pedH * 0.42, d / 2 + 0.08, 0x1e3a5f, 14, {
      rotX: Math.PI / 2,
      metalness: 0.8,
    });
  }

  // Optional 2F Balustrade Balcony on top of portico
  if (opts.hasBalcony) {
    addBalustrade(g, -w / 2, d / 2, w / 2, d / 2, h + 0.06, 0.24, colColor, 0.18);
    addBalustrade(g, -w / 2, -d / 2, -w / 2, d / 2, h + 0.06, 0.24, colColor, 0.18);
    addBalustrade(g, w / 2, -d / 2, w / 2, d / 2, h + 0.06, 0.24, colColor, 0.18);
  }

  parent.add(g);
}

/**
 * Grand Classical Entrance Portal with Double Paneled Doors, Fanlight Transom & Carriage Lanterns
 */
function addGrandEntranceDoor(
  parent: THREE.Object3D,
  x: number,
  by: number,
  z: number,
  w: number,
  h: number,
  doorColor: number | string,
  trimColor: number | string,
  rotY = 0
) {
  const g = new THREE.Group();
  g.position.set(x, by, z);
  g.rotation.y = rotY;

  // Stone pilaster jambs & lintel
  addBox(g, 0.1, h + 0.1, 0.12, -w / 2 - 0.04, h / 2, 0.03, trimColor);
  addBox(g, 0.1, h + 0.1, 0.12, w / 2 + 0.04, h / 2, 0.03, trimColor);
  addBox(g, w + 0.28, 0.1, 0.15, 0, h + 0.04, 0.04, trimColor);

  // Double leaf hardwood doors + recessed panels + brass handles
  const leafW = w / 2 - 0.015;
  for (const side of [-1, 1]) {
    const lx = side * (leafW / 2 + 0.008);
    addBox(g, leafW, h, 0.06, lx, h / 2, 0.01, doorColor, { roughness: 0.45 });
    addBox(g, leafW * 0.68, h * 0.34, 0.075, lx, h * 0.72, 0.015, doorColor);
    addBox(g, leafW * 0.68, h * 0.34, 0.075, lx, h * 0.26, 0.015, doorColor);
    // Brass door knocker / handle
    addSphere(g, 0.025, side * 0.06, h * 0.48, 0.055, 0xd4af37, { metalness: 0.85, roughness: 0.2 });
  }

  // Semicircular glass Fanlight transom above door
  const fanR = w * 0.48;
  addCyl(g, fanR, fanR, 0.08, 0, h + 0.08, 0.03, trimColor, 16, { rotX: Math.PI / 2 });
  addCyl(g, fanR * 0.82, fanR * 0.82, 0.09, 0, h + 0.08, 0.035, 0xfef08a, 14, {
    rotX: Math.PI / 2,
    emissive: 0xfef08a,
    emissiveIntensity: 0.35,
  });

  // Twin Carriage Lanterns flanking the entrance
  for (const side of [-1, 1]) {
    const lx = side * (w / 2 + 0.2);
    const ly = h * 0.68;
    addBox(g, 0.04, 0.04, 0.12, lx, ly, 0.06, 0x1e293b, { metalness: 0.7 });
    addCyl(g, 0.055, 0.04, 0.14, lx, ly + 0.05, 0.11, 0xfef08a, 6, {
      emissive: 0xfef08a,
      emissiveIntensity: 0.7,
    });
    addCone(g, 0.07, 0.07, lx, ly + 0.14, 0.11, 0x1e293b, 6);
  }

  parent.add(g);
}

/**
 * Stone or Timber Balustrade with Corner Newel Posts, Ball Finials & Turned Balusters
 */
function addBalustrade(
  parent: THREE.Object3D,
  x1: number,
  z1: number,
  x2: number,
  z2: number,
  by: number,
  h: number,
  color: number | string,
  spacing = 0.18,
  withUrns = false
) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const len = Math.hypot(dx, dz);
  if (len < 0.08) return;
  const ang = Math.atan2(dx, dz);
  const mx = (x1 + x2) / 2;
  const mz = (z1 + z2) / 2;

  // Bottom plinth rail & top handrail
  addBox(parent, 0.09, 0.045, len, mx, by + 0.022, mz, color, { rotY: ang });
  addBox(parent, 0.1, 0.045, len + 0.04, mx, by + h - 0.022, mz, color, { rotY: ang });

  // End Newel Posts + Finials
  for (const [px, pz] of [
    [x1, z1],
    [x2, z2],
  ]) {
    addBox(parent, 0.13, h + 0.05, 0.13, px, by + (h + 0.05) / 2, pz, color);
    if (withUrns) {
      addCyl(parent, 0.065, 0.035, 0.12, px, by + h + 0.11, pz, color, 10);
      addSphere(parent, 0.055, px, by + h + 0.19, pz, 0xd4af37, { metalness: 0.5 });
    } else {
      addSphere(parent, 0.05, px, by + h + 0.09, pz, color);
    }
  }

  // Turned Balusters
  const count = Math.max(2, Math.floor(len / spacing));
  for (let i = 1; i < count; i++) {
    const t = i / count;
    const bx = x1 + dx * t;
    const bz = z1 + dz * t;
    addCyl(parent, 0.028, 0.034, h - 0.08, bx, by + h / 2, bz, color, 8);
  }
}

/**
 * Projecting Roof Dormer Window with Cheeks, Mullioned Pane & Pitched/Curved Rooflet
 */
function addDormerWindow(
  parent: THREE.Object3D,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
  wallColor: number | string,
  roofColor: number | string,
  trimColor: number | string,
  rotY = 0,
  style: 'pitched' | 'bullseye' = 'pitched'
) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = rotY;

  addBox(g, w, h, d, 0, h / 2, 0, wallColor);
  if (style === 'bullseye') {
    // Baroque round bullseye dormer (Œil-de-bœuf)
    addCyl(g, w * 0.52, w * 0.52, d + 0.06, 0, h * 0.85, 0, trimColor, 14, { rotX: Math.PI / 2 });
    addCyl(g, w * 0.36, w * 0.36, d + 0.09, 0, h * 0.85, 0.01, 0x1e3a5f, 12, {
      rotX: Math.PI / 2,
      emissive: 0xfef3c7,
      emissiveIntensity: 0.25,
    });
    addSphere(g, 0.04, 0, h * 1.38, d / 2, 0xd4af37, { metalness: 0.7 });
  } else {
    addClassicalWindow(g, 0, h * 0.48, d / 2 + 0.01, w * 0.68, h * 0.68, {
      frameColor: trimColor,
      pediment: 'none',
    });
    addPitchedRoof(g, w + 0.12, 0.22, d + 0.1, 0, h, 0, roofColor, 0, wallColor, trimColor);
  }

  parent.add(g);
}

/**
 * Ornate Brick/Stone Chimney Stack with Corbeled Crown & Terracotta Chimney Pots
 */
function addOrnateChimney(
  parent: THREE.Object3D,
  x: number,
  by: number,
  z: number,
  w: number,
  h: number,
  d: number,
  brickColor: number | string,
  trimColor: number | string,
  numPots = 2
) {
  addBox(parent, w, h, d, x, by + h / 2, z, brickColor, { roughness: 0.75 });
  // Corbeled stone neck & crown
  addBox(parent, w + 0.08, 0.07, d + 0.08, x, by + h - 0.1, z, trimColor);
  addBox(parent, w + 0.14, 0.09, d + 0.14, x, by + h, z, brickColor);
  // Terracotta chimney pots
  for (let i = 0; i < numPots; i++) {
    const px = numPots === 1 ? x : x - w * 0.24 + (i / (numPots - 1)) * (w * 0.48);
    addCyl(parent, 0.055, 0.065, 0.22, px, by + h + 0.14, z, 0xb45309, 10);
    addCyl(parent, 0.07, 0.06, 0.04, px, by + h + 0.25, z, trimColor, 10);
  }
}

/**
 * Octagonal Victorian / Normandy Tower with Windows, Cornice & Conical Witch-Hat Spire
 */
function addVictorianTurret(
  parent: THREE.Object3D,
  x: number,
  by: number,
  z: number,
  radius: number,
  h: number,
  spireH: number,
  wallColor: number | string,
  trimColor: number | string,
  roofColor: number | string,
  onionDome = false
) {
  const g = new THREE.Group();
  g.position.set(x, by, z);

  // Base plinth
  addCyl(g, radius * 1.08, radius * 1.12, 0.24, 0, 0.12, 0, trimColor, 8);
  // Octagonal shaft
  addCyl(g, radius, radius, h, 0, h / 2, 0, wallColor, 8);

  // Belt courses at 1F, 2F, and top cornice
  addCyl(g, radius * 1.07, radius * 1.07, 0.09, 0, h * 0.36, 0, trimColor, 8);
  addCyl(g, radius * 1.07, radius * 1.07, 0.09, 0, h * 0.68, 0, trimColor, 8);
  addCyl(g, radius * 1.14, radius * 1.06, 0.14, 0, h, 0, trimColor, 8);

  // Windows on 3 front-facing octagonal facets across 2-3 levels
  const angles = [-Math.PI / 4, 0, Math.PI / 4];
  const levels = [h * 0.2, h * 0.52, h * 0.82];
  for (const ang of angles) {
    for (const wy of levels) {
      const wx = Math.sin(ang) * (radius * 0.92);
      const wz = Math.cos(ang) * (radius * 0.92);
      addClassicalWindow(g, wx, wy, wz, radius * 0.48, 0.42, {
        rotY: ang,
        frameColor: trimColor,
        pediment: wy > h * 0.7 ? 'triangular' : 'none',
      });
    }
  }

  // Spire or Onion Dome
  if (onionDome) {
    addSphere(g, radius * 1.06, 0, h + radius * 0.7, 0, roofColor, {
      scaleY: 1.15,
      metalness: 0.55,
      roughness: 0.3,
    });
    addCone(g, radius * 0.45, spireH * 0.55, 0, h + radius * 1.45, 0, roofColor, 12, 0, 0.55);
    addCyl(g, 0.02, 0.025, 0.36, 0, h + radius * 1.85, 0, 0xd4af37, 8, { metalness: 0.85 });
    addSphere(g, 0.06, 0, h + radius * 2.02, 0, 0xd4af37, { metalness: 0.85, roughness: 0.2 });
  } else {
    addCone(g, radius * 1.18, spireH, 0, h + spireH / 2 + 0.05, 0, roofColor, 8, Math.PI / 8);
    // Gold weathervane finial
    addCyl(g, 0.02, 0.025, 0.38, 0, h + spireH + 0.22, 0, 0xd4af37, 8, { metalness: 0.85 });
    addSphere(g, 0.06, 0, h + spireH + 0.4, 0, 0xd4af37, { metalness: 0.85, roughness: 0.2 });
  }

  parent.add(g);
}

/**
 * Tudor / Normandy Half-Timbering Panel (Vertical Studs + Horizontal Rails + Diagonal X-Bracing)
 */
function addHalfTimberWallPanel(
  parent: THREE.Object3D,
  cx: number,
  cy: number,
  cz: number,
  w: number,
  h: number,
  timberColor: number | string,
  rotY = 0
) {
  const g = new THREE.Group();
  g.position.set(cx, cy, cz);
  g.rotation.y = rotY;

  const t = 0.055;
  // Top, middle & bottom horizontal beams
  addBox(g, w, t, t, 0, h / 2 - t / 2, 0, timberColor);
  addBox(g, w, t, t, 0, 0, 0, timberColor);
  addBox(g, w, t, t, 0, -h / 2 + t / 2, 0, timberColor);

  // Vertical studs + X diagonal braces in outer bays
  const bays = Math.max(3, Math.round(w / 0.65));
  const bayW = w / bays;
  for (let i = 0; i <= bays; i++) {
    const xPos = -w / 2 + i * bayW;
    addBox(g, t, h, t, xPos, 0, 0, timberColor);
    if (i < bays && (i === 0 || i === bays - 1 || i % 2 === 1)) {
      const diagLen = Math.hypot(bayW, h / 2) - 0.04;
      const ang = Math.atan2(h / 2, bayW);
      addBox(g, diagLen, t * 0.8, t * 0.9, xPos + bayW / 2, h / 4, 0, timberColor, { rotZ: ang });
      addBox(g, diagLen, t * 0.8, t * 0.9, xPos + bayW / 2, h / 4, 0, timberColor, { rotZ: -ang });
      addBox(g, diagLen, t * 0.8, t * 0.9, xPos + bayW / 2, -h / 4, 0, timberColor, { rotZ: ang });
      addBox(g, diagLen, t * 0.8, t * 0.9, xPos + bayW / 2, -h / 4, 0, timberColor, { rotZ: -ang });
    }
  }

  parent.add(g);
}

/**
 * True 3D Classical / Moorish / Gothic Arch Arcade Loggia
 */
function addArchLoggia(
  parent: THREE.Object3D,
  cx: number,
  by: number,
  cz: number,
  length: number,
  height: number,
  depth: number,
  numArches: number,
  wallColor: number | string,
  colColor: number | string,
  rotY = 0,
  archStyle: 'roman' | 'horseshoe' | 'gothic' = 'roman'
) {
  const g = new THREE.Group();
  g.position.set(cx, by, cz);
  g.rotation.y = rotY;

  const bayW = length / numArches;
  const colH = height * 0.68;

  // Upper entablature spandrel band
  addBox(g, length + 0.14, height * 0.26, depth, 0, height - height * 0.13, 0, wallColor);
  addBox(g, length + 0.22, 0.08, depth + 0.1, 0, height, 0, colColor);

  for (let i = 0; i <= numArches; i++) {
    const xPos = -length / 2 + i * bayW;
    // Column plinth, shaft & capital
    addBox(g, 0.18, 0.12, 0.18, xPos, 0.06, depth / 2 - 0.08, colColor);
    addCyl(g, 0.065, 0.075, colH, xPos, 0.12 + colH / 2, depth / 2 - 0.08, colColor, 14);
    addBox(g, 0.2, 0.08, 0.2, xPos, 0.12 + colH, depth / 2 - 0.08, colColor);

    if (i < numArches) {
      const archCx = xPos + bayW / 2;
      // Arch ring & keystone
      if (archStyle === 'horseshoe') {
        addCyl(g, bayW * 0.44, bayW * 0.44, 0.14, archCx, 0.12 + colH + 0.06, depth / 2 - 0.06, colColor, 16, {
          rotX: Math.PI / 2,
        });
        // Alfiz rectangular frame
        addBox(g, bayW - 0.04, 0.04, 0.16, archCx, height - 0.06, depth / 2 - 0.04, 0xd4af37);
      } else if (archStyle === 'gothic') {
        addCone(g, bayW * 0.46, 0.34, archCx, 0.12 + colH + 0.16, depth / 2 - 0.06, colColor, 4, Math.PI / 4);
        // Quatrefoil oculus above gothic arch
        addCyl(g, 0.11, 0.11, 0.16, archCx, height - 0.14, depth / 2 - 0.05, colColor, 12, {
          rotX: Math.PI / 2,
        });
      } else {
        addCyl(g, bayW * 0.42, bayW * 0.42, 0.14, archCx, 0.12 + colH + 0.04, depth / 2 - 0.06, colColor, 14, {
          rotX: Math.PI / 2,
        });
        // Keystone
        addBox(g, 0.08, 0.14, 0.18, archCx, height - 0.12, depth / 2 - 0.04, colColor);
      }
    }
  }

  parent.add(g);
}

/**
 * Dutch / Baroque / Huizhou Stepped Gable with Stone Coping & Finials
 */
function addSteppedGable(
  parent: THREE.Object3D,
  cx: number,
  by: number,
  cz: number,
  w: number,
  h: number,
  thickness: number,
  wallColor: number | string,
  trimColor: number | string,
  rotY = 0,
  steps = 5
) {
  const g = new THREE.Group();
  g.position.set(cx, by, cz);
  g.rotation.y = rotY;

  const stepH = h / steps;
  for (let i = 0; i < steps; i++) {
    const sw = w * (1 - (i / steps) * 0.78);
    const sy = (i + 0.5) * stepH;
    addBox(g, sw, stepH + 0.02, thickness, 0, sy, 0, wallColor);
    // Stone coping cap on each step
    addBox(g, sw + 0.08, 0.05, thickness + 0.06, 0, (i + 1) * stepH, 0, trimColor);
    // Small stone finials on step corners
    if (i < steps - 1) {
      addSphere(g, 0.04, -sw / 2 + 0.04, (i + 1) * stepH + 0.05, 0, trimColor);
      addSphere(g, 0.04, sw / 2 - 0.04, (i + 1) * stepH + 0.05, 0, trimColor);
    }
  }
  // Top pinnacle & central rose oculus
  addSphere(g, 0.065, 0, h + 0.08, 0, 0xd4af37, { metalness: 0.65 });
  addCyl(g, 0.16, 0.16, thickness + 0.05, 0, h * 0.42, 0, trimColor, 14, { rotX: Math.PI / 2 });
  addCyl(g, 0.11, 0.11, thickness + 0.07, 0, h * 0.42, 0, 0x1e3a5f, 12, { rotX: Math.PI / 2 });

  parent.add(g);
}

/**
 * Classical Chinese Sweeping Roof with Upturned Flying Corner Eaves (Feiyan) & Ridge Chiwen
 */
function addChineseUpturnedRoof(
  parent: THREE.Object3D,
  cx: number,
  by: number,
  cz: number,
  w: number,
  h: number,
  d: number,
  tileColor: number | string,
  trimColor: number | string,
  goldColor: number | string = 0xd4af37
) {
  const g = new THREE.Group();
  g.position.set(cx, by, zOffset(cz));

  function zOffset(v: number) {
    return v;
  }

  // Lower flared eave skirt + main hip-gable roof body
  addBox(g, w + 0.36, 0.09, d + 0.36, 0, 0.04, 0, tileColor);
  addHippedRoof(g, w + 0.2, h, d + 0.2, 0, 0.06, 0, tileColor, goldColor);

  // Main ridge beam + Dragon-owl Chiwen terminals at both ends
  const ridgeW = w * 0.56;
  addBox(g, ridgeW, 0.14, 0.14, 0, h + 0.08, 0, tileColor);
  addBox(g, ridgeW + 0.06, 0.05, 0.16, 0, h + 0.14, 0, goldColor, { metalness: 0.6 });
  for (const sx of [-1, 1]) {
    addBox(g, 0.12, 0.24, 0.16, sx * (ridgeW / 2 + 0.04), h + 0.18, 0, goldColor, {
      rotZ: sx * -0.25,
      metalness: 0.65,
    });
  }

  // 4 Upturned Flying Corner Eaves (Feiyan 飞檐翘角)
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const ex = sx * (w / 2 + 0.16);
      const ez = sz * (d / 2 + 0.16);
      addBox(g, 0.32, 0.06, 0.16, ex, 0.12, ez, tileColor, {
        rotY: sx * sz * -0.78,
        rotZ: sx * 0.38,
      });
      addCone(g, 0.06, 0.16, ex + sx * 0.08, 0.2, ez + sz * 0.08, goldColor, 6, 0, 0.6);
    }
  }

  // Under-eave decorative painted beam band
  addBox(g, w - 0.08, 0.1, d - 0.08, 0, -0.04, 0, trimColor);

  parent.add(g);
}

/**
 * Classical Multi-Tiered Courtyard Stone Fountain
 */
function addClassicalFountain(
  parent: THREE.Object3D,
  x: number,
  by: number,
  z: number,
  radius = 0.72,
  stoneColor: number | string = 0xf8fafc,
  waterColor: number | string = 0x38bdf8
) {
  const g = new THREE.Group();
  g.position.set(x, by, z);

  // Outer octagonal basin + water surface
  addCyl(g, radius, radius * 1.05, 0.18, 0, 0.09, 0, stoneColor, 8);
  addCyl(g, radius * 0.88, radius * 0.88, 0.14, 0, 0.1, 0, waterColor, 16, {
    roughness: 0.1,
    metalness: 0.3,
    emissive: waterColor,
    emissiveIntensity: 0.18,
  });

  // Central carved pedestal + 2nd tier bowl + top pineapple finial & water jet
  addCyl(g, 0.14, 0.2, 0.42, 0, 0.3, 0, stoneColor, 12);
  addCyl(g, radius * 0.48, 0.16, 0.12, 0, 0.52, 0, stoneColor, 14);
  addCyl(g, radius * 0.4, radius * 0.4, 0.06, 0, 0.56, 0, waterColor, 14);
  addCyl(g, 0.08, 0.11, 0.26, 0, 0.68, 0, stoneColor, 10);
  addSphere(g, 0.08, 0, 0.85, 0, 0xd4af37, { metalness: 0.6, roughness: 0.25 });
  addCyl(g, 0.03, 0.07, 0.18, 0, 0.96, 0, 0xe0f2fe, 10, { opacity: 0.75 });

  parent.add(g);
}

/**
 * Landscape Trees & Topiary Helpers
 */
function addTree(
  parent: THREE.Object3D,
  x: number,
  y: number,
  z: number,
  style: 'cypress' | 'palm' | 'maple' | 'pine' | 'olive' | 'rose_bush' | 'topiary' = 'olive',
  scale = 1.0
) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.scale.setScalar(scale);

  if (style === 'cypress') {
    addCyl(g, 0.06, 0.09, 0.45, 0, 0.22, 0, 0x5c4033, 8);
    addCone(g, 0.26, 1.45, 0, 1.05, 0, 0x14532d, 10);
    addCone(g, 0.2, 1.0, 0, 1.45, 0, 0x166534, 10);
  } else if (style === 'palm') {
    addCyl(g, 0.06, 0.1, 1.35, 0, 0.67, 0, 0x78350f, 8, { rotZ: 0.06 });
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      addBox(g, 0.65, 0.04, 0.16, Math.cos(a) * 0.28, 1.34, Math.sin(a) * 0.28, 0x15803d, {
        rotY: -a,
        rotZ: -0.28,
      });
    }
  } else if (style === 'maple') {
    addCyl(g, 0.06, 0.1, 0.6, 0, 0.3, 0, 0x451a03, 8);
    addSphere(g, 0.38, 0, 0.78, 0, 0xdc2626, { scaleY: 0.65 });
    addSphere(g, 0.28, 0.18, 0.88, 0.1, 0xef4444, { scaleY: 0.6 });
    addSphere(g, 0.25, -0.16, 0.72, -0.1, 0xb91c1c, { scaleY: 0.6 });
  } else if (style === 'pine') {
    addCyl(g, 0.07, 0.11, 0.55, 0, 0.27, 0, 0x451a03, 8);
    addCone(g, 0.45, 0.6, 0, 0.68, 0, 0x064e3b, 9);
    addCone(g, 0.35, 0.55, 0, 1.02, 0, 0x065f46, 9);
    addCone(g, 0.24, 0.45, 0, 1.32, 0, 0x047857, 9);
  } else if (style === 'topiary') {
    // Classical terracotta urn + clipped boxwood cone/spheres
    addCyl(g, 0.14, 0.1, 0.22, 0, 0.11, 0, 0xb45309, 10);
    addSphere(g, 0.2, 0, 0.34, 0, 0x15803d);
    addSphere(g, 0.14, 0, 0.58, 0, 0x16a34a);
  } else if (style === 'rose_bush') {
    addSphere(g, 0.24, 0, 0.18, 0, 0x15803d, { scaleY: 0.75 });
    addSphere(g, 0.06, 0.1, 0.28, 0.08, 0xf43f5e);
    addSphere(g, 0.055, -0.1, 0.26, 0.06, 0xfb7185);
    addSphere(g, 0.055, 0.02, 0.3, -0.09, 0xe11d48);
  } else {
    // Olive / Oak / Apple heritage tree
    addCyl(g, 0.07, 0.11, 0.6, 0, 0.3, 0, 0x5c4033, 8);
    addSphere(g, 0.38, 0, 0.78, 0, 0x3f6212, { scaleY: 0.72 });
    addSphere(g, 0.28, 0.16, 0.86, 0.12, 0x4d7c0f, { scaleY: 0.7 });
    addSphere(g, 0.26, -0.18, 0.74, -0.1, 0x65a30d, { scaleY: 0.7 });
  }
  parent.add(g);
}

// ============================================================================
// SHARED 2-STORY CLASSICAL INTERIOR FURNITURE BUILDER
// Used inside both the Villa Exterior (for Roof-Lift "只看 1F / 只看 2F")
// and the standalone Dollhouse Cutaway Interior (diorama_dollhouse_103..132)
// ============================================================================
function populateVillaTwoStoryInterior(
  floor1Group: THREE.Group,
  floor2Group: THREE.Group,
  seed: DesignerVillaSeed,
  scale = 1.0,
  y1 = 0.05,
  y2 = 1.45
) {
  const [floorHex, wallHex, accentHex] = seed.interiorPalette;
  const s = scale;

  // --- 1F GRAND CLASSICAL SALON, FIREPLACE, CHANDELIER & DINING HALL ---
  // Herringbone / Parquet flooring & Persian / Oriental rug
  addBox(floor1Group, 3.6 * s, 0.04 * s, 2.6 * s, 0, y1, 0, floorHex, { roughness: 0.45 });
  addBox(floor1Group, 1.65 * s, 0.02 * s, 1.2 * s, -0.75 * s, y1 + 0.025 * s, 0.2 * s, accentHex, {
    roughness: 0.85,
  });
  addBox(floor1Group, 1.45 * s, 0.022 * s, 1.0 * s, -0.75 * s, y1 + 0.027 * s, 0.2 * s, wallHex, {
    roughness: 0.85,
  });

  // Tufted Chesterfield / Classical Velvet Sofa Set
  addBox(floor1Group, 1.25 * s, 0.22 * s, 0.48 * s, -0.82 * s, y1 + 0.13 * s, -0.18 * s, accentHex, {
    roughness: 0.7,
  });
  addBox(floor1Group, 1.25 * s, 0.28 * s, 0.12 * s, -0.82 * s, y1 + 0.28 * s, -0.36 * s, accentHex, {
    roughness: 0.7,
  });
  // Rolled armrests
  addCyl(floor1Group, 0.08 * s, 0.08 * s, 0.48 * s, -1.42 * s, y1 + 0.24 * s, -0.18 * s, accentHex, 10, {
    rotX: Math.PI / 2,
  });
  addCyl(floor1Group, 0.08 * s, 0.08 * s, 0.48 * s, -0.22 * s, y1 + 0.24 * s, -0.18 * s, accentHex, 10, {
    rotX: Math.PI / 2,
  });
  // Pair of wingback armchairs
  for (const ax of [-1.32 * s, -0.25 * s]) {
    addBox(floor1Group, 0.36 * s, 0.22 * s, 0.36 * s, ax, y1 + 0.13 * s, 0.42 * s, wallHex);
    addBox(floor1Group, 0.36 * s, 0.34 * s, 0.1 * s, ax, y1 + 0.28 * s, 0.55 * s, accentHex);
  }

  // Carved Marble & Gold Coffee Table + Tea Service
  addBox(floor1Group, 0.68 * s, 0.04 * s, 0.42 * s, -0.78 * s, y1 + 0.18 * s, 0.22 * s, 0xffffff, {
    roughness: 0.2,
  });
  addBox(floor1Group, 0.62 * s, 0.14 * s, 0.36 * s, -0.78 * s, y1 + 0.09 * s, 0.22 * s, 0xd4af37, {
    metalness: 0.6,
  });

  // Grand Classical Mantelpiece Fireplace + Overmantel Gold Mirror on Left Wall
  addBox(floor1Group, 0.24 * s, 1.15 * s, 0.88 * s, -1.66 * s, y1 + 0.6 * s, -0.1 * s, wallHex);
  addBox(floor1Group, 0.28 * s, 0.08 * s, 0.96 * s, -1.64 * s, y1 + 0.62 * s, -0.1 * s, 0xffffff);
  addBox(floor1Group, 0.14 * s, 0.36 * s, 0.46 * s, -1.55 * s, y1 + 0.22 * s, -0.1 * s, 0x1e293b);
  addSphere(floor1Group, 0.11 * s, -1.52 * s, y1 + 0.16 * s, -0.1 * s, 0xf97316, {
    emissive: 0xf97316,
    emissiveIntensity: 0.9,
  });
  // Gilded Overmantel Mirror
  addBox(floor1Group, 0.06 * s, 0.46 * s, 0.56 * s, -1.53 * s, y1 + 0.92 * s, -0.1 * s, 0xd4af37, {
    metalness: 0.75,
  });
  addBox(floor1Group, 0.07 * s, 0.38 * s, 0.48 * s, -1.52 * s, y1 + 0.92 * s, -0.1 * s, 0xbae6fd, {
    roughness: 0.1,
    metalness: 0.85,
  });

  // 1F Right Side: Banquet Dining Table, Chippendale Chairs & China Cabinet
  addBox(floor1Group, 1.15 * s, 0.34 * s, 0.42 * s, 0.95 * s, y1 + 0.19 * s, -0.68 * s, floorHex);
  addBox(floor1Group, 1.19 * s, 0.04 * s, 0.46 * s, 0.95 * s, y1 + 0.37 * s, -0.68 * s, 0xf8fafc, {
    roughness: 0.2,
  });
  // Tall Glass-Front Curio / Wine & Porcelain Cabinet on Back Wall
  addBox(floor1Group, 0.95 * s, 1.05 * s, 0.22 * s, 0.95 * s, y1 + 0.55 * s, -1.12 * s, 0x451a03);
  addBox(floor1Group, 0.84 * s, 0.88 * s, 0.16 * s, 0.95 * s, y1 + 0.56 * s, -1.08 * s, 0xfef08a, {
    emissive: 0xfef08a,
    emissiveIntensity: 0.35,
  });

  // Banquet Dining Table + 6 High-Back Chairs + Candelabra
  addBox(floor1Group, 1.05 * s, 0.04 * s, 0.58 * s, 0.88 * s, y1 + 0.28 * s, 0.36 * s, floorHex, {
    roughness: 0.3,
  });
  addCyl(floor1Group, 0.07 * s, 0.12 * s, 0.26 * s, 0.58 * s, y1 + 0.14 * s, 0.36 * s, floorHex, 10);
  addCyl(floor1Group, 0.07 * s, 0.12 * s, 0.26 * s, 1.18 * s, y1 + 0.14 * s, 0.36 * s, floorHex, 10);
  addCyl(floor1Group, 0.04 * s, 0.06 * s, 0.16 * s, 0.88 * s, y1 + 0.38 * s, 0.36 * s, 0xd4af37, 8, {
    emissive: 0xfef08a,
    emissiveIntensity: 0.5,
  });
  for (let cx = 0.56 * s; cx <= 1.22 * s; cx += 0.32 * s) {
    addBox(floor1Group, 0.18 * s, 0.22 * s, 0.18 * s, cx, y1 + 0.13 * s, 0.02 * s, accentHex);
    addBox(floor1Group, 0.18 * s, 0.36 * s, 0.04 * s, cx, y1 + 0.22 * s, -0.06 * s, floorHex);
    addBox(floor1Group, 0.18 * s, 0.22 * s, 0.18 * s, cx, y1 + 0.13 * s, 0.7 * s, accentHex);
    addBox(floor1Group, 0.18 * s, 0.36 * s, 0.04 * s, cx, y1 + 0.22 * s, 0.78 * s, floorHex);
  }

  // Grand Sweeping Staircase connecting 1F to 2F
  const steps = 8;
  for (let i = 0; i < steps; i++) {
    const sy = y1 + ((i + 1) / steps) * (y2 - y1);
    const sx = -0.15 * s + (i / steps) * 0.55 * s;
    addBox(floor1Group, 0.18 * s, 0.045 * s, 0.42 * s, sx, sy, -0.92 * s, floorHex);
    addCyl(floor1Group, 0.015 * s, 0.015 * s, 0.22 * s, sx, sy + 0.11 * s, -0.72 * s, 0xd4af37, 6);
  }

  // --- 2F FOUR-POSTER CANOPY MASTER BEDROOM, STUDY & CLAWFOOT SPA TUB ---
  // 2F Floor Slab (with stairwell opening)
  addBox(floor2Group, 3.5 * s, 0.06 * s, 2.4 * s, 0, y2, 0.05 * s, floorHex, { roughness: 0.45 });
  // Interior Partition Wall
  addBox(floor2Group, 0.06 * s, 1.0 * s, 1.8 * s, 0.35 * s, y2 + 0.52 * s, 0.1 * s, wallHex);

  // Four-Poster Canopy Master Bed (Left Suite)
  const bx = -0.78 * s;
  const bz = -0.12 * s;
  addBox(floor2Group, 1.12 * s, 0.65 * s, 0.1 * s, bx, y2 + 0.36 * s, -0.75 * s, floorHex);
  addBox(floor2Group, 0.98 * s, 0.18 * s, 1.15 * s, bx, y2 + 0.12 * s, bz, floorHex);
  addBox(floor2Group, 0.9 * s, 0.14 * s, 1.05 * s, bx, y2 + 0.24 * s, bz, 0xffffff);
  addBox(floor2Group, 0.92 * s, 0.08 * s, 0.55 * s, bx, y2 + 0.31 * s, 0.12 * s, accentHex);
  // 4 Turned Bed Posts + Upper Canopy Frame
  for (const px of [bx - 0.46 * s, bx + 0.46 * s]) {
    for (const pz of [bz - 0.54 * s, bz + 0.54 * s]) {
      addCyl(floor2Group, 0.03 * s, 0.035 * s, 0.88 * s, px, y2 + 0.46 * s, pz, floorHex, 8);
    }
  }
  addBox(floor2Group, 0.98 * s, 0.05 * s, 1.14 * s, bx, y2 + 0.9 * s, bz, wallHex);
  // Pillows & Bedside Lamps
  addBox(floor2Group, 0.32 * s, 0.08 * s, 0.18 * s, bx - 0.22 * s, y2 + 0.34 * s, -0.45 * s, 0xffffff);
  addBox(floor2Group, 0.32 * s, 0.08 * s, 0.18 * s, bx + 0.22 * s, y2 + 0.34 * s, -0.45 * s, 0xffffff);
  for (const nx of [-1.42 * s, -0.14 * s]) {
    addBox(floor2Group, 0.24 * s, 0.22 * s, 0.24 * s, nx, y2 + 0.14 * s, -0.6 * s, floorHex);
    addCyl(floor2Group, 0.06 * s, 0.09 * s, 0.16 * s, nx, y2 + 0.33 * s, -0.6 * s, 0xfef08a, 10, {
      emissive: 0xfef08a,
      emissiveIntensity: 0.65,
    });
  }

  // 2F Right Suite: Freestanding Brass/Porcelain Clawfoot Bathtub & Classical Vanity
  addCyl(floor2Group, 0.28 * s, 0.24 * s, 0.28 * s, 1.05 * s, y2 + 0.17 * s, -0.25 * s, 0xffffff, 18, {
    roughness: 0.15,
  });
  addCyl(floor2Group, 0.23 * s, 0.21 * s, 0.29 * s, 1.05 * s, y2 + 0.18 * s, -0.25 * s, 0x38bdf8, 16, {
    roughness: 0.1,
  });
  addCyl(floor2Group, 0.02 * s, 0.02 * s, 0.38 * s, 1.32 * s, y2 + 0.22 * s, -0.25 * s, 0xd4af37, 8, {
    metalness: 0.85,
  });

  // Double Marble Vanity + Gold Framed Mirrors
  addBox(floor2Group, 0.72 * s, 0.28 * s, 0.28 * s, 1.02 * s, y2 + 0.17 * s, -0.92 * s, floorHex);
  addBox(floor2Group, 0.76 * s, 0.04 * s, 0.32 * s, 1.02 * s, y2 + 0.32 * s, -0.92 * s, 0xffffff);
  addCyl(floor2Group, 0.18 * s, 0.18 * s, 0.04 * s, 1.02 * s, y2 + 0.62 * s, -1.04 * s, 0xd4af37, 16, {
    rotX: Math.PI / 2,
    metalness: 0.75,
  });

  // 2F Chandelier / Warm Glow Orb
  addSphere(floor2Group, 0.13 * s, -0.78 * s, y2 + 0.98 * s, 0, 0xfef08a, {
    emissive: 0xfef08a,
    emissiveIntensity: 0.85,
  });
}

// ============================================================================
// 30 DISTINCTIVE CLASSICAL HOUSE EXTERIOR BUILDERS (BD-211 to BD-240)
// ============================================================================
function populateVillaExteriorShell(extGroup: THREE.Group, baseGroup: THREE.Group, seed: DesignerVillaSeed) {
  const [c1, c2, c3] = seed.palette;
  const idx = seed.idx;

  // Base Estate Stone Podium, Molded Coping, Low Garden Walls & Entrance Steps
  addBox(baseGroup, 6.2, 0.36, 4.9, 0, -0.18, 0, 0xd6d3d1, { roughness: 0.82 });
  addBox(baseGroup, 6.32, 0.08, 5.02, 0, 0.01, 0, 0xf5f5f4, { roughness: 0.55 });
  addBox(baseGroup, 5.9, 0.06, 4.6, 0, 0.04, 0, 0x166534, { roughness: 0.9 }); // manicured lawn

  // Paved Forecourt & Central Walkway
  addBox(baseGroup, 3.8, 0.05, 1.5, 0, 0.065, 1.25, 0xe7e5e4, { roughness: 0.7 });
  addBox(baseGroup, 1.1, 0.06, 0.65, 0, 0.07, 2.02, 0xf5f5f4, { roughness: 0.6 });

  // Perimeter Estate Balustrade / Wrought-Iron & Stone Gate Piers at Front
  addBox(baseGroup, 0.24, 0.48, 0.24, -0.72, 0.28, 2.24, 0xf5f5f4);
  addBox(baseGroup, 0.24, 0.48, 0.24, 0.72, 0.28, 2.24, 0xf5f5f4);
  addSphere(baseGroup, 0.08, -0.72, 0.58, 2.24, 0xd4af37, { metalness: 0.65 });
  addSphere(baseGroup, 0.08, 0.72, 0.58, 2.24, 0xd4af37, { metalness: 0.65 });
  addBalustrade(baseGroup, -2.85, 2.24, -0.75, 2.24, 0.06, 0.28, 0xf5f5f4, 0.22);
  addBalustrade(baseGroup, 0.75, 2.24, 2.85, 2.24, 0.06, 0.28, 0xf5f5f4, 0.22);

  switch (idx) {
    case 1: {
      // BD-211: San Francisco Queen Anne Victorian "Painted Lady" Turret & Gingerbread House
      // Main 2-story Victorian house block in pastel butter-yellow with white quoins & cornice
      addBox(extGroup, 3.3, 2.05, 2.25, -0.15, 1.08, -0.35, c1);
      addCornerQuoins(extGroup, -0.15, 0.08, -0.35, 3.3, 2.0, 2.25, c3, 10);
      addMoldedCornice(extGroup, -0.15, 1.08, -0.35, 3.32, 2.27, c3, c2);
      addMoldedCornice(extGroup, -0.15, 2.1, -0.35, 3.36, 2.3, c3, c2);

      // Steeply pitched main roof + ornate cross gable on left wing
      addPitchedRoof(extGroup, 3.55, 0.95, 2.45, -0.15, 2.12, -0.35, 0x334155, 0, c2, c3);
      addPitchedRoof(extGroup, 1.75, 0.92, 2.55, -0.82, 2.12, -0.25, 0x334155, Math.PI / 2, c2, c3);
      // Sunburst relief inside front gable
      addCyl(extGroup, 0.24, 0.24, 0.08, -0.82, 2.5, 1.04, 0xd4af37, 16, { rotX: Math.PI / 2, metalness: 0.6 });

      // 2-Story Projecting Octagonal Bay Window on Left Front
      addBayWindow(extGroup, -0.82, 0.08, 0.78, 1.25, 2.0, 0.52, c1, c3, c2, 0, 2);

      // Signature 3-Story Octagonal Queen Anne Turret on Right Corner with Witch-Hat Spire
      addVictorianTurret(extGroup, 1.38, 0.08, 0.58, 0.68, 2.48, 1.18, c1, c3, c2);

      // Ornate White Gingerbread Spindlework Front Porch + Steps
      addClassicalPortico(extGroup, 0.32, 0.08, 0.98, 1.28, 1.05, 0.65, c3, c2, {
        numCols: 4,
        hasPediment: true,
        hasBalcony: true,
        tympanumColor: c2,
      });
      addGrandEntranceDoor(extGroup, 0.32, 0.14, 0.77, 0.52, 0.76, 0x7c2d12, c3);
      addClassicalWindow(extGroup, 0.32, 1.58, 0.78, 0.56, 0.54, {
        frameColor: c3,
        shutterColor: c2,
        pediment: 'triangular',
      });

      // Side facade windows so 360° view is richly detailed
      for (const wy of [0.62, 1.56]) {
        addClassicalWindow(extGroup, -1.81, wy, -0.35, 0.52, 0.52, {
          rotY: -Math.PI / 2,
          frameColor: c3,
          shutterColor: c2,
          pediment: 'triangular',
        });
      }
      addOrnateChimney(extGroup, -1.35, 2.1, -0.95, 0.34, 1.1, 0.34, 0x991b1b, c3, 2);
      addClassicalFountain(baseGroup, -1.65, 0.06, 1.45, 0.58, c3, 0x38bdf8);
      addTree(baseGroup, -2.45, 0.06, 0.8, 'rose_bush', 1.2);
      addTree(baseGroup, 2.35, 0.06, 1.1, 'olive', 1.05);
      break;
    }

    case 2: {
      // BD-212: English Tudor Revival Half-Timbered Oak, Jetty Gables & Twisted Chimney Manor
      // 1F Herringbone Red-Brick Base with Stone Quoins
      addBox(extGroup, 3.85, 1.02, 2.35, 0, 0.56, -0.35, c3);
      addCornerQuoins(extGroup, 0, 0.06, -0.35, 3.85, 1.02, 2.35, c1, 5);

      // 2F Cantilevered (Jettying) Cream Stucco Upper Story with Dark Oak Half-Timbering
      addBox(extGroup, 4.05, 1.08, 2.52, 0, 1.6, -0.32, c1);
      addBox(extGroup, 4.12, 0.09, 2.58, 0, 1.06, -0.32, c2); // Heavy oak jetty beam

      // Front & Side Half-Timber Panels (Colombage)
      addHalfTimberWallPanel(extGroup, -1.25, 1.6, 0.95, 1.35, 1.04, c2);
      addHalfTimberWallPanel(extGroup, 0, 1.6, 0.95, 1.15, 1.04, c2);
      addHalfTimberWallPanel(extGroup, 1.25, 1.6, 0.95, 1.35, 1.04, c2);
      addHalfTimberWallPanel(extGroup, -2.03, 1.6, -0.32, 2.4, 1.04, c2, Math.PI / 2);
      addHalfTimberWallPanel(extGroup, 2.03, 1.6, -0.32, 2.4, 1.04, c2, Math.PI / 2);

      // Main Steep Roof + Triple Tudor Cross Gables with Carved Bargeboards
      addPitchedRoof(extGroup, 4.2, 0.98, 2.65, 0, 2.14, -0.32, 0x3e2723, 0, c1, c2);
      for (const gx of [-1.25, 0, 1.25]) {
        const gw = gx === 0 ? 1.15 : 1.38;
        const gh = gx === 0 ? 0.85 : 1.02;
        addPitchedRoof(extGroup, gw, gh, 2.68, gx, 2.14, -0.28, 0x3e2723, Math.PI / 2, c1, c2);
        // Vertical timber studs inside gable triangle
        addBox(extGroup, 0.05, gh * 0.85, 0.06, gx, 2.14 + gh * 0.42, 1.05, c2);
        addBox(extGroup, 0.05, gh * 0.55, 0.06, gx - 0.22, 2.14 + gh * 0.28, 1.05, c2);
        addBox(extGroup, 0.05, gh * 0.55, 0.06, gx + 0.22, 2.14 + gh * 0.28, 1.05, c2);
      }

      // Twin Two-Story Leaded-Glass Mullioned Bay Windows on Left & Right Wings
      addBayWindow(extGroup, -1.25, 0.06, 0.92, 1.05, 2.05, 0.45, c1, c2, 0x3e2723, 0, 2);
      addBayWindow(extGroup, 1.25, 0.06, 0.92, 1.05, 2.05, 0.45, c1, c2, 0x3e2723, 0, 2);

      // Center Tudor Stone Portal + 2F Mullioned Oriel Window
      addGrandEntranceDoor(extGroup, 0, 0.08, 0.84, 0.58, 0.78, c2, 0xd6d3d1);
      addClassicalWindow(extGroup, 0, 1.6, 0.97, 0.68, 0.54, {
        frameColor: c2,
        pediment: 'none',
        flowerBoxColor: 0xe11d48,
      });

      // Signature Tall Twisted Tudor Red-Brick Chimney Stacks
      addOrnateChimney(extGroup, -1.65, 2.1, -0.95, 0.44, 1.25, 0.36, c3, c1, 3);
      addOrnateChimney(extGroup, 1.65, 2.1, -0.95, 0.44, 1.25, 0.36, c3, c1, 3);

      // English Rose Garden Parterre & Fountain
      addClassicalFountain(baseGroup, 0, 0.06, 1.55, 0.56, 0xd6d3d1, 0x38bdf8);
      for (const rx of [-1.8, -1.1, 1.1, 1.8]) {
        addTree(baseGroup, rx, 0.06, 1.45, 'rose_bush', 1.15);
      }
      addTree(baseGroup, -2.45, 0.06, -0.8, 'olive', 1.2);
      addTree(baseGroup, 2.45, 0.06, -0.8, 'olive', 1.2);
      break;
    }

    case 3: {
      // BD-213: French Second Empire Mansard Roof & Limestone Château-Villa (Hôtel Particulier)
      // Symmetrical Cream Limestone Corps de Logis + Central Pavilion
      addBox(extGroup, 3.9, 2.02, 2.35, 0, 1.06, -0.35, c1);
      addBox(extGroup, 1.45, 2.15, 2.55, 0, 1.12, -0.28, c1);
      addCornerQuoins(extGroup, 0, 0.06, -0.35, 3.9, 2.02, 2.35, 0xffffff, 10);
      addCornerQuoins(extGroup, 0, 0.06, -0.28, 1.45, 2.15, 2.55, 0xffffff, 10);
      addMoldedCornice(extGroup, 0, 1.08, -0.32, 3.96, 2.58, 0xffffff, c3);
      addMoldedCornice(extGroup, 0, 2.1, -0.32, 4.02, 2.62, 0xffffff, c3);

      // Steep Blue-Grey Slate Mansard Roof + Central Dome Pavilion + Gold Roof Cresting
      addHippedRoof(extGroup, 4.08, 0.82, 2.52, 0, 2.12, -0.35, c2, c3);
      addHippedRoof(extGroup, 1.62, 0.98, 2.72, 0, 2.18, -0.28, c2, c3);
      // Gilded Wrought-Iron Roof Cresting along top of Mansard
      addBalustrade(extGroup, -1.25, -0.35, 1.25, -0.35, 2.92, 0.22, c3, 0.16, true);

      // 5 Ornate Bullseye & Arched Dormer Windows on Mansard Slope
      addDormerWindow(extGroup, -1.28, 2.18, 0.68, 0.48, 0.46, 0.35, c1, c2, 0xffffff, 0, 'pitched');
      addDormerWindow(extGroup, -0.68, 2.18, 0.68, 0.44, 0.44, 0.35, c1, c2, 0xffffff, 0, 'bullseye');
      addDormerWindow(extGroup, 0, 2.25, 0.82, 0.56, 0.52, 0.38, c1, c2, c3, 0, 'bullseye');
      addDormerWindow(extGroup, 0.68, 2.18, 0.68, 0.44, 0.44, 0.35, c1, c2, 0xffffff, 0, 'bullseye');
      addDormerWindow(extGroup, 1.28, 2.18, 0.68, 0.48, 0.46, 0.35, c1, c2, 0xffffff, 0, 'pitched');

      // Corinthian Entrance Portico + Wrought-Iron & Gold Balconies
      addClassicalPortico(extGroup, 0, 0.06, 1.18, 1.28, 1.05, 0.56, 0xffffff, c2, {
        numCols: 4,
        hasPediment: false,
        hasBalcony: true,
        goldAccent: true,
      });
      addGrandEntranceDoor(extGroup, 0, 0.08, 1.0, 0.56, 0.78, 0x1e293b, 0xffffff);

      // 1F & 2F French Windows with Pediments & Black-Gold Wrought-Iron Guardrails
      for (const wx of [-1.32, -0.68, 0.68, 1.32]) {
        addClassicalWindow(extGroup, wx, 0.58, 0.84, 0.44, 0.62, {
          frameColor: 0xffffff,
          pediment: 'keystone',
        });
        addClassicalWindow(extGroup, wx, 1.58, 0.84, 0.44, 0.62, {
          frameColor: 0xffffff,
          pediment: 'segmental',
        });
        addBox(extGroup, 0.48, 0.16, 0.08, wx, 1.32, 0.9, 0x1e293b, { metalness: 0.7 });
      }
      addClassicalWindow(extGroup, 0, 1.62, 1.0, 0.58, 0.68, {
        frameColor: 0xffffff,
        pediment: 'triangular',
      });

      addOrnateChimney(extGroup, -1.65, 2.15, -0.85, 0.36, 0.95, 0.32, c1, c3, 2);
      addOrnateChimney(extGroup, 1.65, 2.15, -0.85, 0.36, 0.95, 0.32, c1, c3, 2);
      addClassicalFountain(baseGroup, 0, 0.06, 1.68, 0.62, 0xffffff, 0x38bdf8);
      for (const tx of [-2.1, -1.3, 1.3, 2.1]) {
        addTree(baseGroup, tx, 0.06, 1.35, 'topiary', 1.15);
      }
      break;
    }

    case 4: {
      // BD-214: Villa La Rotonda · Palladian Four-Portico Classical Temple & Central Dome Villa
      // High Rusticated Renaissance Podium + Square Central Palazzo Block
      addBox(extGroup, 3.25, 0.52, 2.65, 0, 0.32, -0.2, 0xe7e5e4);
      addBox(extGroup, 3.1, 1.65, 2.5, 0, 1.38, -0.2, c1);
      addCornerQuoins(extGroup, 0, 0.56, -0.2, 3.1, 1.65, 2.5, 0xffffff, 8);
      addMoldedCornice(extGroup, 0, 2.2, -0.2, 3.2, 2.6, 0xffffff, c2);

      // Terracotta Hipped Roof + Stepped Pantheon-Style Central Rotunda Dome & Cupola
      addHippedRoof(extGroup, 3.35, 0.62, 2.75, 0, 2.22, -0.2, c3, 0xffffff);
      addCyl(extGroup, 0.98, 1.05, 0.28, 0, 2.75, -0.2, c1, 24);
      addCyl(extGroup, 0.85, 0.95, 0.18, 0, 2.94, -0.2, c3, 24);
      addSphere(extGroup, 0.82, 0, 2.96, -0.2, c3, {
        scaleY: 0.62,
        phiLength: Math.PI / 2,
      });
      // Lantern Cupola + Classical Statue Finial
      addCyl(extGroup, 0.22, 0.24, 0.32, 0, 3.55, -0.2, 0xffffff, 12);
      addCone(extGroup, 0.26, 0.24, 0, 3.82, -0.2, c3, 12);
      addSphere(extGroup, 0.065, 0, 4.0, -0.2, 0xd4af37, { metalness: 0.75 });

      // Four Symmetric Hexastyle Ionic Temple Porticos (Front, Left, Right, Back)
      // Front Portico
      addClassicalPortico(extGroup, 0, 0.06, 1.35, 1.85, 1.92, 0.68, 0xffffff, c3, {
        numCols: 6,
        hasPediment: true,
        tympanumColor: c1,
      });
      // Left & Right Porticos
      addClassicalPortico(extGroup, -1.85, 0.06, -0.2, 1.55, 1.92, 0.62, 0xffffff, c3, {
        numCols: 4,
        rotY: -Math.PI / 2,
        hasPediment: true,
        tympanumColor: c1,
      });
      addClassicalPortico(extGroup, 1.85, 0.06, -0.2, 1.55, 1.92, 0.62, 0xffffff, c3, {
        numCols: 4,
        rotY: Math.PI / 2,
        hasPediment: true,
        tympanumColor: c1,
      });

      // Pedimented Windows & Grand Portal
      addGrandEntranceDoor(extGroup, 0, 0.56, 1.06, 0.58, 0.86, 0x451a03, 0xffffff);
      for (const wx of [-1.08, 1.08]) {
        addClassicalWindow(extGroup, wx, 1.35, 1.06, 0.46, 0.64, {
          frameColor: 0xffffff,
          pediment: 'triangular',
        });
        addClassicalWindow(extGroup, wx, 1.92, 1.06, 0.42, 0.32, {
          frameColor: 0xffffff,
          pediment: 'none',
        });
      }

      // Italian Cypress Trees & Classical Urns
      for (const cxPos of [-2.55, -1.95, 1.95, 2.55]) {
        addTree(baseGroup, cxPos, 0.06, 1.45, 'cypress', 1.15);
      }
      break;
    }

    case 5: {
      // BD-215: English Georgian Symmetrical Red-Brick Quoin, Fanlight & Balustrade Manor
      // Flemish-Bond Red Brick 5-Bay Symmetrical Block + White Portland Stone Quoins
      addBox(extGroup, 3.95, 2.08, 2.38, 0, 1.08, -0.35, c1);
      addBox(extGroup, 1.35, 2.14, 2.48, 0, 1.11, -0.32, c1); // slightly projecting center breakfront
      addCornerQuoins(extGroup, 0, 0.06, -0.35, 3.95, 2.08, 2.38, c2, 11);
      addCornerQuoins(extGroup, 0, 0.06, -0.32, 1.35, 2.14, 2.48, c2, 11);
      addMoldedCornice(extGroup, 0, 1.08, -0.35, 4.02, 2.46, c2);
      addMoldedCornice(extGroup, 0, 2.14, -0.35, 4.08, 2.52, c2);

      // Central Triangular Pediment + Full Perimeter White Stone Roof Balustrade with Urns
      addPitchedRoof(extGroup, 1.48, 0.48, 2.56, 0, 2.16, -0.32, c3, 0, c1, c2);
      addHippedRoof(extGroup, 4.05, 0.72, 2.46, 0, 2.14, -0.35, c3, c2);
      addBalustrade(extGroup, -1.95, 0.88, 1.95, 0.88, 2.16, 0.24, c2, 0.2, true);

      // Semicircular Ionic Entrance Portico + Fanlight Door + 2F Palladian Venetian Window
      addClassicalPortico(extGroup, 0, 0.06, 1.12, 1.15, 1.05, 0.56, c2, c3, {
        numCols: 4,
        hasPediment: false,
        hasBalcony: true,
      });
      addGrandEntranceDoor(extGroup, 0, 0.08, 0.92, 0.56, 0.78, 0x1e293b, c2);
      // 2F Triple Palladian Window (arched center + two flanking sidelights)
      addClassicalWindow(extGroup, 0, 1.62, 0.93, 0.48, 0.62, {
        frameColor: c2,
        pediment: 'segmental',
      });
      addClassicalWindow(extGroup, -0.36, 1.56, 0.93, 0.22, 0.48, { frameColor: c2, pediment: 'none' });
      addClassicalWindow(extGroup, 0.36, 1.56, 0.93, 0.22, 0.48, { frameColor: c2, pediment: 'none' });

      // Symmetrical 12-Pane Georgian Sash Windows on Left & Right Bays
      for (const wx of [-1.48, -0.95, 0.95, 1.48]) {
        addClassicalWindow(extGroup, wx, 0.58, 0.85, 0.42, 0.58, {
          frameColor: c2,
          pediment: 'triangular',
        });
        addClassicalWindow(extGroup, wx, 1.58, 0.85, 0.42, 0.54, {
          frameColor: c2,
          pediment: 'keystone',
        });
      }

      // Twin Dormers & Symmetrical Tall Georgian Brick Chimneys
      addDormerWindow(extGroup, -1.2, 2.22, 0.45, 0.44, 0.42, 0.35, c2, c3, c2);
      addDormerWindow(extGroup, 1.2, 2.22, 0.45, 0.44, 0.42, 0.35, c2, c3, c2);
      addOrnateChimney(extGroup, -1.78, 2.14, -0.35, 0.38, 1.15, 0.42, c1, c2, 3);
      addOrnateChimney(extGroup, 1.78, 2.14, -0.35, 0.38, 1.15, 0.42, c1, c2, 3);

      addClassicalFountain(baseGroup, 0, 0.06, 1.65, 0.58, c2, 0x38bdf8);
      for (const tx of [-2.2, -1.35, 1.35, 2.2]) {
        addTree(baseGroup, tx, 0.06, 1.38, 'topiary', 1.15);
      }
      break;
    }

    case 6: {
      // BD-216: Dutch Golden Age Stepped-Gable & Scroll-Gable Canal Manor House (Amsterdam)
      // Twin Joined Canal Houses (Left: Stepped Trapgevel, Right: Baroque Scroll Halsgevel)
      addBox(extGroup, 1.85, 2.15, 2.35, -0.92, 1.12, -0.35, c1);
      addBox(extGroup, 1.85, 2.15, 2.35, 0.92, 1.12, -0.35, 0x7c2d12);
      addCornerQuoins(extGroup, -0.92, 0.06, -0.35, 1.85, 2.15, 2.35, c2, 10);
      addCornerQuoins(extGroup, 0.92, 0.06, -0.35, 1.85, 2.15, 2.35, c2, 10);

      // Horizontal White Sandstone Bands across facade
      for (const hy of [0.55, 1.1, 1.65, 2.15]) {
        addBox(extGroup, 3.76, 0.06, 2.42, 0, hy, -0.35, c2);
      }

      // Steep Gables + Signature Dutch Stepped & Volute Front Gables
      addPitchedRoof(extGroup, 1.85, 1.05, 2.38, -0.92, 2.16, -0.35, 0x334155, Math.PI / 2, c1, c2);
      addPitchedRoof(extGroup, 1.85, 1.05, 2.38, 0.92, 2.16, -0.35, 0x334155, Math.PI / 2, 0x7c2d12, c2);
      addSteppedGable(extGroup, -0.92, 2.16, 0.84, 1.85, 1.15, 0.18, c1, c2, 0, 6);
      addSteppedGable(extGroup, 0.92, 2.16, 0.84, 1.75, 1.1, 0.18, 0x7c2d12, c2, 0, 4);

      // Traditional Amsterdam Hoisting Beams projecting from Gable Peaks
      addBox(extGroup, 0.07, 0.07, 0.45, -0.92, 3.18, 1.02, 0x1e293b);
      addBox(extGroup, 0.07, 0.07, 0.45, 0.92, 3.12, 1.02, 0x1e293b);

      // Dense Multi-Pane Windows with Green & Crimson Painted Wooden Shutters
      for (const gx of [-1.38, -0.48, 0.48, 1.38]) {
        for (const wy of [0.62, 1.58]) {
          addClassicalWindow(extGroup, gx, wy, 0.84, 0.42, 0.62, {
            frameColor: 0xffffff,
            shutterColor: gx < 0 ? c3 : 0xb91c1c,
            pediment: 'keystone',
            flowerBoxColor: 0xf43f5e,
          });
        }
      }

      // Raised Double Entrance Stoep + Grand Doors
      addGrandEntranceDoor(extGroup, -0.92, 0.18, 0.84, 0.46, 0.72, c3, 0xffffff);
      addGrandEntranceDoor(extGroup, 0.92, 0.18, 0.84, 0.46, 0.72, 0x1e293b, 0xffffff);
      addBox(extGroup, 0.85, 0.18, 0.45, -0.92, 0.09, 1.05, 0xd6d3d1);
      addBox(extGroup, 0.85, 0.18, 0.45, 0.92, 0.09, 1.05, 0xd6d3d1);

      // Amsterdam Canal Waterway & Arched Brick Bridge in Front
      addBox(baseGroup, 5.8, 0.08, 1.05, 0, 0.05, 1.65, 0x0284c7, { roughness: 0.12, metalness: 0.35 });
      addCyl(baseGroup, 0.55, 0.55, 1.15, 0, 0.05, 1.65, c1, 14, { rotZ: Math.PI / 2 });
      addBalustrade(baseGroup, -0.58, 1.15, -0.58, 2.15, 0.22, 0.2, 0xffffff, 0.18);
      addBalustrade(baseGroup, 0.58, 1.15, 0.58, 2.15, 0.22, 0.2, 0xffffff, 0.18);
      addTree(baseGroup, -2.35, 0.06, 1.05, 'olive', 1.1);
      addTree(baseGroup, 2.35, 0.06, 1.05, 'olive', 1.1);
      break;
    }

    case 7: {
      // BD-217: New Orleans Garden District Double Cast-Iron Lace Gallery & Corinthian Mansion
      // Pure White Clapboard Greek-Revival & Victorian Mansion
      addBox(extGroup, 3.75, 2.12, 2.25, 0, 1.1, -0.4, c1);
      addCornerQuoins(extGroup, 0, 0.06, -0.4, 3.75, 2.12, 2.25, c1, 10);
      addMoldedCornice(extGroup, 0, 2.16, -0.1, 4.05, 2.95, c1, 0xd4af37);
      addHippedRoof(extGroup, 4.08, 0.72, 2.95, 0, 2.18, -0.1, c2, 0xd4af37);

      // Signature Two-Story Wrap-Around Cast-Iron Lace Gallery (1F and 2F)
      // Haint-Blue Porch Ceilings & Gallery Decks
      addBox(extGroup, 3.95, 0.08, 0.72, 0, 1.12, 1.02, 0xbae6fd);
      addBox(extGroup, 3.95, 0.08, 0.72, 0, 2.12, 1.02, 0xbae6fd);

      // 6 Tall Fluted Columns + Intricate Black & Gold Cast-Iron Lace Filigree Panels
      for (let i = 0; i < 6; i++) {
        const cxPos = -1.78 + (i / 5) * 3.56;
        // 1F & 2F Columns
        addCyl(extGroup, 0.065, 0.075, 1.04, cxPos, 0.58, 1.32, c1, 14);
        addCyl(extGroup, 0.06, 0.068, 0.98, cxPos, 1.62, 1.32, c1, 14);
        // Black & Gold Cast-Iron Lace Brackets at column tops
        addBox(extGroup, 0.24, 0.14, 0.04, cxPos, 1.0, 1.32, c2, { metalness: 0.75 });
        addBox(extGroup, 0.24, 0.14, 0.04, cxPos, 2.0, 1.32, c2, { metalness: 0.75 });
      }
      // 1F & 2F Cast-Iron Lace Filigree Railings + Frieze Bands
      addBalustrade(extGroup, -1.82, 1.32, 1.82, 1.32, 1.14, 0.26, c2, 0.12);
      addBox(extGroup, 3.68, 0.12, 0.04, 0, 1.02, 1.32, c2, { metalness: 0.75 });
      addBox(extGroup, 3.68, 0.12, 0.04, 0, 2.02, 1.32, c2, { metalness: 0.75 });

      // Full-Length French Windows with Emerald-Green Louvered Shutters
      addGrandEntranceDoor(extGroup, 0, 0.08, 0.73, 0.58, 0.82, 0x451a03, c1);
      for (const wx of [-1.35, -0.68, 0.68, 1.35]) {
        addClassicalWindow(extGroup, wx, 0.58, 0.73, 0.42, 0.68, {
          frameColor: c1,
          shutterColor: c3,
          pediment: 'triangular',
        });
        addClassicalWindow(extGroup, wx, 1.62, 0.73, 0.42, 0.68, {
          frameColor: c1,
          shutterColor: c3,
          pediment: 'triangular',
        });
      }
      addClassicalWindow(extGroup, 0, 1.62, 0.73, 0.52, 0.68, {
        frameColor: c1,
        shutterColor: c3,
        pediment: 'segmental',
      });

      addOrnateChimney(extGroup, -1.55, 2.18, -0.8, 0.34, 0.98, 0.34, 0x991b1b, c1, 2);
      addOrnateChimney(extGroup, 1.55, 2.18, -0.8, 0.34, 0.98, 0.34, 0x991b1b, c1, 2);
      addClassicalFountain(baseGroup, 0, 0.06, 1.78, 0.56, c2, 0x38bdf8);
      addTree(baseGroup, -2.35, 0.06, 1.15, 'olive', 1.25);
      addTree(baseGroup, 2.35, 0.06, 1.15, 'olive', 1.25);
      break;
    }

    case 8: {
      // BD-218: Hamptons Shingle-Style Triple-Gable, Wrap-Around Veranda & Widow's Walk Cupola Manor
      // Weathered Silver-Cedar Shingle Main Volume with Crisp White Colonial Trim
      addBox(extGroup, 4.05, 2.02, 2.35, 0, 1.06, -0.35, c1);
      addCornerQuoins(extGroup, 0, 0.06, -0.35, 4.05, 2.02, 2.35, c2, 10);
      addMoldedCornice(extGroup, 0, 1.06, -0.35, 4.1, 2.4, c2);
      addMoldedCornice(extGroup, 0, 2.06, -0.35, 4.14, 2.44, c2);

      // Steep Roof + Triple Shingle Gables + Central Octagonal Widow's Walk Cupola
      addPitchedRoof(extGroup, 4.25, 0.92, 2.52, 0, 2.08, -0.35, 0x475569, 0, c1, c2);
      for (const gx of [-1.28, 0, 1.28]) {
        const gh = gx === 0 ? 1.02 : 0.88;
        addPitchedRoof(extGroup, 1.32, gh, 2.6, gx, 2.08, -0.28, 0x475569, Math.PI / 2, c1, c2);
        addClassicalWindow(extGroup, gx, 2.38, 1.02, 0.38, 0.36, {
          frameColor: c2,
          pediment: 'segmental',
        });
      }
      // Rooftop Octagonal White Cupola + Balustrade + Sailboat Weathervane
      addBalustrade(extGroup, -0.65, -0.65, 0.65, -0.65, 2.98, 0.18, c2, 0.16);
      addVictorianTurret(extGroup, 0, 2.85, -0.35, 0.36, 0.56, 0.45, c2, c2, 0x475569);

      // Deep White Columned Wrap-Around Veranda (Front & Left Side)
      addBox(extGroup, 4.25, 0.09, 0.68, 0, 1.02, 1.12, c2);
      addPitchedRoof(extGroup, 4.3, 0.24, 0.72, 0, 1.06, 1.12, 0x475569, 0, c2, c2);
      for (let i = 0; i < 6; i++) {
        const px = -1.95 + (i / 5) * 3.9;
        addCyl(extGroup, 0.065, 0.08, 0.96, px, 0.54, 1.4, c2, 12);
      }
      addBalustrade(extGroup, -1.95, 1.4, -0.45, 1.4, 0.08, 0.22, c2, 0.16);
      addBalustrade(extGroup, 0.45, 1.4, 1.95, 1.4, 0.08, 0.22, c2, 0.16);

      // Windows & Door + River-Stone Chimney
      addGrandEntranceDoor(extGroup, 0, 0.08, 0.84, 0.56, 0.76, 0x1e3a8a, c2);
      for (const wx of [-1.28, 0, 1.28]) {
        if (wx !== 0) {
          addClassicalWindow(extGroup, wx, 0.56, 0.84, 0.52, 0.54, {
            frameColor: c2,
            shutterColor: 0x1e3a8a,
            pediment: 'none',
          });
        }
        addClassicalWindow(extGroup, wx, 1.56, 0.84, 0.52, 0.54, {
          frameColor: c2,
          shutterColor: 0x1e3a8a,
          pediment: wx === 0 ? 'segmental' : 'triangular',
        });
      }
      addOrnateChimney(extGroup, -1.95, 0.08, -0.35, 0.48, 2.95, 0.48, 0x78716c, c2, 2);

      // Hamptons Pool & Hydrangea Hedges
      addBox(baseGroup, 2.4, 0.08, 1.05, 1.2, 0.06, 1.62, c3, { roughness: 0.1, metalness: 0.35 });
      for (const hx of [-2.1, -1.4, -0.7]) {
        addSphere(baseGroup, 0.22, hx, 0.22, 1.65, 0x38bdf8);
      }
      break;
    }

    case 9: {
      // BD-219: The Gamble House · American Craftsman Exposed-Timber & Stained-Glass Bungalow
      // River-Boulder & Clinker-Brick Terrace Plinth
      addBox(extGroup, 4.2, 0.28, 2.75, 0, 0.18, -0.25, 0x78716c);
      // Warm Redwood & Cedar Shingle Tiered Volume
      addBox(extGroup, 3.85, 1.05, 2.35, 0, 0.82, -0.3, c1);
      addBox(extGroup, 3.15, 0.98, 2.05, -0.15, 1.78, -0.32, c2);

      // Deep Overhanging Low-Pitched Craftsman Gable Roofs with Exposed Timber Rafter Tails
      addPitchedRoof(extGroup, 4.45, 0.56, 2.95, 0, 1.32, -0.25, 0x3f6212, 0, c1, c1);
      addPitchedRoof(extGroup, 3.65, 0.58, 2.65, -0.15, 2.24, -0.32, 0x3f6212, 0, c2, c1);
      addPitchedRoof(extGroup, 1.95, 0.52, 2.75, -0.85, 2.24, -0.2, 0x3f6212, Math.PI / 2, c2, c1);

      // Dense Exposed Hand-Carved Timber Rafters & Brackets under Eaves
      for (let rx = -1.95; rx <= 1.95; rx += 0.28) {
        addBox(extGroup, 0.06, 0.07, 0.38, rx, 1.3, 1.12, 0x451a03);
        if (rx >= -1.6 && rx <= 1.3) {
          addBox(extGroup, 0.06, 0.07, 0.38, rx, 2.22, 0.92, 0x451a03);
        }
      }

      // 2F Cantilevered Mortise-and-Tenon Timber Sleeping Porch on Right Wing
      addBox(extGroup, 1.35, 0.09, 0.95, 1.15, 1.36, 0.45, c1);
      addBalustrade(extGroup, 0.52, 0.88, 1.78, 0.88, 1.4, 0.26, 0x451a03, 0.14);
      addPitchedRoof(extGroup, 1.55, 0.36, 1.12, 1.15, 2.08, 0.45, 0x3f6212, 0, c2, c1);
      for (const px of [0.58, 1.15, 1.72]) {
        addBox(extGroup, 0.09, 0.68, 0.09, px, 1.74, 0.86, 0x451a03);
      }

      // Heavy Timber Entrance Pergola + Tiffany Tree-of-Life Stained Glass Front Door
      addBox(extGroup, 1.45, 0.1, 0.82, -0.25, 1.18, 1.22, 0x451a03);
      for (let bx = -0.88; bx <= 0.38; bx += 0.22) {
        addBox(extGroup, 0.06, 0.07, 0.96, bx, 1.25, 1.22, c2);
      }
      addBox(extGroup, 0.16, 0.92, 0.16, -0.82, 0.66, 1.52, 0x78716c);
      addBox(extGroup, 0.16, 0.92, 0.16, 0.32, 0.66, 1.52, 0x78716c);
      addGrandEntranceDoor(extGroup, -0.25, 0.32, 0.88, 0.68, 0.76, 0x451a03, c2);

      // Leaded Art-Glass Ribbon Windows
      for (const wx of [-1.32, 0.95]) {
        addClassicalWindow(extGroup, wx, 0.82, 0.88, 0.72, 0.48, {
          frameColor: 0x451a03,
          pediment: 'none',
          flowerBoxColor: 0xf59e0b,
        });
      }
      addClassicalWindow(extGroup, -0.85, 1.78, 0.72, 0.78, 0.48, {
        frameColor: 0x451a03,
        pediment: 'none',
      });

      // Koi Pond with Stepping Stones & Japanese Maple
      addCyl(baseGroup, 0.85, 0.85, 0.08, 1.55, 0.05, 1.58, 0x0d9488, 16);
      addTree(baseGroup, 2.35, 0.06, 1.25, 'maple', 1.15);
      addTree(baseGroup, -2.35, 0.06, 1.15, 'pine', 1.2);
      break;
    }

    case 10: {
      // BD-220: Bavarian Oberammergau Lüftlmalerei Fresco, Carved Balcony & Onion-Turret House
      // Wide Alpine Whitewashed Manor with Baroque Fresco Panels
      addBox(extGroup, 3.95, 2.02, 2.45, 0, 1.06, -0.35, c1);
      addCornerQuoins(extGroup, 0, 0.06, -0.35, 3.95, 2.02, 2.45, 0xd97706, 9);

      // Overhanging Bavarian Alpine Gable Roof with Carved Bargeboards
      addPitchedRoof(extGroup, 4.45, 1.08, 2.95, 0, 2.06, -0.35, c3, Math.PI / 2, c1, 0x78350f);

      // Rooftop Octagonal Timber Bell-Turret with Copper-Green Onion Dome
      addVictorianTurret(extGroup, 0, 2.75, -0.25, 0.36, 0.52, 0.48, 0x78350f, c1, c2, true);

      // Lüftlmalerei Trompe-l'oeil Painted Fresco Frames on Facade
      for (const fx of [-1.25, 0, 1.25]) {
        addBox(extGroup, 0.68, 0.42, 0.04, fx, 1.1, 0.89, 0xfde68a);
        addBox(extGroup, 0.6, 0.34, 0.05, fx, 1.1, 0.895, 0x38bdf8);
      }

      // Two-Tier Carved Spruce Wood Balconies Overflowing with Red Geraniums (2F & Gable 3F)
      for (const [byPos, bw] of [
        [1.14, 3.85],
        [2.04, 2.55],
      ] as [number, number][]) {
        addBox(extGroup, bw, 0.08, 0.48, 0, byPos, 1.08, 0x78350f);
        addBalustrade(extGroup, -bw / 2, 1.28, bw / 2, 1.28, byPos + 0.04, 0.24, 0x78350f, 0.15);
        // Continuous crimson geranium flower troughs
        addBox(extGroup, bw - 0.1, 0.08, 0.12, 0, byPos + 0.24, 1.32, 0x15803d);
        for (let gx = -bw / 2 + 0.2; gx <= bw / 2 - 0.2; gx += 0.28) {
          addSphere(extGroup, 0.05, gx, byPos + 0.3, 1.34, c3);
        }
      }

      // Windows with Emerald-Green Painted Shutters & Arched Portal
      addGrandEntranceDoor(extGroup, 0, 0.08, 0.88, 0.58, 0.78, 0x78350f, 0xd97706);
      for (const wx of [-1.32, -0.68, 0.68, 1.32]) {
        addClassicalWindow(extGroup, wx, 0.56, 0.88, 0.4, 0.48, {
          frameColor: 0xd97706,
          shutterColor: c2,
          pediment: 'segmental',
          flowerBoxColor: c3,
        });
        addClassicalWindow(extGroup, wx, 1.58, 0.88, 0.4, 0.48, {
          frameColor: 0xd97706,
          shutterColor: c2,
          pediment: 'segmental',
        });
      }
      addClassicalWindow(extGroup, 0, 2.42, 0.88, 0.48, 0.46, {
        frameColor: 0xd97706,
        shutterColor: c2,
        pediment: 'triangular',
      });

      addClassicalFountain(baseGroup, -1.55, 0.06, 1.58, 0.55, 0xd6d3d1, 0x38bdf8);
      addTree(baseGroup, -2.4, 0.06, 0.9, 'pine', 1.25);
      addTree(baseGroup, 2.4, 0.06, 0.9, 'pine', 1.25);
      break;
    }

    case 11: {
      // BD-221: Santorini Oia Neoclassical Captain's Mansion (Kapetanospito) & Blue-Dome Villa
      // Left/Center: 2-Story Neoclassical Captain's Mansion in Rose-Ochre with White Quoins & Cornice
      addBox(extGroup, 2.65, 2.05, 2.25, -0.52, 1.08, -0.35, c3);
      addCornerQuoins(extGroup, -0.52, 0.06, -0.35, 2.65, 2.05, 2.25, c1, 10);
      addMoldedCornice(extGroup, -0.52, 1.08, -0.35, 2.72, 2.32, c1, c2);
      addMoldedCornice(extGroup, -0.52, 2.1, -0.35, 2.78, 2.38, c1, c2);
      addBalustrade(extGroup, -1.8, 0.78, 0.76, 0.78, 2.12, 0.22, c1, 0.2, true);

      // Right Wing: Pure White Cycladic Barrel-Vaulted Cave Tiers + Cobalt Blue Dome & Triple Bell-Gable
      addBox(extGroup, 1.65, 1.15, 2.15, 1.38, 0.62, -0.25, c1);
      addCyl(extGroup, 0.58, 0.58, 2.15, 1.15, 1.18, -0.25, c1, 16, {
        rotX: Math.PI / 2,
      });
      // Cobalt-Blue Cupola Dome + Cross
      addCyl(extGroup, 0.58, 0.62, 0.35, 1.55, 1.35, -0.15, c1, 18);
      addSphere(extGroup, 0.58, 1.55, 1.5, -0.15, c2, {
        scaleY: 0.85,
        phiLength: Math.PI / 2,
      });
      addCyl(extGroup, 0.025, 0.025, 0.32, 1.55, 2.12, -0.15, 0xd4af37, 8);
      addBox(extGroup, 0.18, 0.03, 0.03, 1.55, 2.18, -0.15, 0xd4af37);

      // Triple Baroque White Bell-Arch (Kampanario) at Courtyard Edge
      addArchLoggia(extGroup, 1.55, 1.18, 0.82, 0.98, 0.78, 0.18, 3, c1, c1, 0, 'roman');
      addCone(extGroup, 0.06, 0.12, 1.25, 1.55, 0.82, 0xd4af37, 8);
      addCone(extGroup, 0.06, 0.12, 1.55, 1.55, 0.82, 0xd4af37, 8);
      addCone(extGroup, 0.06, 0.12, 1.85, 1.55, 0.82, 0xd4af37, 8);

      // Captain's Mansion Windows with Aegean Cobalt-Blue Shutters & Triangular Pediments
      addGrandEntranceDoor(extGroup, -0.52, 0.08, 0.78, 0.54, 0.78, c2, c1);
      for (const wx of [-1.35, 0.32]) {
        addClassicalWindow(extGroup, wx, 0.58, 0.78, 0.44, 0.56, {
          frameColor: c1,
          shutterColor: c2,
          pediment: 'segmental',
        });
      }
      for (const wx of [-1.35, -0.52, 0.32]) {
        addClassicalWindow(extGroup, wx, 1.58, 0.78, 0.44, 0.58, {
          frameColor: c1,
          shutterColor: c2,
          pediment: 'triangular',
          flowerBoxColor: 0xe11d48,
        });
      }

      // Caldera Cliffside Infinity Pool & Bougainvillea Cascades
      addBox(baseGroup, 2.85, 0.1, 1.15, -0.45, 0.06, 1.58, 0x38bdf8, { roughness: 0.1, metalness: 0.35 });
      for (const bx of [-1.6, 0.8, 1.95]) {
        addTree(baseGroup, bx, 0.06, 1.15, 'rose_bush', 1.25);
      }
      break;
    }

    case 12: {
      // BD-222: Tuscan Medici Renaissance Belvedere Watchtower, 5-Arch Loggia & Cypress Villa
      // Warm Florentine Ochre Main Villa + Rusticated Pietra Serena Grey-Stone Quoins
      addBox(extGroup, 3.95, 2.02, 2.35, 0, 1.06, -0.35, c1);
      addCornerQuoins(extGroup, 0, 0.06, -0.35, 3.95, 2.02, 2.35, 0x78716c, 10);
      addMoldedCornice(extGroup, 0, 1.06, -0.35, 4.02, 2.42, 0x78716c);
      addMoldedCornice(extGroup, 0, 2.06, -0.35, 4.08, 2.48, 0x78716c, c2);
      addHippedRoof(extGroup, 4.25, 0.68, 2.65, 0, 2.08, -0.35, c2, 0x78716c);

      // Ground Floor 5-Arch Stone Column Loggia across Front Facade
      addArchLoggia(extGroup, 0, 0.06, 1.12, 3.65, 1.02, 0.56, 5, c1, 0x78716c, 0, 'roman');
      addBalustrade(extGroup, -1.82, 1.36, 1.82, 1.36, 1.08, 0.22, 0x78716c, 0.18);

      // Central Square Renaissance Belvedere Watchtower with Bifora Arched Windows
      addBox(extGroup, 1.38, 1.12, 1.38, 0, 2.68, -0.35, c1);
      addCornerQuoins(extGroup, 0, 2.12, -0.35, 1.38, 1.12, 1.38, 0x78716c, 5);
      addMoldedCornice(extGroup, 0, 3.22, -0.35, 1.48, 1.48, 0x78716c);
      addHippedRoof(extGroup, 1.62, 0.46, 1.62, 0, 3.24, -0.35, c2, 0xd4af37);
      for (const bx of [-0.28, 0.28]) {
        addClassicalWindow(extGroup, bx, 2.75, 0.35, 0.34, 0.46, {
          frameColor: 0x78716c,
          pediment: 'segmental',
        });
      }

      // 2F Windows with Pietra Serena Triangular Pediments & Green Shutters
      for (const wx of [-1.38, -0.68, 0, 0.68, 1.38]) {
        addClassicalWindow(extGroup, wx, 1.56, 0.84, 0.42, 0.54, {
          frameColor: 0x78716c,
          shutterColor: c3,
          pediment: 'triangular',
        });
      }
      addGrandEntranceDoor(extGroup, 0, 0.08, 0.82, 0.56, 0.76, 0x451a03, 0x78716c);

      // Tuscan Cypress Avenue & Three-Tiered Stone Fountain
      addClassicalFountain(baseGroup, 0, 0.06, 1.68, 0.62, 0xd6d3d1, 0x38bdf8);
      for (const cxPos of [-2.45, -1.75, 1.75, 2.45]) {
        addTree(baseGroup, cxPos, 0.06, 1.42, 'cypress', 1.2);
      }
      break;
    }

    case 13: {
      // BD-223: Seville Mudéjar Horseshoe-Arch Loggia, Azulejo Tower & Star-Patio House
      // U-Shaped Whitewashed Andalusian Palace Embracing Central Courtyard
      addBox(extGroup, 3.95, 2.02, 2.15, 0, 1.06, -0.5, c1);
      addHippedRoof(extGroup, 4.15, 0.62, 2.35, 0, 2.08, -0.5, c2, c3);

      // Two-Story Multifoil Moorish Horseshoe-Arch Marble Loggias (1F & 2F)
      addArchLoggia(extGroup, -0.35, 0.06, 0.82, 2.85, 1.0, 0.52, 5, c1, 0xffffff, 0, 'horseshoe');
      addArchLoggia(extGroup, -0.35, 1.06, 0.82, 2.85, 1.0, 0.52, 5, c1, 0xffffff, 0, 'horseshoe');
      addBalustrade(extGroup, -1.75, 1.04, 1.05, 1.04, 1.06, 0.22, 0xd4af37, 0.16);

      // Right Corner Mirador Tower with Blue-and-Gold Azulejo Glazed Tile Pyramid Roof
      addBox(extGroup, 1.25, 2.85, 1.25, 1.48, 1.48, 0.25, c1);
      addCornerQuoins(extGroup, 1.48, 0.06, 0.25, 1.25, 2.85, 1.25, c2, 12);
      addMoldedCornice(extGroup, 1.48, 2.9, 0.25, 1.35, 1.35, c3, 0xd4af37);
      addHippedRoof(extGroup, 1.48, 0.68, 1.48, 1.48, 2.92, 0.25, c3, 0xd4af37);
      for (const wy of [0.65, 1.55, 2.42]) {
        addClassicalWindow(extGroup, 1.48, wy, 0.88, 0.48, 0.52, {
          frameColor: c2,
          shutterColor: c3,
          pediment: 'segmental',
          flowerBoxColor: 0xe11d48,
        });
      }

      // Central Cross-Canal & Octagonal Azulejo Star Fountain Patio + Orange Trees
      addBox(baseGroup, 2.4, 0.05, 0.22, -0.35, 0.065, 1.58, c3);
      addBox(baseGroup, 0.22, 0.05, 1.15, -0.35, 0.065, 1.58, c3);
      addClassicalFountain(baseGroup, -0.35, 0.06, 1.58, 0.56, 0xffffff, c3);
      for (const ox of [-1.65, 0.85]) {
        addTree(baseGroup, ox, 0.06, 1.58, 'olive', 1.05);
      }
      break;
    }

    case 14: {
      // BD-224: Provence Aix-en-Provence Classical Blonde-Stone & Lavender Bastide Manor
      // 5-Bay Symmetrical Honey-Gold Limestone Bastide + Central Pedimented Breakfront
      addBox(extGroup, 3.95, 2.04, 2.35, 0, 1.06, -0.35, c1);
      addBox(extGroup, 1.28, 2.15, 2.48, 0, 1.12, -0.3, c1);
      addCornerQuoins(extGroup, 0, 0.06, -0.35, 3.95, 2.04, 2.35, 0xffffff, 10);
      addCornerQuoins(extGroup, 0, 0.06, -0.3, 1.28, 2.15, 2.48, 0xffffff, 10);
      addMoldedCornice(extGroup, 0, 1.06, -0.32, 4.02, 2.52, 0xffffff);
      addMoldedCornice(extGroup, 0, 2.12, -0.32, 4.08, 2.58, 0xffffff);

      // Provençal Terracotta Hipped Roof + Central Sculpted Triangular Pediment with Stone Urns
      addHippedRoof(extGroup, 4.18, 0.68, 2.55, 0, 2.14, -0.35, 0xb45309, 0xffffff);
      addPitchedRoof(extGroup, 1.42, 0.46, 2.6, 0, 2.16, -0.3, 0xb45309, 0, c1, 0xffffff);
      addSphere(extGroup, 0.075, -0.68, 2.3, 0.96, 0xffffff);
      addSphere(extGroup, 0.075, 0.68, 2.3, 0.96, 0xffffff);

      // 10 Symmetrical Windows with Lavender-Blue Louvered Shutters + Arched Door & Juliet Balcony
      addGrandEntranceDoor(extGroup, 0, 0.08, 0.94, 0.56, 0.78, c2, 0xffffff);
      addBox(extGroup, 0.76, 0.06, 0.28, 0, 1.1, 1.06, 0xffffff);
      addBalustrade(extGroup, -0.36, 1.18, 0.36, 1.18, 1.13, 0.22, 0x1e293b, 0.14);
      addClassicalWindow(extGroup, 0, 1.6, 0.94, 0.52, 0.62, {
        frameColor: 0xffffff,
        shutterColor: c2,
        pediment: 'segmental',
      });
      for (const wx of [-1.45, -0.88, 0.88, 1.45]) {
        for (const wy of [0.58, 1.58]) {
          addClassicalWindow(extGroup, wx, wy, 0.84, 0.38, 0.56, {
            frameColor: 0xffffff,
            shutterColor: c2,
            pediment: wy > 1 ? 'triangular' : 'keystone',
            flowerBoxColor: c3,
          });
        }
      }

      // Wisteria Wrought-Iron Pergola on Right + Blooming Lavender Rows & Mossy Fountain
      for (const px of [2.05, 2.65]) {
        addCyl(baseGroup, 0.04, 0.04, 1.25, px, 0.68, 0.2, 0x1e293b, 8);
        addCyl(baseGroup, 0.04, 0.04, 1.25, px, 0.68, -0.6, 0x1e293b, 8);
      }
      addBox(baseGroup, 0.75, 0.06, 1.0, 2.35, 1.32, -0.2, c3);
      addClassicalFountain(baseGroup, 0, 0.06, 1.62, 0.56, 0xe7e5e4, 0x38bdf8);
      for (let lx = -2.4; lx <= -1.1; lx += 0.32) {
        addBox(baseGroup, 0.18, 0.18, 0.85, lx, 0.14, 1.55, c3, { roughness: 0.85 });
      }
      addTree(baseGroup, 1.85, 0.06, 1.5, 'cypress', 1.15);
      addTree(baseGroup, 2.45, 0.06, 1.35, 'olive', 1.15);
      break;
    }

    case 15: {
      // BD-225: Lake Como Neoclassical Corinthian Portico, Roof Statuary & Waterfront Stairs Villa
      // Venetian Rose-Coral & Ivory Neoclassical Palazzo Facade
      addBox(extGroup, 4.05, 2.08, 2.35, 0, 1.08, -0.35, c1);
      addCornerQuoins(extGroup, 0, 0.06, -0.35, 4.05, 2.08, 2.35, c2, 10);
      addMoldedCornice(extGroup, 0, 1.08, -0.35, 4.12, 2.42, c2);
      addMoldedCornice(extGroup, 0, 2.12, -0.35, 4.18, 2.48, c2, 0xd4af37);
      addHippedRoof(extGroup, 4.12, 0.62, 2.42, 0, 2.14, -0.35, 0xb45309, 0xd4af37);

      // Giant-Order 4-Column Corinthian Temple Front + Roof Balustrade & Classical Statues
      addClassicalPortico(extGroup, 0, 0.06, 1.12, 1.68, 2.06, 0.62, c2, 0xb45309, {
        numCols: 4,
        hasPediment: true,
        tympanumColor: c1,
        goldAccent: true,
      });
      addBalustrade(extGroup, -1.98, 0.84, 1.98, 0.84, 2.14, 0.24, c2, 0.2, true);

      // Pedimented Windows & Grand Entrance
      addGrandEntranceDoor(extGroup, 0, 0.08, 0.84, 0.58, 0.82, 0x451a03, c2);
      addClassicalWindow(extGroup, 0, 1.58, 0.84, 0.56, 0.64, {
        frameColor: c2,
        pediment: 'segmental',
      });
      for (const wx of [-1.52, -1.02, 1.02, 1.52]) {
        addClassicalWindow(extGroup, wx, 0.58, 0.84, 0.4, 0.58, {
          frameColor: c2,
          pediment: 'triangular',
        });
        addClassicalWindow(extGroup, wx, 1.58, 0.84, 0.4, 0.58, {
          frameColor: c2,
          pediment: 'segmental',
        });
      }

      // Lake Como Turquoise Waterfront, Twin Curved Marble Staircases & Classic Riva Mahogany Boat
      addBox(baseGroup, 6.0, 0.09, 1.05, 0, 0.04, 1.72, c3, { roughness: 0.1, metalness: 0.4 });
      addBox(baseGroup, 1.85, 0.22, 0.55, 0, 0.15, 1.38, c2);
      addClassicalFountain(baseGroup, 0, 0.08, 1.52, 0.38, c2, c3);
      // Classic Riva Mahogany Speedboat moored at dock
      addBox(baseGroup, 0.95, 0.14, 0.34, 1.85, 0.12, 1.75, 0x7c2d12, { roughness: 0.2, metalness: 0.3 });
      addBox(baseGroup, 0.42, 0.08, 0.26, 1.82, 0.2, 1.75, 0xffffff);
      for (const cxPos of [-2.4, -1.75, 1.75, 2.4]) {
        addTree(baseGroup, cxPos, 0.06, 1.12, 'cypress', 1.2);
      }
      break;
    }

    case 16: {
      // BD-226: Cotswold Jacobean Manor · Honey-Stone Triple Gables, Bay Windows & Victorian Orangery
      // Warm Golden Oolitic Limestone Manor Block with Quoins
      addBox(extGroup, 3.55, 2.02, 2.25, -0.35, 1.06, -0.35, c1);
      addCornerQuoins(extGroup, -0.35, 0.06, -0.35, 3.55, 2.02, 2.25, 0xfef3c7, 10);

      // Three Steep Cotswold Stone-Slate Cross Gables with Stone Ball Finials
      addPitchedRoof(extGroup, 3.75, 0.95, 2.42, -0.35, 2.06, -0.35, c2, 0, c1, 0xfef3c7);
      for (const gx of [-1.45, -0.35, 0.75]) {
        addPitchedRoof(extGroup, 1.15, 0.95, 2.48, gx, 2.06, -0.3, c2, Math.PI / 2, c1, 0xfef3c7);
        addClassicalWindow(extGroup, gx, 2.38, 0.92, 0.36, 0.34, {
          frameColor: 0xfef3c7,
          pediment: 'none',
        });
      }

      // Twin Two-Story Octagonal Stone-Mullioned Bay Windows + Tudor Arched Porch
      addBayWindow(extGroup, -1.45, 0.06, 0.78, 0.98, 2.0, 0.44, c1, 0xfef3c7, c2, 0, 2);
      addBayWindow(extGroup, 0.75, 0.06, 0.78, 0.98, 2.0, 0.44, c1, 0xfef3c7, c2, 0, 2);
      addGrandEntranceDoor(extGroup, -0.35, 0.08, 0.8, 0.54, 0.76, 0x451a03, 0xfef3c7);
      addClassicalWindow(extGroup, -0.35, 1.56, 0.8, 0.54, 0.52, {
        frameColor: 0xfef3c7,
        pediment: 'none',
        flowerBoxColor: c3,
      });

      // Right Wing: Ornate White Victorian Glass Orangery / Conservatory with Glass Dome
      addBox(extGroup, 1.35, 1.18, 1.65, 1.95, 0.65, -0.15, 0xbae6fd, {
        opacity: 0.55,
        roughness: 0.12,
        metalness: 0.75,
      });
      // White cast-iron pilasters & arched ribs on Glass Orangery
      for (const ox of [1.32, 1.74, 2.16, 2.58]) {
        addBox(extGroup, 0.05, 1.22, 1.7, ox, 0.66, -0.15, 0xffffff);
      }
      addBalustrade(extGroup, 1.28, 0.68, 2.62, 0.68, 1.24, 0.18, 0xffffff, 0.16);
      addSphere(extGroup, 0.52, 1.95, 1.24, -0.15, 0xe0f2fe, {
        opacity: 0.65,
        scaleY: 0.75,
        phiLength: Math.PI / 2,
      });
      addSphere(extGroup, 0.06, 1.95, 1.68, -0.15, 0xd4af37, { metalness: 0.7 });

      // Twin Diagonal Stone Chimneys & Climbing Pink English Roses
      addOrnateChimney(extGroup, -1.75, 2.08, -0.85, 0.42, 1.15, 0.36, c1, 0xfef3c7, 2);
      addOrnateChimney(extGroup, 0.95, 2.08, -0.85, 0.42, 1.15, 0.36, c1, 0xfef3c7, 2);
      for (const rx of [-1.95, -0.85, 0.15, 1.45, 2.35]) {
        addTree(baseGroup, rx, 0.06, 1.35, 'rose_bush', 1.2);
      }
      break;
    }

    case 17: {
      // BD-227: Normandy Deauville Polychrome Half-Timbered Twin Conical-Turret Manor Villa
      // 1F Checkerboard Brick & Limestone Base + 2F Cantilevered Half-Timbered Colombage
      addBox(extGroup, 3.65, 1.0, 2.25, 0, 0.56, -0.35, 0xd6d3d1);
      addCornerQuoins(extGroup, 0, 0.06, -0.35, 3.65, 1.0, 2.25, 0x991b1b, 5);
      addBox(extGroup, 3.85, 1.08, 2.42, 0, 1.6, -0.32, c1);
      addHalfTimberWallPanel(extGroup, 0, 1.6, 0.9, 2.45, 1.04, c2);
      addHalfTimberWallPanel(extGroup, -1.93, 1.6, -0.32, 2.3, 1.04, c2, Math.PI / 2);
      addHalfTimberWallPanel(extGroup, 1.93, 1.6, -0.32, 2.3, 1.04, c2, Math.PI / 2);

      // Steep Blue-Slate Roof + Central Gable + Glazed Ceramic Roof Finials
      addPitchedRoof(extGroup, 4.0, 1.02, 2.55, 0, 2.14, -0.32, c3, 0, c1, c2);
      addPitchedRoof(extGroup, 1.45, 1.05, 2.62, 0, 2.14, -0.25, c3, Math.PI / 2, c1, c2);

      // Signature Twin Asymmetrical Octagonal Turrets with Steep Conical Slate Spires
      addVictorianTurret(extGroup, -1.55, 0.06, 0.58, 0.62, 2.45, 1.22, c1, c2, c3);
      addVictorianTurret(extGroup, 1.55, 0.06, 0.58, 0.54, 2.15, 1.05, c1, c2, c3);

      // Arched Entrance, Mullioned Windows & Dormers
      addGrandEntranceDoor(extGroup, 0, 0.08, 0.78, 0.56, 0.78, c2, c1);
      addClassicalWindow(extGroup, -0.68, 0.56, 0.78, 0.42, 0.52, { frameColor: c2, pediment: 'keystone' });
      addClassicalWindow(extGroup, 0.68, 0.56, 0.78, 0.42, 0.52, { frameColor: c2, pediment: 'keystone' });
      addClassicalWindow(extGroup, 0, 1.62, 0.92, 0.58, 0.56, {
        frameColor: c2,
        pediment: 'triangular',
        flowerBoxColor: 0x38bdf8,
      });
      addClassicalWindow(extGroup, 0, 2.45, 1.02, 0.42, 0.42, { frameColor: c2, pediment: 'none' });

      addOrnateChimney(extGroup, -0.85, 2.15, -0.9, 0.36, 1.1, 0.36, 0x991b1b, c1, 2);
      addTree(baseGroup, -2.35, 0.06, 1.25, 'olive', 1.2);
      addTree(baseGroup, 2.35, 0.06, 1.25, 'olive', 1.2);
      addTree(baseGroup, -0.95, 0.06, 1.55, 'rose_bush', 1.15);
      addTree(baseGroup, 0.95, 0.06, 1.55, 'rose_bush', 1.15);
      break;
    }

    case 18: {
      // BD-228: Sintra Romanticist Azulejo Tile, Manueline Arch & Onion-Spire Palace Villa
      // Sunny Ochre-Yellow & Blue-White Azulejo Tile Facade
      addBox(extGroup, 3.65, 2.05, 2.25, -0.25, 1.08, -0.35, c1);
      // Blue-and-white Azulejo tile wainscot & frieze bands
      addBox(extGroup, 3.7, 0.42, 2.3, -0.25, 0.28, -0.35, c2);
      addBox(extGroup, 3.7, 0.16, 2.3, -0.25, 1.1, -0.35, c2);
      addMoldedCornice(extGroup, -0.25, 2.1, -0.35, 3.78, 2.38, 0xffffff, c2);
      addHippedRoof(extGroup, 3.82, 0.65, 2.42, -0.25, 2.12, -0.35, 0xb45309, 0xd4af37);

      // Ground Floor Sculpted Manueline Trefoil/Gothic Arch Loggia
      addArchLoggia(extGroup, -0.35, 0.06, 0.98, 2.75, 1.04, 0.52, 4, 0xffffff, 0xffffff, 0, 'gothic');
      addBalustrade(extGroup, -1.72, 1.22, 1.02, 1.22, 1.1, 0.24, 0xffffff, 0.16, true);

      // Right Corner Crenellated Romanticist Tower with Red-and-Gold Onion Dome Spire
      addVictorianTurret(extGroup, 1.52, 0.06, 0.42, 0.64, 2.45, 0.95, c3, 0xffffff, 0xd4af37, true);

      // Ornate Manueline Arched Windows on 2F
      for (const wx of [-1.35, -0.68, 0, 0.68]) {
        addClassicalWindow(extGroup, wx, 1.6, 0.78, 0.42, 0.56, {
          frameColor: 0xffffff,
          shutterColor: c2,
          pediment: 'gothic',
        });
      }

      // Compass-Rose Star Fountain & Subtropical Palms
      addClassicalFountain(baseGroup, -0.35, 0.06, 1.65, 0.58, 0xffffff, 0x06b6d4);
      addTree(baseGroup, -2.35, 0.06, 1.25, 'palm', 1.15);
      addTree(baseGroup, 2.35, 0.06, 1.25, 'palm', 1.15);
      break;
    }

    case 19: {
      // BD-229: Hallstatt Lakeside Baroque-Gable, Stone Arch & Carved Floral Balcony House
      // Ground Floor Stone Arch Base + Apricot-Cream Upper Facade
      addBox(extGroup, 3.65, 0.98, 2.35, 0, 0.54, -0.35, 0xd6d3d1);
      addBox(extGroup, 3.75, 1.12, 2.42, 0, 1.58, -0.35, c1);
      addArchLoggia(extGroup, 0, 0.06, 0.88, 2.85, 0.96, 0.36, 3, 0xd6d3d1, 0xf5f5f4, 0, 'roman');

      // Steep Alpine Roof + Tall Austrian Baroque Stepped Volute Front Gable
      addPitchedRoof(extGroup, 4.15, 1.12, 2.75, 0, 2.12, -0.35, 0x475569, Math.PI / 2, c1, c2);
      addSteppedGable(extGroup, 0, 2.12, 0.92, 2.65, 1.18, 0.18, c1, 0xffffff, 0, 5);

      // Two Levels of Intricately Carved Larch-Timber Balconies Draped in Red Geraniums
      for (const [byPos, bw] of [
        [1.06, 3.65],
        [2.08, 2.45],
      ] as [number, number][]) {
        addBox(extGroup, bw, 0.08, 0.52, 0, byPos, 1.06, c2);
        addBalustrade(extGroup, -bw / 2, 1.28, bw / 2, 1.28, byPos + 0.04, 0.24, c2, 0.14);
        addBox(extGroup, bw - 0.1, 0.08, 0.12, 0, byPos + 0.24, 1.32, 0x15803d);
        for (let gx = -bw / 2 + 0.2; gx <= bw / 2 - 0.2; gx += 0.26) {
          addSphere(extGroup, 0.052, gx, byPos + 0.3, 1.34, c3);
        }
      }

      // Windows with Red-and-Green Painted Alpine Shutters
      for (const wx of [-1.22, -0.42, 0.42, 1.22]) {
        addClassicalWindow(extGroup, wx, 1.56, 0.86, 0.4, 0.5, {
          frameColor: 0xffffff,
          shutterColor: c3,
          pediment: 'segmental',
        });
      }
      addClassicalWindow(extGroup, 0, 2.52, 1.02, 0.46, 0.48, {
        frameColor: 0xffffff,
        shutterColor: 0x15803d,
        pediment: 'triangular',
      });

      // Hallstatt Emerald Lakefront & Wooden Punt Boat Jetty
      addBox(baseGroup, 5.9, 0.08, 1.05, 0, 0.04, 1.72, 0x0d9488, { roughness: 0.12, metalness: 0.35 });
      addBox(baseGroup, 0.85, 0.08, 0.95, 0, 0.12, 1.55, c2);
      addBox(baseGroup, 0.92, 0.12, 0.32, 1.35, 0.1, 1.78, 0x78350f);
      addTree(baseGroup, -2.35, 0.06, 0.95, 'pine', 1.25);
      addTree(baseGroup, 2.35, 0.06, 0.95, 'pine', 1.25);
      break;
    }

    case 20: {
      // BD-230: Venetian Grand Canal Gothic Quatrefoil-Tracery & Water-Gate Palazzo House (Ca' d'Oro)
      // Rose-Pink Verona Marble & White Istrian Stone Palazzo Facade
      addBox(extGroup, 3.95, 2.18, 2.35, 0, 1.14, -0.35, c1);
      addCornerQuoins(extGroup, 0, 0.06, -0.35, 3.95, 2.18, 2.35, c2, 12);
      addMoldedCornice(extGroup, 0, 1.1, -0.35, 4.04, 2.44, c2, 0xd4af37);
      addMoldedCornice(extGroup, 0, 2.22, -0.35, 4.1, 2.5, c2, 0xd4af37);
      addHippedRoof(extGroup, 3.95, 0.55, 2.35, 0, 2.24, -0.35, 0xb45309, 0xd4af37);

      // Venetian Lace-Like Rooftop Crenellations (Merlatura) along front roofline
      for (let mx = -1.88; mx <= 1.88; mx += 0.22) {
        addCone(extGroup, 0.08, 0.24, mx, 2.36, 0.86, c2, 4, Math.PI / 4);
      }

      // 1F Grand Canal Water-Gate (Porta d'Acqua) 5-Arch Loggia + 2F Piano Nobile Gothic Quatrefoil Arcade
      addArchLoggia(extGroup, 0, 0.06, 0.92, 2.35, 1.02, 0.36, 5, c2, c2, 0, 'roman');
      addArchLoggia(extGroup, 0, 1.12, 0.92, 2.55, 1.08, 0.38, 6, c1, c2, 0, 'gothic');
      addBalustrade(extGroup, -1.28, 1.08, 1.28, 1.08, 1.12, 0.22, c2, 0.14);

      // Flanking Gothic Ogee-Arched Windows with Marble Balconies
      for (const wx of [-1.58, 1.58]) {
        addClassicalWindow(extGroup, wx, 0.58, 0.84, 0.44, 0.58, {
          frameColor: c2,
          pediment: 'gothic',
        });
        addClassicalWindow(extGroup, wx, 1.62, 0.84, 0.46, 0.64, {
          frameColor: c2,
          pediment: 'gothic',
        });
      }

      // Grand Canal Waterway, Blue-and-Gold Mooring Poles (Pali) & Black-Gold Venetian Gondola
      addBox(baseGroup, 6.0, 0.09, 1.15, 0, 0.04, 1.68, c3, { roughness: 0.1, metalness: 0.4 });
      for (const px of [-1.35, -0.85, 0.85, 1.35]) {
        addCyl(baseGroup, 0.045, 0.05, 0.68, px, 0.38, 1.48, 0x1d4ed8, 8);
        addSphere(baseGroup, 0.055, px, 0.74, 1.48, 0xd4af37, { metalness: 0.75 });
      }
      // Gondola
      addBox(baseGroup, 1.25, 0.1, 0.28, 0.65, 0.1, 1.78, 0x0f172a);
      addBox(baseGroup, 0.36, 0.18, 0.24, 0.65, 0.2, 1.78, 0xd4af37, { metalness: 0.65 });
      break;
    }

    case 21: {
      // BD-231: Suzhou Classical Garden Villa · Double-Eave Mandarin Hall, Moon-Gate & Winding Bridge
      // 2-Story Whitewashed Main Hall with Carved Mahogany Lattice Doors (Gezimen)
      addBox(extGroup, 3.65, 2.02, 2.25, 0, 1.06, -0.45, c1);
      // 1F & 2F Sweeping Double-Eave Xieshan Roofs with Upturned Flying Corners (Feiyan)
      addChineseUpturnedRoof(extGroup, 0, 1.08, -0.45, 3.95, 0.32, 2.55, c2, 0x7c2d12);
      addChineseUpturnedRoof(extGroup, 0, 2.06, -0.45, 3.85, 0.72, 2.45, c2, 0x7c2d12);

      // Stepped White-Wall & Black-Tile Matouqiang (Horse-Head Gables) on Left & Right Ends
      addSteppedGable(extGroup, -1.88, 0.06, -0.45, 2.35, 2.55, 0.16, c1, c2, Math.PI / 2, 4);
      addSteppedGable(extGroup, 1.88, 0.06, -0.45, 2.35, 2.55, 0.16, c1, c2, Math.PI / 2, 4);

      // Carved Mahogany Lattice Windows, Round Moon-Windows & 2F Wooden Veranda Railing
      addBalustrade(extGroup, -1.72, 0.72, 1.72, 0.72, 1.12, 0.22, 0x7c2d12, 0.16);
      addGrandEntranceDoor(extGroup, 0, 0.08, 0.68, 0.62, 0.78, 0x7c2d12, 0xd4af37);
      for (const wx of [-1.18, -0.58, 0.58, 1.18]) {
        addClassicalWindow(extGroup, wx, 0.56, 0.68, 0.44, 0.58, {
          frameColor: 0x7c2d12,
          pediment: 'none',
        });
        addClassicalWindow(extGroup, wx, 1.58, 0.68, 0.44, 0.54, {
          frameColor: 0x7c2d12,
          pediment: 'none',
        });
      }

      // Courtyard Emerald Koi Lotus Pond, Crimson Zigzag Bridge, Moon-Gate Wall & Waterside Pavilion
      addBox(baseGroup, 3.6, 0.08, 1.25, 0.25, 0.04, 1.48, c3, { roughness: 0.12, metalness: 0.3 });
      // Crimson Zigzag Bridge (Jiuquqiao)
      addBox(baseGroup, 0.42, 0.08, 0.68, -0.15, 0.12, 1.18, 0xb91c1c, { rotY: 0.28 });
      addBox(baseGroup, 0.42, 0.08, 0.68, 0.05, 0.12, 1.72, 0xb91c1c, { rotY: -0.28 });
      // Hexagonal Upturned-Eave Waterside Pavilion on Right
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        addCyl(baseGroup, 0.035, 0.04, 0.85, 1.95 + Math.cos(a) * 0.45, 0.48, 1.48 + Math.sin(a) * 0.45, 0x7c2d12, 8);
      }
      addCone(baseGroup, 0.68, 0.46, 1.95, 1.12, 1.48, c2, 6);
      addSphere(baseGroup, 0.055, 1.95, 1.38, 1.48, 0xd4af37, { metalness: 0.7 });

      // Circular Moon-Gate Wall on Left
      addBox(baseGroup, 1.25, 1.15, 0.14, -1.95, 0.62, 1.35, c1);
      addBox(baseGroup, 1.35, 0.09, 0.22, -1.95, 1.22, 1.35, c2);
      addCyl(baseGroup, 0.42, 0.42, 0.18, -1.95, 0.52, 1.35, c2, 18, { rotX: Math.PI / 2 });
      addCyl(baseGroup, 0.35, 0.35, 0.2, -1.95, 0.52, 1.35, 0x166534, 16, { rotX: Math.PI / 2 });
      addTree(baseGroup, -2.5, 0.06, 0.85, 'maple', 1.1);
      break;
    }

    case 22: {
      // BD-232: Beijing Princely Siheyuan · Marble Plinth, Double-Eave Hall & Festooned Gate
      // White Marble Sumeru Plinth (Xumizuo) with Carved Balustrade
      addBox(extGroup, 4.25, 0.28, 2.55, 0, 0.18, -0.4, 0xffffff);
      addBalustrade(extGroup, -2.05, 0.82, -0.55, 0.82, 0.32, 0.2, 0xffffff, 0.2);
      addBalustrade(extGroup, 0.55, 0.82, 2.05, 0.82, 0.32, 0.2, 0xffffff, 0.2);

      // Imperial Vermilion Main Hall with Painted Beams (Hexi Caihua) & Double-Eave Grey-Tile Roof
      addBox(extGroup, 3.85, 1.88, 2.15, 0, 1.24, -0.42, c1);
      // Green & Gold Painted Architrave Friezes
      addBox(extGroup, 3.9, 0.14, 2.2, 0, 1.12, -0.42, 0x047857);
      addBox(extGroup, 3.9, 0.14, 2.2, 0, 2.08, -0.42, 0x047857);
      addChineseUpturnedRoof(extGroup, 0, 1.18, -0.42, 4.15, 0.34, 2.48, c2, c3, c3);
      addChineseUpturnedRoof(extGroup, 0, 2.15, -0.42, 4.05, 0.78, 2.38, c2, c3, c3);

      // Vermilion Colonnade & Lattice Doors
      for (let cxPos = -1.75; cxPos <= 1.75; cxPos += 0.7) {
        addCyl(extGroup, 0.065, 0.07, 1.85, cxPos, 1.24, 0.68, c1, 12);
      }
      addGrandEntranceDoor(extGroup, 0, 0.32, 0.66, 0.64, 0.78, c1, c3);
      for (const wx of [-1.05, 1.05]) {
        addClassicalWindow(extGroup, wx, 0.76, 0.66, 0.56, 0.52, { frameColor: c3, pediment: 'none' });
        addClassicalWindow(extGroup, wx, 1.68, 0.66, 0.56, 0.52, { frameColor: c3, pediment: 'none' });
      }

      // Ornate Festooned Gate (Chuihuamen) & Painted Courtyard Verandas + Gilded Bronze Vats
      addBox(baseGroup, 1.15, 0.08, 0.65, 0, 0.08, 1.55, 0xffffff);
      for (const gx of [-0.42, 0.42]) {
        addCyl(baseGroup, 0.05, 0.055, 0.95, gx, 0.58, 1.55, c1, 10);
        // Hanging Lotus Pendants (Chuihua)
        addCyl(baseGroup, 0.04, 0.02, 0.22, gx * 0.65, 0.88, 1.78, c3, 8);
      }
      addChineseUpturnedRoof(baseGroup, 0, 1.05, 1.55, 1.35, 0.38, 0.85, c2, 0x047857, c3);
      // Gilded Bronze Water Vats & Crabapple Trees
      addCyl(baseGroup, 0.18, 0.14, 0.26, -1.25, 0.19, 1.35, c3, 14, { metalness: 0.75, roughness: 0.25 });
      addCyl(baseGroup, 0.18, 0.14, 0.26, 1.25, 0.19, 1.35, c3, 14, { metalness: 0.75, roughness: 0.25 });
      addTree(baseGroup, -2.25, 0.06, 1.35, 'maple', 1.15);
      addTree(baseGroup, 2.25, 0.06, 1.35, 'pine', 1.15);
      break;
    }

    case 23: {
      // BD-233: Kyoto Classical Shoin-zukuri Karahafu Porch, Chidori Gable & Zen Bridge Villa
      // Elevated Hinoki Cypress Engawa Veranda + Cream Plaster & Cedar Timber Frame
      addBox(extGroup, 4.15, 0.18, 2.65, 0, 0.15, -0.35, c1);
      addBalustrade(extGroup, -2.02, 0.94, 2.02, 0.94, 0.24, 0.2, c1, 0.2);
      addBox(extGroup, 3.65, 1.92, 2.15, 0, 1.18, -0.38, 0xfef3c7);
      addHalfTimberWallPanel(extGroup, 0, 1.18, 0.7, 3.65, 1.88, 0x78350f);

      // Multi-Layered Dark Kawara Tile Irimoya Roofs + Central Chidori-Hafu Triangular Gable
      addChineseUpturnedRoof(extGroup, 0, 1.15, -0.38, 4.25, 0.32, 2.75, c2, c1);
      addChineseUpturnedRoof(extGroup, 0, 2.08, -0.38, 4.05, 0.76, 2.55, c2, c1);
      addPitchedRoof(extGroup, 1.45, 0.62, 2.65, 0, 2.12, -0.3, c2, Math.PI / 2, 0xfef3c7, 0xd4af37);

      // Signature Curved Karahafu Cypress Entrance Porch with Gold Imperial Chrysanthemum Crest
      addCyl(extGroup, 0.65, 0.65, 0.78, 0, 0.98, 1.08, c2, 16, { rotX: Math.PI / 2 });
      addSphere(extGroup, 0.08, 0, 1.18, 1.46, 0xd4af37, { metalness: 0.8 });
      addCyl(extGroup, 0.055, 0.06, 0.92, -0.52, 0.56, 1.36, c1, 10);
      addCyl(extGroup, 0.055, 0.06, 0.92, 0.52, 0.56, 1.36, c1, 10);

      // Yukimi-Shoji Screens & Kumiko Lattice Windows
      for (const wx of [-1.18, 0, 1.18]) {
        if (wx !== 0) {
          addClassicalWindow(extGroup, wx, 0.68, 0.71, 0.68, 0.58, {
            frameColor: 0x78350f,
            glassColor: 0xfef3c7,
            pediment: 'none',
          });
        }
        addClassicalWindow(extGroup, wx, 1.62, 0.71, 0.64, 0.52, {
          frameColor: 0x78350f,
          glassColor: 0xfef3c7,
          pediment: 'none',
        });
      }

      // Karesansui White Gravel Zen Garden, Arched Vermilion Taiko Bridge, Stone Lantern & Red Maple
      addBox(baseGroup, 2.4, 0.05, 1.15, -1.15, 0.06, 1.52, 0xf8fafc, { roughness: 0.9 });
      addBox(baseGroup, 2.1, 0.08, 0.95, 1.25, 0.04, 1.55, 0x0d9488, { roughness: 0.15 });
      // Arched Vermilion Bridge
      addCyl(baseGroup, 0.55, 0.55, 0.42, 0.85, -0.18, 1.55, c3, 16, { rotX: Math.PI / 2 });
      // Stone Lantern (Toro)
      addCyl(baseGroup, 0.06, 0.08, 0.36, -0.65, 0.24, 1.55, 0x94a3b8, 8);
      addCone(baseGroup, 0.18, 0.14, -0.65, 0.46, 1.55, 0x64748b, 6);
      addTree(baseGroup, 2.25, 0.06, 1.35, 'maple', 1.25);
      addTree(baseGroup, -2.35, 0.06, 1.25, 'pine', 1.2);
      break;
    }

    case 24: {
      // BD-234: Huizhou Classical Five-Peak Horse-Head Gables, Carved Brick Gate & Sky-Well Manor
      // High Whitewashed Huizhou Courtyard Walls
      addBox(extGroup, 3.95, 2.15, 2.35, 0, 1.12, -0.35, c1);
      addChineseUpturnedRoof(extGroup, 0, 2.16, -0.35, 4.05, 0.65, 2.45, c2, 0x451a03);

      // Towering Five-Peak Stepped Horse-Head Gables (Wuyue Chaotian Matouqiang) on Left, Right & Front
      addSteppedGable(extGroup, -1.98, 0.06, -0.35, 2.48, 2.78, 0.18, c1, c2, Math.PI / 2, 5);
      addSteppedGable(extGroup, 1.98, 0.06, -0.35, 2.48, 2.78, 0.18, c1, c2, Math.PI / 2, 5);
      addSteppedGable(extGroup, -1.25, 2.12, 0.84, 1.35, 0.72, 0.16, c1, c2, 0, 3);
      addSteppedGable(extGroup, 1.25, 2.12, 0.84, 1.35, 0.72, 0.16, c1, c2, 0, 3);

      // Museum-Grade Multi-Tiered Carved Grey-Brick Entrance Gatehouse (Menlou)
      addBox(extGroup, 1.38, 1.65, 0.36, 0, 0.88, 0.92, 0x475569);
      // Deep relief brick-carved plaques & gold accents
      addBox(extGroup, 0.98, 0.32, 0.42, 0, 1.22, 0.95, 0x64748b);
      addBox(extGroup, 0.76, 0.18, 0.45, 0, 1.22, 0.96, c3, { metalness: 0.55 });
      addChineseUpturnedRoof(extGroup, 0, 1.48, 0.95, 1.58, 0.28, 0.58, c2, c3);
      addChineseUpturnedRoof(extGroup, 0, 1.82, 0.95, 1.28, 0.32, 0.52, c2, c3);
      addGrandEntranceDoor(extGroup, 0, 0.08, 0.86, 0.58, 0.78, 0x1e293b, 0xd6d3d1);
      // Pair of Carved Stone Drum Blocks (Baogushi)
      addCyl(extGroup, 0.14, 0.14, 0.12, -0.45, 0.18, 1.16, 0xd6d3d1, 14, { rotZ: Math.PI / 2 });
      addCyl(extGroup, 0.14, 0.14, 0.12, 0.45, 0.18, 1.16, 0xd6d3d1, 14, { rotZ: Math.PI / 2 });

      // Carved Wood Lattice Windows on 2F
      for (const wx of [-1.25, 0, 1.25]) {
        addClassicalWindow(extGroup, wx, 1.62, 0.84, 0.48, 0.48, {
          frameColor: 0x451a03,
          pediment: 'none',
        });
      }

      // Forecourt Reflection Pool & Pine/Bamboo
      addBox(baseGroup, 2.6, 0.08, 0.95, 0, 0.05, 1.65, 0x0d9488, { roughness: 0.15 });
      addTree(baseGroup, -2.35, 0.06, 1.25, 'pine', 1.2);
      addTree(baseGroup, 2.35, 0.06, 1.25, 'maple', 1.15);
      break;
    }

    case 25: {
      // BD-235: Udaipur Rajput White-Marble Jharokha Balcony, Cusped Arch & Chhatri Dome Villa
      // Pure Makrana White-Marble Haveli Palace Block with Gold Trim
      addBox(extGroup, 3.95, 2.08, 2.35, 0, 1.08, -0.35, c1);
      addCornerQuoins(extGroup, 0, 0.06, -0.35, 3.95, 2.08, 2.35, c2, 10);
      addMoldedCornice(extGroup, 0, 1.08, -0.35, 4.04, 2.44, c1, c2);
      addMoldedCornice(extGroup, 0, 2.12, -0.35, 4.12, 2.52, c1, c2);
      addBalustrade(extGroup, -1.95, 0.86, 1.95, 0.86, 2.14, 0.24, c1, 0.16, true);

      // Ground Floor Scalloped Multi-Cusped Marble Arch Colonnade
      addArchLoggia(extGroup, 0, 0.06, 1.02, 3.55, 1.02, 0.48, 5, c1, c1, 0, 'horseshoe');

      // 2F Overhanging Carved Marble Jharokha Balconies with Curved Bangaldar Canopies
      for (const jx of [-1.28, 0, 1.28]) {
        addBayWindow(extGroup, jx, 1.12, 0.82, 0.82, 0.94, 0.42, c1, c2, c2, 0, 1);
      }

      // Three Rooftop Octagonal Rajput Chhatri Pavilions with Lotus Domes & Gold Finials
      for (const [cxPos, rSize, hSize] of [
        [-1.38, 0.44, 0.62],
        [0, 0.58, 0.78],
        [1.38, 0.44, 0.62],
      ] as [number, number, number][]) {
        addVictorianTurret(extGroup, cxPos, 2.14, -0.25, rSize, hSize, 0.45, c1, c2, c1, true);
      }

      // Turquoise Lotus Fountain Pool & White Marble Welcome Elephants
      addBox(baseGroup, 3.4, 0.09, 1.05, 0, 0.05, 1.65, c3, { roughness: 0.1, metalness: 0.35 });
      addClassicalFountain(baseGroup, -0.95, 0.06, 1.65, 0.36, c1, c3);
      addClassicalFountain(baseGroup, 0.95, 0.06, 1.65, 0.36, c1, c3);
      addTree(baseGroup, -2.35, 0.06, 1.25, 'palm', 1.15);
      addTree(baseGroup, 2.35, 0.06, 1.25, 'palm', 1.15);
      break;
    }

    case 26: {
      // BD-236: Chiang Mai Royal Lanna Three-Tiered Golden-Teak Gable, Chofa & Lotus Moat Villa
      // Raised Stone & Teak Colonnade Plinth + Golden-Teak Main Hall
      addBox(extGroup, 4.05, 0.32, 2.45, 0, 0.2, -0.35, 0xfef3c7);
      addBox(extGroup, 3.55, 1.78, 2.05, 0, 1.22, -0.35, c1);
      for (let tx = -1.75; tx <= 1.75; tx += 0.7) {
        addCyl(extGroup, 0.065, 0.08, 1.82, tx, 1.22, 0.76, c1, 12);
      }
      addBalustrade(extGroup, -1.78, 0.78, 1.78, 0.78, 1.12, 0.22, c2, 0.16);

      // Dramatic Three-Tiered Steeply Pitched Thai Roofs + Cross Gable with Gold Mosaic Tympanum
      addPitchedRoof(extGroup, 4.35, 0.65, 2.75, 0, 2.02, -0.35, c1, 0, c2, c2);
      addPitchedRoof(extGroup, 3.65, 0.75, 2.35, 0, 2.42, -0.35, c1, 0, c2, c2);
      addPitchedRoof(extGroup, 2.85, 0.85, 1.95, 0, 2.82, -0.35, c1, 0, c2, c2);
      // Front Gilded Carved Gable + Soaring Golden Chofa Sky-Tassels
      addPitchedRoof(extGroup, 1.65, 1.15, 2.65, 0, 2.12, -0.2, c1, Math.PI / 2, c2, c2);
      addCone(extGroup, 0.065, 0.48, 0, 3.45, 1.12, c2, 8, 0, 0.85);
      addCone(extGroup, 0.065, 0.48, -1.42, 3.85, -0.35, c2, 8, 0, 0.85);
      addCone(extGroup, 0.065, 0.48, 1.42, 3.85, -0.35, c2, 8, 0, 0.85);

      // Carved Teak Windows & Doors with Gold Trim
      addGrandEntranceDoor(extGroup, 0, 0.34, 0.68, 0.58, 0.76, c1, c2);
      for (const wx of [-1.08, 1.08]) {
        addClassicalWindow(extGroup, wx, 0.74, 0.68, 0.48, 0.52, { frameColor: c2, pediment: 'triangular' });
        addClassicalWindow(extGroup, wx, 1.62, 0.68, 0.48, 0.52, { frameColor: c2, pediment: 'triangular' });
      }

      // Pink Lotus Reflection Moat, Timber Walkway & Poolside Thai Sala Pavilion
      addBox(baseGroup, 4.2, 0.08, 1.15, 0, 0.04, 1.58, c3, { roughness: 0.12, metalness: 0.3 });
      for (const lx of [-1.4, -0.7, 0.7, 1.4]) {
        addSphere(baseGroup, 0.055, lx, 0.1, 1.58, 0xf43f5e);
      }
      addTree(baseGroup, -2.4, 0.06, 1.25, 'palm', 1.2);
      addTree(baseGroup, 2.4, 0.06, 1.25, 'palm', 1.2);
      break;
    }

    case 27: {
      // BD-237: Singapore Peranakan Pastel-Baroque Shophouse-Mansion with Corinthian Pilasters & Pool
      // Mint-Turquoise & Rose-Pink Double-Bay Peranakan Mansion
      addBox(extGroup, 3.85, 2.08, 2.35, 0, 1.08, -0.35, c1);
      addMoldedCornice(extGroup, 0, 1.08, -0.35, 3.96, 2.45, c3, c2);
      addMoldedCornice(extGroup, 0, 2.12, -0.35, 4.02, 2.52, c3, c2);
      addPitchedRoof(extGroup, 4.08, 0.78, 2.55, 0, 2.14, -0.35, 0xb45309, 0, c2, c3);

      // Baroque Shaped Parapet Gable Crown with Gold Crest
      addSteppedGable(extGroup, 0, 2.14, 0.86, 2.25, 0.78, 0.16, c2, c3, 0, 4);

      // Ground-Floor Five-Foot Way (Kaki Lima) Arched Arcade + Fluted White Corinthian Pilasters
      addArchLoggia(extGroup, 0, 0.06, 1.08, 3.65, 1.02, 0.52, 4, c3, c3, 0, 'roman');
      for (const px of [-1.82, -0.92, 0, 0.92, 1.82]) {
        addBox(extGroup, 0.12, 1.02, 0.12, px, 1.6, 0.84, c3);
        addBox(extGroup, 0.16, 0.08, 0.16, px, 2.08, 0.84, 0xd4af37);
      }

      // Gilded Pintu Pagar Swing Door, Majolica Tile Wainscot & Triple Louvered French Windows
      addGrandEntranceDoor(extGroup, 0, 0.08, 0.84, 0.62, 0.78, c2, 0xd4af37);
      for (const wx of [-1.36, -0.46, 0.46, 1.36]) {
        addClassicalWindow(extGroup, wx, 1.6, 0.84, 0.42, 0.62, {
          frameColor: c3,
          shutterColor: 0x0f766e,
          pediment: 'segmental',
          flowerBoxColor: c2,
        });
      }

      // Courtyard Emerald Pool & Frangipani Trees
      addBox(baseGroup, 2.65, 0.08, 0.98, 0.85, 0.05, 1.65, 0x10b981, { roughness: 0.1, metalness: 0.35 });
      addClassicalFountain(baseGroup, -1.25, 0.06, 1.65, 0.52, c3, 0x10b981);
      addTree(baseGroup, -2.35, 0.06, 1.25, 'palm', 1.15);
      addTree(baseGroup, 2.45, 0.06, 1.25, 'olive', 1.15);
      break;
    }

    case 28: {
      // BD-238: Santa Barbara Spanish Colonial Revival Twin-Bell-Tower & Arcade Hacienda Villa
      // Smooth Ivory Stucco Main Hacienda Block + Red Mission Barrel-Tile Roof
      addBox(extGroup, 3.65, 2.02, 2.25, 0, 1.06, -0.35, c1);
      addHippedRoof(extGroup, 3.85, 0.65, 2.45, 0, 2.08, -0.35, c2, 0x78350f);

      // Twin Asymmetric Spanish Bell-Towers with Arched Belfries & Bronze Bells
      // Left Tall Square Bell Tower
      addBox(extGroup, 1.18, 2.95, 1.18, -1.58, 1.52, 0.25, c1);
      addArchLoggia(extGroup, -1.58, 2.28, 0.84, 0.92, 0.68, 0.22, 2, c1, c2, 0, 'roman');
      addHippedRoof(extGroup, 1.35, 0.54, 1.35, -1.58, 2.98, 0.25, c2, 0xd4af37);
      // Right Octagonal Mirador Tower
      addVictorianTurret(extGroup, 1.58, 0.06, 0.32, 0.58, 2.35, 0.62, c1, c2, c2);

      // Ground-Floor 4-Arch White Stucco Loggia + Talavera-Tiled Exterior Staircase
      addArchLoggia(extGroup, 0, 0.06, 0.98, 2.25, 1.0, 0.48, 3, c1, c1, 0, 'roman');
      addBalustrade(extGroup, -1.05, 1.2, 1.05, 1.2, 1.08, 0.22, 0x1e293b, 0.14);
      // Exterior Talavera-Tiled Staircase on Left
      for (let s = 0; s < 6; s++) {
        addBox(extGroup, 0.36, 0.16, 0.22, -0.95 + s * 0.12, 0.12 + s * 0.16, 1.28, c3);
      }

      // Wrought-Iron Rejas Windows & Heavy Carved Wood Portal
      addGrandEntranceDoor(extGroup, 0, 0.08, 0.78, 0.58, 0.78, 0x451a03, c2);
      for (const wx of [-0.68, 0, 0.68]) {
        addClassicalWindow(extGroup, wx, 1.58, 0.78, 0.44, 0.54, {
          frameColor: 0x451a03,
          shutterColor: c3,
          pediment: 'segmental',
          flowerBoxColor: 0xe11d48,
        });
      }

      // Octagonal Talavera Tile Fountain & Courtyard Pool
      addClassicalFountain(baseGroup, -0.65, 0.06, 1.65, 0.56, c3, 0x38bdf8);
      addBox(baseGroup, 1.95, 0.08, 0.95, 1.15, 0.05, 1.65, 0x38bdf8, { roughness: 0.1 });
      addTree(baseGroup, -2.35, 0.06, 1.25, 'palm', 1.2);
      addTree(baseGroup, 2.4, 0.06, 1.25, 'cypress', 1.2);
      break;
    }

    case 29: {
      // BD-239: Cape Dutch Baroque Holbol-Gable, Teak-Shutters & Vineyard Manor House
      // Pure Whitewashed Symmetrical Cape Dutch Manor with Raised Red-Brick Stoep
      addBox(extGroup, 4.35, 0.22, 2.85, 0, 0.14, -0.2, 0x991b1b);
      // Curved whitewashed built-in Stoep benches at both ends
      addBox(extGroup, 0.28, 0.34, 0.65, -2.02, 0.34, 0.85, c1);
      addBox(extGroup, 0.28, 0.34, 0.65, 2.02, 0.34, 0.85, c1);

      addBox(extGroup, 3.95, 1.92, 2.25, 0, 1.12, -0.35, c1);
      addPitchedRoof(extGroup, 4.15, 0.95, 2.42, 0, 2.06, -0.35, c2, 0, c1, c1);

      // Iconic Central Baroque Convex-Concave Scrolled Holbol Gable + End Gables
      addPitchedRoof(extGroup, 1.55, 1.18, 2.5, 0, 2.06, -0.28, c2, Math.PI / 2, c1, c1);
      addSteppedGable(extGroup, 0, 2.06, 0.82, 1.65, 1.22, 0.18, c1, c1, 0, 4);
      addSteppedGable(extGroup, -1.98, 2.06, -0.35, 2.25, 0.98, 0.16, c1, c1, Math.PI / 2, 4);
      addSteppedGable(extGroup, 1.98, 2.06, -0.35, 2.25, 0.98, 0.16, c1, c1, Math.PI / 2, 4);

      // Symmetrical Multi-Pane Sash Windows with Dark-Green Teak Shutters & Central Stable Door
      addGrandEntranceDoor(extGroup, 0, 0.24, 0.78, 0.58, 0.82, 0x78350f, c3);
      addClassicalWindow(extGroup, 0, 1.65, 0.78, 0.52, 0.58, {
        frameColor: c1,
        shutterColor: c3,
        pediment: 'segmental',
      });
      addClassicalWindow(extGroup, 0, 2.48, 0.88, 0.38, 0.42, {
        frameColor: c1,
        pediment: 'segmental',
      });
      for (const wx of [-1.42, -0.78, 0.78, 1.42]) {
        addClassicalWindow(extGroup, wx, 0.68, 0.78, 0.42, 0.58, {
          frameColor: c1,
          shutterColor: c3,
          pediment: 'keystone',
        });
        addClassicalWindow(extGroup, wx, 1.58, 0.78, 0.42, 0.52, {
          frameColor: c1,
          shutterColor: c3,
          pediment: 'none',
        });
      }

      // Vineyard Reflection Pond & Heritage Oak Trees
      addBox(baseGroup, 3.2, 0.08, 0.98, 0, 0.05, 1.65, 0x0284c7, { roughness: 0.1, metalness: 0.35 });
      addTree(baseGroup, -2.35, 0.06, 1.25, 'olive', 1.3);
      addTree(baseGroup, 2.35, 0.06, 1.25, 'olive', 1.3);
      break;
    }

    case 30:
    default: {
      // BD-240: Tsarskoye Selo · Russian Imperial Baroque Turquoise, White Columns & Gold Cupola Villa
      // Catherine-Palace Imperial Turquoise Facade + Snow-White Quoins & Gilded Baroque Trim
      addBox(extGroup, 4.05, 2.08, 2.35, 0, 1.08, -0.35, c1);
      addCornerQuoins(extGroup, 0, 0.06, -0.35, 4.05, 2.08, 2.35, c2, 10);
      addMoldedCornice(extGroup, 0, 1.08, -0.35, 4.14, 2.44, c2, c3);
      addMoldedCornice(extGroup, 0, 2.12, -0.35, 4.2, 2.52, c2, c3);
      addHippedRoof(extGroup, 4.12, 0.58, 2.42, 0, 2.14, -0.35, 0x334155, c3);

      // White Marble Roof Balustrade with Gilded Trophy Urns
      addBalustrade(extGroup, -1.98, 0.86, 1.98, 0.86, 2.14, 0.24, c2, 0.2, true);

      // Central White Corinthian Portico with Gilded Capitals & Baroque Pediment
      addClassicalPortico(extGroup, 0, 0.06, 1.12, 1.58, 2.06, 0.6, c2, 0x334155, {
        numCols: 4,
        hasPediment: true,
        tympanumColor: c1,
        goldAccent: true,
      });

      // Paired White Corinthian Columns along Left & Right Wings
      for (const cxPos of [-1.85, -1.25, 1.25, 1.85]) {
        addCyl(extGroup, 0.06, 0.07, 1.98, cxPos, 1.08, 0.86, c2, 14);
        addBox(extGroup, 0.16, 0.08, 0.16, cxPos, 2.06, 0.86, c3, { metalness: 0.75 });
      }

      // Rooftop Octagonal White-Column Belvedere Crowned with Gleaming Gold Russian Onion Cupola
      addVictorianTurret(extGroup, 0, 2.35, -0.3, 0.62, 0.78, 0.65, c1, c2, c3, true);

      // Arched Windows with Gilded Rococo Cartouches & Pediments
      addGrandEntranceDoor(extGroup, 0, 0.08, 0.84, 0.58, 0.82, c2, c3);
      addClassicalWindow(extGroup, 0, 1.6, 0.84, 0.56, 0.62, {
        frameColor: c2,
        pediment: 'segmental',
      });
      for (const wx of [-1.55, -0.95, 0.95, 1.55]) {
        addClassicalWindow(extGroup, wx, 0.58, 0.84, 0.42, 0.58, {
          frameColor: c2,
          pediment: 'segmental',
        });
        addClassicalWindow(extGroup, wx, 1.58, 0.84, 0.42, 0.58, {
          frameColor: c2,
          pediment: 'triangular',
        });
      }

      // Imperial Parterre Fountain & Evergreen Spruces
      addClassicalFountain(baseGroup, 0, 0.06, 1.68, 0.62, c2, 0x38bdf8);
      for (const tx of [-2.35, -1.65, 1.65, 2.35]) {
        addTree(baseGroup, tx, 0.06, 1.38, 'pine', 1.15);
      }
      break;
    }
  }
}

// ============================================================================
// PUBLIC BUILDER 1: 30 EXQUISITE CLASSICAL HOUSE EXTERIORS (BD-211 to BD-240)
// Includes embedded Floor1_Interior, Floor2_Interior & removable Exterior_Shell
// ============================================================================
export function buildDesignerVillaScene(island: IslandMetadata, _variant?: string): THREE.Group {
  const root = new THREE.Group();
  root.name = `DesignerVilla_${island.id}`;

  const bdNum = parseInt(island.id.replace('BD-', ''), 10);
  const idx = Math.max(1, Math.min(30, bdNum - 210));
  const seed = DESIGNER_VILLA_SEEDS[idx - 1] || DESIGNER_VILLA_SEEDS[0];

  const baseGroup = new THREE.Group();
  baseGroup.name = 'Base_Estate_Plinth';
  root.add(baseGroup);

  const floor1Group = new THREE.Group();
  floor1Group.name = 'Floor1_Interior';
  floor1Group.position.set(0, 0.05, -0.35);
  root.add(floor1Group);

  const floor2Group = new THREE.Group();
  floor2Group.name = 'Floor2_Interior';
  floor2Group.position.set(0, 0.05, -0.35);
  root.add(floor2Group);

  // Populate 1F & 2F interior furniture inside the house (scaled to fit cleanly inside the exterior shell)
  populateVillaTwoStoryInterior(floor1Group, floor2Group, seed, 0.68, 0.05, 1.08);

  const extGroup = new THREE.Group();
  extGroup.name = 'Exterior_Shell';
  root.add(extGroup);

  populateVillaExteriorShell(extGroup, baseGroup, seed);

  return root;
}

// ============================================================================
// PUBLIC BUILDER 2: 30 PAIRED 2-STORY CUTAWAY DOLLHOUSE INTERIORS (103 to 132)
// ============================================================================
export function buildDesignerVillaInteriorScene(island: IslandMetadata, _variant?: string): THREE.Group {
  const root = new THREE.Group();
  root.name = `DesignerVillaInterior_${island.id}`;

  const dhNum = parseInt(island.id.replace('diorama_dollhouse_', ''), 10);
  const idx = Math.max(1, Math.min(30, dhNum - 102));
  const seed = DESIGNER_VILLA_SEEDS[idx - 1] || DESIGNER_VILLA_SEEDS[0];
  const [floorHex, wallHex, accentHex] = seed.interiorPalette;
  const [ext1, ext2, ext3] = seed.palette;

  // Base Architectural Cutaway Slab + Front Garden Patio Edge
  const baseGroup = new THREE.Group();
  baseGroup.name = 'Cutaway_Base';
  addBox(baseGroup, 5.2, 0.22, 4.0, 0, -0.11, 0.2, 0xd6d3d1);
  addBox(baseGroup, 5.0, 0.06, 1.15, 0, 0.03, 1.55, 0xe7e5e4);
  // Courtyard fountain or reflection pool strip along front terrace
  addBox(baseGroup, 2.5, 0.07, 0.72, -0.85, 0.04, 1.62, ext3, { roughness: 0.1, metalness: 0.35 });
  addClassicalFountain(baseGroup, 1.35, 0.04, 1.62, 0.42, 0xffffff, ext3);
  addTree(baseGroup, -2.25, 0.04, 1.55, 'topiary', 0.95);
  addTree(baseGroup, 2.25, 0.04, 1.55, 'rose_bush', 0.95);
  root.add(baseGroup);

  const floor1Group = new THREE.Group();
  floor1Group.name = 'Floor1_Interior';
  root.add(floor1Group);

  const floor2Group = new THREE.Group();
  floor2Group.name = 'Floor2_Interior';
  root.add(floor2Group);

  // L-Shaped Cutaway Back & Left Walls (1F and 2F) with Classical Boiserie Wainscoting & Windows
  // 1F Back & Left Walls
  addBox(floor1Group, 4.2, 1.38, 0.12, 0, 0.72, -1.32, wallHex);
  addBox(floor1Group, 0.12, 1.38, 2.7, -2.04, 0.72, 0, wallHex);
  // Classical Wainscot Dado Rail & Boiserie Moldings on 1F
  addBox(floor1Group, 4.1, 0.05, 0.15, 0, 0.45, -1.3, ext1);
  addClassicalWindow(floor1Group, -0.95, 0.78, -1.25, 0.76, 0.68, {
    frameColor: floorHex,
    shutterColor: ext2,
    pediment: 'triangular',
  });
  addClassicalWindow(floor1Group, 0.12, 0.78, -1.25, 0.76, 0.68, {
    frameColor: floorHex,
    shutterColor: ext2,
    pediment: 'triangular',
  });

  // 2F Back & Left Walls + Classical Windows + Balcony Glass/Iron Railings
  addBox(floor2Group, 4.2, 1.28, 0.12, 0, 2.08, -1.32, wallHex);
  addBox(floor2Group, 0.12, 1.28, 2.7, -2.04, 2.08, 0, wallHex);
  addClassicalWindow(floor2Group, -0.82, 2.12, -1.25, 0.82, 0.64, {
    frameColor: floorHex,
    shutterColor: ext2,
    pediment: 'segmental',
  });
  addClassicalWindow(floor2Group, -1.96, 2.12, 0.25, 0.82, 0.64, {
    rotY: Math.PI / 2,
    frameColor: floorHex,
    pediment: 'triangular',
  });

  // 2F Front Cutaway Balustrade
  addBalustrade(floor2Group, -1.95, 1.22, 1.85, 1.22, 1.45, 0.24, floorHex, 0.18);

  // Populate full-scale 1F & 2F bespoke classical furniture
  populateVillaTwoStoryInterior(floor1Group, floor2Group, seed, 1.0, 0.04, 1.42);

  // Removable Roof Crown (hidden when user toggles 1F / 2F)
  const extShell = new THREE.Group();
  extShell.name = 'Exterior_Shell';
  addMoldedCornice(extShell, 0, 2.72, -1.15, 4.35, 0.55, ext1, accentHex);
  addBox(extShell, 4.35, 0.1, 0.55, 0, 2.78, -1.15, ext2);
  root.add(extShell);

  return root;
}
