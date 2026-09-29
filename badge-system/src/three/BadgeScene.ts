import * as THREE from 'three';
import { AppleAwardMaterials, kelvinToRGBColor } from './materials';
import {
  buildAppleFacetedShieldBadge,
  buildAppleConcentricRingsBadge,
  buildAppleChallengeHexBadge,
  buildAppleTeardropStreakBadge,
  buildAppleOctagonMilestoneBadge,
  buildAppleInfinityMasteryBadge,
  buildAppleCircularCoinBadge,
  buildAppleShieldCrestedBadge,
  buildAppleRhombusDiamondBadge,
  buildApplePentagonStarBadge,
  buildAppleRoundedSquircleBadge,
  buildAppleCloverQuatrefoilBadge,
  buildAppleOvalCameoBadge,
  buildAppleTrianglePrismBadge,
  buildAppleDecagonWheelBadge,
  buildAppleShieldArchBadge,
  buildAppleWaveCrescentBadge,
  buildAppleInterlockingRingsBadge,
  buildAppleHourglassNexusBadge,
  buildAppleSunburstRadiantBadge,
  buildAppleOwlBadge,
  buildAppleOctopusBadge,
  buildAbyssOctopusBadge,
  buildQuantumOctopusBadge,
  buildFlowJellyfishBadge,
  buildNebulaJellyfishBadge,
  buildSovereignEagleBadge,
  buildClockworkOwlBadge,
  buildCutePandaBadge,
  buildCuteShibaBadge,
  buildCuteRedPandaBadge,
  buildCuteKoalaBadge,
  buildCuteHamsterBadge,
  buildCuteFoxBadge,
  buildCutePenguinBadge,
  buildCuteBunnyBadge,
  buildCuteOtterBadge,
  buildCuteAlpacaBadge,
  buildOceanWhaleBadge,
  buildOceanMantaBadge,
  buildOceanTurtleBadge,
  buildOceanDolphinBadge,
  buildOceanSharkBadge,
  buildOceanSeahorseBadge,
  buildOceanNarwhalBadge,
  buildOceanOctopusBadge,
  buildOceanJellyfishBadge,
  buildOceanFlyingFishBadge,
  buildCartoonWizardBadge,
  buildCartoonAstronautBadge,
  buildCartoonMechaBadge,
  buildCartoonKnightBadge,
  buildCartoonPrinceBadge,
  buildCartoonPirateBadge,
  buildCartoonPixelHeroBadge,
  buildCartoonAviatorBadge,
  buildCartoonElfBadge,
  buildCartoonNinjaBadge,
  AppleBadgeMeshGroup,
} from './BadgeGeometry';
import {
  buildMinecraftSteveBadge,
  buildMinecraftAlexBadge,
  buildMinecraftCreeperBadge,
  buildMinecraftEndermanBadge,
  buildMinecraftSkeletonBadge,
  buildMinecraftZombieBadge,
  buildMinecraftIronGolemBadge,
  buildMinecraftPigBadge,
  buildMinecraftEnderDragonBadge,
  buildMinecraftAxolotlBadge,
} from './MinecraftBadgeGeometry';
import {
  buildHexAxolotlLucyBadge,
  buildHexAxolotlCyanBadge,
  buildHexMinionStuartBadge,
  buildHexMinionBobBadge,
  buildHexBlueyBadge,
  buildHexBingoBadge,
  buildHexNemoBadge,
  buildHexDoryBadge,
  buildHexRubbleBadge,
  buildHexPikachuBadge,
  buildHexDarthVaderBadge,
  buildHexVaderHelmetBadge,
  buildHexBabyYodaBadge,
  buildHexLightsaberGreenBadge,
  buildHexLightsaberRedBadge,
} from './ChallengeHexBadgeGeometry';
import {
  buildStrike3DaysBadge,
  buildStrike7DaysBadge,
  buildStrike14DaysBadge,
  buildStrike30DaysBadge,
  buildStrike40DaysBadge,
  buildStrike50DaysBadge,
  buildStrike60DaysBadge,
  buildStrike80DaysBadge,
  buildStrike90DaysBadge,
  buildStrike100DaysBadge,
} from './StrikeGlassBadgeGeometry';
import { BadgePrototypeId, BadgeState, ViewAngle } from '../types/badge';
import { spatialAudio } from '../utils/spatialAudio';
import { triggerHaptic } from '../utils/haptics';

export interface SceneOptions {
  prototypeId: BadgePrototypeId;
  state: BadgeState;
  progress?: number | number[];
  viewAngle: ViewAngle;
  earnedDate?: string;
  badgeTitle?: string;
  colorHex?: number;
  enableShadows?: boolean;
  ambientIntensity?: number;
  colorTemperature?: number;
  specularGloss?: number;
  autoEntranceSpin?: boolean;
  onEntranceSpinStateChange?: (isSpinning: boolean) => void;
  onUnlockStepChange?: (step: number, stepName: string) => void;
  onUnlockComplete?: () => void;
}

export class AppleBadgeSceneController {
  private container: HTMLElement;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private materialsLib: AppleAwardMaterials;
  private badgeGroup!: THREE.Group;
  private currentBadgeMesh: AppleBadgeMeshGroup | null = null;

  // Lights
  private keyLight!: THREE.DirectionalLight;
  private fillLight!: THREE.DirectionalLight;
  private rimLight!: THREE.DirectionalLight;
  private ambientLight!: THREE.AmbientLight;

  // Studio Lighting & Liquid Glass reflection state
  private ambientIntensity: number = 0.72;
  private colorTemperature: number = 5800; // Kelvin
  private specularGloss: number = 1.0;

  // Animation & Physics State
  private animationFrameId: number | null = null;
  private isDisposed: boolean = false;
  private isRenderingPaused: boolean = false;

  // Interactive 3D Physics (Free-form Quaternion Trackball with Inertia)
  private targetQuaternion = new THREE.Quaternion();
  private currentQuaternion = new THREE.Quaternion();
  private angularVelocity = { x: 0, y: 0 };
  private isDragging: boolean = false;
  private previousMousePosition = { x: 0, y: 0 };
  private pointerNormalized = { x: 0, y: 0 };
  private touchInitialDist: number = 0;

  // Camera Distance & Zoom (3.0 close-up to 7.2 overview)
  private cameraDistance: number = 5.4;
  private targetCameraDistance: number = 5.4;
  private minCameraDistance: number = 2.8;
  private maxCameraDistance: number = 7.5;

  // Exploded View factor (0 to 1)
  private explodedFactor: number = 0;
  private targetExplodedFactor: number = 0;

  // Unlock sequence animation state
  private isUnlocking: boolean = false;
  private unlockStartTime: number = 0;
  private currentOptions: SceneOptions;
  private lastUnlockStep: number = -1;
  private accumulatedDragDist: number = 0;
  private accumulatedInertiaDist: number = 0;

  // Apple 2-Turn Entrance Spin Animation state
  private isEntranceSpinning: boolean = false;
  private entranceSpinStartTime: number = 0;
  private entranceSpinDuration: number = 2.1;
  private entranceTargetQuaternion = new THREE.Quaternion();
  private lastSpinHalfTurn: number = -1;
  private onEntranceSpinComplete?: () => void;

  constructor(container: HTMLElement, options: SceneOptions) {
    this.container = container;
    this.currentOptions = { ...options };
    this.materialsLib = new AppleAwardMaterials();
    this.initScene();
    this.loadBadge();
    this.setupEvents();
    this.startRenderLoop();

    if (this.currentOptions.autoEntranceSpin ?? true) {
      this.playEntranceSpin(2.1);
    }
  }

  private initScene() {
    const width = this.container.clientWidth || 300;
    const height = this.container.clientHeight || 300;

    this.scene = new THREE.Scene();
    // Pitch Black background like Apple Fitness
    this.scene.background = null;

    // 38° FOV gives natural telephoto product photography perspective
    this.camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 50);
    this.camera.position.set(0, 0, 5.4);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;
    this.renderer.shadowMap.enabled = this.currentOptions.enableShadows ?? true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
    this.container.appendChild(this.renderer.domElement);

    this.ambientIntensity = this.currentOptions.ambientIntensity ?? 0.72;
    this.colorTemperature = this.currentOptions.colorTemperature ?? 5800;
    this.specularGloss = this.currentOptions.specularGloss ?? 1.0;
    const initialTint = kelvinToRGBColor(this.colorTemperature);

    // Photographic Studio Lighting (matches IMG_2949 and IMG_2950)
    this.ambientLight = new THREE.AmbientLight(initialTint, this.ambientIntensity);
    this.scene.add(this.ambientLight);

    // Key Light (Overhead softbox)
    this.keyLight = new THREE.DirectionalLight(initialTint, 2.2 + this.ambientIntensity * 0.55);
    this.keyLight.position.set(2.4, 3.8, 4.2);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 2048;
    this.keyLight.shadow.mapSize.height = 2048;
    this.keyLight.shadow.bias = -0.0008;
    this.scene.add(this.keyLight);

    // Fill Light
    this.fillLight = new THREE.DirectionalLight(initialTint, 0.65 + this.ambientIntensity * 0.35);
    this.fillLight.position.set(-3.2, -1.2, 3.0);
    this.scene.add(this.fillLight);

    // Rim Light (Creates the crisp edge highlights on the chamfers in IMG_2949)
    this.rimLight = new THREE.DirectionalLight(initialTint, 2.8 * this.specularGloss);
    this.rimLight.position.set(0, 3.8, -3.8);
    this.scene.add(this.rimLight);

    this.badgeGroup = new THREE.Group();
    this.scene.add(this.badgeGroup);

    this.applyViewAngle(this.currentOptions.viewAngle, true);
  }

  public loadBadge() {
    if (this.currentBadgeMesh) {
      this.badgeGroup.remove(this.currentBadgeMesh);
      this.currentBadgeMesh.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
        }
      });
      this.currentBadgeMesh = null;
    }

    const { prototypeId, state, earnedDate = 'OCTOBER 20, 2019', badgeTitle, colorHex } = this.currentOptions;
    const isLocked = state === 'locked';

    let lacquerColor = colorHex ?? 0xfa114f;
    if (!colorHex && badgeTitle) {
      const lower = badgeTitle.toLowerCase();
      if (lower.includes('review') || lower.includes('stand')) {
        lacquerColor = 0x00f0ff; // Apple Cyan
      } else if (lower.includes('focus') || lower.includes('exercise')) {
        lacquerColor = 0xa6ff00; // Apple Volt
      }
    }

    if (prototypeId === 'perfect-week-study') {
      this.currentBadgeMesh = buildAppleFacetedShieldBadge(
        this.materialsLib,
        lacquerColor,
        earnedDate,
        isLocked
      );
    } else if (prototypeId === 'tricentric-learning') {
      this.currentBadgeMesh = buildAppleConcentricRingsBadge(
        this.materialsLib,
        earnedDate,
        isLocked
      );
    } else if (prototypeId === 'teardrop-streak') {
      this.currentBadgeMesh = buildAppleTeardropStreakBadge(
        this.materialsLib,
        earnedDate,
        isLocked
      );
    } else if (prototypeId === 'octagon-milestone') {
      this.currentBadgeMesh = buildAppleOctagonMilestoneBadge(
        this.materialsLib,
        earnedDate,
        isLocked
      );
    } else if (prototypeId === 'infinity-mastery') {
      this.currentBadgeMesh = buildAppleInfinityMasteryBadge(
        this.materialsLib,
        earnedDate,
        isLocked
      );
    } else if (prototypeId === 'circular-coin') {
      this.currentBadgeMesh = buildAppleCircularCoinBadge(
        this.materialsLib,
        earnedDate,
        isLocked
      );
    } else if (prototypeId === 'shield-crested') {
      this.currentBadgeMesh = buildAppleShieldCrestedBadge(
        this.materialsLib,
        earnedDate,
        isLocked
      );
    } else if (prototypeId === 'rhombus-diamond') {
      this.currentBadgeMesh = buildAppleRhombusDiamondBadge(
        this.materialsLib,
        earnedDate,
        isLocked
      );
    } else if (prototypeId === 'pentagon-star') {
      this.currentBadgeMesh = buildApplePentagonStarBadge(
        this.materialsLib,
        earnedDate,
        isLocked
      );
    } else if (prototypeId === 'rounded-squircle') {
      this.currentBadgeMesh = buildAppleRoundedSquircleBadge(
        this.materialsLib,
        earnedDate,
        isLocked
      );
    } else if (prototypeId === 'clover-quatrefoil') {
      this.currentBadgeMesh = buildAppleCloverQuatrefoilBadge(
        this.materialsLib,
        earnedDate,
        isLocked
      );
    } else if (prototypeId === 'oval-cameo') {
      this.currentBadgeMesh = buildAppleOvalCameoBadge(
        this.materialsLib,
        earnedDate,
        isLocked
      );
    } else if (prototypeId === 'triangle-prism') {
      this.currentBadgeMesh = buildAppleTrianglePrismBadge(
        this.materialsLib,
        earnedDate,
        isLocked
      );
    } else if (prototypeId === 'decagon-wheel') {
      this.currentBadgeMesh = buildAppleDecagonWheelBadge(
        this.materialsLib,
        earnedDate,
        isLocked
      );
    } else if (prototypeId === 'shield-arch') {
      this.currentBadgeMesh = buildAppleShieldArchBadge(
        this.materialsLib,
        earnedDate,
        isLocked
      );
    } else if (prototypeId === 'wave-crescent') {
      this.currentBadgeMesh = buildAppleWaveCrescentBadge(
        this.materialsLib,
        earnedDate,
        isLocked
      );
    } else if (prototypeId === 'interlocking-rings') {
      this.currentBadgeMesh = buildAppleInterlockingRingsBadge(
        this.materialsLib,
        earnedDate,
        isLocked
      );
    } else if (prototypeId === 'hourglass-nexus') {
      this.currentBadgeMesh = buildAppleHourglassNexusBadge(
        this.materialsLib,
        earnedDate,
        isLocked
      );
    } else if (prototypeId === 'sunburst-radiant') {
      this.currentBadgeMesh = buildAppleSunburstRadiantBadge(
        this.materialsLib,
        earnedDate,
        isLocked
      );
    } else if (prototypeId === 'owl-wisdom') {
      this.currentBadgeMesh = buildAppleOwlBadge(
        this.materialsLib,
        earnedDate,
        isLocked
      );
    } else if (prototypeId === 'octopus-polymath') {
      this.currentBadgeMesh = buildAppleOctopusBadge(
        this.materialsLib,
        earnedDate,
        isLocked
      );
    } else if (prototypeId === 'octopus-abyss') {
      this.currentBadgeMesh = buildAbyssOctopusBadge(
        this.materialsLib,
        earnedDate,
        isLocked
      );
    } else if (prototypeId === 'octopus-quantum') {
      this.currentBadgeMesh = buildQuantumOctopusBadge(
        this.materialsLib,
        earnedDate,
        isLocked
      );
    } else if (prototypeId === 'jellyfish-flow') {
      this.currentBadgeMesh = buildFlowJellyfishBadge(
        this.materialsLib,
        earnedDate,
        isLocked
      );
    } else if (prototypeId === 'jellyfish-nebula') {
      this.currentBadgeMesh = buildNebulaJellyfishBadge(
        this.materialsLib,
        earnedDate,
        isLocked
      );
    } else if (prototypeId === 'eagle-sovereign') {
      this.currentBadgeMesh = buildSovereignEagleBadge(
        this.materialsLib,
        earnedDate,
        isLocked
      );
    } else if (prototypeId === 'owl-clockwork') {
      this.currentBadgeMesh = buildClockworkOwlBadge(
        this.materialsLib,
        earnedDate,
        isLocked
      );
    // 10 Cute Animals
    } else if (prototypeId === 'cute-panda') {
      this.currentBadgeMesh = buildCutePandaBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'cute-shiba') {
      this.currentBadgeMesh = buildCuteShibaBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'cute-red-panda') {
      this.currentBadgeMesh = buildCuteRedPandaBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'cute-koala') {
      this.currentBadgeMesh = buildCuteKoalaBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'cute-hamster') {
      this.currentBadgeMesh = buildCuteHamsterBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'cute-fennec-fox') {
      this.currentBadgeMesh = buildCuteFoxBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'cute-penguin') {
      this.currentBadgeMesh = buildCutePenguinBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'cute-bunny') {
      this.currentBadgeMesh = buildCuteBunnyBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'cute-otter') {
      this.currentBadgeMesh = buildCuteOtterBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'cute-alpaca') {
      this.currentBadgeMesh = buildCuteAlpacaBadge(this.materialsLib, earnedDate, isLocked);
    // 10 Ocean Animals
    } else if (prototypeId === 'ocean-whale') {
      this.currentBadgeMesh = buildOceanWhaleBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'ocean-manta') {
      this.currentBadgeMesh = buildOceanMantaBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'ocean-turtle') {
      this.currentBadgeMesh = buildOceanTurtleBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'ocean-dolphin') {
      this.currentBadgeMesh = buildOceanDolphinBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'ocean-hammerhead') {
      this.currentBadgeMesh = buildOceanSharkBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'ocean-seahorse') {
      this.currentBadgeMesh = buildOceanSeahorseBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'ocean-narwhal') {
      this.currentBadgeMesh = buildOceanNarwhalBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'ocean-octopus') {
      this.currentBadgeMesh = buildOceanOctopusBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'ocean-jellyfish') {
      this.currentBadgeMesh = buildOceanJellyfishBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'ocean-flying-fish') {
      this.currentBadgeMesh = buildOceanFlyingFishBadge(this.materialsLib, earnedDate, isLocked);
    // 10 Cartoon Characters
    } else if (prototypeId === 'cartoon-wizard') {
      this.currentBadgeMesh = buildCartoonWizardBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'cartoon-astronaut') {
      this.currentBadgeMesh = buildCartoonAstronautBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'cartoon-mecha') {
      this.currentBadgeMesh = buildCartoonMechaBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'cartoon-knight') {
      this.currentBadgeMesh = buildCartoonKnightBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'cartoon-prince') {
      this.currentBadgeMesh = buildCartoonPrinceBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'cartoon-pirate') {
      this.currentBadgeMesh = buildCartoonPirateBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'cartoon-pixel-hero') {
      this.currentBadgeMesh = buildCartoonPixelHeroBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'cartoon-aviator') {
      this.currentBadgeMesh = buildCartoonAviatorBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'cartoon-elf') {
      this.currentBadgeMesh = buildCartoonElfBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'cartoon-ninja') {
      this.currentBadgeMesh = buildCartoonNinjaBadge(this.materialsLib, earnedDate, isLocked);
    // 10 Minecraft Characters
    } else if (prototypeId === 'mc-steve') {
      this.currentBadgeMesh = buildMinecraftSteveBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'mc-alex') {
      this.currentBadgeMesh = buildMinecraftAlexBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'mc-creeper') {
      this.currentBadgeMesh = buildMinecraftCreeperBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'mc-enderman') {
      this.currentBadgeMesh = buildMinecraftEndermanBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'mc-skeleton') {
      this.currentBadgeMesh = buildMinecraftSkeletonBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'mc-zombie') {
      this.currentBadgeMesh = buildMinecraftZombieBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'mc-iron-golem') {
      this.currentBadgeMesh = buildMinecraftIronGolemBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'mc-pig') {
      this.currentBadgeMesh = buildMinecraftPigBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'mc-ender-dragon') {
      this.currentBadgeMesh = buildMinecraftEnderDragonBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'mc-axolotl') {
      this.currentBadgeMesh = buildMinecraftAxolotlBadge(this.materialsLib, earnedDate, isLocked);
    // Hexagon Challenge Pop Icons (Apple Limited Edition Hexagon Medal)
    } else if (prototypeId === 'hex-axolotl-lucy') {
      this.currentBadgeMesh = buildHexAxolotlLucyBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'hex-axolotl-cyan') {
      this.currentBadgeMesh = buildHexAxolotlCyanBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'hex-minion-stuart') {
      this.currentBadgeMesh = buildHexMinionStuartBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'hex-minion-bob') {
      this.currentBadgeMesh = buildHexMinionBobBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'hex-bluey') {
      this.currentBadgeMesh = buildHexBlueyBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'hex-bingo') {
      this.currentBadgeMesh = buildHexBingoBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'hex-nemo') {
      this.currentBadgeMesh = buildHexNemoBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'hex-dory') {
      this.currentBadgeMesh = buildHexDoryBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'hex-rubble') {
      this.currentBadgeMesh = buildHexRubbleBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'hex-pikachu') {
      this.currentBadgeMesh = buildHexPikachuBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'hex-darth-vader') {
      this.currentBadgeMesh = buildHexDarthVaderBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'hex-vader-helmet') {
      this.currentBadgeMesh = buildHexVaderHelmetBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'hex-baby-yoda') {
      this.currentBadgeMesh = buildHexBabyYodaBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'hex-lightsaber-green') {
      this.currentBadgeMesh = buildHexLightsaberGreenBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'hex-lightsaber-red') {
      this.currentBadgeMesh = buildHexLightsaberRedBadge(this.materialsLib, earnedDate, isLocked);
    // 10 Liquid Glass Strike Badges
    } else if (prototypeId === 'strike-3-days') {
      this.currentBadgeMesh = buildStrike3DaysBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'strike-7-days') {
      this.currentBadgeMesh = buildStrike7DaysBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'strike-14-days') {
      this.currentBadgeMesh = buildStrike14DaysBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'strike-30-days') {
      this.currentBadgeMesh = buildStrike30DaysBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'strike-40-days') {
      this.currentBadgeMesh = buildStrike40DaysBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'strike-50-days') {
      this.currentBadgeMesh = buildStrike50DaysBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'strike-60-days') {
      this.currentBadgeMesh = buildStrike60DaysBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'strike-80-days') {
      this.currentBadgeMesh = buildStrike80DaysBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'strike-90-days') {
      this.currentBadgeMesh = buildStrike90DaysBadge(this.materialsLib, earnedDate, isLocked);
    } else if (prototypeId === 'strike-100-days') {
      this.currentBadgeMesh = buildStrike100DaysBadge(this.materialsLib, earnedDate, isLocked);
    } else {
      this.currentBadgeMesh = buildAppleChallengeHexBadge(
        this.materialsLib,
        earnedDate,
        isLocked
      );
    }

    this.badgeGroup.add(this.currentBadgeMesh);
    this.applyCurrentLightingToMaterials();
  }

  public updateOptions(newOptions: Partial<SceneOptions>) {
    const prev = { ...this.currentOptions };
    this.currentOptions = { ...this.currentOptions, ...newOptions };

    const prototypeChanged = newOptions.prototypeId && newOptions.prototypeId !== prev.prototypeId;
    const stateChanged = newOptions.state && newOptions.state !== prev.state;

    if (prototypeChanged || stateChanged) {
      this.loadBadge();
    }

    if (newOptions.viewAngle && newOptions.viewAngle !== prev.viewAngle) {
      this.applyViewAngle(newOptions.viewAngle, false);
    }

    const lightingChanged =
      (newOptions.ambientIntensity !== undefined && newOptions.ambientIntensity !== prev.ambientIntensity) ||
      (newOptions.colorTemperature !== undefined && newOptions.colorTemperature !== prev.colorTemperature) ||
      (newOptions.specularGloss !== undefined && newOptions.specularGloss !== prev.specularGloss);

    if (lightingChanged) {
      this.setLighting(
        this.currentOptions.ambientIntensity ?? this.ambientIntensity,
        this.currentOptions.colorTemperature ?? this.colorTemperature,
        this.currentOptions.specularGloss ?? this.specularGloss
      );
    }
  }

  public setLighting(ambientIntensity: number, colorTemperature: number, specularGloss: number = 1.0) {
    this.ambientIntensity = ambientIntensity;
    this.colorTemperature = colorTemperature;
    this.specularGloss = specularGloss;
    this.currentOptions.ambientIntensity = ambientIntensity;
    this.currentOptions.colorTemperature = colorTemperature;
    this.currentOptions.specularGloss = specularGloss;

    const tintColor = kelvinToRGBColor(colorTemperature);

    if (this.ambientLight) {
      this.ambientLight.intensity = ambientIntensity;
      this.ambientLight.color.copy(tintColor);
    }

    if (this.keyLight) {
      this.keyLight.color.copy(tintColor);
      this.keyLight.intensity = 2.2 + ambientIntensity * 0.55;
    }

    if (this.fillLight) {
      this.fillLight.color.copy(tintColor);
      this.fillLight.intensity = 0.65 + ambientIntensity * 0.35;
    }

    if (this.rimLight) {
      this.rimLight.color.copy(tintColor);
      this.rimLight.intensity = 2.8 * specularGloss;
    }

    this.applyCurrentLightingToMaterials();
  }

  private applyCurrentLightingToMaterials() {
    if (!this.badgeGroup) return;
    this.badgeGroup.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const mat = child.material as THREE.MeshPhysicalMaterial;
        if (mat.isMeshPhysicalMaterial) {
          if (mat.clearcoat !== undefined && mat.clearcoat > 0) {
            mat.clearcoat = Math.min(1.0, 0.9 * this.specularGloss);
          }
          if (mat.envMapIntensity !== undefined) {
            mat.envMapIntensity = 1.6 * this.specularGloss;
          }
          if (mat.roughness !== undefined && this.specularGloss > 1.0) {
            mat.roughness = Math.max(0.02, mat.roughness / Math.sqrt(this.specularGloss));
          }
        } else if (mat.isMeshStandardMaterial) {
          if (mat.envMapIntensity !== undefined) {
            mat.envMapIntensity = 2.2 * this.specularGloss;
          }
        }
      }
    });
  }

  public setExplodedView(factor: number) {
    this.targetExplodedFactor = Math.max(0, Math.min(1, factor));
  }

  public playEntranceSpin(duration: number = 2.1, onComplete?: () => void) {
    if (this.isUnlocking) return;
    this.isEntranceSpinning = true;
    this.entranceSpinStartTime = performance.now();
    this.entranceSpinDuration = Math.max(1.2, duration);
    this.onEntranceSpinComplete = onComplete;
    this.lastSpinHalfTurn = -1;
    this.angularVelocity = { x: 0, y: 0 };

    // Record resting target quaternion
    this.entranceTargetQuaternion.copy(this.targetQuaternion);

    // Initial scale slightly smaller (0.88) for emergence feel
    this.badgeGroup.scale.set(0.88, 0.88, 0.88);

    spatialAudio.playChime('crystallize');
    this.currentOptions.onEntranceSpinStateChange?.(true);
  }

  public stopEntranceSpin() {
    if (!this.isEntranceSpinning) return;
    this.isEntranceSpinning = false;
    this.badgeGroup.scale.set(1, 1, 1);
    this.targetQuaternion.copy(this.badgeGroup.quaternion);
    this.currentQuaternion.copy(this.badgeGroup.quaternion);
    this.angularVelocity = { x: 0, y: 0 };
    this.currentOptions.onEntranceSpinStateChange?.(false);
    this.onEntranceSpinComplete?.();
  }

  private updateEntranceSpinAnimation(now: number) {
    if (!this.isEntranceSpinning) return;

    const elapsed = (now - this.entranceSpinStartTime) / 1000;
    const progressRaw = elapsed / this.entranceSpinDuration;

    if (progressRaw >= 1.0) {
      // Completed two full rotations!
      this.isEntranceSpinning = false;
      this.badgeGroup.scale.set(1, 1, 1);
      this.targetQuaternion.copy(this.entranceTargetQuaternion);
      this.currentQuaternion.copy(this.entranceTargetQuaternion);
      this.badgeGroup.quaternion.copy(this.entranceTargetQuaternion);
      this.angularVelocity = { x: 0, y: 0 };
      spatialAudio.playClink('facet', 0);
      this.currentOptions.onEntranceSpinStateChange?.(false);
      this.onEntranceSpinComplete?.();
      return;
    }

    const t = Math.min(1, Math.max(0, progressRaw));
    // Apple-style smooth ease-out: swift spin initially, then gentle fluid deceleration
    const easeOutProgress = 1 - Math.pow(1 - t, 3.4);

    // Spin exactly 2 full turns (4π radians = 720°) around the vertical axis
    const remainingAngle = (1 - easeOutProgress) * 4 * Math.PI;

    // Subtle Apple tilt on the horizontal axis during spin to showcase chamfers & thickness
    const tiltX = Math.sin(t * Math.PI) * 0.14; // ~8° tilt
    const wobbleZ = Math.sin(t * 2 * Math.PI) * 0.03;

    const axisY = new THREE.Vector3(0, 1, 0);
    const axisX = new THREE.Vector3(1, 0, 0);
    const axisZ = new THREE.Vector3(0, 0, 1);

    const qRotY = new THREE.Quaternion().setFromAxisAngle(axisY, remainingAngle);
    const qTiltX = new THREE.Quaternion().setFromAxisAngle(axisX, tiltX);
    const qWobbleZ = new THREE.Quaternion().setFromAxisAngle(axisZ, wobbleZ);

    const spinComposite = new THREE.Quaternion()
      .multiplyQuaternions(qTiltX, qRotY)
      .multiply(qWobbleZ);

    this.currentQuaternion.multiplyQuaternions(spinComposite, this.entranceTargetQuaternion);
    this.badgeGroup.quaternion.copy(this.currentQuaternion);

    // Scale from 0.88 smoothly to 1.0 with subtle spring cushion at completion
    let scale = 0.88 + easeOutProgress * 0.12;
    if (t > 0.82) {
      const endT = (t - 0.82) / 0.18;
      scale += Math.sin(endT * Math.PI) * 0.022;
    }
    this.badgeGroup.scale.set(scale, scale, scale);

    // Sweeping studio lighting to highlight specular reflections
    this.keyLight.position.x = 2.4 + Math.sin(remainingAngle) * 1.8;
    this.rimLight.intensity = 2.8 + Math.abs(Math.sin(remainingAngle)) * 1.4;

    // Haptic/audio cues at half turns
    const halfTurn = Math.floor(easeOutProgress * 4);
    if (halfTurn !== this.lastSpinHalfTurn) {
      this.lastSpinHalfTurn = halfTurn;
      const pan = Math.sin(remainingAngle) * 0.35;
      if (halfTurn === 1) {
        spatialAudio.playClink('rotate_tick', pan);
      } else if (halfTurn === 2) {
        spatialAudio.playClink('flip', 0);
      } else if (halfTurn === 3) {
        spatialAudio.playClink('rotate_tick', -pan);
      }
    }
  }

  public flipBadge() {
    if (this.isEntranceSpinning) {
      this.stopEntranceSpin();
    }
    // Check if medal is currently facing mostly forward or backward
    const forwardVec = new THREE.Vector3(0, 0, 1).applyQuaternion(this.targetQuaternion);
    if (forwardVec.z < 0) {
      // Currently facing back -> flip to front
      this.targetQuaternion.identity();
    } else {
      // Currently facing front -> flip 180 deg to backplate
      this.targetQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
    }
    this.angularVelocity = { x: 0, y: 0 };
    spatialAudio.playClink('flip', 0);
  }

  public applyViewAngle(angle: ViewAngle, immediate: boolean = false) {
    if (this.isEntranceSpinning) {
      this.stopEntranceSpin();
    }
    switch (angle) {
      case 'front':
        this.targetQuaternion.identity();
        break;
      case 'angled':
        this.targetQuaternion.setFromEuler(new THREE.Euler(0.22, -0.58, 0));
        break;
      case 'profile':
        this.targetQuaternion.setFromEuler(new THREE.Euler(0.08, -1.35, 0));
        break;
      case 'back':
        this.targetQuaternion.setFromEuler(new THREE.Euler(0.04, Math.PI, 0));
        break;
      case 'free':
        return;
    }

    this.angularVelocity = { x: 0, y: 0 };
    spatialAudio.playClink('facet', 0);

    if (immediate) {
      this.currentQuaternion.copy(this.targetQuaternion);
      this.badgeGroup.quaternion.copy(this.targetQuaternion);
    }
  }

  public zoomIn() {
    this.targetCameraDistance = Math.max(this.minCameraDistance, this.targetCameraDistance - 0.65);
    spatialAudio.playClink('facet', 0.15);
  }

  public zoomOut() {
    this.targetCameraDistance = Math.min(this.maxCameraDistance, this.targetCameraDistance + 0.65);
    spatialAudio.playClink('facet', -0.15);
  }

  public resetOrientation() {
    if (this.isEntranceSpinning) {
      this.stopEntranceSpin();
    }
    this.targetQuaternion.identity();
    this.targetCameraDistance = 5.4;
    this.angularVelocity = { x: 0, y: 0 };
    spatialAudio.playClink('facet', 0);
  }

  public triggerUnlockSequence() {
    this.isEntranceSpinning = false;
    if (this.isUnlocking) return;
    this.isUnlocking = true;
    this.lastUnlockStep = -1;
    this.unlockStartTime = performance.now();
    this.updateOptions({ state: 'locked' });
    this.badgeGroup.scale.set(0.85, 0.85, 0.85);
    this.camera.position.z = 6.6;
    this.targetQuaternion.setFromEuler(new THREE.Euler(0.25, -0.45, 0.12));
    this.currentQuaternion.copy(this.targetQuaternion);
    this.badgeGroup.quaternion.copy(this.targetQuaternion);
    spatialAudio.playChime('celestial');
  }

  private updateUnlockAnimation(now: number) {
    if (!this.isUnlocking || !this.currentBadgeMesh) return;

    const elapsed = (now - this.unlockStartTime) / 1000;
    const totalDuration = 5.8;

    let stepNum = 0;
    let stepTitle = '0. Dormant';

    // Ease-in-out helper
    const smoothStep = (t: number) => t * t * (3 - 2 * t);

    if (elapsed < 1.0) {
      // Phase 1: Dormant mystery hover & camera glide in
      stepNum = 1;
      stepTitle = '1. Approaching mystery medal in gunmetal';
      const p = smoothStep(Math.min(1, elapsed / 1.0));
      this.camera.position.z = 6.6 - p * 1.5;
      const s = 0.85 + p * 0.15;
      this.badgeGroup.scale.set(s, s, s);
      this.targetQuaternion.setFromEuler(new THREE.Euler(0.25 * (1 - p * 0.5), -0.45 * (1 - p * 0.4), 0.12 * (1 - p)));
      this.rimLight.intensity = 1.8 + p * 1.2;
    } else if (elapsed < 2.2) {
      // Phase 2: Vitreous Enamel Infusion & Facet Illumination
      stepNum = 2;
      stepTitle = '2. Luminous enamel flows through geometric facets';
      const p = smoothStep((elapsed - 1.0) / 1.2);
      this.camera.position.z = 5.1 - p * 0.2;
      if (this.currentOptions.state === 'locked' && elapsed > 1.2) {
        this.updateOptions({ state: 'progress' });
      }
      if (elapsed > 1.9 && this.currentOptions.state !== 'unlocked') {
        this.updateOptions({ state: 'unlocked' });
      }
      // Light sweeps across
      this.keyLight.position.x = 2.4 - Math.cos(p * Math.PI) * 1.8;
      this.rimLight.intensity = 3.0 + Math.sin(p * Math.PI) * 3.5;
    } else if (elapsed < 3.2) {
      // Phase 3: Apple Spring Bounce & Golden Snap
      stepNum = 3;
      stepTitle = '3. Facets lock with Apple spring rebound';
      const p = (elapsed - 2.2) / 1.0;
      // Damped harmonic oscillator
      const bounce = Math.sin(p * Math.PI * 3.5) * Math.exp(-p * 3.8) * 0.15;
      this.badgeGroup.scale.set(1 + bounce, 1 + bounce, 1 + bounce);
      this.camera.position.z = 4.9 + (1 - p) * 0.1;
      this.targetQuaternion.identity();
      this.rimLight.intensity = 3.2;
    } else if (elapsed < 4.6) {
      // Phase 4: Commemorative 3D Flip to Laser-Engraved Reverse Shell
      stepNum = 4;
      stepTitle = '4. Commemorative laser inscription verified';
      const p = smoothStep((elapsed - 3.2) / 1.4);
      // Smoothly rotate 180 degrees around Y axis
      const rotY = p * Math.PI;
      const tiltX = Math.sin(p * Math.PI) * 0.18;
      this.targetQuaternion.setFromEuler(new THREE.Euler(tiltX, rotY, 0));
      this.badgeGroup.scale.set(1, 1, 1);
      this.rimLight.intensity = 2.8 + Math.sin(p * Math.PI) * 2.0;
    } else if (elapsed < 5.6) {
      // Phase 5: Smoothly Return to Front Face
      stepNum = 5;
      stepTitle = '5. Returning to pristine front face';
      const p = smoothStep((elapsed - 4.6) / 1.0);
      const rotY = Math.PI + p * Math.PI;
      const tiltX = Math.sin(p * Math.PI) * 0.12;
      this.targetQuaternion.setFromEuler(new THREE.Euler(tiltX, rotY, 0));
      this.camera.position.z = 5.0 + p * 0.4;
      this.rimLight.intensity = 3.2;
    } else {
      // Completed state: Resting pose, ready for full user 3D manipulation
      stepNum = 6;
      stepTitle = '6. Award unlocked & collectible in your archive';
      this.isUnlocking = false;
      this.targetQuaternion.identity();
      this.currentQuaternion.identity();
      this.badgeGroup.quaternion.identity();
      this.badgeGroup.scale.set(1, 1, 1);
      this.camera.position.z = 5.4;
      this.rimLight.intensity = 3.2;
      spatialAudio.playChime('unlock_fanfare');
      this.currentOptions.onUnlockComplete?.();
    }

    if (stepNum !== this.lastUnlockStep) {
      this.lastUnlockStep = stepNum;
      if (stepNum === 2) {
        spatialAudio.playChime('crystallize');
      } else if (stepNum === 3) {
        spatialAudio.playChime('unlock_fanfare');
      } else if (stepNum === 4) {
        spatialAudio.playClink('flip', 0.2);
      } else if (stepNum === 5) {
        spatialAudio.playClink('facet', 0);
      }
    }

    this.currentOptions.onUnlockStepChange?.(stepNum, stepTitle);
  }

  private setupEvents() {
    const el = this.renderer.domElement;

    const onPointerDown = (clientX: number, clientY: number) => {
      if (this.isEntranceSpinning) {
        this.stopEntranceSpin();
      }
      const rect = el.getBoundingClientRect();
      const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
      this.isDragging = true;
      this.previousMousePosition = { x: clientX, y: clientY };
      this.accumulatedDragDist = 0;
      this.angularVelocity = { x: 0, y: 0 };
      spatialAudio.playClink('tap', nx);
    };

    const onPointerMove = (clientX: number, clientY: number) => {
      const rect = el.getBoundingClientRect();
      const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((clientY - rect.top) / rect.height) * 2 - 1);
      this.pointerNormalized = { x: nx, y: ny };

      if (this.isDragging) {
        const deltaX = clientX - this.previousMousePosition.x;
        const deltaY = clientY - this.previousMousePosition.y;

        const dist = Math.hypot(deltaX, deltaY);
        this.accumulatedDragDist += dist;

        // Scale haptic feedback intensity dynamically based on rotation velocity
        const rotSpeedScale = dist * 0.12;
        const velocityIntensity = Math.min(2.8, Math.max(0.4, 0.4 + rotSpeedScale));
        const dynamicThreshold = Math.max(10, 32 - rotSpeedScale * 8);

        if (this.accumulatedDragDist > dynamicThreshold) {
          this.accumulatedDragDist = 0;
          triggerHaptic('drag_tick', velocityIntensity);
          spatialAudio.playClink('rotate_tick', nx);
        }

        const rotSpeed = 0.0075;
        // World camera-relative Up (Y) and Right (X)
        const axisY = new THREE.Vector3(0, 1, 0);
        const axisX = new THREE.Vector3(1, 0, 0);

        const qY = new THREE.Quaternion().setFromAxisAngle(axisY, deltaX * rotSpeed);
        const qX = new THREE.Quaternion().setFromAxisAngle(axisX, deltaY * rotSpeed);
        const deltaQ = new THREE.Quaternion().multiplyQuaternions(qY, qX);

        // Pre-multiply gives camera-aligned 360-degree free rotation without gimbal lock or clamp
        this.targetQuaternion.premultiply(deltaQ);

        this.angularVelocity = { x: deltaY * rotSpeed, y: deltaX * rotSpeed };
        this.previousMousePosition = { x: clientX, y: clientY };
      } else {
        // Dynamic studio lighting tracking cursor
        this.keyLight.position.x = 2.4 + nx * 1.8;
        this.keyLight.position.y = 3.8 + ny * 1.8;
      }
    };

    const onPointerUp = () => {
      if (!this.isDragging) return;
      this.isDragging = false;
    };

    // Unified pointer events with capture for silky smooth free-form drag
    el.addEventListener('pointerdown', (e: PointerEvent) => {
      try {
        el.setPointerCapture(e.pointerId);
      } catch {}
      onPointerDown(e.clientX, e.clientY);
    });

    el.addEventListener('pointermove', (e: PointerEvent) => {
      onPointerMove(e.clientX, e.clientY);
    });

    el.addEventListener('pointerup', (e: PointerEvent) => {
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {}
      onPointerUp();
    });

    el.addEventListener('pointercancel', (e: PointerEvent) => {
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {}
      onPointerUp();
    });

    // Touch pinch-to-zoom support
    el.addEventListener(
      'touchstart',
      (e: TouchEvent) => {
        if (e.touches.length === 2) {
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          this.touchInitialDist = Math.sqrt(dx * dx + dy * dy);
        }
      },
      { passive: true }
    );

    el.addEventListener(
      'touchmove',
      (e: TouchEvent) => {
        if (e.touches.length === 2 && this.touchInitialDist > 0) {
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const diff = this.touchInitialDist - dist;
          this.targetCameraDistance += diff * 0.01;
          this.targetCameraDistance = Math.max(
            this.minCameraDistance,
            Math.min(this.maxCameraDistance, this.targetCameraDistance)
          );
          this.touchInitialDist = dist;
        }
      },
      { passive: true }
    );

    // Mouse wheel zoom to inspect fine chamfers & velocity-scaled scroll haptics
    el.addEventListener(
      'wheel',
      (e: WheelEvent) => {
        e.preventDefault();
        this.targetCameraDistance += e.deltaY * 0.0035;
        this.targetCameraDistance = Math.max(
          this.minCameraDistance,
          Math.min(this.maxCameraDistance, this.targetCameraDistance)
        );

        const scrollSpeed = Math.abs(e.deltaY);
        const scrollIntensity = Math.min(2.8, Math.max(0.4, scrollSpeed * 0.025));
        triggerHaptic('drag_tick', scrollIntensity);
      },
      { passive: false }
    );

    el.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      this.isRenderingPaused = true;
    });

    el.addEventListener('webglcontextrestored', () => {
      this.isRenderingPaused = false;
      this.initScene();
      this.loadBadge();
    });
  }

  public handleResize() {
    if (!this.container || !this.renderer) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width === 0 || height === 0) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private startRenderLoop() {
    let lastTime = performance.now();

    const animate = (now: number) => {
      if (this.isDisposed) return;
      this.animationFrameId = requestAnimationFrame(animate);

      if (this.isRenderingPaused) return;

      const delta = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      if (this.isUnlocking) {
        this.updateUnlockAnimation(now);
      } else if (this.isEntranceSpinning) {
        this.updateEntranceSpinAnimation(now);
      } else {
        // Inertia & Damped Spring Physics (Apple Touch feel) with velocity-scaled haptics
        if (!this.isDragging) {
          const speed = Math.hypot(this.angularVelocity.x, this.angularVelocity.y);
          if (speed > 0.0001) {
            const axisY = new THREE.Vector3(0, 1, 0);
            const axisX = new THREE.Vector3(1, 0, 0);
            const inertiaQ = new THREE.Quaternion().multiplyQuaternions(
              new THREE.Quaternion().setFromAxisAngle(axisY, this.angularVelocity.y),
              new THREE.Quaternion().setFromAxisAngle(axisX, this.angularVelocity.x)
            );
            this.targetQuaternion.premultiply(inertiaQ);

            this.accumulatedInertiaDist += speed;
            const inertiaIntensity = Math.min(2.5, Math.max(0.3, speed * 28));
            const dynamicInertiaThreshold = Math.max(0.01, 0.045 - speed * 0.4);

            if (this.accumulatedInertiaDist > dynamicInertiaThreshold) {
              this.accumulatedInertiaDist = 0;
              triggerHaptic('drag_tick', inertiaIntensity);
            }

            // Physical friction dampening
            this.angularVelocity.y *= 0.93;
            this.angularVelocity.x *= 0.93;
          }
        }

        // Smooth slerp interpolation to target orientation
        const rotRate = this.isDragging ? 26 : 14;
        this.currentQuaternion.slerp(this.targetQuaternion, Math.min(1, rotRate * delta));

        // Idle micro-breathing when settled
        if (
          !this.isDragging &&
          !this.isUnlocking &&
          Math.abs(this.angularVelocity.y) < 0.0005 &&
          Math.abs(this.angularVelocity.x) < 0.0005
        ) {
          const t = now * 0.001;
          const idleQ = new THREE.Quaternion().setFromEuler(
            new THREE.Euler(Math.sin(t * 0.7) * 0.012, Math.cos(t * 0.5) * 0.016, 0)
          );
          this.badgeGroup.quaternion.multiplyQuaternions(idleQ, this.currentQuaternion);
        } else {
          this.badgeGroup.quaternion.copy(this.currentQuaternion);
        }
      }

      // Smooth Camera Zoom
      if (!this.isUnlocking) {
        this.cameraDistance += (this.targetCameraDistance - this.cameraDistance) * (14 * delta);
        this.camera.position.z = this.cameraDistance;
      }

      // Exploded View
      if (Math.abs(this.targetExplodedFactor - this.explodedFactor) > 0.001) {
        this.explodedFactor += (this.targetExplodedFactor - this.explodedFactor) * 10 * delta;
        this.currentBadgeMesh?.setExplodedView?.(this.explodedFactor);
      }

      // Dynamic Spatial Soundscape orientation tracking
      const forwardVec = new THREE.Vector3(0, 0, 1).applyQuaternion(this.badgeGroup.quaternion);
      const azimuth = forwardVec.x; // -1 (left) to 1 (right)
      const elevation = forwardVec.y;
      const angularSpeed = Math.hypot(this.angularVelocity.x, this.angularVelocity.y) * 10;
      spatialAudio.updateSpatialState(azimuth, elevation, angularSpeed, this.colorTemperature);

      this.renderer.render(this.scene, this.camera);
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  public dispose() {
    this.isDisposed = true;
    this.isEntranceSpinning = false;
    this.onEntranceSpinComplete = undefined;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.currentBadgeMesh) {
      this.currentBadgeMesh.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else if (obj.material) {
            obj.material.dispose();
          }
        }
      });
      if (this.badgeGroup && this.currentBadgeMesh) {
        this.badgeGroup.remove(this.currentBadgeMesh);
      }
      this.currentBadgeMesh = null;
    }
    if (this.renderer) {
      this.renderer.dispose();
      try {
        this.renderer.forceContextLoss();
      } catch {
        // Ignore if already lost
      }
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }
  }
}
