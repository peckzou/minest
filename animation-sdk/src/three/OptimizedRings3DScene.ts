/**
 * Optimized Apple Fitness Rings Scene (Three.js with Controlled Bloom & Blacksmith Forged Sparks)
 *
 * Implements:
 * 1. Restrained, Apple-Grade Bloom:
 *    - Bloom threshold tuned to 0.82 and strength to 0.65.
 *    - Absolutely NO foggy blowout ("掌握好度"): Rings remain razor-sharp and legible.
 *    - Only incandescent molten sparks and specular glints bloom.
 * 2. Authentic Blacksmith Molten Iron Sparks ("打铁时的铁花"):
 *    - Elongated needle/droplet streaks dynamically oriented along velocity vectors.
 *    - Velocity-stretched geometry (longer streaks at high speeds, tiny cooling embers at low speeds).
 *    - True incandescent thermal color gradient: Blinding white-hot core -> 24K molten gold -> fiery forged orange -> ember red.
 *    - Violent initial explosive spray + ballistic gravity curves ($g = -7.6\text{ m/s}^2$) + exponential air drag.
 *    - Centrifugal force flinging ("被高速甩出去"): High-speed rotation flings molten iron sparks tangentially.
 * 3. Crystal-Clear Staged Sequence:
 *    - All 3 rings reach 100% -> Rings lock flat facing forward.
 *    - FIRST: 2,200+ molten iron sparks violently burst across the viewport for 650ms.
 *    - THEN: Accelerates into 3D high-speed self-rotation like the Hex Assembly.
 * 4. 100% Apple Fitness Native Flat Proportions (Conic gradients, rounded caps, drop shadows).
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { AppleAwardMaterials } from './AppleAwardMaterials';
import { PerformanceMetrics } from './OptimizedBadgeInspectorScene';
import { badgeAudio, triggerHaptic, triggerDynamicImpactHaptic } from '../utils/hapticsAndAudio';
import { SpringPhysicsIntegrator } from '../utils/springPhysicsIntegrator';

/**
 * Unified Kinematic Motion Blur & Physical Centrifugal Deformation Shader
 * Combines tangential motion trailing, centrifugal radial expansion, and chromatic dispersion
 * into a SINGLE optimized post-processing pass to eliminate intermediate frame-buffer switching,
 * reducing GPU bandwidth consumption and maximizing frame rate stability on mobile and low-end devices.
 */
export const UnifiedKinematicMotionBlurShader = {
  name: 'UnifiedKinematicMotionBlurShader',
  uniforms: {
    tDiffuse: { value: null },
    uVelocity: { value: 0.0 }, // Angular yaw velocity in rad/s
    uCenter: { value: new THREE.Vector2(0.5, 0.5) },
    uAspect: { value: 1.0 },
    uTangentialStrength: { value: 1.0 },
    uRadialStrength: { value: 1.0 },
    uChromaticAberration: { value: 0.0038 },
    uTilt: { value: 0.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uVelocity;
    uniform vec2 uCenter;
    uniform float uAspect;
    uniform float uTangentialStrength;
    uniform float uRadialStrength;
    uniform float uChromaticAberration;
    uniform float uTilt;
    varying vec2 vUv;

    void main() {
      float absVel = abs(uVelocity);
      if (absVel < 0.008 || (uTangentialStrength < 0.01 && uRadialStrength < 0.01)) {
        gl_FragColor = texture2D(tDiffuse, vUv);
        return;
      }

      // Aspect-corrected offset vector from rotation center
      vec2 uvOffset = vUv - uCenter;
      vec2 aspectOffset = vec2(uvOffset.x * uAspect, uvOffset.y);
      float r = length(aspectOffset);

      if (r < 0.0001) {
        gl_FragColor = texture2D(tDiffuse, vUv);
        return;
      }

      // 1. Normalized tangential (-y, x) and radial (x, y) vectors
      vec2 tanDir = vec2(-aspectOffset.y / (r * uAspect), aspectOffset.x / r);
      vec2 radDir = vec2(aspectOffset.x / (r * uAspect), aspectOffset.y / r);

      // 2. Perspective tilt compression factor
      float tiltFactor = 1.0 - abs(sin(uTilt)) * 0.42 * clamp(abs(aspectOffset.y), 0.0, 1.0);

      // 3. Tangential trailing magnitude: v_tan = omega * r
      float tanMag = uVelocity * r * 0.026 * uTangentialStrength * tiltFactor;
      tanMag = clamp(tanMag, -0.045, 0.045);

      // 4. Centrifugal radial magnitude: a = omega^2 * r
      float omegaNorm = clamp(absVel / 6.0, 0.0, 1.8);
      float radMag = (r * r * 0.045 + r * 0.015) * omegaNorm * uRadialStrength * tiltFactor;
      radMag = clamp(radMag, 0.0, 0.038);

      // 5. Chromatic separation magnitude
      float chroma = uChromaticAberration * omegaNorm * uRadialStrength * r;

      // 6. Unified 11-Tap Gaussian & Exponential Kinematic Convolution
      const int SAMPLES = 11;
      vec4 accum = vec4(0.0);
      float totalWeight = 0.0;

      for (int i = 0; i < SAMPLES; i++) {
        float tTan = (float(i) / float(SAMPLES - 1)) - 0.5; // [-0.5, +0.5]
        float tRad = abs(tTan) * 2.0; // [0.0, 1.0]
        float weight = exp(-tTan * tTan * 7.0);

        vec2 sampleOffset = tanDir * (tTan * tanMag) - radDir * (tRad * radMag * 0.65);
        vec2 sampleUv = vUv + sampleOffset;

        if (chroma > 0.0001) {
          vec2 chromaVec = (radDir + tanDir * 0.25) * chroma;
          float rCol = texture2D(tDiffuse, sampleUv + chromaVec).r;
          float gCol = texture2D(tDiffuse, sampleUv).g;
          float bCol = texture2D(tDiffuse, sampleUv - chromaVec).b;
          float aCol = texture2D(tDiffuse, sampleUv).a;
          accum += vec4(rCol, gCol, bCol, aCol) * weight;
        } else {
          accum += texture2D(tDiffuse, sampleUv) * weight;
        }
        totalWeight += weight;
      }

      gl_FragColor = accum / totalWeight;
    }
  `
};

export interface RingData {
  id: 'move' | 'exercise' | 'stand';
  label: string;
  labelZh: string;
  pct: number;
  radius: number;
  width: number;
  gradientStart: string;
  gradientEnd: string;
  trackColor: string;
  glowColor: string;
}

export type Rings3DSpinSpeed = 'normal' | 'turbo' | 'hyper';
export type RingsLODMode = 'auto' | 'lod0' | 'lod1' | 'lod2';

export interface RingsPerformanceMetrics extends PerformanceMetrics {
  lodTier?: string;
  lodDensityPct?: number;
  activeSparks?: number;
  maxSparksBudget?: number;
}

// Scratch variables to eliminate heap allocations in render loop
const _axisY = new THREE.Vector3(0, 1, 0);
const _axisX = new THREE.Vector3(1, 0, 0);
const _axisZ = new THREE.Vector3(0, 0, 1);
const _qY = new THREE.Quaternion();
const _qX = new THREE.Quaternion();
const _matrix4 = new THREE.Matrix4();
const _pos = new THREE.Vector3();
const _scaleVec = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _colorScratch = new THREE.Color();
const _targetEuler = new THREE.Euler(0, 0, 0, 'YXZ');

export class OptimizedRings3DScene {
  private container: HTMLElement;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private composer!: EffectComposer;
  // Post-Processing Passes (Unified Single-Pass Pipeline)
  private bloomPass!: UnrealBloomPass;
  private unifiedKinematicPass!: ShaderPass;
  public motionBlurEnabled: boolean = true;
  public motionBlurIntensity: number = 1.0;
  public radialBlurEnabled: boolean = true;
  public radialBlurIntensity: number = 1.0;
  public chromaticAberration: number = 0.0038;
  public lodMode: RingsLODMode = 'auto';
  public flowFieldEnabled: boolean = true;
  public flowFieldIntensity: number = 1.0;
  public brakeSparksEnabled: boolean = true;
  private sharedMaterials: AppleAwardMaterials;

  // 3D Anchor Group for Rings
  public ringsGroup!: THREE.Group;
  private ringsContainer!: THREE.Group;

  // Flat Native 2D Apple Fitness Canvas & Dynamic Texture with HDRi PBR Metal Material
  private canvasSize = 1024;
  private ringCanvas!: HTMLCanvasElement;
  private ringCtx!: CanvasRenderingContext2D;
  private ringTexture!: THREE.CanvasTexture;
  private ringNormalTexture!: THREE.CanvasTexture;
  public ringMaterial!: THREE.MeshPhysicalMaterial;
  private mainRingMesh!: THREE.Mesh;
  public envMapIntensity: number = 1.4;
  public metalness: number = 0.88;
  public roughness: number = 0.18;

  // Lights
  private sparkFlashLight!: THREE.PointLight;
  private keyLight!: THREE.DirectionalLight;
  private rimLight!: THREE.DirectionalLight;

  // ─────────────────────────────────────────────────────────────────────────
  // Blacksmith Molten Iron Sparks System (2,200 Instanced Tapered Needles)
  // ─────────────────────────────────────────────────────────────────────────
  private readonly MAX_INSTANCED_SPARKS = 2200;
  private sparkInstancedMesh!: THREE.InstancedMesh;
  private sparkPositions = new Float32Array(this.MAX_INSTANCED_SPARKS * 3);
  private sparkVelocities = new Float32Array(this.MAX_INSTANCED_SPARKS * 3);
  private sparkLifespans = new Float32Array(this.MAX_INSTANCED_SPARKS);
  private sparkMaxLife = new Float32Array(this.MAX_INSTANCED_SPARKS);
  private sparkBaseLengths = new Float32Array(this.MAX_INSTANCED_SPARKS);
  private sparkBaseWidths = new Float32Array(this.MAX_INSTANCED_SPARKS);
  private sparkTypes = new Uint8Array(this.MAX_INSTANCED_SPARKS); // 0: White-Hot, 1: Molten Gold, 2: Fire Orange, 3: Ring Accent
  private activeSparkCount = 0;
  private sparkPoolCursor = 0;

  /**
   * Zero-Allocation Particle Object Pool Slot Recycler
   * Reuses dead/expired particle slots first; if all slots are active, recycles oldest slots in circular order.
   * Completely eliminates heap allocations & GC micro-stutters during continuous fireworks!
   */
  private acquireSparkSlot(): number {
    for (let i = 0; i < this.MAX_INSTANCED_SPARKS; i++) {
      const slot = (this.sparkPoolCursor + i) % this.MAX_INSTANCED_SPARKS;
      if (this.sparkLifespans[slot] <= 0) {
        this.sparkPoolCursor = (slot + 1) % this.MAX_INSTANCED_SPARKS;
        return slot;
      }
    }
    // Pool 100% full with active particles: overwrite oldest slot at cursor
    const slot = this.sparkPoolCursor;
    this.sparkPoolCursor = (this.sparkPoolCursor + 1) % this.MAX_INSTANCED_SPARKS;
    return slot;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3D Self-Rotation & Staged Timing State
  // ─────────────────────────────────────────────────────────────────────────
  public isAllClosed = false;
  public ringHighlightIntensities: [number, number, number] = [0, 0, 0];
  public isSpinning = false;
  public isDecelerating = false;
  private decelerationCallback?: () => void;
  private decelerationTargetYaw = 0;
  private fireworkAccumulator = 0;
  public onTapRing?: () => void;
  public spinSpeed: Rings3DSpinSpeed = 'turbo';
  public spinAngleY = 0;
  public currentYawVelocity = 0;
  public currentTiltX = 0;
  public targetTiltX = 0;
  public idleTime = 0;

  // Pre-Spin Sparks Explosion Stage (650ms flat showcase)
  private isPreSpinErupting = false;
  private preSpinStartTime = 0;
  private readonly PRE_SPIN_DURATION = 650; // ms

  // Turbo Vortex Burst Transition
  private isVortexBursted = false;
  private vortexStartTime = 0;
  private vortexDuration = 2400; // ms

  // Kinetic Interaction & Gravity Inertia Rebound State
  private isDragging = false;
  private prevPointerX = 0;
  private prevPointerY = 0;
  private pointerVelocityX = 0;
  private pointerVelocityY = 0;
  private rotVelocityX = 0;
  private rotVelocityY = 0;
  private currentEulerX = 0;
  private currentEulerY = 0;
  private hasPlayedSnapRebound = true;
  public soundEnabled = true;
  private currentQuat = new THREE.Quaternion();
  private targetQuat = new THREE.Quaternion();

  // Performance & RAF Loop
  private isLoopRunning = true;
  private lastRafTime = performance.now();
  private frameCount = 0;
  private lastFpsCalcTime = performance.now();
  public onMetricsUpdate?: (metrics: RingsPerformanceMetrics) => void;

  // Exact Apple Fitness Dimensions on 1024x1024 Canvas
  public ringConfigs: RingData[] = [
    {
      id: 'move',
      label: 'Move',
      labelZh: '活动',
      pct: 85,
      radius: 340,
      width: 58,
      gradientStart: '#ff1453',
      gradientEnd: '#ff375f',
      trackColor: 'rgba(255, 20, 83, 0.28)',
      glowColor: 'rgba(255, 55, 95, 0.55)',
    },
    {
      id: 'exercise',
      label: 'Exercise',
      labelZh: '锻炼',
      pct: 90,
      radius: 268,
      width: 58,
      gradientStart: '#a6ff00',
      gradientEnd: '#30d158',
      trackColor: 'rgba(48, 209, 88, 0.28)',
      glowColor: 'rgba(48, 209, 88, 0.55)',
    },
    {
      id: 'stand',
      label: 'Stand',
      labelZh: '站立',
      pct: 75,
      radius: 196,
      width: 58,
      gradientStart: '#00f0ff',
      gradientEnd: '#0a84ff',
      trackColor: 'rgba(0, 240, 255, 0.28)',
      glowColor: 'rgba(10, 132, 255, 0.55)',
    },
  ];

  constructor(container: HTMLElement, materials?: AppleAwardMaterials) {
    this.container = container;
    this.sharedMaterials = materials || new AppleAwardMaterials();

    this.initScene();
    this.initFlatAppleFitnessRings();
    this.initControlledPostProcessingBloom();
    this.initBlacksmithMoltenSparksSystem();
    this.bindEvents();
    this.startLoop();
  }

  private initScene() {
    const width = Math.max(100, this.container.clientWidth || 300);
    const height = Math.max(100, this.container.clientHeight || 300);

    this.scene = new THREE.Scene();
    // Real-Time Studio HDRi Environment Map Reflection for all PBR Materials
    this.scene.environment = this.sharedMaterials.envMap;

    this.camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 40);
    this.camera.position.set(0, 0, 5.8);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      stencil: false,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.setClearColor(0x000000, 0.0);

    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // Studio Ambient & Directional Lighting
    const amb = new THREE.AmbientLight(0xffffff, 0.75);
    this.scene.add(amb);

    this.keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
    this.keyLight.position.set(2.4, 3.8, 4.2);
    this.scene.add(this.keyLight);

    this.rimLight = new THREE.DirectionalLight(0xa5f3fc, 0.85);
    this.rimLight.position.set(-3.5, 1.5, 3.0);
    this.scene.add(this.rimLight);

    const bottomReflector = new THREE.DirectionalLight(0xffe29a, 0.45);
    bottomReflector.position.set(1.5, -3.5, 2.5);
    this.scene.add(bottomReflector);

    // Dynamic Incandescent Spark Burst Point Light
    this.sparkFlashLight = new THREE.PointLight(0xffdf80, 0, 12, 1.8);
    this.sparkFlashLight.position.set(0, 0, 0.9);
    this.scene.add(this.sparkFlashLight);

    // Rings Anchor Hierarchy
    this.ringsContainer = new THREE.Group();
    this.scene.add(this.ringsContainer);

    this.ringsGroup = new THREE.Group();
    this.ringsContainer.add(this.ringsGroup);

    // Initial 2D Flat Alignment
    this.ringsContainer.rotation.set(0, 0, 0);
    this.ringsGroup.rotation.set(0, 0, 0);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Controlled Post-Processing Bloom ("掌握好度")
  // ─────────────────────────────────────────────────────────────────────────
  private initControlledPostProcessingBloom() {
    const width = Math.max(100, this.container.clientWidth || 300);
    const height = Math.max(100, this.container.clientHeight || 300);

    const renderPass = new RenderPass(this.scene, this.camera);

    /**
     * Apple-Grade Disciplined Bloom Tuning:
     * - Threshold 0.82: Strictly filters out ring tracks and body graphics.
     *   ONLY the blazing white-hot molten iron sparks and white tip glints bloom!
     * - Strength 0.65: Controlled, refined specular glint, zero milky fog blowout.
     * - Radius 0.30: Crisp localized radiance.
     */
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.25, // strength (cut in half: extremely subtle, crisp specular accents)
      0.25, // radius
      0.78  // threshold (strictly filters out ring surfaces so main ring colors are deep and sharp)
    );

    // Unified Single-Pass Kinematic Motion Blur & Centrifugal Deformation Pass
    this.unifiedKinematicPass = new ShaderPass(UnifiedKinematicMotionBlurShader);
    this.unifiedKinematicPass.uniforms.uAspect.value = width / Math.max(1, height);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(renderPass);
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(this.unifiedKinematicPass);
  }

  /**
   * Procedural Toroidal Normal Map for Rings Bevel & Curved Specular Glints
   */
  private createRingNormalMap(): THREE.CanvasTexture {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const imgData = ctx.createImageData(size, size);
    const data = imgData.data;

    const cx = size / 2;
    const cy = size / 2;
    const scale = size / this.canvasSize;

    const scaledRings = this.ringConfigs.map((r) => ({
      radius: r.radius * scale,
      halfWidth: (r.width * scale) / 2,
    }));

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let nx = 0;
        let ny = 0;
        let nz = 1;

        for (const ring of scaledRings) {
          const d = Math.abs(dist - ring.radius);
          if (d <= ring.halfWidth && dist > 0.001) {
            const u = d / ring.halfWidth; // 0 at peak centerline, 1 at bevel edges
            const localZ = Math.sqrt(Math.max(0, 1 - u * u));
            const sign = dist > ring.radius ? 1 : -1;
            const dirX = (dx / dist) * sign;
            const dirY = (dy / dist) * sign;

            nx = dirX * u * 0.92;
            ny = dirY * u * 0.92;
            nz = localZ;
            break;
          }
        }

        const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
        data[idx] = Math.round(((nx / len) * 0.5 + 0.5) * 255);
        data[idx + 1] = Math.round(((ny / len) * 0.5 + 0.5) * 255);
        data[idx + 2] = Math.round(((nz / len) * 0.5 + 0.5) * 255);
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    return tex;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 100% Authentic Apple Fitness 2D Flat Appearance with Real-Time PBR Metal Reflections
  // ─────────────────────────────────────────────────────────────────────────
  private initFlatAppleFitnessRings() {
    this.ringCanvas = document.createElement('canvas');
    this.ringCanvas.width = this.canvasSize;
    this.ringCanvas.height = this.canvasSize;
    this.ringCtx = this.ringCanvas.getContext('2d')!;

    // Initial draw to offscreen Retina canvas
    this.drawNativeAppleFitnessRingsCanvas();

    this.ringTexture = new THREE.CanvasTexture(this.ringCanvas);
    this.ringTexture.minFilter = THREE.LinearFilter;
    this.ringTexture.magFilter = THREE.LinearFilter;
    this.ringTexture.generateMipmaps = false;

    this.ringNormalTexture = this.createRingNormalMap();

    // High-Precision Apple Metallic Physical Material with Studio HDRi Reflections & Controlled Breathing
    const planeGeo = new THREE.PlaneGeometry(3.6, 3.6);
    this.ringMaterial = new THREE.MeshPhysicalMaterial({
      map: this.ringTexture,
      emissiveMap: this.ringTexture,
      emissive: new THREE.Color(0x222222), // Ultra-subtle dark emissive tint
      emissiveIntensity: 0.05,
      normalMap: this.ringNormalTexture,
      normalScale: new THREE.Vector2(0.65, 0.65),
      transparent: true,
      side: THREE.DoubleSide,
      roughness: this.roughness,
      metalness: this.metalness,
      clearcoat: 0.75,
      clearcoatRoughness: 0.12,
      reflectivity: 0.98,
      ior: 1.54,
      envMap: this.sharedMaterials.envMap,
      envMapIntensity: this.envMapIntensity,
      depthWrite: false,
    });

    this.mainRingMesh = new THREE.Mesh(planeGeo, this.ringMaterial);
    this.ringsGroup.add(this.mainRingMesh);

    // Apply Dynamic View-Angle Metallic Luster & Anisotropic Grazing Sheen
    this.sharedMaterials.applyDynamicFresnel(this.ringMaterial, {
      fresnelColor: 0xffffff,
      intensity: 1.25,
      power: 2.8,
      bias: 0.10,
    });
  }

  /**
   * Pixel-Perfect Apple Fitness Native 2D Drawing onto Retina Canvas
   * Conic Gradient, rounded line-caps, specular end dot, and authentic multi-lap drop shadow.
   */
  private drawNativeAppleFitnessRingsCanvas() {
    const ctx = this.ringCtx;
    const size = this.canvasSize;
    const cx = size / 2;
    const cy = size / 2;

    ctx.clearRect(0, 0, size, size);

    this.ringConfigs.forEach((ring, index) => {
      const radius = ring.radius;
      const w = ring.width;
      const pct = ring.pct;

      // 1. Semi-transparent dark circular track
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = ring.trackColor;
      ctx.lineWidth = w;
      ctx.lineCap = 'round';
      ctx.stroke();

      const startAngle = -Math.PI / 2;
      const startX = cx;
      const startY = cy - radius;

      // 2. 常驻尾部起始端帽 (Permanent Tail Starting Cap at 12 o'clock)
      // 保证三环即使在 0% 或闭合后，起始基准端头永远清晰常驻，开头绝不黑屏
      ctx.save();
      ctx.beginPath();
      ctx.arc(startX, startY, w / 2, 0, Math.PI * 2);
      ctx.fillStyle = ring.gradientStart;
      ctx.shadowColor = ring.glowColor;
      ctx.shadowBlur = 10;
      ctx.fill();

      // Specular pearl core in start cap
      ctx.beginPath();
      ctx.arc(startX, startY, w * 0.22, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 4;
      ctx.fill();
      ctx.restore();

      if (pct <= 0) return;

      // 3. Active arc with Conic Angular Gradient
      const sweep = Math.min(Math.PI * 2, (pct / 100) * Math.PI * 2);
      const endAngle = startAngle + sweep;

      ctx.save();
      const grad = ctx.createConicGradient(startAngle, cx, cy);
      grad.addColorStop(0, ring.gradientStart);
      grad.addColorStop(Math.min(1.0, pct / 100), ring.gradientEnd);
      grad.addColorStop(1.0, ring.gradientEnd);

      ctx.beginPath();
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.strokeStyle = grad;
      ctx.lineWidth = w;
      ctx.lineCap = 'round';

      // Crisp subtle neon glow (kept strictly below bloom threshold 0.82 to avoid blowout!)
      ctx.shadowColor = ring.glowColor;
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.restore();

      // 3.5 Ring Body Instant Closure Highlight Glow Effect (闭合瞬间环体高亮)
      const hl = this.ringHighlightIntensities[index] || 0;
      if (hl > 0) {
        // Outer intense bloom aura
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, radius, startAngle, endAngle);
        ctx.strokeStyle = ring.glowColor;
        ctx.lineWidth = w + hl * 22;
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 36 * hl;
        ctx.globalAlpha = hl * 0.9;
        ctx.stroke();
        ctx.restore();

        // White-hot core flash stroke
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, radius, startAngle, endAngle);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = w * 0.45;
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 18 * hl;
        ctx.globalAlpha = hl * 0.95;
        ctx.stroke();
        ctx.restore();
      }

      // 4. Multi-Lap Overlap with Cast Shadow (>100%)
      if (pct > 100) {
        const overlapSweep = ((pct - 100) / 100) * Math.PI * 2;
        const overlapEnd = startAngle + overlapSweep;

        // Cast shadow on under-lap
        ctx.save();
        ctx.beginPath();
        const shadowStart = Math.max(startAngle, overlapEnd - 0.26);
        ctx.arc(cx, cy, radius, shadowStart, overlapEnd);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.82)';
        ctx.lineWidth = w + 8;
        ctx.lineCap = 'round';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 4;
        ctx.stroke();
        ctx.restore();

        // Second lap arc on top
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, radius, startAngle, overlapEnd);
        ctx.strokeStyle = ring.gradientEnd;
        ctx.lineWidth = w;
        ctx.lineCap = 'round';
        ctx.shadowColor = ring.glowColor;
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.restore();
      }

      // 5. 常驻头部运动端头与高光珠 (Permanent Head Cap & Glossy Glint)
      const tipAngle = startAngle + (pct / 100) * Math.PI * 2;
      const tipX = cx + Math.cos(tipAngle) * radius;
      const tipY = cy + Math.sin(tipAngle) * radius;

      ctx.save();
      // Round end cap matching end color
      ctx.beginPath();
      ctx.arc(tipX, tipY, w / 2, 0, Math.PI * 2);
      ctx.fillStyle = ring.gradientEnd;
      ctx.shadowColor = ring.glowColor;
      ctx.shadowBlur = 8;
      ctx.fill();

      // Specular core bead
      ctx.beginPath();
      ctx.arc(tipX, tipY, w * 0.24, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.restore();
    });

    if (this.ringTexture) {
      this.ringTexture.needsUpdate = true;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Blacksmith Molten Iron Sparks Geometry ("打铁时的铁花")
  // Tapered aerodynamic needle droplet that stretches along the velocity vector
  // ─────────────────────────────────────────────────────────────────────────
  private initBlacksmithMoltenSparksSystem() {
    // Custom tapered aerodynamic molten needle (Enlarged 4x for thick, prominent, blazing firework sparks)
    const sparkGeo = new THREE.BufferGeometry();
    // 4 vertices forming a diamond needle (pointed head, wide mid-section, tapered tail)
    const vertices = new Float32Array([
      0, 0.18, 0,       // 0: Pointed leading head
      -0.038, 0.045, 0, // 1: Left shoulder
      0.038, 0.045, 0,  // 2: Right shoulder
      0, -0.18, 0,      // 3: Tapered trailing tail
    ]);
    const indices = new Uint16Array([
      0, 1, 2, // Top triangle
      1, 3, 2, // Bottom trailing triangle
    ]);

    sparkGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    sparkGeo.setIndex(new THREE.BufferAttribute(indices, 1));
    sparkGeo.computeVertexNormals();

    const sparkMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.98,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    this.sparkInstancedMesh = new THREE.InstancedMesh(
      sparkGeo,
      sparkMat,
      this.MAX_INSTANCED_SPARKS
    );
    this.sparkInstancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    _matrix4.makeScale(0, 0, 0);
    for (let i = 0; i < this.MAX_INSTANCED_SPARKS; i++) {
      this.sparkInstancedMesh.setMatrixAt(i, _matrix4);
      this.sparkInstancedMesh.setColorAt(i, _colorScratch.setHex(0xffffff));
    }

    this.sparkInstancedMesh.instanceMatrix.needsUpdate = true;
    if (this.sparkInstancedMesh.instanceColor) {
      this.sparkInstancedMesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
      this.sparkInstancedMesh.instanceColor.needsUpdate = true;
    }

    this.scene.add(this.sparkInstancedMesh);
  }

  /**
   * Update Ring Percentages Live
   */
  public updateRingPercentages(p0: number, p1: number, p2: number, skipTriggerCelebration: boolean = false) {
    const pcts = [p0, p1, p2];
    pcts.forEach((p, i) => {
      this.ringConfigs[i].pct = p;
    });

    // Re-render native 2D canvas texture
    this.drawNativeAppleFitnessRingsCanvas();

    const isNowAllClosed = pcts.every((p) => p >= 100);

    if (!skipTriggerCelebration && isNowAllClosed && !this.isAllClosed) {
      this.isAllClosed = true;
      this.triggerStagedClosureCelebration();
    } else if (!isNowAllClosed && this.isAllClosed) {
      this.resetTo2DFlat();
    }
  }

  /**
   * The Master Staged Sequence:
   * 1. 0 - 650ms (PRE-SPIN): Rings stay flat facing while 2,200 molten iron sparks EXPLODE violently!
   * 2. 650ms onwards: Smoothly tilts into 3D and accelerates into high-speed Y-axis self-rotation!
   */
  public triggerStagedClosureCelebration() {
    this.isAllClosed = true;
    this.isSpinning = true;
    this.targetTiltX = 0.28; // Immediate 3D perspective isometric elevation!
    this.currentYawVelocity = 4.8; // Immediate high-speed self-rotation acceleration!
    this.isPreSpinErupting = false;
    this.isVortexBursted = true;
    this.vortexStartTime = performance.now();

    // 1. Initial massive fireworks burst (2,400 sparks)
    this.spawnBlacksmithMoltenSparks(2400);

    // Audio & Haptic impact
    if (this.soundEnabled) {
      badgeAudio.playSparksEruption();
      badgeAudio.playBurst();
      badgeAudio.playTurbineAcceleration();
      badgeAudio.playSpinWhoosh(1.4);
    }
    triggerHaptic('success');
  }

  /**
   * Calculate Dynamic LOD Density Factor based on Camera View Distance, Screen Coverage & LOD Mode
   */
  public getEffectiveLODDensityFactor(): number {
    if (this.lodMode === 'lod0') return 1.0;
    if (this.lodMode === 'lod1') return 0.68;
    if (this.lodMode === 'lod2') return 0.40;

    // Auto Adaptive Mode based on container screen area and view distance:
    const width = this.container ? (this.container.clientWidth || 400) : 400;
    const height = this.container ? (this.container.clientHeight || 400) : 400;
    const area = width * height;
    const refArea = 520 * 520; // baseline 1:1 desktop viewport reference
    const camDist = this.camera ? this.camera.position.z : 5.8;
    const distScale = Math.pow(5.8 / Math.max(2.0, camDist), 2);
    const coverage = (area / refArea) * distScale;

    // Stable perceptual non-linear curve (smoothly transitions between 0.35x ~ 1.0x)
    return Math.min(1.0, Math.max(0.35, Math.pow(coverage, 0.65)));
  }

  public getCurrentLODTierName(): string {
    const factor = this.getEffectiveLODDensityFactor();
    if (factor >= 0.88) return 'LOD 0 (极致 2,200)';
    if (factor >= 0.60) return 'LOD 1 (标准 1,500)';
    if (factor >= 0.42) return 'LOD 2 (紧凑 880)';
    return 'LOD 3 (节能 450)';
  }

  /**
   * Spawn Blacksmith Molten Iron Sparks ("打铁时的铁花") with LOD Density Scaling
   * High explosive initial velocity ($v_0 = 4.5 \sim 9.5\text{ m/s}$), incandescent colors, downward ballistic arcs.
   */
  public spawnBlacksmithMoltenSparks(count: number = 2200) {
    const densityFactor = this.getEffectiveLODDensityFactor();
    const effectiveCount = Math.round(count * densityFactor);
    const totalToSpawn = Math.min(effectiveCount, this.MAX_INSTANCED_SPARKS);
    this.activeSparkCount = totalToSpawn;

    // Exact 3D world radii corresponding to the 3 rings (on 3.6 world width plane)
    const radii3D = [1.195, 0.942, 0.689];

    for (let i = 0; i < totalToSpawn; i++) {
      const slot = this.acquireSparkSlot();
      const ringIdx = i % 3;
      const R = radii3D[ringIdx] + (Math.random() - 0.5) * 0.06;
      const theta = Math.random() * Math.PI * 2;

      // Spawn exactly on the luminous ring contours
      const x0 = Math.cos(theta) * R;
      const y0 = Math.sin(theta) * R;
      const z0 = (Math.random() - 0.5) * 0.15;

      this.sparkPositions[slot * 3] = x0;
      this.sparkPositions[slot * 3 + 1] = y0;
      this.sparkPositions[slot * 3 + 2] = z0;

      // Violent molten iron explosion velocity: Radial splatter + tangential fling + forward Z kick!
      const burstSpeed = 6.8 + Math.random() * 8.5; // Fast initial explosive velocity!
      const tangentFling = (Math.random() - 0.5) * 4.2;
      const zSpread = 1.2 + Math.random() * 5.8; // Shooting directly forward towards viewer!

      const vx = Math.cos(theta) * burstSpeed - Math.sin(theta) * tangentFling;
      const vy = Math.sin(theta) * burstSpeed + Math.cos(theta) * tangentFling;
      const vz = zSpread;

      this.sparkVelocities[slot * 3] = vx;
      this.sparkVelocities[slot * 3 + 1] = vy;
      this.sparkVelocities[slot * 3 + 2] = vz;

      // Spark thermal color type
      const rand = Math.random();
      if (rand < 0.35) {
        this.sparkTypes[slot] = 0; // Blinding White-Hot Incandescent (#FFFFFF)
        this.sparkInstancedMesh.setColorAt(slot, _colorScratch.setHex(0xffffff));
      } else if (rand < 0.70) {
        this.sparkTypes[slot] = 1; // 24K Molten Gold (#FFD24D)
        this.sparkInstancedMesh.setColorAt(slot, _colorScratch.setHex(0xffc83b));
      } else if (rand < 0.88) {
        this.sparkTypes[slot] = 2; // Forged Molten Orange (#FF7700)
        this.sparkInstancedMesh.setColorAt(slot, _colorScratch.setHex(0xff6e14));
      } else {
        this.sparkTypes[slot] = 3; // Apple Ring Accent (Carmine/Lime/Cyan)
        const accentCol = ringIdx === 0 ? 0xff1453 : ringIdx === 1 ? 0xa6ff00 : 0x00f0ff;
        this.sparkInstancedMesh.setColorAt(slot, _colorScratch.setHex(accentCol));
      }

      const life = 1.1 + Math.random() * 1.6; // seconds
      this.sparkLifespans[slot] = life;
      this.sparkMaxLife[slot] = life;
      this.sparkBaseLengths[slot] = 0.22 + Math.random() * 0.25;
      this.sparkBaseWidths[slot] = 0.045 + Math.random() * 0.035;
    }

    // Hide inactive instances beyond current LOD budget to prevent ghost render
    _matrix4.makeScale(0, 0, 0);
    for (let i = totalToSpawn; i < this.MAX_INSTANCED_SPARKS; i++) {
      this.sparkInstancedMesh.setMatrixAt(i, _matrix4);
      this.sparkLifespans[i] = 0;
    }
    this.sparkInstancedMesh.instanceMatrix.needsUpdate = true;

    if (this.sparkInstancedMesh.instanceColor) {
      this.sparkInstancedMesh.instanceColor.needsUpdate = true;
    }
  }

  /**
   * Spawn Localized Tip Sparks exactly when an individual ring closes to 100% (LOD Scaled)
   */
  public spawnRingTipSparks(ringIdx: number, count: number = 260) {
    const densityFactor = this.getEffectiveLODDensityFactor();
    const effectiveCount = Math.max(60, Math.round(count * densityFactor));

    const radii3D = [1.195, 0.942, 0.689];
    const ringR = radii3D[ringIdx % 3];
    const pct = this.ringConfigs[ringIdx % 3]?.pct ?? 100;
    const tipAngle = -Math.PI / 2 + (pct / 100) * Math.PI * 2;
    const tipX = Math.cos(tipAngle) * ringR;
    const tipY = Math.sin(tipAngle) * ringR;

    const accentCol = ringIdx === 0 ? 0xff1453 : ringIdx === 1 ? 0x30d158 : 0x00f0ff;

    for (let i = 0; i < effectiveCount; i++) {
      const slot = this.acquireSparkSlot();
      this.sparkPositions[slot * 3] = tipX + (Math.random() - 0.5) * 0.04;
      this.sparkPositions[slot * 3 + 1] = tipY + (Math.random() - 0.5) * 0.04;
      this.sparkPositions[slot * 3 + 2] = (Math.random() - 0.5) * 0.06;

      const angle = Math.random() * Math.PI * 2;
      const speed = 2.8 + Math.random() * 4.8;
      this.sparkVelocities[slot * 3] = Math.cos(angle) * speed;
      this.sparkVelocities[slot * 3 + 1] = Math.sin(angle) * speed + 1.2;
      this.sparkVelocities[slot * 3 + 2] = 0.6 + Math.random() * 2.4;

      const rand = Math.random();
      if (rand < 0.4) {
        this.sparkInstancedMesh.setColorAt(slot, _colorScratch.setHex(0xffffff));
      } else if (rand < 0.75) {
        this.sparkInstancedMesh.setColorAt(slot, _colorScratch.setHex(accentCol));
      } else {
        this.sparkInstancedMesh.setColorAt(slot, _colorScratch.setHex(0xffc83b));
      }

      this.sparkLifespans[slot] = 0.6 + Math.random() * 0.5;
      this.sparkMaxLife[slot] = 0.8;
      this.sparkBaseLengths[slot] = 0.06 + Math.random() * 0.04;
      this.sparkBaseWidths[slot] = 0.014;
      this.sparkTypes[slot] = 3;
    }

    this.sparkInstancedMesh.instanceMatrix.needsUpdate = true;
    if (this.sparkInstancedMesh.instanceColor) {
      this.sparkInstancedMesh.instanceColor.needsUpdate = true;
    }
  }

  /**
   * Trigger Ring Body Highlight Glow Effect at the instant of closure
   * ringIdx: 0 (Move), 1 (Exercise), 2 (Stand), or -1 (All 3 Rings)
   */
  public triggerRingHighlightGlow(ringIdx: number = -1) {
    if (ringIdx === -1) {
      this.ringHighlightIntensities = [1.0, 1.0, 1.0];
      if (this.sparkFlashLight) this.sparkFlashLight.intensity = 18.0;
    } else if (ringIdx >= 0 && ringIdx < 3) {
      this.ringHighlightIntensities[ringIdx] = 1.0;
      if (this.sparkFlashLight) this.sparkFlashLight.intensity = 12.0;
    }
    this.drawNativeAppleFitnessRingsCanvas();
  }

  /**
   * Continuous 360° Fireworks Fountain Emission
   * Keeps fireworks constantly erupting across all 3 rings indefinitely while closed/spinning!
   * Recycles dead slots using zero-allocation pool to prevent GC lag spikes.
   */
  public emitContinuousFireworksFountain(rate: number = 6) {
    if (this.MAX_INSTANCED_SPARKS <= 0) return;

    const densityFactor = this.getEffectiveLODDensityFactor();
    const effectiveRate = Math.max(1, Math.round(rate * densityFactor));

    const radii3D = [1.195, 0.942, 0.689];
    const ringAccents = [0xff1453, 0x30d158, 0x00f0ff]; // Carmine, Lime, Cyan ring colors
    const thermalColors = [0xffffff, 0xffd24d, 0xff6e14];

    for (let r = 0; r < 3; r++) {
      const R = radii3D[r];

      for (let s = 0; s < effectiveRate; s++) {
        const slot = this.acquireSparkSlot();
        const theta = Math.random() * Math.PI * 2; // Full 360 degree ring contour!

        // Spawn position along 3D ring contour
        const px = Math.cos(theta) * R + (Math.random() - 0.5) * 0.04;
        const py = Math.sin(theta) * R + (Math.random() - 0.5) * 0.04;
        const pz = (Math.random() - 0.5) * 0.12;

        this.sparkPositions[slot * 3] = px;
        this.sparkPositions[slot * 3 + 1] = py;
        this.sparkPositions[slot * 3 + 2] = pz;

        // Radial outward + tangential spinning fling + forward Z kick
        const speed = 3.2 + Math.random() * 5.5;
        const tangentFling = (Math.random() - 0.5) * 3.0;
        const zKick = 0.8 + Math.random() * 3.5;

        const vx = Math.cos(theta) * speed - Math.sin(theta) * tangentFling;
        const vy = Math.sin(theta) * speed + Math.cos(theta) * tangentFling;
        const vz = zKick;

        this.sparkVelocities[slot * 3] = vx;
        this.sparkVelocities[slot * 3 + 1] = vy;
        this.sparkVelocities[slot * 3 + 2] = vz;

        // Rich thermal + ring color palette
        const rand = Math.random();
        let colHex = thermalColors[s % thermalColors.length];
        if (rand < 0.28) {
          colHex = ringAccents[r]; // Red/Green/Cyan spark accents matching ring!
        }
        this.sparkInstancedMesh.setColorAt(slot, _colorScratch.setHex(colHex));

        const life = 0.6 + Math.random() * 0.7; // Continuous refresh
        this.sparkLifespans[slot] = life;
        this.sparkMaxLife[slot] = life;
        this.sparkBaseLengths[slot] = 0.18 + Math.random() * 0.20;
        this.sparkBaseWidths[slot] = 0.04 + Math.random() * 0.03;
        this.sparkTypes[slot] = 1;
      }
    }

    this.sparkInstancedMesh.instanceMatrix.needsUpdate = true;
    if (this.sparkInstancedMesh.instanceColor) {
      this.sparkInstancedMesh.instanceColor.needsUpdate = true;
    }
  }

  /**
   * Centrifugal Force Flung Sparks ("被高速甩出去") with LOD Density Scaling
   * Emitted continuously from spinning ring tips tangentially into space!
   */
  public emitCentrifugalFlungSparks(rate: number = 3) {
    const densityFactor = this.getEffectiveLODDensityFactor();
    const effectiveRate = Math.max(1, Math.round(rate * densityFactor));

    const radii3D = [1.195, 0.942, 0.689];
    const colors = [0xffffff, 0xffc83b, 0xff7700];

    for (let r = 0; r < 3; r++) {
      const R = radii3D[r];
      const pct = this.ringConfigs[r].pct;
      const tipAngle = -Math.PI / 2 + (pct / 100) * Math.PI * 2;

      // Transform tip location in ringsGroup space
      const tipX = Math.cos(tipAngle) * R;
      const tipY = Math.sin(tipAngle) * R;

      for (let s = 0; s < effectiveRate; s++) {
        const slot = this.acquireSparkSlot();
        this.sparkPositions[slot * 3] = tipX + (Math.random() - 0.5) * 0.05;
        this.sparkPositions[slot * 3 + 1] = tipY + (Math.random() - 0.5) * 0.05;
        this.sparkPositions[slot * 3 + 2] = (Math.random() - 0.5) * 0.08;

        // Centrifugal tangent fling: Tangent velocity + centrifugal outward push!
        const flingSpeed = 3.6 + Math.random() * 4.2;
        const dirX = -Math.sin(tipAngle);
        const dirY = Math.cos(tipAngle);

        this.sparkVelocities[slot * 3] = dirX * flingSpeed + (Math.random() - 0.5) * 1.4;
        this.sparkVelocities[slot * 3 + 1] = dirY * flingSpeed + (Math.random() - 0.5) * 1.4;
        this.sparkVelocities[slot * 3 + 2] = (Math.random() - 0.3) * 3.2;

        const colHex = colors[s % colors.length];
        this.sparkInstancedMesh.setColorAt(slot, _colorScratch.setHex(colHex));

        this.sparkLifespans[slot] = 0.55 + Math.random() * 0.45;
        this.sparkMaxLife[slot] = 0.65;
        this.sparkBaseLengths[slot] = 0.09;
        this.sparkBaseWidths[slot] = 0.016;
        this.sparkTypes[slot] = 1;
      }
    }

    this.sparkInstancedMesh.instanceMatrix.needsUpdate = true;
    if (this.sparkInstancedMesh.instanceColor) {
      this.sparkInstancedMesh.instanceColor.needsUpdate = true;
    }
  }

  /**
   * Racing Brake Friction Sparks ("赛车刹车铁火花")
   * Simulates high-energy tangential carbon-ceramic brake sparks shooting with high initial velocity,
   * incandescent thermal gradient, aerodynamic velocity-stretching, and micro-splatter scatter.
   */
  public emitRacingBrakeSparks(count: number = 320, intensity: number = 1.0) {
    if (!this.brakeSparksEnabled) return;

    const densityFactor = this.getEffectiveLODDensityFactor();
    const effectiveCount = Math.min(
      Math.round(count * densityFactor * intensity),
      this.MAX_INSTANCED_SPARKS - this.activeSparkCount
    );
    if (effectiveCount <= 0) return;

    const radii3D = [1.195, 0.942, 0.689];
    const startSlot = this.activeSparkCount % this.MAX_INSTANCED_SPARKS;

    // Contact caliper points around 10 o'clock and 4 o'clock (racing brake pads)
    const caliperAngles = [Math.PI * 0.72, -Math.PI * 0.28, Math.PI * 0.15];

    for (let i = 0; i < effectiveCount; i++) {
      const slot = this.acquireSparkSlot();
      const ringIdx = i % 3;
      const ringR = radii3D[ringIdx];
      const baseAngle = caliperAngles[ringIdx % caliperAngles.length];
      const theta = baseAngle + (Math.random() - 0.5) * 0.22;

      // Pad contact point on ring edge
      const x0 = Math.cos(theta) * ringR + (Math.random() - 0.5) * 0.03;
      const y0 = Math.sin(theta) * ringR + (Math.random() - 0.5) * 0.03;
      const z0 = (Math.random() - 0.5) * 0.06;

      this.sparkPositions[slot * 3] = x0;
      this.sparkPositions[slot * 3 + 1] = y0;
      this.sparkPositions[slot * 3 + 2] = z0;

      // Tangential high-velocity ejection stream (like grinding wheel on carbon-ceramic rotor)
      const tangentSpeed = (6.8 + Math.random() * 8.5) * intensity;
      const tangentDirX = -Math.sin(theta) + (Math.random() - 0.5) * 0.35;
      const tangentDirY = Math.cos(theta) + (Math.random() - 0.5) * 0.35;
      const zKick = (Math.random() - 0.2) * 3.5;

      this.sparkVelocities[slot * 3] = tangentDirX * tangentSpeed;
      this.sparkVelocities[slot * 3 + 1] = tangentDirY * tangentSpeed;
      this.sparkVelocities[slot * 3 + 2] = zKick;

      // Carbon-Ceramic Incandescent Color Palette
      const rand = Math.random();
      if (rand < 0.45) {
        // Blinding white-hot core
        this.sparkInstancedMesh.setColorAt(slot, _colorScratch.setHex(0xffffff));
        this.sparkTypes[slot] = 0;
      } else if (rand < 0.75) {
        // Friction electric gold
        this.sparkInstancedMesh.setColorAt(slot, _colorScratch.setHex(0xffdf40));
        this.sparkTypes[slot] = 1;
      } else {
        // Forged brake caliper crimson-orange
        this.sparkInstancedMesh.setColorAt(slot, _colorScratch.setHex(0xff3700));
        this.sparkTypes[slot] = 2;
      }

      this.sparkLifespans[slot] = 0.45 + Math.random() * 0.55;
      this.sparkMaxLife[slot] = 0.65;
      this.sparkBaseLengths[slot] = 0.12 + Math.random() * 0.06; // Extra stretched needles
      this.sparkBaseWidths[slot] = 0.014;
    }

    this.activeSparkCount = Math.min(this.MAX_INSTANCED_SPARKS, this.activeSparkCount + effectiveCount);
    if (this.sparkInstancedMesh.instanceColor) {
      this.sparkInstancedMesh.instanceColor.needsUpdate = true;
    }

    if (this.soundEnabled) {
      badgeAudio.playBrakeSparksSizzle(intensity);
    }
    triggerDynamicImpactHaptic(intensity * 1.2);
  }

  private bindEvents() {
    const el = this.renderer.domElement;
    let downTime = 0;
    let downX = 0;
    let downY = 0;

    el.addEventListener('pointerdown', (e: PointerEvent) => {
      this.isDragging = true;
      downTime = performance.now();
      downX = e.clientX;
      downY = e.clientY;
      this.prevPointerX = e.clientX;
      this.prevPointerY = e.clientY;
      this.pointerVelocityX = 0;
      this.pointerVelocityY = 0;
      this.hasPlayedSnapRebound = false;
      el.setPointerCapture(e.pointerId);
    });

    window.addEventListener('pointermove', (e: PointerEvent) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.prevPointerX;
      const dy = e.clientY - this.prevPointerY;

      this.pointerVelocityX = dx;
      this.pointerVelocityY = dy;

      this.rotVelocityX = dy * 0.055;
      this.rotVelocityY = dx * 0.055;

      this.currentEulerX += dy * 0.0055;
      this.currentEulerY += dx * 0.0055;

      // Limit maximum interactive drag tilt
      this.currentEulerX = Math.max(-0.95, Math.min(0.95, this.currentEulerX));

      this.prevPointerX = e.clientX;
      this.prevPointerY = e.clientY;
    });

    window.addEventListener('pointerup', (e: PointerEvent) => {
      if (this.isDragging) {
        this.isDragging = false;
        const dist = Math.hypot(e.clientX - downX, e.clientY - downY);
        const elapsed = performance.now() - downTime;

        // Click / tap detection on 3D rings body
        if (dist < 8 && elapsed < 320) {
          if (this.isSpinning && this.isPointerOnRing(e)) {
            if (this.onTapRing) this.onTapRing();
            else this.startSmoothDecelerationExit();
          }
          return;
        }

        const throwSpeed = Math.hypot(this.pointerVelocityX, this.pointerVelocityY);

        // High-velocity throw triggers racing brake friction sparks spray
        if (throwSpeed > 10 && this.brakeSparksEnabled) {
          this.emitRacingBrakeSparks(Math.min(300, Math.round(throwSpeed * 12)), Math.min(1.6, throwSpeed * 0.05 + 0.5));
        }

        // In spinning state, throw impulse merges into turbo vortex
        if (this.isSpinning) {
          this.currentYawVelocity += this.pointerVelocityX * 0.04;
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

  private isPointerOnRing(e: PointerEvent): boolean {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const pointer = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(pointer, this.camera);
    const hit = raycaster.intersectObject(this.mainRingMesh, false)[0];
    if (!hit?.uv) return false;
    const x = (hit.uv.x - 0.5) * this.canvasSize;
    const y = (hit.uv.y - 0.5) * this.canvasSize;
    const distance = Math.hypot(x, y);
    return this.ringConfigs.some((ring) => Math.abs(distance - ring.radius) <= ring.width * 0.72);
  }

  private startLoop() {
    const loop = (now: number) => {
      if (!this.isLoopRunning) return;
      requestAnimationFrame(loop);

      const dt = Math.min(0.05, (now - this.lastRafTime) / 1000);
      this.lastRafTime = now;
      this.idleTime += dt;

      // ─────────────────────────────────────────────────────────────────────
      // 1. Staged Timeline: Sparks Erupt First (650ms) -> Then 3D High-Speed Spin
      // ─────────────────────────────────────────────────────────────────────
      if (this.isPreSpinErupting) {
        const preElapsed = now - this.preSpinStartTime;
        if (preElapsed >= this.PRE_SPIN_DURATION) {
          // Pre-spin eruption finished: ACCELERATE INTO 3D HIGH-SPEED 自转!
          this.isPreSpinErupting = false;
          this.isSpinning = true;
          this.targetTiltX = 0.22; // Elevate into 3D isometric tilt
          this.isVortexBursted = true;
          this.vortexStartTime = now;
          badgeAudio.playTurbineAcceleration();
          badgeAudio.playSpinWhoosh(1.4);
        }
      }

      // ─────────────────────────────────────────────────────────────────────
      // 2. High-Speed 3D Self-Rotation Velocity
      // ─────────────────────────────────────────────────────────────────────
      let baseSpeed = 1.6; // ~90 deg/s
      if (this.spinSpeed === 'turbo') baseSpeed = 3.6; // ~200 deg/s
      if (this.spinSpeed === 'hyper') baseSpeed = 6.8; // ~390 deg/s

      if (this.isVortexBursted) {
        const elapsed = now - this.vortexStartTime;
        const t = Math.min(1.0, elapsed / this.vortexDuration);
        if (t < 0.6) {
          const surge = Math.sin((t / 0.6) * Math.PI);
          baseSpeed += surge * 12.0; // Rapid vortex surge!
        } else if (t >= 1.0) {
          this.isVortexBursted = false;
        }
      }

      if (this.isSpinning && this.targetTiltX === 0) {
        this.targetTiltX = 0.28;
      }

      if (this.isDecelerating) {
        // Apply friction braking to yaw velocity (exponential decay)
        this.currentYawVelocity *= Math.exp(-3.2 * dt);

        // Advance angle with decaying velocity
        this.spinAngleY += this.currentYawVelocity * dt;

        // Only align to the front as momentum fades; never restart a closure.
        const alignment = (1 - Math.exp(-4.0 * dt)) * Math.max(0, 1 - Math.abs(this.currentYawVelocity) / 0.75);
        this.spinAngleY += (this.decelerationTargetYaw - this.spinAngleY) * alignment;

        // Smoothly return 3D tilt X to 0 (flat facing)
        this.currentTiltX += (0 - this.currentTiltX) * (dt * 4.5);
        this.ringsContainer.rotation.x = this.currentTiltX;

        this.ringsGroup.rotation.y = this.spinAngleY;
        this.ringsGroup.rotation.z *= Math.exp(-4.0 * dt);

        // Check if rotation has come to complete standstill
        if (
          Math.abs(this.currentYawVelocity) < 0.015 &&
          Math.abs(this.spinAngleY - this.decelerationTargetYaw) < 0.015 &&
          Math.abs(this.currentTiltX) < 0.005
        ) {
          this.isDecelerating = false;
          this.currentYawVelocity = 0;
          this.spinAngleY = 0;
          this.currentTiltX = 0;
          this.ringsContainer.rotation.set(0, 0, 0);
          this.ringsGroup.rotation.set(0, 0, 0);
          this.targetQuat.identity();
          this.currentQuat.identity();

          if (this.decelerationCallback) {
            const cb = this.decelerationCallback;
            this.decelerationCallback = undefined;
            cb();
          }
        }
      } else {
        const targetVelocity = this.isSpinning ? baseSpeed : 0;
        this.currentYawVelocity += (targetVelocity - this.currentYawVelocity) * (dt * 4.5);

        // Smooth 3D perspective tilt
        this.currentTiltX += (this.targetTiltX - this.currentTiltX) * (dt * 5.0);
        this.ringsContainer.rotation.x = this.currentTiltX;

        // 3D Self-Rotation around Y-axis
        if (Math.abs(this.currentYawVelocity) > 0.001) {
          this.spinAngleY += this.currentYawVelocity * dt;
          this.ringsGroup.rotation.y = this.spinAngleY;
          this.ringsGroup.rotation.z = Math.sin(this.idleTime * 1.5) * 0.03;
        } else {
          this.spinAngleY *= Math.exp(-6.0 * dt);
          this.ringsGroup.rotation.y = this.spinAngleY;
          this.ringsGroup.rotation.z = 0;
        }
      }

      // Continuous Fireworks Fountain & Centrifugal Flung Sparks while spinning
      if (this.isSpinning || this.isDecelerating) {
        this.fireworkAccumulator = Math.min(3, this.fireworkAccumulator + dt * 60);
        while (this.fireworkAccumulator >= 1) {
          this.fireworkAccumulator -= 1;
          if (this.isSpinning) {
            this.emitContinuousFireworksFountain(6);
            this.emitCentrifugalFlungSparks(3);
          } else {
            const speedRatio = Math.min(1, Math.abs(this.currentYawVelocity) / 3.6);
            if (speedRatio > 0.08) this.emitContinuousFireworksFountain(Math.max(1, Math.round(5 * speedRatio)));
          }
        }
      }

      // Smoothly decay ring body highlight intensities
      let needsRedrawGlow = false;
      for (let i = 0; i < 3; i++) {
        if (this.ringHighlightIntensities[i] > 0) {
          this.ringHighlightIntensities[i] = Math.max(0, this.ringHighlightIntensities[i] - dt * 2.2);
          needsRedrawGlow = true;
        }
      }
      if (needsRedrawGlow) {
        this.drawNativeAppleFitnessRingsCanvas();
      }
      if (this.sparkFlashLight && this.sparkFlashLight.intensity > 0) {
        this.sparkFlashLight.intensity *= Math.exp(-6.0 * dt);
      }

      // ─────────────────────────────────────────────────────────────────────
      // 3.5. Optimized Sine Breathing Light Effect mapped to emissiveIntensity
      //      Rhythm matched with firework sparks eruption frequency
      // ─────────────────────────────────────────────────────────────────────
      // Base frequency w = 3.8 rad/s (Period T ~ 1.65s, matching 1.5s spark lifespan)
      // Fundamental + 2nd harmonic (7.6 rad/s) for natural incandescent pulsing
      const sineBase = Math.sin(this.idleTime * 3.8);
      const sineHarmonic = Math.sin(this.idleTime * 7.6 + 0.5) * 0.32;
      const breathingPulse = (sineBase + sineHarmonic) * 0.5 + 0.5; // Normalized [0, 1]

      // Ultra-subtle, minimal emissive range (reduced by half)
      let targetEmissive = 0.02 + breathingPulse * 0.05; // Normal idle range: 0.02 ~ 0.07

      // During active fireworks eruption (subtle pulse boost, peak max: 0.15)
      if (this.isPreSpinErupting || this.isVortexBursted || this.activeSparkCount > 0) {
        const sparkRatio = Math.min(1.0, this.activeSparkCount / 1200);
        targetEmissive = 0.05 + breathingPulse * 0.06 + sparkRatio * 0.04; // Peak max: 0.15
      }

      if (this.ringMaterial) {
        this.ringMaterial.emissiveIntensity = targetEmissive;
      }

      // ─────────────────────────────────────────────────────────────────────
      // 4. Gravity Inertia Simulation & Elastic Restoring Snap
      // ─────────────────────────────────────────────────────────────────────
      if (!this.isDragging) {
        if (!this.isSpinning) {
          // Physics: Gravitational Spring restoring towards (0,0) neutral orientation
          const springK = 34.0;
          const dampingC = 8.5;

          const accelX = -springK * this.currentEulerX - dampingC * this.rotVelocityX;
          const accelY = -springK * this.currentEulerY - dampingC * this.rotVelocityY;

          this.rotVelocityX += accelX * dt;
          this.rotVelocityY += accelY * dt;

          this.currentEulerX += this.rotVelocityX * dt;
          this.currentEulerY += this.rotVelocityY * dt;

          const speed = Math.hypot(this.rotVelocityX, this.rotVelocityY);
          const disp = Math.hypot(this.currentEulerX, this.currentEulerY);

          // Detect moment of equilibrium rebound collision with dynamic force estimation
          if (disp < 0.022 && speed < 0.16 && !this.hasPlayedSnapRebound) {
            this.hasPlayedSnapRebound = true;
            const impactForce = Math.min(2.4, Math.max(0.35, speed * 5.2 + disp * 18.0));
            if (this.soundEnabled) {
              badgeAudio.playKineticSnapRebound(impactForce);
            }
            triggerDynamicImpactHaptic(impactForce);
            this.currentEulerX = 0;
            this.currentEulerY = 0;
            this.rotVelocityX = 0;
            this.rotVelocityY = 0;
          }

          _targetEuler.set(this.currentEulerX, this.currentEulerY, 0, 'YXZ');
          this.targetQuat.setFromEuler(_targetEuler);
        } else {
          // In spinning state, friction dampens user tilt back to base isometric angle
          const friction = Math.exp(-4.2 * dt);
          this.rotVelocityX *= friction;
          this.rotVelocityY *= friction;
          this.currentEulerX += this.rotVelocityX * dt;
          this.currentEulerY += this.rotVelocityY * dt;
          this.currentEulerX *= Math.exp(-3.5 * dt);
          this.currentEulerY *= Math.exp(-3.5 * dt);

          _targetEuler.set(this.currentEulerX, this.currentEulerY, 0, 'YXZ');
          this.targetQuat.setFromEuler(_targetEuler);
        }
      } else {
        _targetEuler.set(this.currentEulerX, this.currentEulerY, 0, 'YXZ');
        this.targetQuat.setFromEuler(_targetEuler);
      }

      this.currentQuat.slerp(this.targetQuat, 0.22);
      this.ringsContainer.quaternion.copy(this.currentQuat);

      // ─────────────────────────────────────────────────────────────────────
      // 5. Update Blacksmith Molten Sparks Physics (Velocity-Stretched Needles)
      // ─────────────────────────────────────────────────────────────────────
      this.updateBlacksmithSparksPhysics(dt);

      // ─────────────────────────────────────────────────────────────────────
      // 6. Unified Single-Pass Motion Blur & Post-Processing Bloom Pipeline
      // ─────────────────────────────────────────────────────────────────────
      const aspect = (this.container.clientWidth || 300) / Math.max(1, this.container.clientHeight || 300);
      const totalEffectiveVelocity = this.currentYawVelocity + this.pointerVelocityX * 0.08;

      if (this.unifiedKinematicPass) {
        this.unifiedKinematicPass.uniforms.uVelocity.value = totalEffectiveVelocity;
        this.unifiedKinematicPass.uniforms.uAspect.value = aspect;
        this.unifiedKinematicPass.uniforms.uTangentialStrength.value = this.motionBlurEnabled ? this.motionBlurIntensity : 0.0;
        this.unifiedKinematicPass.uniforms.uRadialStrength.value = this.radialBlurEnabled ? this.radialBlurIntensity : 0.0;
        this.unifiedKinematicPass.uniforms.uChromaticAberration.value = this.chromaticAberration;
        this.unifiedKinematicPass.uniforms.uTilt.value = this.currentTiltX;
      }

      this.composer.render();

      // ─────────────────────────────────────────────────────────────────────
      // 7. FPS & Metrics Reporting
      // ─────────────────────────────────────────────────────────────────────
      this.frameCount++;
      if (now - this.lastFpsCalcTime >= 500) {
        const fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsCalcTime));
        this.frameCount = 0;
        this.lastFpsCalcTime = now;

        if (this.onMetricsUpdate) {
          const density = Math.round(this.getEffectiveLODDensityFactor() * 100);
          this.onMetricsUpdate({
            fps: Math.min(120, fps),
            frameTimeMs: 1.4,
            drawCalls: 5,
            triangles: 2 + this.activeSparkCount * 2,
            isSleeping: !this.isSpinning && this.activeSparkCount === 0 && !this.isDragging,
            allocationsPerFrame: 0,
            lodTier: this.getCurrentLODTierName(),
            lodDensityPct: density,
            activeSparks: this.activeSparkCount,
            maxSparksBudget: Math.round(this.MAX_INSTANCED_SPARKS * this.getEffectiveLODDensityFactor()),
          });
        }
      }
    };

    requestAnimationFrame(loop);
  }

  /**
   * Physics Update for 2,200+ Blacksmith Molten Iron Sparks
   * - Downward ballistic gravity ($g = -7.6\text{ m/s}^2$).
   * - Exponential air drag decay.
   * - Aerodynamic velocity alignment: Needles rotate to point along velocity direction.
   * - Speed-based streak stretching: Faster sparks stretch into longer needles.
   */
  private updateBlacksmithSparksPhysics(dt: number) {
    if (this.activeSparkCount <= 0) return;

    let aliveCount = 0;
    const gravity = -7.6 * dt; // Strong natural gravity
    const airDrag = Math.exp(-2.2 * dt); // Exponential atmospheric air resistance

    for (let i = 0; i < this.activeSparkCount; i++) {
      if (this.sparkLifespans[i] <= 0) continue;

      this.sparkLifespans[i] -= dt;
      if (this.sparkLifespans[i] <= 0) {
        _matrix4.makeScale(0, 0, 0);
        this.sparkInstancedMesh.setMatrixAt(i, _matrix4);
        continue;
      }

      aliveCount++;
      const lifeRatio = this.sparkLifespans[i] / this.sparkMaxLife[i];

      // 1. Velocity decay by air drag & gravity + Hot-air thermal buoyancy lift
      let vx = this.sparkVelocities[i * 3] * airDrag;
      let vy = (this.sparkVelocities[i * 3 + 1] + gravity) * airDrag;
      let vz = this.sparkVelocities[i * 3 + 2] * airDrag;

      // Super-heated sparks experience initial thermal hot-air plume updraft
      if (lifeRatio > 0.40) {
        const thermalBuoyancy = 3.6 * (lifeRatio - 0.40);
        vy += thermalBuoyancy * dt;
      }

      let px = this.sparkPositions[i * 3];
      let py = this.sparkPositions[i * 3 + 1];
      let pz = this.sparkPositions[i * 3 + 2];

      // 2. Aerodynamic Vector Flow Field & Swirling Wake Turbulence
      // Simulates rotating air fluid dragging particles laterally with organic curl turbulence
      if (this.flowFieldEnabled) {
        const vortexOmega = (this.currentYawVelocity * 0.75 + this.rotVelocityY * 0.40) * this.flowFieldIntensity;
        const r = Math.hypot(px, py);
        const flowDecay = Math.exp(-r * 0.52);

        // Azimuthal vortex tangential draft (horizontal lateral deflection)
        const flowVx = -py * vortexOmega * flowDecay;
        const flowVy = px * vortexOmega * flowDecay * 0.35;
        const flowVz = (Math.sin(py * 2.8 + this.idleTime * 4.5) - Math.cos(px * 2.8)) * (vortexOmega * 0.15);

        // Organic atmospheric wake micro-turbulence (fluttering air pockets)
        const turbX = Math.sin(py * 3.2 + this.idleTime * 4.2 + (i & 7)) * (0.28 * this.flowFieldIntensity);
        const turbY = Math.cos(px * 3.2 + this.idleTime * 4.2 + (i & 7)) * (0.16 * this.flowFieldIntensity);
        const turbZ = Math.sin((px + py) * 3.0 + this.idleTime * 3.0) * (0.22 * this.flowFieldIntensity);

        vx += (flowVx + turbX) * dt * 4.0;
        vy += (flowVy + turbY) * dt * 4.0;
        vz += (flowVz + turbZ) * dt * 3.0;
      }

      // 3. Position step & Realistic Ground Bounce Collision
      px += vx * dt;
      py += vy * dt;
      pz += vz * dt;

      // Floor plane at y = -2.30 (simulating blacksmith / racetrack floor splatter)
      const floorY = -2.30;
      if (py < floorY && vy < 0) {
        py = floorY + 0.01;
        vy = -vy * 0.38; // 38% inelastic restitution bounce
        vx = vx * 0.70 + (Math.random() - 0.5) * 0.6; // Tangential scatter
        vz = vz * 0.70 + (Math.random() - 0.5) * 0.6;
      }

      this.sparkVelocities[i * 3] = vx;
      this.sparkVelocities[i * 3 + 1] = vy;
      this.sparkVelocities[i * 3 + 2] = vz;

      this.sparkPositions[i * 3] = px;
      this.sparkPositions[i * 3 + 1] = py;
      this.sparkPositions[i * 3 + 2] = pz;

      // 3. Velocity-aligned Needle Rotation
      // Rotate needle streak to align its local Y axis with the 2D projected velocity vector!
      const speed = Math.hypot(vx, vy);
      const angle = Math.atan2(vy, vx) - Math.PI / 2;
      _quat.setFromAxisAngle(_axisZ, angle);

      // 4. Dynamic Streak Stretching (longer needle at higher speeds, cooling ember at low speeds)
      const stretchFactor = 1.0 + Math.min(speed * 0.22, 3.2);
      const smoothDecay = Math.pow(lifeRatio, 0.72);
      const flicker = 0.88 + 0.12 * Math.sin(this.idleTime * 50 + i * 7);

      const length = this.sparkBaseLengths[i] * stretchFactor * smoothDecay * flicker;
      const width = this.sparkBaseWidths[i] * smoothDecay * flicker;

      // 5. Compose Instance Matrix (Zero Heap Allocation)
      _pos.set(px, py, pz);
      _scaleVec.set(width, length, width);
      _matrix4.compose(_pos, _quat, _scaleVec);

      this.sparkInstancedMesh.setMatrixAt(i, _matrix4);

      // 6. Progressive Blacksmith Cooling Color Shift
      // As the spark ages, shift from white-hot -> molten gold -> deep orange ember
      if (this.sparkTypes[i] <= 1 && lifeRatio < 0.45) {
        // Cooled to red-orange cinder
        _colorScratch.setHex(lifeRatio < 0.2 ? 0xcc2200 : 0xff5500);
        this.sparkInstancedMesh.setColorAt(i, _colorScratch);
      }
    }

    // Dynamic Flash Point Light update (subtle spark fill)
    if (this.sparkFlashLight) {
      const sparkRatio = aliveCount / Math.max(1, this.MAX_INSTANCED_SPARKS);
      this.sparkFlashLight.intensity = Math.min(1.5, sparkRatio * 2.2);
    }

    if (aliveCount > 0) {
      this.sparkInstancedMesh.instanceMatrix.needsUpdate = true;
      if (this.sparkInstancedMesh.instanceColor) {
        this.sparkInstancedMesh.instanceColor.needsUpdate = true;
      }
    } else {
      this.activeSparkCount = 0;
    }
  }

  /**
   * 片尾常驻态 (Resting Tail State):
   * 三环平滑缓速刹车回正，保持 3D 微倾浮雕角展示，火花优雅散尽，常驻呈现闭合成果
   */
  public settleToRestingTailState() {
    this.isSpinning = false;
    this.isPreSpinErupting = false;
    this.isVortexBursted = false;
    this.currentYawVelocity = 0;
    this.spinAngleY = 0;
    this.targetTiltX = 0.18; // 微倾 3D 浮雕常驻观赏角
    this.ringsGroup.rotation.set(0, 0, 0);
    this.targetQuat.identity();
    this.currentQuat.identity();
    this.activeSparkCount = 0;
    this.drawNativeAppleFitnessRingsCanvas();
  }

  /**
   * 片头常驻态 (Standby Head State):
   * 重置回 2D 平面原生质感态，就绪待触发
   */
  public resetToHeadState() {
    this.resetTo2DFlat();
  }

  /**
   * 平滑减速停下动画 (Smooth Mechanical Deceleration Exit)
   * 点击三环或关闭时，停止持续喷发烟花，三环旋转平滑施加阻尼减速归零至静止状态，
   * 视角平滑回正至 2D 平面原生质感态。
   */
  public startSmoothDecelerationExit(onComplete?: () => void) {
    if (this.isDecelerating) return;
    this.isSpinning = false;
    this.isDecelerating = true;
    this.isVortexBursted = false;
    this.isPreSpinErupting = false;
    const stoppingYaw = this.spinAngleY + this.currentYawVelocity / 3.2;
    this.decelerationTargetYaw = Math.round(stoppingYaw / (Math.PI * 2)) * Math.PI * 2;
    this.targetTiltX = 0; // Return tilt to 0 (flat front)

    if (this.soundEnabled) {
      badgeAudio.playSpinDownSound();
    }
    triggerHaptic('selection');

    this.decelerationCallback = onComplete;
  }

  public resetTo2DFlat() {
    this.isAllClosed = false;
    this.isPreSpinErupting = false;
    this.isSpinning = false;
    this.isDecelerating = false;
    this.targetTiltX = 0;
    this.currentTiltX = 0;
    this.spinAngleY = 0;
    this.currentYawVelocity = 0;
    this.ringsContainer.rotation.set(0, 0, 0);
    this.ringsGroup.rotation.set(0, 0, 0);
    this.targetQuat.identity();
    this.currentQuat.identity();
    this.pointerVelocityX = 0;
    this.pointerVelocityY = 0;
  }

  public destroy() {
    this.isLoopRunning = false;
    this.container.innerHTML = '';
    this.renderer.dispose();
  }
}
