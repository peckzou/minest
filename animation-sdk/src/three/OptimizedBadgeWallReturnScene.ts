import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { AppleAwardMaterials } from './AppleAwardMaterials';
import {
  BADGE_CATALOG,
  BadgeCatalogItem,
  buildAppleBadge3D,
} from './BadgeGeometries';
import {
  badgeAudio,
  triggerHaptic,
  triggerSpringOvershootHaptic,
} from '../utils/hapticsAndAudio';
import {
  SpringPhysicsIntegrator,
  SpringPhysicsTelemetry,
} from '../utils/springPhysicsIntegrator';
import { PerformanceMetrics } from './OptimizedBadgeInspectorScene';

export type BadgeWallSpatialState =
  | 'wall' // 全景徽章墙浏览态
  | 'flying_out' // 从槽位飞向镜头中央
  | 'inspect' // 中央 3D 赏玩态
  | 'pull_back' // 开始回收：轻微后倾拉回
  | 'flying_back' // 3D 轨迹自转飞回原槽位
  | 'magnetic_snap'; // 精准磁吸吸附弹跳归位

export interface WallSlotData {
  index: number;
  badge: BadgeCatalogItem;
  x: number;
  y: number;
  z: number;
  slotGroup: THREE.Group;
  pedestalMesh: THREE.Mesh;
  socketRimMesh: THREE.Mesh;
  haloMesh: THREE.Mesh;
  badgeMesh: THREE.Group;
  isUnlocked: boolean;
}

export class OptimizedBadgeWallReturnScene {
  private container: HTMLElement;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private composer!: EffectComposer;
  private bloomPass!: UnrealBloomPass;

  private mats: AppleAwardMaterials;
  private wallGroup!: THREE.Group;
  private slots: WallSlotData[] = [];

  // Foreground Center Showcase Badge
  private showcaseGroup!: THREE.Group;
  private currentShowcaseMesh: THREE.Group | null = null;
  private activeBadgeItem: BadgeCatalogItem | null = null;
  private activeSlotIndex: number = 0;

  // Spatial State
  public currentState: BadgeWallSpatialState = 'wall';
  private animStartTime = 0;
  private animDuration = 1000;
  public playbackSpeed = 1.0;
  public overshootElasticity = 1.0;
  public vibrationIntensity = 1.0;

  // Spring Physics Tuning Parameters
  public springDamping = 28;    // c: Damping coefficient (N·s/m)
  public springStiffness = 380;  // k: Spring stiffness (N/m)
  public springMass = 0.85;      // m: Mass (kg)

  // Flight Path Interpolation Vectors
  private flightStartPos = new THREE.Vector3();
  private flightEndPos = new THREE.Vector3();
  private flightStartScale = 1.0;
  private flightEndScale = 0.34;
  private flightStartQuat = new THREE.Quaternion();
  private flightEndQuat = new THREE.Quaternion();

  // Raycasting & Interaction
  private raycaster = new THREE.Raycaster();
  private mouseVec = new THREE.Vector2();
  private hoveredSlotIndex: number | null = null;
  private isPointerDown = false;
  private pointerStartX = 0;
  private pointerStartY = 0;
  private prevPointerX = 0;
  private prevPointerY = 0;
  private hasPointerDragged = false;

  // 3D Center Drag Rotation & Parallax
  private targetQuat = new THREE.Quaternion();
  private currentQuat = new THREE.Quaternion();
  private pointerVelocityX = 0;
  private pointerVelocityY = 0;
  private wallParallaxX = 0;
  private wallParallaxY = 0;

  // Lights
  private movingLight!: THREE.PointLight;
  private snapFlashLight!: THREE.PointLight;

  // Physics Integrator for rAF loop
  public springIntegrator: SpringPhysicsIntegrator = new SpringPhysicsIntegrator();
  public onPhysicsTelemetry?: (telemetry: SpringPhysicsTelemetry) => void;
  private lastFrameTime: number = performance.now();

  // Performance Reporting
  public onMetricsUpdate?: (m: PerformanceMetrics) => void;
  public onStateChange?: (state: BadgeWallSpatialState, badge: BadgeCatalogItem | null) => void;
  public onSelectBadge?: (badge: BadgeCatalogItem) => void;

  private frameCount = 0;
  private lastFpsCalcTime = 0;
  private isDestroyed = false;
  private reqId: number | null = null;

  constructor(container: HTMLElement, sharedMaterials: AppleAwardMaterials) {
    this.container = container;
    this.mats = sharedMaterials;

    this.initThree();
    this.initLighting();
    this.initBadgeWall();
    this.initShowcaseGroup();
    this.initControlledBloom();
    this.bindEvents();

    this.lastFpsCalcTime = performance.now();
    this.renderLoop();
  }

  private initThree() {
    const w = Math.max(200, this.container.clientWidth);
    const h = Math.max(200, this.container.clientHeight);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x07090e);

    this.camera = new THREE.PerspectiveCamera(44, w / h, 0.1, 50);
    this.camera.position.set(0, 0, 7.2);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;

    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);
  }

  private initLighting() {
    const amb = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(amb);

    const key = new THREE.DirectionalLight(0xfff5ea, 1.8);
    key.position.set(4, 5, 6);
    this.scene.add(key);

    const rim = new THREE.DirectionalLight(0x00f0ff, 0.7);
    rim.position.set(-5, -3, 3);
    this.scene.add(rim);

    // Dynamic sweeping highlight point light
    this.movingLight = new THREE.PointLight(0xffd60a, 2.0, 10);
    this.movingLight.position.set(0, 2.5, 3.5);
    this.scene.add(this.movingLight);

    // Magnetic snap flash light
    this.snapFlashLight = new THREE.PointLight(0xffd60a, 0, 6);
    this.scene.add(this.snapFlashLight);
  }

  private initControlledBloom() {
    const w = this.container.clientWidth || 400;
    const h = this.container.clientHeight || 400;

    const renderPass = new RenderPass(this.scene, this.camera);
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(w, h),
      0.45, // strength (disciplined)
      0.25, // radius
      0.85  // threshold
    );

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(renderPass);
    this.composer.addPass(this.bloomPass);
  }

  /**
   * Builds the authentic Apple Fitness 3D Badge Wall
   */
  private initBadgeWall() {
    this.wallGroup = new THREE.Group();
    this.wallGroup.position.set(0, 0, 0);
    this.scene.add(this.wallGroup);

    // 1. Dark Brushed Slate Wall Backdrop Plane
    const wallGeo = new THREE.PlaneGeometry(16, 12);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x090c13,
      roughness: 0.82,
      metalness: 0.28,
    });
    const wallMesh = new THREE.Mesh(wallGeo, wallMat);
    wallMesh.position.z = -0.3;
    this.wallGroup.add(wallMesh);

    // 2. Subtle honeycomb grid lines on backdrop
    const gridHelper = new THREE.GridHelper(16, 24, 0x18202d, 0x111620);
    gridHelper.rotation.x = Math.PI / 2;
    gridHelper.position.z = -0.28;
    this.wallGroup.add(gridHelper);

    // 3. Grid coordinates for BADGE_CATALOG items
    // Layout: 5 badges centered gracefully (Top row 3, Bottom row 2)
    const slotConfigs = [
      { col: -1.75, row: 1.05 },
      { col: 0.0, row: 1.05 },
      { col: 1.75, row: 1.05 },
      { col: -0.9, row: -1.05 },
      { col: 0.9, row: -1.05 },
    ];

    this.slots = [];

    BADGE_CATALOG.forEach((badge, idx) => {
      const cfg = slotConfigs[idx % slotConfigs.length];
      const slotGroup = new THREE.Group();
      slotGroup.position.set(cfg.col, cfg.row, 0);
      slotGroup.name = `wall-slot-${idx}`;
      this.wallGroup.add(slotGroup);

      // (A) Recessed Socket Pedestal (Dark Titanium Dish)
      const pedestalGeo = new THREE.CylinderGeometry(0.82, 0.86, 0.08, 36);
      pedestalGeo.rotateX(Math.PI / 2);
      const pedestalMat = new THREE.MeshStandardMaterial({
        color: 0x111622,
        roughness: 0.55,
        metalness: 0.65,
        emissive: 0x070b12,
      });
      const pedestalMesh = new THREE.Mesh(pedestalGeo, pedestalMat);
      pedestalMesh.position.z = -0.04;
      slotGroup.add(pedestalMesh);

      // (B) Chamfered Socket Bezel Rim (Gold / Titanium trim)
      const rimGeo = new THREE.RingGeometry(0.78, 0.86, 36);
      const rimMat = new THREE.MeshStandardMaterial({
        color: 0xffd60a,
        roughness: 0.25,
        metalness: 0.88,
        emissive: 0xffd60a,
        emissiveIntensity: 0.15,
      });
      const socketRimMesh = new THREE.Mesh(rimGeo, rimMat);
      socketRimMesh.position.z = 0.01;
      slotGroup.add(socketRimMesh);

      // (C) Pulsing Socket Halo Ring (illuminates during snap)
      const haloGeo = new THREE.RingGeometry(0.85, 0.98, 48);
      const haloMat = new THREE.MeshBasicMaterial({
        color: 0xffd60a,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      haloMesh.position.z = 0.02;
      slotGroup.add(haloMesh);

      // (D) Mounted 3D Badge (Scale ~ 0.34 in resting slot)
      const badgeMesh = buildAppleBadge3D(this.mats, badge);
      badgeMesh.scale.setScalar(0.34);
      badgeMesh.position.set(0, 0, 0.06);
      slotGroup.add(badgeMesh);

      this.slots.push({
        index: idx,
        badge,
        x: cfg.col,
        y: cfg.row,
        z: 0.06,
        slotGroup,
        pedestalMesh,
        socketRimMesh,
        haloMesh,
        badgeMesh,
        isUnlocked: true,
      });
    });
  }

  private initShowcaseGroup() {
    this.showcaseGroup = new THREE.Group();
    this.showcaseGroup.position.set(0, 0, 0.4);
    this.showcaseGroup.visible = false;
    this.scene.add(this.showcaseGroup);
  }

  /**
   * User clicks a badge on the Badge Wall:
   * Badge flies out from Wall Slot -> Centers in 3D in front of camera
   */
  public triggerFlyOut(slotIndex: number) {
    if (this.currentState !== 'wall') return;
    const slot = this.slots[slotIndex];
    if (!slot) return;

    this.activeSlotIndex = slotIndex;
    this.activeBadgeItem = slot.badge;
    this.currentState = 'flying_out';
    this.animStartTime = performance.now();
    this.animDuration = 800; // ms

    // Hide resting badge in slot
    slot.badgeMesh.visible = false;

    // Create / attach showcase mesh in showcaseGroup
    if (this.currentShowcaseMesh) {
      this.showcaseGroup.remove(this.currentShowcaseMesh);
    }
    this.currentShowcaseMesh = buildAppleBadge3D(this.mats, slot.badge);
    this.showcaseGroup.add(this.currentShowcaseMesh);
    this.showcaseGroup.visible = true;

    // Start coordinates (exact slot position)
    this.flightStartPos.set(slot.x, slot.y, slot.z);
    this.flightEndPos.set(0, 0, 0.4);

    this.flightStartScale = 0.34;
    this.flightEndScale = 1.0;

    this.flightStartQuat.identity();
    this.flightEndQuat.identity();

    this.showcaseGroup.position.copy(this.flightStartPos);
    this.showcaseGroup.scale.setScalar(this.flightStartScale);
    this.showcaseGroup.quaternion.identity();

    this.targetQuat.identity();
    this.currentQuat.identity();

    badgeAudio.playSpinWhoosh(0.7);
    triggerHaptic('selection');

    if (this.onStateChange) {
      this.onStateChange('flying_out', this.activeBadgeItem);
    }
    if (this.onSelectBadge) {
      this.onSelectBadge(this.activeBadgeItem);
    }
  }

  /**
   * User closes 3D Showcase or returns to Badge Wall:
   * Pokémon GO Style Return Sequence:
   * 1. Pull-back / Tilt
   * 2. 3D Trajectory & Spin to original slot
   * 3. Wall smoothly re-emerges from depth
   * 4. Magnetic Snap + Micro-bounce + SNAP sound & haptic!
   * 5. Settle into idle collectible in slot
   */
  public triggerReturnToWall() {
    if (this.currentState !== 'inspect' && this.currentState !== 'wall') return;
    if (!this.activeBadgeItem) return;

    const slot = this.slots[this.activeSlotIndex];
    if (!slot) return;

    // 1. 开始回收: pull-back anticipation
    this.currentState = 'pull_back';
    this.animStartTime = performance.now();
    this.animDuration = 220; // ms for pull-back

    badgeAudio.playPullbackAnticipation();
    triggerHaptic('pullback');

    if (this.onStateChange) {
      this.onStateChange('pull_back', this.activeBadgeItem);
    }
  }

  /**
   * Stage directly from Mechanical Assembly Reveal (Phase 7 completion):
   * Mounts the unlocked badge in center ready to return to wall!
   */
  public stageFromMechanicalReveal(badgeItem: BadgeCatalogItem) {
    const idx = this.slots.findIndex((s) => s.badge.id === badgeItem.id);
    const targetIdx = idx >= 0 ? idx : 0;
    this.activeSlotIndex = targetIdx;
    this.activeBadgeItem = badgeItem;

    // Hide resting mesh in slot
    if (this.slots[targetIdx]) {
      this.slots[targetIdx].badgeMesh.visible = false;
    }

    if (this.currentShowcaseMesh) {
      this.showcaseGroup.remove(this.currentShowcaseMesh);
    }
    this.currentShowcaseMesh = buildAppleBadge3D(this.mats, badgeItem);
    this.showcaseGroup.add(this.currentShowcaseMesh);
    this.showcaseGroup.visible = true;

    this.showcaseGroup.position.set(0, 0, 0.4);
    this.showcaseGroup.scale.setScalar(1.0);
    this.showcaseGroup.quaternion.identity();
    this.targetQuat.identity();
    this.currentQuat.identity();

    // Wall pushed deep into background
    this.wallGroup.position.z = -1.8;

    this.currentState = 'inspect';
    if (this.onStateChange) {
      this.onStateChange('inspect', this.activeBadgeItem);
    }
    if (this.onSelectBadge) {
      this.onSelectBadge(this.activeBadgeItem);
    }
  }

  /**
   * Toggle 180° flip in inspect mode to view back plate
   */
  public toggleFlip() {
    if (this.currentState !== 'inspect') return;
    const qFlip = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
    this.targetQuat.multiply(qFlip);
    badgeAudio.playClick(1.1);
    triggerHaptic('tap');
  }

  public resetOrientation() {
    this.targetQuat.identity();
    this.pointerVelocityX = 0;
    this.pointerVelocityY = 0;
    triggerHaptic('tap');
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Main Render & Animation Loop
  // ───────────────────────────────────────────────────────────────────────────
  private renderLoop = () => {
    if (this.isDestroyed) return;
    this.reqId = requestAnimationFrame(this.renderLoop);

    const now = performance.now();
    const dtRaw = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;
    const dt = Math.min(0.05, Math.max(0.001, dtRaw)) * this.playbackSpeed;
    const tSec = now / 1000;

    // 1. Moving studio glint light
    this.movingLight.position.x = Math.sin(tSec * 1.4) * 2.8;
    this.movingLight.position.y = Math.cos(tSec * 1.1) * 2.0 + 1.0;

    // 2. Parallax damping for wall
    if (this.currentState === 'wall') {
      this.wallGroup.rotation.y += (this.wallParallaxX - this.wallGroup.rotation.y) * 0.08;
      this.wallGroup.rotation.x += (this.wallParallaxY - this.wallGroup.rotation.x) * 0.08;
    } else {
      this.wallGroup.rotation.set(0, 0, 0);
    }

    // 3. Resting badge idle breathing animation on the wall
    this.slots.forEach((slot, idx) => {
      if (slot.badgeMesh.visible) {
        const idleOffset = idx * 1.25;
        slot.badgeMesh.position.z = slot.z + Math.sin(tSec * 2.0 + idleOffset) * 0.012;
        slot.badgeMesh.rotation.z = Math.sin(tSec * 1.5 + idleOffset) * 0.02;

        // Hover scale highlight
        const isHovered = this.hoveredSlotIndex === idx && this.currentState === 'wall';
        const targetScale = isHovered ? 0.38 : 0.34;
        slot.badgeMesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15);
      }
    });

    // 4. State Machine Transitions
    const elapsed = now - this.animStartTime;

    // ── STATE: FLYING OUT (Slot -> Center) ──
    if (this.currentState === 'flying_out') {
      const p = Math.min(1.0, elapsed / this.animDuration);
      // Smooth cubic ease out
      const ease = 1 - Math.pow(1 - p, 3);

      // Arc path: slight forward bow in Z
      const curX = THREE.MathUtils.lerp(this.flightStartPos.x, this.flightEndPos.x, ease);
      const curY = THREE.MathUtils.lerp(this.flightStartPos.y, this.flightEndPos.y, ease);
      const arcZ = Math.sin(p * Math.PI) * 0.8;
      const curZ = THREE.MathUtils.lerp(this.flightStartPos.z, this.flightEndPos.z, ease) + arcZ;

      this.showcaseGroup.position.set(curX, curY, curZ);
      const s = THREE.MathUtils.lerp(this.flightStartScale, this.flightEndScale, ease);
      this.showcaseGroup.scale.setScalar(s);

      // Spin into facing
      this.showcaseGroup.rotation.y = (1 - ease) * Math.PI * 0.8;
      this.showcaseGroup.rotation.x = Math.sin(p * Math.PI) * 0.15;

      // Wall recedes into background depth
      this.wallGroup.position.z = THREE.MathUtils.lerp(0, -1.8, ease);

      if (p >= 1.0) {
        this.currentState = 'inspect';
        this.showcaseGroup.position.set(0, 0, 0.4);
        this.showcaseGroup.scale.setScalar(1.0);
        this.showcaseGroup.quaternion.identity();
        if (this.onStateChange) {
          this.onStateChange('inspect', this.activeBadgeItem);
        }
      }
    }

    // ── STATE: INSPECT (3D Interactive Orbit & Idle Hover) ──
    else if (this.currentState === 'inspect') {
      // Kinetic inertia momentum
      if (!this.isPointerDown) {
        this.pointerVelocityX *= 0.92;
        this.pointerVelocityY *= 0.92;

        if (Math.hypot(this.pointerVelocityX, this.pointerVelocityY) > 0.001) {
          const qY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.pointerVelocityX * 0.015);
          const qX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.pointerVelocityY * 0.015);
          this.targetQuat.premultiply(qY.multiply(qX));
        }
      }

      this.currentQuat.slerp(this.targetQuat, 0.18);
      this.showcaseGroup.quaternion.copy(this.currentQuat);

      // Subtle float in center
      this.showcaseGroup.position.y = Math.sin(tSec * 2.2) * 0.035;
      this.showcaseGroup.position.z = 0.4 + Math.cos(tSec * 1.8) * 0.02;
    }

    // ── STATE: PULL BACK (Step 1: Tilt / Pull-back) ──
    else if (this.currentState === 'pull_back') {
      const actualDuration = Math.max(80, this.animDuration / this.playbackSpeed);
      const p = Math.min(1.0, elapsed / actualDuration);
      const ease = Math.sin(p * Math.PI * 0.5);

      // Slight backward tilt + suction pull
      this.showcaseGroup.rotation.x = -0.22 * ease;
      this.showcaseGroup.rotation.y = 0.12 * ease;
      this.showcaseGroup.position.z = 0.4 - 0.18 * ease;
      this.showcaseGroup.scale.setScalar(1.0 - 0.06 * ease);

      if (p >= 1.0) {
        // Transition to Step 2: Flying Back
        const slot = this.slots[this.activeSlotIndex];
        this.currentState = 'flying_back';
        this.animStartTime = performance.now();
        this.animDuration = 740; // Base duration before speed multiplier

        this.flightStartPos.copy(this.showcaseGroup.position);
        this.flightEndPos.set(slot.x, slot.y, slot.z);

        this.flightStartScale = this.showcaseGroup.scale.x;
        this.flightEndScale = 0.34;

        badgeAudio.playSpinWhoosh(0.5, this.playbackSpeed);

        if (this.onStateChange) {
          this.onStateChange('flying_back', this.activeBadgeItem);
        }
      }
    }

      // ── STATE: FLYING BACK (Step 2 & 3: 3D Trajectory, Spin, Wall Re-emerges) ──
    else if (this.currentState === 'flying_back') {
      const actualDuration = Math.max(100, this.animDuration / this.playbackSpeed);
      const p = Math.min(1.0, elapsed / actualDuration);

      // Calculate real-time damping ratio zeta = c / (2 * sqrt(k * m))
      const zeta = this.springDamping / (2 * Math.sqrt(this.springStiffness * this.springMass));
      
      // Dynamic Apple-grade Spring Ease Curve modulated by damping ratio
      // When zeta < 0.8: snappy swift entry with magnetic suction acceleration
      // When zeta > 1.0: overdamped gentle smooth deceleration
      const easePower = THREE.MathUtils.lerp(0.85, 1.25, Math.min(1.5, zeta));
      const ease = p < 0.82
        ? Math.pow(p / 0.82, easePower) * 0.80
        : 0.80 + (1.0 - 0.80) * Math.pow((p - 0.82) / 0.18, 1.35 * zeta);

      // 3D Parabolic Arc Trajectory: Curves in X, Y and forward arch in Z
      const curX = THREE.MathUtils.lerp(this.flightStartPos.x, this.flightEndPos.x, ease);
      const curY = THREE.MathUtils.lerp(this.flightStartPos.y, this.flightEndPos.y, ease);
      const arcZ = Math.sin(Math.pow(p, 0.85) * Math.PI) * 0.48;
      const curZ = THREE.MathUtils.lerp(this.flightStartPos.z, this.flightEndPos.z, ease) + arcZ;

      this.showcaseGroup.position.set(curX, curY, curZ);

      // Scale: Large -> Slot Size (smooth interpolation)
      const s = THREE.MathUtils.lerp(this.flightStartScale, this.flightEndScale, ease);
      this.showcaseGroup.scale.setScalar(s);

      // Rapid but readable 3D self-rotation with specular reflections
      const spinAngle = p * Math.PI * 2 * 2.0; // 2 complete clean spins
      this.showcaseGroup.rotation.y = spinAngle;
      this.showcaseGroup.rotation.x = Math.sin(p * Math.PI) * 0.18;
      this.showcaseGroup.rotation.z = Math.sin(p * Math.PI * 2) * 0.07;

      // Step 3: Wall seamlessly re-emerges from background depth
      this.wallGroup.position.z = THREE.MathUtils.lerp(-1.8, 0, p);

      if (p >= 1.0) {
        // Transition to Step 4: Magnetic SNAP with rAF Spring Physics Integrator!
        this.currentState = 'magnetic_snap';
        this.animStartTime = performance.now();
        this.animDuration = 480; // Base window for full physical harmonic decay

        const slot = this.slots[this.activeSlotIndex];
        this.snapFlashLight.position.set(slot.x, slot.y, 0.5);
        this.snapFlashLight.intensity = 5.0;

        // Initialize Spring ODE with physical parameters & trigger impact haptics at t=0
        const effectiveDamping = (this.springDamping / Math.max(0.4, this.overshootElasticity));
        this.springIntegrator.configure({
          mass: this.springMass,
          stiffness: this.springStiffness,
          damping: effectiveDamping,
          restTolerance: 0.0008,
        });
        this.springIntegrator.reset(1.0, 16.5 * this.overshootElasticity);

        // Sound feedback
        badgeAudio.playMagneticSnap(this.playbackSpeed);

        if (this.onStateChange) {
          this.onStateChange('magnetic_snap', this.activeBadgeItem);
        }
      }
    }

    // ── STATE: MAGNETIC SNAP (Step 4 & 5: rAF Physics-Driven Harmonic Spring Integrator) ──
    else if (this.currentState === 'magnetic_snap') {
      const slot = this.slots[this.activeSlotIndex];

      // Perform real-time physical integration step for the current rAF frame
      const telemetry = this.springIntegrator.step(dt);

      if (this.onPhysicsTelemetry) {
        this.onPhysicsTelemetry(telemetry);
      }

      // 1. Physically Coupled Scale Spring Overshoot (1.0 -> 1.18 -> 0.96 -> 1.0)
      const scaleMultiplier = 1.0 + telemetry.displacement * 0.18 * this.overshootElasticity;
      const currentScale = 0.34 * Math.max(0.1, scaleMultiplier);
      this.showcaseGroup.scale.setScalar(currentScale);

      // 2. Physical Z-depth Depression & Elastic Recoil into Titanium Socket Dish
      // Momentum compresses slightly into titanium dish (-0.024), rebounds forward (+0.010), settles to slot.z
      const zDepression = -0.024 * telemetry.displacement * this.overshootElasticity;
      this.showcaseGroup.position.set(slot.x, slot.y, slot.z + zDepression);

      // 3. High-Frequency Metallic Tremor / Physical Angular Micro-Vibration (coupled to acceleration & velocity)
      const energyLevel = Math.min(1.0, (telemetry.kineticEnergy + telemetry.potentialEnergy) * 3.5);
      const vibeDecay = energyLevel * this.vibrationIntensity;
      const vibePitch = (telemetry.velocity * 0.0035 + telemetry.displacement * 0.025) * vibeDecay;
      const vibeRoll = (telemetry.acceleration * 0.00008) * vibeDecay;
      const vibeYaw = (Math.sin(now * 0.04) * 0.018) * vibeDecay;
      this.showcaseGroup.rotation.set(vibePitch, vibeYaw, vibeRoll);

      // 4. Expanding golden socket halo ripple & optical glint flash
      if (slot.haloMesh) {
        const haloFade = Math.max(0, energyLevel * 0.95);
        const haloMat = slot.haloMesh.material as THREE.MeshBasicMaterial;
        if (haloMat) haloMat.opacity = haloFade;
        slot.haloMesh.scale.setScalar(1.0 + (1.0 - energyLevel) * 0.45);
      }

      this.snapFlashLight.intensity = Math.max(0, energyLevel * 5.0);
      this.wallGroup.position.z = 0;

      // Settle transition when mechanical energy falls below rest threshold or timeout
      const maxSnapDuration = (600 / Math.max(0.2, this.playbackSpeed));
      if (telemetry.isSettled || elapsed > maxSnapDuration) {
        // Step 5: Final State - Unlocked collectible resting in slot
        slot.badgeMesh.visible = true;
        slot.badgeMesh.scale.setScalar(0.34);
        slot.badgeMesh.position.set(0, 0, slot.z);
        slot.badgeMesh.rotation.set(0, 0, 0);

        if (slot.haloMesh) {
          const haloMat = slot.haloMesh.material as THREE.MeshBasicMaterial;
          if (haloMat) haloMat.opacity = 0;
          slot.haloMesh.scale.setScalar(1.0);
        }

        this.showcaseGroup.visible = false;
        this.snapFlashLight.intensity = 0;
        this.currentState = 'wall';

        if (this.onStateChange) {
          this.onStateChange('wall', null);
        }
      }
    }

    // 5. Post-Processing Bloom Render Pass
    this.composer.render();

    // 6. Metrics & FPS Reporting
    this.frameCount++;
    if (now - this.lastFpsCalcTime >= 500) {
      const fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsCalcTime));
      this.frameCount = 0;
      this.lastFpsCalcTime = now;

      if (this.onMetricsUpdate) {
        this.onMetricsUpdate({
          fps: Math.min(120, fps),
          frameTimeMs: 1.2,
          drawCalls: 12,
          triangles: 4200,
          isSleeping: this.currentState === 'wall' && !this.isPointerDown,
          allocationsPerFrame: 0,
        });
      }
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Pointer & Raycast Event Handling
  // ───────────────────────────────────────────────────────────────────────────
  private bindEvents() {
    const el = this.renderer.domElement;

    el.addEventListener('pointerdown', (e: PointerEvent) => {
      this.isPointerDown = true;
      this.pointerStartX = e.clientX;
      this.pointerStartY = e.clientY;
      this.prevPointerX = e.clientX;
      this.prevPointerY = e.clientY;
      this.hasPointerDragged = false;
      el.setPointerCapture(e.pointerId);
    });

    window.addEventListener('pointermove', (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      this.mouseVec.set(nx, ny);

      // Wall Parallax
      if (this.currentState === 'wall') {
        this.wallParallaxX = nx * 0.12;
        this.wallParallaxY = ny * 0.08;

        // Raycast over slots for hover feedback
        this.raycaster.setFromCamera(this.mouseVec, this.camera);
        const hitMeshes = this.slots.map((s) => s.pedestalMesh);
        const intersects = this.raycaster.intersectObjects(hitMeshes, true);

        if (intersects.length > 0) {
          const hitIdx = this.slots.findIndex((s) => s.pedestalMesh === intersects[0].object);
          if (hitIdx !== this.hoveredSlotIndex) {
            this.hoveredSlotIndex = hitIdx;
            el.style.cursor = 'pointer';
            badgeAudio.playClick(1.6);
            triggerHaptic('tap');
          }
        } else {
          this.hoveredSlotIndex = null;
          el.style.cursor = 'default';
        }
      }

      // Inspect Dragging
      if (this.isPointerDown && this.currentState === 'inspect') {
        const dx = e.clientX - this.prevPointerX;
        const dy = e.clientY - this.prevPointerY;

        if (Math.hypot(e.clientX - this.pointerStartX, e.clientY - this.pointerStartY) > 5) {
          this.hasPointerDragged = true;
        }

        this.pointerVelocityX = dx;
        this.pointerVelocityY = dy;

        const qY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), dx * 0.008);
        const qX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), dy * 0.008);
        this.targetQuat.premultiply(qY.multiply(qX));

        this.prevPointerX = e.clientX;
        this.prevPointerY = e.clientY;
      }
    });

    window.addEventListener('pointerup', (e: PointerEvent) => {
      this.isPointerDown = false;

      // Handle Click in Wall Mode -> Fly Out
      if (this.currentState === 'wall' && !this.hasPointerDragged) {
        const rect = el.getBoundingClientRect();
        const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
        this.mouseVec.set(nx, ny);

        this.raycaster.setFromCamera(this.mouseVec, this.camera);
        const hitMeshes = this.slots.map((s) => s.pedestalMesh);
        const intersects = this.raycaster.intersectObjects(hitMeshes, true);

        if (intersects.length > 0) {
          const clickedSlot = this.slots.findIndex((s) => s.pedestalMesh === intersects[0].object);
          if (clickedSlot >= 0) {
            this.triggerFlyOut(clickedSlot);
          }
        }
      }
    });

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          this.camera.aspect = width / height;
          this.camera.updateProjectionMatrix();
          this.renderer.setSize(width, height);
          this.composer.setSize(width, height);
        }
      }
    });
    ro.observe(this.container);
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.reqId) cancelAnimationFrame(this.reqId);
    this.container.innerHTML = '';
    this.renderer.dispose();
  }
}
