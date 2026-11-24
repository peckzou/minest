import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';

import {
  ArtifactInfo,
  BlueprintId,
  CameraPresetId,
  CustomVoxelBlock,
  LightingMode,
  ParkEdition,
  STUDIO_ARTIFACTS,
  VoxelBrushType,
} from './types/studio';
import { buildImagineerWorkshop, WorkshopRefs } from './three/buildImagineerWorkshop';
import { buildVoxelModelTable, ModelTableRefs } from './three/buildVoxelModelTable';
import { createBlueprintTexture } from './three/proceduralTextures';
import { StudioControlDock } from './components/StudioControlDock';
import { BlueprintInspectorModal } from './components/BlueprintInspectorModal';
import { soundEngine } from './utils/soundEffects';
import { DreamWorksPanel } from './components/DreamWorksPanel';
import {
  DreamWork,
  readWorks,
  onWorksChange,
  workToVoxels,
  openInWorkshop,
  placeInPark,
  newWork,
  wantedWork,
  WORKSHOP,
} from './minest/dreamWorks';

// Camera choreography presets covering the Imagineer Workshop & Voxel Disneyland Model Table
const CAMERA_PRESETS: Record<
  CameraPresetId,
  { pos: [number, number, number]; target: [number, number, number] }
> = {
  overview: {
    pos: [-2.4, 5.4, 8.2],
    target: [-0.4, 1.85, 0.1],
  },
  drafting: {
    pos: [-4.25, 3.55, 4.15],
    target: [-5.15, 2.08, 1.75],
  },
  'model-table': {
    pos: [0.85, 4.45, 5.35],
    target: [0.85, 1.55, 0.2],
  },
  'castle-closeup': {
    pos: [0.15, 3.05, 2.35],
    target: [0.85, 2.15, -0.35],
  },
  'blueprint-wall': {
    pos: [0.8, 3.6, -1.2],
    target: [0.8, 3.15, -5.8],
  },
  'kem-weber-desk': {
    pos: [-5.15, 3.45, -0.25],
    target: [-7.85, 1.85, -2.55],
  },
  'animatronics-lab': {
    pos: [3.65, 3.05, -0.45],
    target: [6.35, 1.95, -1.75],
  },
  'machine-shop': {
    pos: [3.65, 3.0, 4.25],
    target: [6.35, 1.85, 2.65],
  },
  'walts-office': {
    pos: [-3.45, 3.12, 7.68],
    target: [-7.05, 1.42, 5.38],
  },
};

interface LightingEnvSpec {
  bgHex: number;
  fogDensity: number;
  keyIntensity: number;
  keyColorHex: number;
  hemiIntensity: number;
  rimIntensity: number;
  draftingSpotIntensity: number;
  draftingBulbEmissive: number;
  waltSpotIntensity: number;
  waltPointIntensity: number;
  waltBulbEmissive: number;
  toneExposure: number;
}

const LIGHTING_ENV_PRESETS: Record<LightingMode, LightingEnvSpec> = {
  'studio-day': {
    bgHex: 0x111927,
    fogDensity: 0.025,
    keyIntensity: 2.4,
    keyColorHex: 0xfff1d6,
    hemiIntensity: 0.9,
    rimIntensity: 0.8,
    draftingSpotIntensity: 3.5,
    draftingBulbEmissive: 2.2,
    waltSpotIntensity: 2.4,
    waltPointIntensity: 1.6,
    waltBulbEmissive: 2.0,
    toneExposure: 1.12,
  },
  'late-night': {
    bgHex: 0x070b12,
    fogDensity: 0.032,
    keyIntensity: 0.42,
    keyColorHex: 0x64748b,
    hemiIntensity: 0.28,
    rimIntensity: 0.48,
    draftingSpotIntensity: 7.8,
    draftingBulbEmissive: 3.6,
    waltSpotIntensity: 2.2,
    waltPointIntensity: 1.4,
    waltBulbEmissive: 1.8,
    toneExposure: 1.06,
  },
  'walts-desk-lamp': {
    // Warm Mahogany-Twilight Suite 3H Ambiance with focused golden desk lamp beam on Walt's Kem Weber Desk
    bgHex: 0x0b0a12,
    fogDensity: 0.028,
    keyIntensity: 0.48,
    keyColorHex: 0xd9a05b,
    hemiIntensity: 0.32,
    rimIntensity: 0.65,
    draftingSpotIntensity: 1.6,
    draftingBulbEmissive: 1.1,
    waltSpotIntensity: 10.5,
    waltPointIntensity: 5.8,
    waltBulbEmissive: 4.8,
    toneExposure: 1.18,
  },
  'blueprint-xray': {
    bgHex: 0x081e38,
    fogDensity: 0.026,
    keyIntensity: 1.65,
    keyColorHex: 0xbae6fd,
    hemiIntensity: 0.95,
    rimIntensity: 1.1,
    draftingSpotIntensity: 4.5,
    draftingBulbEmissive: 2.2,
    waltSpotIntensity: 2.8,
    waltPointIntensity: 1.8,
    waltBulbEmissive: 2.0,
    toneExposure: 1.14,
  },
};

const BRUSH_COLOR_MAP: Record<Exclude<VoxelBrushType, 'erase'>, number> = {
  'castle-pink': 0xf4acb7,
  'royal-blue': 0x2563eb,
  'gold-spire': 0xf59e0b,
  'emerald-tree': 0x16a34a,
  'water-moat': 0x0ea5e9,
  'red-brick': 0xdc2626,
};

// Module-scope pre-allocated math objects (Zero GC in render loop)
const _raycaster = new THREE.Raycaster();
const _pointer = new THREE.Vector2();
const _localHit = new THREE.Vector3();
const _targetBgColor = new THREE.Color();
const _targetKeyColor = new THREE.Color();

function isObjectHierarchyVisible(obj: THREE.Object3D | null): boolean {
  let curr: THREE.Object3D | null = obj;
  while (curr) {
    if (!curr.visible) return false;
    curr = curr.parent;
  }
  return true;
}

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);

  // UI React State — Defaults to Orlando Walt Disney World ("The Florida Project" 1971)
  const [parkEdition, setParkEdition] = useState<ParkEdition>('orlando-1971');
  const [activeCamera, setActiveCamera] = useState<CameraPresetId>('overview');
  const [activeBlueprint, setActiveBlueprint] = useState<BlueprintId>('cinderella-castle-189');
  const [lightingMode, setLightingMode] = useState<LightingMode>('studio-day');
  const [explodedAmount, setExplodedAmount] = useState<number>(0);
  const [draftingTiltDeg, setDraftingTiltDeg] = useState<number>(20);
  const [trainSpeedMultiplier, setTrainSpeedMultiplier] = useState<number>(1);
  const [voxelBuildEnabled, setVoxelBuildEnabled] = useState<boolean>(false);
  const [activeVoxelBrush, setActiveVoxelBrush] = useState<VoxelBrushType>('castle-pink');
  const [customVoxels, setCustomVoxels] = useState<CustomVoxelBlock[]>([
    // Initial sample voxel stack on the model table corner so user sees custom blocks right away
    { gx: -5, gy: 1, gz: -4, colorHex: 0xf4acb7, type: 'castle-pink' },
    { gx: -5, gy: 2, gz: -4, colorHex: 0x2563eb, type: 'royal-blue' },
    { gx: -5, gy: 3, gz: -4, colorHex: 0xf59e0b, type: 'gold-spire' },
  ]);
  const [selectedArtifact, setSelectedArtifact] = useState<ArtifactInfo | null>(
    STUDIO_ARTIFACTS['cinderella-castle-model']
  );
  const [isBlueprintModalOpen, setIsBlueprintModalOpen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  // phones start with the dock folded away, so the table and the dream works panel have room
  const [isDockCollapsed, setIsDockCollapsed] = useState<boolean>(() => window.innerWidth < 640);
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);

  // Imagineer 4.0 dream works on the model table (see minest/dreamWorks.ts)
  const [works, setWorks] = useState<DreamWork[]>(() => readWorks());
  const [worksOpen, setWorksOpen] = useState<boolean>(true);
  const [activeWorkId, setActiveWorkId] = useState<string | null>(null);
  const [building, setBuilding] = useState<number>(-1);
  const buildRef = useRef<{ timer: number; all: CustomVoxelBlock[] }>({ timer: 0, all: [] });

  // Mutable refs accessed inside the Three.js animation loop without re-mounting WebGL
  const stateRef = useRef({
    parkEdition: 'orlando-1971' as ParkEdition,
    explodedTarget: 0,
    explodedCurrent: 0,
    draftingTiltRadTarget: THREE.MathUtils.degToRad(20),
    draftingTiltRadCurrent: THREE.MathUtils.degToRad(20),
    trainSpeed: 1,
    trainPhase: 0,
    monorailPhase: 0,
    lightingMode: 'studio-day' as LightingMode,
    autoWaltLampActive: false,
    voxelBuildEnabled: false,
    activeVoxelBrush: 'castle-pink' as VoxelBrushType,
    customVoxels: customVoxels,
    cameraTransitionActive: false,
    cameraTargetPos: new THREE.Vector3(...CAMERA_PRESETS.overview.pos),
    cameraTargetLook: new THREE.Vector3(...CAMERA_PRESETS.overview.target),
  });

  // Scene references for dynamic updates
  const sceneRefs = useRef<{
    workshop: WorkshopRefs | null;
    modelTable: ModelTableRefs | null;
    keyLight: THREE.DirectionalLight | null;
    hemiLight: THREE.HemisphereLight | null;
    rimLight: THREE.DirectionalLight | null;
    scene: THREE.Scene | null;
    maxAnisotropy: number;
  }>({
    workshop: null,
    modelTable: null,
    keyLight: null,
    hemiLight: null,
    rimLight: null,
    scene: null,
    maxAnisotropy: 1,
  });

  // Keep stateRef synced with React controls
  useEffect(() => {
    stateRef.current.explodedTarget = explodedAmount;
  }, [explodedAmount]);

  useEffect(() => {
    stateRef.current.draftingTiltRadTarget = THREE.MathUtils.degToRad(draftingTiltDeg);
  }, [draftingTiltDeg]);

  useEffect(() => {
    stateRef.current.trainSpeed = trainSpeedMultiplier;
  }, [trainSpeedMultiplier]);

  useEffect(() => {
    stateRef.current.voxelBuildEnabled = voxelBuildEnabled;
  }, [voxelBuildEnabled]);

  useEffect(() => {
    stateRef.current.activeVoxelBrush = activeVoxelBrush;
  }, [activeVoxelBrush]);

  useEffect(() => {
    stateRef.current.customVoxels = customVoxels;
    if (sceneRefs.current.modelTable) {
      sceneRefs.current.modelTable.rebuildCustomVoxels(customVoxels);
    }
  }, [customVoxels]);

  // Swap 3D Blueprint Texture on the Vintage Drafting Board when activeBlueprint changes
  useEffect(() => {
    const { workshop, maxAnisotropy } = sceneRefs.current;
    if (!workshop) return;

    const newTex = createBlueprintTexture(activeBlueprint, maxAnisotropy, 'cyanotype');
    const mat = workshop.mainBlueprintMesh.material as THREE.MeshStandardMaterial;
    if (mat.map) mat.map.dispose();
    mat.map = newTex;
    mat.needsUpdate = true;
  }, [activeBlueprint]);

  // Swap Park Edition (Orlando WDW 1971 vs Anaheim 1955) on the Voxel Model Table & Back Wall Master Plan
  useEffect(() => {
    stateRef.current.parkEdition = parkEdition;
    const { modelTable, workshop, maxAnisotropy } = sceneRefs.current;
    if (modelTable) {
      modelTable.setParkEdition(parkEdition);
    }
    if (workshop) {
      const wallBpId: BlueprintId =
        parkEdition === 'orlando-1971' ? 'florida-project-epcot' : 'master-plan';
      const newWallTex = createBlueprintTexture(wallBpId, maxAnisotropy, 'cyanotype');
      const wallMat = workshop.wallBlueprintMesh.material as THREE.MeshStandardMaterial;
      if (wallMat.map) wallMat.map.dispose();
      wallMat.map = newWallTex;
      wallMat.needsUpdate = true;
    }
  }, [parkEdition]);

  // Update Studio Lighting target & Blueprint X-Ray Grid when lightingMode changes
  // (Smooth color/intensity interpolation happens continuously inside tick()!)
  useEffect(() => {
    stateRef.current.lightingMode = lightingMode;
    const { modelTable } = sceneRefs.current;
    if (!modelTable) return;
    modelTable.blueprintWireframeGroup.visible = lightingMode === 'blueprint-xray';
  }, [lightingMode]);

  // Camera Preset Selection Handler — Selecting 'walts-office' automatically triggers
  // the Suite 3H Executive Desk Lamp lighting effect and studio environment transition!
  const handleSelectCamera = useCallback((preset: CameraPresetId) => {
    setActiveCamera(preset);
    const targetSpec = CAMERA_PRESETS[preset];
    stateRef.current.cameraTargetPos.set(...targetSpec.pos);
    stateRef.current.cameraTargetLook.set(...targetSpec.target);
    stateRef.current.cameraTransitionActive = true;

    if (preset === 'walts-office') {
      stateRef.current.autoWaltLampActive = true;
      setLightingMode('walts-desk-lamp');
    } else if (stateRef.current.autoWaltLampActive) {
      stateRef.current.autoWaltLampActive = false;
      setLightingMode('studio-day');
    }

    const currentEdition = stateRef.current.parkEdition;
    if (preset === 'drafting') {
      setSelectedArtifact(STUDIO_ARTIFACTS['drafting-board']);
    } else if (preset === 'model-table') {
      setSelectedArtifact(
        currentEdition === 'orlando-1971'
          ? STUDIO_ARTIFACTS['contemporary-monorail-model']
          : STUDIO_ARTIFACTS['model-table']
      );
    } else if (preset === 'castle-closeup') {
      setSelectedArtifact(
        currentEdition === 'orlando-1971'
          ? STUDIO_ARTIFACTS['cinderella-castle-model']
          : STUDIO_ARTIFACTS['castle-model']
      );
    } else if (preset === 'blueprint-wall') {
      setSelectedArtifact(STUDIO_ARTIFACTS['blueprint-wall']);
    } else if (preset === 'kem-weber-desk') {
      setSelectedArtifact(STUDIO_ARTIFACTS['kem-weber-multiplane']);
    } else if (preset === 'animatronics-lab') {
      setSelectedArtifact(STUDIO_ARTIFACTS['little-man-lab']);
    } else if (preset === 'machine-shop') {
      setSelectedArtifact(STUDIO_ARTIFACTS['lilly-belle-shop']);
    } else if (preset === 'walts-office') {
      setSelectedArtifact(STUDIO_ARTIFACTS['walts-office-desk']);
    }
  }, []);

  // Switch between Orlando WDW (1971) and Anaheim Disneyland (1955)
  const handleSelectParkEdition = useCallback(
    (edition: ParkEdition) => {
      soundEngine.playBlueprintSwitch();
      // leaving a dream work: the table goes back to the park model
      const b = buildRef.current;
      if (b.all.length) {
        if (b.timer) window.clearInterval(b.timer);
        b.timer = 0;
        b.all = [];
        setBuilding(-1);
        setCustomVoxels([]);
      }
      setActiveWorkId(null);
      setParkEdition(edition);
      if (edition === 'orlando-1971') {
        setActiveBlueprint('cinderella-castle-189');
        setSelectedArtifact(STUDIO_ARTIFACTS['cinderella-castle-model']);
      } else {
        setActiveBlueprint('castle-elevation');
        setSelectedArtifact(STUDIO_ARTIFACTS['castle-model']);
      }
      if (activeCamera !== 'model-table' && activeCamera !== 'castle-closeup') {
        handleSelectCamera('model-table');
      }
    },
    [activeCamera, handleSelectCamera]
  );

  // ---------------------------------------------------------------- dream works → model table
  const finishBuild = useCallback(() => {
    const b = buildRef.current;
    if (b.timer) window.clearInterval(b.timer);
    b.timer = 0;
    setCustomVoxels(b.all);
    setBuilding(-1);
  }, []);

  const buildWork = useCallback(
    (w: DreamWork) => {
      const b = buildRef.current;
      if (b.timer) window.clearInterval(b.timer);
      const all = workToVoxels(w);
      b.all = all;
      setActiveWorkId(w.id);
      setVoxelBuildEnabled(false);
      setExplodedAmount(0);
      handleSelectCamera('model-table');
      soundEngine.playBlueprintSwitch();
      if (!all.length) {
        setCustomVoxels([]);
        setBuilding(-1);
        return;
      }
      // the making-of: the voxels go up layer by layer in about three seconds
      const steps = 36;
      const per = Math.max(1, Math.ceil(all.length / steps));
      let n = 0;
      setCustomVoxels([]);
      setBuilding(0);
      b.timer = window.setInterval(() => {
        n = Math.min(all.length, n + per);
        setCustomVoxels(all.slice(0, n));
        setBuilding(n / all.length);
        if (n % (per * 3) < per) soundEngine.playVoxelTap(false);
        if (n >= all.length) finishBuild();
      }, 85);
    },
    [handleSelectCamera, finishBuild]
  );

  useEffect(() => {
    const refresh = () => setWorks(readWorks());
    onWorksChange(refresh);
    // the home store may fill a moment after the page opens (cloud / host)
    const t1 = window.setTimeout(refresh, 600);
    const t2 = window.setTimeout(refresh, 2500);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      if (buildRef.current.timer) window.clearInterval(buildRef.current.timer);
    };
  }, []);

  // a dream work on the table: the built-in park model steps aside (the train keeps running round the edge)
  useEffect(() => {
    sceneRefs.current.modelTable?.showPark(!activeWorkId);
  }, [activeWorkId]);

  const clearWork = useCallback(() => {
    const b = buildRef.current;
    if (b.timer) window.clearInterval(b.timer);
    b.timer = 0;
    b.all = [];
    setBuilding(-1);
    setActiveWorkId(null);
    setCustomVoxels([]);
  }, []);

  // opened from 梦工坊 with ?work=<id>: put that work on the table straight away
  const wantedDone = useRef(false);
  useEffect(() => {
    if (wantedDone.current) return;
    const id = wantedWork();
    if (!id) return;
    const w = works.find((x) => x.id === id);
    if (!w) return;
    wantedDone.current = true;
    window.setTimeout(() => buildWork(w), 700);
  }, [works, buildWork]);

  // Keyboard shortcut 'H' to collapse/expand bottom control dock
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'h' || e.key === 'H') {
        if (document.activeElement?.tagName === 'INPUT') return;
        setIsDockCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // ============================================================================
  // MAIN THREE.JS SCENE INITIALIZATION (Mounted once in isolated ref container)
  // ============================================================================
  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    // 1. Software WebGL Guard (read from UNMASKED_RENDERER_WEBGL string)
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    sceneRefs.current.maxAnisotropy = maxAnisotropy;

    // 2. Scene, Studio Environment Map (RoomEnvironment), and Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111927);
    scene.fog = new THREE.FogExp2(0x111927, 0.025);
    sceneRefs.current.scene = scene;

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 120);
    camera.position.set(...CAMERA_PRESETS.overview.pos);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(...CAMERA_PRESETS.overview.target);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 - 0.03; // Never clip below studio floor
    controls.minDistance = 1.4;
    controls.maxDistance = 19.5;
    controls.update();

    // Cancel scripted camera transition immediately when user manually orbits/pans
    const onControlStart = () => {
      stateRef.current.cameraTransitionActive = false;
    };
    controls.addEventListener('start', onControlStart);

    // 3. Balanced 3-Point Studio Lighting Rig + Softbox
    // Key Light: Warm California Sunbeams through West Studio Windows
    const keyLight = new THREE.DirectionalLight(0xfff1d6, 2.4);
    keyLight.position.set(-9.5, 11.5, 6.5);
    keyLight.castShadow = !isSoftwareGl;
    const d = 10.5;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.camera.near = 1.0;
    keyLight.shadow.camera.far = 30.0;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);
    sceneRefs.current.keyLight = keyLight;

    // Cool Sky / Warm Floor Hemisphere Fill Light
    const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x3d2817, 0.9);
    hemiLight.position.set(0, 12, 0);
    scene.add(hemiLight);
    sceneRefs.current.hemiLight = hemiLight;

    // Warm Rim Backlight separating Castle Spires & Drafting Lamp from Back Wall
    const rimLight = new THREE.DirectionalLight(0xfbbf24, 0.8);
    rimLight.position.set(7.5, 8.0, -7.5);
    scene.add(rimLight);
    sceneRefs.current.rimLight = rimLight;

    // Studio Overhead Softbox over the Voxel Model Table (skip on software WebGL)
    if (!isSoftwareGl) {
      RectAreaLightUniformsLib.init();
      const softbox = new THREE.RectAreaLight(0xfff7ed, 3.2, 5.5, 3.8);
      softbox.position.set(0.85, 5.4, 0.35);
      softbox.lookAt(0.85, 1.35, 0.35);
      scene.add(softbox);
    }

    // 4. Build the WED Enterprises Imagineer Workshop & Dual-Edition Voxel Model Table
    const workshop = buildImagineerWorkshop(
      maxAnisotropy,
      isSoftwareGl,
      'cinderella-castle-189'
    );
    // Initialize back wall blueprint to Orlando Florida Project Master Plan
    const wallMat = workshop.wallBlueprintMesh.material as THREE.MeshStandardMaterial;
    if (wallMat.map) wallMat.map.dispose();
    wallMat.map = createBlueprintTexture('florida-project-epcot', maxAnisotropy, 'cyanotype');
    wallMat.needsUpdate = true;

    scene.add(workshop.root);
    sceneRefs.current.workshop = workshop;

    const modelTable = buildVoxelModelTable(isSoftwareGl);
    modelTable.setParkEdition(stateRef.current.parkEdition);
    modelTable.rebuildCustomVoxels(stateRef.current.customVoxels);
    scene.add(modelTable.root);
    sceneRefs.current.modelTable = modelTable;

    // All pickable objects for artifact inspection
    const allPickables: THREE.Object3D[] = [
      ...workshop.clickablePickTargets,
      ...modelTable.clickablePickTargets,
    ];

    // Pre-warm shaders on hardware GPU
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // 5. Pointer Raycasting (Click to Inspect Artifact OR Place Voxel Block on Table)
    let pointerDownPos = { x: 0, y: 0 };
    const onPointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
      const moveDist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      if (moveDist > 6) return; // Ignore orbit drag releases

      const rect = renderer.domElement.getBoundingClientRect();
      _pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      _raycaster.setFromCamera(_pointer, camera);

      // Mode A: Voxel Sculpting on the Model Table
      if (stateRef.current.voxelBuildEnabled) {
        const hits = _raycaster.intersectObject(modelTable.placementPlane, false);
        if (hits.length > 0) {
          _localHit.copy(hits[0].point);
          modelTable.root.worldToLocal(_localHit);

          const gx = Math.round(_localHit.x / modelTable.voxelUnitSize);
          const gz = Math.round(_localHit.z / modelTable.voxelUnitSize);

          if (Math.abs(gx) <= 22 && Math.abs(gz) <= 15) {
            const brush = stateRef.current.activeVoxelBrush;
            if (brush === 'erase') {
              // Remove top custom voxel at (gx, gz)
              setCustomVoxels((prev) => {
                const matching = prev.filter((b) => b.gx === gx && b.gz === gz);
                if (matching.length === 0) return prev;
                const maxGy = Math.max(...matching.map((m) => m.gy));
                soundEngine.playVoxelTap(true);
                return prev.filter((b) => !(b.gx === gx && b.gz === gz && b.gy === maxGy));
              });
            } else {
              // Stack a new voxel block at (gx, gz)
              setCustomVoxels((prev) => {
                const matching = prev.filter((b) => b.gx === gx && b.gz === gz);
                const nextGy =
                  matching.length > 0 ? Math.max(...matching.map((m) => m.gy)) + 1 : 1;
                if (nextGy > 22) return prev;
                soundEngine.playVoxelTap(false);
                return [
                  ...prev,
                  {
                    gx,
                    gy: nextGy,
                    gz,
                    colorHex: BRUSH_COLOR_MAP[brush],
                    type: brush,
                  },
                ];
              });
            }
            return;
          }
        }
      }

      // Mode B: Inspect 3D Studio Artifacts (only test visible hitboxes for active park edition)
      const visiblePickables = allPickables.filter((obj) => isObjectHierarchyVisible(obj));
      const pickHits = _raycaster.intersectObjects(visiblePickables, false);
      if (pickHits.length > 0) {
        const artifactId = pickHits[0].object.userData?.artifactId as string | undefined;
        if (artifactId && STUDIO_ARTIFACTS[artifactId]) {
          const info = STUDIO_ARTIFACTS[artifactId];
          setSelectedArtifact(info);
          soundEngine.playBlueprintSwitch();
          if (info.relatedBlueprint) {
            setActiveBlueprint(info.relatedBlueprint);
          }
          if (info.cameraPreset) {
            handleSelectCamera(info.cameraPreset);
          }
        }
      }
    };

    // Throttled hover tooltip check
    let lastHoverCheck = 0;
    const onPointerMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - lastHoverCheck < 65) return;
      lastHoverCheck = now;

      const rect = renderer.domElement.getBoundingClientRect();
      _pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      _raycaster.setFromCamera(_pointer, camera);

      if (stateRef.current.voxelBuildEnabled) {
        const tableHit = _raycaster.intersectObject(modelTable.placementPlane, false);
        if (tableHit.length > 0) {
          renderer.domElement.style.cursor = 'crosshair';
          setHoveredLabel('点击沙盘网格放置/移除体素块');
          return;
        }
      }

      const visiblePickables = allPickables.filter((obj) => isObjectHierarchyVisible(obj));
      const hits = _raycaster.intersectObjects(visiblePickables, false);
      if (hits.length > 0) {
        const label = hits[0].object.userData?.label as string | undefined;
        renderer.domElement.style.cursor = 'pointer';
        setHoveredLabel(label || null);
      } else {
        renderer.domElement.style.cursor = 'grab';
        setHoveredLabel(null);
      }
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('pointerdown', onPointerDown);
    domElem.addEventListener('pointerup', onPointerUp);
    domElem.addEventListener('pointermove', onPointerMove);

    // 6. Resize Handler
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // 7. Animation Loop with Software-WebGL fenceSync Pacing & Smooth Damping
    const clock = new THREE.Clock();
    let frameId = 0;
    let isDisposed = false;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || !gl.fenceSync) {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (isDisposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (isDisposed) return;
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();
      const st = stateRef.current;

      // A. Smooth Camera Preset Interpolation (Exponential Damping)
      if (st.cameraTransitionActive) {
        const dampLambda = 5.2;
        camera.position.x = THREE.MathUtils.damp(
          camera.position.x,
          st.cameraTargetPos.x,
          dampLambda,
          delta
        );
        camera.position.y = THREE.MathUtils.damp(
          camera.position.y,
          st.cameraTargetPos.y,
          dampLambda,
          delta
        );
        camera.position.z = THREE.MathUtils.damp(
          camera.position.z,
          st.cameraTargetPos.z,
          dampLambda,
          delta
        );

        controls.target.x = THREE.MathUtils.damp(
          controls.target.x,
          st.cameraTargetLook.x,
          dampLambda,
          delta
        );
        controls.target.y = THREE.MathUtils.damp(
          controls.target.y,
          st.cameraTargetLook.y,
          dampLambda,
          delta
        );
        controls.target.z = THREE.MathUtils.damp(
          controls.target.z,
          st.cameraTargetLook.z,
          dampLambda,
          delta
        );

        if (
          camera.position.distanceTo(st.cameraTargetPos) < 0.025 &&
          controls.target.distanceTo(st.cameraTargetLook) < 0.025
        ) {
          st.cameraTransitionActive = false;
        }
      }

      controls.update();

      // A2. Smooth Studio Environment & Walt's Office Desk Lamp Lighting Transition
      const envSpec = LIGHTING_ENV_PRESETS[st.lightingMode];
      const envLambda = 4.2;
      const colorAlpha = 1 - Math.exp(-envLambda * delta);

      _targetBgColor.setHex(envSpec.bgHex);
      if (scene.background instanceof THREE.Color) {
        scene.background.lerp(_targetBgColor, colorAlpha);
      }
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.lerp(_targetBgColor, colorAlpha);
        scene.fog.density = THREE.MathUtils.damp(
          scene.fog.density,
          envSpec.fogDensity,
          envLambda,
          delta
        );
      }

      renderer.toneMappingExposure = THREE.MathUtils.damp(
        renderer.toneMappingExposure,
        envSpec.toneExposure,
        envLambda,
        delta
      );

      _targetKeyColor.setHex(envSpec.keyColorHex);
      keyLight.color.lerp(_targetKeyColor, colorAlpha);
      keyLight.intensity = THREE.MathUtils.damp(
        keyLight.intensity,
        envSpec.keyIntensity,
        envLambda,
        delta
      );
      hemiLight.intensity = THREE.MathUtils.damp(
        hemiLight.intensity,
        envSpec.hemiIntensity,
        envLambda,
        delta
      );
      rimLight.intensity = THREE.MathUtils.damp(
        rimLight.intensity,
        envSpec.rimIntensity,
        envLambda,
        delta
      );

      // Drafting Board Pantograph Lamp Damping
      workshop.draftingSpotLight.intensity = THREE.MathUtils.damp(
        workshop.draftingSpotLight.intensity,
        envSpec.draftingSpotIntensity,
        envLambda,
        delta
      );
      workshop.draftingLampBulbMat.emissiveIntensity = THREE.MathUtils.damp(
        workshop.draftingLampBulbMat.emissiveIntensity,
        envSpec.draftingBulbEmissive,
        envLambda,
        delta
      );

      // Walt's Suite 3H Office Brass Desk Lamp SpotLight, Fill PointLight & Warm Filament Shimmer
      const waltFlicker =
        st.lightingMode === 'walts-desk-lamp' ? Math.sin(elapsed * 3.8) * 0.28 : 0;
      workshop.waltDeskSpotLight.intensity = THREE.MathUtils.damp(
        workshop.waltDeskSpotLight.intensity,
        envSpec.waltSpotIntensity + waltFlicker,
        envLambda,
        delta
      );
      workshop.waltDeskPointLight.intensity = THREE.MathUtils.damp(
        workshop.waltDeskPointLight.intensity,
        envSpec.waltPointIntensity + waltFlicker * 0.5,
        envLambda,
        delta
      );
      workshop.waltDeskLampBulbMat.emissiveIntensity = THREE.MathUtils.damp(
        workshop.waltDeskLampBulbMat.emissiveIntensity,
        envSpec.waltBulbEmissive,
        envLambda,
        delta
      );

      // B. Smooth Exploded View Layer Damping (Model Table + Underground Utilidors + Drafting Tools)
      st.explodedCurrent = THREE.MathUtils.damp(
        st.explodedCurrent,
        st.explodedTarget,
        6.0,
        delta
      );
      const exp = st.explodedCurrent;
      const baseTableY = modelTable.tableSurfaceY + 0.025;

      // Anaheim 1955 Layers
      modelTable.layerBuildingsGroup.position.y = baseTableY + exp * 0.52;
      modelTable.layerSpireRoofsGroup.position.y = baseTableY + exp * 1.08;
      modelTable.layerVehiclesGroup.position.y = baseTableY + exp * 1.48;

      // Orlando WDW 1971 Layers — Underground Utilidors remain anchored at baseTableY while 2nd-Floor Park Deck lifts!
      modelTable.orlandoUtilidorsGroup.position.y = baseTableY;
      modelTable.orlandoTerrainGroup.position.y = baseTableY + exp * 0.36;
      modelTable.orlandoBuildingsGroup.position.y = baseTableY + exp * 0.82;
      modelTable.orlandoSpiresGroup.position.y = baseTableY + exp * 1.32;
      modelTable.orlandoVehiclesGroup.position.y = baseTableY + exp * 1.66;

      modelTable.customVoxelGroup.position.y = baseTableY + exp * 0.52;

      // Also show blueprint coordinate wireframe under model when exploded > 10%
      if (st.lightingMode !== 'blueprint-xray') {
        modelTable.blueprintWireframeGroup.visible = exp > 0.08;
      }

      // Lift Drafting Tools (T-Square, Triangle Ruler, Brass Compass) & Multiplane Glass Planes in Exploded View
      workshop.tSquareGroup.position.y = 0.095 + exp * 0.25;
      workshop.triangleRulerGroup.position.y = 0.11 + exp * 0.42;
      workshop.compassGroup.position.y = 0.095 + exp * 0.56;
      workshop.multiplaneLayers.forEach((layer, lIdx) => {
        const baseLayerY = 0.85 + lIdx * 0.7;
        layer.position.y = baseLayerY + exp * (lIdx * 0.25);
      });

      // C. Smooth Vintage Drafting Board Tilt Damping
      st.draftingTiltRadCurrent = THREE.MathUtils.damp(
        st.draftingTiltRadCurrent,
        st.draftingTiltRadTarget,
        7.0,
        delta
      );
      workshop.draftingTiltGroup.rotation.x = st.draftingTiltRadCurrent;

      // D. Animate Perimeter Steam Train (shared outer loop for both Orlando WDW & Anaheim)
      st.trainPhase += delta * 0.36 * st.trainSpeed;
      const u = modelTable.voxelUnitSize;
      const rx = 22.3 * u;
      const rz = 15.6 * u;
      const trackY = 2.0 * u;

      modelTable.trainCars.forEach((car, idx) => {
        const theta = st.trainPhase - idx * 0.16;
        const cx = Math.cos(theta) * rx;
        const cz = Math.sin(theta) * rz;
        // Tangent heading angle along ellipse
        const tx = -Math.sin(theta) * rx;
        const tz = Math.cos(theta) * rz;
        const heading = Math.atan2(tx, tz);

        car.position.set(cx, trackY, cz);
        car.rotation.y = heading;
      });

      // Voxel Steam Puffs trailing above the Locomotive Smokestack
      modelTable.steamPuffs.forEach((puff, pIdx) => {
        const cycle = (elapsed * 1.8 + pIdx * 0.2) % 1;
        const trailAngle = st.trainPhase - cycle * 0.18;
        puff.position.set(
          Math.cos(trailAngle) * rx,
          trackY + 0.26 + cycle * 0.34,
          Math.sin(trailAngle) * rz
        );
        const s = 1 - cycle * 0.65;
        puff.scale.setScalar(Math.max(0.2, s));
      });

      // E. Animate Orlando Mark IV Monorail gliding along elevated beamway through Contemporary Resort A-Frame!
      st.monorailPhase += delta * 0.55 * st.trainSpeed;
      const monoCenterX = 6.5 * u;
      const monoCenterZ = 2.5 * u;
      const monoRx = 10.5 * u;
      const monoRz = 11.5 * u;
      const monoY = 4.65 * u;

      modelTable.monorailCars.forEach((car, idx) => {
        const theta = st.monorailPhase - idx * 0.21;
        const cx = monoCenterX + Math.cos(theta) * monoRx;
        const cz = monoCenterZ + Math.sin(theta) * monoRz;
        const tx = -Math.sin(theta) * monoRx;
        const tz = Math.cos(theta) * monoRz;
        const heading = Math.atan2(tx, tz);

        car.position.set(cx, monoY, cz);
        car.rotation.y = heading;
      });

      // Orlando Seven Seas Lagoon Ferryboat & Spaceship Earth Internal Prism Core
      const ferryZ = Math.sin(elapsed * 0.42) * 8.5 * u;
      const ferryX = (-13.5 + Math.sin((ferryZ / u) * 0.3) * 1.6) * u;
      modelTable.orlandoFerryGroup.position.set(ferryX, u * 0.6, ferryZ);
      modelTable.orlandoFerryGroup.rotation.y =
        Math.cos(elapsed * 0.42) > 0 ? 0.12 : Math.PI - 0.12;
      modelTable.orlandoFerryWheel.rotation.x = elapsed * 3.6;
      modelTable.spaceshipEarthPrismCore.rotation.y = elapsed * 0.35;

      // F. Animate Anaheim King Arthur Carrousel, Dumbo Flying Elephant, Astro Jets, and Mark Twain Sternwheeler
      modelTable.carouselCanopy.rotation.y = elapsed * 0.85;
      modelTable.dumboRotor.rotation.y = elapsed * 1.15;
      modelTable.astroJetsRotor.rotation.y = -elapsed * 1.45;

      const boatZ = Math.sin(elapsed * 0.45) * 9.5 * u;
      const boatX = (-13.5 + Math.sin((boatZ / u) * 0.35) * 2.1) * u;
      modelTable.riverBoatGroup.position.set(boatX, u * 0.6, boatZ);
      modelTable.riverBoatGroup.rotation.y = Math.cos(elapsed * 0.45) > 0 ? 0.15 : Math.PI - 0.15;
      modelTable.sternWheelMesh.rotation.x = elapsed * 3.8;

      // G. Animate Audio-Animatronics Brass Cam Gears, Tiki Bird, Project Little Man, Ampex Tape Reels & Lilly Belle Steam Wheels
      workshop.animatronicGears.forEach((gear, gIdx) => {
        gear.rotation.y = elapsed * 1.6 * (gIdx % 2 === 0 ? 1 : -1);
      });
      workshop.animatronicBirdGroup.rotation.y = Math.sin(elapsed * 2.1) * 0.35;
      workshop.animatronicBirdGroup.rotation.z = Math.cos(elapsed * 1.7) * 0.08;

      // Project Little Man Vaudeville tap-dance bounce & sway
      workshop.littleManGroup.position.y = 0.2 + Math.abs(Math.sin(elapsed * 5.5)) * 0.05;
      workshop.littleManGroup.rotation.z = Math.sin(elapsed * 2.75) * 0.14;
      workshop.littleManGroup.rotation.y = Math.cos(elapsed * 1.9) * 0.28;

      // Ampex Dual Magnetic Tape Reels spinning
      workshop.tapeReels.forEach((reel) => {
        reel.rotation.y = elapsed * 2.4;
      });

      // Roger Broggie's 1:8 "Lilly Belle" Live Steam Driving Wheels on Dynamometer Rollers
      workshop.lillyBelleWheels.forEach((wheel) => {
        wheel.rotation.z = -elapsed * 4.2 * Math.max(0.25, st.trainSpeed);
      });

      // Burbank Studio Wall Clock Minute Hand, Imagineer Head & Walt's Suite 3H Golden Carousel Music Box
      workshop.clockMinuteHand.rotation.z = -elapsed * 0.15;
      workshop.imagineerHeadGroup.rotation.y = Math.sin(elapsed * 0.7) * 0.22;
      workshop.waltsMusicBoxRotor.rotation.y = elapsed * 0.95;

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      controls.removeEventListener('start', onControlStart);
      domElem.removeEventListener('pointerdown', onPointerDown);
      domElem.removeEventListener('pointerup', onPointerUp);
      domElem.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
      controls.dispose();
      renderer.dispose();
    };
  }, [handleSelectCamera]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0d131f] select-none">
      {/* Dedicated WebGL Mount Container (100% Unobstructed Viewport) */}
      <div
        ref={canvasMountRef}
        className="w-full h-full"
        aria-label="WED Enterprises Orlando Walt Disney World & Anaheim Voxel Imagineering Studio 3D Viewport"
      />

      {/* Subtle Floating Hover Prompt Badge (Top-Center below header, non-occluding) */}
      {hoveredLabel && (
        <div
          className="fixed top-16 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1.5 rounded-lg border border-amber-400/50 text-xs font-medium text-amber-200 pointer-events-none font-mono-tabular shadow-lg"
          style={{ backgroundColor: 'rgba(13, 19, 31, 0.92)' }}
        >
          {hoveredLabel}
        </div>
      )}

      {/* Top Bar & Collapsible Bottom Control Dock */}
      <StudioControlDock
        parkEdition={parkEdition}
        onSelectParkEdition={handleSelectParkEdition}
        activeCamera={activeCamera}
        onSelectCamera={(preset) => {
          soundEngine.playBlueprintSwitch();
          handleSelectCamera(preset);
        }}
        activeBlueprint={activeBlueprint}
        onSelectBlueprint={(bpId) => {
          soundEngine.playBlueprintSwitch();
          setActiveBlueprint(bpId);
        }}
        lightingMode={lightingMode}
        onSelectLighting={(mode) => {
          soundEngine.playBlueprintSwitch();
          stateRef.current.autoWaltLampActive = false;
          setLightingMode(mode);
        }}
        explodedAmount={explodedAmount}
        onChangeExploded={setExplodedAmount}
        draftingTiltDeg={draftingTiltDeg}
        onChangeDraftingTilt={setDraftingTiltDeg}
        trainSpeedMultiplier={trainSpeedMultiplier}
        onToggleTrainPause={() => {
          setTrainSpeedMultiplier((prev) => (prev > 0 ? 0 : 1));
        }}
        onBlowWhistle={() => {
          soundEngine.playSteamWhistle();
        }}
        voxelBuildEnabled={voxelBuildEnabled}
        onToggleVoxelBuild={() => {
          setVoxelBuildEnabled((prev) => !prev);
          if (!voxelBuildEnabled && activeCamera === 'drafting') {
            handleSelectCamera('model-table');
          }
        }}
        activeVoxelBrush={activeVoxelBrush}
        onSelectVoxelBrush={setActiveVoxelBrush}
        customVoxelCount={customVoxels.length}
        onClearCustomVoxels={() => {
          soundEngine.playVoxelTap(true);
          setCustomVoxels([]);
        }}
        selectedArtifact={selectedArtifact}
        onCloseArtifact={() => setSelectedArtifact(null)}
        onOpenBlueprintModal={() => {
          soundEngine.playBlueprintSwitch();
          setIsBlueprintModalOpen(true);
        }}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          const next = !soundEnabled;
          soundEngine.enabled = next;
          setSoundEnabled(next);
        }}
        isDockCollapsed={isDockCollapsed}
        onToggleDockCollapse={() => setIsDockCollapsed((prev) => !prev)}
        dreamWorksCount={works.length}
        dreamWorksOpen={worksOpen}
        onToggleDreamWorks={() => setWorksOpen((v) => !v)}
        backHref={WORKSHOP + (activeWorkId ? '?open=' + encodeURIComponent(activeWorkId) : '')}
      />

      <DreamWorksPanel
        open={worksOpen}
        works={works}
        activeId={activeWorkId}
        building={building}
        onClose={() => setWorksOpen(false)}
        onBuild={buildWork}
        onSkip={finishBuild}
        onPlace={(w) => placeInPark(w.id)}
        onEdit={(w) => openInWorkshop(w.id)}
        onPlay={(w) => openInWorkshop(w.id, true)}
        onNew={() => newWork()}
        onClear={clearWork}
      />

      {/* Full-Screen Interactive Cyanotype Blueprint & Engineering Notes Modal */}
      <BlueprintInspectorModal
        isOpen={isBlueprintModalOpen}
        activeBlueprint={activeBlueprint}
        onSelectBlueprint={setActiveBlueprint}
        onJumpToCamera={handleSelectCamera}
        onClose={() => setIsBlueprintModalOpen(false)}
      />
    </div>
  );
}
