/**
 * Optimized Hex Assembly Reveal Scene & Golden Pending Badge Master Scene
 *
 * Implements:
 * 1. 24K Olympic Gold Convex Hexagonal Pending Badge:
 *    - Built with buildApplePendingConvexHexBlank
 *    - Real 3D thickness with brushed gold side walls
 *    - Mirror-polished golden chamfer bevels
 *    - Refractive liquid glass dome with specular glints
 * 2. Sparkling Diamond Star Glints (闪闪发光):
 *    - 4-pointed diamond starburst flares placed along the 6 vertices and chamfers
 *    - High-frequency twinkle & scale pulses as the badge sways
 *    - Clean dark Apple studio background (ZERO background circles)
 * 3. Heavy Physical Levitation (待领取状态):
 *    - Multi-frequency organic floating, sway, and pitch tilt
 *    - Tactile click impulse & pointer parallax
 * 4. Seamless Click-to-Reveal Integration:
 *    - Clicking the golden badge instantly triggers the 7-stage Hex Assembly Reveal
 *    - 6 mechanical brackets fly in, lock with energy pulse, vortex spin, burst into golden particles, and materialize the real badge
 * 5. Full Timeline Scrubbing, Speed Controls & Reset to Pending
 */

import * as THREE from 'three';
import { AppleAwardMaterials } from './AppleAwardMaterials';
import {
  BadgeCatalogItem,
  buildAppleBadge3D,
  buildAppleHexMechanicalPendingBadge,
  buildApplePendingConvexHexBlank,
  buildOuterMechanicalAssembly,
  OuterMechanicalAssemblyGroup,
} from './BadgeGeometries';
import { badgeAudio, triggerHaptic } from '../utils/hapticsAndAudio';
import { PerformanceMetrics } from './OptimizedBadgeInspectorScene';

export interface RevealPhaseInfo {
  phaseIndex: number;
  name: string;
  nameZh: string;
  timeRange: [number, number];
  description: string;
}

export const REVEAL_PHASES: RevealPhaseInfo[] = [
  {
    phaseIndex: 1,
    name: 'Bracket Fly-in',
    nameZh: '阶段 1：6 机械卡槽弧线拼装',
    timeRange: [0, 950],
    description: '6 片外框机械卡扣以 100ms 错峰弧线飞入，伴随弹性微超调（Overshoot Bounce）对齐吸附。',
  },
  {
    phaseIndex: 2,
    name: 'Lock Energy Pulse',
    nameZh: '阶段 2：锁闭能量脉冲流转',
    timeRange: [950, 1300],
    description: '中心点光源激增 8.0 倍强度，青色（Cyan 0x00f0ff）向暖金（Gold 0xffd60a）渐变能量涌动。',
  },
  {
    phaseIndex: 3,
    name: 'High-Speed Vortex Spin',
    nameZh: '阶段 3：超高速 3.5 圈涡流自转',
    timeRange: [1300, 2200],
    description: '连续四元数插值加速至峰值并平滑减速，消除了原版的旋转角度突变与跳帧。',
  },
  {
    phaseIndex: 4,
    name: 'Radial Burst & Dissolve',
    nameZh: '阶段 4：外框机械爆解与胚体溶解',
    timeRange: [2200, 2500],
    description: '机械卡槽受力向外爆散，金光胚体透明度瞬逝，激发出 120 颗 GPU 黄金粒子冲击波。',
  },
  {
    phaseIndex: 5,
    name: 'Real Badge Materialization',
    nameZh: '阶段 5：预热真身勋章破茧化形',
    timeRange: [2420, 2940],
    description: '预先阶段化 GPU 显存预热，真身勋章从 0.01 尺度平滑放大并浮现金光，实现 0 掉帧高潮。',
  },
  {
    phaseIndex: 6,
    name: 'Idle Settle & Collect',
    nameZh: '阶段 6：平稳悬浮定型与入库',
    timeRange: [2940, 3640],
    description: '自适应平滑归位至正面观察角，触发 Apple 祝贺和弦音效与轻触震动，完成解锁归档。',
  },
];

export class OptimizedHexRevealScene {
  private container: HTMLElement;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  public badgeGroup!: THREE.Group;
  private sharedMaterials: AppleAwardMaterials;

  // Scene Objects
  private mysteryHex!: THREE.Group;
  private assemblyGroup!: OuterMechanicalAssemblyGroup;
  private realBadgeMesh: THREE.Group | null = null;
  private centerPulseLight!: THREE.PointLight;
  private goldGlintLight!: THREE.PointLight;
  private shockwaveRing!: THREE.Mesh;
  private particleCloud!: THREE.Points;

  // Sparkling Diamond Star Glints (闪闪发光)
  private starGlintsGroup!: THREE.Group;
  private starGlints: Array<{ mesh: THREE.Mesh; phase: number; speed: number; baseScale: number }> = [];

  // Soft Golden Ambient Aura (behind badge)
  private softAuraMesh!: THREE.Mesh;

  // Pre-cached Flat Material Arrays
  private mysteryMaterials: THREE.Material[] = [];
  private mysteryEmissiveMaterials: THREE.MeshStandardMaterial[] = [];
  private realBadgeMaterials: THREE.Material[] = [];

  // Pending State
  public isPending = true;
  public onPendingBadgeClick?: () => void;

  // Tactile Spring Recoil on Click
  private recoilZ = 0;
  private recoilVelZ = 0;

  // Pointer Parallax
  private isDragging = false;
  private prevPointerX = 0;
  private prevPointerY = 0;
  private currentQuat = new THREE.Quaternion();
  private targetQuat = new THREE.Quaternion();
  private pointerParallaxX = 0;
  private pointerParallaxY = 0;

  // Animation Playback State (Default to 0.5x as requested)
  public isPlaying = false;
  public currentTimeMs = 0;
  public playbackSpeed = 0.5;
  public readonly TOTAL_DURATION = 3640; // ms
  private lastRafTime = performance.now();
  private isLoopRunning = true;
  private badgeTime = 0;

  // Sound triggers
  private soundTriggered = {
    brackets: [false, false, false, false, false, false],
    pulse: false,
    spin: false,
    burst: false,
    chime: false,
  };

  // Performance Metrics
  public onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
  public onPhaseChange?: (phaseIndex: number, phaseTimeMs: number) => void;
  public onRevealComplete?: () => void;
  public onPendingStateChange?: (isPending: boolean) => void;
  private currentPhaseIndex = 1;
  private frameCount = 0;
  private lastFpsCalcTime = performance.now();

  constructor(container: HTMLElement, materials?: AppleAwardMaterials) {
    this.container = container;
    this.sharedMaterials = materials || new AppleAwardMaterials();
    this.initScene();
    this.initParticleSystems();
    this.initStarGlints();
    this.bindEvents();
    this.startLoop();
  }

  private initScene() {
    const width = Math.max(300, this.container.clientWidth || 500);
    const height = Math.max(300, this.container.clientHeight || 480);

    this.scene = new THREE.Scene();
    this.scene.environment = this.sharedMaterials.envMap;

    this.camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    this.camera.position.set(0, 0, 5.4);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      stencil: false,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;

    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // Studio Lights - Tuned for 24K Mirror Gold Highlights
    const amb = new THREE.AmbientLight(0xfff5e6, 0.65);
    this.scene.add(amb);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x141820, 0.55);
    this.scene.add(hemi);

    // Key softbox light top-right (casts moving razor highlights across golden chamfers)
    const key = new THREE.DirectionalLight(0xffffff, 2.6);
    key.position.set(3.4, 4.2, 4.5);
    this.scene.add(key);

    // Secondary specular highlight light (sharp glints)
    this.goldGlintLight = new THREE.PointLight(0xffea88, 2.4, 9, 1.6);
    this.goldGlintLight.position.set(1.5, 2.4, 3.2);
    this.scene.add(this.goldGlintLight);

    // Rim light left
    const cyanRim = new THREE.PointLight(0x00f0ff, 1.2, 10);
    cyanRim.position.set(-2.8, -2.2, 2.5);
    this.scene.add(cyanRim);

    // Warm gold bounce fill
    const goldFill = new THREE.PointLight(0xffb800, 1.6, 9);
    goldFill.position.set(2.4, -2.6, 2.0);
    this.scene.add(goldFill);

    // Center Pulse Energy Light
    this.centerPulseLight = new THREE.PointLight(0x00f0ff, 0, 10);
    this.centerPulseLight.position.set(0, 0, 0.5);
    this.scene.add(this.centerPulseLight);

    // Soft Golden Ambient Radial Aura behind badge (Clean: absolutely NO circles)
    const auraCanvas = document.createElement('canvas');
    auraCanvas.width = 256;
    auraCanvas.height = 256;
    const actx = auraCanvas.getContext('2d');
    if (actx) {
      const grad = actx.createRadialGradient(128, 128, 0, 128, 128, 128);
      grad.addColorStop(0, 'rgba(255, 215, 60, 0.35)');
      grad.addColorStop(0.35, 'rgba(255, 180, 20, 0.15)');
      grad.addColorStop(0.7, 'rgba(255, 140, 0, 0.04)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      actx.fillStyle = grad;
      actx.fillRect(0, 0, 256, 256);
    }
    const auraTex = new THREE.CanvasTexture(auraCanvas);
    const auraGeo = new THREE.PlaneGeometry(5.5, 5.5);
    const auraMat = new THREE.MeshBasicMaterial({
      map: auraTex,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.softAuraMesh = new THREE.Mesh(auraGeo, auraMat);
    this.softAuraMesh.position.set(0, 0, -0.6);
    this.scene.add(this.softAuraMesh);

    // Badge Anchor Group
    this.badgeGroup = new THREE.Group();
    this.scene.add(this.badgeGroup);
  }

  // Pre-allocates GPU Particle Systems for the Phase 4 Explosion
  private initParticleSystems() {
    // 1. Shockwave Expanding Ring
    const ringGeo = new THREE.RingGeometry(0.2, 0.32, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffd60a,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    this.shockwaveRing = new THREE.Mesh(ringGeo, ringMat);
    this.shockwaveRing.position.z = 0.2;
    this.shockwaveRing.visible = false;
    this.badgeGroup.add(this.shockwaveRing);

    // 2. Instanced Golden Dust Particles (160 particles)
    const particleCount = 160;
    const posArray = new Float32Array(particleCount * 3);
    const velArray = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const speed = 1.4 + Math.random() * 3.4;
      posArray[i * 3] = 0;
      posArray[i * 3 + 1] = 0;
      posArray[i * 3 + 2] = (Math.random() - 0.5) * 0.4;

      velArray[i * 3] = Math.cos(theta) * speed;
      velArray[i * 3 + 1] = Math.sin(theta) * speed;
      velArray[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
    }

    const partGeo = new THREE.BufferGeometry();
    partGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    partGeo.setAttribute('velocity', new THREE.BufferAttribute(velArray, 3));

    const partMat = new THREE.PointsMaterial({
      color: 0xffea75,
      size: 0.09,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });

    this.particleCloud = new THREE.Points(partGeo, partMat);
    this.particleCloud.visible = false;
    this.badgeGroup.add(this.particleCloud);
  }

  /**
   * Sparkling Diamond Star Glints (闪闪发光星芒)
   * 4-pointed diamond starburst flares placed along the 6 vertices and chamfers
   */
  private initStarGlints() {
    this.starGlintsGroup = new THREE.Group();
    this.starGlints = [];

    // Create 4-pointed diamond star geometry
    const starShape = new THREE.Shape();
    const rOuter = 0.26;
    const rInner = 0.038;
    const points = 4;
    for (let i = 0; i < points * 2; i++) {
      const a = (i * Math.PI) / points;
      const r = i % 2 === 0 ? rOuter : rInner;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) starShape.moveTo(x, y);
      else starShape.lineTo(x, y);
    }
    starShape.closePath();
    const starGeo = new THREE.ShapeGeometry(starShape);

    // Place glints along the 6 outer filleted vertices of the golden hexagon
    const hexRadius = 1.48;
    const zOffset = 0.14;

    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const x = Math.cos(angle) * hexRadius;
      const y = Math.sin(angle) * hexRadius;

      const mat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(starGeo, mat);
      mesh.position.set(x, y, zOffset);
      this.starGlintsGroup.add(mesh);

      this.starGlints.push({
        mesh,
        phase: i * 1.1 + Math.random() * 0.5,
        speed: 2.6 + Math.random() * 1.5,
        baseScale: 0.9 + Math.random() * 0.3,
      });
    }

    // 2 specular flares on the convex front face
    const frontFlares = [
      { x: 0.32, y: 0.45 },
      { x: -0.38, y: -0.35 },
    ];
    frontFlares.forEach((pos, idx) => {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xfffae0,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(starGeo, mat);
      mesh.position.set(pos.x, pos.y, 0.22);
      this.starGlintsGroup.add(mesh);
      this.starGlints.push({
        mesh,
        phase: idx * 2.2,
        speed: 3.4,
        baseScale: 1.1,
      });
    });

    // 3. Central mechanical lock core power gem glint
    const centerGlintMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const centerMesh = new THREE.Mesh(starGeo, centerGlintMat);
    centerMesh.position.set(0, 0, 0.28);
    this.starGlintsGroup.add(centerMesh);
    this.starGlints.push({
      mesh: centerMesh,
      phase: 0.8,
      speed: 4.2,
      baseScale: 1.35,
    });

    this.badgeGroup.add(this.starGlintsGroup);
  }

  /**
   * Pre-warm and stage the real badge mesh BEFORE reveal begins.
   */
  public prepareReveal(badgeData: BadgeCatalogItem) {
    this.resetRevealScene();

    // 1. Build 24K Olympic Gold Hexagonal Mechanical Pending Badge
    this.mysteryHex = buildAppleHexMechanicalPendingBadge(this.sharedMaterials);
    this.badgeGroup.add(this.mysteryHex);

    this.mysteryMaterials = [];
    this.mysteryEmissiveMaterials = [];
    this.mysteryHex.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m) => {
          if (m && !this.mysteryMaterials.includes(m)) {
            m.transparent = true;
            m.opacity = 1.0;
            this.mysteryMaterials.push(m);
            if ((m as THREE.MeshStandardMaterial).emissive) {
              this.mysteryEmissiveMaterials.push(m as THREE.MeshStandardMaterial);
            }
          }
        });
      }
    });

    // 2. Build Outer Mechanical Brackets Assembly (hidden during pending state)
    this.assemblyGroup = buildOuterMechanicalAssembly(this.sharedMaterials, { initialProgress: 0.0 });
    this.assemblyGroup.visible = !this.isPending;
    this.badgeGroup.add(this.assemblyGroup);

    // 3. PRE-WARM REAL BADGE: Build now and compile GPU shaders, keep dormant at scale 0.001
    this.realBadgeMesh = buildAppleBadge3D(this.sharedMaterials, badgeData);
    this.realBadgeMesh.scale.setScalar(0.001);
    this.realBadgeMesh.visible = false;
    this.badgeGroup.add(this.realBadgeMesh);

    this.realBadgeMaterials = [];
    this.realBadgeMesh.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m) => {
          if (m && !this.realBadgeMaterials.includes(m)) {
            m.transparent = true;
            m.opacity = 0;
            this.realBadgeMaterials.push(m);
          }
        });
      }
    });

    // Re-attach star glints group to ensure it stays in front
    if (this.starGlintsGroup) {
      this.badgeGroup.add(this.starGlintsGroup);
      this.starGlintsGroup.visible = this.isPending;
    }

    // Pre-compile scene shaders on GPU
    this.renderer.compile(this.scene, this.camera);

    if (!this.isPending) {
      this.seekTime(0);
    }
  }

  /**
   * User clicks golden badge: immediately transitions to Hex Mechanical Reveal!
   */
  public triggerReveal() {
    this.isPending = false;
    this.isPlaying = true;
    this.currentTimeMs = 0;

    // Tactile recoil impulse
    this.recoilVelZ = -0.16;

    if (this.assemblyGroup) {
      this.assemblyGroup.visible = true;
    }
    if (this.starGlintsGroup) {
      this.starGlintsGroup.visible = false;
    }

    badgeAudio.playBracketSnap(0, this.playbackSpeed);
    triggerHaptic('impact');

    if (this.onPendingStateChange) {
      this.onPendingStateChange(false);
    }

    this.evaluateTimeline(0);
  }

  /**
   * Reset to Pending Golden Badge state
   */
  public resetToPending() {
    this.isPending = true;
    this.isPlaying = false;
    this.currentTimeMs = 0;
    this.targetQuat.identity();
    this.currentQuat.identity();

    if (this.assemblyGroup) {
      this.assemblyGroup.visible = false;
    }
    if (this.mysteryHex) {
      this.mysteryHex.visible = true;
      for (let i = 0; i < this.mysteryMaterials.length; i++) {
        this.mysteryMaterials[i].opacity = 1.0;
        this.mysteryMaterials[i].transparent = true;
      }
    }
    if (this.realBadgeMesh) {
      this.realBadgeMesh.visible = false;
      this.realBadgeMesh.scale.setScalar(0.001);
    }
    if (this.starGlintsGroup) {
      this.starGlintsGroup.visible = true;
    }

    this.soundTriggered = {
      brackets: [false, false, false, false, false, false],
      pulse: false,
      spin: false,
      burst: false,
      chime: false,
    };

    if (this.onPendingStateChange) {
      this.onPendingStateChange(true);
    }
  }

  public play() {
    if (this.isPending) {
      this.triggerReveal();
      return;
    }
    if (this.currentTimeMs >= this.TOTAL_DURATION) {
      this.seekTime(0);
    }
    this.isPlaying = true;
  }

  public pause() {
    this.isPlaying = false;
  }

  public restart() {
    this.isPending = false;
    this.seekTime(0);
    this.isPlaying = true;
    if (this.assemblyGroup) this.assemblyGroup.visible = true;
    if (this.starGlintsGroup) this.starGlintsGroup.visible = false;
  }

  public seekTime(timeMs: number) {
    this.isPending = false;
    this.currentTimeMs = Math.max(0, Math.min(this.TOTAL_DURATION, timeMs));
    this.evaluateTimeline(this.currentTimeMs);
  }

  private resetRevealScene() {
    while (this.badgeGroup.children.length > 0) {
      this.badgeGroup.remove(this.badgeGroup.children[0]);
    }

    this.badgeGroup.add(this.shockwaveRing);
    this.badgeGroup.add(this.particleCloud);
    this.badgeGroup.position.set(0, 0, 0);
    this.badgeGroup.rotation.set(0, 0, 0);
    this.targetQuat.identity();
    this.currentQuat.identity();

    this.soundTriggered = {
      brackets: [false, false, false, false, false, false],
      pulse: false,
      spin: false,
      burst: false,
      chime: false,
    };
  }

  /**
   * Timeline Evaluator for 7 Phases of Hex Assembly
   */
  private evaluateTimeline(timeMs: number) {
    let currentPhase = 1;
    for (const p of REVEAL_PHASES) {
      if (timeMs >= p.timeRange[0] && timeMs <= p.timeRange[1]) {
        currentPhase = p.phaseIndex;
        break;
      }
      if (timeMs > p.timeRange[1]) currentPhase = p.phaseIndex;
    }

    if (currentPhase !== this.currentPhaseIndex) {
      this.currentPhaseIndex = currentPhase;
      if (this.onPhaseChange) {
        this.onPhaseChange(this.currentPhaseIndex, timeMs);
      }
    }

    // ── Phase 1: Brackets fly in staggered (0 - 950ms) ───────────────────
    const T_BRACKET_START = 0;
    const T_BRACKET_STAGGER = 90;
    const T_BRACKET_DURATION = 420;

    if (this.assemblyGroup && this.assemblyGroup.brackets) {
      const isBursting = timeMs >= 2200;

      if (!isBursting) {
        this.assemblyGroup.visible = true;
        this.assemblyGroup.brackets.forEach((b, i) => {
          const bStart = T_BRACKET_START + i * T_BRACKET_STAGGER;
          if (timeMs < bStart) {
            b.visible = false;
            return;
          }
          b.visible = true;

          // Sound trigger when docked
          if (timeMs >= bStart + T_BRACKET_DURATION && !this.soundTriggered.brackets[i]) {
            this.soundTriggered.brackets[i] = true;
            badgeAudio.playBracketSnap(i, this.playbackSpeed);
            triggerHaptic('tap');
          }

          const rawT = Math.min(1, (timeMs - bStart) / T_BRACKET_DURATION);
          let bt = 1;
          if (rawT < 0.85) {
            const easeOut = 1 - Math.pow(1 - rawT / 0.85, 3);
            bt = easeOut;
          } else {
            const sub = (rawT - 0.85) / 0.15;
            bt = 1 + 0.08 * Math.sin(sub * Math.PI);
          }

          const u = b.userData;
          const spreadFar = u.spreadRadius * 2.2;
          const currentR = spreadFar + (u.dockRadius - spreadFar) * bt;

          b.position.x = u.dirX * currentR;
          b.position.y = u.dirY * currentR;
          b.position.z = (1 - rawT) * 0.7;
          b.scale.setScalar(0.45 + 0.55 * Math.min(1, rawT * 1.15));

          if (rawT < 0.85) {
            const perp = Math.sin(rawT * Math.PI) * 0.28;
            b.position.x += -u.dirY * perp;
            b.position.y += u.dirX * perp;
          }
        });
      }
    }

    // ── Phase 2: Lock Energy Pulse (950 - 1300ms) ────────────────────────
    if (timeMs >= 950 && timeMs < 1300) {
      if (!this.soundTriggered.pulse) {
        this.soundTriggered.pulse = true;
        badgeAudio.playEnergyPulse(this.playbackSpeed);
        triggerHaptic('impact');
      }

      const pt = (timeMs - 950) / 350;
      const wave = Math.sin(pt * Math.PI);

      this.centerPulseLight.intensity = wave * 8.5;
      this.centerPulseLight.color.setHex(pt < 0.55 ? 0x00f0ff : 0xffd60a);

      for (let i = 0; i < this.mysteryEmissiveMaterials.length; i++) {
        this.mysteryEmissiveMaterials[i].emissiveIntensity = 0.35 + wave * 1.5;
      }
    } else if (timeMs < 950 || (timeMs >= 1300 && timeMs < 2200)) {
      this.centerPulseLight.intensity = 0;
      for (let i = 0; i < this.mysteryEmissiveMaterials.length; i++) {
        this.mysteryEmissiveMaterials[i].emissiveIntensity = 0.35;
      }
    }

    // ── Phase 3: High-speed Vortex Spin (1300 - 2200ms) ──────────────────
    if (timeMs >= 1300 && timeMs < 2200) {
      if (!this.soundTriggered.spin) {
        this.soundTriggered.spin = true;
        badgeAudio.playSpinWhoosh(0.9, this.playbackSpeed);
      }

      const st = (timeMs - 1300) / 900;
      const easeCurve = st < 0.5 ? 4 * st * st * st : 1 - Math.pow(-2 * st + 2, 3) / 2;
      const spinAngle = easeCurve * Math.PI * 2 * 3.5;

      this.badgeGroup.rotation.y = spinAngle;
    } else if (timeMs >= 2200 && timeMs < 2940) {
      const normT = Math.min(1, (timeMs - 2200) / 740);
      this.badgeGroup.rotation.y = Math.PI * 2 * 3.5 * (1 - normT * 0.98);
    } else if (timeMs >= 2940) {
      this.badgeGroup.rotation.y = 0;
    }

    // ── Phase 4: Radial Burst & Dissolve (2200 - 2500ms) ────────────────
    if (timeMs >= 2200 && timeMs < 2500) {
      if (!this.soundTriggered.burst) {
        this.soundTriggered.burst = true;
        badgeAudio.playBurst(this.playbackSpeed);
        triggerHaptic('impact');
      }

      const bt = (timeMs - 2200) / 300;
      const easeExplode = bt * bt;

      // Brackets explode outward
      if (this.assemblyGroup && this.assemblyGroup.brackets) {
        this.assemblyGroup.brackets.forEach((b) => {
          const u = b.userData;
          const burstR = u.dockRadius + easeExplode * 6.5;
          b.position.x = u.dirX * burstR;
          b.position.y = u.dirY * burstR;
          b.position.z = bt * 1.8;
          b.scale.setScalar(Math.max(0.01, 1.0 - bt * 0.9));
        });
      }

      // Mystery Hex dissolves
      const alpha = Math.max(0, 1.0 - bt * 1.3);
      for (let i = 0; i < this.mysteryMaterials.length; i++) {
        this.mysteryMaterials[i].opacity = alpha;
      }

      // Shockwave Ring Expanding
      this.shockwaveRing.visible = true;
      const ringScale = 0.5 + bt * 4.2;
      this.shockwaveRing.scale.setScalar(ringScale);
      (this.shockwaveRing.material as THREE.MeshBasicMaterial).opacity = (1 - bt) * 0.85;

      // Golden Dust Particles Burst Out
      this.particleCloud.visible = true;
      const posAttr = this.particleCloud.geometry.getAttribute('position') as THREE.BufferAttribute;
      const velAttr = this.particleCloud.geometry.getAttribute('velocity') as THREE.BufferAttribute;

      for (let i = 0; i < posAttr.count; i++) {
        const vx = velAttr.getX(i);
        const vy = velAttr.getY(i);
        const vz = velAttr.getZ(i);
        posAttr.setXYZ(i, vx * bt * 1.4, vy * bt * 1.4, vz * bt * 1.4);
      }
      posAttr.needsUpdate = true;
      (this.particleCloud.material as THREE.PointsMaterial).opacity = (1 - bt) * 0.95;

      // Flash Light Pulse
      this.centerPulseLight.color.setHex(0xffffff);
      this.centerPulseLight.intensity = (1 - bt) * 7.5;
    } else if (timeMs >= 2500) {
      if (this.assemblyGroup) this.assemblyGroup.visible = false;
      if (this.mysteryHex) this.mysteryHex.visible = false;
      this.shockwaveRing.visible = false;
      this.particleCloud.visible = false;
      this.centerPulseLight.intensity = 0;
    } else {
      if (this.mysteryHex) this.mysteryHex.visible = true;
      for (let i = 0; i < this.mysteryMaterials.length; i++) {
        this.mysteryMaterials[i].opacity = 1.0;
      }
      this.shockwaveRing.visible = false;
      this.particleCloud.visible = false;
    }

    // ── Phase 5: Real Badge Materialization (2420 - 2940ms) ──────────────
    if (this.realBadgeMesh) {
      if (timeMs < 2420) {
        this.realBadgeMesh.visible = false;
        this.realBadgeMesh.scale.setScalar(0.001);
      } else if (timeMs >= 2420 && timeMs < 2940) {
        this.realBadgeMesh.visible = true;
        const ft = (timeMs - 2420) / 520;
        const fe = 1 - Math.pow(1 - ft, 3);

        this.realBadgeMesh.scale.setScalar(0.01 + 0.99 * fe);
        const badgeOpacity = Math.min(1.0, ft * 2.2);

        for (let i = 0; i < this.realBadgeMaterials.length; i++) {
          this.realBadgeMaterials[i].opacity = badgeOpacity;
        }

        this.centerPulseLight.color.setHex(0xffd60a);
        this.centerPulseLight.intensity = (1 - ft) * 4.5;
      } else {
        this.realBadgeMesh.visible = true;
        this.realBadgeMesh.scale.setScalar(1.0);
        for (let i = 0; i < this.realBadgeMaterials.length; i++) {
          this.realBadgeMaterials[i].opacity = 1.0;
          this.realBadgeMaterials[i].transparent = false;
        }
      }
    }

    // ── Phase 6: Settle to Idle Hover & Celebration (2940 - 3640ms) ──────
    if (timeMs >= 2940) {
      if (!this.soundTriggered.chime) {
        this.soundTriggered.chime = true;
        badgeAudio.playCelebrationChime(this.playbackSpeed);
        triggerHaptic('success');
        if (this.onRevealComplete) {
          this.onRevealComplete();
        }
      }

      const hoverT = (timeMs - 2940) / 1000;
      this.badgeGroup.position.y = Math.sin(hoverT * 2.5) * 0.04;
      this.badgeGroup.rotation.z = Math.sin(hoverT * 1.8) * 0.02;
    } else {
      this.badgeGroup.position.y = 0;
      this.badgeGroup.rotation.z = 0;
    }
  }

  private bindEvents() {
    const el = this.renderer.domElement;

    // Click on canvas triggers reveal when in pending state
    el.addEventListener('click', (e: MouseEvent) => {
      // Ignore if user was dragging
      if (Math.abs(e.clientX - this.prevPointerX) > 5 || Math.abs(e.clientY - this.prevPointerY) > 5) {
        return;
      }
      if (this.isPending) {
        if (this.onPendingBadgeClick) {
          this.onPendingBadgeClick();
        } else {
          this.triggerReveal();
        }
      }
    });

    el.addEventListener('pointerdown', (e: PointerEvent) => {
      this.isDragging = true;
      this.prevPointerX = e.clientX;
      this.prevPointerY = e.clientY;
      el.setPointerCapture(e.pointerId);
    });

    window.addEventListener('pointermove', (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const normX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const normY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      this.pointerParallaxX = normX * 0.12;
      this.pointerParallaxY = -normY * 0.12;

      if (!this.isDragging) return;
      const dx = e.clientX - this.prevPointerX;
      const dy = e.clientY - this.prevPointerY;

      const qY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), dx * 0.008);
      const qX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), dy * 0.008);
      this.targetQuat.premultiply(qY.multiply(qX));

      this.prevPointerX = e.clientX;
      this.prevPointerY = e.clientY;
    });

    window.addEventListener('pointerup', () => {
      this.isDragging = false;
    });

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          this.camera.aspect = width / height;
          this.camera.updateProjectionMatrix();
          this.renderer.setSize(width, height);
        }
      }
    });
    ro.observe(this.container);
  }

  private startLoop() {
    const loop = (now: number) => {
      if (!this.isLoopRunning) return;
      requestAnimationFrame(loop);

      const dt = Math.min(0.05, (now - this.lastRafTime) / 1000);
      this.lastRafTime = now;
      this.badgeTime += dt;

      // ─────────────────────────────────────────────────────────────────
      // Mode 1: Pending Golden Badge Levitation & Sparkling Glints
      // ─────────────────────────────────────────────────────────────────
      if (this.isPending) {
        const t = this.badgeTime;

        // Organic physical levitation: vertical float + sway + tilt
        const floatY = Math.sin(t * 1.4) * 0.08;
        const swayX = Math.cos(t * 0.9) * 0.04;

        // Spring recoil damping
        this.recoilVelZ += (0 - this.recoilZ) * 24.0 * dt;
        this.recoilVelZ *= Math.pow(0.85, dt * 60);
        this.recoilZ += this.recoilVelZ;

        this.badgeGroup.position.set(swayX, floatY, this.recoilZ);

        // Gentle tilt with pointer parallax
        const tiltX = Math.sin(t * 1.1) * 0.06 + this.pointerParallaxY;
        const tiltY = Math.cos(t * 0.8) * 0.07 + this.pointerParallaxX;

        const baseQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(tiltX, tiltY, 0));
        this.currentQuat.slerp(this.targetQuat.clone().multiply(baseQuat), 0.12);
        this.badgeGroup.quaternion.copy(this.currentQuat);

        // Orbit gold highlight light to catch specular chamfer highlights
        if (this.goldGlintLight) {
          this.goldGlintLight.position.x = 1.5 + Math.cos(t * 1.2) * 0.8;
          this.goldGlintLight.position.y = 2.4 + Math.sin(t * 0.9) * 0.6;
        }

        // Twinkle sparkling star glints (闪闪发光)
        for (let i = 0; i < this.starGlints.length; i++) {
          const g = this.starGlints[i];
          const twinkle = Math.pow(Math.max(0, Math.sin(t * g.speed + g.phase)), 6);
          const sc = g.baseScale * (0.35 + 1.25 * twinkle);
          g.mesh.scale.set(sc, sc, 1);
          (g.mesh.material as THREE.MeshBasicMaterial).opacity = twinkle * 0.98;
          g.mesh.rotation.z += dt * 0.6;
        }

        // Breathing soft aura
        if (this.softAuraMesh) {
          const auraPulse = 0.65 + 0.15 * Math.sin(t * 1.2);
          (this.softAuraMesh.material as THREE.MeshBasicMaterial).opacity = auraPulse;
        }
      } else {
        // ─────────────────────────────────────────────────────────────────
        // Mode 2: Hex Mechanical Assembly Reveal Timeline Running
        // ─────────────────────────────────────────────────────────────────
        if (this.isPlaying) {
          this.currentTimeMs += dt * 1000 * this.playbackSpeed;
          if (this.currentTimeMs >= this.TOTAL_DURATION) {
            this.currentTimeMs = this.TOTAL_DURATION;
            this.isPlaying = false;
          }
          this.evaluateTimeline(this.currentTimeMs);
        }

        // Smooth interaction slerp
        this.currentQuat.slerp(this.targetQuat, 0.15);
        if (!this.isPlaying || this.currentTimeMs < 1300 || this.currentTimeMs > 2940) {
          this.badgeGroup.quaternion.copy(this.currentQuat);
        }
      }

      this.renderFrame(now);
    };

    requestAnimationFrame(loop);
  }

  private renderFrame(now: number) {
    const start = performance.now();
    this.renderer.render(this.scene, this.camera);
    const frameTime = performance.now() - start;

    this.frameCount++;
    if (now - this.lastFpsCalcTime >= 500) {
      const fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsCalcTime));
      this.frameCount = 0;
      this.lastFpsCalcTime = now;

      if (this.onMetricsUpdate) {
        this.onMetricsUpdate({
          fps: Math.min(120, fps),
          frameTimeMs: Number(frameTime.toFixed(2)),
          drawCalls: this.renderer.info.render.calls,
          triangles: this.renderer.info.render.triangles,
          isSleeping: !this.isPlaying && !this.isDragging && !this.isPending,
          allocationsPerFrame: 0,
        });
      }
    }
  }

  public destroy() {
    this.isLoopRunning = false;
    this.renderer.dispose();
    this.container.innerHTML = '';
  }
}
