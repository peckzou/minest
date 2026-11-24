import * as THREE from 'three';
import {
  createAnimationDiscTexture,
  createBlueprintTexture,
  createCorkboardTexture,
  createDraftingMatTexture,
  createHerbRymanAerialTexture,
  createOfficeRugTexture,
  createOscilloscopeTexture,
  createPegboardToolTexture,
  createRulerTexture,
  createStudioFloorTexture,
  createWaltsFloridaSecretMapTexture,
  createWaltsSteamboatCelTexture,
} from './proceduralTextures';
import { BlueprintId } from '../types/studio';

export interface WorkshopRefs {
  root: THREE.Group;
  draftingBoardGroup: THREE.Group;
  draftingTiltGroup: THREE.Group;
  mainBlueprintMesh: THREE.Mesh;
  wallBlueprintMesh: THREE.Mesh;
  tSquareGroup: THREE.Group;
  triangleRulerGroup: THREE.Group;
  compassGroup: THREE.Group;
  draftingLampBulbMat: THREE.MeshStandardMaterial;
  draftingSpotLight: THREE.SpotLight;
  waltDeskLampBulbMat: THREE.MeshStandardMaterial;
  waltDeskSpotLight: THREE.SpotLight;
  waltDeskPointLight: THREE.PointLight;
  animatronicGears: THREE.Mesh[];
  animatronicBirdGroup: THREE.Group;
  littleManGroup: THREE.Group;
  tapeReels: THREE.Mesh[];
  lillyBelleWheels: THREE.Group[];
  multiplaneLayers: THREE.Group[];
  clockMinuteHand: THREE.Mesh;
  imagineerHeadGroup: THREE.Group;
  waltsMusicBoxRotor: THREE.Group;
  clickablePickTargets: THREE.Object3D[];
}

export function buildImagineerWorkshop(
  maxAnisotropy: number,
  isSoftwareGl: boolean,
  initialBlueprint: BlueprintId
): WorkshopRefs {
  const root = new THREE.Group();
  const clickablePickTargets: THREE.Object3D[] = [];
  const animatronicGears: THREE.Mesh[] = [];
  const tapeReels: THREE.Mesh[] = [];
  const lillyBelleWheels: THREE.Group[] = [];
  const multiplaneLayers: THREE.Group[] = [];

  // Shared PBR Materials (varied roughness & metalness >= 0.25 difference between parts)
  const oakWoodMat = new THREE.MeshStandardMaterial({
    color: 0x6f4729,
    roughness: 0.68,
    metalness: 0.05,
  });
  const birchWoodMat = new THREE.MeshStandardMaterial({
    color: 0x9b6b43,
    roughness: 0.58,
    metalness: 0.06,
  });
  const darkWalnutMat = new THREE.MeshStandardMaterial({
    color: 0x3d2514,
    roughness: 0.55,
    metalness: 0.08,
  });
  const californiaRedwoodMat = new THREE.MeshPhysicalMaterial({
    color: 0x7a3421,
    roughness: 0.36,
    metalness: 0.08,
    clearcoat: 0.65,
  });
  const ebonyPianoMat = new THREE.MeshPhysicalMaterial({
    color: 0x121417,
    roughness: 0.16,
    metalness: 0.15,
    clearcoat: 0.95,
  });
  const oxbloodLeatherMat = new THREE.MeshStandardMaterial({
    color: 0x5c1922,
    roughness: 0.45,
    metalness: 0.08,
  });
  const oscarGoldMat = new THREE.MeshPhysicalMaterial({
    color: 0xffcf40,
    roughness: 0.14,
    metalness: 0.98,
    clearcoat: 0.85,
  });
  const castIronMat = new THREE.MeshStandardMaterial({
    color: 0x22262b,
    roughness: 0.45,
    metalness: 0.82,
  });
  const machineGreyMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.38,
    metalness: 0.72,
  });
  const brushedBrassMat = new THREE.MeshPhysicalMaterial({
    color: 0xe3b448,
    roughness: 0.22,
    metalness: 0.92,
    clearcoat: 0.4,
  });
  const chromeSteelMat = new THREE.MeshStandardMaterial({
    color: 0xd8dee9,
    roughness: 0.18,
    metalness: 0.95,
  });
  const enamelGreenMat = new THREE.MeshPhysicalMaterial({
    color: 0x1b5e43,
    roughness: 0.2,
    metalness: 0.25,
    clearcoat: 0.85,
  });
  const shopRedMat = new THREE.MeshPhysicalMaterial({
    color: 0xb91c1c,
    roughness: 0.28,
    metalness: 0.35,
    clearcoat: 0.7,
  });
  const amberCelluloidMat = new THREE.MeshPhysicalMaterial({
    color: 0xf59e0b,
    roughness: 0.12,
    metalness: 0.0,
    transmission: isSoftwareGl ? 0 : 0.82,
    transparent: true,
    opacity: isSoftwareGl ? 0.58 : 0.92,
    ior: 1.49,
    clearcoat: 1.0,
  });
  const vellumPaperMat = new THREE.MeshStandardMaterial({
    color: 0xf4ebd6,
    roughness: 0.82,
    metalness: 0.0,
  });

  // ============================================================================
  // 1. STUDIO FLOOR, WALLS, ROOF TRUSSES & BURBANK STUDIO CLOCK
  // ============================================================================
  const floorTex = createStudioFloorTexture(maxAnisotropy);
  const floorMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(26, 22),
    new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.62,
      metalness: 0.05,
    })
  );
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.receiveShadow = true;
  root.add(floorMesh);

  // Subtle Studio Grid Overlay on Floor (PolygonOffset to prevent Z-fighting)
  const studioGridMat = new THREE.MeshBasicMaterial({
    color: 0xd4a857,
    transparent: true,
    opacity: 0.06,
    wireframe: true,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const studioGridFloor = new THREE.Mesh(new THREE.PlaneGeometry(24, 19, 24, 19), studioGridMat);
  studioGridFloor.rotation.x = -Math.PI / 2;
  studioGridFloor.position.y = 0.015;
  root.add(studioGridFloor);

  // North Studio Back Wall (Warm Architectural Slate & Timber Wainscoting)
  const backWallGroup = new THREE.Group();
  backWallGroup.position.set(0, 0, -6.2);

  const upperWallMat = new THREE.MeshStandardMaterial({
    color: 0x1e2836,
    roughness: 0.85,
    metalness: 0.05,
  });
  const upperWall = new THREE.Mesh(new THREE.BoxGeometry(26, 7.5, 0.3), upperWallMat);
  upperWall.position.set(0, 3.75, 0);
  upperWall.receiveShadow = true;
  backWallGroup.add(upperWall);

  // Timber Wainscoting Lower Dado Rail
  const wainscot = new THREE.Mesh(new THREE.BoxGeometry(26, 1.5, 0.38), darkWalnutMat);
  wainscot.position.set(0, 0.75, 0.04);
  wainscot.receiveShadow = true;
  backWallGroup.add(wainscot);

  // Vintage 1950s Red-Rimmed Burbank Studio Wall Clock on North Wall
  const clockGroup = new THREE.Group();
  clockGroup.position.set(-0.25, 5.55, 0.18);
  const clockRim = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.1, 24), shopRedMat);
  clockRim.rotation.x = Math.PI / 2;
  clockGroup.add(clockRim);

  const clockFace = new THREE.Mesh(
    new THREE.CylinderGeometry(0.36, 0.36, 0.11, 24),
    vellumPaperMat
  );
  clockFace.rotation.x = Math.PI / 2;
  clockGroup.add(clockFace);

  const clockHourHand = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.2, 0.02), castIronMat);
  clockHourHand.position.set(0.05, 0.04, 0.07);
  clockHourHand.rotation.z = -0.8;
  clockGroup.add(clockHourHand);

  const clockMinuteHand = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.28, 0.02), castIronMat);
  clockMinuteHand.position.set(0, 0, 0.075);
  clockGroup.add(clockMinuteHand);
  backWallGroup.add(clockGroup);

  // Classic WED Enterprises Studio Door with Frosted Transom Window (Far Left of North Wall)
  const studioDoorGroup = new THREE.Group();
  studioDoorGroup.position.set(-8.6, 0, 0.18);
  const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.75, 3.6, 0.14), darkWalnutMat);
  doorFrame.position.y = 1.8;
  studioDoorGroup.add(doorFrame);

  const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(1.52, 3.42, 0.16), oakWoodMat);
  doorPanel.position.y = 1.71;
  studioDoorGroup.add(doorPanel);

  const doorGlass = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 1.15, 0.18),
    new THREE.MeshPhysicalMaterial({
      color: 0xfef3c7,
      roughness: 0.35,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.25,
    })
  );
  doorGlass.position.y = 2.45;
  studioDoorGroup.add(doorGlass);

  const doorHandle = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), brushedBrassMat);
  doorHandle.position.set(0.58, 1.45, 0.12);
  studioDoorGroup.add(doorHandle);
  backWallGroup.add(studioDoorGroup);

  // West Industrial Studio Window Wall (Left side casting warm California sunlight)
  const westWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 7.5, 22), upperWallMat);
  westWall.position.set(-11.4, 3.75, 0.8);
  westWall.receiveShadow = true;
  root.add(westWall);

  // East Workshop Masonry Partition Wall (Framing the Animatronics & Machine Shop Bays)
  const eastWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 7.5, 22), upperWallMat);
  eastWall.position.set(10.5, 3.75, 0.8);
  eastWall.receiveShadow = true;
  root.add(eastWall);

  const eastWainscot = new THREE.Mesh(new THREE.BoxGeometry(0.38, 1.5, 22), darkWalnutMat);
  eastWainscot.position.set(10.45, 0.75, 0.8);
  root.add(eastWainscot);

  // Overhead Sawtooth Factory Steel Roof Trusses & Track Spotlights
  [-4.2, 0.4, 4.8].forEach((tz) => {
    const trussBeam = new THREE.Mesh(new THREE.BoxGeometry(22, 0.22, 0.18), castIronMat);
    trussBeam.position.set(-0.4, 6.85, tz);
    root.add(trussBeam);

    // Suspended Industrial Enamel Barn-Door Track Lamps
    [-4.5, 0.8, 5.5].forEach((lx) => {
      const dropRod = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.65, 8), castIronMat);
      dropRod.position.set(lx, 6.5, tz);
      root.add(dropRod);

      const hood = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.26, 12), enamelGreenMat);
      hood.position.set(lx, 6.15, tz);
      root.add(hood);
    });
  });

  // Industrial Steel Window Panes on West Wall
  const windowGlowMat = new THREE.MeshBasicMaterial({
    color: 0xffefc2,
    transparent: true,
    opacity: 0.35,
  });
  for (let wz = -4.5; wz <= 3.5; wz += 4.0) {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.18, 4.0, 3.2), castIronMat);
    frame.position.set(-11.22, 4.1, wz);
    root.add(frame);

    const glassPane = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 3.8), windowGlowMat);
    glassPane.rotation.y = Math.PI / 2;
    glassPane.position.set(-11.12, 4.1, wz);
    root.add(glassPane);
  }

  root.add(backWallGroup);

  // ============================================================================
  // 2. STATION 1: VINTAGE TILT-TOP IMAGINEERING DRAFTING BOARD (复古绘图板)
  // Positioned at Foreground Left (-5.2, 0, 1.85), angled slightly toward center
  // ============================================================================
  const draftingBoardGroup = new THREE.Group();
  draftingBoardGroup.position.set(-5.2, 0, 1.85);
  draftingBoardGroup.rotation.y = 0.42;

  // A-Frame Heavy Oak Trestle Legs (Left & Right)
  [-1.25, 1.25].forEach((lx) => {
    const frontLeg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.15, 0.14), oakWoodMat);
    frontLeg.position.set(lx, 1.05, 0.52);
    frontLeg.rotation.x = -0.18;
    frontLeg.castShadow = true;
    draftingBoardGroup.add(frontLeg);

    const backLeg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.35, 0.14), oakWoodMat);
    backLeg.position.set(lx, 1.15, -0.52);
    backLeg.rotation.x = 0.18;
    backLeg.castShadow = true;
    draftingBoardGroup.add(backLeg);

    // Trestle Foot Base
    const footShoe = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 1.45), darkWalnutMat);
    footShoe.position.set(lx, 0.04, 0);
    footShoe.castShadow = true;
    draftingBoardGroup.add(footShoe);

    // Brass Tilt Handwheel on Side of Trestle
    const wheelRing = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.025, 8, 20), brushedBrassMat);
    wheelRing.rotation.y = Math.PI / 2;
    wheelRing.position.set(lx + (lx > 0 ? 0.12 : -0.12), 1.82, 0);
    draftingBoardGroup.add(wheelRing);

    const wheelHub = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.18, 12), brushedBrassMat);
    wheelHub.rotation.z = Math.PI / 2;
    wheelHub.position.set(lx + (lx > 0 ? 0.08 : -0.08), 1.82, 0);
    draftingBoardGroup.add(wheelHub);
  });

  // Cast-Iron Footrest Crossbar & Oak Under-Shelf for Blueprint Rolls
  const footBar = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.6, 12), castIronMat);
  footBar.rotation.z = Math.PI / 2;
  footBar.position.set(0, 0.45, 0.42);
  draftingBoardGroup.add(footBar);

  const underShelf = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.06, 0.48), oakWoodMat);
  underShelf.position.set(0, 0.95, -0.15);
  underShelf.castShadow = true;
  draftingBoardGroup.add(underShelf);

  // Rolled Blueprint Tubes resting on the under-shelf
  [-0.7, -0.25, 0.3, 0.75].forEach((rx, idx) => {
    const rollTube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.055, 0.85, 14),
      idx % 2 === 0 ? vellumPaperMat : new THREE.MeshStandardMaterial({ color: 0x164278, roughness: 0.7 })
    );
    rollTube.rotation.z = Math.PI / 2;
    rollTube.rotation.y = (idx - 1.5) * 0.08;
    rollTube.position.set(rx, 1.03, -0.15);
    draftingBoardGroup.add(rollTube);
  });

  // Tilted Drafting Tabletop Assembly (Pivots at y = 2.04)
  const draftingTiltGroup = new THREE.Group();
  draftingTiltGroup.position.set(0, 2.04, 0);
  draftingTiltGroup.rotation.x = 0.34;
  draftingBoardGroup.add(draftingTiltGroup);

  const boardSlab = new THREE.Mesh(new THREE.BoxGeometry(3.25, 0.1, 2.25), oakWoodMat);
  boardSlab.castShadow = true;
  boardSlab.receiveShadow = true;
  draftingTiltGroup.add(boardSlab);

  [
    [-1.58, -1.08],
    [1.58, -1.08],
    [-1.58, 1.08],
    [1.58, 1.08],
  ].forEach(([cx, cz]) => {
    const cornerBracket = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.115, 0.14), brushedBrassMat);
    cornerBracket.position.set(cx, 0, cz);
    draftingTiltGroup.add(cornerBracket);
  });

  // Vintage Green Self-Healing Linoleum Drafting Mat
  const draftingMatTex = createDraftingMatTexture(maxAnisotropy);
  const draftingMatMesh = new THREE.Mesh(
    new THREE.BoxGeometry(3.05, 0.02, 2.05),
    new THREE.MeshStandardMaterial({
      map: draftingMatTex,
      roughness: 0.58,
      metalness: 0.04,
    })
  );
  draftingMatMesh.position.set(-0.08, 0.06, 0);
  draftingMatMesh.receiveShadow = true;
  draftingTiltGroup.add(draftingMatMesh);

  // Main Spread-Out Cyanotype Blueprint Sheet on the Drafting Board
  const initialBpTex = createBlueprintTexture(initialBlueprint, maxAnisotropy, 'cyanotype');
  const mainBlueprintMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2.35, 1.62),
    new THREE.MeshStandardMaterial({
      map: initialBpTex,
      roughness: 0.65,
      metalness: 0.05,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    })
  );
  mainBlueprintMesh.rotation.x = -Math.PI / 2;
  mainBlueprintMesh.position.set(-0.15, 0.075, -0.02);
  mainBlueprintMesh.receiveShadow = true;
  draftingTiltGroup.add(mainBlueprintMesh);

  // Secondary Tracing Vellum Sheet Partially Tucked Under Top-Left
  const vellumOverlayTex = createBlueprintTexture('master-plan', maxAnisotropy, 'vellum');
  const vellumSheet = new THREE.Mesh(
    new THREE.PlaneGeometry(1.15, 0.82),
    new THREE.MeshStandardMaterial({
      map: vellumOverlayTex,
      roughness: 0.72,
      transparent: true,
      opacity: 0.9,
    })
  );
  vellumSheet.rotation.x = -Math.PI / 2;
  vellumSheet.rotation.z = 0.14;
  vellumSheet.position.set(-0.88, 0.072, -0.45);
  draftingTiltGroup.add(vellumSheet);

  // Parallel Rule & Sliding Walnut/Brass T-Square (丁字尺)
  const tSquareGroup = new THREE.Group();
  tSquareGroup.position.set(-0.12, 0.095, 0.22);
  const rulerTex = createRulerTexture(maxAnisotropy);
  const tSquareBlade = new THREE.Mesh(
    new THREE.BoxGeometry(2.75, 0.018, 0.11),
    new THREE.MeshStandardMaterial({
      map: rulerTex,
      roughness: 0.35,
      metalness: 0.45,
    })
  );
  tSquareBlade.castShadow = true;
  tSquareGroup.add(tSquareBlade);

  const tSquareHead = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.045, 0.68), darkWalnutMat);
  tSquareHead.position.set(-1.38, 0, 0);
  tSquareHead.castShadow = true;
  tSquareGroup.add(tSquareHead);

  [-0.2, 0, 0.2].forEach((rz) => {
    const rivet = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.052, 10), brushedBrassMat);
    rivet.position.set(-1.38, 0, rz);
    tSquareGroup.add(rivet);
  });
  draftingTiltGroup.add(tSquareGroup);

  // Translucent Amber Celluloid Triangle Rulers (45° & 30°-60° 复古赛璐珞三角板)
  const triangleRulerGroup = new THREE.Group();
  triangleRulerGroup.position.set(-0.32, 0.11, -0.05);

  const triShape = new THREE.Shape();
  triShape.moveTo(0, 0);
  triShape.lineTo(0.62, 0);
  triShape.lineTo(0, 0.62);
  triShape.closePath();

  const innerHole = new THREE.Path();
  innerHole.moveTo(0.1, 0.1);
  innerHole.lineTo(0.38, 0.1);
  innerHole.lineTo(0.1, 0.38);
  innerHole.closePath();
  triShape.holes.push(innerHole);

  const triGeo = new THREE.ExtrudeGeometry(triShape, {
    depth: 0.014,
    bevelEnabled: true,
    bevelSize: 0.003,
    bevelThickness: 0.003,
    bevelSegments: 2,
  });
  triGeo.rotateX(Math.PI / 2);
  const triangleMesh = new THREE.Mesh(triGeo, amberCelluloidMat);
  triangleMesh.castShadow = true;
  triangleRulerGroup.add(triangleMesh);
  draftingTiltGroup.add(triangleRulerGroup);

  // Precision Brass Drafting Compass & Dividers (黄铜分规与圆规)
  const compassGroup = new THREE.Group();
  compassGroup.position.set(0.55, 0.095, -0.32);
  compassGroup.rotation.y = -0.52;

  const compassHinge = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 12), brushedBrassMat);
  compassGroup.add(compassHinge);

  const leg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.004, 0.42, 8), brushedBrassMat);
  leg1.rotation.x = Math.PI / 2;
  leg1.rotation.z = -0.22;
  leg1.position.set(-0.05, 0, 0.2);
  compassGroup.add(leg1);

  const leg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.004, 0.42, 8), brushedBrassMat);
  leg2.rotation.x = Math.PI / 2;
  leg2.rotation.z = 0.22;
  leg2.position.set(0.05, 0, 0.2);
  compassGroup.add(leg2);
  draftingTiltGroup.add(compassGroup);

  // Right-Side Pencil Tray, Ceramic Pencil Cup, Colored Pencils, Ink Bottle & Eraser
  const toolCaddyGroup = new THREE.Group();
  toolCaddyGroup.position.set(1.32, 0.08, 0);

  const pencilTray = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.04, 1.85), darkWalnutMat);
  pencilTray.castShadow = true;
  toolCaddyGroup.add(pencilTray);

  const inkBottle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.075, 0.085, 0.14, 12),
    new THREE.MeshPhysicalMaterial({ color: 0x111827, roughness: 0.15, clearcoat: 1.0 })
  );
  inkBottle.position.set(0, 0.09, -0.58);
  toolCaddyGroup.add(inkBottle);

  const inkCap = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.05, 10), brushedBrassMat);
  inkCap.position.set(0, 0.175, -0.58);
  toolCaddyGroup.add(inkCap);

  const mugMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.095, 0.08, 0.22, 16),
    new THREE.MeshStandardMaterial({ color: 0xd97724, roughness: 0.35 })
  );
  mugMesh.position.set(0, 0.13, 0.45);
  mugMesh.castShadow = true;
  toolCaddyGroup.add(mugMesh);

  const pencilColors = [0xd93829, 0x2563eb, 0xf59e0b, 0x10b981];
  pencilColors.forEach((pCol, idx) => {
    const pencil = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.32, 6),
      new THREE.MeshStandardMaterial({ color: pCol, roughness: 0.4 })
    );
    pencil.position.set((idx - 1.5) * 0.025, 0.26, 0.45 + (idx % 2 === 0 ? 0.02 : -0.02));
    pencil.rotation.z = (idx - 1.5) * 0.14;
    pencil.rotation.x = (idx % 2 === 0 ? 1 : -1) * 0.1;
    toolCaddyGroup.add(pencil);
  });

  const eraser = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.035, 0.07),
    new THREE.MeshStandardMaterial({ color: 0xe07a7a, roughness: 0.75 })
  );
  eraser.position.set(-0.45, 0.025, 0.68);
  eraser.rotation.y = 0.35;
  toolCaddyGroup.add(eraser);

  draftingTiltGroup.add(toolCaddyGroup);

  // Articulated Dual-Arm Pantograph Drafting Lamp (复古双臂万向绿罩台灯)
  const lampGroup = new THREE.Group();
  lampGroup.position.set(-1.38, 0.06, -0.95);

  const clampBase = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.16), castIronMat);
  lampGroup.add(clampBase);

  const lowerArm = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.85, 10), chromeSteelMat);
  lowerArm.position.set(0.12, 0.38, 0.1);
  lowerArm.rotation.z = -0.32;
  lowerArm.rotation.x = 0.22;
  lampGroup.add(lowerArm);

  const elbowJoint = new THREE.Mesh(new THREE.SphereGeometry(0.042, 12, 12), brushedBrassMat);
  elbowJoint.position.set(0.25, 0.76, 0.19);
  lampGroup.add(elbowJoint);

  const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.9, 10), chromeSteelMat);
  upperArm.position.set(0.62, 0.88, 0.38);
  upperArm.rotation.z = -1.25;
  upperArm.rotation.y = -0.45;
  lampGroup.add(upperArm);

  const shadeHeadGroup = new THREE.Group();
  shadeHeadGroup.position.set(1.02, 0.92, 0.56);
  shadeHeadGroup.rotation.x = 0.25;
  shadeHeadGroup.rotation.z = -0.15;

  const lampShade = new THREE.Mesh(
    new THREE.ConeGeometry(0.24, 0.22, 20, 1, true),
    enamelGreenMat
  );
  lampShade.castShadow = true;
  shadeHeadGroup.add(lampShade);

  const draftingLampBulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff3c4,
    emissive: 0xffb74d,
    emissiveIntensity: 2.2,
    roughness: 0.2,
  });
  const lampBulb = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 12), draftingLampBulbMat);
  lampBulb.position.set(0, -0.04, 0);
  shadeHeadGroup.add(lampBulb);

  const draftingSpotLight = new THREE.SpotLight(0xffdfa0, 4.5, 8, Math.PI / 3.2, 0.65, 1.5);
  draftingSpotLight.position.set(0, -0.05, 0);
  draftingSpotLight.target = mainBlueprintMesh;
  shadeHeadGroup.add(draftingSpotLight);

  lampGroup.add(shadeHeadGroup);
  draftingTiltGroup.add(lampGroup);

  // Vintage Swivel Drafting Stool in front of Drafting Board
  const stoolGroup = new THREE.Group();
  stoolGroup.position.set(0, 0, 1.38);

  const stoolSeat = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.08, 20), oakWoodMat);
  stoolSeat.position.y = 1.32;
  stoolSeat.castShadow = true;
  stoolGroup.add(stoolSeat);

  const stoolScrew = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.85, 12), castIronMat);
  stoolScrew.position.y = 0.88;
  stoolGroup.add(stoolScrew);

  const stoolFootRing = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.022, 8, 20), chromeSteelMat);
  stoolFootRing.rotation.x = Math.PI / 2;
  stoolFootRing.position.y = 0.48;
  stoolGroup.add(stoolFootRing);

  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2 + Math.PI / 4;
    const sLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.024, 1.32, 10), castIronMat);
    sLeg.position.set(Math.cos(angle) * 0.2, 0.64, Math.sin(angle) * 0.2);
    sLeg.rotation.z = -Math.cos(angle) * 0.18;
    sLeg.rotation.x = Math.sin(angle) * 0.18;
    sLeg.castShadow = true;
    stoolGroup.add(sLeg);
  }
  draftingBoardGroup.add(stoolGroup);

  const draftingHitbox = new THREE.Mesh(
    new THREE.BoxGeometry(3.4, 2.8, 2.5),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  draftingHitbox.position.set(0, 1.4, 0);
  draftingHitbox.userData = { artifactId: 'drafting-board', label: '1954 橡木复古工程绘图板' };
  draftingBoardGroup.add(draftingHitbox);
  clickablePickTargets.push(draftingHitbox);

  root.add(draftingBoardGroup);

  // ============================================================================
  // 3. HERB RYMAN'S 1953 WEEKEND PITCH DISPLAY EASEL (赫伯·莱曼 1953 鸟瞰画架)
  // Positioned between Drafting Board & Model Table (-2.85, 0, -2.55)
  // ============================================================================
  const easelGroup = new THREE.Group();
  easelGroup.position.set(-2.85, 0, -2.55);
  easelGroup.rotation.y = 0.35;

  // Tripod Hardwood Easel Legs
  [-0.52, 0.52].forEach((ex) => {
    const eLeg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.85, 0.08), birchWoodMat);
    eLeg.position.set(ex * 0.7, 1.4, 0.18);
    eLeg.rotation.z = ex * 0.14;
    eLeg.rotation.x = -0.14;
    eLeg.castShadow = true;
    easelGroup.add(eLeg);
  });
  const backEaselLeg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.75, 0.08), birchWoodMat);
  backEaselLeg.position.set(0, 1.35, -0.45);
  backEaselLeg.rotation.x = 0.26;
  easelGroup.add(backEaselLeg);

  const centerSpine = new THREE.Mesh(new THREE.BoxGeometry(0.09, 2.95, 0.08), darkWalnutMat);
  centerSpine.position.set(0, 1.52, 0.15);
  centerSpine.rotation.x = -0.14;
  easelGroup.add(centerSpine);

  const canvasTray = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.07, 0.18), darkWalnutMat);
  canvasTray.position.set(0, 1.32, 0.26);
  canvasTray.rotation.x = -0.14;
  easelGroup.add(canvasTray);

  // Herb Ryman Framed 1953 Disneyland Aerial Concept Canvas
  const rymanTex = createHerbRymanAerialTexture(maxAnisotropy);
  const rymanFrame = new THREE.Mesh(new THREE.BoxGeometry(1.68, 1.18, 0.06), brushedBrassMat);
  rymanFrame.position.set(0, 1.94, 0.19);
  rymanFrame.rotation.x = -0.14;
  rymanFrame.castShadow = true;
  easelGroup.add(rymanFrame);

  const rymanCanvas = new THREE.Mesh(
    new THREE.PlaneGeometry(1.56, 1.08),
    new THREE.MeshStandardMaterial({ map: rymanTex, roughness: 0.65 })
  );
  rymanCanvas.position.set(0, 1.94, 0.225);
  rymanCanvas.rotation.x = -0.14;
  easelGroup.add(rymanCanvas);

  // Artist Gouache Palette & Paint Tubes on Easel Tray
  const palette = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.015, 16), birchWoodMat);
  palette.position.set(0.55, 1.37, 0.31);
  easelGroup.add(palette);

  const easelHitbox = new THREE.Mesh(
    new THREE.BoxGeometry(1.9, 2.9, 1.3),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  easelHitbox.position.set(0, 1.45, 0);
  easelHitbox.userData = {
    artifactId: 'herb-ryman-easel',
    label: '1953 Herb Ryman 周末传奇鸟瞰概念画架',
  };
  easelGroup.add(easelHitbox);
  clickablePickTargets.push(easelHitbox);
  root.add(easelGroup);

  // ============================================================================
  // 4. KEM WEBER ANIMATION DESK & UB IWERKS MULTIPLANE CAMERA TOWER
  // Positioned in Northwest Animation Bay (-7.35, 0, -2.55)
  // ============================================================================
  const animationBayGroup = new THREE.Group();
  animationBayGroup.position.set(-7.35, 0, -2.55);
  animationBayGroup.rotation.y = 0.55;

  // A. Kem Weber Streamlined Birch & Walnut Animator's Desk
  const kemDeskGroup = new THREE.Group();
  const leftCabinet = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.35, 1.35), birchWoodMat);
  leftCabinet.position.set(-1.05, 0.675, 0);
  leftCabinet.castShadow = true;
  kemDeskGroup.add(leftCabinet);

  const rightCabinet = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.35, 1.35), birchWoodMat);
  rightCabinet.position.set(1.05, 0.675, 0);
  rightCabinet.castShadow = true;
  kemDeskGroup.add(rightCabinet);

  // Sloped Center Animator's Bridge with Backlit Rotoscope Disc
  const deskBridge = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.12, 1.25), darkWalnutMat);
  deskBridge.position.set(0, 1.48, 0.05);
  deskBridge.rotation.x = 0.38;
  deskBridge.castShadow = true;
  kemDeskGroup.add(deskBridge);

  const animDiscTex = createAnimationDiscTexture(maxAnisotropy);
  const animDiscMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.46, 0.46, 0.03, 28),
    new THREE.MeshStandardMaterial({
      map: animDiscTex,
      emissive: 0xfef08a,
      emissiveMap: animDiscTex,
      emissiveIntensity: 0.65,
      roughness: 0.3,
    })
  );
  animDiscMesh.position.set(0, 1.54, 0.07);
  animDiscMesh.rotation.x = 0.38;
  kemDeskGroup.add(animDiscMesh);

  // Brass Acme Registration Peg Bars top & bottom of disc
  [-0.36, 0.36].forEach((pz) => {
    const pegBar = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.025, 0.06), brushedBrassMat);
    pegBar.position.set(0, 1.56 - pz * 0.38, 0.07 + pz * 0.92);
    pegBar.rotation.x = 0.38;
    kemDeskGroup.add(pegBar);
  });

  // Animator's X-Sheet Clipboard Wing on Left Side of Kem Weber Desk
  const xSheetWing = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.72, 0.04), birchWoodMat);
  xSheetWing.position.set(-1.05, 1.75, -0.25);
  xSheetWing.rotation.x = -0.32;
  xSheetWing.rotation.y = 0.25;
  kemDeskGroup.add(xSheetWing);

  const xSheetPaper = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.62), vellumPaperMat);
  xSheetPaper.position.set(0, 0, 0.025);
  xSheetWing.add(xSheetPaper);

  animationBayGroup.add(kemDeskGroup);

  // B. Ub Iwerks Multiplane Camera Vertical Rig (多平面景深摄影机塔架)
  const multiplaneGroup = new THREE.Group();
  multiplaneGroup.position.set(-2.15, 0, -0.15);

  // 4 Vertical Steel Rack Columns
  [-0.55, 0.55].forEach((mx) => {
    [-0.45, 0.45].forEach((mz) => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.65, 12), castIronMat);
      col.position.set(mx, 1.825, mz);
      col.castShadow = true;
      multiplaneGroup.add(col);
    });
  });

  // 3 Multiplane Glass Artwork Planes (Foreground, Midground, Background Depth Planes)
  const planeConfigs = [
    { y: 0.85, color: 0x1e3a8a, label: 'BG SKY' },
    { y: 1.55, color: 0x15803d, label: 'MID FOREST' },
    { y: 2.25, color: 0xf472b6, label: 'FG CASTLE' },
  ];
  planeConfigs.forEach((cfg) => {
    const layerGroup = new THREE.Group();
    layerGroup.position.y = cfg.y;

    const steelFrame = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.05, 0.96), machineGreyMat);
    layerGroup.add(steelFrame);

    const glassPlate = new THREE.Mesh(
      new THREE.PlaneGeometry(0.98, 0.78),
      new THREE.MeshPhysicalMaterial({
        color: cfg.color,
        roughness: 0.15,
        transparent: true,
        opacity: 0.42,
        side: THREE.DoubleSide,
      })
    );
    glassPlate.rotation.x = -Math.PI / 2;
    glassPlate.position.y = 0.03;
    layerGroup.add(glassPlate);

    multiplaneGroup.add(layerGroup);
    multiplaneLayers.push(layerGroup);
  });

  // Top Bridge with Downward-Aiming 35mm Mitchell Dual-Reel Film Camera
  const topCameraBridge = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.12, 1.02), castIronMat);
  topCameraBridge.position.y = 3.55;
  multiplaneGroup.add(topCameraBridge);

  const mitchellBody = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.34, 0.28), machineGreyMat);
  mitchellBody.position.set(0, 3.78, 0);
  multiplaneGroup.add(mitchellBody);

  // Dual Mickey-Ear 35mm Film Magazines on Top of Mitchell Camera
  [-0.14, 0.14].forEach((rx) => {
    const mag = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.1, 16), castIronMat);
    mag.rotation.x = Math.PI / 2;
    mag.position.set(rx, 4.02, 0);
    multiplaneGroup.add(mag);
  });

  const lensBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.24, 12), brushedBrassMat);
  lensBarrel.position.set(0, 3.38, 0);
  multiplaneGroup.add(lensBarrel);

  animationBayGroup.add(multiplaneGroup);

  const kemHitbox = new THREE.Mesh(
    new THREE.BoxGeometry(4.4, 3.9, 2.0),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  kemHitbox.position.set(-0.7, 1.9, 0);
  kemHitbox.userData = {
    artifactId: 'kem-weber-multiplane',
    label: 'Kem Weber 透光动画桌与多平面景深摄影机塔架',
  };
  animationBayGroup.add(kemHitbox);
  clickablePickTargets.push(kemHitbox);

  root.add(animationBayGroup);

  // ============================================================================
  // 5. VOXEL DISNEY IMAGINEER CHARACTER (1954 幻想工程师体素角色)
  // Standing between the Drafting Board and Model Table (-3.15, 0, -0.15)
  // ============================================================================
  const imagineerGroup = new THREE.Group();
  imagineerGroup.position.set(-3.15, 0, -0.15);
  imagineerGroup.rotation.y = 0.72;

  const trouserMat = new THREE.MeshStandardMaterial({ color: 0x2b3648, roughness: 0.75 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 });
  const tieMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.5 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xf1c29b, roughness: 0.55 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x3b281e, roughness: 0.7 });

  [-0.14, 0.14].forEach((lx) => {
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.32), darkWalnutMat);
    shoe.position.set(lx, 0.07, 0.04);
    shoe.castShadow = true;
    imagineerGroup.add(shoe);

    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.78, 0.22), trouserMat);
    leg.position.set(lx, 0.53, 0);
    leg.castShadow = true;
    imagineerGroup.add(leg);
  });

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.72, 0.32), shirtMat);
  torso.position.set(0, 1.28, 0);
  torso.castShadow = true;
  imagineerGroup.add(torso);

  const tie = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.48, 0.04), tieMat);
  tie.position.set(0, 1.3, 0.17);
  imagineerGroup.add(tie);

  const pocketProtector = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.16, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.4 })
  );
  pocketProtector.position.set(0.15, 1.38, 0.17);
  imagineerGroup.add(pocketProtector);

  const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.62, 0.18), skinMat);
  leftArm.position.set(-0.37, 1.25, 0.12);
  leftArm.rotation.x = -0.48;
  leftArm.castShadow = true;
  imagineerGroup.add(leftArm);

  const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.62, 0.18), skinMat);
  rightArm.position.set(0.37, 1.28, 0.18);
  rightArm.rotation.x = -0.75;
  rightArm.castShadow = true;
  imagineerGroup.add(rightArm);

  const heldScroll = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.58, 12),
    new THREE.MeshStandardMaterial({ color: 0x134074, roughness: 0.5 })
  );
  heldScroll.rotation.z = Math.PI / 2;
  heldScroll.position.set(-0.38, 1.08, 0.34);
  imagineerGroup.add(heldScroll);

  const imagineerHeadGroup = new THREE.Group();
  imagineerHeadGroup.position.set(0, 1.68, 0);

  const headCube = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.44, 0.44), skinMat);
  headCube.position.y = 0.22;
  headCube.castShadow = true;
  imagineerHeadGroup.add(headCube);

  const hairCap = new THREE.Mesh(new THREE.BoxGeometry(0.47, 0.16, 0.47), hairMat);
  hairCap.position.set(0, 0.42, -0.02);
  imagineerHeadGroup.add(hairCap);

  const glassesBar = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.09, 0.05), castIronMat);
  glassesBar.position.set(0, 0.25, 0.23);
  imagineerHeadGroup.add(glassesBar);

  const badge = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.07, 0.04), brushedBrassMat);
  badge.position.set(-0.15, 1.45, 0.17);
  imagineerGroup.add(badge);

  imagineerGroup.add(imagineerHeadGroup);
  root.add(imagineerGroup);

  // ============================================================================
  // 6. STATION 3: BLUEPRINT WALL, MARY BLAIR CORKBOARD & 24-SLOT CUBBY CABINET
  // ============================================================================
  const blueprintWallGroup = new THREE.Group();
  blueprintWallGroup.position.set(0, 0, -5.95);

  // Left: Mary Blair Concept Art & Storyboard Cork Pinboard
  const corkTex = createCorkboardTexture(maxAnisotropy);
  const corkFrame = new THREE.Mesh(new THREE.BoxGeometry(5.2, 2.75, 0.12), oakWoodMat);
  corkFrame.position.set(-3.1, 3.65, 0);
  corkFrame.castShadow = true;
  blueprintWallGroup.add(corkFrame);

  const corkBoard = new THREE.Mesh(
    new THREE.PlaneGeometry(4.92, 2.48),
    new THREE.MeshStandardMaterial({ map: corkTex, roughness: 0.8 })
  );
  corkBoard.position.set(-3.1, 3.65, 0.07);
  blueprintWallGroup.add(corkBoard);

  // Right-Center: Hanging Master Blueprint Dowel Clamp Rack
  const clampBar = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.14, 0.18), oakWoodMat);
  clampBar.position.set(2.3, 4.95, 0.08);
  blueprintWallGroup.add(clampBar);

  [-1.6, -0.5, 0.5, 1.6].forEach((wx) => {
    const nut = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.08, 10), brushedBrassMat);
    nut.rotation.x = Math.PI / 2;
    nut.position.set(2.3 + wx, 4.95, 0.18);
    blueprintWallGroup.add(nut);
  });

  const wallBpTex = createBlueprintTexture('master-plan', maxAnisotropy, 'cyanotype');
  const wallBlueprintMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(3.9, 2.65),
    new THREE.MeshStandardMaterial({
      map: wallBpTex,
      roughness: 0.65,
      metalness: 0.05,
    })
  );
  wallBlueprintMesh.position.set(2.3, 3.55, 0.11);
  blueprintWallGroup.add(wallBlueprintMesh);

  // Far Right: Vertical Rolled Blueprint Cubby Cabinet (24 Blueprint Scroll Slots)
  const cubbyCabinet = new THREE.Group();
  cubbyCabinet.position.set(6.2, 0, 0.65);

  const cabinetBox = new THREE.Mesh(new THREE.BoxGeometry(1.85, 3.8, 0.95), oakWoodMat);
  cabinetBox.position.y = 1.9;
  cabinetBox.castShadow = true;
  cubbyCabinet.add(cabinetBox);

  const cabinetInterior = new THREE.Mesh(new THREE.BoxGeometry(1.65, 3.5, 0.1), darkWalnutMat);
  cabinetInterior.position.set(0, 1.9, 0.44);
  cubbyCabinet.add(cabinetInterior);

  const capColors = [0xd93829, 0x2563eb, 0xf59e0b, 0x10b981, 0xf4ebd6];
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 4; col++) {
      const tube = new THREE.Mesh(
        new THREE.CylinderGeometry(0.085, 0.085, 0.55, 12),
        row % 2 === 0 ? vellumPaperMat : new THREE.MeshStandardMaterial({ color: 0x134074, roughness: 0.65 })
      );
      tube.rotation.x = Math.PI / 2;
      tube.position.set(-0.54 + col * 0.36, 0.58 + row * 0.66, 0.55);
      cubbyCabinet.add(tube);

      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.065, 0.065, 0.04, 10),
        new THREE.MeshStandardMaterial({ color: capColors[(row + col) % capColors.length], roughness: 0.4 })
      );
      cap.rotation.x = Math.PI / 2;
      cap.position.set(-0.54 + col * 0.36, 0.58 + row * 0.66, 0.83);
      cubbyCabinet.add(cap);
    }
  }
  blueprintWallGroup.add(cubbyCabinet);

  const wallHitbox = new THREE.Mesh(
    new THREE.BoxGeometry(12, 4.8, 1.4),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  wallHitbox.position.set(0.5, 3.2, 0.2);
  wallHitbox.userData = { artifactId: 'blueprint-wall', label: '蓝图悬挂架与玛丽·布莱尔色彩设定墙' };
  blueprintWallGroup.add(wallHitbox);
  clickablePickTargets.push(wallHitbox);

  root.add(blueprintWallGroup);

  // ============================================================================
  // 7. STATION 4: AUDIO-ANIMATRONICS & "PROJECT LITTLE MAN" LAB BENCH
  // Positioned on East Side (6.35, 0, -1.75)
  // ============================================================================
  const animatronicLabGroup = new THREE.Group();
  animatronicLabGroup.position.set(6.35, 0, -1.75);
  animatronicLabGroup.rotation.y = -0.35;

  const benchTop = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.12, 1.5), oakWoodMat);
  benchTop.position.y = 1.65;
  benchTop.castShadow = true;
  animatronicLabGroup.add(benchTop);

  [-1.55, 0, 1.55].forEach((bx) => {
    [-0.6, 0.6].forEach((bz) => {
      const bLeg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.65, 0.12), castIronMat);
      bLeg.position.set(bx, 0.825, bz);
      animatronicLabGroup.add(bLeg);
    });
  });

  // A. "Project Little Man" (Buddy Ebsen 9-inch Tap-Dancing Miniature Proscenium Stage)
  const littleManStage = new THREE.Group();
  littleManStage.position.set(-1.12, 1.71, 0);

  const stagePlinth = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.16, 0.62), darkWalnutMat);
  stagePlinth.position.y = 0.08;
  littleManStage.add(stagePlinth);

  // Proscenium Brass Arch Frame
  const archLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.82, 8), brushedBrassMat);
  archLeft.position.set(-0.3, 0.56, -0.15);
  littleManStage.add(archLeft);

  const archRight = archLeft.clone();
  archRight.position.x = 0.3;
  littleManStage.add(archRight);

  const archTop = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.06, 0.12), brushedBrassMat);
  archTop.position.set(0, 0.96, -0.15);
  littleManStage.add(archTop);

  // Tap-Dancing Voxel "Little Man" Figure inside Proscenium
  const littleManGroup = new THREE.Group();
  littleManGroup.position.set(0, 0.2, 0);

  const lmLegs = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.22, 0.09), trouserMat);
  lmLegs.position.y = 0.11;
  littleManGroup.add(lmLegs);

  const lmCoat = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.24, 0.11),
    new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5 })
  );
  lmCoat.position.y = 0.34;
  littleManGroup.add(lmCoat);

  const lmHead = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.14), skinMat);
  lmHead.position.y = 0.53;
  littleManGroup.add(lmHead);

  // Straw Boater Hat on Little Man
  const boaterBrim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.13, 0.02, 12),
    new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.6 })
  );
  boaterBrim.position.y = 0.61;
  littleManGroup.add(boaterBrim);

  const boaterCrown = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 0.07, 12),
    new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.6 })
  );
  boaterCrown.position.y = 0.65;
  littleManGroup.add(boaterCrown);

  littleManStage.add(littleManGroup);
  animatronicLabGroup.add(littleManStage);

  // B. Center: Brass Cam Box, Rotating Gears & Voxel Enchanted Tiki Macaw
  const camBox = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.32, 0.65), castIronMat);
  camBox.position.set(-0.08, 1.87, 0);
  animatronicLabGroup.add(camBox);

  [-0.32, 0.16].forEach((gx, idx) => {
    const gear = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 0.06, 12),
      brushedBrassMat
    );
    gear.rotation.x = Math.PI / 2;
    gear.position.set(gx, 1.92, 0.36);
    animatronicLabGroup.add(gear);
    animatronicGears.push(gear);

    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.09, 8), chromeSteelMat);
    gear.add(hub);
    if (idx === 1) gear.rotation.y = 0.25;
  });

  const animatronicBirdGroup = new THREE.Group();
  animatronicBirdGroup.position.set(-0.08, 2.35, 0);

  const perchRod = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.42, 10), brushedBrassMat);
  perchRod.position.y = -0.15;
  animatronicBirdGroup.add(perchRod);

  const birdBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.26, 0.38, 0.24),
    new THREE.MeshStandardMaterial({ color: 0xd93829, roughness: 0.45 })
  );
  birdBody.position.y = 0.16;
  animatronicBirdGroup.add(birdBody);

  const birdWingL = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.28, 0.22),
    new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.45 })
  );
  birdWingL.position.set(-0.16, 0.16, 0);
  animatronicBirdGroup.add(birdWingL);

  const birdWingR = birdWingL.clone();
  birdWingR.position.x = 0.16;
  animatronicBirdGroup.add(birdWingR);

  const birdBeak = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.12, 0.16),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.35 })
  );
  birdBeak.position.set(0, 0.28, 0.18);
  animatronicBirdGroup.add(birdBeak);

  const birdCrest = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.16, 0.14),
    new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.45 })
  );
  birdCrest.position.set(0, 0.42, 0);
  animatronicBirdGroup.add(birdCrest);

  animatronicLabGroup.add(animatronicBirdGroup);

  // C. Right Side of Bench: Tektronix CRT Oscilloscope, Ampex Reel-to-Reel Tape Deck & Clay Maquette
  const scopeBox = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.46, 0.62), machineGreyMat);
  scopeBox.position.set(0.75, 1.94, -0.15);
  animatronicLabGroup.add(scopeBox);

  const scopeTex = createOscilloscopeTexture(maxAnisotropy);
  const scopeScreen = new THREE.Mesh(
    new THREE.CircleGeometry(0.16, 20),
    new THREE.MeshBasicMaterial({ map: scopeTex })
  );
  scopeScreen.position.set(0.75, 1.98, 0.17);
  animatronicLabGroup.add(scopeScreen);

  // Ampex Dual-Reel Magnetic Tape Pulse Programmer
  const tapeCabinet = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.64, 0.38), castIronMat);
  tapeCabinet.position.set(1.38, 2.02, -0.22);
  animatronicLabGroup.add(tapeCabinet);

  [-0.14, 0.14].forEach((rx) => {
    const reel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.03, 16),
      chromeSteelMat
    );
    reel.rotation.x = Math.PI / 2;
    reel.position.set(1.38 + rx, 2.15, -0.01);
    animatronicLabGroup.add(reel);
    tapeReels.push(reel);
  });

  // Blaine Gibson's Grey Clay Maquette Sculpting Turntable
  const sculptWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.06, 16), castIronMat);
  sculptWheel.position.set(1.22, 1.74, 0.42);
  animatronicLabGroup.add(sculptWheel);

  const clayMaquette = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.28, 0.24),
    new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.85 })
  );
  clayMaquette.position.set(1.22, 1.91, 0.42);
  animatronicLabGroup.add(clayMaquette);

  const labHitbox = new THREE.Mesh(
    new THREE.BoxGeometry(3.7, 2.2, 1.8),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  labHitbox.position.set(0, 1.8, 0);
  labHitbox.userData = {
    artifactId: 'little-man-lab',
    label: '「小人计划」机械动捕、提基鸟与示波器实验台',
  };
  animatronicLabGroup.add(labHitbox);
  clickablePickTargets.push(labHitbox);

  root.add(animatronicLabGroup);

  // ============================================================================
  // 8. STATION 5: ROGER BROGGIE'S MACHINE SHOP & 1:8 "LILLY BELLE" STEAM BENCH
  // Positioned in Southeast Bay (6.35, 0, 2.65)
  // ============================================================================
  const machineShopGroup = new THREE.Group();
  machineShopGroup.position.set(6.35, 0, 2.65);
  machineShopGroup.rotation.y = -0.58;

  // Heavy Shop Workbench & Red Mechanic's Tool Chest
  const shopTop = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.14, 1.55), oakWoodMat);
  shopTop.position.y = 1.58;
  shopTop.castShadow = true;
  machineShopGroup.add(shopTop);

  const toolChest = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.45, 1.3), shopRedMat);
  toolChest.position.set(-1.1, 0.75, 0);
  toolChest.castShadow = true;
  machineShopGroup.add(toolChest);

  [1.1, 1.65].forEach((lx) => {
    [-0.6, 0.6].forEach((lz) => {
      const sLeg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.55, 0.14), castIronMat);
      sLeg.position.set(lx, 0.775, lz);
      machineShopGroup.add(sLeg);
    });
  });

  // Back Perforated Pegboard Tool Wall with Wrenches, Calipers & Steam Gauges
  const pegboardFrame = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.85, 0.08), darkWalnutMat);
  pegboardFrame.position.set(0, 2.58, -0.72);
  machineShopGroup.add(pegboardFrame);

  const pegTex = createPegboardToolTexture(maxAnisotropy);
  const pegboardMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(3.32, 1.68),
    new THREE.MeshStandardMaterial({ map: pegTex, roughness: 0.75 })
  );
  pegboardMesh.position.set(0, 2.58, -0.67);
  machineShopGroup.add(pegboardMesh);

  // A. 1:8 Large-Scale Central Pacific #173 "Lilly Belle" Live Steam Voxel Locomotive on Brass Rollers
  const lillyBelleGroup = new THREE.Group();
  lillyBelleGroup.position.set(-0.35, 1.68, 0.08);

  // Brass Dynamometer Roller Test Track Bed
  const testBed = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.08, 0.56), darkWalnutMat);
  testBed.position.y = 0.04;
  lillyBelleGroup.add(testBed);

  [-0.18, 0.18].forEach((rz) => {
    const brassRail = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.04, 0.04), brushedBrassMat);
    brassRail.position.set(0, 0.1, rz);
    lillyBelleGroup.add(brassRail);
  });

  // Locomotive Boiler Barrel, Brass Bands, Red Cab & Diamond Smokestack
  const lbBoiler = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.05, 16), castIronMat);
  lbBoiler.rotation.z = Math.PI / 2;
  lbBoiler.position.set(0.15, 0.38, 0);
  lbBoiler.castShadow = true;
  lillyBelleGroup.add(lbBoiler);

  // Brass Boiler Straps
  [-0.2, 0.15, 0.48].forEach((bx) => {
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.225, 0.014, 8, 20), brushedBrassMat);
    band.rotation.y = Math.PI / 2;
    band.position.set(bx, 0.38, 0);
    lillyBelleGroup.add(band);
  });

  // Red & Walnut Engineer Cab
  const lbCab = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.54, 0.52), shopRedMat);
  lbCab.position.set(-0.55, 0.48, 0);
  lbCab.castShadow = true;
  lillyBelleGroup.add(lbCab);

  const lbCabRoof = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.06, 0.58), darkWalnutMat);
  lbCabRoof.position.set(-0.55, 0.77, 0);
  lillyBelleGroup.add(lbCabRoof);

  // Balloon Smokestack, Brass Steam Dome & Brass Headlamp
  const lbStack = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.07, 0.36, 12), castIronMat);
  lbStack.position.set(0.52, 0.72, 0);
  lillyBelleGroup.add(lbStack);

  const lbDome = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.22, 12), brushedBrassMat);
  lbDome.position.set(0.12, 0.65, 0);
  lillyBelleGroup.add(lbDome);

  const lbHeadlamp = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.12), brushedBrassMat);
  lbHeadlamp.position.set(0.72, 0.45, 0);
  lillyBelleGroup.add(lbHeadlamp);

  // Red Cowcatcher Pilot
  const lbPilot = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.28, 4), shopRedMat);
  lbPilot.rotation.z = -Math.PI / 2;
  lbPilot.position.set(0.78, 0.22, 0);
  lillyBelleGroup.add(lbPilot);

  // 4 Large Red-Spoked Driving Wheels with Brass Counterweights (Animated on Test Rollers!)
  [-0.38, 0.05].forEach((wx) => {
    [-0.24, 0.24].forEach((wz) => {
      const wheelGroup = new THREE.Group();
      wheelGroup.position.set(wx, 0.24, wz);

      const tire = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.025, 8, 18), chromeSteelMat);
      wheelGroup.add(tire);

      const spokeCore = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.02, 12), shopRedMat);
      spokeCore.rotation.x = Math.PI / 2;
      wheelGroup.add(spokeCore);

      const crankPin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.035, 0.04), brushedBrassMat);
      crankPin.position.set(0.06, 0, wz > 0 ? 0.02 : -0.02);
      wheelGroup.add(crankPin);

      lillyBelleGroup.add(wheelGroup);
      lillyBelleWheels.push(wheelGroup);
    });
  });

  machineShopGroup.add(lillyBelleGroup);

  // B. South Bend Precision Metalworking Lathe on Right Side of Machine Bench
  const latheGroup = new THREE.Group();
  latheGroup.position.set(1.15, 1.65, 0.1);

  const latheBed = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.14, 0.34), machineGreyMat);
  latheBed.position.y = 0.07;
  latheGroup.add(latheBed);

  const headstock = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.32, 0.36), machineGreyMat);
  headstock.position.set(-0.32, 0.24, 0);
  latheGroup.add(headstock);

  const chuck = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.1, 12), chromeSteelMat);
  chuck.rotation.z = Math.PI / 2;
  chuck.position.set(-0.13, 0.26, 0);
  latheGroup.add(chuck);

  const tailstock = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.26, 0.3), machineGreyMat);
  tailstock.position.set(0.32, 0.21, 0);
  latheGroup.add(tailstock);

  machineShopGroup.add(latheGroup);

  const shopHitbox = new THREE.Mesh(
    new THREE.BoxGeometry(3.8, 2.8, 1.9),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  shopHitbox.position.set(0, 1.85, 0);
  shopHitbox.userData = {
    artifactId: 'lilly-belle-shop',
    label: 'Roger Broggie 精密机械车床与「礼利贝尔号」蒸汽机车装配台',
  };
  machineShopGroup.add(shopHitbox);
  clickablePickTargets.push(shopHitbox);

  root.add(machineShopGroup);

  // ============================================================================
  // 9. STATION 6: WALT DISNEY'S HISTORIC SUITE 3H OFFICE (沃尔特·迪士尼 3H 总裁办公室)
  // Positioned in the Southwest Executive Wing (-6.95, 0, 5.45), angled toward studio center
  // ============================================================================
  const waltsOfficeGroup = new THREE.Group();
  waltsOfficeGroup.position.set(-6.95, 0, 5.45);
  waltsOfficeGroup.rotation.y = 0.54;

  // A. Raised California Redwood & Woven Burgundy Wool Carpet Platform (5.4m x 3.8m)
  const officePlatform = new THREE.Mesh(
    new THREE.BoxGeometry(5.45, 0.08, 3.85),
    darkWalnutMat
  );
  officePlatform.position.set(0, 0.04, 0);
  officePlatform.receiveShadow = true;
  waltsOfficeGroup.add(officePlatform);

  // Brass Threshold Trim along the front & right edge of Suite 3H
  const frontBrassTrim = new THREE.Mesh(
    new THREE.BoxGeometry(5.48, 0.085, 0.05),
    brushedBrassMat
  );
  frontBrassTrim.position.set(0, 0.042, 1.92);
  waltsOfficeGroup.add(frontBrassTrim);

  const rugTex = createOfficeRugTexture(maxAnisotropy);
  const officeRug = new THREE.Mesh(
    new THREE.PlaneGeometry(5.05, 3.45),
    new THREE.MeshStandardMaterial({
      map: rugTex,
      roughness: 0.85,
      metalness: 0.02,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    })
  );
  officeRug.rotation.x = -Math.PI / 2;
  officeRug.position.set(0, 0.084, 0);
  officeRug.receiveShadow = true;
  waltsOfficeGroup.add(officeRug);

  // B. L-Shaped Mid-Century California Redwood & Walnut Paneled Office Partition Walls
  const officeBackWall = new THREE.Mesh(
    new THREE.BoxGeometry(5.45, 3.55, 0.16),
    californiaRedwoodMat
  );
  officeBackWall.position.set(0, 1.82, -1.85);
  officeBackWall.castShadow = true;
  officeBackWall.receiveShadow = true;
  waltsOfficeGroup.add(officeBackWall);

  const officeLeftWall = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 3.55, 3.85),
    californiaRedwoodMat
  );
  officeLeftWall.position.set(-2.65, 1.82, 0);
  officeLeftWall.castShadow = true;
  officeLeftWall.receiveShadow = true;
  waltsOfficeGroup.add(officeLeftWall);

  // Crown Molding & Brass Inlay Strips on Suite 3H Walls
  const backCrown = new THREE.Mesh(new THREE.BoxGeometry(5.52, 0.12, 0.22), darkWalnutMat);
  backCrown.position.set(0, 3.58, -1.85);
  waltsOfficeGroup.add(backCrown);

  const leftCrown = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 3.92), darkWalnutMat);
  leftCrown.position.set(-2.65, 3.58, 0);
  waltsOfficeGroup.add(leftCrown);

  // Suite 3H Frosted Glass Entry Door Pillar on Left Front Corner ("SUITE 3H · WALT DISNEY")
  const suitePillar = new THREE.Group();
  suitePillar.position.set(-2.65, 0.08, 1.42);
  const pillarFrame = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.4, 0.85), darkWalnutMat);
  pillarFrame.position.y = 1.7;
  suitePillar.add(pillarFrame);

  const frostedSuiteGlass = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 1.45, 0.65),
    new THREE.MeshPhysicalMaterial({
      color: 0xfef3c7,
      roughness: 0.28,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.35,
    })
  );
  frostedSuiteGlass.position.y = 2.15;
  suitePillar.add(frostedSuiteGlass);

  // Brass "3H" Plaque on Pillar
  const suitePlaque = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.22, 0.36), brushedBrassMat);
  suitePlaque.position.y = 1.25;
  suitePillar.add(suitePlaque);
  waltsOfficeGroup.add(suitePillar);

  // C. KEM WEBER CUSTOM CURVED CALIFORNIA REDWOOD EXECUTIVE DESK (沃尔特标志性弧形红木办公桌)
  const waltDeskGroup = new THREE.Group();
  waltDeskGroup.position.set(-0.92, 0.08, 0.05);

  // Left & Right Streamlined Rounded Burl-Wood Pedestals
  [-0.78, 0.78].forEach((px) => {
    const pedestal = new THREE.Mesh(
      new THREE.BoxGeometry(0.56, 0.82, 0.92),
      californiaRedwoodMat
    );
    pedestal.position.set(px, 0.41, 0);
    pedestal.castShadow = true;
    pedestal.receiveShadow = true;
    waltDeskGroup.add(pedestal);

    // Rounded Front Cylinder Nose on Pedestal (Kem Weber streamline signature)
    const roundedNose = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.28, 0.82, 16),
      californiaRedwoodMat
    );
    roundedNose.position.set(px, 0.41, 0.46);
    roundedNose.castShadow = true;
    waltDeskGroup.add(roundedNose);

    // 3 Horizontal Chrome Drawer Pulls on each Pedestal
    [0.22, 0.44, 0.66].forEach((dy) => {
      const pull = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.025, 0.04), chromeSteelMat);
      pull.position.set(px, dy, 0.74);
      waltDeskGroup.add(pull);
    });
  });

  // Recessed Center Modesty Panel
  const modestyPanel = new THREE.Mesh(
    new THREE.BoxGeometry(1.15, 0.68, 0.12),
    darkWalnutMat
  );
  modestyPanel.position.set(0, 0.44, 0.28);
  waltDeskGroup.add(modestyPanel);

  // Curved Boomerang Redwood Desk Top Slab + Rounded Wing Caps
  const deskMainTop = new THREE.Mesh(
    new THREE.BoxGeometry(2.24, 0.08, 1.12),
    californiaRedwoodMat
  );
  deskMainTop.position.set(0, 0.85, 0.06);
  deskMainTop.castShadow = true;
  deskMainTop.receiveShadow = true;
  waltDeskGroup.add(deskMainTop);

  [-1.12, 1.12].forEach((wx) => {
    const wingDisk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.56, 0.56, 0.08, 24),
      californiaRedwoodMat
    );
    wingDisk.position.set(wx, 0.85, 0.06);
    wingDisk.castShadow = true;
    waltDeskGroup.add(wingDisk);
  });

  // Oxblood Leather Executive Desk Blotter Pad with Brass Corners
  const blotterPad = new THREE.Mesh(
    new THREE.BoxGeometry(0.88, 0.016, 0.56),
    oxbloodLeatherMat
  );
  blotterPad.position.set(0, 0.898, -0.04);
  waltDeskGroup.add(blotterPad);

  // Walt's Tufted Oxblood Leather Executive Swivel Chair behind the Desk
  const waltChairGroup = new THREE.Group();
  waltChairGroup.position.set(0, 0, -0.78);
  waltChairGroup.rotation.y = 0.15;

  const chairBasePost = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.06, 0.46, 12),
    darkWalnutMat
  );
  chairBasePost.position.y = 0.23;
  waltChairGroup.add(chairBasePost);

  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + Math.PI / 4;
    const cLeg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.06, 0.58), darkWalnutMat);
    cLeg.position.set(Math.cos(a) * 0.18, 0.07, Math.sin(a) * 0.18);
    cLeg.rotation.y = a;
    waltChairGroup.add(cLeg);
  }

  const chairSeat = new THREE.Mesh(
    new THREE.BoxGeometry(0.64, 0.12, 0.62),
    oxbloodLeatherMat
  );
  chairSeat.position.y = 0.5;
  chairSeat.castShadow = true;
  waltChairGroup.add(chairSeat);

  const chairBack = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 0.78, 0.12),
    oxbloodLeatherMat
  );
  chairBack.position.set(0, 0.92, -0.26);
  chairBack.rotation.x = -0.1;
  chairBack.castShadow = true;
  waltChairGroup.add(chairBack);

  [-0.32, 0.32].forEach((ax) => {
    const armRest = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.07, 0.48),
      oxbloodLeatherMat
    );
    armRest.position.set(ax, 0.72, -0.02);
    waltChairGroup.add(armRest);

    const armPost = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.22, 0.06),
      darkWalnutMat
    );
    armPost.position.set(ax, 0.6, 0.16);
    waltChairGroup.add(armPost);
  });
  waltDeskGroup.add(waltChairGroup);

  // D. WALT DISNEY'S PERSONAL DESK MEMORABILIA
  // 1. Miniature Brass & Black "C.P. Huntington / Carolwood Pacific" Scale Steam Locomotive Model
  const deskTrainPlinth = new THREE.Mesh(
    new THREE.BoxGeometry(0.54, 0.035, 0.2),
    darkWalnutMat
  );
  deskTrainPlinth.position.set(-0.88, 0.91, 0.16);
  deskTrainPlinth.rotation.y = 0.32;
  waltDeskGroup.add(deskTrainPlinth);

  const miniBoiler = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.045, 0.24, 12),
    brushedBrassMat
  );
  miniBoiler.rotation.z = Math.PI / 2;
  miniBoiler.position.set(0.04, 0.075, 0);
  deskTrainPlinth.add(miniBoiler);

  const miniCab = new THREE.Mesh(
    new THREE.BoxGeometry(0.11, 0.12, 0.12),
    shopRedMat
  );
  miniCab.position.set(-0.11, 0.09, 0);
  deskTrainPlinth.add(miniCab);

  const miniStack = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.018, 0.09, 10),
    brushedBrassMat
  );
  miniStack.position.set(0.12, 0.14, 0);
  deskTrainPlinth.add(miniStack);

  // 2. Norman Rockwell Framed Oil Portraits of Walt's Daughters (Diane & Sharon)
  [
    { x: 0.86, z: 0.22, ry: -0.45 },
    { x: 1.12, z: 0.08, ry: -0.65 },
  ].forEach((pf, idx) => {
    const frameMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.28, 0.03),
      brushedBrassMat
    );
    frameMesh.position.set(pf.x, 1.03, pf.z);
    frameMesh.rotation.y = pf.ry;
    frameMesh.rotation.x = -0.15;
    waltDeskGroup.add(frameMesh);

    const portraitCanvas = new THREE.Mesh(
      new THREE.PlaneGeometry(0.17, 0.22),
      new THREE.MeshStandardMaterial({
        color: idx === 0 ? 0xf5d0a9 : 0xfde68a,
        roughness: 0.55,
      })
    );
    portraitCanvas.position.set(0, 0, 0.018);
    frameMesh.add(portraitCanvas);
  });

  // 3. 1950s Bell System Black Bakelite Rotary Telephone & WED Multi-Channel Intercom Box
  const rotaryPhone = new THREE.Group();
  rotaryPhone.position.set(-0.52, 0.9, -0.14);
  rotaryPhone.rotation.y = 0.25;
  const phoneBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.11, 0.2),
    ebonyPianoMat
  );
  phoneBody.position.y = 0.055;
  rotaryPhone.add(phoneBody);

  const rotaryDial = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.055, 0.02, 16),
    vellumPaperMat
  );
  rotaryDial.position.set(0, 0.11, 0.04);
  rotaryDial.rotation.x = 0.4;
  rotaryPhone.add(rotaryDial);

  const handsetBar = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.04, 0.06),
    ebonyPianoMat
  );
  handsetBar.position.set(0, 0.135, -0.02);
  rotaryPhone.add(handsetBar);
  waltDeskGroup.add(rotaryPhone);

  // Walnut & Brass Studio Intercom Box
  const intercomBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.26, 0.12, 0.16),
    darkWalnutMat
  );
  intercomBox.position.set(0.54, 0.95, 0.22);
  intercomBox.rotation.y = -0.25;
  waltDeskGroup.add(intercomBox);

  const intercomGrille = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.07, 0.02),
    brushedBrassMat
  );
  intercomGrille.position.set(0, 0.01, -0.08);
  intercomBox.add(intercomGrille);

  // 4. Twin Fountain Pen Set, Leather EPCOT Story Script Binder & Porcelain Teacup
  const scriptBinder = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.035, 0.4),
    new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.6 })
  );
  scriptBinder.position.set(0.06, 0.92, -0.02);
  scriptBinder.rotation.y = 0.12;
  waltDeskGroup.add(scriptBinder);

  const scriptPages = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.012, 0.36),
    vellumPaperMat
  );
  scriptPages.position.set(0, 0.022, 0);
  scriptBinder.add(scriptPages);

  // Porcelain Teacup & Saucer (Walt's afternoon tea / tomato juice cup)
  const saucer = new THREE.Mesh(
    new THREE.CylinderGeometry(0.085, 0.07, 0.015, 16),
    vellumPaperMat
  );
  saucer.position.set(0.36, 0.9, -0.15);
  waltDeskGroup.add(saucer);

  const teacup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.052, 0.042, 0.08, 16),
    vellumPaperMat
  );
  teacup.position.set(0.36, 0.945, -0.15);
  waltDeskGroup.add(teacup);

  // 5. Glowing Brass Executive Desk Lamp on Left Rear of Walt's Desk
  const execLampGroup = new THREE.Group();
  execLampGroup.position.set(-1.12, 0.89, -0.18);

  const execLampBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.13, 0.04, 16),
    brushedBrassMat
  );
  execLampGroup.add(execLampBase);

  const execLampStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.022, 0.46, 12),
    brushedBrassMat
  );
  execLampStem.position.y = 0.24;
  execLampGroup.add(execLampStem);

  const execLampShade = new THREE.Mesh(
    new THREE.ConeGeometry(0.22, 0.17, 20, 1, true),
    brushedBrassMat
  );
  execLampShade.position.y = 0.48;
  execLampShade.castShadow = true;
  execLampGroup.add(execLampShade);

  const waltDeskLampBulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff3c4,
    emissive: 0xffb74d,
    emissiveIntensity: 2.4,
    roughness: 0.2,
  });
  const execLampBulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.068, 12, 12),
    waltDeskLampBulbMat
  );
  execLampBulb.position.set(0, 0.43, 0);
  execLampGroup.add(execLampBulb);

  // Focused Executive Desk Lamp SpotLight aimed across Walt's Kem Weber Redwood Desk & Memorabilia
  const waltDeskSpotLight = new THREE.SpotLight(0xffd27d, 3.2, 8.5, Math.PI / 2.6, 0.68, 1.35);
  waltDeskSpotLight.position.set(0, 0.44, 0);
  waltDeskSpotLight.target = blotterPad;
  execLampGroup.add(waltDeskSpotLight);

  // Warm Suite 3H Fill PointLight bathing the 1+7 Snow White Oscars & Steinway Grand Piano
  const waltDeskPointLight = new THREE.PointLight(0xffcf70, 2.2, 6.8, 1.4);
  waltDeskPointLight.position.set(0.45, 0.55, 0.25);
  execLampGroup.add(waltDeskPointLight);

  waltDeskGroup.add(execLampGroup);
  waltsOfficeGroup.add(waltDeskGroup);

  // E. CREDENZA, 1939 SNOW WHITE 1+7 ACADEMY AWARD & MINIATURE FIGURINE SHELVES
  const credenzaGroup = new THREE.Group();
  credenzaGroup.position.set(-0.85, 0.08, -1.48);

  const credenzaBody = new THREE.Mesh(
    new THREE.BoxGeometry(2.65, 0.84, 0.56),
    darkWalnutMat
  );
  credenzaBody.position.y = 0.42;
  credenzaBody.castShadow = true;
  credenzaBody.receiveShadow = true;
  credenzaGroup.add(credenzaBody);

  // THE 1939 "SNOW WHITE AND THE SEVEN DWARFS" 1+7 HONORARY OSCAR STATUETTE DISPLAY
  // Presented by Shirley Temple: 1 full-size Academy Award + 7 ascending miniature dwarf Oscars!
  const snowWhiteOscarGroup = new THREE.Group();
  snowWhiteOscarGroup.position.set(-0.48, 0.84, 0.04);

  // Stepped Art Deco Black Lacquer & Brass Base
  const oscarPlinthMain = new THREE.Mesh(
    new THREE.BoxGeometry(0.96, 0.06, 0.26),
    ebonyPianoMat
  );
  oscarPlinthMain.position.y = 0.03;
  snowWhiteOscarGroup.add(oscarPlinthMain);

  const oscarBrassPlaque = new THREE.Mesh(
    new THREE.BoxGeometry(0.88, 0.03, 0.015),
    brushedBrassMat
  );
  oscarBrassPlaque.position.set(0, 0.03, 0.132);
  snowWhiteOscarGroup.add(oscarBrassPlaque);

  // 1. Full-Size Golden Oscar Statuette on Left Pedestal
  const mainOscarPedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.065, 0.075, 0.08, 16),
    ebonyPianoMat
  );
  mainOscarPedestal.position.set(-0.36, 0.1, 0);
  snowWhiteOscarGroup.add(mainOscarPedestal);

  const mainOscarBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.022, 0.28, 12),
    oscarGoldMat
  );
  mainOscarBody.position.set(-0.36, 0.28, 0);
  mainOscarBody.castShadow = true;
  snowWhiteOscarGroup.add(mainOscarBody);

  const mainOscarHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.036, 12, 12),
    oscarGoldMat
  );
  mainOscarHead.position.set(-0.36, 0.45, 0);
  snowWhiteOscarGroup.add(mainOscarHead);

  // 2. Seven Miniature Dwarf-Sized Golden Oscar Statuettes on Stepped Riser
  for (let dIdx = 0; dIdx < 7; dIdx++) {
    const dx = -0.18 + dIdx * 0.095;
    const stepH = 0.04 + dIdx * 0.008;

    const dwarfStep = new THREE.Mesh(
      new THREE.CylinderGeometry(0.034, 0.038, stepH, 12),
      ebonyPianoMat
    );
    dwarfStep.position.set(dx, 0.06 + stepH / 2, 0);
    snowWhiteOscarGroup.add(dwarfStep);

    const dwarfBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.013, 0.13, 10),
      oscarGoldMat
    );
    dwarfBody.position.set(dx, 0.06 + stepH + 0.065, 0);
    dwarfBody.castShadow = true;
    snowWhiteOscarGroup.add(dwarfBody);

    const dwarfHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.02, 10, 10),
      oscarGoldMat
    );
    dwarfHead.position.set(dx, 0.06 + stepH + 0.145, 0);
    snowWhiteOscarGroup.add(dwarfHead);
  }
  credenzaGroup.add(snowWhiteOscarGroup);

  // Animated Brass Carousel / Music Box Miniature on Right Side of Credenza
  const waltsMusicBoxRotor = new THREE.Group();
  waltsMusicBoxRotor.position.set(0.68, 0.85, 0.04);

  const musicBoxBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.16, 0.06, 16),
    darkWalnutMat
  );
  musicBoxBase.position.y = 0.03;
  waltsMusicBoxRotor.add(musicBoxBase);

  const musicBoxCanopy = new THREE.Mesh(
    new THREE.ConeGeometry(0.16, 0.12, 12),
    oscarGoldMat
  );
  musicBoxCanopy.position.y = 0.25;
  waltsMusicBoxRotor.add(musicBoxCanopy);

  for (let p = 0; p < 4; p++) {
    const a = (p * Math.PI) / 2;
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.18, 8),
      brushedBrassMat
    );
    pole.position.set(Math.cos(a) * 0.1, 0.13, Math.sin(a) * 0.1);
    waltsMusicBoxRotor.add(pole);

    const miniHorse = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.04, 0.06),
      vellumPaperMat
    );
    miniHorse.position.set(Math.cos(a) * 0.1, 0.13, Math.sin(a) * 0.1);
    miniHorse.rotation.y = -a;
    waltsMusicBoxRotor.add(miniHorse);
  }
  credenzaGroup.add(waltsMusicBoxRotor);

  // Framed 1928 "Steamboat Willie" Original Animation Cel mounted on Redwood Wall above Credenza
  const steamboatTex = createWaltsSteamboatCelTexture(maxAnisotropy);
  const steamboatFrame = new THREE.Mesh(
    new THREE.BoxGeometry(1.42, 1.06, 0.06),
    brushedBrassMat
  );
  steamboatFrame.position.set(-0.35, 2.15, -0.25);
  steamboatFrame.castShadow = true;
  credenzaGroup.add(steamboatFrame);

  const steamboatCanvas = new THREE.Mesh(
    new THREE.PlaneGeometry(1.32, 0.96),
    new THREE.MeshStandardMaterial({ map: steamboatTex, roughness: 0.45 })
  );
  steamboatCanvas.position.set(0, 0, 0.035);
  steamboatFrame.add(steamboatCanvas);

  // Walt's Miniature Porcelain & Brass Figurine Collection Shelves on Left Redwood Wall
  const figurineColors = [0xef4444, 0x3b82f6, 0xf59e0b, 0x10b981, 0xf472b6, 0xeab308, 0x38bdf8, 0xf8fafc];
  [1.45, 2.05].forEach((sy, sIdx) => {
    const shelfBoard = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.04, 2.25),
      darkWalnutMat
    );
    shelfBoard.position.set(-2.45, sy, -0.15);
    shelfBoard.castShadow = true;
    waltsOfficeGroup.add(shelfBoard);

    for (let f = 0; f < 8; f++) {
      const fz = -1.05 + f * 0.26;
      const figCol = figurineColors[(f + sIdx * 3) % figurineColors.length];
      const figMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.065, 0.09 + (f % 3) * 0.025, 0.065),
        new THREE.MeshPhysicalMaterial({
          color: figCol,
          roughness: 0.2,
          clearcoat: 0.9,
        })
      );
      figMesh.position.set(-2.44, sy + 0.065, fz);
      waltsOfficeGroup.add(figMesh);
    }
  });

  waltsOfficeGroup.add(credenzaGroup);

  // F. CONFIDENTIAL "THE FLORIDA PROJECT" PULL-DOWN WALL MAP (On Right Half of Back Wall)
  const secretMapGroup = new THREE.Group();
  secretMapGroup.position.set(1.25, 2.22, -1.73);

  // Burgundy Velvet Curtain Valance & Brass Map Scroll Case
  const mapValance = new THREE.Mesh(
    new THREE.BoxGeometry(1.88, 0.16, 0.12),
    oxbloodLeatherMat
  );
  mapValance.position.set(0, 0.68, 0.02);
  secretMapGroup.add(mapValance);

  const mapBrassEnds = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.045, 1.96, 12),
    brushedBrassMat
  );
  mapBrassEnds.rotation.z = Math.PI / 2;
  mapBrassEnds.position.set(0, -0.66, 0.02);
  secretMapGroup.add(mapBrassEnds);

  const secretMapTex = createWaltsFloridaSecretMapTexture(maxAnisotropy);
  const secretMapMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1.76, 1.28),
    new THREE.MeshStandardMaterial({ map: secretMapTex, roughness: 0.65 })
  );
  secretMapMesh.position.set(0, 0, 0.02);
  secretMapGroup.add(secretMapMesh);
  waltsOfficeGroup.add(secretMapGroup);

  // G. SUITE 3H STEINWAY BABY GRAND PIANO ("Feed the Birds" Sherman Brothers Piano)
  const grandPianoGroup = new THREE.Group();
  grandPianoGroup.position.set(1.38, 0.08, 0.22);
  grandPianoGroup.rotation.y = -0.35;

  // Curved Grand Piano Case (Front Rectangular Soundbox + Rear Curved Tail Rim)
  const pianoFrontCase = new THREE.Mesh(
    new THREE.BoxGeometry(1.36, 0.34, 0.86),
    ebonyPianoMat
  );
  pianoFrontCase.position.set(0, 0.78, 0.22);
  pianoFrontCase.castShadow = true;
  grandPianoGroup.add(pianoFrontCase);

  const pianoTailCylinder = new THREE.Mesh(
    new THREE.CylinderGeometry(0.68, 0.68, 0.34, 24),
    ebonyPianoMat
  );
  pianoTailCylinder.position.set(0, 0.78, -0.22);
  pianoTailCylinder.castShadow = true;
  grandPianoGroup.add(pianoTailCylinder);

  // Exposed Golden Cast-Iron Harp & Steel Strings inside the Piano
  const goldenHarp = new THREE.Mesh(
    new THREE.CylinderGeometry(0.6, 0.6, 0.04, 24),
    oscarGoldMat
  );
  goldenHarp.position.set(0, 0.94, -0.18);
  grandPianoGroup.add(goldenHarp);

  // Propped-Open Satin Ebony Piano Lid & Brass Prop Stick
  const pianoLidGroup = new THREE.Group();
  pianoLidGroup.position.set(-0.66, 0.96, 0);
  pianoLidGroup.rotation.z = 0.46;

  const lidSlab = new THREE.Mesh(
    new THREE.BoxGeometry(1.32, 0.03, 1.38),
    ebonyPianoMat
  );
  lidSlab.position.set(0.66, 0, -0.05);
  lidSlab.castShadow = true;
  pianoLidGroup.add(lidSlab);
  grandPianoGroup.add(pianoLidGroup);

  const brassPropStick = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.014, 0.58, 8),
    brushedBrassMat
  );
  brassPropStick.position.set(0.42, 1.18, 0.1);
  brassPropStick.rotation.z = -0.35;
  grandPianoGroup.add(brassPropStick);

  // 88 Ivory & Ebony Keyboard Bed at Front of Grand Piano
  const keyBedFrame = new THREE.Mesh(
    new THREE.BoxGeometry(1.32, 0.12, 0.28),
    ebonyPianoMat
  );
  keyBedFrame.position.set(0, 0.72, 0.72);
  grandPianoGroup.add(keyBedFrame);

  const whiteKeys = new THREE.Mesh(
    new THREE.BoxGeometry(1.22, 0.035, 0.18),
    vellumPaperMat
  );
  whiteKeys.position.set(0, 0.79, 0.75);
  grandPianoGroup.add(whiteKeys);

  for (let k = -0.54; k <= 0.54; k += 0.065) {
    if (Math.abs((k * 10) % 3) < 0.4) continue;
    const blackKey = new THREE.Mesh(
      new THREE.BoxGeometry(0.025, 0.03, 0.11),
      ebonyPianoMat
    );
    blackKey.position.set(k, 0.815, 0.71);
    grandPianoGroup.add(blackKey);
  }

  // Music Stand with Sherman Brothers "Feed the Birds (Mary Poppins)" Sheet Music
  const musicDesk = new THREE.Mesh(
    new THREE.BoxGeometry(0.58, 0.24, 0.02),
    ebonyPianoMat
  );
  musicDesk.position.set(0, 1.06, 0.56);
  musicDesk.rotation.x = -0.22;
  grandPianoGroup.add(musicDesk);

  const sheetMusic = new THREE.Mesh(
    new THREE.PlaneGeometry(0.42, 0.22),
    vellumPaperMat
  );
  sheetMusic.position.set(0, 0.01, 0.015);
  musicDesk.add(sheetMusic);

  // 3 Grand Piano Tapered Legs with Brass Casters & Lyre Pedal Box
  [
    [-0.56, 0.48],
    [0.56, 0.48],
    [0, -0.74],
  ].forEach(([lx, lz]) => {
    const pLeg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.035, 0.64, 12),
      ebonyPianoMat
    );
    pLeg.position.set(lx, 0.32, lz);
    pLeg.castShadow = true;
    grandPianoGroup.add(pLeg);

    const caster = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.05, 10),
      brushedBrassMat
    );
    caster.position.set(lx, 0.025, lz);
    grandPianoGroup.add(caster);
  });

  // Brass Triple Foot Pedals & Lyre Strut
  const pedalLyre = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.58, 0.04),
    ebonyPianoMat
  );
  pedalLyre.position.set(0, 0.32, 0.52);
  grandPianoGroup.add(pedalLyre);

  const brassPedals = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.03, 0.14),
    brushedBrassMat
  );
  brassPedals.position.set(0, 0.05, 0.58);
  grandPianoGroup.add(brassPedals);

  // Tufted Leather Piano Bench in front of Keyboard
  const pianoBench = new THREE.Group();
  pianoBench.position.set(0, 0, 1.18);
  const benchCushion = new THREE.Mesh(
    new THREE.BoxGeometry(0.78, 0.09, 0.36),
    oxbloodLeatherMat
  );
  benchCushion.position.y = 0.48;
  benchCushion.castShadow = true;
  pianoBench.add(benchCushion);

  [-0.34, 0.34].forEach((bx) => {
    [-0.14, 0.14].forEach((bz) => {
      const bLeg = new THREE.Mesh(
        new THREE.BoxGeometry(0.045, 0.46, 0.045),
        ebonyPianoMat
      );
      bLeg.position.set(bx, 0.23, bz);
      pianoBench.add(bLeg);
    });
  });
  grandPianoGroup.add(pianoBench);

  waltsOfficeGroup.add(grandPianoGroup);

  // Clickable Hitboxes for Walt Disney's Desk & Memorabilia + 1+7 Snow White Oscars & Grand Piano
  const waltDeskHitbox = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, 2.6, 2.8),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  waltDeskHitbox.position.set(-1.05, 1.3, 0.1);
  waltDeskHitbox.userData = {
    artifactId: 'walts-office-desk',
    label: '沃尔特·迪士尼 3H 办公室：Kem Weber 弧形红木办公桌与私人珍藏',
  };
  waltsOfficeGroup.add(waltDeskHitbox);
  clickablePickTargets.push(waltDeskHitbox);

  const waltPianoOscarsHitbox = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 2.8, 3.2),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  waltPianoOscarsHitbox.position.set(1.25, 1.4, -0.2);
  waltPianoOscarsHitbox.userData = {
    artifactId: 'walts-piano-oscars',
    label: '1939《白雪公主》1+7 奥斯卡特别金像奖座与谢尔曼兄弟三角钢琴',
  };
  waltsOfficeGroup.add(waltPianoOscarsHitbox);
  clickablePickTargets.push(waltPianoOscarsHitbox);

  root.add(waltsOfficeGroup);

  return {
    root,
    draftingBoardGroup,
    draftingTiltGroup,
    mainBlueprintMesh,
    wallBlueprintMesh,
    tSquareGroup,
    triangleRulerGroup,
    compassGroup,
    draftingLampBulbMat,
    draftingSpotLight,
    waltDeskLampBulbMat,
    waltDeskSpotLight,
    waltDeskPointLight,
    animatronicGears,
    animatronicBirdGroup,
    littleManGroup,
    tapeReels,
    lillyBelleWheels,
    multiplaneLayers,
    clockMinuteHand,
    imagineerHeadGroup,
    waltsMusicBoxRotor,
    clickablePickTargets,
  };
}

