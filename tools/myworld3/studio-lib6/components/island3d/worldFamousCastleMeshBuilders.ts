import * as THREE from 'three';
import { IslandMetadata, IslandVariant } from '../../types/island';
import { createLowPolyMat, createGlassMat, createWaterMat, createTree } from './materials';

function addShadows(group: THREE.Object3D) {
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
}

// ============================================================================
// REALISTIC CASTLE ARCHITECTURAL GEOMETRY PRIMITIVES
// (True Pitched Gable Roofs, Crow-Stepped Gables, Merlon Crenellations,
// Corbelled Bartizan Turretlets, Gothic Flying Buttresses & Japanese Irimoya Eaves)
// ============================================================================

/**
 * Builds a true triangular-prism pitched gable roof (along X axis) with triangular masonry gable walls,
 * overhanging roof slopes, ridge crest, and optional crow-stepped gables or roof dormers.
 */
function createTrueGableHall(
  w: number,
  wallH: number,
  roofH: number,
  d: number,
  wallMat: THREE.Material,
  roofMat: THREE.Material,
  trimMat: THREE.Material,
  glowMat: THREE.Material,
  opts: {
    crowSteps?: boolean;
    dormerCount?: number;
    windowCols?: number;
    windowRows?: number;
    goldRidge?: THREE.Material;
    isShell?: boolean;
  } = {}
): THREE.Group {
  const g = new THREE.Group();

  // 1. Main Rectangular Masonry Body
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, wallH, d), wallMat);
  body.position.y = wallH / 2;
  if (opts.isShell !== false) {
    body.userData.isExteriorWallShell = true;
  }
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(w + 0.08, 0.14, d + 0.08), trimMat);
  plinth.position.y = 0.07;
  const cornice = new THREE.Mesh(new THREE.BoxGeometry(w + 0.08, 0.07, d + 0.08), trimMat);
  cornice.position.y = wallH;
  g.add(body, plinth, cornice);

  // 2. Triangular Gable End Walls (Left x = -w/2 and Right x = +w/2)
  const gableShape = new THREE.Shape();
  gableShape.moveTo(-d / 2, 0);
  gableShape.lineTo(d / 2, 0);
  gableShape.lineTo(0, roofH);
  gableShape.closePath();
  const gableGeo = new THREE.ExtrudeGeometry(gableShape, { depth: w, bevelEnabled: false });
  gableGeo.rotateY(Math.PI / 2);
  gableGeo.translate(-w / 2, wallH, 0);
  const gableCore = new THREE.Mesh(gableGeo, wallMat);
  gableCore.userData.isRoof = true;
  gableCore.userData.floorLevel = 3;
  g.add(gableCore);

  // 3. Two Sloping Roof Planes (Front +Z and Back -Z) with Eaves Overhang
  const slopeLen = Math.hypot(d / 2 + 0.12, roofH + 0.05);
  const slopeAngle = Math.atan2(roofH, d / 2);
  const overhangW = w + 0.14;

  const frontSlope = new THREE.Mesh(new THREE.BoxGeometry(overhangW, 0.07, slopeLen), roofMat);
  frontSlope.position.set(0, wallH + roofH / 2, d / 4 + 0.02);
  frontSlope.rotation.x = slopeAngle;
  frontSlope.userData.isRoof = true;
  frontSlope.userData.floorLevel = 3;

  const backSlope = new THREE.Mesh(new THREE.BoxGeometry(overhangW, 0.07, slopeLen), roofMat);
  backSlope.position.set(0, wallH + roofH / 2, -d / 4 - 0.02);
  backSlope.rotation.x = -slopeAngle;
  backSlope.userData.isRoof = true;
  backSlope.userData.floorLevel = 3;

  const ridgeBeam = new THREE.Mesh(
    new THREE.BoxGeometry(overhangW + 0.04, 0.08, 0.08),
    opts.goldRidge || trimMat
  );
  ridgeBeam.position.set(0, wallH + roofH + 0.03, 0);
  ridgeBeam.userData.isRoof = true;
  ridgeBeam.userData.floorLevel = 3;
  g.add(frontSlope, backSlope, ridgeBeam);

  // 4. Optional Crow-Stepped Gables (Corbie Steps) on Left & Right Ends
  if (opts.crowSteps) {
    const steps = 4;
    for (const side of [-1, 1]) {
      for (let s = 0; s < steps; s++) {
        const frac = s / steps;
        const stepZSpan = d * (1 - frac * 0.82);
        const stepY = wallH + frac * roofH + 0.08;
        const stepBlock = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.18, stepZSpan), wallMat);
        stepBlock.position.set(side * (w / 2 + 0.02), stepY, 0);
        stepBlock.userData.isRoof = true;
        stepBlock.userData.floorLevel = 3;
        g.add(stepBlock);
      }
    }
  }

  // 5. Optional Pedimented Roof Dormer Windows on Front & Back Slopes
  const dormers = opts.dormerCount || 0;
  for (let i = 0; i < dormers; i++) {
    const dx = -w * 0.36 + (dormers > 1 ? (i / (dormers - 1)) * (w * 0.72) : 0);
    for (const zSide of [-1, 1]) {
      const dormerBody = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.26, 0.24), wallMat);
      dormerBody.position.set(dx, wallH + roofH * 0.38, zSide * (d * 0.32));
      dormerBody.userData.isRoof = true;
      dormerBody.userData.floorLevel = 3;
      const dormerCap = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.18, 4), roofMat);
      dormerCap.rotation.y = Math.PI / 4;
      dormerCap.position.set(dx, wallH + roofH * 0.38 + 0.2, zSide * (d * 0.32));
      dormerCap.userData.isRoof = true;
      dormerCap.userData.floorLevel = 3;
      const dPane = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.15, 0.04), glowMat);
      dPane.position.set(dx, wallH + roofH * 0.38, zSide * (d * 0.32 + 0.12));
      dPane.userData.isRoof = true;
      dPane.userData.floorLevel = 3;
      g.add(dormerBody, dormerCap, dPane);
    }
  }

  // 6. Recessed Arched Window Arcades on Front & Back Walls
  const cols = opts.windowCols ?? 4;
  const rows = opts.windowRows ?? 2;
  for (let c = 0; c < cols; c++) {
    const wx = cols === 1 ? 0 : -w * 0.38 + (c / (cols - 1)) * (w * 0.76);
    for (let r = 0; r < rows; r++) {
      const wy = 0.38 + ((r + 0.45) / rows) * (wallH - 0.48);
      for (const zSide of [-1, 1]) {
        const frame = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.28, 0.05), trimMat);
        frame.position.set(wx, wy, zSide * (d / 2 + 0.01));
        const pane = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.22, 0.065), glowMat);
        pane.position.set(wx, wy, zSide * (d / 2 + 0.01));
        g.add(frame, pane);
      }
    }
  }

  return g;
}

/**
 * Builds a realistic Cylindrical Castle Tower with battered base, machicolated corbel ring,
 * 360° crenellated merlons, vertical lancet windows, and optional steep conical spire & finial.
 */
function createCastleRoundTower(
  r: number,
  h: number,
  spireH: number,
  wallMat: THREE.Material,
  roofMat: THREE.Material,
  trimMat: THREE.Material,
  goldMat: THREE.Material,
  glowMat: THREE.Material,
  opts: {
    merlonCount?: number;
    onionDome?: boolean;
  } = {}
): THREE.Group {
  const g = new THREE.Group();

  // Battered lower stone base + main cylindrical shaft
  const base = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.02, r * 1.16, Math.min(0.45, h * 0.25), 14), trimMat);
  base.position.y = Math.min(0.225, h * 0.125);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.03, h, 14), wallMat);
  shaft.position.y = h / 2;

  // Corbel machicolation ring + parapet lip
  const corbelRing = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.14, r * 0.98, 0.14, 14), trimMat);
  corbelRing.position.y = h - 0.06;
  const parapet = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.14, r * 1.14, 0.12, 14), wallMat);
  parapet.position.y = h + 0.05;
  g.add(base, shaft, corbelRing, parapet);

  // Crenellated Merlons around top rim
  const mCount = opts.merlonCount ?? 10;
  for (let i = 0; i < mCount; i++) {
    const a = (i / mCount) * Math.PI * 2;
    const merlon = new THREE.Mesh(new THREE.BoxGeometry(r * 0.34, 0.14, 0.09), trimMat);
    merlon.position.set(Math.cos(a) * (r * 1.08), h + 0.16, Math.sin(a) * (r * 1.08));
    merlon.rotation.y = -a + Math.PI / 2;
    g.add(merlon);
  }

  // Vertical Slit Windows
  for (const wy of [h * 0.42, h * 0.75]) {
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.4;
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.05), glowMat);
      win.position.set(Math.cos(a) * (r + 0.01), wy, Math.sin(a) * (r + 0.01));
      win.rotation.y = -a + Math.PI / 2;
      g.add(win);
    }
  }

  // Spire or Dome
  if (opts.onionDome) {
    const dome = new THREE.Mesh(new THREE.SphereGeometry(r * 1.12, 14, 12), roofMat);
    dome.scale.set(1, 1.25, 1);
    dome.position.y = h + r * 0.95;
    dome.userData.isRoof = true;
    dome.userData.floorLevel = 3;
    const finial = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.42, 8), goldMat);
    finial.position.y = h + r * 2.15;
    finial.userData.isRoof = true;
    finial.userData.floorLevel = 3;
    g.add(dome, finial);
  } else if (spireH > 0) {
    const spire = new THREE.Mesh(new THREE.ConeGeometry(r * 1.22, spireH, 14), roofMat);
    spire.position.y = h + 0.1 + spireH / 2;
    spire.userData.isRoof = true;
    spire.userData.floorLevel = 3;
    const finial = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.024, 0.28, 6), goldMat);
    finial.position.y = h + 0.1 + spireH + 0.12;
    finial.userData.isRoof = true;
    finial.userData.floorLevel = 3;
    g.add(spire, finial);
  }

  return g;
}

/**
 * Builds a Crenellated Square/Rectangular Castle Keep or Gatehouse with corner quoins,
 * machicolated battlements, and optional 4 cantilevered corner bartizan turretlets.
 */
function createCastleSquareKeep(
  w: number,
  h: number,
  d: number,
  wallMat: THREE.Material,
  roofMat: THREE.Material,
  trimMat: THREE.Material,
  goldMat: THREE.Material,
  glowMat: THREE.Material,
  opts: {
    bartizans?: boolean;
    bartizanSpireH?: number;
    hasSpire?: boolean;
    spireH?: number;
    archGate?: boolean;
  } = {}
): THREE.Group {
  const g = new THREE.Group();

  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
  body.position.y = h / 2;
  const corbel = new THREE.Mesh(new THREE.BoxGeometry(w + 0.12, 0.12, d + 0.12), trimMat);
  corbel.position.y = h - 0.04;
  g.add(body, corbel);

  // Perimeter Merlons along top edge
  const mxCount = Math.max(3, Math.round(w / 0.28));
  for (let i = 0; i < mxCount; i++) {
    const mx = -w / 2 + 0.08 + (i / (mxCount - 1)) * (w - 0.16);
    for (const mz of [-d / 2 - 0.02, d / 2 + 0.02]) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.14, 0.08), trimMat);
      m.position.set(mx, h + 0.09, mz);
      g.add(m);
    }
  }

  // Optional Arched Portal Gate at bottom front
  if (opts.archGate) {
    const portalSurround = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.56, 0.1), trimMat);
    portalSurround.position.set(0, 0.28, d / 2 + 0.02);
    const portalDark = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.46, 0.12),
      createLowPolyMat(0x1e293b, { roughness: 0.9 })
    );
    portalDark.position.set(0, 0.24, d / 2 + 0.03);
    g.add(portalSurround, portalDark);
  }

  // Mullioned Windows
  for (const wy of [h * 0.45, h * 0.76]) {
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.26, 0.06), glowMat);
    win.position.set(0, wy, d / 2 + 0.01);
    g.add(win);
  }

  // 4 Cantilevered Corner Bartizan Turretlets
  if (opts.bartizans) {
    const bSpireH = opts.bartizanSpireH ?? 0.48;
    for (const [bx, bz] of [
      [-w / 2, -d / 2],
      [w / 2, -d / 2],
      [-w / 2, d / 2],
      [w / 2, d / 2],
    ]) {
      const corbelCone = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.24, 10), trimMat);
      corbelCone.rotation.x = Math.PI;
      corbelCone.position.set(bx, h - 0.32, bz);
      const bShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.15, 0.55, 10), wallMat);
      bShaft.position.set(bx, h + 0.06, bz);
      g.add(corbelCone, bShaft);
      if (bSpireH > 0) {
        const bCone = new THREE.Mesh(new THREE.ConeGeometry(0.2, bSpireH, 10), roofMat);
        bCone.position.set(bx, h + 0.34 + bSpireH / 2, bz);
        bCone.userData.isRoof = true;
        bCone.userData.floorLevel = 3;
        g.add(bCone);
      }
    }
  }

  if (opts.hasSpire) {
    const sh = opts.spireH ?? 0.95;
    const spire = new THREE.Mesh(new THREE.ConeGeometry(Math.min(w, d) * 0.62, sh, 4), roofMat);
    spire.rotation.y = Math.PI / 4;
    spire.position.set(0, h + sh / 2, 0);
    spire.userData.isRoof = true;
    spire.userData.floorLevel = 3;
    g.add(spire);
  }

  return g;
}

/**
 * Crenellated Stone Curtain Wall Segment with walkway & merlons
 */
function createCrenellatedWallSegment(
  length: number,
  height: number,
  thickness: number,
  wallMat: THREE.Material,
  trimMat: THREE.Material
): THREE.Group {
  const g = new THREE.Group();
  const wall = new THREE.Mesh(new THREE.BoxGeometry(length, height, thickness), wallMat);
  wall.position.y = height / 2;
  const parapet = new THREE.Mesh(new THREE.BoxGeometry(length + 0.04, 0.08, thickness + 0.06), trimMat);
  parapet.position.y = height;
  g.add(wall, parapet);

  const count = Math.max(2, Math.round(length / 0.28));
  for (let i = 0; i < count; i++) {
    const mx = -length / 2 + 0.1 + (i / Math.max(1, count - 1)) * (length - 0.2);
    const merlon = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.13, thickness * 0.45), trimMat);
    merlon.position.set(mx, height + 0.1, thickness * 0.28);
    g.add(merlon);
  }
  return g;
}

// ============================================================================
// PART 1: 10 AUTHENTIC REAL-WORLD FAMOUS CASTLES (BD-141 to BD-150)
// ============================================================================
export function buildWorldFamousCastleScene(
  island: IslandMetadata,
  variant: IslandVariant = 'classic'
): THREE.Group {
  const g = new THREE.Group();
  const bdNum = parseInt(island.id.replace('BD-', ''), 10) || 141;
  const castleIdx = Math.max(1, Math.min(10, bdNum - 140)); // 1..10

  const rockDarkMat = createLowPolyMat(0x57534e, { roughness: 0.92 });
  const rockLightMat = createLowPolyMat(0x8a8178, { roughness: 0.88 });
  const alpineMeadowMat = createLowPolyMat(0x4d7c4a, { roughness: 0.86 });
  const goldMat = createLowPolyMat(0xd4af37, { metalness: 0.65, roughness: 0.25 });
  const glowMat = createLowPolyMat(variant === 'fantasy' ? 0xffd166 : 0xffe599, {
    emissive: 0xf59e0b,
    roughness: 0.28,
  });
  const waterMat = createWaterMat(0x149694);

  switch (castleIdx) {
    // ========================================================================
    // 1. BD-141: 德国 · 新天鹅堡 (Neuschwanstein Castle, Bavaria, Germany)
    // True narrow Alpine ridge layout: Red-brick Torbau Gatehouse on right,
    // Square Watchtower & Kemenate in middle, 5-story White Limestone Palas on left
    // with true steep blue-slate pitched gable roof & soaring cylindrical North Tower!
    // ========================================================================
    case 1: {
      const limestoneMat = createLowPolyMat(0xf4efe6, { roughness: 0.55 });
      const trimMat = createLowPolyMat(0xdcd3c2, { roughness: 0.68 });
      const cobaltSlateMat = createLowPolyMat(0x274060, { roughness: 0.48 });
      const copperGreenMat = createLowPolyMat(0x2d6a4f, { roughness: 0.52 });
      const redBrickMat = createLowPolyMat(0xb54434, { roughness: 0.65 });

      // Sculpted Stepped Bavarian Alpine Ridge Crag (No suburban rectangular lawn!)
      const lowerBase = new THREE.Mesh(new THREE.CylinderGeometry(2.65, 2.95, 0.35, 12), rockDarkMat);
      lowerBase.scale.set(1.18, 1, 0.82);
      lowerBase.position.set(0, 0.18, 0);
      const upperRidge = new THREE.Mesh(new THREE.BoxGeometry(4.65, 0.68, 2.25), rockLightMat);
      upperRidge.position.set(0, 0.58, -0.15);
      const meadowSlope = new THREE.Mesh(new THREE.BoxGeometry(4.85, 0.18, 1.35), alpineMeadowMat);
      meadowSlope.position.set(0, 0.36, 1.15);
      g.add(lowerBase, upperRidge, meadowSlope);

      // Deep Pöllat Gorge Waterfall & High-Arch Marienbrücke (Mary's Bridge) on Left Gorge
      const gorgeStream = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.82, 0.35), waterMat);
      gorgeStream.position.set(-2.15, 0.52, 0.65);
      const marienBridge = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.08, 0.22), trimMat);
      marienBridge.position.set(-2.15, 1.25, 0.35);
      const bridgeArch = new THREE.Mesh(
        new THREE.TorusGeometry(0.48, 0.035, 6, 12, Math.PI),
        createLowPolyMat(0x334155)
      );
      bridgeArch.position.set(-2.15, 0.82, 0.35);
      g.add(gorgeStream, marienBridge, bridgeArch);

      // A. Eastern Red-Brick Gatehouse (Torbau) at Right (+X) with Crow-Stepped Gables & Twin Round Turretlets
      const torbau = createTrueGableHall(
        1.25,
        1.05,
        0.52,
        1.15,
        redBrickMat,
        cobaltSlateMat,
        trimMat,
        glowMat,
        { crowSteps: true, windowCols: 2, windowRows: 2, isShell: false }
      );
      torbau.position.set(1.62, 0.9, 0.15);
      g.add(torbau);

      for (const tz of [-0.48, 0.48]) {
        const gateTurret = createCastleRoundTower(
          0.2,
          1.45,
          0.55,
          redBrickMat,
          cobaltSlateMat,
          trimMat,
          goldMat,
          glowMat,
          { merlonCount: 6 }
        );
        gateTurret.position.set(2.22, 0.9, 0.15 + tz);
        g.add(gateTurret);
      }

      // B. Middle Courtyard Curtain Wall, Kemenate (Bower) & Tall Square Watchtower (Viereckturm)
      const courtyardWall = createCrenellatedWallSegment(1.55, 0.78, 0.22, limestoneMat, trimMat);
      courtyardWall.position.set(0.55, 0.9, 0.62);
      const kemenate = createTrueGableHall(
        1.18,
        1.15,
        0.55,
        0.95,
        limestoneMat,
        cobaltSlateMat,
        trimMat,
        glowMat,
        { crowSteps: true, dormerCount: 2, windowCols: 3, windowRows: 2 }
      );
      kemenate.position.set(0.48, 0.9, -0.45);

      const squareWatchtower = createCastleSquareKeep(
        0.68,
        2.45,
        0.68,
        limestoneMat,
        cobaltSlateMat,
        trimMat,
        goldMat,
        glowMat,
        { bartizans: true, bartizanSpireH: 0.42, hasSpire: true, spireH: 0.78 }
      );
      squareWatchtower.position.set(0.65, 0.9, 0.42);
      g.add(courtyardWall, kemenate, squareWatchtower);

      // C. Monumental 5-Story White Limestone Palas (Singers' Hall & Throne Room Wing) on Left (-X)
      const palas = createTrueGableHall(
        2.35,
        1.78,
        0.95,
        1.32,
        limestoneMat,
        cobaltSlateMat,
        trimMat,
        glowMat,
        {
          crowSteps: true,
          dormerCount: 3,
          windowCols: 5,
          windowRows: 3,
          goldRidge: copperGreenMat,
        }
      );
      palas.position.set(-0.85, 0.92, -0.15);
      g.add(palas);

      // Two-Story Gilded Throne Hall Western Apse & Double-Tiered Balcony overlooking the Alps
      const throneApse = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.45, 1.35, 12),
        limestoneMat
      );
      throneApse.position.set(-2.05, 1.6, -0.15);
      const apseDome = new THREE.Mesh(new THREE.ConeGeometry(0.48, 0.52, 12), copperGreenMat);
      apseDome.position.set(-2.05, 2.52, -0.15);
      const gildedBalcony = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.42, 0.72), goldMat);
      gildedBalcony.position.set(-2.12, 1.55, -0.15);
      g.add(throneApse, apseDome, gildedBalcony);

      // D. Soaring 65m Cylindrical North Tower (Main Iconic Spire) + Southern Stair Turret
      const northTower = createCastleRoundTower(
        0.38,
        3.15,
        1.28,
        limestoneMat,
        cobaltSlateMat,
        trimMat,
        goldMat,
        glowMat,
        { merlonCount: 10 }
      );
      northTower.position.set(-0.95, 0.92, -0.92);

      const westTurret = createCastleRoundTower(
        0.28,
        2.45,
        0.92,
        limestoneMat,
        cobaltSlateMat,
        trimMat,
        goldMat,
        glowMat,
        { merlonCount: 8 }
      );
      westTurret.position.set(-1.98, 0.92, 0.48);
      g.add(northTower, westTurret);

      // Alpine Spruce Trees around lower crag
      for (const [tx, ty, tz, s] of [
        [-2.35, 0.35, 1.35, 0.85],
        [-1.25, 0.42, 1.45, 0.78],
        [1.15, 0.42, 1.45, 0.82],
        [2.38, 0.35, 1.25, 0.88],
      ]) {
        g.add(createTree('pine', [tx, ty, tz], s));
      }
      break;
    }

    // ========================================================================
    // 2. BD-142: 法国 · 圣米歇尔山城堡 (Mont-Saint-Michel Abbey Fortress, Normandy)
    // Pure pyramidal granite tidal island surrounded by mirror-reflective bay & sandflats,
    // concentric medieval bastion ramparts, spiral pitched-roof village houses,
    // vertical granite buttresses of La Merveille, and Gothic Abbey with 156m golden spire!
    // ========================================================================
    case 2: {
      const graniteMat = createLowPolyMat(0xcbc3b5, { roughness: 0.72 });
      const darkGraniteMat = createLowPolyMat(0x8c8478, { roughness: 0.82 });
      const slateMat = createLowPolyMat(0x334155, { roughness: 0.52 });
      const sandFlatMat = createLowPolyMat(0xd6c7b2, { roughness: 0.85 });

      // Tidal Bay Mirror Water Base + Wet Sandbank Ring + Curved Causeway Footbridge
      const tidalSea = new THREE.Mesh(new THREE.CylinderGeometry(2.95, 3.05, 0.22, 24), waterMat);
      tidalSea.position.y = 0.11;
      const sandRing = new THREE.Mesh(new THREE.CylinderGeometry(2.32, 2.52, 0.08, 20), sandFlatMat);
      sandRing.position.set(0, 0.22, -0.1);
      const causewayBridge = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 1.45), graniteMat);
      causewayBridge.position.set(0, 0.28, 2.05);
      g.add(tidalSea, sandRing, causewayBridge);

      // 1. Outer Crenellated Ramparts (Remparts) + 8 Semi-Circular Bastion Towers at Waterline
      const rampartWall = new THREE.Mesh(new THREE.CylinderGeometry(1.98, 2.15, 0.58, 16), graniteMat);
      rampartWall.position.set(0, 0.52, -0.1);
      g.add(rampartWall);

      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + 0.2;
        const bt = createCastleRoundTower(
          0.22,
          0.76,
          i % 2 === 0 ? 0.36 : 0,
          graniteMat,
          slateMat,
          darkGraniteMat,
          goldMat,
          glowMat,
          { merlonCount: 6 }
        );
        bt.position.set(Math.cos(a) * 1.98, 0.24, -0.1 + Math.sin(a) * 1.98);
        g.add(bt);
      }

      // 2. Stepped Conical Granite Rock Mount + 16 Spiral Medieval Pitched-Roof Village Houses
      const rockCone1 = new THREE.Mesh(new THREE.ConeGeometry(1.88, 1.45, 14), rockDarkMat);
      rockCone1.position.set(0, 1.15, -0.1);
      const rockCone2 = new THREE.Mesh(new THREE.ConeGeometry(1.32, 1.35, 12), rockLightMat);
      rockCone2.position.set(0, 1.85, -0.1);
      g.add(rockCone1, rockCone2);

      for (let i = 0; i < 14; i++) {
        const tier = i < 8 ? 0 : 1;
        const a = ((i % 8) / (tier === 0 ? 8 : 6)) * Math.PI * 2 + tier * 0.35;
        const rad = tier === 0 ? 1.48 : 1.05;
        const hy = tier === 0 ? 0.85 : 1.38;
        const house = createTrueGableHall(
          0.38,
          0.42,
          0.26,
          0.34,
          i % 2 === 0 ? graniteMat : sandFlatMat,
          slateMat,
          darkGraniteMat,
          glowMat,
          { windowCols: 1, windowRows: 1, isShell: false }
        );
        house.position.set(Math.cos(a) * rad, hy, -0.1 + Math.sin(a) * rad);
        house.rotation.y = -a + Math.PI / 2;
        g.add(house);
      }

      // 3. Monumental Vertical Granite Retaining Walls & Buttresses of "La Merveille" at Summit
      const merveilleBase = new THREE.Mesh(new THREE.BoxGeometry(1.62, 1.18, 1.32), graniteMat);
      merveilleBase.position.set(0, 2.18, -0.1);
      merveilleBase.userData.isExteriorWallShell = true;
      g.add(merveilleBase);

      // Vertical Gothic Stone Buttress Piers along La Merveille
      for (let bx = -0.68; bx <= 0.68; bx += 0.27) {
        for (const bz of [-0.68, 0.68]) {
          const buttress = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.24, 0.14), darkGraniteMat);
          buttress.position.set(bx, 2.18, -0.1 + bz);
          g.add(buttress);
        }
      }

      // 4. Summit Cross-Shaped Gothic Abbey Church + Flying Buttresses + 156m Spire & Golden Archangel Michael
      const abbeyNave = createTrueGableHall(
        1.38,
        0.78,
        0.48,
        0.72,
        graniteMat,
        slateMat,
        darkGraniteMat,
        glowMat,
        { windowCols: 4, windowRows: 1, goldRidge: goldMat }
      );
      abbeyNave.position.set(0, 2.76, -0.1);

      const abbeyTransept = createTrueGableHall(
        0.64,
        0.76,
        0.46,
        1.18,
        graniteMat,
        slateMat,
        darkGraniteMat,
        glowMat,
        { windowCols: 2, windowRows: 1 }
      );
      abbeyTransept.position.set(0, 2.76, -0.1);

      const crossingTower = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.68, 0.44), graniteMat);
      crossingTower.position.set(0, 3.62, -0.1);
      crossingTower.userData.isRoof = true;
      crossingTower.userData.floorLevel = 3;

      const needleSpire = new THREE.Mesh(new THREE.ConeGeometry(0.22, 1.38, 8), slateMat);
      needleSpire.position.set(0, 4.62, -0.1);
      needleSpire.userData.isRoof = true;
      needleSpire.userData.floorLevel = 3;

      const archangelStatue = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), goldMat);
      archangelStatue.position.set(0, 5.38, -0.1);
      archangelStatue.userData.isRoof = true;
      archangelStatue.userData.floorLevel = 3;

      g.add(abbeyNave, abbeyTransept, crossingTower, needleSpire, archangelStatue);
      break;
    }

    // ========================================================================
    // 3. BD-143: 法国 · 舍农索水上城堡 (Château de Chenonceau, Loire Valley)
    // Built directly over the flowing River Cher:
    // Forebank island with detached cylindrical Tour des Marques, Square Corps de Logis
    // with 4 corner corbelled round turrets, and the 5-Arch Bridge Gallery with a true
    // continuous pitched slate gable roof & 7 pedimented dormers spanning the river!
    // ========================================================================
    case 3: {
      const tuffeauMat = createLowPolyMat(0xf7f3e8, { roughness: 0.48 });
      const trimMat = createLowPolyMat(0xe2d9c5, { roughness: 0.6 });
      const loireSlateMat = createLowPolyMat(0x283242, { roughness: 0.45 });
      const hedgeMat = createLowPolyMat(0x2d6a4f, { roughness: 0.85 });

      // Flowing Emerald River Cher Base + North & South Stone Riverbanks
      const cherWater = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.22, 4.7), waterMat);
      cherWater.position.y = 0.11;
      const northBank = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.34, 1.25), trimMat);
      northBank.position.set(0, 0.22, 1.72);
      const southBank = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.34, 0.72), trimMat);
      southBank.position.set(0, 0.22, -1.98);
      g.add(cherWater, northBank, southBank);

      // Parterre Gardens of Diane de Poitiers & Catherine de' Medici on Forebank
      for (const gx of [-1.85, 1.85]) {
        const parterre = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.08, 0.92), alpineMeadowMat);
        parterre.position.set(gx, 0.42, 1.72);
        const scrollHedge = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.045, 6, 12), hedgeMat);
        scrollHedge.rotation.x = Math.PI / 2;
        scrollHedge.position.set(gx, 0.48, 1.72);
        const topiary = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.34, 8), hedgeMat);
        topiary.position.set(gx, 0.62, 1.72);
        g.add(parterre, scrollHedge, topiary);
      }

      // 1. Detached Medieval Cylindrical Keep (Tour des Marques) on the Forebank
      const marquesTower = createCastleRoundTower(
        0.34,
        1.72,
        0.78,
        tuffeauMat,
        loireSlateMat,
        trimMat,
        goldMat,
        glowMat,
        { merlonCount: 8 }
      );
      marquesTower.position.set(-0.92, 0.38, 1.52);
      g.add(marquesTower);

      // 2. Square Renaissance Corps de Logis on Fore-Pier with 4 Corner Corbelled Turrets
      const logisPier = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.55, 1.48), trimMat);
      logisPier.position.set(0, 0.38, 0.68);
      const logisHall = createTrueGableHall(
        1.52,
        1.28,
        0.68,
        1.28,
        tuffeauMat,
        loireSlateMat,
        trimMat,
        glowMat,
        { dormerCount: 2, windowCols: 3, windowRows: 2, goldRidge: goldMat }
      );
      logisHall.position.set(0, 0.65, 0.68);
      g.add(logisPier, logisHall);

      for (const [tx, tz] of [
        [-0.76, 0.05],
        [0.76, 0.05],
        [-0.76, 1.3],
        [0.76, 1.3],
      ]) {
        const cornerTurret = createCastleRoundTower(
          0.22,
          1.42,
          0.62,
          tuffeauMat,
          loireSlateMat,
          trimMat,
          goldMat,
          glowMat,
          { merlonCount: 6 }
        );
        cornerTurret.position.set(tx, 0.62, tz);
        g.add(cornerTurret);
      }

      // 3. The 5-Arch Stone Bridge & 2-Story Grand Gallery Spanning Across the River Cher (along X or Z)
      // Let's orient the 5-arch gallery spanning across the river along X (-2.2 to +2.2) at z = -0.58 so all 5 arches are clearly visible from the front isometric view!
      for (let i = 0; i < 6; i++) {
        const px = -2.15 + i * 0.86;
        const pier = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.68, 1.18), trimMat);
        pier.position.set(px, 0.42, -0.58);
        // Semi-circular cutwater with engaged turret base facing upstream
        const cutwater = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.68, 10), trimMat);
        cutwater.position.set(px, 0.42, -0.02);
        const cap = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.24, 10), loireSlateMat);
        cap.position.set(px, 0.86, -0.02);
        g.add(pier, cutwater, cap);

        // Stone Arch between piers
        if (i < 5) {
          const archCenter = px + 0.43;
          const archRing = new THREE.Mesh(
            new THREE.TorusGeometry(0.32, 0.07, 8, 14, Math.PI),
            trimMat
          );
          archRing.position.set(archCenter, 0.42, -0.02);
          g.add(archRing);
        }
      }

      // Long 2-Story Renaissance Gallery Body with True Pitched Slate Roof & 5 Dormers
      const riverGallery = createTrueGableHall(
        4.48,
        1.12,
        0.64,
        1.02,
        tuffeauMat,
        loireSlateMat,
        trimMat,
        glowMat,
        { dormerCount: 5, windowCols: 7, windowRows: 2, goldRidge: goldMat }
      );
      riverGallery.position.set(0, 0.75, -0.58);
      g.add(riverGallery);
      break;
    }

    // ========================================================================
    // 4. BD-144: 德国 · 霍亨索伦城堡 (Hohenzollern Castle, Swabian Alps)
    // Conical Mount Hohenzollern crag encircled by polygonal star-bastion walls,
    // spiral Eagle Gate ramp, and a dramatic crown of 10 Neo-Gothic octagonal &
    // cylindrical towers with corbelled machicolations and needle-sharp conical spires!
    // ========================================================================
    case 4: {
      const sandstoneMat = createLowPolyMat(0xd6bd98, { roughness: 0.65 });
      const darkSandMat = createLowPolyMat(0xb09672, { roughness: 0.72 });
      const slateSpireMat = createLowPolyMat(0x2b3748, { roughness: 0.48 });
      const copperSpireMat = createLowPolyMat(0x2d6a4f, { roughness: 0.48 });

      // Conical Swabian Mountain Peak (Mount Hohenzollern)
      const mountainBase = new THREE.Mesh(new THREE.ConeGeometry(2.85, 1.55, 12), rockDarkMat);
      mountainBase.position.set(0, 0.78, 0);
      const upperCrag = new THREE.Mesh(new THREE.CylinderGeometry(2.05, 2.38, 0.65, 8), rockLightMat);
      upperCrag.position.set(0, 1.12, -0.05);
      g.add(mountainBase, upperCrag);

      // 1. Polygonal Star-Bastion Outer Fortification Ring + Corner Watch Turretlets
      const bastionWall = new THREE.Mesh(new THREE.CylinderGeometry(1.98, 2.18, 0.62, 8), sandstoneMat);
      bastionWall.position.set(0, 1.48, -0.05);
      const bastionParapet = new THREE.Mesh(new THREE.CylinderGeometry(2.04, 2.04, 0.12, 8), darkSandMat);
      bastionParapet.position.set(0, 1.82, -0.05);
      g.add(bastionWall, bastionParapet);

      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
        const cornerBartizan = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.08, 0.48, 8), sandstoneMat);
        cornerBartizan.position.set(Math.cos(a) * 1.98, 1.68, -0.05 + Math.sin(a) * 1.98);
        const cap = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.28, 8), slateSpireMat);
        cap.position.set(Math.cos(a) * 1.98, 2.05, -0.05 + Math.sin(a) * 1.98);
        g.add(cornerBartizan, cap);
      }

      // Spiral Eagle Gate (Adlertor) Viaduct Ramp on Front Slope
      const rampBridge = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.28, 0.42), sandstoneMat);
      rampBridge.rotation.z = 0.2;
      rampBridge.position.set(0.25, 1.12, 1.72);
      const eagleGateTower = createCastleSquareKeep(
        0.52,
        1.15,
        0.52,
        sandstoneMat,
        slateSpireMat,
        darkSandMat,
        goldMat,
        glowMat,
        { archGate: true, hasSpire: true, spireH: 0.48 }
      );
      eagleGateTower.position.set(-0.55, 0.95, 1.68);
      g.add(rampBridge, eagleGateTower);

      // 2. U-Shaped Neo-Gothic Palace Wings (Count's Hall & Library Wing) with True Pitched Gable Roofs
      const mainPalaceHall = createTrueGableHall(
        2.15,
        1.18,
        0.62,
        1.15,
        sandstoneMat,
        slateSpireMat,
        darkSandMat,
        glowMat,
        { crowSteps: true, dormerCount: 3, windowCols: 4, windowRows: 2, goldRidge: goldMat }
      );
      mainPalaceHall.position.set(0, 1.78, -0.25);
      g.add(mainPalaceHall);

      // 3. Crown of 9 Soaring Neo-Gothic Towers (Emperor's Tower, Margrave Tower, Michael Tower & Twin Chapel Spires)
      const towerSpecs: Array<[number, number, number, number, number, THREE.Material]> = [
        [0, -0.92, 0.36, 2.45, 1.22, copperSpireMat], // Central Emperor's Tower (Kaiser-Turm)
        [-1.08, -0.72, 0.32, 2.15, 1.05, slateSpireMat], // Margrave Tower (Markgrafenturm)
        [1.08, -0.72, 0.32, 2.15, 1.05, slateSpireMat], // St. Michael's Tower
        [-1.35, 0.25, 0.28, 1.82, 0.88, slateSpireMat],
        [1.35, 0.25, 0.28, 1.82, 0.88, slateSpireMat],
        [-0.65, 0.58, 0.22, 1.65, 0.78, copperSpireMat], // Protestant Chapel Spire
        [0.65, 0.58, 0.22, 1.65, 0.78, copperSpireMat], // Catholic Chapel Spire
      ];
      for (const [tx, tz, r, h, sH, sMat] of towerSpecs) {
        const tow = createCastleRoundTower(r, h, sH, sandstoneMat, sMat, darkSandMat, goldMat, glowMat, {
          merlonCount: 8,
        });
        tow.position.set(tx, 1.78, tz);
        g.add(tow);
      }

      // Forest Ring around the lower mountain slope
      for (const [fx, fz] of [
        [-2.15, 1.15],
        [2.15, 1.15],
        [-2.25, -0.85],
        [2.25, -0.85],
      ]) {
        g.add(createTree('pine', [fx, 0.55, fz], 0.82));
      }
      break;
    }

    // ========================================================================
    // 5. BD-145: 日本 · 姬路城 / 白鹭城 (Himeji Castle / White Heron Castle, Japan)
    // Authentic Japanese Azuchi-Momoyama architecture:
    // Curved fan-shaped Ishigaki dry-stone fortress base, inner moat & vermilion bridge,
    // 5-tier 6-story snow-white Shikkui plastered Daitenshu with upturned Kawara tile eaves,
    // triangular Chidori-hafu & curved Karahafu gables, golden Shachihoko finials,
    // 3 subsidiary Kotenshu keeps connected by Watari-yagura corridors, & sakura trees!
    // ========================================================================
    case 5: {
      const shikkuiWhiteMat = createLowPolyMat(0xfaf8f5, { roughness: 0.42 });
      const kawaraTileMat = createLowPolyMat(0x374151, { roughness: 0.52 });
      const ishigakiMat = createLowPolyMat(0x6b7280, { roughness: 0.9 });
      const darkWoodMat = createLowPolyMat(0x451a03, { roughness: 0.75 });

      // Inner Moat (Uchibori) Water Base + Vermilion Arched Castle Bridge
      const moatBase = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.2, 4.7), waterMat);
      moatBase.position.y = 0.1;
      const islandGround = new THREE.Mesh(new THREE.BoxGeometry(4.85, 0.25, 3.65), alpineMeadowMat);
      islandGround.position.set(0, 0.22, -0.25);
      const redBridge = new THREE.Mesh(
        new THREE.BoxGeometry(0.62, 0.12, 1.05),
        createLowPolyMat(0xdc2626, { roughness: 0.5 })
      );
      redBridge.position.set(0, 0.32, 1.85);
      g.add(moatBase, islandGround, redBridge);

      // 1. Fan-Shaped Concave Ishigaki Stone Fortress Base (Ogi-no-kobai)
      const lowerIshigaki = new THREE.Mesh(new THREE.CylinderGeometry(2.35, 2.75, 0.78, 4), ishigakiMat);
      lowerIshigaki.rotation.y = Math.PI / 4;
      lowerIshigaki.scale.set(1.22, 1, 0.92);
      lowerIshigaki.position.set(0, 0.68, -0.28);

      const upperIshigaki = new THREE.Mesh(new THREE.CylinderGeometry(1.38, 1.68, 0.72, 4), rockDarkMat);
      upperIshigaki.rotation.y = Math.PI / 4;
      upperIshigaki.position.set(0.35, 1.38, -0.42);
      g.add(lowerIshigaki, upperIshigaki);

      // White Plastered Perimeter Defense Wall (Shirakabe) with Sama Loopholes & Otemon Gate
      const frontBailWall = new THREE.Mesh(new THREE.BoxGeometry(3.45, 0.42, 0.18), shikkuiWhiteMat);
      frontBailWall.position.set(0, 1.24, 0.88);
      const wallTileCap = new THREE.Mesh(new THREE.BoxGeometry(3.55, 0.08, 0.26), kawaraTileMat);
      wallTileCap.position.set(0, 1.48, 0.88);
      g.add(frontBailWall, wallTileCap);

      // 2. 5-Tiered Snow-White Main Keep (Daitenshu) with Upturned Eaves & Chidori/Karahafu Gables
      const tierWidths = [1.88, 1.56, 1.26, 0.98, 0.74];
      const tierDepths = [1.58, 1.32, 1.08, 0.86, 0.68];
      let curY = 1.72;

      for (let t = 0; t < 5; t++) {
        const tw = tierWidths[t];
        const td = tierDepths[t];
        const th = 0.42;

        // White Shikkui Plaster Tier Wall + Lattice Windows
        const tierWall = new THREE.Mesh(new THREE.BoxGeometry(tw, th, td), shikkuiWhiteMat);
        tierWall.position.set(0.35, curY + th / 2, -0.42);
        if (t < 3) tierWall.userData.isExteriorWallShell = true;
        else {
          tierWall.userData.isRoof = true;
          tierWall.userData.floorLevel = 3;
        }
        g.add(tierWall);

        for (let wx = -tw * 0.32; wx <= tw * 0.32; wx += tw * 0.32) {
          const latticeWin = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, 0.04), darkWoodMat);
          latticeWin.position.set(0.35 + wx, curY + th * 0.52, -0.42 + td / 2 + 0.01);
          if (t >= 3) {
            latticeWin.userData.isRoof = true;
            latticeWin.userData.floorLevel = 3;
          }
          g.add(latticeWin);
        }

        // Flared Japanese Kawara Roof Eave Skirt + Top Irimoya Gable on 5th Tier
        const eaveSkirt = new THREE.Mesh(
          new THREE.CylinderGeometry(tw * 0.62, tw * 0.86, 0.18, 4),
          kawaraTileMat
        );
        eaveSkirt.rotation.y = Math.PI / 4;
        eaveSkirt.scale.set(1.16, 1, 0.98);
        eaveSkirt.position.set(0.35, curY + th + 0.04, -0.42);
        eaveSkirt.userData.isRoof = true;
        eaveSkirt.userData.floorLevel = 3;
        g.add(eaveSkirt);

        // Triangular Chidori-hafu (Plover Gable Dormer) on Tiers 1, 2, 3
        if (t <= 2) {
          const chidori = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.24, 3), shikkuiWhiteMat);
          chidori.position.set(0.35 + (t % 2 === 0 ? 0 : 0.18), curY + th + 0.12, -0.42 + td * 0.48);
          chidori.userData.isRoof = true;
          chidori.userData.floorLevel = 3;
          const chidoriCap = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.12, 3), kawaraTileMat);
          chidoriCap.position.set(0.35 + (t % 2 === 0 ? 0 : 0.18), curY + th + 0.22, -0.42 + td * 0.48);
          chidoriCap.userData.isRoof = true;
          chidoriCap.userData.floorLevel = 3;
          g.add(chidori, chidoriCap);
        }

        curY += th + 0.08;
      }

      // Top 5th-Tier Irimoya Gable Roof + Twin Golden Shachihoko Roof Finials
      const topRidgeRoof = createTrueGableHall(
        0.78,
        0.08,
        0.34,
        0.72,
        shikkuiWhiteMat,
        kawaraTileMat,
        kawaraTileMat,
        glowMat,
        { windowCols: 0, windowRows: 0, goldRidge: goldMat, isShell: false }
      );
      topRidgeRoof.position.set(0.35, curY - 0.04, -0.42);
      g.add(topRidgeRoof);

      for (const sx of [0.35 - 0.34, 0.35 + 0.34]) {
        const shachihoko = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.22, 6), goldMat);
        shachihoko.position.set(sx, curY + 0.42, -0.42);
        shachihoko.userData.isRoof = true;
        shachihoko.userData.floorLevel = 3;
        g.add(shachihoko);
      }

      // 3. Three Subsidiary Keeps (Nishi-Kotenshu, Inui-Kotenshu & Higashi-Kotenshu) + Watari-Yagura Galleries
      for (const [kx, kz, kw, kh] of [
        [-1.18, 0.25, 0.88, 0.95], // West Small Keep (Nishi-Kotenshu)
        [-1.18, -0.82, 0.96, 1.15], // Northwest Small Keep (Inui-Kotenshu)
        [1.42, 0.32, 0.78, 0.85], // East Small Keep
      ]) {
        const subKeep = createTrueGableHall(
          kw,
          kh,
          0.38,
          kw * 0.9,
          shikkuiWhiteMat,
          kawaraTileMat,
          ishigakiMat,
          glowMat,
          { windowCols: 2, windowRows: 2, isShell: false }
        );
        subKeep.position.set(kx, 1.06, kz);
        g.add(subKeep);
      }

      // Blooming Pink Yoshino Cherry Blossom Trees around the Moat & Bailey
      for (const [cx, cy, cz, cs] of [
        [-2.05, 0.35, 1.15, 0.95],
        [2.05, 0.35, 1.15, 0.95],
        [-1.45, 1.05, 0.95, 0.76],
        [1.45, 1.05, 0.95, 0.76],
        [-2.15, 0.35, -1.15, 0.88],
        [2.15, 0.35, -1.15, 0.88],
      ]) {
        g.add(createTree('blossom', [cx, cy, cz], cs));
      }
      break;
    }

    // ========================================================================
    // 6. BD-146: 西班牙 · 塞哥维亚阿尔卡萨尔城堡 (Alcázar of Segovia, Castile, Spain)
    // Iconic razor-sharp ship-prow cliff ("Proa de Barco") oriented longitudinally,
    // cylindrical Homage Tower at the bow ringed by 4 witch-hat conical bartizans,
    // two-winged royal palace with slate gable roofs & 6 flanking conical turrets,
    // and the monumental crenellated rectangular Tower of John II at the stern!
    // ========================================================================
    case 6: {
      const segoviaCreamMat = createLowPolyMat(0xf2e3c9, { roughness: 0.58 });
      const sgraffitoTrimMat = createLowPolyMat(0xd9c29c, { roughness: 0.68 });
      const witchHatSlateMat = createLowPolyMat(0x232b38, { roughness: 0.45 });

      // Razor-Sharp Ship-Prow Limestone Cliff Crag (Oriented diagonally/forward for maximum drama!)
      const shipCliff = new THREE.Mesh(new THREE.ConeGeometry(2.35, 1.55, 4), rockLightMat);
      shipCliff.scale.set(0.76, 0.72, 1.75);
      shipCliff.position.set(0, 0.58, 0.05);
      const riverConfluence = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.16, 4.6), waterMat);
      riverConfluence.position.y = 0.08;
      g.add(riverConfluence, shipCliff);

      // 1. Ship-Bow Forward Bastion (At +Z Prow) + Conical Homage Tower with 4 Cantilevered Bartizans
      const prowBastion = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.78, 1.35, 6), segoviaCreamMat);
      prowBastion.position.set(0, 1.25, 1.52);
      g.add(prowBastion);

      const homageTower = createCastleSquareKeep(
        0.72,
        1.78,
        0.72,
        segoviaCreamMat,
        witchHatSlateMat,
        sgraffitoTrimMat,
        goldMat,
        glowMat,
        { bartizans: true, bartizanSpireH: 0.58, hasSpire: true, spireH: 1.05 }
      );
      homageTower.position.set(0, 1.28, 1.02);
      g.add(homageTower);

      // 2. Central Castilian Royal Palace Hall (Hall of the Monarchs) with True Pitched Slate Roof & Dormers
      const palaceBody = createTrueGableHall(
        1.52,
        1.48,
        0.76,
        1.85,
        segoviaCreamMat,
        witchHatSlateMat,
        sgraffitoTrimMat,
        glowMat,
        { dormerCount: 3, windowCols: 3, windowRows: 2, goldRidge: goldMat }
      );
      palaceBody.rotation.y = Math.PI / 2;
      palaceBody.position.set(0, 1.28, -0.05);
      g.add(palaceBody);

      // 6 Flanking Cylindrical Witch-Hat Slate-Spired Turrets along Left & Right Cliff Edges
      for (const [tx, tz, r, h, sH] of [
        [-0.88, 0.52, 0.25, 1.72, 0.88],
        [0.88, 0.52, 0.25, 1.72, 0.88],
        [-0.92, -0.18, 0.27, 1.85, 0.95],
        [0.92, -0.18, 0.27, 1.85, 0.95],
        [-0.88, -0.82, 0.24, 1.68, 0.82],
        [0.88, -0.82, 0.24, 1.68, 0.82],
      ]) {
        const tur = createCastleRoundTower(
          r,
          h,
          sH,
          segoviaCreamMat,
          witchHatSlateMat,
          sgraffitoTrimMat,
          goldMat,
          glowMat,
          { merlonCount: 6 }
        );
        tur.position.set(tx, 1.25, tz);
        g.add(tur);
      }

      // 3. Monumental Crenellated Rectangular Tower of John II (Torre de Juan II) at Stern (-Z)
      const juanTower = createCastleSquareKeep(
        1.48,
        2.55,
        0.88,
        segoviaCreamMat,
        witchHatSlateMat,
        sgraffitoTrimMat,
        goldMat,
        glowMat,
        { bartizans: true, bartizanSpireH: 0 }
      );
      juanTower.position.set(0, 1.28, -1.22);
      g.add(juanTower);

      // Engaged Semi-Cylindrical Bartizan Turrets along the Face of the Tower of John II
      for (const jx of [-0.45, 0, 0.45]) {
        for (const jz of [-0.78, -1.66]) {
          const halfTurret = new THREE.Mesh(
            new THREE.CylinderGeometry(0.11, 0.11, 1.35, 8),
            sgraffitoTrimMat
          );
          halfTurret.position.set(jx, 2.95, jz);
          g.add(halfTurret);
        }
      }
      break;
    }

    // ========================================================================
    // 7. BD-147: 苏格兰 · 爱莲朵娜城堡 (Eilean Donan Castle, Scottish Highlands)
    // Set in mirror-dark Loch Duich tidal sea loch:
    // Iconic 3-arch stone causeway bridge with cutwaters, rugged tidal islet,
    // tall rectangular grey-granite Main Keep (Donjon) with Scottish crow-stepped gables
    // ("Corbie Steps") & twin chimneys, banquet wing, and battered sea-curtain wall!
    // ========================================================================
    case 7: {
      const highlandGraniteMat = createLowPolyMat(0x847e75, { roughness: 0.85 });
      const darkRubbleMat = createLowPolyMat(0x635d54, { roughness: 0.9 });
      const highlandSlateMat = createLowPolyMat(0x2f3842, { roughness: 0.58 });

      // Loch Duich Mirror-Calm Sea Loch Base
      const lochWater = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.2, 4.7), waterMat);
      lochWater.position.y = 0.1;

      // Rocky Tidal Islet on Left (-X) + Mainland Shore Promontory on Right (+X)
      const tidalIslet = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 2.08, 0.58, 10), rockDarkMat);
      tidalIslet.scale.set(1.15, 1, 0.95);
      tidalIslet.position.set(-0.68, 0.36, -0.15);
      const isletGrass = new THREE.Mesh(new THREE.CylinderGeometry(1.62, 1.72, 0.12, 10), alpineMeadowMat);
      isletGrass.scale.set(1.15, 1, 0.95);
      isletGrass.position.set(-0.68, 0.66, -0.15);
      const shoreHeadland = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.48, 1.45), rockDarkMat);
      shoreHeadland.position.set(2.22, 0.32, 0.85);
      g.add(lochWater, tidalIslet, isletGrass, shoreHeadland);

      // 1. Iconic 3-Arch Stone Causeway Bridge Spanning from Mainland Shore (+X) to Castle Islet (-X)
      const bridgeRoad = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.18, 0.54), highlandGraniteMat);
      bridgeRoad.position.set(1.02, 0.76, 0.85);
      const bridgeParapetF = createCrenellatedWallSegment(2.45, 0.18, 0.08, highlandGraniteMat, darkRubbleMat);
      bridgeParapetF.position.set(1.02, 0.84, 1.09);
      const bridgeParapetB = createCrenellatedWallSegment(2.45, 0.18, 0.08, highlandGraniteMat, darkRubbleMat);
      bridgeParapetB.position.set(1.02, 0.84, 0.61);
      g.add(bridgeRoad, bridgeParapetF, bridgeParapetB);

      for (const px of [0.15, 0.98, 1.82]) {
        const pier = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.62, 0.66), darkRubbleMat);
        pier.position.set(px, 0.42, 0.85);
        const archVoid = new THREE.Mesh(
          new THREE.TorusGeometry(0.26, 0.06, 6, 12, Math.PI),
          darkRubbleMat
        );
        archVoid.position.set(px + 0.41, 0.42, 1.12);
        g.add(pier, archVoid);
      }

      // 2. Tall Rectangular Scottish Baronial Main Keep (Donjon) with Crow-Stepped Gables & Twin Chimneys
      const mainKeep = createTrueGableHall(
        1.58,
        1.92,
        0.78,
        1.22,
        highlandGraniteMat,
        highlandSlateMat,
        darkRubbleMat,
        glowMat,
        { crowSteps: true, windowCols: 3, windowRows: 3 }
      );
      mainKeep.position.set(-0.78, 0.72, -0.32);

      for (const cx of [-1.48, -0.08]) {
        const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.92, 0.24), darkRubbleMat);
        chimney.position.set(cx, 2.95, -0.32);
        chimney.userData.isRoof = true;
        chimney.userData.floorLevel = 3;
        g.add(chimney);
      }

      // Corner Bartizan Turret on the Keep
      const keepBartizan = createCastleRoundTower(
        0.2,
        0.95,
        0.48,
        highlandGraniteMat,
        highlandSlateMat,
        darkRubbleMat,
        goldMat,
        glowMat,
        { merlonCount: 5 }
      );
      keepBartizan.position.set(-0.02, 1.85, 0.28);

      // 3. Lower Crow-Stepped Banquet Wing + Crenellated Outer Bawn Wall & Water-Gate Tower
      const banquetHall = createTrueGableHall(
        1.15,
        1.18,
        0.55,
        0.95,
        highlandGraniteMat,
        highlandSlateMat,
        darkRubbleMat,
        glowMat,
        { crowSteps: true, dormerCount: 2, windowCols: 2, windowRows: 2, isShell: false }
      );
      banquetHall.position.set(0.18, 0.72, -0.15);

      const seawardBastion = createCastleRoundTower(
        0.34,
        1.12,
        0.45,
        highlandGraniteMat,
        highlandSlateMat,
        darkRubbleMat,
        goldMat,
        glowMat,
        { merlonCount: 7 }
      );
      seawardBastion.position.set(-1.78, 0.68, 0.45);

      const bawnWall = createCrenellatedWallSegment(1.65, 0.68, 0.22, highlandGraniteMat, darkRubbleMat);
      bawnWall.position.set(-0.85, 0.68, 0.78);
      g.add(mainKeep, keepBartizan, banquetHall, seawardBastion, bawnWall);
      break;
    }

    // ========================================================================
    // 8. BD-148: 捷克 · 布拉格城堡与黄金巷 (Prague Castle — St. Vitus & Golden Lane)
    // Hradčany Hill citadel: St. Vitus Gothic Cathedral with flying buttresses,
    // rose window, twin pierced Gothic spires & 96m South Clocktower with green-copper
    // Baroque onion dome, terracotta-roofed Vladislav Hall, and 6 colorful Golden Lane cottages!
    // ========================================================================
    case 8: {
      const gothicStoneMat = createLowPolyMat(0xc8bfb0, { roughness: 0.72 });
      const darkGothicMat = createLowPolyMat(0x52525b, { roughness: 0.68 });
      const copperDomeMat = createLowPolyMat(0x2dd4bf, { roughness: 0.42 });
      const terracottaRoofMat = createLowPolyMat(0xc2410c, { roughness: 0.55 });
      const stuccoWhiteMat = createLowPolyMat(0xf5f0e6, { roughness: 0.58 });

      // Stepped Hradčany Castle Ridge Base
      const hillBase = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.38, 4.6), rockDarkMat);
      hillBase.position.y = 0.19;
      const upperTerrace = new THREE.Mesh(new THREE.BoxGeometry(5.15, 0.36, 3.85), gothicStoneMat);
      upperTerrace.position.set(0, 0.52, -0.15);
      g.add(hillBase, upperTerrace);

      // 1. St. Vitus Gothic Cathedral: High Nave with True Pitched Slate Roof + 10 Flying Buttresses & Pinnacles
      const vitusNave = createTrueGableHall(
        2.65,
        1.78,
        0.88,
        1.22,
        gothicStoneMat,
        darkGothicMat,
        darkGothicMat,
        glowMat,
        { windowCols: 5, windowRows: 2, goldRidge: goldMat }
      );
      vitusNave.position.set(-0.45, 0.7, -0.58);
      g.add(vitusNave);

      // Gothic Flying Buttresses & Carved Pinnacles along Cathedral Flanks
      for (let bx = -1.45; bx <= 0.55; bx += 0.48) {
        for (const bz of [-1.28, 0.12]) {
          const pier = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.65, 0.16), darkGothicMat);
          pier.position.set(bx, 1.52, bz);
          const pinnacle = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.42, 4), darkGothicMat);
          pinnacle.position.set(bx, 2.52, bz);
          g.add(pier, pinnacle);
        }
      }

      // Twin 82m Pierced Gothic Western Towers & Great Rose Window
      for (const wz of [-0.98, -0.18]) {
        const wTower = createCastleSquareKeep(
          0.46,
          2.45,
          0.46,
          gothicStoneMat,
          darkGothicMat,
          darkGothicMat,
          goldMat,
          glowMat,
          { hasSpire: true, spireH: 1.25 }
        );
        wTower.position.set(-1.82, 0.7, wz);
        g.add(wTower);
      }
      const roseWindow = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.08, 16), glowMat);
      roseWindow.rotation.z = Math.PI / 2;
      roseWindow.position.set(-1.8, 1.85, -0.58);
      g.add(roseWindow);

      // 96m Great South Bell Tower with Verdigris Copper Baroque Onion Dome & Golden Clock Face
      const southBellTower = createCastleSquareKeep(
        0.64,
        2.75,
        0.64,
        gothicStoneMat,
        copperDomeMat,
        darkGothicMat,
        goldMat,
        glowMat
      );
      southBellTower.position.set(0.35, 0.7, 0.12);
      const onionDome1 = new THREE.Mesh(new THREE.SphereGeometry(0.38, 14, 12), copperDomeMat);
      onionDome1.scale.set(1, 1.25, 1);
      onionDome1.position.set(0.35, 3.82, 0.12);
      onionDome1.userData.isRoof = true;
      onionDome1.userData.floorLevel = 3;
      const onionLantern = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.42, 10), goldMat);
      onionLantern.position.set(0.35, 4.32, 0.12);
      onionLantern.userData.isRoof = true;
      onionLantern.userData.floorLevel = 3;
      const onionNeedle = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.75, 8), copperDomeMat);
      onionNeedle.position.set(0.35, 4.82, 0.12);
      onionNeedle.userData.isRoof = true;
      onionNeedle.userData.floorLevel = 3;
      const clockDial = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.06, 14), goldMat);
      clockDial.rotation.x = Math.PI / 2;
      clockDial.position.set(0.35, 2.75, 0.45);
      g.add(southBellTower, onionDome1, onionLantern, onionNeedle, clockDial);

      // 2. Old Royal Palace (Vladislav Hall) with White Stucco Walls & Pitched Terracotta Roof
      const vladislavHall = createTrueGableHall(
        1.52,
        1.15,
        0.58,
        1.05,
        stuccoWhiteMat,
        terracottaRoofMat,
        gothicStoneMat,
        glowMat,
        { dormerCount: 2, windowCols: 3, windowRows: 2, isShell: false }
      );
      vladislavHall.position.set(1.58, 0.7, -0.45);
      g.add(vladislavHall);

      // 3. Daliborka Round Tower & 6 Colorful Miniature Golden Lane Cottages (#22 Franz Kafka Blue Cottage)
      const daliborkaTower = createCastleRoundTower(
        0.32,
        1.58,
        0.58,
        gothicStoneMat,
        terracottaRoofMat,
        darkGothicMat,
        goldMat,
        glowMat
      );
      daliborkaTower.position.set(2.22, 0.7, 1.18);
      g.add(daliborkaTower);

      const laneColors = [0x60a5fa, 0xfbbf24, 0xf87171, 0x34d399, 0xfbcfe8, 0xa78bfa];
      for (let i = 0; i < 6; i++) {
        const lx = -1.95 + i * 0.68;
        const cottage = createTrueGableHall(
          0.62,
          0.62,
          0.32,
          0.55,
          createLowPolyMat(laneColors[i]),
          terracottaRoofMat,
          stuccoWhiteMat,
          glowMat,
          { windowCols: 1, windowRows: 1, isShell: false }
        );
        cottage.position.set(lx, 0.7, 1.22);
        g.add(cottage);
      }
      break;
    }

    // ========================================================================
    // 9. BD-149: 英国 · 温莎城堡 (Windsor Castle — Round Tower & Upper/Lower Wards)
    // Authentic Two-Bailey & Central Motte layout:
    // Central emerald chalk Motte crowned by the massive crenellated cylindrical Round Tower
    // & Flag Turret flying the Royal Standard; Left: St. George's Chapel with Gothic pinnacles;
    // Right: Crenellated Upper Ward State Apartments; Front: King Henry VIII Gate & Long Walk!
    // ========================================================================
    case 9: {
      const bathStoneMat = createLowPolyMat(0xe3d6be, { roughness: 0.65 });
      const trimStoneMat = createLowPolyMat(0xf4efe6, { roughness: 0.58 });
      const leadRoofMat = createLowPolyMat(0x475569, { roughness: 0.55 });
      const royalRedMat = createLowPolyMat(0xb91c1c, { roughness: 0.5 });

      // Windsor Estate Plinth + The Long Walk Processional Tree-Lined Avenue
      const baseSlab = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.3, 4.7), bathStoneMat);
      baseSlab.position.y = 0.15;
      const lawnPad = new THREE.Mesh(new THREE.BoxGeometry(5.38, 0.08, 4.48), alpineMeadowMat);
      lawnPad.position.y = 0.32;
      const longWalk = new THREE.Mesh(
        new THREE.BoxGeometry(0.95, 0.04, 1.65),
        createLowPolyMat(0xd6c7b2, { roughness: 0.85 })
      );
      longWalk.position.set(0, 0.37, 1.48);
      g.add(baseSlab, lawnPad, longWalk);

      // 1. Central Sculpted Emerald Chalk Motte Mound + Monumental Crenellated Round Tower (The Keep)
      const motteMound = new THREE.Mesh(new THREE.CylinderGeometry(1.12, 1.55, 0.88, 20), alpineMeadowMat);
      motteMound.position.set(0, 0.76, -0.25);
      const motteRetainingWall = new THREE.Mesh(new THREE.CylinderGeometry(1.56, 1.62, 0.28, 20), bathStoneMat);
      motteRetainingWall.position.set(0, 0.48, -0.25);
      g.add(motteMound, motteRetainingWall);

      const roundTowerKeep = createCastleRoundTower(
        1.02,
        1.48,
        0,
        bathStoneMat,
        leadRoofMat,
        trimStoneMat,
        goldMat,
        glowMat,
        { merlonCount: 18 }
      );
      roundTowerKeep.position.set(0, 1.18, -0.25);

      // Raised Flag Turret + Flagstaff Flying the Royal Standard of the United Kingdom
      const flagTurret = createCastleRoundTower(
        0.28,
        0.78,
        0,
        bathStoneMat,
        leadRoofMat,
        trimStoneMat,
        goldMat,
        glowMat,
        { merlonCount: 8 }
      );
      flagTurret.position.set(0.42, 2.65, -0.25);
      const flagpole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.85, 6), goldMat);
      flagpole.position.set(0.42, 3.78, -0.25);
      const royalStandard = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.32, 0.03), royalRedMat);
      royalStandard.position.set(0.68, 4.02, -0.25);
      const flagGoldQuarter = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 0.036), goldMat);
      flagGoldQuarter.position.set(0.56, 4.08, -0.25);
      g.add(roundTowerKeep, flagTurret, flagpole, royalStandard, flagGoldQuarter);

      // 2. Lower Ward (Left, -X): St. George's Chapel with Perpendicular Gothic Pinnacles & Curfew Tower
      const stGeorgeChapel = createTrueGableHall(
        1.58,
        1.22,
        0.48,
        1.08,
        bathStoneMat,
        leadRoofMat,
        trimStoneMat,
        glowMat,
        { windowCols: 4, windowRows: 1 }
      );
      stGeorgeChapel.position.set(-1.72, 0.36, -0.22);
      g.add(stGeorgeChapel);

      for (let px = -2.38; px <= -1.06; px += 0.33) {
        for (const pz of [-0.78, 0.34]) {
          const buttress = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.32, 0.12), trimStoneMat);
          buttress.position.set(px, 1.02, pz);
          const pinnacle = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.38, 4), trimStoneMat);
          pinnacle.position.set(px, 1.85, pz);
          g.add(buttress, pinnacle);
        }
      }

      const curfewTower = createCastleRoundTower(
        0.34,
        1.65,
        0.68,
        bathStoneMat,
        leadRoofMat,
        trimStoneMat,
        goldMat,
        glowMat,
        { merlonCount: 8 }
      );
      curfewTower.position.set(-2.38, 0.36, 0.72);
      g.add(curfewTower);

      // 3. Upper Ward (Right, +X): State Apartments Quadrangle + Crenellated Square Corner Towers
      const stateApartments = createCastleSquareKeep(
        1.55,
        1.35,
        1.18,
        bathStoneMat,
        leadRoofMat,
        trimStoneMat,
        goldMat,
        glowMat,
        { bartizans: true, bartizanSpireH: 0 }
      );
      stateApartments.position.set(1.72, 0.36, -0.22);

      const brunswickTower = createCastleRoundTower(
        0.34,
        1.85,
        0,
        bathStoneMat,
        leadRoofMat,
        trimStoneMat,
        goldMat,
        glowMat,
        { merlonCount: 10 }
      );
      brunswickTower.position.set(2.38, 0.36, -0.82);

      // 4. King Henry VIII Twin-Turreted Gatehouse at Front Center
      const henryGate = createCastleSquareKeep(
        1.08,
        1.25,
        0.62,
        bathStoneMat,
        leadRoofMat,
        trimStoneMat,
        goldMat,
        glowMat,
        { archGate: true, bartizans: true, bartizanSpireH: 0 }
      );
      henryGate.position.set(0, 0.36, 0.92);
      g.add(stateApartments, brunswickTower, henryGate);

      for (const ox of [-0.95, 0.95]) {
        g.add(createTree('oak', [ox, 0.36, 1.68], 0.85));
      }
      break;
    }

    // ========================================================================
    // 10. BD-150: 葡萄牙 · 辛特拉佩纳宫城堡 (Pena Palace, Sintra, Portugal)
    // Perched on giant granite boulders of the Sintra Mountains:
    // Vivid Canary-Yellow New Palace Wing with Moorish keyhole arches & scarlet-domed
    // cylindrical watchtower; Terracotta-Red Old Convent Square Clock Tower & Manueline
    // cloister; ornate Triton Arch Portal; and blue-and-white Azulejo tiled Queen's Terrace!
    // ========================================================================
    case 10:
    default: {
      const canaryYellowMat = createLowPolyMat(0xfacc15, { roughness: 0.48 });
      const terracottaRedMat = createLowPolyMat(0xdc2626, { roughness: 0.52 });
      const azulejoBlueMat = createLowPolyMat(0x0284c7, { roughness: 0.38 });
      const manuelineStoneMat = createLowPolyMat(0xe7e5e4, { roughness: 0.62 });

      // Sintra Mountain Granite Boulder Crags & Botanical Forest Slope
      const sintraMountain = new THREE.Mesh(new THREE.ConeGeometry(2.85, 1.38, 10), rockDarkMat);
      sintraMountain.scale.set(1.18, 0.78, 0.92);
      sintraMountain.position.set(0, 0.55, -0.05);
      g.add(sintraMountain);

      for (const [bx, by, bz, br] of [
        [-1.85, 0.72, 0.85, 0.55],
        [1.95, 0.68, 0.75, 0.52],
        [0.15, 0.75, 1.15, 0.48],
      ]) {
        const boulder = new THREE.Mesh(new THREE.DodecahedronGeometry(br, 0), rockLightMat);
        boulder.position.set(bx, by, bz);
        g.add(boulder);
      }

      // 1. Queen's Terrace (Terraço da Rainha) with Blue-and-White Azulejo Tile Pavement & Arches of the Yard
      const queensTerrace = new THREE.Mesh(new THREE.BoxGeometry(3.65, 0.42, 1.48), azulejoBlueMat);
      queensTerrace.position.set(0, 0.98, 0.58);
      const terraceParapet = createCrenellatedWallSegment(3.65, 0.22, 0.12, canaryYellowMat, manuelineStoneMat);
      terraceParapet.position.set(0, 1.19, 1.26);
      g.add(queensTerrace, terraceParapet);

      // Moorish Triple-Arch Gateway (Arcos do Pátio) on the Right Terrace Edge
      const yardArches = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.95, 0.18), canaryYellowMat);
      yardArches.position.set(1.18, 1.65, 1.12);
      for (const ax of [0.85, 1.18, 1.51]) {
        const keyhole = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.08, 0.22, 10), glowMat);
        keyhole.rotation.x = Math.PI / 2;
        keyhole.position.set(ax, 1.62, 1.12);
        g.add(keyhole);
      }
      g.add(yardArches);

      // 2. Canary-Yellow Romanticist New Palace Wing + Neo-Manueline Triton Portal + Scarlet Onion-Domed Tower
      const yellowPalace = createCastleSquareKeep(
        1.85,
        1.58,
        1.38,
        canaryYellowMat,
        terracottaRedMat,
        manuelineStoneMat,
        goldMat,
        glowMat,
        { bartizans: true, bartizanSpireH: 0.35 }
      );
      yellowPalace.position.set(-0.68, 1.18, -0.22);

      // Portico of the Triton (Neo-Manueline Coral & Sea-Monster Archway)
      const tritonGate = createCastleSquareKeep(
        0.78,
        1.32,
        0.58,
        manuelineStoneMat,
        canaryYellowMat,
        goldMat,
        goldMat,
        glowMat,
        { archGate: true, bartizans: true, bartizanSpireH: 0.32 }
      );
      tritonGate.position.set(-0.52, 1.18, 0.72);

      // Iconic Cylindrical Yellow Watchtower with Scarlet-Red Hemispherical Moorish Dome
      const domeTower = createCastleRoundTower(
        0.52,
        2.15,
        0,
        canaryYellowMat,
        terracottaRedMat,
        manuelineStoneMat,
        goldMat,
        glowMat,
        { merlonCount: 10, onionDome: true }
      );
      domeTower.position.set(-1.55, 1.18, -0.28);
      g.add(yellowPalace, tritonGate, domeTower);

      // 3. Terracotta-Red Former Hieronymite Convent Wing & Tall Crenellated Square Clock Tower
      const redConvent = createCastleSquareKeep(
        1.55,
        1.52,
        1.28,
        terracottaRedMat,
        canaryYellowMat,
        manuelineStoneMat,
        goldMat,
        glowMat,
        { bartizans: false }
      );
      redConvent.position.set(0.95, 1.18, -0.35);

      const redClockTower = createCastleSquareKeep(
        0.78,
        2.68,
        0.78,
        terracottaRedMat,
        canaryYellowMat,
        manuelineStoneMat,
        goldMat,
        glowMat,
        { bartizans: true, bartizanSpireH: 0.38, hasSpire: true, spireH: 0.72 }
      );
      redClockTower.position.set(1.38, 1.18, -0.52);
      g.add(redConvent, redClockTower);

      // Sintra Botanical Forest (Cypresses, Pines & Oaks)
      for (const [tx, ty, tz, type] of [
        [-2.28, 0.42, 1.18, 'cypress'],
        [2.28, 0.42, 1.18, 'oak'],
        [-2.25, 0.48, -0.95, 'pine'],
        [2.25, 0.48, -0.95, 'cypress'],
      ] as [number, number, number, 'cypress' | 'oak' | 'pine'][]) {
        g.add(createTree(type, [tx, ty, tz], 0.88));
      }
      break;
    }
  }

  // Embed the paired 2-story detailed castle interior (diorama_dollhouse_33..42),
  // hidden by default in normal exterior view ('all') so it NEVER pokes through the castle exterior,
  // and revealed automatically when the user selects '1f_only' or '2f_only' Cutaway Mode!
  const dhIdx = 32 + castleIdx; // 33..42
  const syntheticCastleInterior: IslandMetadata = {
    ...island,
    id: `diorama_dollhouse_${String(dhIdx).padStart(2, '0')}`,
  };
  const embeddedInterior = buildWorldCastleInteriorScene(syntheticCastleInterior, variant);
  embeddedInterior.scale.setScalar(0.48);
  embeddedInterior.position.set(0, 0.65, -0.2);
  embeddedInterior.userData.isEmbeddedCutawayInterior = true;
  embeddedInterior.visible = false;
  g.add(embeddedInterior);

  addShadows(g);
  return g;
}

// ============================================================================
// PART 2: 10 AUTHENTIC ROYAL CASTLE MULTI-STORY INTERIORS (diorama_dollhouse_33 to 42)
// Built specifically as medieval / royal / samurai castle halls — NO modern kitchens!
// Features Stone Vaulted & Timber-Truss Castle Walls, Gothic Pointed Arches,
// Heraldic Banners, Suits of Medieval Plate Armor (or Samurai O-Yoroi for Himeji),
// Spiral Stone Turret Stairs, Royal Thrones, Hooded Castle Hearths, State Banquet Tables,
// and 2F Royal Canopy Bedchambers & Castle Treasury / Alchemical Libraries!
// ============================================================================
export function buildWorldCastleInteriorScene(
  island: IslandMetadata,
  variant: IslandVariant = 'classic'
): THREE.Group {
  const root = new THREE.Group();
  const dhNum = parseInt(island.id.replace('diorama_dollhouse_', ''), 10) || 33;
  const castleIdx = Math.max(1, Math.min(10, dhNum - 32)); // 1..10 (corresponding to BD-141..150)

  const isJapaneseCastle = castleIdx === 5; // #5 Himeji Castle (Shoin-zukuri Tatami & Timber Palace)
  const isMoorishCastle = castleIdx === 6 || castleIdx === 10; // #6 Segovia Mudéjar & #10 Pena Palace

  const stoneWallMat = createLowPolyMat(
    isJapaneseCastle ? 0xfaf6ee : isMoorishCastle ? 0xf3e5ab : 0xd6cfc2,
    { roughness: 0.72 }
  );
  const darkStoneMat = createLowPolyMat(isJapaneseCastle ? 0x5c3a21 : 0x78716c, { roughness: 0.8 });
  const floorStoneMat = createLowPolyMat(
    isJapaneseCastle ? 0xc2b280 : castleIdx === 3 ? 0xf4efe6 : 0x9ca3af,
    { roughness: 0.48 }
  );
  const marbleMat = createLowPolyMat(0xf5f0e6, { roughness: 0.32 });
  const woodMat = createLowPolyMat(0x5c3a21, { roughness: 0.68 });
  const darkWoodMat = createLowPolyMat(0x3a2312, { roughness: 0.62 });
  const royalCrimsonMat = createLowPolyMat(0x991b1b, { roughness: 0.52 });
  const royalBlueMat = createLowPolyMat(0x1e3a8a, { roughness: 0.5 });
  const armorSteelMat = createLowPolyMat(0x94a3b8, { metalness: 0.75, roughness: 0.28 });
  const darkIronMat = createLowPolyMat(0x27272a, { metalness: 0.55, roughness: 0.4 });
  const goldMat = createLowPolyMat(0xd4af37, { metalness: 0.68, roughness: 0.24 });
  const glowMat = createLowPolyMat(variant === 'fantasy' ? 0xffd166 : 0xffe599, {
    emissive: 0xf59e0b,
    roughness: 0.25,
  });
  const glassMat = createGlassMat(0xbae6fd, 0.62);
  const waterMat = createWaterMat(0x0ea5e9);

  // ==========================================================================
  // FLOOR 1 GROUP: GREAT THRONE ROOM (LEFT) & ROYAL BANQUET / TREASURY HALL (RIGHT)
  // ==========================================================================
  const floor1Group = new THREE.Group();
  floor1Group.userData.floorLevel = 1;

  // Massive Stone Castle Foundation Slab with Crenellated Outer Rim
  const castlePlinth = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.28, 4.6), darkStoneMat);
  castlePlinth.position.set(0, -0.14, 0);
  const floorSlab1F = new THREE.Mesh(new THREE.BoxGeometry(5.36, 0.06, 4.36), floorStoneMat);
  floorSlab1F.position.set(0, 0.03, 0);
  floor1Group.add(castlePlinth, floorSlab1F);

  // Flagstone / Checkered Marble / Tatami Mat Grid on 1F
  for (let ix = 0; ix < 8; ix++) {
    for (let iz = 0; iz < 6; iz++) {
      if ((ix + iz) % 2 === 0) {
        const tile = new THREE.Mesh(
          new THREE.BoxGeometry(0.58, 0.015, 0.58),
          isJapaneseCastle
            ? createLowPolyMat(0xb5a676)
            : castleIdx === 3
            ? darkIronMat
            : castleIdx === 10
            ? createLowPolyMat(0x0284c7)
            : marbleMat
        );
        tile.position.set(-2.05 + ix * 0.58, 0.065, -1.48 + iz * 0.58);
        floor1Group.add(tile);
      }
    }
  }

  // 1F Cutaway Castle Stone Walls (Back Wall z = -2.08, Left Wall x = -2.58) & Central Gothic Arch Partition
  const backWall1F = new THREE.Mesh(new THREE.BoxGeometry(5.36, 1.92, 0.2), stoneWallMat);
  backWall1F.position.set(0, 0.98, -2.08);
  const leftWall1F = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.92, 4.36), stoneWallMat);
  leftWall1F.position.set(-2.58, 0.98, 0);
  floor1Group.add(backWall1F, leftWall1F);

  // Stone Pilaster Buttresses & Gothic/Romanesque Vaulted Ribs along 1F Walls + Royal Heraldic Banners
  for (const px of [-2.42, -1.25, 0, 1.25, 2.42]) {
    const pilaster = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.92, 0.16), darkStoneMat);
    pilaster.position.set(px, 0.98, -1.96);
    const capital = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.1, 0.22), goldMat);
    capital.position.set(px, 1.86, -1.96);
    floor1Group.add(pilaster, capital);
  }

  // Central Castle Stone Archway Partition dividing Throne Room (Left) and Great Banquet Hall (Right)
  const archPierBack = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.92, 1.25), darkStoneMat);
  archPierBack.position.set(0, 0.98, -1.42);
  const archPierFront = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.92, 0.68), darkStoneMat);
  archPierFront.position.set(0, 0.98, 1.75);
  const archHeader = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.45, 4.25), darkStoneMat);
  archHeader.position.set(0, 1.72, 0);
  floor1Group.add(archPierBack, archPierFront, archHeader);

  // Tall Stained-Glass Lancet / Shoji Windows & Hanging Royal Heraldic Banners on 1F Back Wall
  for (const wx of [-1.82, -0.62, 0.62, 1.82]) {
    const winFrame = new THREE.Mesh(new THREE.BoxGeometry(0.46, 1.05, 0.08), darkStoneMat);
    winFrame.position.set(wx, 1.15, -1.96);
    const winGlow = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.95, 0.09), glowMat);
    winGlow.position.set(wx, 1.15, -1.96);
    floor1Group.add(winFrame, winGlow);
  }
  for (const bx of [-1.22, 1.22]) {
    const bannerRod = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.42, 6), goldMat);
    bannerRod.rotation.z = Math.PI / 2;
    bannerRod.position.set(bx, 1.72, -1.88);
    const bannerCloth = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.78, 0.02),
      bx < 0 ? royalCrimsonMat : royalBlueMat
    );
    bannerCloth.position.set(bx, 1.3, -1.88);
    const crest = new THREE.Mesh(new THREE.OctahedronGeometry(0.07, 0), goldMat);
    crest.position.set(bx, 1.32, -1.86);
    floor1Group.add(bannerRod, bannerCloth, crest);
  }

  // Spiral Stone Castle Staircase with Wrought-Iron Torch Sconces in Front-Left Corner
  for (let s = 0; s < 10; s++) {
    const stepY = 0.12 + s * 0.18;
    const stepZ = 1.45 - s * 0.26;
    const stoneStep = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.16, 0.28), darkStoneMat);
    stoneStep.position.set(-2.08, stepY, stepZ);
    const redCarpet = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.17, 0.29), royalCrimsonMat);
    redCarpet.position.set(-2.08, stepY + 0.005, stepZ);
    const baluster = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.36, 6), goldMat);
    baluster.position.set(-1.72, stepY + 0.24, stepZ);
    floor1Group.add(stoneStep, redCarpet, baluster);
  }

  // 2 Standing Suits of Medieval Knight Plate Armor (or Samurai O-Yoroi for Himeji) with Halberds
  for (const az of [-0.95, 0.75]) {
    const ped = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 0.34), darkStoneMat);
    ped.position.set(-0.32, 0.12, az);
    const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.38, 8), armorSteelMat);
    legs.position.set(-0.32, 0.38, az);
    const cuirass = new THREE.Mesh(
      new THREE.BoxGeometry(0.26, 0.34, 0.2),
      isJapaneseCastle ? darkIronMat : armorSteelMat
    );
    cuirass.position.set(-0.32, 0.72, az);
    const helm = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 8, 8),
      isJapaneseCastle ? goldMat : armorSteelMat
    );
    helm.position.set(-0.32, 0.98, az);
    const halberdShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 1.25, 6), woodMat);
    halberdShaft.position.set(-0.32, 0.75, az + 0.16);
    const halberdBlade = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.22, 4), goldMat);
    halberdBlade.position.set(-0.32, 1.42, az + 0.16);
    floor1Group.add(ped, legs, cuirass, helm, halberdShaft, halberdBlade);
  }

  // --- BESPOKE 1F LEFT THRONE ROOM / GREAT HALL CENTERPIECE FOR EACH OF THE 10 CASTLES ---
  if (castleIdx === 1) {
    // #1 Neuschwanstein: 12-Step White Carrara Marble Dais, Byzantine Gold Apse & 96-Candle Crown Chandelier
    const marbleDais = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.28, 1.05), marbleMat);
    marbleDais.position.set(-1.15, 0.18, -1.15);
    const goldApse = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.58, 1.38, 12, 1, false, 0, Math.PI), goldMat);
    goldApse.position.set(-1.15, 0.88, -1.45);
    const swanStatue = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), marbleMat);
    swanStatue.scale.set(1.4, 0.85, 0.9);
    swanStatue.position.set(-1.15, 0.45, 0.25);
    const crownChandelier = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.32, 0.38, 12), goldMat);
    crownChandelier.position.set(-1.15, 1.62, -0.15);
    floor1Group.add(marbleDais, goldApse, swanStatue, crownChandelier);
  } else if (castleIdx === 2) {
    // #2 Mont-Saint-Michel: Gothic Double-Colonnade Cloister Garden & Medieval Illuminated Scriptorium
    const cloisterGarden = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.12, 1.18), createLowPolyMat(0x15803d));
    cloisterGarden.position.set(-1.15, 0.1, 0.15);
    for (const [cx, cz] of [
      [-1.58, -0.35],
      [-0.72, -0.35],
      [-1.58, 0.65],
      [-0.72, 0.65],
    ]) {
      const twinCol = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 1.25, 8), marbleMat);
      twinCol.position.set(cx, 0.68, cz);
      floor1Group.add(twinCol);
    }
    const scriptDesk = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.48, 0.45), darkWoodMat);
    scriptDesk.position.set(-1.15, 0.3, -1.15);
    const goldBible = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.06, 0.26), goldMat);
    goldBible.position.set(-1.15, 0.57, -1.15);
    floor1Group.add(cloisterGarden, scriptDesk, goldBible);
  } else if (castleIdx === 3) {
    // #3 Château de Chenonceau: Over-River Arched Window Alcoves, Classical Medici Busts & Hanging Copper Pots
    const riverWindowBay = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.12, 0.85), waterMat);
    riverWindowBay.position.set(-1.15, 0.08, 0.25);
    const copperRack = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.88, 0.26), darkIronMat);
    copperRack.position.set(-1.15, 0.55, -1.25);
    for (const px of [-1.45, -1.15, -0.85]) {
      const pot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11, 0.11, 0.18, 10),
        createLowPolyMat(0xd97706, { metalness: 0.65, roughness: 0.25 })
      );
      pot.position.set(px, 0.62, -1.15);
      floor1Group.add(pot);
    }
    floor1Group.add(riverWindowBay, copperRack);
  } else if (castleIdx === 4) {
    // #4 Hohenzollern Castle: Bulletproof Crystal Vitrine with Jeweled Prussian Royal Crown & Scepter
    const dais = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.16, 1.25), royalCrimsonMat);
    dais.position.set(-1.15, 0.12, -0.15);
    const crownPed = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.56, 0.56), marbleMat);
    crownPed.position.set(-1.15, 0.44, -0.15);
    const crystalCase = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.46, 0.48), glassMat);
    crystalCase.position.set(-1.15, 0.92, -0.15);
    const prussianCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.14, 0.2, 12), goldMat);
    prussianCrown.position.set(-1.15, 0.86, -0.15);
    floor1Group.add(dais, crownPed, crystalCase, prussianCrown);
  } else if (castleIdx === 5) {
    // #5 Himeji Castle: Ohiroma Raised Tatami Dais, Gold Kano Folding Screen (Byobu), Samurai O-Yoroi & Katana Rack
    const jodanDais = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.18, 1.35), createLowPolyMat(0xd4c598));
    jodanDais.position.set(-1.15, 0.14, -0.65);
    const goldByobu = new THREE.Mesh(new THREE.BoxGeometry(1.28, 1.05, 0.08), goldMat);
    goldByobu.position.set(-1.15, 0.72, -1.25);
    const katanaRack = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.38, 0.18), darkWoodMat);
    katanaRack.position.set(-1.15, 0.38, 0.35);
    const katanaBlade = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.04, 0.04), armorSteelMat);
    katanaBlade.position.set(-1.15, 0.56, 0.35);
    floor1Group.add(jodanDais, goldByobu, katanaRack, katanaBlade);
  } else if (castleIdx === 6) {
    // #6 Segovia Alcázar: Twin Golden Thrones of Isabella & Ferdinand under Mudéjar Honeycomb Gold Canopy
    const throneDais = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.2, 1.05), royalCrimsonMat);
    throneDais.position.set(-1.15, 0.15, -0.85);
    for (const tx of [-1.42, -0.88]) {
      const throne = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.78, 0.36), goldMat);
      throne.position.set(tx, 0.58, -0.95);
      floor1Group.add(throne);
    }
    const mudejarDome = new THREE.Mesh(new THREE.OctahedronGeometry(0.52, 0), goldMat);
    mudejarDome.scale.set(1.35, 0.42, 1.1);
    mudejarDome.position.set(-1.15, 1.52, -0.85);
    floor1Group.add(throneDais, mudejarDome);
  } else if (castleIdx === 7) {
    // #7 Eilean Donan Castle: Highland Clan Claymore Broadsword Vitrine & Single-Malt Scotch Whisky Oak Casks
    for (const cz of [-1.15, -0.65]) {
      const cask = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.54, 10), woodMat);
      cask.rotation.z = Math.PI / 2;
      cask.position.set(-1.15, 0.32, cz);
      floor1Group.add(cask);
    }
    const claymoreStand = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.44, 0.42), darkWoodMat);
    claymoreStand.position.set(-1.15, 0.28, 0.25);
    const claymoreSword = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.08, 0.05), armorSteelMat);
    claymoreSword.position.set(-1.15, 0.58, 0.25);
    floor1Group.add(claymoreStand, claymoreSword);
  } else if (castleIdx === 8) {
    // #8 Prague Castle: Golden Astronomical Clock Zodiac Dial & Emperor Rudolph II's Alchemical Furnace
    const astroPed = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.45, 0.48, 12), darkWoodMat);
    astroPed.position.set(-1.15, 0.3, 0.22);
    const zodiacWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.08, 16), goldMat);
    zodiacWheel.rotation.x = Math.PI / 3;
    zodiacWheel.position.set(-1.15, 0.78, 0.22);
    const alchemFurnace = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.72, 10), royalCrimsonMat);
    alchemFurnace.position.set(-1.15, 0.42, -1.05);
    const alembicFlask = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 10), glassMat);
    alembicFlask.position.set(-1.15, 0.92, -1.05);
    floor1Group.add(astroPed, zodiacWheel, alchemFurnace, alembicFlask);
  } else if (castleIdx === 9) {
    // #9 Windsor Castle: Sovereign's Order of the Garter Canopy Throne & Golden State Coronation Coach
    const garterDais = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.2, 0.98), royalBlueMat);
    garterDais.position.set(-1.15, 0.15, -0.95);
    const sovereignThrone = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.88, 0.44), goldMat);
    sovereignThrone.position.set(-1.15, 0.65, -1.05);
    const coachPlinth = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.32, 0.52), marbleMat);
    coachPlinth.position.set(-1.15, 0.22, 0.32);
    const goldStateCoach = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.32, 0.36), goldMat);
    goldStateCoach.position.set(-1.15, 0.55, 0.32);
    floor1Group.add(garterDais, sovereignThrone, coachPlinth, goldStateCoach);
  } else {
    // #10 Pena Palace Sintra: Blue-and-White Azulejo Tile Fountain Basin & Portuguese Caravel Ship Model
    const azulejoFountain = new THREE.Mesh(
      new THREE.CylinderGeometry(0.58, 0.64, 0.26, 8),
      createLowPolyMat(0x0284c7)
    );
    azulejoFountain.position.set(-1.15, 0.19, 0.25);
    const fountainWater = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.28, 8), waterMat);
    fountainWater.position.set(-1.15, 0.2, 0.25);
    const caravelHull = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.24, 0.26), darkWoodMat);
    caravelHull.position.set(-1.15, 0.45, -0.95);
    const caravelSail = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.48, 0.04), marbleMat);
    caravelSail.position.set(-1.15, 0.82, -0.95);
    floor1Group.add(azulejoFountain, fountainWater, caravelHull, caravelSail);
  }

  // --- 1F RIGHT WING: CASTLE STATE BANQUET HALL & MONUMENTAL HOODED STONE FIREPLACE ---
  // Monumental Castle Hooded Stone Fireplace with Roaring Hearth & Coat of Arms Crest
  const hearthBase = new THREE.Mesh(new THREE.BoxGeometry(1.28, 1.05, 0.42), darkStoneMat);
  hearthBase.position.set(1.35, 0.58, -1.78);
  const hearthHood = new THREE.Mesh(new THREE.ConeGeometry(0.78, 0.85, 4), stoneWallMat);
  hearthHood.rotation.y = Math.PI / 4;
  hearthHood.scale.set(1.15, 1, 0.48);
  hearthHood.position.set(1.35, 1.45, -1.78);
  const fireGlow = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.42, 7), glowMat);
  fireGlow.position.set(1.35, 0.32, -1.62);
  const royalCrest = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), goldMat);
  royalCrest.position.set(1.35, 1.42, -1.55);
  floor1Group.add(hearthBase, hearthHood, fireGlow, royalCrest);

  // Long Royal State Banquet Table with Crimson Runner, Golden Goblets, Candelabras & 8 High-Back Throne Chairs
  const banquetTable = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.08, 2.35), darkWoodMat);
  banquetTable.position.set(1.35, 0.46, 0.28);
  const tableRunner = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.09, 2.25), royalCrimsonMat);
  tableRunner.position.set(1.35, 0.465, 0.28);
  floor1Group.add(banquetTable, tableRunner);

  for (const bz of [-0.65, -0.05, 0.55, 1.15]) {
    const candelabra = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, 0.24, 8), goldMat);
    candelabra.position.set(1.35, 0.62, bz);
    const candleFlame = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), glowMat);
    candleFlame.position.set(1.35, 0.76, bz);
    floor1Group.add(candelabra, candleFlame);

    for (const side of [-1, 1]) {
      const chairX = 1.35 + side * 0.82;
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.26, 0.28), darkWoodMat);
      seat.position.set(chairX, 0.2, bz);
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.68, 0.28), royalCrimsonMat);
      back.position.set(chairX + side * 0.11, 0.45, bz);
      const goldFinial = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), goldMat);
      goldFinial.position.set(chairX + side * 0.11, 0.82, bz);
      floor1Group.add(seat, back, goldFinial);
    }
  }

  root.add(floor1Group);

  // ==========================================================================
  // FLOOR 2 GROUP: MONARCH'S ROYAL CANOPY BEDCHAMBER (LEFT) & CASTLE TREASURY / LIBRARY (RIGHT)
  // ==========================================================================
  const floor2Group = new THREE.Group();
  floor2Group.userData.floorLevel = 2;

  const floorSlab2F = new THREE.Mesh(new THREE.BoxGeometry(5.32, 0.12, 3.25), floorStoneMat);
  floorSlab2F.position.set(0, 1.92, -0.52);
  const galleryRail = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.28, 0.08), goldMat);
  galleryRail.position.set(0, 2.12, 1.06);
  const backWall2F = new THREE.Mesh(new THREE.BoxGeometry(5.36, 1.72, 0.2), stoneWallMat);
  backWall2F.position.set(0, 2.82, -2.08);
  const leftWall2F = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.72, 3.35), stoneWallMat);
  leftWall2F.position.set(-2.58, 2.82, -0.48);
  const partWall2F = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.72, 2.65), darkStoneMat);
  partWall2F.position.set(0, 2.82, -0.78);
  floor2Group.add(floorSlab2F, galleryRail, backWall2F, leftWall2F, partWall2F);

  // 2F Left: Monarch's Carved Four-Poster Royal Canopy Bed with Velvet Drapes & Crown Crest
  const bedDais = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.12, 1.58), goldMat);
  bedDais.position.set(-1.35, 2.04, -1.12);
  const mattress = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.24, 1.35), marbleMat);
  mattress.position.set(-1.35, 2.22, -1.12);
  const velvetBlanket = new THREE.Mesh(
    new THREE.BoxGeometry(1.24, 0.25, 0.92),
    castleIdx % 2 === 0 ? royalBlueMat : royalCrimsonMat
  );
  velvetBlanket.position.set(-1.35, 2.23, -0.92);
  const headboard = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.95, 0.12), goldMat);
  headboard.position.set(-1.35, 2.52, -1.78);
  const canopyTop = new THREE.Mesh(
    new THREE.BoxGeometry(1.32, 0.14, 1.42),
    castleIdx % 2 === 0 ? royalBlueMat : royalCrimsonMat
  );
  canopyTop.position.set(-1.35, 3.18, -1.12);
  floor2Group.add(bedDais, mattress, velvetBlanket, headboard, canopyTop);

  for (const [px, pz] of [
    [-1.92, -1.75],
    [-0.78, -1.75],
    [-1.92, -0.48],
    [-0.78, -0.48],
  ]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.12, 8), goldMat);
    post.position.set(px, 2.62, pz);
    floor2Group.add(post);
  }

  // 2F Right: Royal Castle Archive Bookshelves, Ancient Globe, Treasure Chest & Astronomical Telescope
  for (const bx of [0.68, 1.88]) {
    const bookcase = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.42, 0.28), darkWoodMat);
    bookcase.position.set(bx, 2.68, -1.82);
    floor2Group.add(bookcase);
    for (const sy of [2.32, 2.68, 3.04]) {
      const books = new THREE.Mesh(
        new THREE.BoxGeometry(0.82, 0.22, 0.22),
        sy > 2.8 ? goldMat : royalCrimsonMat
      );
      books.position.set(bx, sy, -1.78);
      floor2Group.add(books);
    }
  }

  // Gilded Royal Treasure Chest & Brass Telescope on 2F Balcony Overlook
  const treasureChest = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.36, 0.42), darkWoodMat);
  treasureChest.position.set(0.85, 2.16, -0.65);
  const chestGoldTrim = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.12, 0.44), goldMat);
  chestGoldTrim.position.set(0.85, 2.32, -0.65);

  const telescopeTripod = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.58, 6), darkWoodMat);
  telescopeTripod.position.set(1.75, 2.26, 0.35);
  const telescopeTube = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.065, 0.68, 10), goldMat);
  telescopeTube.rotation.x = Math.PI / 3;
  telescopeTube.position.set(1.75, 2.62, 0.35);
  floor2Group.add(treasureChest, chestGoldTrim, telescopeTripod, telescopeTube);

  root.add(floor2Group);

  // ==========================================================================
  // FLOOR 3 GROUP (ROOF BEAMS & CASTLE CROWN CORNICE — HIDDEN IN 1F/2F CUTAWAY)
  // ==========================================================================
  const roofGroup = new THREE.Group();
  roofGroup.userData.floorLevel = 3;
  roofGroup.userData.isRoof = true;

  const topCorniceBack = new THREE.Mesh(new THREE.BoxGeometry(5.48, 0.18, 0.28), darkStoneMat);
  topCorniceBack.position.set(0, 3.74, -2.08);
  const topCorniceLeft = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.18, 3.45), darkStoneMat);
  topCorniceLeft.position.set(-2.58, 3.74, -0.48);
  roofGroup.add(topCorniceBack, topCorniceLeft);

  for (const rx of [-1.85, -0.65, 0.65, 1.85]) {
    const trussBeam = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 3.25), darkWoodMat);
    trussBeam.position.set(rx, 3.68, -0.52);
    roofGroup.add(trussBeam);
  }
  root.add(roofGroup);

  addShadows(root);
  return root;
}
