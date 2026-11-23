import * as THREE from 'three';
import { IslandMetadata, IslandVariant } from '../../types/island';
import { createLowPolyMat, createGlassMat, createWaterMat, createTree } from './materials';

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
// SHARED HIGH-DETAIL ARCHITECTURAL & FURNITURE MICRO-COMPONENT BUILDERS
// ============================================================================

/** Multi-tier ornate crystal & brass chandelier with 8 glowing candles and central crystal drop */
function createDetailedChandelier(
  goldMat: THREE.Material,
  glowMat: THREE.Material,
  glassMat: THREE.Material,
  radius = 0.34
): THREE.Group {
  const g = new THREE.Group();
  const ceilingRose = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.04, 10), goldMat);
  ceilingRose.position.y = -0.02;
  const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.36, 6), goldMat);
  chain.position.y = -0.18;

  const upperTier = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.62, 0.016, 6, 12), goldMat);
  upperTier.rotation.x = Math.PI / 2;
  upperTier.position.y = -0.25;

  const mainTier = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.022, 8, 16), goldMat);
  mainTier.rotation.x = Math.PI / 2;
  mainTier.position.y = -0.36;

  const crystalDrop = new THREE.Mesh(new THREE.OctahedronGeometry(0.065, 0), glassMat);
  crystalDrop.position.y = -0.44;
  g.add(ceilingRose, chain, upperTier, mainTier, crystalDrop);

  const count = 8;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const cx = Math.cos(a) * radius;
    const cz = Math.sin(a) * radius;
    const holder = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.015, 0.03, 6), goldMat);
    holder.position.set(cx, -0.34, cz);
    const wax = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.06, 6), createLowPolyMat(0xfffdf7));
    wax.position.set(cx, -0.3, cz);
    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 6), glowMat);
    flame.scale.set(0.8, 1.35, 0.8);
    flame.position.set(cx, -0.25, cz);
    g.add(holder, wax, flame);
  }
  return g;
}

/** Framed mullioned window with sill, pediment header, and silk interior/exterior depth */
function createMullionedWindow(
  w: number,
  h: number,
  frameMat: THREE.Material,
  paneMat: THREE.Material
): THREE.Group {
  const wg = new THREE.Group();
  const outerFrame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.06, h + 0.06, 0.05), frameMat);
  const pane = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.065), paneMat);
  const vBar = new THREE.Mesh(new THREE.BoxGeometry(0.022, h, 0.075), frameMat);
  const hBar = new THREE.Mesh(new THREE.BoxGeometry(w, 0.022, 0.075), frameMat);
  const sill = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, 0.035, 0.09), frameMat);
  sill.position.y = -h / 2 - 0.02;
  const header = new THREE.Mesh(new THREE.BoxGeometry(w + 0.09, 0.045, 0.08), frameMat);
  header.position.y = h / 2 + 0.025;
  wg.add(outerFrame, pane, vBar, hBar, sill, header);
  return wg;
}

/** Miniature Concert Grand Piano with open lid, prop stick, 88-key keyboard, pedals & tufted bench */
function createConcertGrandPiano(
  bodyMat: THREE.Material,
  goldMat: THREE.Material,
  seatMat: THREE.Material
): THREE.Group {
  const pg = new THREE.Group();
  const whiteKeyMat = createLowPolyMat(0xfafaf9, { roughness: 0.3 });
  const blackKeyMat = createLowPolyMat(0x18181b, { roughness: 0.4 });

  // Soundboard & curved tail
  const soundboard = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.16, 0.56), bodyMat);
  soundboard.position.set(0, 0.38, 0.06);
  const tailCurve = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.16, 12), bodyMat);
  tailCurve.position.set(0, 0.38, -0.22);
  const brassPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.165, 10), goldMat);
  brassPlate.position.set(0, 0.385, -0.18);

  // Keyboard bed + white & black keys + music stand
  const keyBed = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.07, 0.18), bodyMat);
  keyBed.position.set(0, 0.34, 0.38);
  const whiteKeys = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.025, 0.11), whiteKeyMat);
  whiteKeys.position.set(0, 0.38, 0.4);
  const blackKeys = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.032, 0.06), blackKeyMat);
  blackKeys.position.set(0, 0.39, 0.37);
  const musicDesk = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.12, 0.015), goldMat);
  musicDesk.rotation.x = -0.25;
  musicDesk.position.set(0, 0.48, 0.31);

  // Propped-open piano lid + brass prop stick
  const openLid = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.022, 0.72), bodyMat);
  openLid.position.set(-0.08, 0.58, -0.04);
  openLid.rotation.z = -0.42;
  const propStick = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.28, 6), goldMat);
  propStick.position.set(0.22, 0.52, 0.05);
  propStick.rotation.z = 0.25;

  // 3 Turned Legs + Pedal Lyre
  for (const [lx, lz] of [
    [-0.28, 0.32],
    [0.28, 0.32],
    [0, -0.44],
  ]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.018, 0.32, 6), bodyMat);
    leg.position.set(lx, 0.16, lz);
    const caster = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 6), goldMat);
    caster.position.set(lx, 0.02, lz);
    pg.add(leg, caster);
  }
  const pedalLyre = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.28, 0.03), goldMat);
  pedalLyre.position.set(0, 0.15, 0.26);

  // Tufted Piano Bench
  const benchTop = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 0.2), seatMat);
  benchTop.position.set(0, 0.23, 0.62);
  for (const bx of [-0.17, 0.17]) {
    const bLeg = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.2, 0.16), bodyMat);
    bLeg.position.set(bx, 0.1, 0.62);
    pg.add(bLeg);
  }

  pg.add(
    soundboard,
    tailCurve,
    brassPlate,
    keyBed,
    whiteKeys,
    blackKeys,
    musicDesk,
    openLid,
    propStick,
    pedalLyre,
    benchTop
  );
  return pg;
}

/** Complete Formal Banquet Table with 6 Place Settings (Plates, Goblets, Candelabra & High-Back Chairs) */
function createBanquetDiningSet(
  woodMat: THREE.Material,
  clothMat: THREE.Material,
  chairMat: THREE.Material,
  goldMat: THREE.Material,
  glowMat: THREE.Material,
  glassMat: THREE.Material
): THREE.Group {
  const dg = new THREE.Group();
  const plateMat = createLowPolyMat(0xffffff, { roughness: 0.25 });

  // Table top + carved apron + 4 turned legs
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.055, 0.76), woodMat);
  top.position.y = 0.42;
  const runner = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.06, 0.28), clothMat);
  runner.position.y = 0.422;
  dg.add(top, runner);

  for (const [lx, lz] of [
    [-0.68, -0.3],
    [0.68, -0.3],
    [-0.68, 0.3],
    [0.68, 0.3],
  ]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.024, 0.4, 8), woodMat);
    leg.position.set(lx, 0.2, lz);
    dg.add(leg);
  }

  // 3-Branch Candelabra Centerpiece + Floral Compote
  const candBase = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.07, 0.18, 8), goldMat);
  candBase.position.set(0, 0.53, 0);
  const candBar = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.02, 0.02), goldMat);
  candBar.position.set(0, 0.6, 0);
  dg.add(candBase, candBar);
  for (const cx of [-0.1, 0, 0.1]) {
    const taper = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.08, 6), plateMat);
    taper.position.set(cx, 0.65, 0);
    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), glowMat);
    flame.position.set(cx, 0.7, 0);
    dg.add(taper, flame);
  }

  // 6 Individual Place Settings (Gold Charger + Porcelain Plate + Wine Goblet) & 6 High-Back Chairs
  for (const px of [-0.48, 0, 0.48]) {
    for (const side of [-1, 1]) {
      const pz = side * 0.23;
      const charger = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.012, 10), goldMat);
      charger.position.set(px, 0.455, pz);
      const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.016, 10), plateMat);
      plate.position.set(px, 0.462, pz);
      const goblet = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.014, 0.065, 6), glassMat);
      goblet.position.set(px + 0.1, 0.48, pz - side * 0.05);
      dg.add(charger, plate, goblet);

      // Chair
      const cz = side * 0.52;
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.045, 0.26), chairMat);
      seat.position.set(px, 0.25, cz);
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.34, 0.04), chairMat);
      back.position.set(px, 0.42, cz + side * 0.11);
      const crest = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.035, 0.045), goldMat);
      crest.position.set(px, 0.59, cz + side * 0.11);
      for (const [clx, clz] of [
        [-0.1, -0.1],
        [0.1, -0.1],
        [-0.1, 0.1],
        [0.1, 0.1],
      ]) {
        const cLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.012, 0.24, 6), woodMat);
        cLeg.position.set(px + clx, 0.12, cz + clz);
        dg.add(cLeg);
      }
      dg.add(seat, back, crest);
    }
  }
  return dg;
}

/** Framed Wall Painting with Multi-Layer Gold Moulding, Canvas & Brass Picture Light */
function createFramedPainting(
  w: number,
  h: number,
  goldMat: THREE.Material,
  artMat: THREE.Material,
  glowMat: THREE.Material
): THREE.Group {
  const pg = new THREE.Group();
  const outer = new THREE.Mesh(new THREE.BoxGeometry(w + 0.08, h + 0.08, 0.04), goldMat);
  const canvas = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.05), artMat);
  const picLight = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, w * 0.55, 6), glowMat);
  picLight.rotation.z = Math.PI / 2;
  picLight.position.set(0, h / 2 + 0.07, 0.04);
  pg.add(outer, canvas, picLight);
  return pg;
}

// ============================================================================
// PART 1: 20 LUXURY RESIDENCES, CASTLES & EXQUISITE BOUTIQUE VILLAS (BD-121 to BD-140)
// Enhanced with Cornices, Mullioned Windows, Porticos, Chimneys, Balustrades & Grounds
// ============================================================================
export function buildLuxuryResidenceBuilding(
  island: IslandMetadata,
  variant: IslandVariant = 'classic'
): THREE.Group {
  const g = new THREE.Group();
  const bdNum = parseInt(island.id.replace('BD-', ''), 10) || 121;
  const idx = Math.max(1, Math.min(30, bdNum - 120)); // 1..20 (Luxury Estates) + 21..30 (10 World-Famous Castles BD-141..150)

  const pHex = hexToInt(island.palette[0]?.hex, 0xe5cfa8);
  const sHex = hexToInt(island.palette[1]?.hex, 0x3b495e);
  const aHex = hexToInt(island.palette[2]?.hex, 0x0ea5e9);

  const primaryMat = createLowPolyMat(pHex, { roughness: 0.62 });
  const secondaryMat = createLowPolyMat(sHex, { roughness: 0.55 });
  const accentMat = createLowPolyMat(aHex, { roughness: 0.42 });
  const stonePlinthMat = createLowPolyMat(0xe7e2d8, { roughness: 0.8 });
  const trimStoneMat = createLowPolyMat(0xf5f0e6, { roughness: 0.68 });
  const lawnMat = createLowPolyMat(0x528250, { roughness: 0.86 });
  const hedgeMat = createLowPolyMat(0x2d5a36, { roughness: 0.88 });
  const woodMat = createLowPolyMat(0x6e472b, { roughness: 0.75 });
  const darkSlateMat = createLowPolyMat(0x27303f, { roughness: 0.62 });
  const whiteMat = createLowPolyMat(0xfaf8f5, { roughness: 0.58 });
  const goldMat = createLowPolyMat(0xd4af37, { metalness: 0.58, roughness: 0.28 });
  const glowMat = createLowPolyMat(variant === 'fantasy' ? 0xffd166 : 0xfff3b0, {
    emissive: 0xf59e0b,
    roughness: 0.32,
  });
  const glassMat = createGlassMat(0xbae6fd, 0.72);
  const waterMat = createWaterMat(0x2ec4b6);

  // Two-Tier Beveled Architectural Estate Plinth Base + Perimeter Stone Balustrade Lip
  const lowerPlinth = new THREE.Mesh(new THREE.BoxGeometry(5.75, 0.16, 4.95), stonePlinthMat);
  lowerPlinth.position.y = 0.08;
  const upperPlinth = new THREE.Mesh(new THREE.BoxGeometry(5.55, 0.14, 4.75), trimStoneMat);
  upperPlinth.position.y = 0.21;
  const lawn = new THREE.Mesh(new THREE.BoxGeometry(5.35, 0.07, 4.55), lawnMat);
  lawn.position.y = 0.28;
  g.add(lowerPlinth, upperPlinth, lawn);

  // Corner Estate Bollard Lamps on Plinth
  for (const [bx, bz] of [
    [-2.58, 2.18],
    [2.58, 2.18],
    [-2.58, -2.18],
    [2.58, -2.18],
  ]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.28, 0.14), trimStoneMat);
    post.position.set(bx, 0.42, bz);
    const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), glowMat);
    lantern.position.set(bx, 0.6, bz);
    g.add(post, lantern);
  }

  switch (idx) {
    case 1: {
      // BD-121: Downton Abbey (Highclere Jacobethan Manor) — Ultra-Detailed
      // Royal Gravel Carriage Sweep + Boxwood Parterre Borders + 3-Tier Victorian Fountain
      const gravel = new THREE.Mesh(
        new THREE.BoxGeometry(4.6, 0.035, 1.55),
        createLowPolyMat(0xd6c7b2, { roughness: 0.9 })
      );
      gravel.position.set(0, 0.32, 1.25);
      g.add(gravel);

      // Symmetrical Boxwood Parterre Hedge Mazes flanking the forecourt
      for (const hx of [-1.75, 1.75]) {
        const hedgeOuter = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.16, 0.95), hedgeMat);
        hedgeOuter.position.set(hx, 0.39, 1.25);
        const hedgeInner = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.18, 0.6), lawnMat);
        hedgeInner.position.set(hx, 0.4, 1.25);
        const topiaryCone = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.45, 8), hedgeMat);
        topiaryCone.position.set(hx, 0.62, 1.25);
        g.add(hedgeOuter, hedgeInner, topiaryCone);
      }

      // 3-Tier Victorian Forecourt Fountain
      const fBasin1 = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.56, 0.14, 14), trimStoneMat);
      fBasin1.position.set(0, 0.38, 1.32);
      const fWater1 = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.15, 14), waterMat);
      fWater1.position.set(0, 0.39, 1.32);
      const fCol = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.42, 8), trimStoneMat);
      fCol.position.set(0, 0.56, 1.32);
      const fBasin2 = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.12, 0.1, 12), trimStoneMat);
      fBasin2.position.set(0, 0.72, 1.32);
      const fSpire = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.24, 8), waterMat);
      fSpire.position.set(0, 0.88, 1.32);
      g.add(fBasin1, fWater1, fCol, fBasin2, fSpire);

      // Vintage 1920s Aristocratic Touring Motorcar parked on Carriage Sweep
      const carBody = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.16, 0.24), createLowPolyMat(0x4a151b));
      carBody.position.set(-0.92, 0.42, 1.25);
      const carCab = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.22), darkSlateMat);
      carCab.position.set(-1.0, 0.54, 1.25);
      const radiator = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.15, 0.18), goldMat);
      radiator.position.set(-0.65, 0.42, 1.25);
      g.add(carBody, carCab, radiator);

      // Main 3-Story Jacobethan Bath-Stone Corps de Logis + Horizontal Stringcourses
      const mainBlock = new THREE.Mesh(new THREE.BoxGeometry(3.85, 1.62, 2.15), primaryMat);
      mainBlock.position.set(0, 1.12, -0.35);
      const belt1 = new THREE.Mesh(new THREE.BoxGeometry(3.92, 0.05, 2.22), trimStoneMat);
      belt1.position.set(0, 0.92, -0.35);
      const belt2 = new THREE.Mesh(new THREE.BoxGeometry(3.92, 0.05, 2.22), trimStoneMat);
      belt2.position.set(0, 1.48, -0.35);
      const parapet = new THREE.Mesh(new THREE.BoxGeometry(3.94, 0.14, 2.24), secondaryMat);
      parapet.position.set(0, 1.98, -0.35);
      g.add(mainBlock, belt1, belt2, parapet);

      // Crenellated Battlements along the roofline
      for (let cx = -1.8; cx <= 1.8; cx += 0.3) {
        for (const cz of [-1.42, 0.72]) {
          const merlon = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.08), trimStoneMat);
          merlon.position.set(cx, 2.09, cz);
          g.add(merlon);
        }
      }

      // Entrance Portico with 4 Columns & Balustraded Porch
      const portico = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.78, 0.45), trimStoneMat);
      portico.position.set(0, 0.7, 0.85);
      const oakDoor = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.56, 0.08), woodMat);
      oakDoor.position.set(0, 0.6, 1.06);
      g.add(portico, oakDoor);

      // 4 Corner Turrets with Quoining, Lancet Windows & 4 Mini Corner Finials + Central Spire
      const turretCoords = [
        [-1.88, -1.38],
        [1.88, -1.38],
        [-1.88, 0.68],
        [1.88, 0.68],
      ];
      turretCoords.forEach(([tx, tz]) => {
        const turret = new THREE.Mesh(new THREE.BoxGeometry(0.62, 2.15, 0.62), primaryMat);
        turret.position.set(tx, 1.38, tz);
        const turretTrim = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.06, 0.66), trimStoneMat);
        turretTrim.position.set(tx, 2.1, tz);
        const cap = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.55, 4), secondaryMat);
        cap.rotation.y = Math.PI / 4;
        cap.position.set(tx, 2.72, tz);
        const finial = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.03, 0.25, 6), goldMat);
        finial.position.set(tx, 3.08, tz);
        g.add(turret, turretTrim, cap, finial);
      });

      // Soaring Victoria Central Tower with Gothic Tracery Windows & 4 Tall Corner Pinnacles
      const centralTower = new THREE.Mesh(new THREE.BoxGeometry(1.12, 2.85, 1.12), primaryMat);
      centralTower.position.set(0, 1.72, -0.45);
      const towerBelt = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.06, 1.18), trimStoneMat);
      towerBelt.position.set(0, 2.52, -0.45);
      const towerWin = createMullionedWindow(0.42, 0.68, trimStoneMat, glowMat);
      towerWin.position.set(0, 2.65, 0.12);
      g.add(centralTower, towerBelt, towerWin);

      for (const [px, pz] of [
        [-0.46, -0.46],
        [0.46, -0.46],
        [-0.46, 0.46],
        [0.46, 0.46],
      ]) {
        const pinBase = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.35, 0.22), trimStoneMat);
        pinBase.position.set(px, 3.28, -0.45 + pz);
        const pinSpire = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.58, 4), goldMat);
        pinSpire.rotation.y = Math.PI / 4;
        pinSpire.position.set(px, 3.74, -0.45 + pz);
        g.add(pinBase, pinSpire);
      }

      // Mullioned Windows across 1F & 2F Front & Side Facades
      for (const wx of [-1.28, -0.68, 0.68, 1.28]) {
        for (const wy of [0.72, 1.28, 1.72]) {
          const mw = createMullionedWindow(0.28, 0.36, trimStoneMat, glowMat);
          mw.position.set(wx, wy, 0.74);
          g.add(mw);
        }
      }

      const t1 = createTree('pine', [-2.25, 0.3, 1.45], 0.88);
      const t2 = createTree('pine', [2.25, 0.3, 1.45], 0.88);
      g.add(t1, t2);
      break;
    }

    case 2: {
      // BD-122: Swan Lake Alpine Fairy-Tale Castle (Neuschwanstein) — Ultra-Detailed
      // Emerald Swan Lake + Waterfall Gorge + Stone Arch Bridge
      const lake = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.85, 0.14, 18), waterMat);
      lake.scale.set(1.38, 1, 0.72);
      lake.position.set(0, 0.31, 1.25);
      const bridgeArch = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.14, 0.34), trimStoneMat);
      bridgeArch.position.set(-1.35, 0.85, 0.55);
      g.add(lake, bridgeArch);

      // 3 Sculpted White Swans with Golden Crowns + Royal Swan Boat on the Lake
      for (const [sx, sz, rot] of [
        [-0.65, 1.25, 0.3],
        [0.15, 1.42, -0.4],
        [0.85, 1.18, 0.6],
      ]) {
        const swanGroup = new THREE.Group();
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), whiteMat);
        body.scale.set(1.45, 0.82, 0.92);
        const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.03), whiteMat);
        wingL.position.set(-0.02, 0.04, 0.07);
        const wingR = wingL.clone();
        wingR.position.z = -0.07;
        const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.032, 0.2, 6), whiteMat);
        neck.position.set(0.11, 0.12, 0);
        neck.rotation.z = -0.25;
        const beak = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.06, 5), goldMat);
        beak.rotation.z = -Math.PI / 2;
        beak.position.set(0.17, 0.2, 0);
        swanGroup.add(body, wingL, wingR, neck, beak);
        swanGroup.position.set(sx, 0.4, sz);
        swanGroup.rotation.y = rot;
        g.add(swanGroup);
      }

      // Multi-Tiered Alpine Dolomite Cliff Crag
      const crag1 = new THREE.Mesh(
        new THREE.ConeGeometry(2.45, 1.25, 8),
        createLowPolyMat(0x8d99ae, { roughness: 0.9 })
      );
      crag1.scale.set(1.22, 0.68, 0.85);
      crag1.position.set(0, 0.68, -0.45);
      const waterfall = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.75, 0.12), waterMat);
      waterfall.rotation.x = -0.35;
      waterfall.position.set(0, 0.62, 0.42);
      g.add(crag1, waterfall);

      // Stepped Red-Brick Gatehouse with Twin Crow-Stepped Gables & Turretlets
      const gatehouse = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.98, 0.78), accentMat);
      gatehouse.position.set(0, 1.18, 0.44);
      const gateArch = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.52, 0.82), darkSlateMat);
      gateArch.position.set(0, 0.96, 0.44);
      const gateRoof = new THREE.Mesh(new THREE.ConeGeometry(1.05, 0.52, 4), secondaryMat);
      gateRoof.rotation.y = Math.PI / 4;
      gateRoof.scale.set(1.25, 1, 0.75);
      gateRoof.position.set(0, 1.92, 0.44);
      g.add(gatehouse, gateArch, gateRoof);

      // Main Ivory Romanesque Palas (Throne Hall & Singers Hall) with 3 Rows of Arched Windows & Balconies
      const palas = new THREE.Mesh(new THREE.BoxGeometry(2.92, 1.85, 1.42), primaryMat);
      palas.position.set(0, 1.72, -0.58);
      const palasRoof = new THREE.Mesh(new THREE.ConeGeometry(1.95, 0.92, 4), secondaryMat);
      palasRoof.rotation.y = Math.PI / 4;
      palasRoof.scale.set(1.25, 1, 0.75);
      palasRoof.position.set(0, 3.05, -0.58);
      const gildedBalcony = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.12, 0.28), goldMat);
      gildedBalcony.position.set(0, 1.85, 0.18);
      g.add(palas, palasRoof, gildedBalcony);

      for (let wx = -1.05; wx <= 1.05; wx += 0.42) {
        for (const wy of [1.25, 1.72, 2.2]) {
          const rWin = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.28, 0.06), glowMat);
          rWin.position.set(wx, wy, 0.14);
          g.add(rWin);
        }
      }

      // 4 Soaring Cylindrical Ivory Watchtowers with Bartizan Rings, Cobalt Cones & Golden Weathervanes
      const towerSpecs = [
        { x: -1.62, z: -0.58, r: 0.38, h: 3.05, coneH: 1.12 },
        { x: 1.62, z: -0.48, r: 0.34, h: 2.75, coneH: 0.98 },
        { x: 0, z: -1.22, r: 0.4, h: 3.48, coneH: 1.25 },
        { x: -0.88, z: 0.35, r: 0.24, h: 2.25, coneH: 0.78 },
      ];
      towerSpecs.forEach((t) => {
        const cyl = new THREE.Mesh(new THREE.CylinderGeometry(t.r, t.r * 1.06, t.h, 14), primaryMat);
        cyl.position.set(t.x, 0.8 + t.h / 2, t.z);
        const corbelRing = new THREE.Mesh(new THREE.CylinderGeometry(t.r * 1.18, t.r * 1.04, 0.14, 14), trimStoneMat);
        corbelRing.position.set(t.x, 0.8 + t.h - 0.08, t.z);
        const cone = new THREE.Mesh(new THREE.ConeGeometry(t.r * 1.3, t.coneH, 14), secondaryMat);
        cone.position.set(t.x, 0.8 + t.h + t.coneH / 2, t.z);
        const finial = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.04, 0.28, 6), goldMat);
        finial.position.set(t.x, 0.8 + t.h + t.coneH + 0.12, t.z);
        g.add(cyl, corbelRing, cone, finial);
      });
      break;
    }

    case 3: {
      // BD-123: Loire Valley Renaissance Water Château (Chenonceau) — Ultra-Detailed
      const river = new THREE.Mesh(new THREE.BoxGeometry(5.3, 0.12, 2.25), waterMat);
      river.position.set(0, 0.3, 0.15);
      g.add(river);

      // 5-Arch Gallery Bridge Wing with Cutwater Piers & Dormer Windows
      const gallery = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.22, 1.18), primaryMat);
      gallery.position.set(0.28, 1.28, 0.15);
      const galleryBelt = new THREE.Mesh(new THREE.BoxGeometry(3.88, 0.06, 1.24), trimStoneMat);
      galleryBelt.position.set(0.28, 0.92, 0.15);
      const galleryRoof = new THREE.Mesh(new THREE.ConeGeometry(2.35, 0.82, 4), secondaryMat);
      galleryRoof.rotation.y = Math.PI / 4;
      galleryRoof.scale.set(1.28, 1, 0.56);
      galleryRoof.position.set(0.28, 2.22, 0.15);
      g.add(gallery, galleryBelt, galleryRoof);

      for (let ax = -1.12; ax <= 1.68; ax += 0.7) {
        const pier = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.68, 1.32), primaryMat);
        pier.position.set(ax, 0.64, 0.15);
        const win = createMullionedWindow(0.26, 0.42, trimStoneMat, glowMat);
        win.position.set(ax, 1.32, 0.75);
        const dormer = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.32, 0.24), primaryMat);
        dormer.position.set(ax, 1.96, 0.55);
        g.add(pier, win, dormer);
      }

      // Main Keep with Conical Corner Tourelles & Parterre Garden
      const keep = new THREE.Mesh(new THREE.BoxGeometry(1.62, 1.72, 1.62), primaryMat);
      keep.position.set(-1.48, 1.18, -0.38);
      const keepRoof = new THREE.Mesh(new THREE.ConeGeometry(1.32, 0.95, 4), secondaryMat);
      keepRoof.rotation.y = Math.PI / 4;
      keepRoof.position.set(-1.48, 2.48, -0.38);
      g.add(keep, keepRoof);

      for (const [tx, tz] of [
        [-2.18, -1.08],
        [-2.18, 0.32],
        [-0.78, -1.08],
      ]) {
        const tourelle = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.92, 12), primaryMat);
        tourelle.position.set(tx, 1.28, tz);
        const tCone = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.85, 12), secondaryMat);
        tCone.position.set(tx, 2.62, tz);
        const tFinial = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), goldMat);
        tFinial.position.set(tx, 3.08, tz);
        g.add(tourelle, tCone, tFinial);
      }
      break;
    }

    case 4: {
      // BD-124: Lake Como Italian Neoclassical Waterfront Villa & Riva Boathouse
      const lakeApron = new THREE.Mesh(new THREE.BoxGeometry(5.3, 0.14, 1.72), waterMat);
      lakeApron.position.set(0, 0.3, 1.35);
      // Marble Lakeside Balustrade & Double Water Steps
      const lakeWall = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.18, 0.12), trimStoneMat);
      lakeWall.position.set(0, 0.42, 0.52);
      g.add(lakeApron, lakeWall);

      // Detailed Mahogany Riva Speedboat with White Leather Interior & Windshield at Private Pier
      const pier = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.12, 1.18), woodMat);
      pier.position.set(1.25, 0.39, 1.15);
      const boatHull = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.1, 8), woodMat);
      boatHull.rotation.x = Math.PI / 2;
      boatHull.scale.set(1, 1, 0.46);
      boatHull.position.set(1.88, 0.4, 1.35);
      const boatCockpit = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.08, 0.42), whiteMat);
      boatCockpit.position.set(1.88, 0.46, 1.35);
      const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.04), glassMat);
      windshield.rotation.x = -0.35;
      windshield.position.set(1.88, 0.52, 1.15);
      g.add(pier, boatHull, boatCockpit, windshield);

      // Ochre-Cream Neoclassical Villa with Double Loggia, Pediment & Terracotta Roof
      const villaBody = new THREE.Mesh(new THREE.BoxGeometry(3.35, 1.72, 1.88), primaryMat);
      villaBody.position.set(-0.2, 1.16, -0.45);
      const cornice = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.09, 2.02), trimStoneMat);
      cornice.position.set(-0.2, 2.02, -0.45);
      const pediment = new THREE.Mesh(new THREE.ConeGeometry(1.15, 0.48, 4), trimStoneMat);
      pediment.rotation.y = Math.PI / 4;
      pediment.scale.set(1.3, 1, 0.35);
      pediment.position.set(-0.2, 2.26, 0.42);
      const terracottaRoof = new THREE.Mesh(new THREE.ConeGeometry(2.42, 0.72, 4), secondaryMat);
      terracottaRoof.rotation.y = Math.PI / 4;
      terracottaRoof.scale.set(1.18, 1, 0.76);
      terracottaRoof.position.set(-0.2, 2.38, -0.45);
      g.add(villaBody, cornice, pediment, terracottaRoof);

      // Arched Loggia Columns & Upper Balcony
      for (let cx = -1.2; cx <= 0.8; cx += 0.5) {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 1.55, 8), whiteMat);
        col.position.set(cx, 1.08, 0.54);
        const win = createMullionedWindow(0.3, 0.45, trimStoneMat, glowMat);
        win.position.set(cx, 1.45, 0.5);
        g.add(col, win);
      }

      for (const cx of [-2.2, -1.88, 1.68, 2.08]) {
        const cyp = createTree('cypress', [cx, 0.32, -0.55], 0.92);
        g.add(cyp);
      }
      break;
    }

    case 5: {
      // BD-125: Cotswolds Honey-Stone Country Manor Villa & Victorian Glass Orangerie
      const manor = new THREE.Mesh(new THREE.BoxGeometry(2.72, 1.52, 1.82), primaryMat);
      manor.position.set(-0.55, 1.06, -0.35);
      g.add(manor);

      for (const gx of [-1.38, -0.55, 0.28]) {
        const gableWall = new THREE.Mesh(new THREE.ConeGeometry(0.68, 0.65, 4), primaryMat);
        gableWall.rotation.y = Math.PI / 4;
        gableWall.position.set(gx, 2.08, 0.25);
        const gableRoof = new THREE.Mesh(new THREE.ConeGeometry(0.84, 0.88, 4), secondaryMat);
        gableRoof.rotation.y = Math.PI / 4;
        gableRoof.position.set(gx, 2.2, -0.35);
        const mw = createMullionedWindow(0.34, 0.42, trimStoneMat, glowMat);
        mw.position.set(gx, 1.38, 0.57);
        const mw1 = createMullionedWindow(0.34, 0.46, trimStoneMat, glowMat);
        mw1.position.set(gx, 0.75, 0.57);
        g.add(gableWall, gableRoof, mw, mw1);
      }

      // Tall Tudor Chimney Stack with 3 Terracotta Chimney Pots
      const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.36, 1.25, 0.36), secondaryMat);
      chimney.position.set(-1.72, 2.18, -0.35);
      g.add(chimney);
      for (const pz of [-0.08, 0, 0.08]) {
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.18, 6), accentMat);
        pot.position.set(-1.72, 2.88, -0.35 + pz);
        g.add(pot);
      }

      // Victorian Wrought-Iron & Glass Orangerie Conservatory with Indoor Citrus Trees
      const orangerie = new THREE.Mesh(new THREE.BoxGeometry(1.52, 1.12, 1.42), glassMat);
      orangerie.position.set(1.45, 0.86, -0.25);
      const orangerieDome = new THREE.Mesh(new THREE.SphereGeometry(0.58, 12, 10), glassMat);
      orangerieDome.scale.set(1.12, 0.62, 1);
      orangerieDome.position.set(1.45, 1.48, -0.25);
      const indoorTree = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 0), hedgeMat);
      indoorTree.position.set(1.45, 0.85, -0.25);
      g.add(orangerie, orangerieDome, indoorTree);

      // Trout Stream + Arched Stone Footbridge + Rose Bushes
      const brook = new THREE.Mesh(new THREE.BoxGeometry(4.9, 0.09, 0.58), waterMat);
      brook.position.set(0, 0.3, 1.15);
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.18, 0.78), primaryMat);
      bridge.position.set(-0.45, 0.42, 1.15);
      g.add(brook, bridge);
      break;
    }

    case 6: {
      // BD-126: Kyoto Arashiyama Sukiya-zukuri Garden Villa — Ultra-Detailed
      const koiPond = new THREE.Mesh(new THREE.CylinderGeometry(1.72, 1.72, 0.12, 16), waterMat);
      koiPond.scale.set(1.38, 1, 0.74);
      koiPond.position.set(0.35, 0.3, 1.05);
      const redBridge = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.14, 0.44), accentMat);
      redBridge.position.set(0.35, 0.44, 1.05);
      const bridgeRailL = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.12, 0.04), accentMat);
      bridgeRailL.position.set(0.35, 0.54, 0.85);
      const bridgeRailR = bridgeRailL.clone();
      bridgeRailR.position.z = 1.25;
      g.add(koiPond, redBridge, bridgeRailL, bridgeRailR);

      // Hinoki Engawa Veranda on Timber Posts + Kumiko Shoji Screens + Curved Kawara Roofs
      const engawa = new THREE.Mesh(new THREE.BoxGeometry(3.52, 0.18, 2.22), primaryMat);
      engawa.position.set(-0.2, 0.44, -0.4);
      const shojiHall = new THREE.Mesh(new THREE.BoxGeometry(2.85, 1.28, 1.62), whiteMat);
      shojiHall.position.set(-0.2, 1.18, -0.45);
      for (let sx = -1.35; sx <= 0.95; sx += 0.46) {
        const shojiScreen = createMullionedWindow(0.38, 0.88, woodMat, glowMat);
        shojiScreen.position.set(sx, 1.08, 0.37);
        g.add(shojiScreen);
      }

      const roof1 = new THREE.Mesh(new THREE.ConeGeometry(2.38, 0.62, 4), secondaryMat);
      roof1.rotation.y = Math.PI / 4;
      roof1.scale.set(1.24, 1, 0.8);
      roof1.position.set(-0.2, 2.02, -0.45);
      const upperHall = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.76, 1.12), whiteMat);
      upperHall.position.set(-0.2, 2.42, -0.45);
      const roof2 = new THREE.Mesh(new THREE.ConeGeometry(1.62, 0.58, 4), secondaryMat);
      roof2.rotation.y = Math.PI / 4;
      roof2.scale.set(1.2, 1, 0.8);
      roof2.position.set(-0.2, 3.0, -0.45);
      g.add(engawa, shojiHall, roof1, upperHall, roof2);

      // Yukimi Toro Stone Lantern & Crimson Maples
      const lanternBase = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.38, 6), stonePlinthMat);
      lanternBase.position.set(-1.55, 0.48, 1.05);
      const lanternLight = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 6), glowMat);
      lanternLight.position.set(-1.55, 0.72, 1.05);
      const lanternCap = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.14, 6), secondaryMat);
      lanternCap.position.set(-1.55, 0.84, 1.05);
      g.add(lanternBase, lanternLight, lanternCap);

      const m1 = createTree('maple', [-2.05, 0.32, 0.95], 0.95);
      const m2 = createTree('maple', [1.98, 0.32, -0.55], 0.92);
      g.add(m1, m2);
      break;
    }

    case 7: {
      // BD-127: Malibu Cliffside Cantilevered Glass Infinity Villa — Ultra-Detailed
      const poolMain = new THREE.Mesh(new THREE.BoxGeometry(3.55, 0.24, 1.42), waterMat);
      poolMain.position.set(0.45, 0.38, 1.15);
      // Sunken Conversation Pit inside the Pool with Circular Fire Bowl & Sun Loungers
      const firePit = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.26, 14), primaryMat);
      firePit.position.set(-0.45, 0.4, 1.15);
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.34, 8), glowMat);
      flame.position.set(-0.45, 0.62, 1.15);
      g.add(poolMain, firePit, flame);

      for (const lx of [1.1, 1.55]) {
        const lounger = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.62), whiteMat);
        lounger.position.set(lx, 0.36, 0.22);
        g.add(lounger);
      }

      // 1F Glass & Concrete Volume with Interior Warm Glow & Teak Louvers
      const lowerSlab = new THREE.Mesh(new THREE.BoxGeometry(3.75, 0.16, 2.15), primaryMat);
      lowerSlab.position.set(-0.2, 0.38, -0.45);
      const lowerGlass = new THREE.Mesh(new THREE.BoxGeometry(3.25, 1.08, 1.82), glassMat);
      lowerGlass.position.set(-0.2, 1.0, -0.45);
      const interiorGlow1F = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.75, 1.2), glowMat);
      interiorGlow1F.position.set(-0.2, 0.92, -0.55);
      const midSlab = new THREE.Mesh(new THREE.BoxGeometry(4.05, 0.18, 2.38), primaryMat);
      midSlab.position.set(0, 1.62, -0.4);
      g.add(lowerSlab, lowerGlass, interiorGlow1F, midSlab);

      // 2F Cantilevered Master Glass Skybox + Architectural Teak Slatted Pergola
      const upperGlass = new THREE.Mesh(new THREE.BoxGeometry(2.75, 1.02, 1.72), glassMat);
      upperGlass.position.set(0.65, 2.22, -0.2);
      const teakRoof = new THREE.Mesh(new THREE.BoxGeometry(3.25, 0.16, 2.05), secondaryMat);
      teakRoof.position.set(0.65, 2.8, -0.2);
      const glassBalustrade = new THREE.Mesh(new THREE.BoxGeometry(3.95, 0.26, 0.05), glassMat);
      glassBalustrade.position.set(0, 1.82, 0.75);
      g.add(upperGlass, teakRoof, glassBalustrade);
      break;
    }

    case 8: {
      // BD-128: Zermatt Matterhorn Luxury Timber & Stone Ski Chalet — Ultra-Detailed
      const snow = new THREE.Mesh(new THREE.BoxGeometry(5.3, 0.09, 4.5), secondaryMat);
      snow.position.y = 0.28;
      g.add(snow);

      const chaletBody = new THREE.Mesh(new THREE.BoxGeometry(3.25, 1.55, 2.22), primaryMat);
      chaletBody.position.set(-0.2, 1.08, -0.35);
      const wrapBalcony = new THREE.Mesh(new THREE.BoxGeometry(3.65, 0.18, 2.55), woodMat);
      wrapBalcony.position.set(-0.2, 1.15, -0.25);
      const chaletWin = createMullionedWindow(1.65, 1.25, woodMat, glowMat);
      chaletWin.position.set(-0.2, 1.22, 0.78);

      const gableRoof = new THREE.Mesh(new THREE.ConeGeometry(2.58, 1.42, 4), secondaryMat);
      gableRoof.rotation.y = Math.PI / 4;
      gableRoof.scale.set(1.12, 1, 0.86);
      gableRoof.position.set(-0.2, 2.5, -0.35);

      const stoneChimney = new THREE.Mesh(
        new THREE.BoxGeometry(0.62, 3.1, 0.62),
        createLowPolyMat(0x64748b, { roughness: 0.9 })
      );
      stoneChimney.position.set(1.18, 1.82, 0.35);

      const hotTub = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.38, 14), primaryMat);
      hotTub.position.set(1.48, 0.5, 1.28);
      const tubWater = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.4, 14), waterMat);
      tubWater.position.set(1.48, 0.51, 1.28);
      g.add(chaletBody, wrapBalcony, chaletWin, gableRoof, stoneChimney, hotTub, tubWater);

      const p1 = createTree('pine', [-2.18, 0.32, -1.1], 0.92);
      const p2 = createTree('pine', [2.15, 0.32, -1.1], 0.85);
      g.add(p1, p2);
      break;
    }

    case 9: {
      // BD-129: Santorini Oia Cliffside Cave Pool Villa — Ultra-Detailed
      const step1 = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.58, 2.88), primaryMat);
      step1.position.set(0, 0.58, -0.4);
      const step2 = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.88, 1.92), primaryMat);
      step2.position.set(-0.35, 1.28, -0.75);
      g.add(step1, step2);

      for (const vx of [-0.98, 0.28]) {
        const vault = new THREE.Mesh(
          new THREE.CylinderGeometry(0.62, 0.62, 1.85, 14, 1, false, 0, Math.PI),
          primaryMat
        );
        vault.rotation.x = Math.PI / 2;
        vault.position.set(vx, 1.7, -0.75);
        const cavePortal = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.12, 12), glowMat);
        cavePortal.rotation.x = Math.PI / 2;
        cavePortal.position.set(vx, 1.35, 0.18);
        g.add(vault, cavePortal);
      }

      const domeDrum = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.48, 14), primaryMat);
      domeDrum.position.set(1.18, 1.38, -0.55);
      const blueDome = new THREE.Mesh(
        new THREE.SphereGeometry(0.57, 14, 12, 0, Math.PI * 2, 0, Math.PI / 2),
        secondaryMat
      );
      blueDome.position.set(1.18, 1.6, -0.55);
      const cross = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.25, 6), goldMat);
      cross.position.set(1.18, 2.25, -0.55);
      g.add(domeDrum, blueDome, cross);

      const plungePool = new THREE.Mesh(new THREE.BoxGeometry(2.75, 0.24, 1.22), waterMat);
      plungePool.position.set(0.35, 0.42, 1.15);
      const bougainvillea = new THREE.Mesh(new THREE.DodecahedronGeometry(0.52, 0), accentMat);
      bougainvillea.position.set(-1.58, 1.28, 0.55);
      g.add(plungePool, bougainvillea);
      break;
    }

    case 10: {
      // BD-130: Palm Springs Mid-Century Butterfly-Roof Desert Villa
      const desertSand = new THREE.Mesh(
        new THREE.BoxGeometry(5.3, 0.08, 4.5),
        createLowPolyMat(0xe9d8b4, { roughness: 0.92 })
      );
      desertSand.position.y = 0.28;
      const pool = new THREE.Mesh(new THREE.BoxGeometry(3.05, 0.16, 1.42), waterMat);
      pool.position.set(0.45, 0.36, 1.15);
      g.add(desertSand, pool);

      const pav = new THREE.Mesh(new THREE.BoxGeometry(3.75, 1.22, 1.92), primaryMat);
      pav.position.set(-0.15, 0.92, -0.45);
      const glassWall = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.05, 0.08), glassMat);
      glassWall.position.set(0.35, 0.9, 0.52);
      const stoneWall = new THREE.Mesh(new THREE.BoxGeometry(0.68, 1.65, 2.12), secondaryMat);
      stoneWall.position.set(-0.98, 1.1, -0.45);

      const wingL = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.12, 2.35), whiteMat);
      wingL.rotation.z = -0.22;
      wingL.position.set(-1.08, 1.72, -0.45);
      const wingR = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.12, 2.35), whiteMat);
      wingR.rotation.z = 0.22;
      wingR.position.set(0.78, 1.72, -0.45);
      g.add(pav, glassWall, stoneWall, wingL, wingR);

      for (const px of [-2.15, 2.08]) {
        const palm = createTree('cypress', [px, 0.32, -0.8], 0.92);
        g.add(palm);
      }
      break;
    }

    case 11: {
      // BD-131: Beverly Hills Spanish Colonial Revival Hacienda
      const mainWing = new THREE.Mesh(new THREE.BoxGeometry(3.35, 1.48, 1.82), primaryMat);
      mainWing.position.set(-0.25, 1.02, -0.55);
      const redRoof = new THREE.Mesh(new THREE.ConeGeometry(2.35, 0.68, 4), secondaryMat);
      redRoof.rotation.y = Math.PI / 4;
      redRoof.scale.set(1.18, 1, 0.74);
      redRoof.position.set(-0.25, 2.05, -0.55);

      // Arched Loggia Colonnade along front
      for (let ax = -1.45; ax <= 0.65; ax += 0.52) {
        const archCol = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.95, 8), trimStoneMat);
        archCol.position.set(ax, 0.75, 0.45);
        g.add(archCol);
      }

      const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.58, 2.45, 8), primaryMat);
      tower.position.set(1.48, 1.5, -0.25);
      const towerRoof = new THREE.Mesh(new THREE.ConeGeometry(0.72, 0.62, 8), secondaryMat);
      towerRoof.position.set(1.48, 3.0, -0.25);

      const pool = new THREE.Mesh(new THREE.BoxGeometry(2.85, 0.16, 1.18), waterMat);
      pool.position.set(-0.35, 0.36, 1.18);
      g.add(mainWing, redRoof, tower, towerRoof, pool);
      break;
    }

    case 12: {
      // BD-132: Nordic Fjord Charred-Pine & Aurora Glass Villa
      for (const [gx, gz, w, mat] of [
        [-1.1, -0.35, 1.38, primaryMat],
        [0.15, -0.2, 1.52, glassMat],
        [1.3, -0.45, 1.28, secondaryMat],
      ] as [number, number, number, THREE.Material][]) {
        const body = new THREE.Mesh(new THREE.BoxGeometry(w, 1.22, 2.12), mat);
        body.position.set(gx, 0.9, gz);
        const roof = new THREE.Mesh(new THREE.ConeGeometry(w * 0.8, 0.86, 4), mat);
        roof.rotation.y = Math.PI / 4;
        roof.scale.set(1, 1, 1.36);
        roof.position.set(gx, 1.88, gz);
        const win = createMullionedWindow(w * 0.65, 0.85, woodMat, glowMat);
        win.position.set(gx, 0.92, gz + 1.07);
        g.add(body, roof, win);
      }

      const fjordPool = new THREE.Mesh(new THREE.BoxGeometry(3.55, 0.16, 1.22), waterMat);
      fjordPool.position.set(0.15, 0.36, 1.25);
      g.add(fjordPool);
      break;
    }

    case 13: {
      // BD-133: Côte d'Azur French Riviera Art Deco Sun Villa
      const decoBody = new THREE.Mesh(new THREE.BoxGeometry(3.52, 1.48, 1.82), primaryMat);
      decoBody.position.set(0, 1.02, -0.45);
      const rotunda = new THREE.Mesh(new THREE.CylinderGeometry(0.84, 0.84, 1.76, 16), glassMat);
      rotunda.position.set(0, 1.16, 0.28);
      const goldCornice = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.15, 16), secondaryMat);
      goldCornice.position.set(0, 2.06, 0.28);
      const solarium = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.58, 1.2), primaryMat);
      solarium.position.set(0, 2.02, -0.55);

      const pool = new THREE.Mesh(new THREE.BoxGeometry(2.95, 0.16, 1.22), waterMat);
      pool.position.set(0, 0.36, 1.32);
      g.add(decoBody, rotunda, goldCornice, solarium, pool);
      break;
    }

    case 14: {
      // BD-134: Bali Ubud Sacred Bamboo & Infinity Pool Villa
      const lagoon = new THREE.Mesh(new THREE.CylinderGeometry(1.82, 1.82, 0.16, 18), waterMat);
      lagoon.scale.set(1.38, 1, 0.7);
      lagoon.position.set(0, 0.35, 1.15);
      g.add(lagoon);

      const bambooDeck = new THREE.Mesh(new THREE.CylinderGeometry(1.82, 1.92, 0.26, 14), primaryMat);
      bambooDeck.scale.set(1.26, 1, 0.86);
      bambooDeck.position.set(0, 0.44, -0.4);
      const bambooCore = new THREE.Mesh(new THREE.CylinderGeometry(1.32, 1.42, 1.42, 12), primaryMat);
      bambooCore.position.set(0, 1.24, -0.45);
      const leafRoof = new THREE.Mesh(new THREE.ConeGeometry(2.25, 1.62, 12), secondaryMat);
      leafRoof.scale.set(1.28, 1, 0.84);
      leafRoof.position.set(0, 2.42, -0.45);
      g.add(bambooDeck, bambooCore, leafRoof);

      const palm1 = createTree('willow', [-2.12, 0.32, 0.5], 0.88);
      const palm2 = createTree('willow', [2.12, 0.32, 0.5], 0.88);
      g.add(palm1, palm2);
      break;
    }

    case 15: {
      // BD-135: Scottish Highland Baronial Turreted Stone Manor
      const graniteHall = new THREE.Mesh(new THREE.BoxGeometry(3.32, 1.72, 1.92), primaryMat);
      graniteHall.position.set(-0.2, 1.14, -0.4);
      const slateRoof = new THREE.Mesh(new THREE.ConeGeometry(2.35, 0.92, 4), secondaryMat);
      slateRoof.rotation.y = Math.PI / 4;
      slateRoof.scale.set(1.18, 1, 0.76);
      slateRoof.position.set(-0.2, 2.42, -0.4);

      const keep = new THREE.Mesh(new THREE.BoxGeometry(1.32, 2.55, 1.32), primaryMat);
      keep.position.set(1.18, 1.56, -0.2);
      for (const [bx, bz] of [
        [0.55, 0.42],
        [1.8, 0.42],
        [1.8, -0.82],
      ]) {
        const bartizan = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.16, 1.0, 10), primaryMat);
        bartizan.position.set(bx, 2.42, bz);
        const bCone = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.58, 10), secondaryMat);
        bCone.position.set(bx, 3.18, bz);
        g.add(bartizan, bCone);
      }
      g.add(graniteHall, slateRoof, keep);
      break;
    }

    case 16: {
      // BD-136: Suzhou Classical Whitewashed Jiangnan Water Courtyard Villa
      const pond = new THREE.Mesh(new THREE.BoxGeometry(3.35, 0.14, 1.42), waterMat);
      pond.position.set(0.25, 0.32, 1.05);
      const zigzag = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.09, 0.38), accentMat);
      zigzag.position.set(0.25, 0.42, 1.05);
      g.add(pond, zigzag);

      const mainHall = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.52, 1.72), primaryMat);
      mainHall.position.set(0, 1.06, -0.55);
      const darkRoof = new THREE.Mesh(new THREE.ConeGeometry(2.25, 0.76, 4), secondaryMat);
      darkRoof.rotation.y = Math.PI / 4;
      darkRoof.scale.set(1.2, 1, 0.76);
      darkRoof.position.set(0, 2.15, -0.55);

      for (const gx of [-1.56, 1.56]) {
        const gableWall = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.02, 1.82), primaryMat);
        gableWall.position.set(gx, 1.28, -0.55);
        const cap = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 1.9), secondaryMat);
        cap.position.set(gx, 2.32, -0.55);
        g.add(gableWall, cap);
      }

      const moonWall = new THREE.Mesh(new THREE.BoxGeometry(1.42, 1.12, 0.15), primaryMat);
      moonWall.position.set(-1.68, 0.85, 0.85);
      const moonOpening = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.19, 14), accentMat);
      moonOpening.rotation.x = Math.PI / 2;
      moonOpening.position.set(-1.68, 0.82, 0.85);
      g.add(mainHall, darkRoof, moonWall, moonOpening);
      break;
    }

    case 17: {
      // BD-137: Hamptons Shingle-Style Coastal Gables Estate
      const shingleBody = new THREE.Mesh(new THREE.BoxGeometry(3.52, 1.54, 1.92), primaryMat);
      shingleBody.position.set(0, 1.06, -0.45);
      const veranda = new THREE.Mesh(new THREE.BoxGeometry(3.92, 0.14, 2.42), secondaryMat);
      veranda.position.set(0, 0.98, -0.35);

      for (const gx of [-0.98, 0.98]) {
        const gambrel = new THREE.Mesh(new THREE.ConeGeometry(1.2, 0.88, 4), primaryMat);
        gambrel.rotation.y = Math.PI / 4;
        gambrel.position.set(gx, 2.22, -0.45);
        g.add(gambrel);
      }
      const cupola = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.68, 8), secondaryMat);
      cupola.position.set(0, 2.22, -0.45);
      const cupolaCap = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.48, 8), primaryMat);
      cupolaCap.position.set(0, 2.78, -0.45);

      const pool = new THREE.Mesh(new THREE.BoxGeometry(2.85, 0.16, 1.22), waterMat);
      pool.position.set(0, 0.36, 1.22);
      g.add(shingleBody, veranda, cupola, cupolaCap, pool);
      break;
    }

    case 18: {
      // BD-138: Marrakech Royal Moorish Courtyard Riad Palace
      const backWing = new THREE.Mesh(new THREE.BoxGeometry(3.92, 1.72, 1.12), primaryMat);
      backWing.position.set(0, 1.16, -1.05);
      const leftWing = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.72, 2.65), primaryMat);
      leftWing.position.set(-1.46, 1.16, 0.15);
      const rightWing = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.72, 2.65), primaryMat);
      rightWing.position.set(1.46, 1.16, 0.15);

      const zelligePool = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.16, 2.25), secondaryMat);
      zelligePool.position.set(0, 0.36, 0.25);
      const moorishDome = new THREE.Mesh(new THREE.SphereGeometry(0.58, 14, 12), accentMat);
      moorishDome.position.set(0, 2.18, -1.05);
      g.add(backWing, leftWing, rightWing, zelligePool, moorishDome);
      break;
    }

    case 19: {
      // BD-139: Venetian Grand Canal Gothic Palazzo
      const canal = new THREE.Mesh(new THREE.BoxGeometry(5.35, 0.16, 1.52), waterMat);
      canal.position.set(0, 0.31, 1.35);
      g.add(canal);

      for (const px of [-1.28, -0.58, 0.58, 1.28]) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.88, 8), accentMat);
        pole.position.set(px, 0.68, 0.88);
        const cap = new THREE.Mesh(new THREE.SphereGeometry(0.065, 6, 6), goldMat);
        cap.position.set(px, 1.14, 0.88);
        g.add(pole, cap);
      }
      const gondola = new THREE.Mesh(new THREE.ConeGeometry(0.22, 1.22, 8), darkSlateMat);
      gondola.rotation.z = Math.PI / 2;
      gondola.scale.set(0.62, 1, 0.36);
      gondola.position.set(0.25, 0.42, 1.38);
      g.add(gondola);

      const palazzo = new THREE.Mesh(new THREE.BoxGeometry(3.52, 2.12, 1.82), primaryMat);
      palazzo.position.set(0, 1.36, -0.35);
      const loggiaBand = new THREE.Mesh(new THREE.BoxGeometry(2.52, 0.72, 0.14), secondaryMat);
      loggiaBand.position.set(0, 1.48, 0.54);
      const altana = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.42, 1.02), woodMat);
      altana.position.set(0, 2.58, -0.35);
      g.add(palazzo, loggiaBand, altana);
      break;
    }

    case 20: {
      // BD-140: Maldives Biophilic Overwater Glass Lagoon Villa with Water Slide
      const lagoonBase = new THREE.Mesh(new THREE.BoxGeometry(5.35, 0.18, 4.55), waterMat);
      lagoonBase.position.y = 0.29;
      const teakDeck = new THREE.Mesh(new THREE.BoxGeometry(4.32, 0.15, 3.2), primaryMat);
      teakDeck.position.set(-0.2, 0.54, 0.1);
      g.add(lagoonBase, teakDeck);

      const villa1F = new THREE.Mesh(new THREE.BoxGeometry(2.72, 0.98, 1.82), glassMat);
      villa1F.position.set(-0.45, 1.08, -0.35);
      const villa2F = new THREE.Mesh(new THREE.BoxGeometry(2.22, 0.85, 1.52), primaryMat);
      villa2F.position.set(-0.45, 1.96, -0.35);
      const mantaRoof = new THREE.Mesh(new THREE.ConeGeometry(2.25, 1.0, 10), primaryMat);
      mantaRoof.scale.set(1.28, 0.76, 0.86);
      mantaRoof.position.set(-0.45, 2.75, -0.35);
      g.add(villa1F, villa2F, mantaRoof);

      for (let i = 0; i < 9; i++) {
        const t = i / 8;
        const angle = t * Math.PI * 0.88;
        const slideSeg = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.13, 0.44), accentMat);
        slideSeg.position.set(0.85 + Math.sin(angle) * 0.98, 1.88 - t * 1.4, -0.35 + Math.cos(angle) * 0.98);
        slideSeg.rotation.y = -angle;
        g.add(slideSeg);
      }
      break;
    }

    // ========================================================================
    // 10 WORLD-FAMOUS REAL CASTLES (BD-141 to BD-150 -> idx 21 to 30)
    // ========================================================================
    case 21: {
      // BD-141: Germany · Neuschwanstein Castle (德国·新天鹅堡)
      const crag = new THREE.Mesh(
        new THREE.ConeGeometry(2.55, 1.35, 8),
        createLowPolyMat(0x7c8594, { roughness: 0.88 })
      );
      crag.scale.set(1.25, 0.72, 0.88);
      crag.position.set(0, 0.72, -0.35);
      const gorgeStream = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.12, 1.35), waterMat);
      gorgeStream.position.set(-1.35, 0.34, 1.15);
      const marienBridge = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.1, 0.24), darkSlateMat);
      marienBridge.position.set(-1.35, 1.15, 0.95);
      g.add(crag, gorgeStream, marienBridge);

      // Red-brick Romanesque Gatehouse (Torbau) in front with stepped gables
      const torbau = new THREE.Mesh(new THREE.BoxGeometry(1.75, 1.05, 0.76), accentMat);
      torbau.position.set(0.15, 1.22, 0.75);
      const torRoof = new THREE.Mesh(new THREE.ConeGeometry(1.12, 0.55, 4), secondaryMat);
      torRoof.rotation.y = Math.PI / 4;
      torRoof.scale.set(1.25, 1, 0.72);
      torRoof.position.set(0.15, 1.98, 0.75);
      g.add(torbau, torRoof);

      // Main White Limestone Palas (Singers' Hall & Throne Room wing)
      const palas = new THREE.Mesh(new THREE.BoxGeometry(3.05, 1.95, 1.52), primaryMat);
      palas.position.set(0, 1.82, -0.45);
      const palasRoof = new THREE.Mesh(new THREE.ConeGeometry(2.05, 0.98, 4), secondaryMat);
      palasRoof.rotation.y = Math.PI / 4;
      palasRoof.scale.set(1.25, 1, 0.76);
      palasRoof.position.set(0, 3.22, -0.45);
      const throneBalcony = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.14, 0.32), goldMat);
      throneBalcony.position.set(-0.35, 1.92, 0.36);
      g.add(palas, palasRoof, throneBalcony);

      // Rows of Arched Romanesque Windows across Palas
      for (let wx = -1.15; wx <= 1.15; wx += 0.45) {
        for (const wy of [1.32, 1.82, 2.32]) {
          const rWin = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.28, 0.06), glowMat);
          rWin.position.set(wx, wy, 0.32);
          g.add(rWin);
        }
      }

      // Soaring Cylindrical North Watchtower + Twin Western Turrets with Cobalt Conical Spires
      for (const [tx, tz, r, h, coneH] of [
        [-1.38, -0.95, 0.42, 3.35, 1.18],
        [1.42, -0.88, 0.35, 2.75, 0.95],
        [-1.48, 0.28, 0.28, 2.35, 0.82],
        [1.48, 0.55, 0.26, 2.15, 0.72],
      ]) {
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.05, h, 12), primaryMat);
        shaft.position.set(tx, 0.85 + h / 2, tz);
        const spire = new THREE.Mesh(new THREE.ConeGeometry(r * 1.24, coneH, 12), secondaryMat);
        spire.position.set(tx, 0.85 + h + coneH / 2, tz);
        const finial = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.025, 0.28, 6), goldMat);
        finial.position.set(tx, 0.85 + h + coneH + 0.12, tz);
        g.add(shaft, spire, finial);
      }
      g.add(createTree('pine', [-2.2, 0.32, 1.4], 0.92), createTree('pine', [2.2, 0.32, 1.4], 0.88));
      break;
    }

    case 22: {
      // BD-142: France · Mont-Saint-Michel Abbey Fortress (法国·圣米歇尔山城堡)
      const tidalBay = new THREE.Mesh(new THREE.BoxGeometry(5.38, 0.16, 4.58), waterMat);
      tidalBay.position.y = 0.29;
      const causeway = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.14, 1.65), trimStoneMat);
      causeway.position.set(0, 0.4, 1.55);
      g.add(tidalBay, causeway);

      // Outer Circular Granite Ramparts & Bastion Towers at Waterline
      const outerRampart = new THREE.Mesh(new THREE.CylinderGeometry(2.05, 2.25, 0.62, 16), primaryMat);
      outerRampart.position.set(0, 0.65, -0.2);
      g.add(outerRampart);
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2;
        const bt = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.78, 8), primaryMat);
        bt.position.set(Math.cos(ang) * 2.02, 0.75, -0.2 + Math.sin(ang) * 2.02);
        g.add(bt);
      }

      // Conical Granite Mount + Spiral Medieval Village Houses Tier
      const rockMound = new THREE.Mesh(
        new THREE.ConeGeometry(1.88, 1.65, 12),
        createLowPolyMat(0x78716c, { roughness: 0.88 })
      );
      rockMound.position.set(0, 1.25, -0.2);
      g.add(rockMound);
      for (let i = 0; i < 10; i++) {
        const ang = (i / 10) * Math.PI * 2;
        const rad = 1.28 - (i % 2) * 0.22;
        const vy = 1.12 + (i % 3) * 0.22;
        const house = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.48, 0.38), trimStoneMat);
        house.position.set(Math.cos(ang) * rad, vy, -0.2 + Math.sin(ang) * rad);
        const hRoof = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.32, 4), secondaryMat);
        hRoof.rotation.y = Math.PI / 4;
        hRoof.position.set(Math.cos(ang) * rad, vy + 0.38, -0.2 + Math.sin(ang) * rad);
        g.add(house, hRoof);
      }

      // Summit Gothic Abbey Complex (La Merveille) + Flying Buttresses + Needle Spire & Golden Archangel
      const abbeyBase = new THREE.Mesh(new THREE.BoxGeometry(1.68, 1.28, 1.38), primaryMat);
      abbeyBase.position.set(0, 2.15, -0.2);
      const abbeyNave = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.85, 0.92), trimStoneMat);
      abbeyNave.position.set(0, 2.95, -0.2);
      const abbeyRoof = new THREE.Mesh(new THREE.ConeGeometry(0.95, 0.65, 4), secondaryMat);
      abbeyRoof.rotation.y = Math.PI / 4;
      abbeyRoof.position.set(0, 3.62, -0.2);
      const spireShaft = new THREE.Mesh(new THREE.ConeGeometry(0.18, 1.38, 8), secondaryMat);
      spireShaft.position.set(0, 4.35, -0.2);
      const archangel = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), goldMat);
      archangel.position.set(0, 5.12, -0.2);
      g.add(abbeyBase, abbeyNave, abbeyRoof, spireShaft, archangel);
      break;
    }

    case 23: {
      // BD-143: France · Château de Chenonceau (法国·舍农索水上城堡)
      const cherRiver = new THREE.Mesh(new THREE.BoxGeometry(5.38, 0.18, 3.15), waterMat);
      cherRiver.position.set(0, 0.29, -0.15);
      g.add(cherRiver);

      // Parterre Gardens of Diane de Poitiers & Catherine de' Medici on the South Bank
      for (const gx of [-1.75, 1.75]) {
        const gardenBed = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.1, 1.15), hedgeMat);
        gardenBed.position.set(gx, 0.36, 1.55);
        const innerLawn = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.12, 0.78), lawnMat);
        innerLawn.position.set(gx, 0.37, 1.55);
        g.add(gardenBed, innerLawn);
      }

      // Detached Medieval Cylindrical Keep (Tour des Marques) on the Forebank
      const marquesTower = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 1.85, 12), primaryMat);
      marquesTower.position.set(-1.55, 1.22, 0.85);
      const marquesRoof = new THREE.Mesh(new THREE.ConeGeometry(0.48, 0.72, 12), secondaryMat);
      marquesRoof.position.set(-1.55, 2.48, 0.85);
      g.add(marquesTower, marquesRoof);

      // 5-Arch Stone Bridge Gallery Spanning Directly Over the Cher River
      for (let i = 0; i < 6; i++) {
        const px = -2.1 + i * 0.84;
        const pier = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.75, 1.48), primaryMat);
        pier.position.set(px, 0.68, -0.35);
        const cutwater = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.75, 4), primaryMat);
        cutwater.position.set(px, 0.68, 0.42);
        g.add(pier, cutwater);
      }
      const galleryBody = new THREE.Mesh(new THREE.BoxGeometry(4.45, 1.28, 1.38), primaryMat);
      galleryBody.position.set(0, 1.58, -0.35);
      const galleryRoof = new THREE.Mesh(new THREE.ConeGeometry(3.25, 0.92, 4), secondaryMat);
      galleryRoof.rotation.y = Math.PI / 4;
      galleryRoof.scale.set(1.05, 1, 0.46);
      galleryRoof.position.set(0, 2.65, -0.35);
      g.add(galleryBody, galleryRoof);

      // Renaissance Château Corps de Logis with Corner Turrets on the North Pier
      const logis = new THREE.Mesh(new THREE.BoxGeometry(1.75, 1.68, 1.65), primaryMat);
      logis.position.set(0, 1.72, 0.38);
      const logisRoof = new THREE.Mesh(new THREE.ConeGeometry(1.38, 0.95, 4), secondaryMat);
      logisRoof.rotation.y = Math.PI / 4;
      logisRoof.position.set(0, 3.0, 0.38);
      g.add(logis, logisRoof);
      for (const [tx, tz] of [
        [-0.86, 1.15],
        [0.86, 1.15],
      ]) {
        const tur = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 1.85, 10), primaryMat);
        tur.position.set(tx, 1.82, tz);
        const turCone = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.65, 10), secondaryMat);
        turCone.position.set(tx, 3.05, tz);
        g.add(tur, turCone);
      }
      break;
    }

    case 24: {
      // BD-144: Germany · Hohenzollern Castle (德国·霍亨索伦城堡)
      const mountZollern = new THREE.Mesh(
        new THREE.ConeGeometry(2.58, 1.48, 10),
        createLowPolyMat(0x57534e, { roughness: 0.9 })
      );
      mountZollern.position.set(0, 0.92, -0.15);
      const bastionRing = new THREE.Mesh(new THREE.CylinderGeometry(2.12, 2.32, 0.68, 8), primaryMat);
      bastionRing.position.set(0, 1.38, -0.15);
      const eagleGateRamp = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.25, 0.55), primaryMat);
      eagleGateRamp.rotation.z = 0.22;
      eagleGateRamp.position.set(0, 0.95, 1.42);
      g.add(mountZollern, bastionRing, eagleGateRamp);

      // Central U-Shaped Neo-Gothic Sandstone Palace Wing
      const palaceCore = new THREE.Mesh(new THREE.BoxGeometry(2.65, 1.45, 1.72), primaryMat);
      palaceCore.position.set(0, 2.15, -0.25);
      const coreRoof = new THREE.Mesh(new THREE.ConeGeometry(1.92, 0.82, 4), secondaryMat);
      coreRoof.rotation.y = Math.PI / 4;
      coreRoof.scale.set(1.18, 1, 0.78);
      coreRoof.position.set(0, 3.22, -0.25);
      g.add(palaceCore, coreRoof);

      // Crown of 8 Soaring Neo-Gothic Octagonal & Cylindrical Towers with Sharp Conical Spires
      for (const [tx, tz, r, h, cH, mat] of [
        [-1.18, -0.85, 0.36, 2.35, 1.05, secondaryMat],
        [1.18, -0.85, 0.36, 2.35, 1.05, secondaryMat],
        [0, -1.05, 0.42, 2.75, 1.25, accentMat],
        [-1.32, 0.35, 0.3, 1.95, 0.88, secondaryMat],
        [1.32, 0.35, 0.3, 1.95, 0.88, secondaryMat],
        [-0.55, 0.55, 0.24, 1.75, 0.75, accentMat],
        [0.55, 0.55, 0.24, 1.75, 0.75, accentMat],
      ] as [number, number, number, number, number, THREE.Material][]) {
        const tShaft = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.06, h, 8), primaryMat);
        tShaft.position.set(tx, 1.55 + h / 2, tz);
        const tSpire = new THREE.Mesh(new THREE.ConeGeometry(r * 1.22, cH, 8), mat);
        tSpire.position.set(tx, 1.55 + h + cH / 2, tz);
        const finial = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.025, 0.26, 6), goldMat);
        finial.position.set(tx, 1.55 + h + cH + 0.12, tz);
        g.add(tShaft, tSpire, finial);
      }
      break;
    }

    case 25: {
      // BD-145: Japan · Himeji Castle / White Heron Castle (日本·姬路城/白鹭城)
      const moat = new THREE.Mesh(new THREE.BoxGeometry(5.28, 0.14, 1.25), waterMat);
      moat.position.set(0, 0.31, 1.48);
      const sakuraBridge = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.14, 1.28), createLowPolyMat(0xdc2626));
      sakuraBridge.position.set(0, 0.42, 1.48);
      g.add(moat, sakuraBridge);

      // Fan-Shaped Curved Ishigaki Stone Fortress Base (Ogi-no-kobai)
      const ishigakiLower = new THREE.Mesh(
        new THREE.CylinderGeometry(2.15, 2.55, 0.82, 4),
        createLowPolyMat(0x78716c, { roughness: 0.9 })
      );
      ishigakiLower.rotation.y = Math.PI / 4;
      ishigakiLower.scale.set(1.25, 1, 0.92);
      ishigakiLower.position.set(0, 0.72, -0.35);
      const ishigakiUpper = new THREE.Mesh(
        new THREE.CylinderGeometry(1.42, 1.72, 0.68, 4),
        createLowPolyMat(0x57534e, { roughness: 0.9 })
      );
      ishigakiUpper.rotation.y = Math.PI / 4;
      ishigakiUpper.position.set(0.15, 1.38, -0.45);
      g.add(ishigakiLower, ishigakiUpper);

      // 5-Tiered Snow-White Plaster Main Keep (Daitenshu) with Sweeping Grey Tile Eaves & Golden Shachihoko
      for (let tier = 0; tier < 5; tier++) {
        const w = 1.95 - tier * 0.28;
        const d = 1.65 - tier * 0.22;
        const h = 0.44;
        const ty = 1.85 + tier * 0.45;
        const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), primaryMat);
        wall.position.set(0.15, ty, -0.45);
        const eave = new THREE.Mesh(new THREE.ConeGeometry(w * 0.88, 0.28, 4), secondaryMat);
        eave.rotation.y = Math.PI / 4;
        eave.scale.set(1.12, 1, 0.95);
        eave.position.set(0.15, ty + 0.24, -0.45);
        g.add(wall, eave);
      }
      // Golden Shachihoko Dolphin-Tiger Finials at Top Ridge
      for (const sx of [-0.18, 0.48]) {
        const shachi = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.22, 6), goldMat);
        shachi.position.set(sx, 4.12, -0.45);
        g.add(shachi);
      }

      // 2 Subsidiary Keeps (Nishi-Kotenshu & Inui-Kotenshu) + Watari-Yagura Connecting Gallery
      for (const [kx, kz] of [
        [-1.25, -0.15],
        [-1.15, -0.95],
      ]) {
        const subKeep = new THREE.Mesh(new THREE.BoxGeometry(0.92, 1.05, 0.85), primaryMat);
        subKeep.position.set(kx, 1.62, kz);
        const subRoof = new THREE.Mesh(new THREE.ConeGeometry(0.78, 0.45, 4), secondaryMat);
        subRoof.rotation.y = Math.PI / 4;
        subRoof.position.set(kx, 2.32, kz);
        g.add(subKeep, subRoof);
      }

      // Blooming Pink Yoshino Cherry Blossom Trees
      for (const [cx, cz] of [
        [-2.15, 0.85],
        [2.15, 0.85],
        [-1.85, 1.65],
        [1.85, 1.65],
      ]) {
        g.add(createTree('blossom', [cx, 0.32, cz], 0.92));
      }
      break;
    }

    case 26: {
      // BD-146: Spain · Alcázar of Segovia (西班牙·塞哥维亚阿尔卡萨尔城堡)
      // Iconic Razor-Sharp Ship-Prow Limestone Cliff Crag (Proa de Barco)
      const prowCliff = new THREE.Mesh(
        new THREE.ConeGeometry(2.35, 1.65, 4),
        createLowPolyMat(0xa89f91, { roughness: 0.88 })
      );
      prowCliff.scale.set(0.85, 0.72, 1.55);
      prowCliff.position.set(0, 0.72, -0.1);
      const moat = new THREE.Mesh(new THREE.BoxGeometry(3.85, 0.14, 0.75), waterMat);
      moat.position.set(0, 0.31, -1.65);
      g.add(prowCliff, moat);

      // Ship-Bow Forward Bastion + Tall Conical Witch-Hat Homage Turret at the Prow
      const bowBastion = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.82, 1.65, 6), primaryMat);
      bowBastion.position.set(0, 1.52, 1.25);
      const bowTower = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.45, 2.25, 12), primaryMat);
      bowTower.position.set(0, 2.15, 0.95);
      const bowSpire = new THREE.Mesh(new THREE.ConeGeometry(0.54, 1.15, 12), secondaryMat);
      bowSpire.position.set(0, 3.82, 0.95);
      g.add(bowBastion, bowTower, bowSpire);

      // Central Royal Palace Hall + 4 Flanking Cylindrical Witch-Hat Slate Turrets
      const alcazarBody = new THREE.Mesh(new THREE.BoxGeometry(2.35, 1.68, 1.85), primaryMat);
      alcazarBody.position.set(0, 1.78, -0.15);
      const alcazarRoof = new THREE.Mesh(new THREE.ConeGeometry(1.75, 0.88, 4), secondaryMat);
      alcazarRoof.rotation.y = Math.PI / 4;
      alcazarRoof.position.set(0, 3.02, -0.15);
      g.add(alcazarBody, alcazarRoof);

      for (const [tx, tz] of [
        [-1.18, 0.55],
        [1.18, 0.55],
        [-1.18, -0.85],
        [1.18, -0.85],
      ]) {
        const tur = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 2.05, 10), primaryMat);
        tur.position.set(tx, 1.95, tz);
        const cone = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.92, 10), secondaryMat);
        cone.position.set(tx, 3.42, tz);
        g.add(tur, cone);
      }

      // Monumental Crenellated Rectangular Tower of John II (Torre de Juan II) at Rear with 6 Engaged Turrets
      const juanTower = new THREE.Mesh(new THREE.BoxGeometry(1.45, 2.85, 0.95), primaryMat);
      juanTower.position.set(0, 2.38, -1.25);
      g.add(juanTower);
      for (const jx of [-0.68, 0, 0.68]) {
        const semiTurret = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.45, 8), trimStoneMat);
        semiTurret.position.set(jx, 3.22, -0.78);
        g.add(semiTurret);
      }
      break;
    }

    case 27: {
      // BD-147: Scotland · Eilean Donan Castle (苏格兰·爱莲朵娜城堡)
      const seaLoch = new THREE.Mesh(new THREE.BoxGeometry(5.38, 0.18, 4.58), waterMat);
      seaLoch.position.y = 0.29;
      g.add(seaLoch);

      // Iconic 3-Arch Stone Causeway Bridge Connecting the Tidal Islet to the Shore
      const bridgeDeck = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.24, 0.58), primaryMat);
      bridgeDeck.position.set(1.38, 0.68, 0.95);
      g.add(bridgeDeck);
      for (const px of [0.55, 1.35, 2.15]) {
        const pier = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.58, 0.64), primaryMat);
        pier.position.set(px, 0.48, 0.95);
        g.add(pier);
      }

      // Rocky Highland Tidal Islet Mound + Battered Curtain Walls
      const isletRock = new THREE.Mesh(
        new THREE.CylinderGeometry(1.88, 2.15, 0.55, 10),
        createLowPolyMat(0x57534e, { roughness: 0.92 })
      );
      isletRock.position.set(-0.45, 0.55, -0.15);
      const curtainWall = new THREE.Mesh(new THREE.CylinderGeometry(1.62, 1.72, 0.72, 8), primaryMat);
      curtainWall.position.set(-0.45, 0.98, -0.15);
      g.add(isletRock, curtainWall);

      // Rugged Grey Granite Main Keep (Donjon) with Scottish Crow-Stepped Gables
      const mainKeep = new THREE.Mesh(new THREE.BoxGeometry(1.68, 2.35, 1.42), primaryMat);
      mainKeep.position.set(-0.55, 1.95, -0.35);
      const keepRoof = new THREE.Mesh(new THREE.ConeGeometry(1.28, 0.95, 4), secondaryMat);
      keepRoof.rotation.y = Math.PI / 4;
      keepRoof.scale.set(1.15, 1, 0.85);
      keepRoof.position.set(-0.55, 3.55, -0.35);
      const banquetWing = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.48, 1.12), primaryMat);
      banquetWing.position.set(0.45, 1.52, -0.15);
      const wingRoof = new THREE.Mesh(new THREE.ConeGeometry(0.98, 0.72, 4), secondaryMat);
      wingRoof.rotation.y = Math.PI / 4;
      wingRoof.position.set(0.45, 2.58, -0.15);
      const watchTurret = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.35, 1.65, 10), primaryMat);
      watchTurret.position.set(-1.55, 1.48, 0.65);
      const turretCone = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.62, 10), secondaryMat);
      turretCone.position.set(-1.55, 2.6, 0.65);
      g.add(mainKeep, keepRoof, banquetWing, wingRoof, watchTurret, turretCone);
      break;
    }

    case 28: {
      // BD-148: Czechia · Prague Castle & St. Vitus / Golden Lane (捷克·布拉格城堡与黄金巷)
      // St. Vitus Gothic Cathedral Nave + Twin Pierced Western Spires + Rose Window
      const vitusNave = new THREE.Mesh(new THREE.BoxGeometry(2.55, 1.85, 1.38), primaryMat);
      vitusNave.position.set(-0.35, 1.28, -0.65);
      const vitusRoof = new THREE.Mesh(new THREE.ConeGeometry(1.85, 0.88, 4), darkSlateMat);
      vitusRoof.rotation.y = Math.PI / 4;
      vitusRoof.scale.set(1.28, 1, 0.72);
      vitusRoof.position.set(-0.35, 2.62, -0.65);
      const roseWin = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.08, 14), glowMat);
      roseWin.rotation.x = Math.PI / 2;
      roseWin.position.set(-0.95, 1.55, 0.06);
      g.add(vitusNave, vitusRoof, roseWin);

      // Twin Gothic Western Spires + Tall Verdigris-Copper Onion-Domed South Clocktower
      for (const sx of [-1.45, -0.45]) {
        const wTower = new THREE.Mesh(new THREE.BoxGeometry(0.52, 2.65, 0.52), primaryMat);
        wTower.position.set(sx, 1.68, -0.15);
        const wSpire = new THREE.Mesh(new THREE.ConeGeometry(0.38, 1.35, 8), darkSlateMat);
        wSpire.position.set(sx, 3.68, -0.15);
        g.add(wTower, wSpire);
      }
      const southTower = new THREE.Mesh(new THREE.BoxGeometry(0.68, 2.95, 0.68), primaryMat);
      southTower.position.set(0.65, 1.82, -0.25);
      const copperOnion = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 10), secondaryMat);
      copperOnion.scale.set(1, 1.35, 1);
      copperOnion.position.set(0.65, 3.62, -0.25);
      const copperNeedle = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.85, 8), secondaryMat);
      copperNeedle.position.set(0.65, 4.35, -0.25);
      const goldClock = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.06, 12), goldMat);
      goldClock.rotation.x = Math.PI / 2;
      goldClock.position.set(0.65, 2.65, 0.11);
      g.add(southTower, copperOnion, copperNeedle, goldClock);

      // Vladislav Royal Hall with Terracotta Roof + Row of 5 Pastel Golden Lane Miniature Cottages (#22 Kafka House)
      const vladislavHall = new THREE.Mesh(new THREE.BoxGeometry(1.65, 1.22, 1.15), trimStoneMat);
      vladislavHall.position.set(1.45, 0.95, -0.55);
      const vladRoof = new THREE.Mesh(new THREE.ConeGeometry(1.22, 0.68, 4), accentMat);
      vladRoof.rotation.y = Math.PI / 4;
      vladRoof.position.set(1.45, 1.88, -0.55);
      g.add(vladislavHall, vladRoof);

      const goldenLaneColors = [0x60a5fa, 0xfbbf24, 0xf87171, 0x34d399, 0xfbcfe8];
      for (let i = 0; i < 5; i++) {
        const gx = -1.6 + i * 0.78;
        const cottage = new THREE.Mesh(
          new THREE.BoxGeometry(0.68, 0.68, 0.58),
          createLowPolyMat(goldenLaneColors[i])
        );
        cottage.position.set(gx, 0.68, 1.22);
        const cRoof = new THREE.Mesh(new THREE.ConeGeometry(0.52, 0.38, 4), accentMat);
        cRoof.rotation.y = Math.PI / 4;
        cRoof.position.set(gx, 1.2, 1.22);
        g.add(cottage, cRoof);
      }
      break;
    }

    case 29: {
      // BD-149: UK · Windsor Castle — Royal Round Tower & St. George's Ward (英国·温莎城堡)
      // The Long Walk Processional Avenue + Emerald Motte Mound
      const longWalk = new THREE.Mesh(
        new THREE.BoxGeometry(0.95, 0.05, 1.65),
        createLowPolyMat(0xd6c7b2, { roughness: 0.88 })
      );
      longWalk.position.set(0, 0.33, 1.42);
      const motteMound = new THREE.Mesh(new THREE.CylinderGeometry(1.18, 1.58, 0.88, 16), secondaryMat);
      motteMound.position.set(0, 0.74, -0.15);
      g.add(longWalk, motteMound);

      // Monumental Bath-Stone Round Tower (The Keep) + Flag Turret Flying the Royal Standard
      const roundKeep = new THREE.Mesh(new THREE.CylinderGeometry(1.08, 1.12, 1.65, 18), primaryMat);
      roundKeep.position.set(0, 1.95, -0.15);
      const flagTurret = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.82, 10), primaryMat);
      flagTurret.position.set(0.35, 3.05, -0.15);
      const flagpole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.85, 6), goldMat);
      flagpole.position.set(0.35, 3.78, -0.15);
      const royalStandard = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.28, 0.03), accentMat);
      royalStandard.position.set(0.6, 4.02, -0.15);
      g.add(roundKeep, flagTurret, flagpole, royalStandard);

      // Crenellated Upper Ward State Apartments (Right) & St. George's Chapel (Left) with Gothic Pinnacles
      const stGeorgeChapel = new THREE.Mesh(new THREE.BoxGeometry(1.68, 1.38, 1.25), primaryMat);
      stGeorgeChapel.position.set(-1.62, 1.02, 0.15);
      const stateWard = new THREE.Mesh(new THREE.BoxGeometry(1.68, 1.42, 1.35), primaryMat);
      stateWard.position.set(1.62, 1.05, 0.15);
      const gatehouse = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.28, 0.65), primaryMat);
      gatehouse.position.set(0, 0.98, 0.95);
      g.add(stGeorgeChapel, stateWard, gatehouse);

      for (let px = -2.25; px <= -0.95; px += 0.42) {
        const pin = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.42, 4), trimStoneMat);
        pin.position.set(px, 1.92, 0.15);
        g.add(pin);
      }
      g.add(createTree('oak', [-1.85, 0.32, 1.55], 0.88), createTree('oak', [1.85, 0.32, 1.55], 0.88));
      break;
    }

    case 30:
    default: {
      // BD-150: Portugal · Pena Palace Sintra (葡萄牙·辛特拉佩纳宫城堡)
      const sintraCrag = new THREE.Mesh(
        new THREE.ConeGeometry(2.55, 1.28, 9),
        createLowPolyMat(0x57534e, { roughness: 0.9 })
      );
      sintraCrag.scale.set(1.22, 0.68, 0.88);
      sintraCrag.position.set(0, 0.68, -0.25);
      g.add(sintraCrag);

      // Azulejo Blue-and-White Tiled Queen's Terrace & Arches of the Yard
      const queensTerrace = new THREE.Mesh(new THREE.BoxGeometry(3.65, 0.35, 1.45), accentMat);
      queensTerrace.position.set(0, 1.05, 0.65);
      const tritonGate = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.28, 0.68), primaryMat);
      tritonGate.position.set(-0.85, 1.55, 0.85);
      g.add(queensTerrace, tritonGate);

      // Canary-Yellow Romanticist New Palace Wing + Moorish Horseshoe Windows + Spherical Onion Dome Tower
      const yellowWing = new THREE.Mesh(new THREE.BoxGeometry(2.15, 1.58, 1.42), primaryMat);
      yellowWing.position.set(-0.75, 1.85, -0.35);
      const domeTower = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.58, 2.25, 14), primaryMat);
      domeTower.position.set(-1.48, 2.15, -0.35);
      const redDome = new THREE.Mesh(new THREE.SphereGeometry(0.58, 14, 12), secondaryMat);
      redDome.position.set(-1.48, 3.35, -0.35);
      const domeFinial = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.48, 8), goldMat);
      domeFinial.position.set(-1.48, 4.02, -0.35);
      g.add(yellowWing, domeTower, redDome, domeFinial);

      // Terracotta-Red Former Hieronymite Convent Wing & Tall Crenellated Square Clock Tower
      const redWing = new THREE.Mesh(new THREE.BoxGeometry(1.85, 1.65, 1.38), secondaryMat);
      redWing.position.set(0.95, 1.92, -0.45);
      const redClockTower = new THREE.Mesh(new THREE.BoxGeometry(0.85, 2.85, 0.85), secondaryMat);
      redClockTower.position.set(1.38, 2.52, -0.45);
      const clockSpire = new THREE.Mesh(new THREE.ConeGeometry(0.58, 0.82, 4), primaryMat);
      clockSpire.rotation.y = Math.PI / 4;
      clockSpire.position.set(1.38, 4.32, -0.45);
      g.add(redWing, redClockTower, clockSpire);

      g.add(createTree('cypress', [-2.2, 0.32, 1.35], 0.92), createTree('oak', [2.2, 0.32, 1.35], 0.88));
      break;
    }
  }

  // Tag large opaque building shells/roofs on the estate so 1F/2F Cutaway mode can peel them back
  // and embed a complete 2-story detailed interior right inside the residence!
  g.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      if (child.position.y >= 2.15) {
        child.userData.isRoof = true;
        child.userData.floorLevel = 3;
      } else if (
        child.geometry instanceof THREE.BoxGeometry &&
        child.geometry.parameters.width >= 1.8 &&
        child.geometry.parameters.height >= 0.85 &&
        child.geometry.parameters.depth >= 1.1 &&
        child.position.y >= 0.85
      ) {
        child.userData.isExteriorWallShell = true;
      }
    }
  });

  // Map BD-121..140 (idx 1..20) -> diorama_dollhouse_01..20, and BD-141..150 (idx 21..30) -> diorama_dollhouse_33..42
  const dhIdx = idx <= 20 ? idx : idx + 12;
  const embeddedInterior = createEmbeddedDetailedInterior(island, variant, dhIdx, [0, 0.42, -0.35], 0.56);
  g.add(embeddedInterior);

  addShadows(g);
  return g;
}

/**
 * Builds a complete, scaled 2-story cutaway detailed interior that can be embedded directly
 * inside any exterior island residence (MW-MYWORLD-01..12 or BD-121..140) so that peeling back
 * the roof/walls (1F/2F mode) or looking through the open cutaway reveals rich multi-room furnishings!
 */
export function createEmbeddedDetailedInterior(
  island: IslandMetadata,
  variant: IslandVariant,
  dhIndex: number,
  position: [number, number, number] = [0, 0.78, -0.45],
  scale = 0.52
): THREE.Group {
  const syntheticIsland: IslandMetadata = {
    ...island,
    id: `diorama_dollhouse_${String(dhIndex).padStart(2, '0')}`,
  };
  const interior = buildDollhouseInteriorScene(syntheticIsland, variant);
  interior.scale.setScalar(scale);
  interior.position.set(position[0], position[1], position[2]);
  interior.userData.isEmbeddedCutawayInterior = true;
  interior.visible = false;
  return interior;
}

// ============================================================================
// PART 2: 32 ULTRA-DETAILED MULTI-STORY 3D DOLLHOUSE INTERIORS (diorama_dollhouse_01 to 32)
// Covers 20 Luxury Residences (01-20) + All 12 Official My World Scenes (21-32)!
// Includes Boiserie Moldings, Silk Curtain Drapes, 88-Key Grand Piano, Brass Gramophone,
// Place-Set Banquet Table, Gourmet Kitchen & Wine Bar, Turned-Baluster Grand Staircase,
// Canopy Bed with Pillows, Walk-In Wardrobe Armoire, Library Ladder, Life Memories Vitrine,
// Astronomical Telescope & Clawfoot Spa Bath!
// ============================================================================
export function buildDollhouseInteriorScene(
  island: IslandMetadata,
  variant: IslandVariant = 'classic'
): THREE.Group {
  const root = new THREE.Group();
  const dhNum = parseInt(island.id.replace('diorama_dollhouse_', ''), 10) || 1;
  const idx = Math.max(1, Math.min(42, dhNum));

  const floorColor = hexToInt(island.palette[0]?.hex, 0x8b5e3c);
  const wallColor = hexToInt(island.palette[1]?.hex, 0xf6efe2);
  const furnColor = hexToInt(island.palette[2]?.hex, 0x8c2d2d);
  const accentColor = hexToInt(island.palette[3]?.hex, 0xf59e0b);

  const floorMat = createLowPolyMat(floorColor, { roughness: 0.52 });
  const marbleFloorMat = createLowPolyMat(0xf4efe6, { roughness: 0.34 });
  const wallMat = createLowPolyMat(wallColor, { roughness: 0.7 });
  const wainscotMat = createLowPolyMat(0xd8cbb8, { roughness: 0.65 });
  const furnMat = createLowPolyMat(furnColor, { roughness: 0.58 });
  const accentMat = createLowPolyMat(accentColor, { roughness: 0.4 });
  const woodMat = createLowPolyMat(0x5c3a21, { roughness: 0.68 });
  const darkWoodMat = createLowPolyMat(0x3a2312, { roughness: 0.62 });
  const creamMat = createLowPolyMat(0xfaf6ee, { roughness: 0.65 });
  const darkIronMat = createLowPolyMat(0x27272a, { metalness: 0.45, roughness: 0.45 });
  const goldMat = createLowPolyMat(0xd4af37, { metalness: 0.65, roughness: 0.25 });
  const glowMat = createLowPolyMat(0xffe599, {
    emissive: 0xf59e0b,
    roughness: 0.28,
  });
  const glassMat = createGlassMat(0xbae6fd, 0.6);
  const waterMat = createWaterMat(0x06b6d4);

  // ==========================================================================
  // FLOOR 1 GROUP (userData.floorLevel = 1)
  // ==========================================================================
  const floor1Group = new THREE.Group();
  floor1Group.userData.floorLevel = 1;

  // 1F Foundation Slab with Beveled Brass-Trimmed Plinth
  const basePlinth = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.24, 4.5), wainscotMat);
  basePlinth.position.set(0, -0.12, 0);
  const brassPlinthBand = new THREE.Mesh(new THREE.BoxGeometry(5.54, 0.04, 4.54), goldMat);
  brassPlinthBand.position.set(0, -0.02, 0);
  const foyerFloor = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.06, 4.3), marbleFloorMat);
  foyerFloor.position.set(-1.3, 0.03, 0);
  const salonFloor = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.06, 4.3), floorMat);
  salonFloor.position.set(1.3, 0.03, 0);
  floor1Group.add(basePlinth, brassPlinthBand, foyerFloor, salonFloor);

  // Checkered Marble Inlay on Left 1F Grand Hall + Herringbone Parquet Strips on Right 1F Salon
  for (let ix = 0; ix < 4; ix++) {
    for (let iz = 0; iz < 7; iz++) {
      if ((ix + iz) % 2 === 0) {
        const tile = new THREE.Mesh(
          new THREE.BoxGeometry(0.46, 0.015, 0.46),
          idx === 18 || idx === 21 || idx === 29
            ? waterMat
            : idx === 20
            ? glassMat
            : idx === 31
            ? createLowPolyMat(0x0284c7)
            : darkIronMat
        );
        tile.position.set(-2.12 + ix * 0.5, 0.065, -1.55 + iz * 0.5);
        floor1Group.add(tile);
      }
    }
  }

  // 1F Cutaway Back Wall (z = -2.08), Left Side Wall (x = -2.58) & Central Archway Partition Wall
  const backWall1F = new THREE.Mesh(new THREE.BoxGeometry(5.32, 1.86, 0.16), wallMat);
  backWall1F.position.set(0, 0.95, -2.08);
  const leftWall1F = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.86, 4.32), wallMat);
  leftWall1F.position.set(-2.58, 0.95, 0);

  // Central Partition Wall with Classical Pilasters & Arched Portal Header
  const partWallBack = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.86, 1.35), wallMat);
  partWallBack.position.set(0, 0.95, -1.35);
  const partWallFront = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.86, 0.65), wallMat);
  partWallFront.position.set(0, 0.95, 1.75);
  const partWallHeader = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.42, 4.2), wallMat);
  partWallHeader.position.set(0, 1.66, 0);
  floor1Group.add(backWall1F, leftWall1F, partWallBack, partWallFront, partWallHeader);

  // Boiserie Wainscot Paneling, Baseboards & Crown Molding along 1F Walls
  const wainscotBack = new THREE.Mesh(new THREE.BoxGeometry(5.15, 0.54, 0.045), wainscotMat);
  wainscotBack.position.set(0, 0.31, -1.98);
  const wainscotLeft = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.54, 4.15), wainscotMat);
  wainscotLeft.position.set(-2.48, 0.31, 0);
  const crownBack1F = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.07, 0.08), wainscotMat);
  crownBack1F.position.set(0, 1.82, -1.98);
  floor1Group.add(wainscotBack, wainscotLeft, crownBack1F);

  // Recessed Boiserie Wall Moulding Frames on 1F Back Wall
  for (const bx of [-1.95, -0.95, 0.55, 2.05]) {
    const boiserie = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.34, 0.02), goldMat);
    boiserie.position.set(bx, 0.32, -1.95);
    floor1Group.add(boiserie);
  }

  // Tall Mullioned Windows with Silk Curtain Drapes & Gold Curtain Rods on 1F Back Wall
  for (const wx of [-1.45, 0.65, 2.02]) {
    const mw = createMullionedWindow(0.56, 0.92, goldMat, glowMat);
    mw.position.set(wx, 1.16, -1.96);
    const curtainRod = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.78, 6), goldMat);
    curtainRod.rotation.z = Math.PI / 2;
    curtainRod.position.set(wx, 1.68, -1.9);
    const drapeL = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.08, 1.05, 8), furnMat);
    drapeL.position.set(wx - 0.31, 1.14, -1.9);
    const drapeR = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.08, 1.05, 8), furnMat);
    drapeR.position.set(wx + 0.31, 1.14, -1.9);
    floor1Group.add(mw, curtainRod, drapeL, drapeR);
  }

  // --- ROOM 1 (1F Grand Hall, Left Wing): Grand Staircase with Balusters, Console, Clock & Centerpiece ---
  const stairGroup = new THREE.Group();
  for (let s = 0; s < 10; s++) {
    const stepY = 0.11 + s * 0.18;
    const stepZ = 1.2 - s * 0.25;
    const step = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.16, 0.26), woodMat);
    step.position.set(-2.05, stepY, stepZ);
    const runner = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.17, 0.27), furnMat);
    runner.position.set(-2.05, stepY + 0.005, stepZ);
    const stairRod = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.52, 6), goldMat);
    stairRod.rotation.z = Math.PI / 2;
    stairRod.position.set(-2.05, stepY + 0.08, stepZ + 0.12);
    // Turned Baluster on each step
    const baluster = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.36, 6), goldMat);
    baluster.position.set(-1.7, stepY + 0.24, stepZ);
    stairGroup.add(step, runner, stairRod, baluster);
  }
  // Angled Handrail & Carved Newel Post with Crystal Finial
  const handrail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 2.55), darkWoodMat);
  handrail.position.set(-1.7, 1.18, 0.08);
  handrail.rotation.x = 0.62;
  const newelPost = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.62, 0.12), darkWoodMat);
  newelPost.position.set(-1.7, 0.34, 1.32);
  const newelOrb = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), goldMat);
  newelOrb.position.set(-1.7, 0.68, 1.32);
  stairGroup.add(handrail, newelPost, newelOrb);
  floor1Group.add(stairGroup);

  // Tall Grandfather Clock with Pendulum Window & Dial + 2 Framed Portraits on Left Wall
  const clockCase = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.28, 0.26), darkWoodMat);
  clockCase.position.set(-0.48, 0.66, -1.82);
  const clockFace = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.04, 12), goldMat);
  clockFace.rotation.x = Math.PI / 2;
  clockFace.position.set(-0.48, 1.08, -1.68);
  const pendulum = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), goldMat);
  pendulum.position.set(-0.48, 0.58, -1.68);
  const hallPainting1 = createFramedPainting(0.65, 0.48, goldMat, accentMat, glowMat);
  hallPainting1.rotation.y = Math.PI / 2;
  hallPainting1.position.set(-2.46, 1.22, 1.35);
  const hallPainting2 = createFramedPainting(0.55, 0.44, goldMat, furnMat, glowMat);
  hallPainting2.rotation.y = Math.PI / 2;
  hallPainting2.position.set(-2.46, 1.22, -0.35);
  floor1Group.add(clockCase, clockFace, pendulum, hallPainting1, hallPainting2);

  // 1F Grand Hall Centerpiece (Theme-adaptive for 01..20 + Bespoke My World Interiors 21..32)
  if (idx === 2) {
    // Swan Lake Castle: Stepped Marble Dais, Golden Canopy Throne & Concert Harp
    const dais = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.2, 0.95), marbleFloorMat);
    dais.position.set(-1.05, 0.14, -1.22);
    const throne = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.88, 0.48), goldMat);
    throne.position.set(-1.05, 0.64, -1.32);
    const harpFrame = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.78, 4), goldMat);
    harpFrame.position.set(-0.75, 0.45, 0.35);
    floor1Group.add(dais, throne, harpFrame);
  } else if (idx === 6 || idx === 29) {
    // Kyoto Villa / Machiya (#29): Indoor Koi Stream, Tatami Tea Ceremony Mat, Iron Tetsubin & Tokonoma Scroll
    const koiStream = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.1, 0.65), waterMat);
    koiStream.position.set(-1.0, 0.08, 1.15);
    const tatami = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.045, 1.65), createLowPolyMat(0xc2b280));
    tatami.position.set(-1.0, 0.075, -0.15);
    const chabudai = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.18, 0.52), darkWoodMat);
    chabudai.position.set(-1.0, 0.17, -0.15);
    const tetsubin = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), darkIronMat);
    tetsubin.position.set(-1.0, 0.3, -0.15);
    const bonsaiPot = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.11, 0.1, 8), furnMat);
    bonsaiPot.position.set(-0.55, 0.14, -0.65);
    const bonsaiCrown = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 0), createLowPolyMat(0x15803d));
    bonsaiCrown.position.set(-0.55, 0.3, -0.65);
    floor1Group.add(koiStream, tatami, chabudai, tetsubin, bonsaiPot, bonsaiCrown);
  } else if (idx === 18) {
    // Marrakech Riad: Zellige Mosaic Courtyard Pool & Tiered Marble Star Fountain
    const riadPool = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.15, 1.95), waterMat);
    riadPool.position.set(-1.02, 0.12, 0.15);
    const starFountain = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.32, 0.28, 8), marbleFloorMat);
    starFountain.position.set(-1.02, 0.24, 0.15);
    floor1Group.add(riadPool, starFountain);
  } else if (idx === 20) {
    // Maldives Overwater Villa: Structural Glass-Bottom Floor Window with Coral & Tropical Fish underneath!
    const reefFrame = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.08, 1.55), goldMat);
    reefFrame.position.set(-1.02, 0.07, 0.15);
    const reefGlass = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.09, 1.42), glassMat);
    reefGlass.position.set(-1.02, 0.08, 0.15);
    for (const [fx, fz, fc] of [
      [-1.15, 0.05, 0xf43f5e],
      [-0.85, 0.35, 0xfbbf24],
      [-1.05, -0.25, 0x38bdf8],
    ]) {
      const fish = new THREE.Mesh(new THREE.OctahedronGeometry(0.08, 0), createLowPolyMat(fc));
      fish.position.set(fx, 0.05, fz);
      floor1Group.add(fish);
    }
    floor1Group.add(reefFrame, reefGlass);
  } else if (idx === 21) {
    // My World #1 Venice Palazzo: Indoor Water-Gate Slip, Mahogany Riva Speedboat & Barber-Pole Mooring
    const canalSlip = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.12, 2.15), waterMat);
    canalSlip.position.set(-0.98, 0.09, 0.28);
    const rivaHull = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.22, 1.42), createLowPolyMat(0x7c2d12, { roughness: 0.3 }));
    rivaHull.position.set(-0.98, 0.22, 0.28);
    const rivaDeck = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 0.65), creamMat);
    rivaDeck.position.set(-0.98, 0.34, 0.15);
    const rivaWindshield = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.18, 0.06), glassMat);
    rivaWindshield.rotation.x = -0.35;
    rivaWindshield.position.set(-0.98, 0.42, -0.15);
    const mooringPole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.95, 8), createLowPolyMat(0x1d4ed8));
    mooringPole.position.set(-0.42, 0.52, 0.85);
    floor1Group.add(canalSlip, rivaHull, rivaDeck, rivaWindshield, mooringPole);
  } else if (idx === 22) {
    // My World #2 Cotswolds Manor: Collector's Turntable with Vintage British Racing Green Roadster
    const turntable = new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.8, 0.08, 18), goldMat);
    turntable.position.set(-0.98, 0.1, 0.22);
    const carBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.24, 1.32),
      createLowPolyMat(0x064e3b, { metalness: 0.35, roughness: 0.35 })
    );
    carBody.position.set(-0.98, 0.28, 0.22);
    const carCockpit = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.12, 0.46), furnMat);
    carCockpit.position.set(-0.98, 0.42, 0.32);
    floor1Group.add(turntable, carBody, carCockpit);
  } else if (idx === 23) {
    // My World #3 Swiss Alps Zermatt: Alpine Ski & Ice-Axe Collector Rack + Panorama Train Display + Fondue Table
    const skiRack = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.95, 0.18), woodMat);
    skiRack.position.set(-0.98, 0.52, -0.65);
    for (const sx of [-1.22, -0.98, -0.74]) {
      const skiPair = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.12, 0.04), accentMat);
      skiPair.position.set(sx, 0.62, -0.54);
      floor1Group.add(skiPair);
    }
    const trainPlinth = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.32, 0.48), marbleFloorMat);
    trainPlinth.position.set(-0.98, 0.22, 0.48);
    const glacierModel = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.16, 0.22), accentMat);
    glacierModel.position.set(-0.98, 0.45, 0.48);
    floor1Group.add(skiRack, trainPlinth, glacierModel);
  } else if (idx === 24) {
    // My World #4 Hobbiton Bag End: Iconic Round Emerald-Green Wooden Interior Door with Central Brass Knob & Oak Ribs
    const roundDoorPortal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.62, 0.62, 0.12, 18),
      createLowPolyMat(0x16a34a, { roughness: 0.55 })
    );
    roundDoorPortal.rotation.z = Math.PI / 2;
    roundDoorPortal.position.set(-2.46, 0.78, 0.15);
    const centralKnob = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), goldMat);
    centralKnob.position.set(-2.36, 0.78, 0.15);
    const mapTable = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.4, 0.42, 12), woodMat);
    mapTable.position.set(-0.98, 0.26, 0.22);
    const redBook = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, 0.22), createLowPolyMat(0x991b1b));
    redBook.position.set(-0.88, 0.5, 0.22);
    const parchmentMap = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.03, 0.42), creamMat);
    parchmentMap.position.set(-0.98, 0.48, 0.22);
    floor1Group.add(roundDoorPortal, centralKnob, mapTable, parchmentMap, redBook);
  } else if (idx === 25) {
    // My World #5 Hogwarts: 18 Floating Enchanted Candles Suspended in Mid-Air + Sorting Hat & Hourglasses
    for (let c = 0; c < 18; c++) {
      const cx = -1.9 + (c % 6) * 0.68;
      const cz = -1.2 + Math.floor(c / 6) * 1.1;
      const cy = 1.48 + ((c * 7) % 4) * 0.12;
      const candleStick = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.24, 6), creamMat);
      candleStick.position.set(cx, cy, cz);
      const flame = new THREE.Mesh(new THREE.OctahedronGeometry(0.045, 0), glowMat);
      flame.position.set(cx, cy + 0.16, cz);
      floor1Group.add(candleStick, flame);
    }
    const sortingStool = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.36, 10), darkWoodMat);
    sortingStool.position.set(-0.98, 0.24, 0.22);
    const wizardHat = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.48, 7), woodMat);
    wizardHat.position.set(-0.98, 0.64, 0.22);
    floor1Group.add(sortingStool, wizardHat);
  } else if (idx === 26) {
    // My World #6 Green Gables: Anne's Puffed-Sleeve Dress Mannequin + Raspberry Cordial Tea Table + Apple Blossom Vase
    const braidedRug = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.03, 18), accentMat);
    braidedRug.position.set(-0.98, 0.075, 0.22);
    const teaTable = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.38, 0.44, 14), creamMat);
    teaTable.position.set(-0.98, 0.28, 0.22);
    const cordialBottle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.24, 8), createLowPolyMat(0xe11d48));
    cordialBottle.position.set(-1.08, 0.62, 0.22);
    const dressStand = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 0.68, 10), furnMat);
    dressStand.position.set(-0.55, 0.48, -0.65);
    floor1Group.add(braidedRug, teaTable, cordialBottle, dressStand);
  } else if (idx === 27) {
    // My World #7 The Secret Garden: Indoor Conservatory Waterlily Fountain + Golden Key Display Vitrine + Rose Arch
    const lilyBasin = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.72, 0.22, 16), marbleFloorMat);
    lilyBasin.position.set(-0.98, 0.16, 0.22);
    const lilyWater = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.24, 16), waterMat);
    lilyWater.position.set(-0.98, 0.17, 0.22);
    const keyPedestal = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.58, 0.32), marbleFloorMat);
    keyPedestal.position.set(-0.98, 0.42, -0.75);
    const keyCase = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.28), glassMat);
    keyCase.position.set(-0.98, 0.84, -0.75);
    const goldenKey = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.04), goldMat);
    goldenKey.position.set(-0.98, 0.84, -0.75);
    floor1Group.add(lilyBasin, lilyWater, keyPedestal, keyCase, goldenKey);
  } else if (idx === 28) {
    // My World #8 Pemberley Estate: Regency Marble Portrait Bust Sculpture Gallery (4 Fluted Pedestals + Busts)
    for (const [bx, bz] of [
      [-1.32, -0.45],
      [-0.65, -0.45],
      [-1.32, 0.65],
      [-0.65, 0.65],
    ]) {
      const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.56, 10), marbleFloorMat);
      ped.position.set(bx, 0.34, bz);
      const bustShoulders = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 0.14), creamMat);
      bustShoulders.position.set(bx, 0.68, bz);
      const bustHead = new THREE.Mesh(new THREE.SphereGeometry(0.095, 10, 10), creamMat);
      bustHead.position.set(bx, 0.84, bz);
      floor1Group.add(ped, bustShoulders, bustHead);
    }
  } else if (idx === 30) {
    // My World #10 Provence Stone Mas: French Oak Wine Barrel Rack + Copper Lavender Alembic Still + 2CV Model
    for (const bz of [-0.45, 0.05, 0.55]) {
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.48, 10), woodMat);
      barrel.rotation.z = Math.PI / 2;
      barrel.position.set(-1.15, 0.28, bz);
      floor1Group.add(barrel);
    }
    const copperStill = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 10, 10),
      createLowPolyMat(0xd97706, { metalness: 0.6, roughness: 0.28 })
    );
    copperStill.position.set(-0.62, 0.35, 0.22);
    const stillNeck = new THREE.Mesh(
      new THREE.ConeGeometry(0.12, 0.38, 8),
      createLowPolyMat(0xd97706, { metalness: 0.6, roughness: 0.28 })
    );
    stillNeck.position.set(-0.62, 0.65, 0.22);
    floor1Group.add(copperStill, stillNeck);
  } else if (idx === 31) {
    // My World #11 Amalfi & Como Villa: Mint-Green Vintage Vespa Scooter on Majolica Plinth + Lemon Tree Pot
    const vespaPlinth = new THREE.Mesh(new THREE.CylinderGeometry(0.64, 0.68, 0.08, 16), goldMat);
    vespaPlinth.position.set(-0.98, 0.1, 0.22);
    const vespaBody = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.34, 0.78), createLowPolyMat(0x34d399));
    vespaBody.position.set(-0.98, 0.3, 0.22);
    const vespaHandle = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 0.08), goldMat);
    vespaHandle.position.set(-0.98, 0.54, -0.05);
    const lemonPot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.13, 0.28, 10), createLowPolyMat(0xc2410c));
    lemonPot.position.set(-0.52, 0.2, -0.68);
    const lemonCrown = new THREE.Mesh(new THREE.DodecahedronGeometry(0.26, 0), createLowPolyMat(0x15803d));
    lemonCrown.position.set(-0.52, 0.52, -0.68);
    floor1Group.add(vespaPlinth, vespaBody, vespaHandle, lemonPot, lemonCrown);
  } else if (idx === 32) {
    // My World #12 Adriatic Seaside Bakery: Glowing Red-Brick Bread Oven + Glass Croissant Counter + Red Seaplane
    const brickOven = new THREE.Mesh(new THREE.BoxGeometry(0.88, 1.15, 0.68), createLowPolyMat(0x9a3412));
    brickOven.position.set(-1.05, 0.62, -0.82);
    const ovenMouth = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.34, 0.14), glowMat);
    ovenMouth.position.set(-1.05, 0.56, -0.45);
    const pastryCounter = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.42, 0.52), woodMat);
    pastryCounter.position.set(-0.95, 0.27, 0.45);
    const pastryGlass = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.28, 0.46), glassMat);
    pastryGlass.position.set(-0.95, 0.62, 0.45);
    for (const lx of [-1.25, -0.95, -0.65]) {
      const loaf = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), createLowPolyMat(0xd97706));
      loaf.scale.set(1.4, 0.7, 0.9);
      loaf.position.set(lx, 0.54, 0.45);
      floor1Group.add(loaf);
    }
    const seaplaneBody = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.14, 0.18), createLowPolyMat(0xdc2626));
    seaplaneBody.position.set(-0.98, 1.48, 0.25);
    const seaplaneWing = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.03, 0.88), createLowPolyMat(0xdc2626));
    seaplaneWing.position.set(-0.98, 1.54, 0.25);
    floor1Group.add(brickOven, ovenMouth, pastryCounter, pastryGlass, seaplaneBody, seaplaneWing);
  } else if (idx === 33) {
    // Castle Interior #1 (BD-141 Neuschwanstein): 12-Step White Carrara Marble Dais, Byzantine Gold Apse & Golden Swan Sculpture
    const marbleSteps = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.28, 1.05), marbleFloorMat);
    marbleSteps.position.set(-0.98, 0.18, -0.55);
    const goldApse = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.58, 1.25, 12, 1, false, 0, Math.PI), goldMat);
    goldApse.position.set(-0.98, 0.82, -0.82);
    const swanPedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 0.36, 12), marbleFloorMat);
    swanPedestal.position.set(-0.98, 0.22, 0.42);
    const royalSwan = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), creamMat);
    royalSwan.scale.set(1.4, 0.85, 0.9);
    royalSwan.position.set(-0.98, 0.52, 0.42);
    floor1Group.add(marbleSteps, goldApse, swanPedestal, royalSwan);
  } else if (idx === 34) {
    // Castle Interior #2 (BD-142 Mont-Saint-Michel): Gothic Double-Colonnade Cloister Archway & Medieval Illuminated Manuscript Desk
    for (const [cx, cz] of [
      [-1.38, -0.35],
      [-0.58, -0.35],
      [-1.38, 0.55],
      [-0.58, 0.55],
    ]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 1.18, 8), marbleFloorMat);
      col.position.set(cx, 0.65, cz);
      floor1Group.add(col);
    }
    const scriptDesk = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.48, 0.46), darkWoodMat);
    scriptDesk.position.set(-0.98, 0.3, 0.12);
    const manuscript = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.04, 0.26), goldMat);
    manuscript.position.set(-0.98, 0.56, 0.12);
    floor1Group.add(scriptDesk, manuscript);
  } else if (idx === 35) {
    // Castle Interior #3 (BD-143 Chenonceau): River-Arch Checkered Gallery Sculpture Pedestals & Copper Kitchen Pot Rack
    const copperRack = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.85, 0.24), darkIronMat);
    copperRack.position.set(-0.98, 0.52, -0.68);
    for (const px of [-1.25, -0.98, -0.71]) {
      const pot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 0.16, 10),
        createLowPolyMat(0xd97706, { metalness: 0.65, roughness: 0.25 })
      );
      pot.position.set(px, 0.55, -0.58);
      floor1Group.add(pot);
    }
    const bustPlinth = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.46, 12), marbleFloorMat);
    bustPlinth.position.set(-0.98, 0.28, 0.32);
    const mediciUrn = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.11, 0.35, 10), goldMat);
    mediciUrn.position.set(-0.98, 0.68, 0.32);
    floor1Group.add(copperRack, bustPlinth, mediciUrn);
  } else if (idx === 36) {
    // Castle Interior #4 (BD-144 Hohenzollern): Bulletproof Crystal Vitrine with Jeweled Prussian Royal Crown & Knight Armor
    const crownPedestal = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.56, 0.58), marbleFloorMat);
    crownPedestal.position.set(-0.98, 0.34, 0.18);
    const crownGlass = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.44, 0.48), glassMat);
    crownGlass.position.set(-0.98, 0.82, 0.18);
    const prussianCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.18, 10), goldMat);
    prussianCrown.position.set(-0.98, 0.78, 0.18);
    const armorStand = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.95, 8), darkIronMat);
    armorStand.position.set(-0.98, 0.54, -0.68);
    floor1Group.add(crownPedestal, crownGlass, prussianCrown, armorStand);
  } else if (idx === 37) {
    // Castle Interior #5 (BD-145 Himeji Castle): Raised Tatami Dais, Black-and-Gold Samurai O-Yoroi Armor & Katana Rack
    const samuraiDais = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.14, 1.35), createLowPolyMat(0xc2b280));
    samuraiDais.position.set(-0.98, 0.12, 0.12);
    const yoroiTorso = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.52, 0.28), darkIronMat);
    yoroiTorso.position.set(-0.98, 0.48, -0.15);
    const kabutoCrest = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.26, 4), goldMat);
    kabutoCrest.position.set(-0.98, 0.88, -0.15);
    const katanaStand = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.32, 0.16), darkWoodMat);
    katanaStand.position.set(-0.98, 0.32, 0.48);
    const goldByobu = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.95, 0.06), goldMat);
    goldByobu.position.set(-0.98, 0.65, -0.68);
    floor1Group.add(samuraiDais, yoroiTorso, kabutoCrest, katanaStand, goldByobu);
  } else if (idx === 38) {
    // Castle Interior #6 (BD-146 Segovia Alcázar): Twin Golden Thrones of Isabella & Ferdinand under Mudéjar Canopy
    const royalDais = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.18, 0.95), furnMat);
    royalDais.position.set(-0.98, 0.14, -0.35);
    for (const tx of [-1.22, -0.74]) {
      const throne = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.72, 0.34), goldMat);
      throne.position.set(tx, 0.56, -0.45);
      floor1Group.add(throne);
    }
    const mudejarCanopy = new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0), goldMat);
    mudejarCanopy.scale.set(1.4, 0.38, 1.1);
    mudejarCanopy.position.set(-0.98, 1.38, -0.35);
    floor1Group.add(royalDais, mudejarCanopy);
  } else if (idx === 39) {
    // Castle Interior #7 (BD-147 Eilean Donan): Scottish Highland Claymore Broadsword Stand & Single-Malt Whisky Oak Casks
    const whiskyCask1 = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.52, 10), woodMat);
    whiskyCask1.rotation.z = Math.PI / 2;
    whiskyCask1.position.set(-0.98, 0.3, -0.52);
    const claymorePlinth = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.42, 0.42), darkWoodMat);
    claymorePlinth.position.set(-0.98, 0.27, 0.28);
    const claymoreBlade = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.08, 0.04), goldMat);
    claymoreBlade.position.set(-0.98, 0.58, 0.28);
    floor1Group.add(whiskyCask1, claymorePlinth, claymoreBlade);
  } else if (idx === 40) {
    // Castle Interior #8 (BD-148 Prague Castle): Golden Astronomical Clock Zodiac Dial & Alchemical Copper Alembic
    const astroStand = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.45, 0.46, 12), darkWoodMat);
    astroStand.position.set(-0.98, 0.28, 0.22);
    const zodiacDial = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.08, 16), goldMat);
    zodiacDial.rotation.x = Math.PI / 3;
    zodiacDial.position.set(-0.98, 0.72, 0.22);
    const alembic = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), glassMat);
    alembic.position.set(-0.98, 0.58, -0.58);
    floor1Group.add(astroStand, zodiacDial, alembic);
  } else if (idx === 41) {
    // Castle Interior #9 (BD-149 Windsor Castle): Sovereign's Garter Throne & Golden State Coronation Coach Model
    const garterDais = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.18, 0.92), createLowPolyMat(0x1e3a8a));
    garterDais.position.set(-0.98, 0.14, -0.45);
    const garterThrone = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.82, 0.42), goldMat);
    garterThrone.position.set(-0.98, 0.62, -0.55);
    const coachPlinth = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.34, 0.48), marbleFloorMat);
    coachPlinth.position.set(-0.98, 0.23, 0.38);
    const goldCoach = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.28, 0.32), goldMat);
    goldCoach.position.set(-0.98, 0.54, 0.38);
    floor1Group.add(garterDais, garterThrone, coachPlinth, goldCoach);
  } else if (idx === 42) {
    // Castle Interior #10 (BD-150 Pena Palace Sintra): Blue-and-White Azulejo Tile Fountain & Age of Discovery Caravel Ship
    const azulejoBasin = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.64, 0.24, 8), createLowPolyMat(0x0284c7));
    azulejoBasin.position.set(-0.98, 0.18, 0.25);
    const caravelHull = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.22, 0.24), darkWoodMat);
    caravelHull.position.set(-0.98, 0.46, -0.55);
    const caravelSail = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.45, 0.04), creamMat);
    caravelSail.position.set(-0.98, 0.78, -0.55);
    floor1Group.add(azulejoBasin, caravelHull, caravelSail);
  } else {
    // Classic Round Reception Table on Medallion Rug with Gilded Urn & Floral Bouquet
    const foyerMedallion = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 0.025, 16), furnMat);
    foyerMedallion.position.set(-0.98, 0.07, 0.22);
    const foyerTable = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.36, 0.46, 14), darkWoodMat);
    foyerTable.position.set(-0.98, 0.28, 0.22);
    const urn = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.15, 0.3, 10), goldMat);
    urn.position.set(-0.98, 0.64, 0.22);
    const bouquet = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24, 0), accentMat);
    bouquet.position.set(-0.98, 0.88, 0.22);
    floor1Group.add(foyerMedallion, foyerTable, urn, bouquet);
  }

  const hallChandelier = createDetailedChandelier(goldMat, glowMat, glassMat, 0.35);
  hallChandelier.position.set(-1.05, 1.82, 0.15);
  floor1Group.add(hallChandelier);

  // --- ROOM 2 (1F Main Salon, Concert Piano, Gramophone & State Banquet Dining, Right Wing) ---
  // Carved Marble Fireplace Hearth with Pilasters, Logs, Fire, Brass Fender & Overmantel Mirror
  const hearthMantel = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.98, 0.38), marbleFloorMat);
  hearthMantel.position.set(1.35, 0.54, -1.8);
  const firebox = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.54, 0.24), darkIronMat);
  firebox.position.set(1.35, 0.32, -1.68);
  const fireGlow = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.34, 7), glowMat);
  fireGlow.position.set(1.35, 0.28, -1.62);
  const brassFender = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.08, 0.18), goldMat);
  brassFender.position.set(1.35, 0.1, -1.55);
  const overmantelMirror = createFramedPainting(0.78, 0.62, goldMat, glassMat, glowMat);
  overmantelMirror.position.set(1.35, 1.38, -1.94);
  floor1Group.add(hearthMantel, firebox, fireGlow, brassFender, overmantelMirror);

  // Persian Bordered Salon Carpet + Chesterfield Sofa with Throw Pillows + Wingback Armchairs + Tea Table
  const salonRugBorder = new THREE.Mesh(new THREE.BoxGeometry(2.12, 0.025, 1.72), goldMat);
  salonRugBorder.position.set(1.32, 0.068, -0.58);
  const salonRug = new THREE.Mesh(new THREE.BoxGeometry(1.96, 0.032, 1.56), furnMat);
  salonRug.position.set(1.32, 0.072, -0.58);

  const mainSofa = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.34, 0.52), furnMat);
  mainSofa.position.set(1.35, 0.24, -0.02);
  const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.54, 0.16), furnMat);
  sofaBack.position.set(1.35, 0.36, 0.18);
  const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.52, 8), furnMat);
  armL.rotation.x = Math.PI / 2;
  armL.position.set(0.72, 0.38, -0.02);
  const armR = armL.clone();
  armR.position.x = 1.98;
  for (const px of [0.95, 1.35, 1.75]) {
    const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.18, 0.08), goldMat);
    pillow.rotation.z = 0.2;
    pillow.position.set(px, 0.44, 0.06);
    floor1Group.add(pillow);
  }

  // Pair of Wingback Armchairs & Coffee Table with Tea Service Tray
  for (const ax of [0.58, 2.12]) {
    const chair = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.44, 0.38), accentMat);
    chair.position.set(ax, 0.28, -0.62);
    floor1Group.add(chair);
  }
  const coffeeTable = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.24, 0.46), goldMat);
  coffeeTable.position.set(1.35, 0.18, -0.62);
  const teaTray = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.02, 10), creamMat);
  teaTray.position.set(1.35, 0.31, -0.62);
  const teapot = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), goldMat);
  teapot.position.set(1.35, 0.37, -0.62);
  floor1Group.add(salonRugBorder, salonRug, mainSofa, sofaBack, armL, armR, coffeeTable, teaTray, teapot);

  // Concert Grand Piano in Left Corner of Salon (x = 0.52, z = -1.25)
  const grandPiano = createConcertGrandPiano(darkIronMat, goldMat, furnMat);
  grandPiano.scale.setScalar(0.72);
  grandPiano.rotation.y = 0.45;
  grandPiano.position.set(0.52, 0.06, -1.25);
  floor1Group.add(grandPiano);

  // Vintage Brass Horn Gramophone & Vinyl Record Cabinet (x = 2.25, z = -1.35)
  const gramCabinet = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.44, 0.34), darkWoodMat);
  gramCabinet.position.set(2.25, 0.28, -1.35);
  const gramTurntable = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 10), darkIronMat);
  gramTurntable.position.set(2.25, 0.52, -1.35);
  const gramHorn = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.28, 10), goldMat);
  gramHorn.rotation.z = 0.65;
  gramHorn.position.set(2.18, 0.68, -1.35);
  floor1Group.add(gramCabinet, gramTurntable, gramHorn);

  // Complete Formal 6-Seat Banquet Dining Table in Foreground Right (z = 1.18)
  const diningSet = createBanquetDiningSet(darkWoodMat, creamMat, furnMat, goldMat, glowMat, glassMat);
  diningSet.position.set(1.18, 0.06, 1.18);
  floor1Group.add(diningSet);

  // Gourmet Wine Cellar Rack & Espresso Sideboard Bar on Right Side of Dining Room (x = 2.32, z = 1.18)
  const wineCredenza = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.52, 1.15), darkWoodMat);
  wineCredenza.position.set(2.34, 0.32, 1.18);
  const marbleCounter = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.04, 1.18), marbleFloorMat);
  marbleCounter.position.set(2.34, 0.6, 1.18);
  const espressoMachine = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.24, 0.28), goldMat);
  espressoMachine.position.set(2.34, 0.74, 0.88);
  const decanter = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 8), glassMat);
  decanter.position.set(2.34, 0.68, 1.42);
  floor1Group.add(wineCredenza, marbleCounter, espressoMachine, decanter);

  const salonChandelier = createDetailedChandelier(goldMat, glowMat, glassMat, 0.36);
  salonChandelier.position.set(1.32, 1.82, -0.45);
  const diningChandelier = createDetailedChandelier(goldMat, glowMat, glassMat, 0.28);
  diningChandelier.position.set(1.18, 1.82, 1.18);
  floor1Group.add(salonChandelier, diningChandelier);

  root.add(floor1Group);

  // ==========================================================================
  // FLOOR 2 GROUP (userData.floorLevel = 2)
  // ==========================================================================
  const floor2Group = new THREE.Group();
  floor2Group.userData.floorLevel = 2;

  const floor2Slab = new THREE.Mesh(new THREE.BoxGeometry(5.24, 0.14, 2.92), floorMat);
  floor2Slab.position.set(0, 1.88, -0.65);
  const slabFascia = new THREE.Mesh(new THREE.BoxGeometry(5.28, 0.16, 0.06), goldMat);
  slabFascia.position.set(0, 1.88, 0.8);

  // Ornate Mezzanine Balustrade Railing overlooking 1F
  const railingBar = new THREE.Mesh(new THREE.BoxGeometry(5.05, 0.07, 0.08), goldMat);
  railingBar.position.set(0, 2.34, 0.76);
  floor2Group.add(floor2Slab, slabFascia, railingBar);

  for (let rx = -2.35; rx <= 2.35; rx += 0.32) {
    const baluster = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.4, 6), goldMat);
    baluster.position.set(rx, 2.13, 0.76);
    floor2Group.add(baluster);
  }

  // 2F Back Wall, Left Wall, Center Partition Wall & Wainscoting
  const backWall2F = new THREE.Mesh(new THREE.BoxGeometry(5.32, 1.68, 0.16), wallMat);
  backWall2F.position.set(0, 2.76, -2.08);
  const leftWall2F = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.68, 2.92), wallMat);
  leftWall2F.position.set(-2.58, 2.76, -0.65);
  const partWall2F = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.68, 2.25), wallMat);
  partWall2F.position.set(0, 2.76, -0.95);
  const wainscot2F = new THREE.Mesh(new THREE.BoxGeometry(5.15, 0.44, 0.045), wainscotMat);
  wainscot2F.position.set(0, 2.16, -1.98);
  floor2Group.add(backWall2F, leftWall2F, partWall2F, wainscot2F);

  // --- ROOM 3 (2F Master Bedchamber Suite, Upper Left): Canopy Bed, Pillows, Bench, Wardrobe & Vanity ---
  const bedRug = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.03, 1.85), accentMat);
  bedRug.position.set(-1.25, 1.96, -0.95);
  const bedBase = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.3, 1.48), darkWoodMat);
  bedBase.position.set(-1.25, 2.12, -1.12);
  const mattress = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.18, 1.38), creamMat);
  mattress.position.set(-1.25, 2.34, -1.12);
  const duvet = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.19, 0.92), furnMat);
  duvet.position.set(-1.25, 2.36, -0.88);
  const headboard = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.92, 0.14), goldMat);
  headboard.position.set(-1.25, 2.45, -1.82);

  // 4 Layered Silk Pillows + Foot-of-Bed Upholstered Bench
  for (const px of [-1.52, -1.25, -0.98]) {
    const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.2), creamMat);
    pillow.rotation.x = 0.28;
    pillow.position.set(px, 2.48, -1.62);
    floor2Group.add(pillow);
  }
  const footBench = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.24, 0.32), furnMat);
  footBench.position.set(-1.25, 2.08, -0.25);
  floor2Group.add(bedRug, bedBase, mattress, duvet, headboard, footBench);

  // Four-Poster Canopy Frame with Corner Curtain Swags
  for (const [px, pz] of [
    [-1.85, -1.8],
    [-0.65, -1.8],
    [-1.85, -0.44],
    [-0.65, -0.44],
  ]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 1.28, 8), darkWoodMat);
    post.position.set(px, 2.6, pz);
    const swag = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.075, 0.95, 8), furnMat);
    swag.position.set(px, 2.55, pz);
    floor2Group.add(post, swag);
  }
  const canopyTop = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.09, 1.46), furnMat);
  canopyTop.position.set(-1.25, 3.24, -1.12);
  const canopyTrim = new THREE.Mesh(new THREE.BoxGeometry(1.34, 0.04, 1.5), goldMat);
  canopyTrim.position.set(-1.25, 3.27, -1.12);
  floor2Group.add(canopyTop, canopyTrim);

  // Nightstands with Lamps + Gilded Dressing Vanity Table & Mirror + Mahogany Wardrobe Armoire on Left Wall
  for (const nx of [-2.12, -0.38]) {
    const stand = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.36, 0.32), darkWoodMat);
    stand.position.set(nx, 2.14, -1.7);
    const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.14, 6), goldMat);
    lampBase.position.set(nx, 2.38, -1.7);
    const lampShade = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.2, 8), glowMat);
    lampShade.position.set(nx, 2.5, -1.7);
    floor2Group.add(stand, lampBase, lampShade);
  }

  const wardrobe = new THREE.Mesh(new THREE.BoxGeometry(0.36, 1.22, 0.68), darkWoodMat);
  wardrobe.position.set(-2.32, 2.56, -1.28);
  const wardrobeTrim = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.06, 0.72), goldMat);
  wardrobeTrim.position.set(-2.32, 3.18, -1.28);
  const vanityTable = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.42, 0.68), creamMat);
  vanityTable.position.set(-2.3, 2.16, -0.35);
  const vanityMirror = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.04, 12), goldMat);
  vanityMirror.rotation.z = Math.PI / 2;
  vanityMirror.position.set(-2.45, 2.64, -0.35);
  floor2Group.add(wardrobe, wardrobeTrim, vanityTable, vanityMirror);

  // --- ROOM 4 (2F Aristocratic Library, Life Memories Vitrine, Telescope & Luxury Spa Bath, Upper Right) ---
  // Multi-Bay Bookcase with Individual Colorful Book Spines + Rolling Library Ladder
  const bookcase = new THREE.Mesh(new THREE.BoxGeometry(1.52, 1.42, 0.28), darkWoodMat);
  bookcase.position.set(0.95, 2.66, -1.84);
  floor2Group.add(bookcase);
  for (let row = 0; row < 4; row++) {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.44, 0.03, 0.29), goldMat);
    shelf.position.set(0.95, 2.1 + row * 0.34, -1.83);
    const books = new THREE.Mesh(
      new THREE.BoxGeometry(1.36, 0.22, 0.28),
      row % 2 === 0 ? furnMat : accentMat
    );
    books.position.set(0.95, 2.23 + row * 0.34, -1.82);
    floor2Group.add(shelf, books);
  }
  // Rolling Library Ladder leaning against Bookcase
  for (const lx of [1.28, 1.44]) {
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 1.38, 6), goldMat);
    rail.rotation.x = -0.22;
    rail.position.set(lx, 2.62, -1.56);
    floor2Group.add(rail);
  }

  // Illuminated "Life Memories & Trophy Vitrine" (人生记忆与藏品水晶展柜) next to Bookcase (x = 2.12, z = -1.78)
  const memoryCabinetBase = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.42, 0.32), darkWoodMat);
  memoryCabinetBase.position.set(2.12, 2.16, -1.78);
  const memoryGlassCase = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.88, 0.28), glassMat);
  memoryGlassCase.position.set(2.12, 2.81, -1.78);
  const memoryCrown = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.06, 0.34), goldMat);
  memoryCrown.position.set(2.12, 3.28, -1.78);
  const memoryTrophy = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.04, 0.22, 8), goldMat);
  memoryTrophy.position.set(1.98, 2.52, -1.78);
  const memoryOrb = new THREE.Mesh(new THREE.OctahedronGeometry(0.085, 0), glowMat);
  memoryOrb.position.set(2.24, 2.88, -1.78);
  floor2Group.add(memoryCabinetBase, memoryGlassCase, memoryCrown, memoryTrophy, memoryOrb);

  // Executive Partners Desk with Banker's Lamp, Open Book, Terrestrial Globe & Brass Telescope
  const studyDesk = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.38, 0.5), darkWoodMat);
  studyDesk.position.set(0.78, 2.15, -0.72);
  const deskChair = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.48, 0.32), furnMat);
  deskChair.position.set(0.78, 2.2, -1.12);
  const deskLamp = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 8), glowMat);
  deskLamp.position.set(0.55, 2.44, -0.72);
  const globeSphere = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), accentMat);
  globeSphere.position.set(0.28, 2.38, -1.45);
  const globeStand = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.1, 0.28, 8), goldMat);
  globeStand.position.set(0.28, 2.12, -1.45);
  const telescopeTube = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.055, 0.52, 8), goldMat);
  telescopeTube.rotation.x = 1.15;
  telescopeTube.position.set(0.35, 2.48, 0.32);
  const telescopeTripod = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.46, 4), darkWoodMat);
  telescopeTripod.position.set(0.35, 2.18, 0.32);
  floor2Group.add(studyDesk, deskChair, deskLamp, globeSphere, globeStand, telescopeTube, telescopeTripod);

  // Luxury En-Suite Freestanding Clawfoot / Marble Bathtub with Gold Gooseneck Faucet
  const luxuryTub = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.38, 0.38, 14), marbleFloorMat);
  luxuryTub.scale.set(1.36, 1, 0.85);
  luxuryTub.position.set(1.94, 2.15, -0.68);
  const tubWater = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.35, 0.39, 14), waterMat);
  tubWater.scale.set(1.32, 1, 0.82);
  tubWater.position.set(1.94, 2.16, -0.68);
  const faucetPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.55, 6), goldMat);
  faucetPipe.position.set(2.38, 2.25, -0.68);
  floor2Group.add(luxuryTub, tubWater, faucetPipe);

  const suiteChandelier = createDetailedChandelier(goldMat, glowMat, glassMat, 0.28);
  suiteChandelier.position.set(-1.25, 3.48, -0.95);
  const studyChandelier = createDetailedChandelier(goldMat, glowMat, glassMat, 0.28);
  studyChandelier.position.set(1.25, 3.48, -0.95);
  floor2Group.add(suiteChandelier, studyChandelier);

  root.add(floor2Group);

  // ==========================================================================
  // ROOF / ATTIC CROWN CORNICE GROUP (userData.floorLevel = 3, isRoof = true)
  // ==========================================================================
  const roofGroup = new THREE.Group();
  roofGroup.userData.floorLevel = 3;
  roofGroup.userData.isRoof = true;

  const corniceBack = new THREE.Mesh(new THREE.BoxGeometry(5.42, 0.26, 0.48), wainscotMat);
  corniceBack.position.set(0, 3.66, -2.02);
  const corniceLeft = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.26, 3.0), wainscotMat);
  corniceLeft.position.set(-2.52, 3.66, -0.65);
  const pediment = new THREE.Mesh(new THREE.ConeGeometry(1.52, 0.68, 4), goldMat);
  pediment.rotation.y = Math.PI / 4;
  pediment.scale.set(1.42, 1, 0.36);
  pediment.position.set(0, 4.12, -2.02);
  roofGroup.add(corniceBack, corniceLeft, pediment);

  root.add(roofGroup);

  addShadows(root);
  return root;
}
