/**
 * Minest Hex Badge Summon 3D Scene Controller
 * Production-ready WebGL Scene hosting the 8-phase Clash Royale style badge summon sequence.
 */

import * as THREE from 'three';
import { MinestSummonMaterials } from './MinestSummonMaterials';
import { buildMinestSummonMeshes, MinestSummonPack } from './MinestBadgeSummonMeshBuilder';
import { MinestSummonTimelineEngine } from './MinestSummonTimelineEngine';
import { PerformanceMetrics } from './OptimizedBadgeInspectorScene';

export class MinestSummonScene {
  private container: HTMLElement;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private mats: MinestSummonMaterials;
  private pack!: MinestSummonPack;
  private centerLight!: THREE.PointLight;
  public timeline!: MinestSummonTimelineEngine;

  private isRunning = true;
  private lastRafTime = performance.now();
  private frameCount = 0;
  private lastFpsCalcTime = performance.now();

  // Mouse drag tilt
  private isDragging = false;
  private prevMouse = { x: 0, y: 0 };
  private tiltQuat = new THREE.Quaternion();
  private targetTiltQuat = new THREE.Quaternion();

  public onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
  public onPhaseChange?: (phaseIndex: number, timeMs: number) => void;
  public onComplete?: () => void;

  constructor(container: HTMLElement) {
    this.container = container;
    this.mats = new MinestSummonMaterials();
    this.initScene();
    this.bindEvents();
    this.startLoop();
  }

  private initScene() {
    const width = Math.max(280, this.container.clientWidth || 400);
    const height = Math.max(280, this.container.clientHeight || 400);

    this.scene = new THREE.Scene();
    this.scene.environment = this.mats.envMap;

    this.camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 50);
    this.camera.position.set(0, 0, 5.6);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      stencil: false,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.3;

    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // Studio Lighting Array
    const amb = new THREE.AmbientLight(0xffffff, 0.65);
    this.scene.add(amb);

    const hemi = new THREE.HemisphereLight(0xddeeff, 0x080c14, 0.5);
    this.scene.add(hemi);

    const key = new THREE.DirectionalLight(0xfff3d6, 2.6);
    key.position.set(3.2, 4.0, 4.5);
    this.scene.add(key);

    const blueRim = new THREE.PointLight(0x0099ff, 1.8, 14);
    blueRim.position.set(-3.2, -2.4, 2.8);
    this.scene.add(blueRim);

    const goldRim = new THREE.PointLight(0xffd60a, 1.6, 12);
    goldRim.position.set(3.0, -2.6, 2.4);
    this.scene.add(goldRim);

    this.centerLight = new THREE.PointLight(0x00f0ff, 1.5, 10);
    this.centerLight.position.set(0, 0, 0.6);
    this.scene.add(this.centerLight);

    // Build 3D Mesh hierarchy
    this.pack = buildMinestSummonMeshes(this.mats);
    this.scene.add(this.pack.rootGroup);

    // Initialize Timeline Engine
    this.timeline = new MinestSummonTimelineEngine(this.pack, this.mats, this.centerLight);
    this.timeline.onPhaseChange = (phaseIdx, timeMs) => {
      if (this.onPhaseChange) this.onPhaseChange(phaseIdx, timeMs);
    };
    this.timeline.onComplete = () => {
      if (this.onComplete) this.onComplete();
    };

    // Pre-compile shaders on GPU to eliminate first-frame hiccups
    this.renderer.compile(this.scene, this.camera);
  }

  private bindEvents() {
    const el = this.renderer.domElement;

    el.addEventListener('pointerdown', (e: PointerEvent) => {
      this.isDragging = true;
      this.prevMouse = { x: e.clientX, y: e.clientY };
      el.setPointerCapture(e.pointerId);
    });

    window.addEventListener('pointermove', (e: PointerEvent) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.prevMouse.x;
      const dy = e.clientY - this.prevMouse.y;

      const qY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), dx * 0.006);
      const qX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), dy * 0.006);
      this.targetTiltQuat.premultiply(qY.multiply(qX));

      this.prevMouse = { x: e.clientX, y: e.clientY };
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
      if (!this.isRunning) return;
      requestAnimationFrame(loop);

      const dt = Math.min(0.05, (now - this.lastRafTime) / 1000);
      this.lastRafTime = now;

      // Update timeline
      this.timeline.update(dt);

      // Micro tilt
      this.tiltQuat.slerp(this.targetTiltQuat, 0.12);
      if (this.timeline.currentTimeMs < 2900 || this.timeline.currentTimeMs > 3800) {
        this.pack.rootGroup.quaternion.copy(this.tiltQuat);
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
          isSleeping: !this.timeline.isPlaying && !this.isDragging,
          allocationsPerFrame: 0,
        });
      }
    }
  }

  public resetOrientation() {
    this.targetTiltQuat.identity();
    this.tiltQuat.identity();
    this.pack.rootGroup.quaternion.identity();
  }

  public destroy() {
    this.isRunning = false;
    this.renderer.dispose();
    this.container.innerHTML = '';
  }
}
