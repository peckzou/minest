import * as THREE from 'three';
import { AppleAwardMaterials } from '../three/materials';
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
} from '../three/BadgeGeometry';
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
} from '../three/MinecraftBadgeGeometry';
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
} from '../three/ChallengeHexBadgeGeometry';
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
} from '../three/StrikeGlassBadgeGeometry';
import { BadgeModel, getBadgePrototypeId, BadgePrototypeId } from '../types/badge';

type PreviewListener = (dataUrl: string) => void;

class BadgePreviewService {
  private memoryCache = new Map<string, string>();
  private listeners = new Map<string, Set<PreviewListener>>();
  private queue: BadgeModel[] = [];
  private queuedIds = new Set<string>();
  private isProcessing = false;
  private isPaused = false;

  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private badgeGroup: THREE.Group | null = null;
  private materialsLib: AppleAwardMaterials | null = null;

  constructor() {
    // Attempt to hydrate from sessionStorage on startup
    if (typeof window !== 'undefined') {
      try {
        const count = sessionStorage.length;
        for (let i = 0; i < count; i++) {
          const key = sessionStorage.key(i);
          if (key && key.startsWith('minest_prev_v1_')) {
            const rawKey = key.replace('minest_prev_v1_', '');
            const val = sessionStorage.getItem(key);
            if (val) {
              this.memoryCache.set(rawKey, val);
            }
          }
        }
      } catch {
        // Ignore storage access errors
      }
    }
  }

  private getCacheKey(badge: BadgeModel): string {
    return `${badge.id}_${badge.state}_${badge.colorTheme?.primary || 'default'}`;
  }

  /**
   * Returns cached snapshot data URL if immediately available, otherwise null.
   */
  public getCachedPreview(badge: BadgeModel): string | null {
    const key = this.getCacheKey(badge);
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key)!;
    }
    return null;
  }

  /**
   * Request generation for a badge preview.
   * If priority is true, it is placed at the front of the queue.
   */
  public requestPreview(badge: BadgeModel, priority: boolean = false): void {
    const key = this.getCacheKey(badge);
    if (this.memoryCache.has(key)) {
      this.notifyListeners(badge.id, this.memoryCache.get(key)!);
      return;
    }

    if (!this.queuedIds.has(badge.id)) {
      this.queuedIds.add(badge.id);
      if (priority) {
        this.queue.unshift(badge);
      } else {
        this.queue.push(badge);
      }
    } else if (priority) {
      // Move to front if prioritized
      const idx = this.queue.findIndex((b) => b.id === badge.id);
      if (idx > 0) {
        const [item] = this.queue.splice(idx, 1);
        this.queue.unshift(item);
      }
    }

    if (!this.isProcessing && !this.isPaused) {
      this.processNext();
    }
  }

  /**
   * Subscribe to updates for a specific badge.
   * Returns an unsubscribe function.
   */
  public subscribe(badgeId: string, listener: PreviewListener): () => void {
    if (!this.listeners.has(badgeId)) {
      this.listeners.set(badgeId, new Set());
    }
    this.listeners.get(badgeId)!.add(listener);

    return () => {
      const set = this.listeners.get(badgeId);
      if (set) {
        set.delete(listener);
        if (set.size === 0) {
          this.listeners.delete(badgeId);
        }
      }
    };
  }

  private notifyListeners(badgeId: string, dataUrl: string): void {
    const set = this.listeners.get(badgeId);
    if (set) {
      set.forEach((listener) => {
        try {
          listener(dataUrl);
        } catch (e) {
          console.error('[BadgePreviewService] Error in listener callback:', e);
        }
      });
    }
  }

  /**
   * Temporarily pause preview generation (e.g. when full interactive 3D viewer is open)
   * to guarantee ONLY ONE WebGL context is actively used.
   */
  public pause(): void {
    this.isPaused = true;
  }

  /**
   * Resume preview generation when full interactive 3D viewer closes.
   */
  public resume(): void {
    this.isPaused = false;
    if (this.queue.length > 0 && !this.isProcessing) {
      this.processNext();
    }
  }

  /**
   * Preload a catalog of badges progressively.
   */
  public preloadCatalog(badges: BadgeModel[]): void {
    badges.forEach((b) => this.requestPreview(b, false));
  }

  private initRenderer(): boolean {
    if (this.renderer && this.scene && this.camera && this.badgeGroup && this.materialsLib) {
      return true;
    }

    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return false;
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 320;

      this.renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'low-power',
        preserveDrawingBuffer: true,
      });

      this.renderer.setSize(320, 320);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.22;

      this.scene = new THREE.Scene();
      this.scene.background = null;

      // 38° FOV natural telephoto angle matches AppleBadgeSceneController
      this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
      this.camera.position.set(0, 0, 5.4);

      // Photographic studio lights matching real badge specular reflections
      const ambLight = new THREE.AmbientLight(0xfff6ec, 0.75);
      this.scene.add(ambLight);

      const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
      keyLight.position.set(3.5, 4.5, 4.5);
      this.scene.add(keyLight);

      const rimLight = new THREE.DirectionalLight(0xffffff, 1.8);
      rimLight.position.set(-4.0, -2.0, -3.5);
      this.scene.add(rimLight);

      const fillLight = new THREE.DirectionalLight(0xd5e6ff, 1.0);
      fillLight.position.set(-3.0, 3.0, 3.5);
      this.scene.add(fillLight);

      this.badgeGroup = new THREE.Group();
      // Characteristic Apple 3D slight angle: reveals front vitreous enamel, thickness & metallic rim
      this.badgeGroup.rotation.set(0.12, -0.22, 0.04);
      this.scene.add(this.badgeGroup);

      this.materialsLib = new AppleAwardMaterials();
      return true;
    } catch (err) {
      console.warn('[BadgePreviewService] Failed to initialize WebGL preview renderer:', err);
      return false;
    }
  }

  private buildMesh(
    protoId: BadgePrototypeId,
    colorHex: number,
    badgeTitle: string,
    earnedDate: string,
    isLocked: boolean
  ): AppleBadgeMeshGroup {
    if (!this.materialsLib) {
      throw new Error('Materials library not initialized');
    }

    let lacquerColor = colorHex;
    if (!lacquerColor && badgeTitle) {
      const lower = badgeTitle.toLowerCase();
      if (lower.includes('review') || lower.includes('stand')) {
        lacquerColor = 0x00f0ff;
      } else if (lower.includes('focus') || lower.includes('exercise')) {
        lacquerColor = 0xa6ff00;
      }
    }

    switch (protoId) {
      case 'perfect-week-study':
        return buildAppleFacetedShieldBadge(this.materialsLib, lacquerColor, earnedDate, isLocked);
      case 'tricentric-learning':
        return buildAppleConcentricRingsBadge(this.materialsLib, earnedDate, isLocked);
      case 'teardrop-streak':
        return buildAppleTeardropStreakBadge(this.materialsLib, earnedDate, isLocked);
      case 'octagon-milestone':
        return buildAppleOctagonMilestoneBadge(this.materialsLib, earnedDate, isLocked);
      case 'infinity-mastery':
        return buildAppleInfinityMasteryBadge(this.materialsLib, earnedDate, isLocked);
      case 'circular-coin':
        return buildAppleCircularCoinBadge(this.materialsLib, earnedDate, isLocked);
      case 'shield-crested':
        return buildAppleShieldCrestedBadge(this.materialsLib, earnedDate, isLocked);
      case 'rhombus-diamond':
        return buildAppleRhombusDiamondBadge(this.materialsLib, earnedDate, isLocked);
      case 'pentagon-star':
        return buildApplePentagonStarBadge(this.materialsLib, earnedDate, isLocked);
      case 'rounded-squircle':
        return buildAppleRoundedSquircleBadge(this.materialsLib, earnedDate, isLocked);
      case 'clover-quatrefoil':
        return buildAppleCloverQuatrefoilBadge(this.materialsLib, earnedDate, isLocked);
      case 'oval-cameo':
        return buildAppleOvalCameoBadge(this.materialsLib, earnedDate, isLocked);
      case 'triangle-prism':
        return buildAppleTrianglePrismBadge(this.materialsLib, earnedDate, isLocked);
      case 'decagon-wheel':
        return buildAppleDecagonWheelBadge(this.materialsLib, earnedDate, isLocked);
      case 'shield-arch':
        return buildAppleShieldArchBadge(this.materialsLib, earnedDate, isLocked);
      case 'wave-crescent':
        return buildAppleWaveCrescentBadge(this.materialsLib, earnedDate, isLocked);
      case 'interlocking-rings':
        return buildAppleInterlockingRingsBadge(this.materialsLib, earnedDate, isLocked);
      case 'hourglass-nexus':
        return buildAppleHourglassNexusBadge(this.materialsLib, earnedDate, isLocked);
      case 'sunburst-radiant':
        return buildAppleSunburstRadiantBadge(this.materialsLib, earnedDate, isLocked);
      case 'owl-wisdom':
        return buildAppleOwlBadge(this.materialsLib, earnedDate, isLocked);
      case 'octopus-polymath':
        return buildAppleOctopusBadge(this.materialsLib, earnedDate, isLocked);
      case 'octopus-abyss':
        return buildAbyssOctopusBadge(this.materialsLib, earnedDate, isLocked);
      case 'octopus-quantum':
        return buildQuantumOctopusBadge(this.materialsLib, earnedDate, isLocked);
      case 'jellyfish-flow':
        return buildFlowJellyfishBadge(this.materialsLib, earnedDate, isLocked);
      case 'jellyfish-nebula':
        return buildNebulaJellyfishBadge(this.materialsLib, earnedDate, isLocked);
      case 'eagle-sovereign':
        return buildSovereignEagleBadge(this.materialsLib, earnedDate, isLocked);
      case 'owl-clockwork':
        return buildClockworkOwlBadge(this.materialsLib, earnedDate, isLocked);
      // 10 Cute Animals
      case 'cute-panda':
        return buildCutePandaBadge(this.materialsLib, earnedDate, isLocked);
      case 'cute-shiba':
        return buildCuteShibaBadge(this.materialsLib, earnedDate, isLocked);
      case 'cute-red-panda':
        return buildCuteRedPandaBadge(this.materialsLib, earnedDate, isLocked);
      case 'cute-koala':
        return buildCuteKoalaBadge(this.materialsLib, earnedDate, isLocked);
      case 'cute-hamster':
        return buildCuteHamsterBadge(this.materialsLib, earnedDate, isLocked);
      case 'cute-fennec-fox':
        return buildCuteFoxBadge(this.materialsLib, earnedDate, isLocked);
      case 'cute-penguin':
        return buildCutePenguinBadge(this.materialsLib, earnedDate, isLocked);
      case 'cute-bunny':
        return buildCuteBunnyBadge(this.materialsLib, earnedDate, isLocked);
      case 'cute-otter':
        return buildCuteOtterBadge(this.materialsLib, earnedDate, isLocked);
      case 'cute-alpaca':
        return buildCuteAlpacaBadge(this.materialsLib, earnedDate, isLocked);
      // 10 Ocean Animals
      case 'ocean-whale':
        return buildOceanWhaleBadge(this.materialsLib, earnedDate, isLocked);
      case 'ocean-manta':
        return buildOceanMantaBadge(this.materialsLib, earnedDate, isLocked);
      case 'ocean-turtle':
        return buildOceanTurtleBadge(this.materialsLib, earnedDate, isLocked);
      case 'ocean-dolphin':
        return buildOceanDolphinBadge(this.materialsLib, earnedDate, isLocked);
      case 'ocean-hammerhead':
        return buildOceanSharkBadge(this.materialsLib, earnedDate, isLocked);
      case 'ocean-seahorse':
        return buildOceanSeahorseBadge(this.materialsLib, earnedDate, isLocked);
      case 'ocean-narwhal':
        return buildOceanNarwhalBadge(this.materialsLib, earnedDate, isLocked);
      case 'ocean-octopus':
        return buildOceanOctopusBadge(this.materialsLib, earnedDate, isLocked);
      case 'ocean-jellyfish':
        return buildOceanJellyfishBadge(this.materialsLib, earnedDate, isLocked);
      case 'ocean-flying-fish':
        return buildOceanFlyingFishBadge(this.materialsLib, earnedDate, isLocked);
      // 10 Cartoon Characters
      case 'cartoon-wizard':
        return buildCartoonWizardBadge(this.materialsLib, earnedDate, isLocked);
      case 'cartoon-astronaut':
        return buildCartoonAstronautBadge(this.materialsLib, earnedDate, isLocked);
      case 'cartoon-mecha':
        return buildCartoonMechaBadge(this.materialsLib, earnedDate, isLocked);
      case 'cartoon-knight':
        return buildCartoonKnightBadge(this.materialsLib, earnedDate, isLocked);
      case 'cartoon-prince':
        return buildCartoonPrinceBadge(this.materialsLib, earnedDate, isLocked);
      case 'cartoon-pirate':
        return buildCartoonPirateBadge(this.materialsLib, earnedDate, isLocked);
      case 'cartoon-pixel-hero':
        return buildCartoonPixelHeroBadge(this.materialsLib, earnedDate, isLocked);
      case 'cartoon-aviator':
        return buildCartoonAviatorBadge(this.materialsLib, earnedDate, isLocked);
      case 'cartoon-elf':
        return buildCartoonElfBadge(this.materialsLib, earnedDate, isLocked);
      case 'cartoon-ninja':
        return buildCartoonNinjaBadge(this.materialsLib, earnedDate, isLocked);
      // 10 Minecraft Characters
      case 'mc-steve':
        return buildMinecraftSteveBadge(this.materialsLib, earnedDate, isLocked);
      case 'mc-alex':
        return buildMinecraftAlexBadge(this.materialsLib, earnedDate, isLocked);
      case 'mc-creeper':
        return buildMinecraftCreeperBadge(this.materialsLib, earnedDate, isLocked);
      case 'mc-enderman':
        return buildMinecraftEndermanBadge(this.materialsLib, earnedDate, isLocked);
      case 'mc-skeleton':
        return buildMinecraftSkeletonBadge(this.materialsLib, earnedDate, isLocked);
      case 'mc-zombie':
        return buildMinecraftZombieBadge(this.materialsLib, earnedDate, isLocked);
      case 'mc-iron-golem':
        return buildMinecraftIronGolemBadge(this.materialsLib, earnedDate, isLocked);
      case 'mc-pig':
        return buildMinecraftPigBadge(this.materialsLib, earnedDate, isLocked);
      case 'mc-ender-dragon':
        return buildMinecraftEnderDragonBadge(this.materialsLib, earnedDate, isLocked);
      case 'mc-axolotl':
        return buildMinecraftAxolotlBadge(this.materialsLib, earnedDate, isLocked);
      // Hexagon Challenge Pop Icons (Apple Limited Edition Hexagon Medal)
      case 'hex-axolotl-lucy':
        return buildHexAxolotlLucyBadge(this.materialsLib, earnedDate, isLocked);
      case 'hex-axolotl-cyan':
        return buildHexAxolotlCyanBadge(this.materialsLib, earnedDate, isLocked);
      case 'hex-minion-stuart':
        return buildHexMinionStuartBadge(this.materialsLib, earnedDate, isLocked);
      case 'hex-minion-bob':
        return buildHexMinionBobBadge(this.materialsLib, earnedDate, isLocked);
      case 'hex-bluey':
        return buildHexBlueyBadge(this.materialsLib, earnedDate, isLocked);
      case 'hex-bingo':
        return buildHexBingoBadge(this.materialsLib, earnedDate, isLocked);
      case 'hex-nemo':
        return buildHexNemoBadge(this.materialsLib, earnedDate, isLocked);
      case 'hex-dory':
        return buildHexDoryBadge(this.materialsLib, earnedDate, isLocked);
      case 'hex-rubble':
        return buildHexRubbleBadge(this.materialsLib, earnedDate, isLocked);
      case 'hex-pikachu':
        return buildHexPikachuBadge(this.materialsLib, earnedDate, isLocked);
      case 'hex-darth-vader':
        return buildHexDarthVaderBadge(this.materialsLib, earnedDate, isLocked);
      case 'hex-vader-helmet':
        return buildHexVaderHelmetBadge(this.materialsLib, earnedDate, isLocked);
      case 'hex-baby-yoda':
        return buildHexBabyYodaBadge(this.materialsLib, earnedDate, isLocked);
      case 'hex-lightsaber-green':
        return buildHexLightsaberGreenBadge(this.materialsLib, earnedDate, isLocked);
      case 'hex-lightsaber-red':
        return buildHexLightsaberRedBadge(this.materialsLib, earnedDate, isLocked);
      // 10 Liquid Glass Strike Badges
      case 'strike-3-days':
        return buildStrike3DaysBadge(this.materialsLib, earnedDate, isLocked);
      case 'strike-7-days':
        return buildStrike7DaysBadge(this.materialsLib, earnedDate, isLocked);
      case 'strike-14-days':
        return buildStrike14DaysBadge(this.materialsLib, earnedDate, isLocked);
      case 'strike-30-days':
        return buildStrike30DaysBadge(this.materialsLib, earnedDate, isLocked);
      case 'strike-40-days':
        return buildStrike40DaysBadge(this.materialsLib, earnedDate, isLocked);
      case 'strike-50-days':
        return buildStrike50DaysBadge(this.materialsLib, earnedDate, isLocked);
      case 'strike-60-days':
        return buildStrike60DaysBadge(this.materialsLib, earnedDate, isLocked);
      case 'strike-80-days':
        return buildStrike80DaysBadge(this.materialsLib, earnedDate, isLocked);
      case 'strike-90-days':
        return buildStrike90DaysBadge(this.materialsLib, earnedDate, isLocked);
      case 'strike-100-days':
        return buildStrike100DaysBadge(this.materialsLib, earnedDate, isLocked);
      default:
        return buildAppleChallengeHexBadge(this.materialsLib, earnedDate, isLocked);
    }
  }

  private processNext(): void {
    if (this.isPaused || this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;

    if (!this.initRenderer()) {
      this.isProcessing = false;
      return;
    }

    const badge = this.queue.shift()!;
    this.queuedIds.delete(badge.id);

    const cacheKey = this.getCacheKey(badge);
    if (this.memoryCache.has(cacheKey)) {
      this.notifyListeners(badge.id, this.memoryCache.get(cacheKey)!);
      this.scheduleNextTick();
      return;
    }

    try {
      const protoId = getBadgePrototypeId(badge.badgeStyle);
      const isLocked = badge.state === 'locked';
      const colorHex = badge.colorTheme?.primary
        ? parseInt(badge.colorTheme.primary.replace('#', '0x'), 16)
        : 0xfa114f;

      const mesh = this.buildMesh(
        protoId,
        colorHex,
        badge.name,
        badge.earnedDate || 'EARNED',
        isLocked
      );

      this.badgeGroup!.add(mesh);
      this.renderer!.render(this.scene!, this.camera!);

      let dataUrl = '';
      try {
        dataUrl = this.renderer!.domElement.toDataURL('image/webp', 0.92);
      } catch {
        dataUrl = this.renderer!.domElement.toDataURL('image/png');
      }

      // Cleanup mesh to prevent memory leaks
      this.badgeGroup!.remove(mesh);
      mesh.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
        }
      });

      if (dataUrl && dataUrl.length > 100) {
        this.memoryCache.set(cacheKey, dataUrl);
        try {
          sessionStorage.setItem(`minest_prev_v1_${cacheKey}`, dataUrl);
        } catch {
          // sessionStorage quota exceeded or blocked
        }
        this.notifyListeners(badge.id, dataUrl);
      }
    } catch (err) {
      console.warn(`[BadgePreviewService] Could not generate preview for ${badge.id}:`, err);
    }

    this.scheduleNextTick();
  }

  private scheduleNextTick(): void {
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(() => this.processNext());
    } else {
      setTimeout(() => this.processNext(), 16);
    }
  }

  /**
   * Release preview WebGL resources if needed.
   */
  public dispose(): void {
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
      this.renderer = null;
    }
    this.scene = null;
    this.camera = null;
    this.badgeGroup = null;
    this.materialsLib = null;
    this.isProcessing = false;
  }
}

export const badgePreviewService = new BadgePreviewService();
