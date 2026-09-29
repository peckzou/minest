/**
 * Optimized Apple Fitness Pending Badge Scene (Three.js GPU 120 FPS)
 *
 * Implements:
 * 1. Large 3D Mystery Badge floating in center of Badge Wall
 * 2. Authentic Apple Fitness convex hexagonal 3D metal blank (外凸六边形金属胚体):
 *    - Real thickness with brushed titanium side wall
 *    - Razor mirror chamfer bevels (front & back)
 *    - Convex curved domed surface (轻微外凸曲面)
 *    - Liquid Glass refractive outer layer (fresnel & mobile specular glints)
 *    - Zero identity leak (pure unrevealed blank craft)
 * 3. Heavy Physical Collectible Levitation (实体重量悬浮):
 *    - Slow vertical float + subtle left-right sway + gentle pitch tilt
 *    - Organic multi-frequency harmonic physics (NOT fast spinning)
 *    - Liquid glass & chamfer highlights sweep across the convex surface
 *    - Pointer & touch parallax inspection with spring damping
 * 4. Apple Fitness Badge Wall background:
 *    - Frosted / out-of-focus background grid of past awards
 *    - Central illuminated empty docking socket waiting for this award
 *    - Reverse spatial parallax separation
 * 5. Restrained Soft Glow (极其克制的微光氛围):
 *    - Slow breathing ethereal radial aura (opacity 0.18 - 0.32)
 *    - Floating cinematic ambient dust motes
 */

import * as THREE from 'three';
import { AppleAwardMaterials } from './AppleAwardMaterials';
import { buildApplePendingConvexHexBlank } from './BadgeGeometries';
import { PerformanceMetrics } from './OptimizedBadgeInspectorScene';

export type PhysicalMassPreset = 'titanium-heavy' | 'apple-standard' | 'light-float';

export interface PendingSceneOptions {
  onMetricsUpdate?: (mats: PerformanceMetrics) => void;
  sharedMaterials?: AppleAwardMaterials;
}

export class OptimizedPendingBadgeScene {
  private container: HTMLElement;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private reqId: number | null = null;
  private isDestroyed = false;

  // Materials & Geometry
  private mats: AppleAwardMaterials;
  private badgeGroup!: THREE.Group;
  private badgeBlankMesh!: THREE.Group;
  private badgeWallGroup!: THREE.Group;
  private softGlowMesh!: THREE.Mesh;
  private dustPoints!: THREE.Points;

  // Lights
  private keyLight!: THREE.DirectionalLight;
  private rimLight!: THREE.DirectionalLight;
  private movingHighlightLight!: THREE.PointLight;
  private fillLight!: THREE.DirectionalLight;

  // Physical Parameters & State
  public massPreset: PhysicalMassPreset = 'apple-standard';
  public showBadgeWall = true;
  public enableParallax = true;
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragRotX = 0;
  private dragRotY = 0;
  private targetDragRotX = 0;
  private targetDragRotY = 0;

  // Mouse / Pointer Parallax
  private mouseX = 0;
  private mouseY = 0;
  private targetTiltX = 0;
  private targetTiltY = 0;
  private currentTiltX = 0;
  private currentTiltY = 0;

  // Tactile Spring Recoil
  private recoilZ = 0;
  private recoilVelZ = 0;
  private recoilPitch = 0;
  private recoilVelPitch = 0;

  // Metrics tracking
  private onMetricsUpdate?: (m: PerformanceMetrics) => void;
  private frameCount = 0;
  private lastFpsTime = performance.now();
  private currentFps = 120;
  private frameTimeMs = 8.33;

  constructor(container: HTMLElement, options: PendingSceneOptions = {}) {
    this.container = container;
    this.onMetricsUpdate = options.onMetricsUpdate;
    this.mats = options.sharedMaterials || new AppleAwardMaterials();

    this.initScene();
    this.initBadgeWall();
    this.initPendingBadge();
    this.initAtmosphericEffects();
    this.initInteraction();
    this.startLoop();
  }

  private initScene(): void {
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 600;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x07090d);

    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    this.camera.position.set(0, 0, 6.2);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;

    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // Studio Lighting Rig
    const ambient = new THREE.AmbientLight(0xffffff, 0.65);
    this.scene.add(ambient);

    // Key softbox light top-right (casts razor highlights across convex chamfers)
    this.keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    this.keyLight.position.set(3.8, 4.2, 5.0);
    this.scene.add(this.keyLight);

    // Cool platinum rim light left (accentuates thickness & filleted corners)
    this.rimLight = new THREE.DirectionalLight(0xc2e2ff, 1.25);
    this.rimLight.position.set(-4.5, -1.2, 3.5);
    this.scene.add(this.rimLight);

    // Dynamic specular tracking light (glides along liquid glass curvature)
    this.movingHighlightLight = new THREE.PointLight(0xffffff, 1.3, 10, 1.8);
    this.movingHighlightLight.position.set(1.5, 2.0, 3.2);
    this.scene.add(this.movingHighlightLight);

    // Warm bounce reflector from below
    this.fillLight = new THREE.DirectionalLight(0xffecd1, 0.45);
    this.fillLight.position.set(0, -4.0, 3.0);
    this.scene.add(this.fillLight);

    window.addEventListener('resize', this.handleResize);
  }

  /**
   * Builds the authentic Apple Fitness Badge Wall in the background
   * Out of focus, darkened, with an illuminated docking recess in the center
   */
  private initBadgeWall(): void {
    this.badgeWallGroup = new THREE.Group();
    this.badgeWallGroup.position.set(0, 0, -3.2);
    this.scene.add(this.badgeWallGroup);

    // Dark slate background plane
    const wallBgGeo = new THREE.PlaneGeometry(16, 12);
    const wallBgMat = new THREE.MeshStandardMaterial({
      color: 0x090c12,
      roughness: 0.85,
      metalness: 0.2,
    });
    const wallBgMesh = new THREE.Mesh(wallBgGeo, wallBgMat);
    wallBgMesh.position.z = -0.1;
    this.badgeWallGroup.add(wallBgMesh);

    // Grid of past earned badges (dimmed, frosted, authentic Apple Awards)
    const cols = 5;
    const rows = 3;
    const spacingX = 2.45;
    const spacingY = 2.15;
    const startX = -((cols - 1) * spacingX) * 0.5;
    const startY = ((rows - 1) * spacingY) * 0.5;

    // Palette of muted past achievements
    const pastAwardTints = [
      0x30d158, 0x0a84ff, 0xff9f0a, 0xff375f, 0xbf5af2,
      0x5e5ce6, 0x64d2ff, 0xffd60a, 0x32d74b, 0xff453a,
      0x64d2ff, 0xac8e68, 0x0a84ff, 0x30d158, 0xff9f0a,
    ];

    let badgeIdx = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Skip center slot (row 1, col 2) - this is the vacant docking socket for our pending badge!
        if (r === 1 && c === 2) {
          this.buildCentralEmptyDockSocket();
          continue;
        }

        const x = startX + c * spacingX;
        const y = startY - r * spacingY;
        const tint = pastAwardTints[badgeIdx % pastAwardTints.length];
        badgeIdx++;

        const pastBadge = this.createMutedWallBadge(tint);
        pastBadge.position.set(x, y, 0);
        this.badgeWallGroup.add(pastBadge);
      }
    }
  }

  /**
   * Central illuminated empty docking socket on Badge Wall
   * Shows where this pending badge will dock once claimed
   */
  private buildCentralEmptyDockSocket(): void {
    const dockGroup = new THREE.Group();
    dockGroup.position.set(0, 0, 0);

    // Frosted recessed hexagonal pedestal
    const recessGeo = new THREE.RingGeometry(1.4, 1.68, 6);
    const recessMat = new THREE.MeshStandardMaterial({
      color: 0x141b24,
      roughness: 0.6,
      metalness: 0.5,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.08,
    });
    const recessMesh = new THREE.Mesh(recessGeo, recessMat);
    dockGroup.add(recessMesh);

    // Glowing target alignment ring
    const ringGeo = new THREE.RingGeometry(1.65, 1.70, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x5a718c,
      transparent: true,
      opacity: 0.45,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.z = 0.005;
    dockGroup.add(ringMesh);

    // Concentric dotted alignment circle
    const innerRingGeo = new THREE.RingGeometry(0.85, 0.87, 48);
    const innerRingMat = new THREE.MeshBasicMaterial({
      color: 0x3d4d61,
      transparent: true,
      opacity: 0.35,
    });
    const innerRingMesh = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerRingMesh.position.z = 0.005;
    dockGroup.add(innerRingMesh);

    // Subtle soft center back-light
    const dockLight = new THREE.PointLight(0xa5c9eb, 0.6, 4.5, 2.0);
    dockLight.position.set(0, 0, 0.4);
    dockGroup.add(dockLight);

    this.badgeWallGroup.add(dockGroup);
  }

  /**
   * Creates a dimmed, out-of-focus past badge for the background wall
   */
  private createMutedWallBadge(hexColor: number): THREE.Group {
    const group = new THREE.Group();

    // Outer muted bezel
    const bezelGeo = new THREE.TorusGeometry(0.82, 0.06, 12, 32);
    const bezelMat = new THREE.MeshStandardMaterial({
      color: 0x4a5568,
      roughness: 0.4,
      metalness: 0.7,
    });
    const bezelMesh = new THREE.Mesh(bezelGeo, bezelMat);
    group.add(bezelMesh);

    // Inner enamel disc (dimmed)
    const dishGeo = new THREE.CircleGeometry(0.8, 32);
    const dishMat = new THREE.MeshStandardMaterial({
      color: hexColor,
      roughness: 0.35,
      metalness: 0.25,
      transparent: true,
      opacity: 0.45, // Dimmed to stay strictly in background
    });
    const dishMesh = new THREE.Mesh(dishGeo, dishMat);
    dishMesh.position.z = -0.01;
    group.add(dishMesh);

    return group;
  }

  /**
   * Large 3D Mystery Badge floating in center
   * Authentic Apple Fitness convex hexagonal 3D blank
   */
  private initPendingBadge(): void {
    this.badgeGroup = new THREE.Group();
    this.badgeGroup.name = 'pending-badge-floating-root';
    this.badgeGroup.position.set(0, 0, 0.85); // Elevated towards camera
    this.scene.add(this.badgeGroup);

    // Construct the authentic Apple filleted convex hexagonal blank
    this.badgeBlankMesh = buildApplePendingConvexHexBlank(this.mats, {
      rHex: 1.62,
      thickness: 0.23,
      domeHeight: 0.085,
    });
    this.badgeGroup.add(this.badgeBlankMesh);

    // Gentle initial presentation angle (natural 3D rest posture)
    this.badgeGroup.rotation.x = 0.06;
    this.badgeGroup.rotation.y = -0.05;
  }

  /**
   * Atmospheric Effects:
   * 1. Extremely restrained breathing soft glow behind badge
   * 2. Tiny drifting ambient light motes
   */
  private initAtmosphericEffects(): void {
    // 1. Restrained Soft Glow Halo (Behind floating badge)
    // Generates a silky smooth Gaussian radial falloff canvas texture
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 256;
    glowCanvas.height = 256;
    const ctx = glowCanvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
      grad.addColorStop(0, 'rgba(226, 238, 255, 0.42)');
      grad.addColorStop(0.25, 'rgba(186, 214, 245, 0.22)');
      grad.addColorStop(0.6, 'rgba(120, 160, 210, 0.08)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
    }
    const glowTex = new THREE.CanvasTexture(glowCanvas);

    const glowGeo = new THREE.PlaneGeometry(5.2, 5.2);
    const glowMat = new THREE.MeshBasicMaterial({
      map: glowTex,
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.softGlowMesh = new THREE.Mesh(glowGeo, glowMat);
    this.softGlowMesh.position.set(0, 0, -0.35); // Just behind badge
    this.badgeGroup.add(this.softGlowMesh);

    // 2. Cinematic Ambient Dust Motes (36 slow floating specks)
    const dustCount = 36;
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3 + 0] = (Math.random() - 0.5) * 6.5;
      dustPos[i * 3 + 1] = (Math.random() - 0.5) * 5.0;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 4.0 + 0.5;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));

    const dustMat = new THREE.PointsMaterial({
      color: 0xbed8f4,
      size: 0.05,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.dustPoints = new THREE.Points(dustGeo, dustMat);
    this.scene.add(this.dustPoints);
  }

  /**
   * Interaction Handlers:
   * Pointer move / touch drag for parallax inspection & physical recoil impulse
   */
  private initInteraction(): void {
    const el = this.container;

    el.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    el.addEventListener('click', this.onClickImpulse);
  }

  private onPointerDown = (e: PointerEvent): void => {
    this.isDragging = true;
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
    this.container.setPointerCapture?.(e.pointerId);
  };

  private onPointerMove = (e: PointerEvent): void => {
    const rect = this.container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    // Normalised pointer coordinates (-1 to +1)
    const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const normY = ((e.clientY - rect.top) / rect.height) * 2 - 1;

    this.mouseX = normX;
    this.mouseY = normY;

    if (this.enableParallax) {
      this.targetTiltY = normX * 0.45; // Yaw tilt following mouse
      this.targetTiltX = -normY * 0.38; // Pitch tilt following mouse
    }

    if (this.isDragging) {
      const deltaX = (e.clientX - this.dragStartX) * 0.006;
      const deltaY = (e.clientY - this.dragStartY) * 0.006;
      this.targetDragRotY = Math.max(-0.65, Math.min(0.65, this.targetDragRotY + deltaX));
      this.targetDragRotX = Math.max(-0.55, Math.min(0.55, this.targetDragRotX + deltaY));
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
    }
  };

  private onPointerUp = (): void => {
    this.isDragging = false;
  };

  /**
   * Tactile click impulse:
   * Clicking the badge depresses it slightly into space with a spring rebound,
   * feeling like a physical heavy metallic entity suspended in magnetic suspension.
   */
  public triggerClickImpulse(): void {
    this.recoilVelZ = -0.15; // Push into screen
    this.recoilVelPitch = 0.07; // Slight tilt
  }

  private onClickImpulse = (e: MouseEvent): void => {
    // Only trigger if not dragged significantly
    if (Math.abs(this.targetDragRotX) < 0.05 && Math.abs(this.targetDragRotY) < 0.05) {
      this.triggerClickImpulse();
    }
  };

  private handleResize = (): void => {
    if (this.isDestroyed || !this.renderer || !this.camera) return;
    const w = this.container.clientWidth || 800;
    const h = this.container.clientHeight || 600;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  /**
   * Main Render Loop (Target 120 FPS)
   */
  private startLoop = (): void => {
    const loop = (time: number): void => {
      if (this.isDestroyed) return;

      const delta = Math.min(this.clock.getDelta(), 0.05);
      const elapsed = this.clock.getElapsedTime();

      this.updatePhysics(elapsed, delta);
      this.renderer.render(this.scene, this.camera);
      this.trackMetrics(time);

      this.reqId = requestAnimationFrame(loop);
    };

    this.reqId = requestAnimationFrame(loop);
  };

  /**
   * Organic Levitation & Floating Physics:
   * 1. Multi-frequency vertical float
   * 2. Gentle sway roll (左右摇摆)
   * 3. Subtle pitch (轻微前后微倾)
   * 4. Breathing yaw (轻柔微转，非自转)
   * 5. Moving specular glints tracking the tilt
   * 6. Parallax with Badge Wall in background
   */
  private updatePhysics(t: number, delta: number): void {
    // Mass Preset Factors
    let massSpeed = 1.0;
    let floatAmp = 1.0;
    if (this.massPreset === 'titanium-heavy') {
      massSpeed = 0.75;
      floatAmp = 0.75;
    } else if (this.massPreset === 'light-float') {
      massSpeed = 1.25;
      floatAmp = 1.2;
    }

    // 1. Organic Multi-frequency Vertical Float (有重量的实体收藏品)
    const floatY =
      Math.sin(t * 0.95 * massSpeed) * (0.11 * floatAmp) +
      Math.sin(t * 0.52 * massSpeed) * (0.035 * floatAmp);

    // 2. Subtle Roll (左右微摇)
    const swayRoll =
      Math.sin(t * 0.72 * massSpeed + 0.8) * 0.042 +
      Math.cos(t * 1.35 * massSpeed) * 0.014;

    // 3. Subtle Pitch (前后轻倾)
    const swayPitch =
      Math.cos(t * 0.85 * massSpeed) * 0.052 +
      Math.sin(t * 0.42 * massSpeed) * 0.018;

    // 4. Breathing Yaw (轻柔微偏，约 ±3.7°，绝非高速自转)
    const breathingYaw = Math.sin(t * 0.5 * massSpeed) * 0.065;

    // Pointer Parallax Spring Smoothing
    const lerpFactor = Math.min(1.0, delta * 7.5);
    this.currentTiltX += (this.targetTiltX - this.currentTiltX) * lerpFactor;
    this.currentTiltY += (this.targetTiltY - this.currentTiltY) * lerpFactor;

    // Drag return spring (gradually returns to neutral when not dragging)
    if (!this.isDragging) {
      this.targetDragRotX += (0 - this.targetDragRotX) * (delta * 3.5);
      this.targetDragRotY += (0 - this.targetDragRotY) * (delta * 3.5);
    }
    this.dragRotX += (this.targetDragRotX - this.dragRotX) * lerpFactor;
    this.dragRotY += (this.targetDragRotY - this.dragRotY) * lerpFactor;

    // 5. Tactile Spring Oscillator (Depression & Rebound)
    // k = 65 (stiffness), c = 8 (damping)
    const springK = 65;
    const damping = 8.5;
    const accelZ = -springK * this.recoilZ - damping * this.recoilVelZ;
    this.recoilVelZ += accelZ * delta;
    this.recoilZ += this.recoilVelZ * delta;

    const accelPitch = -springK * this.recoilPitch - damping * this.recoilVelPitch;
    this.recoilVelPitch += accelPitch * delta;
    this.recoilPitch += this.recoilVelPitch * delta;

    // Apply combined transformation to central badge
    if (this.badgeGroup) {
      this.badgeGroup.position.y = floatY;
      this.badgeGroup.position.z = 0.85 + this.recoilZ;

      this.badgeGroup.rotation.x = swayPitch + this.currentTiltX + this.dragRotX + this.recoilPitch;
      this.badgeGroup.rotation.y = breathingYaw + this.currentTiltY + this.dragRotY;
      this.badgeGroup.rotation.z = swayRoll + this.currentTiltY * 0.25;
    }

    // Dynamic Specular Highlight tracking (makes highlights dance across convex face)
    if (this.movingHighlightLight) {
      const tiltTotalX = this.currentTiltX + this.dragRotX;
      const tiltTotalY = this.currentTiltY + this.dragRotY;
      this.movingHighlightLight.position.x = 1.5 + tiltTotalY * 3.2;
      this.movingHighlightLight.position.y = 2.0 - tiltTotalX * 2.8;
    }

    // 6. Restrained Breathing Glow Pulse (4.2 second period, 0.18 - 0.30 opacity)
    if (this.softGlowMesh) {
      const glowPulse = 0.22 + Math.sin(t * 1.5) * 0.06;
      (this.softGlowMesh.material as THREE.MeshBasicMaterial).opacity = glowPulse;
      const glowScale = 5.2 + Math.sin(t * 1.2) * 0.2;
      this.softGlowMesh.scale.set(glowScale, glowScale, 1.0);
    }

    // 7. Background Badge Wall Parallax (Inverse translation for deep stereoscopic separation)
    if (this.badgeWallGroup) {
      this.badgeWallGroup.visible = this.showBadgeWall;
      if (this.showBadgeWall && this.enableParallax) {
        this.badgeWallGroup.position.x = -(this.currentTiltY + this.dragRotY) * 0.35;
        this.badgeWallGroup.position.y = (this.currentTiltX + this.dragRotX) * 0.35;
      }
    }

    // 8. Slowly float dust particles
    if (this.dustPoints) {
      const posAttr = this.dustPoints.geometry.attributes.position;
      const posArr = posAttr.array as Float32Array;
      const count = posArr.length / 3;
      for (let i = 0; i < count; i++) {
        posArr[i * 3 + 1] += delta * 0.04;
        if (posArr[i * 3 + 1] > 2.8) {
          posArr[i * 3 + 1] = -2.8;
        }
      }
      posAttr.needsUpdate = true;
    }
  }

  private trackMetrics(now: number): void {
    this.frameCount++;
    if (now - this.lastFpsTime >= 500) {
      this.currentFps = Math.round((this.frameCount * 1000) / (now - this.lastFpsTime));
      this.frameTimeMs = parseFloat((1000 / Math.max(1, this.currentFps)).toFixed(2));
      this.frameCount = 0;
      this.lastFpsTime = now;

      if (this.onMetricsUpdate) {
        this.onMetricsUpdate({
          fps: this.currentFps,
          frameTimeMs: this.frameTimeMs,
          drawCalls: this.renderer.info.render.calls,
          triangles: this.renderer.info.render.triangles,
          isSleeping: false,
          allocationsPerFrame: 0,
        });
      }
    }
  }

  public destroy(): void {
    this.isDestroyed = true;
    if (this.reqId !== null) {
      cancelAnimationFrame(this.reqId);
      this.reqId = null;
    }

    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);

    if (this.renderer) {
      this.renderer.dispose();
      this.container.innerHTML = '';
    }
  }
}
