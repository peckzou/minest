/**
 * Unified Award Ceremony Flow Scene (Three.js GPU 120 FPS)
 * 
 * Unifies all 3 award ceremony phases into ONE seamless, continuous, zero-glitch 3D experience:
 * 
 * 1. [Phase 1: Pending (待领取金胚)]
 *    - 24K mirror gold hex blank levitating in center with multi-spectral star glints & ambient aura.
 *    - Click triggers physical spring recoil depression + sound + begins Phase 2.
 * 
 * 2. [Phase 2: Breakout & Mechanical Assembly (6 臂机械装配破茧揭秘)]
 *    - 6 precision titanium clamp brackets converge in arc trajectory -> Lock energy pulses ->
 *    - Rapid spin acceleration -> Shockwave burst with golden dust explosion -> Unlocks real cloisonné badge!
 * 
 * 3. [Phase 3: 3D Inspection & Engraving (中央 3D 赏玩与 180° 翻面)]
 *    - Badge floats in center with interactive 6DoF inertia orbit & 180° flip to view back engravings.
 * 
 * 4. [Phase 4: Wall Parabolic Return & Magnetic Spring Overshoot Snap (磁吸弹簧归位)]
 *    - Badge Wall seamlessly re-emerges from background depth.
 *    - Badge spins along 3D parabolic trajectory -> Enters target slot ->
 *    - Trigger Second-Order ODE Spring Physics Integrator with authentic Apple UI damping,
 *      elastic overshoot, micro-vibration, and synchronized haptic pulses!
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { AppleAwardMaterials } from './AppleAwardMaterials';
import {
  BADGE_CATALOG,
  BadgeCatalogItem,
  buildAppleBadge3D,
  buildAppleHexMechanicalPendingBadge,
  buildOuterMechanicalAssembly,
  OuterMechanicalAssemblyGroup,
  buildActivityRings3In1Group,
  ActivityRings3In1Group,
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

export type UnifiedCeremonyStage =
  | 'pending'        // 阶段 1：待领取 24K 金胚悬浮与星芒闪耀
  | 'brackets_lock'  // 阶段 2a：6 机械臂弧线合拢扣锁
  | 'laser_charge'   // 阶段 2b：能量激光脉冲充能
  | 'breakout_burst' // 阶段 2c：极速自转破茧爆燃与真实勋章揭秘
  | 'inspect'        // 阶段 3：中央 3D 自由赏玩与 180° 翻面
  | 'flying_back'    // 阶段 4a：3D 抛物线自转飞回原位槽位
  | 'magnetic_snap'  // 阶段 4b：Spring 物理弹簧阻尼磁吸入槽震颤
  | 'collected';     // 阶段 4c：已完好陈列在勋章墙槽位中

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

export class UnifiedAwardCeremonyFlowScene {
  private container: HTMLElement;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private composer!: EffectComposer;
  private bloomPass!: UnrealBloomPass;
  private sharedMaterials: AppleAwardMaterials;

  // Scene Hierarchies
  private wallGroup!: THREE.Group;
  private slots: WallSlotData[] = [];
  public badgeGroup!: THREE.Group;

  // Stage 1 & 2 Elements
  private mysteryHex!: THREE.Group;
  private assemblyGroup!: OuterMechanicalAssemblyGroup;
  private activityRings3In1Group!: ActivityRings3In1Group;
  private realBadgeMesh: THREE.Group | null = null;
  private centerPulseLight!: THREE.PointLight;
  private goldGlintLight!: THREE.PointLight;
  private shockwaveRing!: THREE.Mesh;
  private particleCloud!: THREE.Points;
  private starGlintsGroup!: THREE.Group;
  private starGlints: Array<{ mesh: THREE.Mesh; phase: number; speed: number; baseScale: number }> = [];
  private softAuraMesh!: THREE.Mesh;
  private snapFlashLight!: THREE.PointLight;

  // Dynamic Spark Particle System
  private sparkCount = 800;
  private sparkPositions = new Float32Array(800 * 3);
  private sparkVelocities = new Float32Array(800 * 3);
  private sparkColors = new Float32Array(800 * 3);
  private sparkSizes = new Float32Array(800);
  private sparkAges = new Float32Array(800);
  private sparkLifes = new Float32Array(800);
  private sparkPointsMesh!: THREE.Points;

  // Current State & Target Badge
  public currentStage: UnifiedCeremonyStage = 'pending';
  public activeBadgeItem: BadgeCatalogItem = BADGE_CATALOG[0];
  public activeSlotIndex = 0;
  public playbackSpeed = 1.0;
  public soundEnabled = true;

  // Spring Physics Tuning
  public springDamping = 28;
  public springStiffness = 380;
  public springMass = 0.85;
  public overshootElasticity = 1.0;
  public vibrationIntensity = 1.0;
  public springIntegrator = new SpringPhysicsIntegrator();

  // Timeline / Transitions State
  private stageStartTime = 0;
  private stageDuration = 1000;
  private burstStartYaw = 0;
  private burstStartPitch = 0;
  private burstStartRoll = 0;
  private isFlipped = false;
  private flipProgress = 0;
  private ringSparksTriggered = { move: false, exercise: false, stand: false, lock: false };
  private isFlipAnimating = false;
  private flipStartTime = 0;

  // Flight Path Interpolation Vectors
  private flightStartPos = new THREE.Vector3();
  private flightEndPos = new THREE.Vector3();
  private flightStartScale = 1.0;
  private flightEndScale = 0.34;

  private getCeremonyCameraZ() {
    const horizontalHalfAngle = Math.tan(THREE.MathUtils.degToRad(this.camera.fov * 0.5)) * this.camera.aspect;
    return Math.max(5.2, 2.15 / Math.max(0.05, horizontalHalfAngle));
  }

  private getWallCameraZ() {
    const horizontalHalfAngle = Math.tan(THREE.MathUtils.degToRad(this.camera.fov * 0.5)) * this.camera.aspect;
    return Math.max(5.2, 2.9 / Math.max(0.05, horizontalHalfAngle));
  }

  // Drag & Parallax Interaction
  private isPointerDown = false;
  private prevPointerX = 0;
  private prevPointerY = 0;
  private pointerVelocityX = 0;
  private pointerVelocityY = 0;
  private pointerParallaxX = 0;
  private pointerParallaxY = 0;
  private targetQuat = new THREE.Quaternion();
  private currentQuat = new THREE.Quaternion();
  private recoilZ = 0;
  private recoilVelZ = 0;

  // Loop & Performance
  private isLoopRunning = true;
  private lastRafTime = performance.now();
  private badgeTime = 0;
  private frameCount = 0;
  private lastFpsTime = performance.now();
  private currentFps = 120;
  public onMetricsUpdate?: (m: PerformanceMetrics) => void;
  public onStageChange?: (stage: UnifiedCeremonyStage, badge: BadgeCatalogItem) => void;
  public onPhysicsTelemetry?: (telemetry: SpringPhysicsTelemetry) => void;

  constructor(container: HTMLElement, mats: AppleAwardMaterials) {
    this.container = container;
    this.sharedMaterials = mats;

    this.initScene();
    this.initBadgeWall();
    this.initStarGlints();
    this.initParticleSystems();
    this.loadAwardBadge(this.activeBadgeItem, 0);
    this.bindEvents();
    this.startLoop();
  }

  private initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x07090d);

    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 600;

    this.camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    this.camera.position.set(0, 0, 5.2);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.65;
    this.container.appendChild(this.renderer.domElement);

    // Post-Processing
    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.12, // Keep metal detail legible instead of washing out the reveal
      0.45, // Radius
      0.82  // High threshold
    );
    this.composer.addPass(this.bloomPass);

    // Key studio lighting
    const keyLight = new THREE.DirectionalLight(0xfffaed, 1.25);
    keyLight.position.set(3.5, 4.2, 4.0);
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x7dd3fc, 0.8);
    rimLight.position.set(-3.5, -3.0, 3.0);
    this.scene.add(rimLight);

    const backRim = new THREE.DirectionalLight(0xffdf78, 0.95);
    backRim.position.set(0, 3.5, -4.0);
    this.scene.add(backRim);

    this.centerPulseLight = new THREE.PointLight(0x00f0ff, 0, 8);
    this.centerPulseLight.position.set(0, 0, 1.2);
    this.scene.add(this.centerPulseLight);

    this.goldGlintLight = new THREE.PointLight(0xfff5c0, 0.8, 6);
    this.goldGlintLight.position.set(1.5, 2.4, 2.8);
    this.scene.add(this.goldGlintLight);

    this.snapFlashLight = new THREE.PointLight(0xffe066, 0, 6);
    this.snapFlashLight.position.set(0, 0, 1.0);
    this.scene.add(this.snapFlashLight);

    // Soft Golden Ambient Aura
    const auraGeo = new THREE.PlaneGeometry(5.2, 5.2);
    const auraCanvas = document.createElement('canvas');
    auraCanvas.width = 256;
    auraCanvas.height = 256;
    const ctx = auraCanvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
      grad.addColorStop(0, 'rgba(255, 214, 10, 0.18)');
      grad.addColorStop(0.4, 'rgba(255, 180, 0, 0.07)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
    }
    const auraTex = new THREE.CanvasTexture(auraCanvas);
    const auraMat = new THREE.MeshBasicMaterial({
      map: auraTex,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.softAuraMesh = new THREE.Mesh(auraGeo, auraMat);
    this.softAuraMesh.position.set(0, 0, -0.6);
    this.scene.add(this.softAuraMesh);

    // Badge Anchor Group
    this.badgeGroup = new THREE.Group();
    this.scene.add(this.badgeGroup);
  }

  // Initializes the Badge Wall Grid Background with 5 Docking Sockets
  private initBadgeWall() {
    this.wallGroup = new THREE.Group();
    this.scene.add(this.wallGroup);

    const slotCoords = [
      { x: -2.3, y: 1.1, z: 0 },
      { x: 0.0, y: 1.1, z: 0 },
      { x: 2.3, y: 1.1, z: 0 },
      { x: -1.15, y: -1.1, z: 0 },
      { x: 1.15, y: -1.1, z: 0 },
    ];

    const pedestalGeo = new THREE.CylinderGeometry(0.72, 0.78, 0.14, 32);
    const socketRimGeo = new THREE.TorusGeometry(0.74, 0.04, 16, 32);
    const haloGeo = new THREE.RingGeometry(0.76, 1.08, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xffd60a,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });

    slotCoords.forEach((coord, idx) => {
      const badgeData = BADGE_CATALOG[idx % BADGE_CATALOG.length];
      const slotGrp = new THREE.Group();
      slotGrp.position.set(coord.x, coord.y, coord.z);

      const pedestalMesh = new THREE.Mesh(pedestalGeo, this.sharedMaterials.backEngravedMetal);
      pedestalMesh.rotation.x = Math.PI / 2;
      slotGrp.add(pedestalMesh);

      const socketRimMesh = new THREE.Mesh(socketRimGeo, this.sharedMaterials.goldAccent);
      socketRimMesh.position.z = 0.08;
      slotGrp.add(socketRimMesh);

      const haloMesh = new THREE.Mesh(haloGeo, haloMat.clone());
      haloMesh.position.z = 0.09;
      slotGrp.add(haloMesh);

      // Badge in slot (scaled to 0.34)
      const bMesh = buildAppleBadge3D(this.sharedMaterials, badgeData);
      bMesh.scale.setScalar(0.34);
      bMesh.position.z = 0.12;
      slotGrp.add(bMesh);

      this.slots.push({
        index: idx,
        badge: badgeData,
        x: coord.x,
        y: coord.y,
        z: coord.z,
        slotGroup: slotGrp,
        pedestalMesh,
        socketRimMesh,
        haloMesh,
        badgeMesh: bMesh,
        isUnlocked: false,
      });

      this.wallGroup.add(slotGrp);
    });

    // Initial state: wall is in background depth
    this.wallGroup.position.z = -1.8;
  }

  private initStarGlints() {
    this.starGlintsGroup = new THREE.Group();
    this.starGlints = [];

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

    const hexRadius = 1.48;
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
      mesh.position.set(x, y, 0.14);
      this.starGlintsGroup.add(mesh);

      this.starGlints.push({
        mesh,
        phase: i * 1.1,
        speed: 2.8,
        baseScale: 1.0,
      });
    }

    this.badgeGroup.add(this.starGlintsGroup);
  }

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

    // 2. Instanced Golden Dust Particles (180 particles)
    const particleCount = 180;
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

    // 3. Dynamic Spark Burst Particle System
    this.initSparkParticles();
  }

  private sparkTexture = (() => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');     // White hot crisp core
      grad.addColorStop(0.3, 'rgba(255, 235, 160, 0.95)');  // Golden core ring
      grad.addColorStop(0.7, 'rgba(255, 140, 20, 0.5)');   // Firework ember halo
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(16, 16, 16, 0, Math.PI * 2);
      ctx.fill();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  })();

  private initSparkParticles() {
    for (let i = 0; i < this.sparkCount; i++) {
      this.sparkPositions[i * 3] = 0;
      this.sparkPositions[i * 3 + 1] = 0;
      this.sparkPositions[i * 3 + 2] = -9999;
      this.sparkAges[i] = 1.0;
      this.sparkLifes[i] = 1.0;
      this.sparkSizes[i] = 0;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.sparkPositions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.sparkColors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(this.sparkSizes, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        pointTexture: { value: this.sparkTexture },
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (220.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D pointTexture;
        varying vec3 vColor;
        void main() {
          vec4 tex = texture2D(pointTexture, gl_PointCoord);
          if (tex.a < 0.05) discard;
          gl_FragColor = vec4(vColor * tex.rgb, tex.a);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.sparkPointsMesh = new THREE.Points(geo, mat);
    this.badgeGroup.add(this.sparkPointsMesh);
  }

  public emitSparkBurst(options: {
    count?: number;
    originRadius?: number;
    colorHex?: number;
    speed?: number;
  }) {
    const count = options.count || 220;
    const radius = options.originRadius !== undefined ? options.originRadius : 1.2;
    const color = new THREE.Color(options.colorHex !== undefined ? options.colorHex : 0xffd60a);
    const baseSpeed = options.speed || 7.5;

    let spawned = 0;
    for (let i = 0; i < this.sparkCount; i++) {
      if (this.sparkAges[i] >= this.sparkLifes[i]) {
        const angle = Math.random() * Math.PI * 2;
        const r = radius + (Math.random() - 0.5) * 0.25;
        this.sparkPositions[i * 3] = Math.cos(angle) * r;
        this.sparkPositions[i * 3 + 1] = Math.sin(angle) * r;
        this.sparkPositions[i * 3 + 2] = (Math.random() - 0.5) * 0.35;

        const spd = baseSpeed * (0.7 + Math.random() * 0.9);
        this.sparkVelocities[i * 3] = Math.cos(angle) * spd + (Math.random() - 0.5) * 1.2;
        this.sparkVelocities[i * 3 + 1] = Math.sin(angle) * spd + (Math.random() - 0.5) * 1.2;
        this.sparkVelocities[i * 3 + 2] = (Math.random() - 0.15) * spd * 0.85;

        this.sparkColors[i * 3] = color.r * 2.5;
        this.sparkColors[i * 3 + 1] = color.g * 2.5;
        this.sparkColors[i * 3 + 2] = color.b * 2.5;

        this.sparkSizes[i] = 0.18 + Math.random() * 0.28;
        this.sparkAges[i] = 0;
        this.sparkLifes[i] = 0.45 + Math.random() * 0.75;

        spawned++;
        if (spawned >= count) break;
      }
    }
  }

  private updateSparkParticles(dt: number) {
    if (!this.sparkPointsMesh) return;
    const posAttr = this.sparkPointsMesh.geometry.getAttribute('position') as THREE.BufferAttribute;
    const colAttr = this.sparkPointsMesh.geometry.getAttribute('color') as THREE.BufferAttribute;
    const sizeAttr = this.sparkPointsMesh.geometry.getAttribute('size') as THREE.BufferAttribute;

    for (let i = 0; i < this.sparkCount; i++) {
      if (this.sparkAges[i] < this.sparkLifes[i]) {
        this.sparkAges[i] += dt;
        const lifeRatio = this.sparkAges[i] / this.sparkLifes[i];

        if (lifeRatio >= 1.0) {
          posAttr.setXYZ(i, 0, 0, -9999);
          sizeAttr.setX(i, 0);
        } else {
          // Air drag & gravity physics for firework embers
          const drag = Math.pow(0.92, dt * 60);
          this.sparkVelocities[i * 3] *= drag;
          this.sparkVelocities[i * 3 + 1] *= drag;
          this.sparkVelocities[i * 3 + 2] *= drag;

          // Downward gravity
          this.sparkVelocities[i * 3 + 1] -= 6.8 * dt;

          this.sparkPositions[i * 3] += this.sparkVelocities[i * 3] * dt;
          this.sparkPositions[i * 3 + 1] += this.sparkVelocities[i * 3 + 1] * dt;
          this.sparkPositions[i * 3 + 2] += this.sparkVelocities[i * 3 + 2] * dt;

          posAttr.setXYZ(i, this.sparkPositions[i * 3], this.sparkPositions[i * 3 + 1], this.sparkPositions[i * 3 + 2]);

          // Micro-flickering ember size
          const flicker = 0.82 + 0.36 * Math.sin(this.sparkAges[i] * 38.0);
          sizeAttr.setX(i, (1.0 - lifeRatio) * this.sparkSizes[i] * flicker);
        }
      }
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
  }

  public loadAwardBadge(badge: BadgeCatalogItem, slotIndex = 0) {
    this.activeBadgeItem = badge;
    this.activeSlotIndex = slotIndex;

    // Remove old meshes from badgeGroup (except particles and star glints)
    if (this.mysteryHex) this.badgeGroup.remove(this.mysteryHex);
    if (this.assemblyGroup) this.badgeGroup.remove(this.assemblyGroup);
    if (this.activityRings3In1Group) this.badgeGroup.remove(this.activityRings3In1Group);
    if (this.realBadgeMesh) this.badgeGroup.remove(this.realBadgeMesh);

    // 1. Build Mystery Hex Blank
    this.mysteryHex = buildAppleHexMechanicalPendingBadge(this.sharedMaterials);
    this.badgeGroup.add(this.mysteryHex);

    // 2. Build 6 Mechanical Clamp Brackets
    this.assemblyGroup = buildOuterMechanicalAssembly(this.sharedMaterials, { initialProgress: 0.0 });
    this.assemblyGroup.visible = false;
    this.badgeGroup.add(this.assemblyGroup);

    // 2.5 Build 3-in-1 Apple Activity Rings Group
    this.activityRings3In1Group = buildActivityRings3In1Group(this.sharedMaterials);
    this.activityRings3In1Group.visible = false;
    this.badgeGroup.add(this.activityRings3In1Group);

    // 3. Build Real Unlocked Cloisonné Award Badge
    this.realBadgeMesh = buildAppleBadge3D(this.sharedMaterials, badge);
    this.realBadgeMesh.visible = false;
    this.realBadgeMesh.scale.setScalar(0.001);
    this.badgeGroup.add(this.realBadgeMesh);

    // Exactly one wall slot is reserved for the active, continuously moving badge.
    this.slots.forEach((slot, index) => { slot.badgeMesh.visible = index !== slotIndex; });

    this.resetToPending();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // State Machine Step Transitions
  // ─────────────────────────────────────────────────────────────────────────

  public resetToPending() {
    this.currentStage = 'pending';
    this.camera.position.z = this.getCeremonyCameraZ();
    this.badgeGroup.visible = true;
    this.badgeGroup.position.set(0, 0, 0);
    this.badgeGroup.scale.setScalar(1.0);
    this.badgeGroup.quaternion.identity();
    this.targetQuat.identity();
    this.currentQuat.identity();

    this.isFlipped = false;
    this.flipProgress = 0;
    this.isFlipAnimating = false;

    if (this.mysteryHex) this.mysteryHex.visible = true;
    if (this.assemblyGroup) this.assemblyGroup.visible = false;
    if (this.activityRings3In1Group) {
      this.activityRings3In1Group.visible = false;
      this.activityRings3In1Group.scale.setScalar(1);
    }
    if (this.realBadgeMesh) {
      this.realBadgeMesh.visible = false;
      this.realBadgeMesh.scale.setScalar(0.001);
    }
    if (this.starGlintsGroup) this.starGlintsGroup.visible = true;
    if (this.shockwaveRing) this.shockwaveRing.visible = false;
    if (this.particleCloud) this.particleCloud.visible = false;

    this.wallGroup.position.z = -1.8;
    this.slots.forEach((s, idx) => {
      s.badgeMesh.visible = idx !== this.activeSlotIndex;
      if (s.haloMesh) (s.haloMesh.material as THREE.MeshBasicMaterial).opacity = 0;
    });

    if (this.onStageChange) {
      this.onStageChange('pending', this.activeBadgeItem);
    }
  }

  // Advance to Next Step in Ceremony
  public advanceNextStep() {
    if (this.currentStage === 'pending') {
      this.startFullCeremony();
    } else if (this.currentStage === 'inspect') {
      this.triggerReturnToWall();
    } else if (this.currentStage === 'collected') {
      this.resetToPending();
    }
  }

  // Trigger Beginning of Ceremony from Pending
  public startFullCeremony() {
    if (this.currentStage === 'pending') {
      // Tactile spring recoil impulse
      this.recoilVelZ = -0.16;
      if (this.soundEnabled) {
        badgeAudio.playClick(0.9);
      }
      triggerHaptic('impact');

      // Transition to Stage 2: Breakout & Mechanical Assembly
      this.transitionToBracketsLock();
    }
  }

  private transitionToBracketsLock() {
    this.currentStage = 'brackets_lock';
    this.stageStartTime = performance.now();
    this.stageDuration = 1100 / this.playbackSpeed;
    this.ringSparksTriggered = { move: false, exercise: false, stand: false, lock: false };

    if (this.assemblyGroup) {
      this.assemblyGroup.visible = true;
      this.assemblyGroup.setAssemblyProgress(0);
    }
    if (this.activityRings3In1Group) {
      this.activityRings3In1Group.visible = true;
      this.activityRings3In1Group.scale.setScalar(1);
    }
    if (this.starGlintsGroup) {
      this.starGlintsGroup.visible = false;
    }

    this.emitSparkBurst({ count: 180, originRadius: 1.42, colorHex: 0xff2d55, speed: 5.5 });

    if (this.soundEnabled) {
      badgeAudio.playBracketSnap(0);
    }

    if (this.onStageChange) {
      this.onStageChange('brackets_lock', this.activeBadgeItem);
    }
  }

  private transitionToLaserCharge() {
    this.currentStage = 'laser_charge';
    this.stageStartTime = performance.now();
    this.stageDuration = 680 / this.playbackSpeed;

    if (this.soundEnabled) {
      badgeAudio.playEnergyPulse(this.playbackSpeed);
    }

    if (this.onStageChange) {
      this.onStageChange('laser_charge', this.activeBadgeItem);
    }
  }

  private transitionToBreakoutBurst() {
    this.currentStage = 'breakout_burst';
    this.stageStartTime = performance.now();
    this.stageDuration = 1200 / this.playbackSpeed;
    this.burstStartYaw = this.badgeGroup.rotation.y;
    this.burstStartPitch = this.badgeGroup.rotation.x;
    this.burstStartRoll = this.badgeGroup.rotation.z;

    if (this.shockwaveRing) this.shockwaveRing.visible = true;
    if (this.particleCloud) this.particleCloud.visible = true;

    // 360° Multi-colored Grand Fireworks Celebration
    this.emitSparkBurst({ count: 280, originRadius: 1.45, colorHex: 0xff2d55, speed: 8.8 });
    this.emitSparkBurst({ count: 280, originRadius: 1.15, colorHex: 0xa1e70a, speed: 8.8 });
    this.emitSparkBurst({ count: 280, originRadius: 0.85, colorHex: 0x00e5ff, speed: 8.8 });
    this.emitSparkBurst({ count: 380, originRadius: 1.25, colorHex: 0xffd60a, speed: 10.2 });

    if (this.soundEnabled) {
      badgeAudio.playBurst(this.playbackSpeed);
      badgeAudio.playAllRingsMasterFlourish();
    }
    triggerHaptic('impact');

    if (this.onStageChange) {
      this.onStageChange('breakout_burst', this.activeBadgeItem);
    }
  }

  private transitionToInspect() {
    this.currentStage = 'inspect';
    this.stageStartTime = performance.now();
    this.stageDuration = 0;

    if (this.mysteryHex) this.mysteryHex.visible = false;
    if (this.assemblyGroup) this.assemblyGroup.visible = false;
    if (this.activityRings3In1Group) this.activityRings3In1Group.visible = false;
    if (this.realBadgeMesh) {
      this.realBadgeMesh.visible = true;
      this.realBadgeMesh.scale.setScalar(1.0);
    }

    this.badgeGroup.position.set(0, 0, 0);
    this.badgeGroup.scale.setScalar(1.0);
    // Preserve the exact pose at reveal; the same object now becomes inspectable.
    this.currentQuat.copy(this.badgeGroup.quaternion);
    this.targetQuat.copy(this.badgeGroup.quaternion);

    if (this.onStageChange) {
      this.onStageChange('inspect', this.activeBadgeItem);
    }
  }

  public toggleFlip() {
    if (this.currentStage !== 'inspect') return;
    this.isFlipped = !this.isFlipped;
    this.isFlipAnimating = true;
    this.flipStartTime = performance.now();
    if (this.soundEnabled) {
      badgeAudio.playClick(1.2);
    }
    triggerHaptic('impact');
  }

  // Trigger Return to Badge Wall with Spring Magnetic Snap!
  public triggerReturnToWall() {
    if (this.currentStage !== 'inspect') return;

    this.currentStage = 'flying_back';
    this.stageStartTime = performance.now();
    this.stageDuration = 760 / this.playbackSpeed;

    const slot = this.slots[this.activeSlotIndex];
    this.flightStartPos.copy(this.badgeGroup.position);
    this.flightEndPos.set(slot.x, slot.y, slot.z);

    this.flightStartScale = this.badgeGroup.scale.x;
    this.flightEndScale = 0.34;

    if (this.soundEnabled) {
      badgeAudio.playSpinWhoosh(0.5, this.playbackSpeed);
    }

    if (this.onStageChange) {
      this.onStageChange('flying_back', this.activeBadgeItem);
    }
  }

  private transitionToMagneticSnap() {
    this.currentStage = 'magnetic_snap';
    this.stageStartTime = performance.now();
    this.stageDuration = 480;

    const slot = this.slots[this.activeSlotIndex];
    this.snapFlashLight.position.set(slot.x, slot.y, 0.5);
    this.snapFlashLight.intensity = 5.0;

    // Configure ODE Spring Physics
    const effectiveDamping = (this.springDamping / Math.max(0.4, this.overshootElasticity));
    this.springIntegrator.configure({
      mass: this.springMass,
      stiffness: this.springStiffness,
      damping: effectiveDamping,
      restTolerance: 0.0008,
    });
    this.springIntegrator.reset(1.0, 16.5 * this.overshootElasticity);

    if (this.soundEnabled) {
      badgeAudio.playMagneticSnap(this.playbackSpeed);
    }

    if (this.onStageChange) {
      this.onStageChange('magnetic_snap', this.activeBadgeItem);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // rAF Main Animation & Physics Loop
  // ─────────────────────────────────────────────────────────────────────────
  private startLoop() {
    const loop = (now: number) => {
      if (!this.isLoopRunning) return;
      requestAnimationFrame(loop);

      const dt = Math.min(0.05, (now - this.lastRafTime) / 1000);
      this.lastRafTime = now;
      this.badgeTime += dt;
      const elapsed = now - this.stageStartTime;

      // ── 1. STAGE: PENDING ──
      if (this.currentStage === 'pending') {
        const t = this.badgeTime;

        // "静止中蕴含张力" - 多谐波微浮动力学（基频呼吸 + 高频张力泛音）
        const floatY = 0.055 * (Math.sin(t * 1.1) + 0.32 * Math.sin(t * 2.3 + 0.45) + 0.12 * Math.cos(t * 0.55));
        const swayX = 0.028 * (Math.cos(t * 0.8) + 0.28 * Math.cos(t * 1.65 + 0.7));
        const depthZ = 0.02 * Math.sin(t * 0.95 + 1.2) + this.recoilZ;

        // Spring recoil damping
        this.recoilVelZ += (0 - this.recoilZ) * 24.0 * dt;
        this.recoilVelZ *= Math.pow(0.85, dt * 60);
        this.recoilZ += this.recoilVelZ;

        this.badgeGroup.position.set(swayX, floatY, depthZ);
        this.badgeGroup.scale.setScalar(1.0 + 0.008 * Math.sin(t * 1.1));

        const tiltX = this.pointerParallaxY + (Math.sin(t * 0.95) * 0.045 + Math.cos(t * 1.9) * 0.018);
        const tiltY = this.pointerParallaxX + (Math.cos(t * 0.8) * 0.055 + Math.sin(t * 1.6) * 0.022);
        const rollZ = Math.sin(t * 0.45) * 0.018;

        const baseQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(tiltX, tiltY, rollZ));
        this.currentQuat.slerp(this.targetQuat.clone().multiply(baseQuat), 0.12);
        this.badgeGroup.quaternion.copy(this.currentQuat);

        // Dynamic HDRi Environment Reflections
        const hdriAngle = t * 0.45 + this.pointerParallaxX * 1.8;
        const pitchOffset = Math.sin(t * 0.7) * 0.09 + this.pointerParallaxY * 0.25;
        this.sharedMaterials.updateDynamicEnvironmentRotation(hdriAngle, pitchOffset);

        // Orbit gold highlight light
        if (this.goldGlintLight) {
          this.goldGlintLight.position.x = 2.0 * Math.cos(t * 0.85);
          this.goldGlintLight.position.y = 2.4 + 0.8 * Math.sin(t * 1.1);
          this.goldGlintLight.position.z = 2.8 + 0.6 * Math.cos(t * 0.75);
        }

        // Star glints sparkle
        for (let i = 0; i < this.starGlints.length; i++) {
          const g = this.starGlints[i];
          const twinkle = Math.pow(Math.max(0, Math.sin(t * g.speed + g.phase)), 6);
          const sc = g.baseScale * (0.35 + 1.25 * twinkle);
          g.mesh.scale.set(sc, sc, 1);
          (g.mesh.material as THREE.MeshBasicMaterial).opacity = twinkle * 0.98;
          g.mesh.rotation.z += dt * 0.6;
        }

        // Soft aura breathing
        if (this.softAuraMesh) {
          (this.softAuraMesh.material as THREE.MeshBasicMaterial).opacity = 0.65 + 0.15 * Math.sin(t * 1.2);
        }
      }

      // ── 2a. STAGE: BRACKETS LOCK (6 Clamps Converge) ──
      else if (this.currentStage === 'brackets_lock') {
        const p = Math.min(1.0, elapsed / this.stageDuration);
        const ease = 1 - Math.pow(1 - p, 3); // ease-out cubic
        if (this.assemblyGroup) {
          this.assemblyGroup.setAssemblyProgress(ease);
        }

        if (this.activityRings3In1Group) {
          this.activityRings3In1Group.visible = true;
          this.activityRings3In1Group.moveRing.scale.setScalar(2.2 - 1.2 * ease);
          this.activityRings3In1Group.exerciseRing.scale.setScalar(2.0 - 1.0 * Math.min(1, ease * 1.2));
          this.activityRings3In1Group.standRing.scale.setScalar(1.8 - 0.8 * Math.min(1, ease * 1.4));
        }

        // Progressive Spark Bursts for Activity Rings Snap
        if (p >= 0.22 && !this.ringSparksTriggered.move) {
          this.ringSparksTriggered.move = true;
          this.emitSparkBurst({ count: 220, originRadius: 1.42, colorHex: 0xff2d55, speed: 6.2 });
          if (this.soundEnabled) badgeAudio.playBracketSnap(0, this.playbackSpeed);
          triggerHaptic('impact');
        }
        if (p >= 0.52 && !this.ringSparksTriggered.exercise) {
          this.ringSparksTriggered.exercise = true;
          this.emitSparkBurst({ count: 220, originRadius: 1.12, colorHex: 0xa1e70a, speed: 6.2 });
          if (this.soundEnabled) badgeAudio.playBracketSnap(1, this.playbackSpeed);
          triggerHaptic('impact');
        }
        if (p >= 0.82 && !this.ringSparksTriggered.stand) {
          this.ringSparksTriggered.stand = true;
          this.emitSparkBurst({ count: 220, originRadius: 0.82, colorHex: 0x00e5ff, speed: 6.2 });
          if (this.soundEnabled) badgeAudio.playBracketSnap(2, this.playbackSpeed);
          triggerHaptic('impact');
        }
        if (p >= 0.96 && !this.ringSparksTriggered.lock) {
          this.ringSparksTriggered.lock = true;
          this.emitSparkBurst({ count: 300, originRadius: 1.1, colorHex: 0xffd60a, speed: 7.2 });
          if (this.soundEnabled) badgeAudio.playEnergyPulse(this.playbackSpeed);
          triggerHaptic('impact');
        }

        this.badgeGroup.position.set(0, 0, 0);
        this.badgeGroup.rotation.z = ease * 0.12;

        if (p >= 1.0) {
          this.transitionToLaserCharge();
        }
      }

      // ── 2b. STAGE: LASER CHARGE ──
      else if (this.currentStage === 'laser_charge') {
        const p = Math.min(1.0, elapsed / this.stageDuration);
        const pulse = Math.sin(p * Math.PI * 4) * 0.5 + 0.5;
        this.centerPulseLight.intensity = pulse * 4.5;
        this.centerPulseLight.color.setHex(0x00f0ff);

        // Micro-tremor
        this.badgeGroup.position.x = (Math.random() - 0.5) * 0.015 * pulse;
        this.badgeGroup.position.y = (Math.random() - 0.5) * 0.015 * pulse;

        if (p >= 1.0) {
          this.transitionToBreakoutBurst();
        }
      }

      // ── 2c. STAGE: BREAKOUT BURST & REVEAL ──
      else if (this.currentStage === 'breakout_burst') {
        const p = Math.min(1.0, elapsed / this.stageDuration);

        // One continuous object rotates exactly three turns, then faces front.
        const spinEase = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        this.badgeGroup.rotation.y = THREE.MathUtils.lerp(this.burstStartYaw, 0, spinEase) + Math.PI * 6 * spinEase;
        this.badgeGroup.rotation.x = THREE.MathUtils.lerp(this.burstStartPitch, 0, spinEase);
        this.badgeGroup.rotation.z = THREE.MathUtils.lerp(this.burstStartRoll, 0, spinEase);
        this.badgeGroup.position.x *= Math.exp(-9 * dt);
        this.badgeGroup.position.y *= Math.exp(-9 * dt);

        if (Math.random() < 0.4) {
          this.emitSparkBurst({ count: 25, originRadius: 1.35, colorHex: 0xffea75, speed: 7.0 });
        }

        // Shockwave expansion
        if (this.shockwaveRing) {
          const rScale = 1.0 + p * 7.5;
          this.shockwaveRing.scale.setScalar(rScale);
          (this.shockwaveRing.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1.0 - p * 1.2);
        }

        // Golden dust expansion
        if (this.particleCloud) {
          const pos = this.particleCloud.geometry.attributes.position as THREE.BufferAttribute;
          const vel = this.particleCloud.geometry.attributes.velocity as THREE.BufferAttribute;
          for (let i = 0; i < pos.count; i++) {
            pos.setXYZ(
              i,
              pos.getX(i) + vel.getX(i) * dt,
              pos.getY(i) + vel.getY(i) * dt,
              pos.getZ(i) + vel.getZ(i) * dt
            );
          }
          pos.needsUpdate = true;
          (this.particleCloud.material as THREE.PointsMaterial).opacity = Math.max(0, (1.0 - p) * 1.2);
        }

        // Funnel the ring assembly into the same center before the identity appears.
        if (this.activityRings3In1Group && p < 0.82) {
          this.activityRings3In1Group.scale.setScalar(Math.max(0.001, 1 - p / 0.82));
        }

        // Reveal only as the rotation settles front-facing, never during spin.
        if (p >= 0.82) {
          if (this.mysteryHex) this.mysteryHex.visible = false;
          if (this.assemblyGroup) this.assemblyGroup.visible = false;
          if (this.activityRings3In1Group) this.activityRings3In1Group.visible = false;
          if (this.realBadgeMesh) {
            this.realBadgeMesh.visible = true;
            const revealScale = Math.min(1.0, (p - 0.82) / 0.18);
            this.realBadgeMesh.scale.setScalar(revealScale);
          }
        }

        if (p >= 1.0) {
          this.transitionToInspect();
        }
      }

      // ── 3. STAGE: INSPECT (3D Interactive Orbit & 180° Flip) ──
      else if (this.currentStage === 'inspect') {
        if (!this.isPointerDown) {
          this.pointerVelocityX *= 0.92;
          this.pointerVelocityY *= 0.92;

          if (Math.hypot(this.pointerVelocityX, this.pointerVelocityY) > 0.001) {
            const qY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.pointerVelocityX * 0.015);
            const qX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.pointerVelocityY * 0.015);
            this.targetQuat.premultiply(qY.multiply(qX));
          }
        }

        // Handle 180° Flip Animation
        if (this.isFlipAnimating) {
          const flipElapsed = now - this.flipStartTime;
          const flipDur = 450;
          const fp = Math.min(1.0, flipElapsed / flipDur);
          const easeFlip = 1 - Math.pow(1 - fp, 3);
          this.flipProgress = this.isFlipped ? easeFlip : 1.0 - easeFlip;
          if (fp >= 1.0) {
            this.isFlipAnimating = false;
          }
        }

        const flipAngle = this.flipProgress * Math.PI;
        const qFlip = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), flipAngle);

        this.currentQuat.slerp(this.targetQuat, 0.18);
        this.badgeGroup.quaternion.multiplyQuaternions(qFlip, this.currentQuat);

        // Subtle float
        this.badgeGroup.position.y = Math.sin(this.badgeTime * 2.0) * 0.035;
        this.badgeGroup.position.z = Math.cos(this.badgeTime * 1.6) * 0.02;
      }

      // ── 4a. STAGE: FLYING BACK (3D Parabolic Arc Trajectory) ──
      else if (this.currentStage === 'flying_back') {
        const p = Math.min(1.0, elapsed / this.stageDuration);
        this.camera.position.z = THREE.MathUtils.lerp(this.getCeremonyCameraZ(), this.getWallCameraZ(), p * p * (3 - 2 * p));

        const zeta = this.springDamping / (2 * Math.sqrt(this.springStiffness * this.springMass));
        const easePower = THREE.MathUtils.lerp(0.85, 1.25, Math.min(1.5, zeta));
        const ease = p < 0.82
          ? Math.pow(p / 0.82, easePower) * 0.80
          : 0.80 + (1.0 - 0.80) * Math.pow((p - 0.82) / 0.18, 1.35 * zeta);

        const curX = THREE.MathUtils.lerp(this.flightStartPos.x, this.flightEndPos.x, ease);
        const curY = THREE.MathUtils.lerp(this.flightStartPos.y, this.flightEndPos.y, ease);
        const arcZ = Math.sin(Math.pow(p, 0.85) * Math.PI) * 0.48;
        const curZ = THREE.MathUtils.lerp(this.flightStartPos.z, this.flightEndPos.z, ease) + arcZ;

        this.badgeGroup.position.set(curX, curY, curZ);

        const s = THREE.MathUtils.lerp(this.flightStartScale, this.flightEndScale, ease);
        this.badgeGroup.scale.setScalar(s);

        const spinAngle = p * Math.PI * 4.0;
        this.badgeGroup.rotation.y = spinAngle;
        this.badgeGroup.rotation.x = Math.sin(p * Math.PI) * 0.18;

        // Wall re-emerges from background depth
        this.wallGroup.position.z = THREE.MathUtils.lerp(-1.8, 0, p);

        if (p >= 1.0) {
          this.transitionToMagneticSnap();
        }
      }

      // ── 4b. STAGE: MAGNETIC SNAP (ODE Spring Physics & Haptic Resonance) ──
      else if (this.currentStage === 'magnetic_snap') {
        const slot = this.slots[this.activeSlotIndex];
        const telemetry = this.springIntegrator.step(dt);

        if (this.onPhysicsTelemetry) {
          this.onPhysicsTelemetry(telemetry);
        }

        // Scale Overshoot
        const scaleMultiplier = 1.0 + telemetry.displacement * 0.18 * this.overshootElasticity;
        this.badgeGroup.scale.setScalar(0.34 * Math.max(0.1, scaleMultiplier));

        // Z-depression into dish
        const zDepression = -0.024 * telemetry.displacement * this.overshootElasticity;
        this.badgeGroup.position.set(slot.x, slot.y, slot.z + zDepression);

        // Angular micro-vibration
        const energyLevel = Math.min(1.0, (telemetry.kineticEnergy + telemetry.potentialEnergy) * 3.5);
        const vibeDecay = energyLevel * this.vibrationIntensity;
        this.badgeGroup.rotation.set(
          (telemetry.velocity * 0.0035 + telemetry.displacement * 0.025) * vibeDecay,
          (Math.sin(now * 0.04) * 0.018) * vibeDecay,
          (telemetry.acceleration * 0.00008) * vibeDecay
        );

        // Halo ripple
        if (slot.haloMesh) {
          (slot.haloMesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, energyLevel * 0.95);
          slot.haloMesh.scale.setScalar(1.0 + (1.0 - energyLevel) * 0.45);
        }

        this.snapFlashLight.intensity = Math.max(0, energyLevel * 5.0);
        this.wallGroup.position.z = 0;

        if (telemetry.isSettled || elapsed > 600) {
          this.currentStage = 'collected';
          // Keep the very same badge mesh in its wall slot; no duplicate swap.
          this.badgeGroup.position.set(slot.x, slot.y, slot.z + 0.12);
          this.badgeGroup.scale.setScalar(0.34);
          this.badgeGroup.rotation.set(0, 0, 0);
          if (this.onStageChange) {
            this.onStageChange('collected', this.activeBadgeItem);
          }
        }
      }

      this.updateSparkParticles(dt);
      this.renderFrame(now);
    };

    requestAnimationFrame(loop);
  }

  private renderFrame(now: number) {
    const start = performance.now();
    this.composer.render();
    const frameTime = performance.now() - start;

    this.frameCount++;
    if (now - this.lastFpsTime >= 500) {
      this.currentFps = Math.round((this.frameCount * 1000) / (now - this.lastFpsTime));
      this.frameCount = 0;
      this.lastFpsTime = now;

      if (this.onMetricsUpdate) {
        this.onMetricsUpdate({
          fps: Math.min(120, this.currentFps),
          frameTimeMs: Number(frameTime.toFixed(2)),
          drawCalls: this.renderer.info.render.calls,
          triangles: this.renderer.info.render.triangles,
          isSleeping: false,
          allocationsPerFrame: 0,
        });
      }
    }
  }

  private bindEvents() {
    const el = this.renderer.domElement;

    el.addEventListener('click', (e: MouseEvent) => {
      if (Math.abs(e.clientX - this.prevPointerX) < 5 && Math.abs(e.clientY - this.prevPointerY) < 5) {
        this.advanceNextStep();
      }
    });

    el.addEventListener('pointerdown', (e: PointerEvent) => {
      if (this.currentStage === 'pending') {
        this.startFullCeremony();
        return;
      }

      this.isPointerDown = true;
      this.prevPointerX = e.clientX;
      this.prevPointerY = e.clientY;
      this.pointerVelocityX = 0;
      this.pointerVelocityY = 0;
      el.setPointerCapture(e.pointerId);
    });

    window.addEventListener('pointermove', (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const normX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const normY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      this.pointerParallaxX = normX * 0.12;
      this.pointerParallaxY = -normY * 0.12;

      if (!this.isPointerDown || this.currentStage !== 'inspect') return;
      const dx = e.clientX - this.prevPointerX;
      const dy = e.clientY - this.prevPointerY;

      this.pointerVelocityX = dx;
      this.pointerVelocityY = dy;

      const qY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), dx * 0.008);
      const qX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), dy * 0.008);
      this.targetQuat.premultiply(qY.multiply(qX));

      this.prevPointerX = e.clientX;
      this.prevPointerY = e.clientY;
    });

    window.addEventListener('pointerup', () => {
      this.isPointerDown = false;
    });

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          this.camera.aspect = width / height;
          this.camera.updateProjectionMatrix();
          if (this.currentStage === 'collected') this.camera.position.z = this.getWallCameraZ();
          else if (this.currentStage !== 'flying_back' && this.currentStage !== 'magnetic_snap') this.camera.position.z = this.getCeremonyCameraZ();
          this.renderer.setSize(width, height);
          this.composer.setSize(width, height);
        }
      }
    });
    ro.observe(this.container);
  }

  public destroy() {
    this.isLoopRunning = false;
    this.renderer.dispose();
    this.composer.dispose();
  }
}
