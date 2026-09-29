/**
 * Apple Award Materials & Procedural Studio Lighting Environment
 * High-performance PBR materials with Dynamic View-Angle Fresnel Reflection (菲涅尔动态边缘润泽).
 */

import * as THREE from 'three';

export interface FresnelConfig {
  fresnelColor: THREE.Color | number | string;
  intensity: number;          // 0.0 ~ 3.0 (edge grazing specular multiplier)
  power: number;              // 1.0 ~ 6.0 (sharpness of the grazing rim falloff curve)
  bias: number;               // 0.0 ~ 0.4 (base ambient floor)
  centerSuppression?: number; // 0.1 ~ 1.0 (attenuates normal-incident flat reflection wash in center)
  iridescence?: boolean;      // multi-spectral thin-film iridescent color shift
}

export interface FresnelUniforms {
  uFresnelColor: { value: THREE.Color };
  uFresnelIntensity: { value: number };
  uFresnelPower: { value: number };
  uFresnelBias: { value: number };
  uFresnelCenterSuppression: { value: number };
  uFresnelIridescence: { value: number };
}

export type AwardLightingEnvironment = 'studio' | 'outdoor' | 'sunset' | 'cyberpunk' | 'warm_gold';

export class AppleAwardMaterials {
  public envMap: THREE.Texture;
  private envCanvas!: HTMLCanvasElement;
  private envCtx!: CanvasRenderingContext2D | null;

  public goldBezel: THREE.MeshStandardMaterial;
  public silverBezel: THREE.MeshStandardMaterial;
  public darkTitanium: THREE.MeshStandardMaterial;
  public brushedPlatinum: THREE.MeshStandardMaterial;
  public mysteryShell: THREE.MeshStandardMaterial;
  public mysteryEngraving: THREE.MeshStandardMaterial;
  public bracketMetal: THREE.MeshStandardMaterial;
  public bracketEdge: THREE.MeshStandardMaterial;
  public bracketAccent: THREE.MeshStandardMaterial;
  public lockEnergyCyan: THREE.MeshStandardMaterial;
  public goldAccent: THREE.MeshStandardMaterial;
  public moveRingMat: THREE.MeshStandardMaterial;
  public exerciseRingMat: THREE.MeshStandardMaterial;
  public standRingMat: THREE.MeshStandardMaterial;
  public glassShield: THREE.MeshPhysicalMaterial;
  public ceramicWhite: THREE.MeshStandardMaterial;
  public backEngravedMetal: THREE.MeshStandardMaterial;
  public pendingBlankFace: THREE.MeshPhysicalMaterial;
  public pendingChamferMirror: THREE.MeshStandardMaterial;
  public pendingSideWall: THREE.MeshStandardMaterial;
  public pendingLiquidGlass: THREE.MeshPhysicalMaterial;
  public pendingMicroHairline: THREE.MeshStandardMaterial;

  // Dynamic Fresnel State
  public fresnelIntensity = 1.0;
  public fresnelPower = 3.2;
  public fresnelBias = 0.08;
  public currentEnvironment: AwardLightingEnvironment = 'studio';
  private registeredFresnelUniforms: FresnelUniforms[] = [];

  constructor() {
    this.envMap = this.createProceduralStudioEnv('studio');

    // 1. Mirror 24K Polished Gold (Bezel / Front Rim)
    this.goldBezel = new THREE.MeshStandardMaterial({
      color: 0xffdf78,
      roughness: 0.12,
      metalness: 0.94,
      envMap: this.envMap,
      envMapIntensity: 1.4,
    });
    this.applyDynamicFresnel(this.goldBezel, {
      fresnelColor: 0xfff0a0,
      intensity: 1.2,
      power: 3.2,
      bias: 0.06,
    });

    // 2. Mirror Platinum / Polished Silver
    this.silverBezel = new THREE.MeshStandardMaterial({
      color: 0xeeeeee,
      roughness: 0.14,
      metalness: 0.96,
      envMap: this.envMap,
      envMapIntensity: 1.3,
    });
    this.applyDynamicFresnel(this.silverBezel, {
      fresnelColor: 0xf0f8ff,
      intensity: 1.1,
      power: 3.4,
      bias: 0.05,
    });

    // 3. Brushed Deep Titanium / Obsidian
    this.darkTitanium = new THREE.MeshStandardMaterial({
      color: 0x1f242c,
      roughness: 0.32,
      metalness: 0.88,
      envMap: this.envMap,
      envMapIntensity: 0.9,
    });
    this.applyDynamicFresnel(this.darkTitanium, {
      fresnelColor: 0x6ee7b7,
      intensity: 0.85,
      power: 4.0,
      bias: 0.04,
      iridescence: true,
    });

    // 4. Outer Hex Mystery Shell (Hermetic brushed metallic chamber)
    this.mysteryShell = new THREE.MeshStandardMaterial({
      color: 0x181e26,
      roughness: 0.28,
      metalness: 0.92,
      envMap: this.envMap,
      envMapIntensity: 1.1,
    });
    this.applyDynamicFresnel(this.mysteryShell, {
      fresnelColor: 0x00f0ff,
      intensity: 0.9,
      power: 3.6,
      bias: 0.06,
    });

    // 5. Mystery Shell Laser Engraved Grooves
    this.mysteryEngraving = new THREE.MeshStandardMaterial({
      color: 0x090d12,
      roughness: 0.65,
      metalness: 0.6,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.25,
    });

    // 6. Brushed Platinum for Mechanical Assembly Brackets
    this.brushedPlatinum = new THREE.MeshStandardMaterial({
      color: 0xd8dde4,
      roughness: 0.22,
      metalness: 0.92,
      envMap: this.envMap,
      envMapIntensity: 1.25,
    });
    this.applyDynamicFresnel(this.brushedPlatinum, {
      fresnelColor: 0xe2e8f0,
      intensity: 1.0,
      power: 3.5,
      bias: 0.05,
    });

    // 7. Outer Assembly Clamp Brackets
    this.bracketMetal = new THREE.MeshStandardMaterial({
      color: 0x222a36,
      roughness: 0.25,
      metalness: 0.9,
      envMap: this.envMap,
      envMapIntensity: 1.2,
    });
    this.applyDynamicFresnel(this.bracketMetal, {
      fresnelColor: 0x94a3b8,
      intensity: 0.8,
      power: 3.8,
      bias: 0.04,
    });

    this.bracketEdge = new THREE.MeshStandardMaterial({
      color: 0x7a8c9e,
      roughness: 0.18,
      metalness: 0.95,
      envMap: this.envMap,
      envMapIntensity: 1.4,
    });
    this.applyDynamicFresnel(this.bracketEdge, {
      fresnelColor: 0xbae6fd,
      intensity: 1.3,
      power: 2.8,
      bias: 0.08,
    });

    this.bracketAccent = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      roughness: 0.3,
      metalness: 0.7,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.6,
    });

    // 8. Emissive Lock Energy Pulse Material
    this.lockEnergyCyan = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 1.5,
      roughness: 0.1,
      metalness: 0.2,
    });

    // 9. 24K Gold Accent
    this.goldAccent = new THREE.MeshStandardMaterial({
      color: 0xffd60a,
      emissive: 0xffb800,
      emissiveIntensity: 0.4,
      roughness: 0.15,
      metalness: 0.92,
      envMap: this.envMap,
      envMapIntensity: 1.5,
    });

    // 10. Apple Watch 3 Activity Rings (Move Red, Exercise Green, Stand Cyan)
    this.moveRingMat = new THREE.MeshStandardMaterial({
      color: 0xff2d55,
      emissive: 0xff2d55,
      emissiveIntensity: 2.4,
      roughness: 0.1,
      metalness: 0.85,
      envMap: this.envMap,
      envMapIntensity: 1.8,
    });

    this.exerciseRingMat = new THREE.MeshStandardMaterial({
      color: 0xa1e70a,
      emissive: 0xa1e70a,
      emissiveIntensity: 2.4,
      roughness: 0.1,
      metalness: 0.85,
      envMap: this.envMap,
      envMapIntensity: 1.8,
    });

    this.standRingMat = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: 0x00e5ff,
      emissiveIntensity: 2.4,
      roughness: 0.1,
      metalness: 0.85,
      envMap: this.envMap,
      envMapIntensity: 1.8,
    });
    this.applyDynamicFresnel(this.goldAccent, {
      fresnelColor: 0xffe066,
      intensity: 1.4,
      power: 3.0,
      bias: 0.08,
    });

    // 10. Authentic Watch Glass Shield (Refractive Dome)
    this.glassShield = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.88,
      opacity: 1,
      transparent: true,
      roughness: 0.05,
      ior: 1.52,
      thickness: 0.3,
      reflectivity: 0.9,
      envMap: this.envMap,
    });

    // 11. Ceramic White Inlay
    this.ceramicWhite = new THREE.MeshStandardMaterial({
      color: 0xf6f7f9,
      roughness: 0.22,
      metalness: 0.15,
      envMap: this.envMap,
      envMapIntensity: 0.7,
    });
    this.applyDynamicFresnel(this.ceramicWhite, {
      fresnelColor: 0xffffff,
      intensity: 0.7,
      power: 4.5,
      bias: 0.03,
    });

    // 12. Back Plate Engraved Brushed Metal (for authentic Apple 180° flip)
    this.backEngravedMetal = new THREE.MeshStandardMaterial({
      color: 0x242830,
      roughness: 0.38,
      metalness: 0.85,
      envMap: this.envMap,
      envMapIntensity: 0.8,
    });
    this.applyDynamicFresnel(this.backEngravedMetal, {
      fresnelColor: 0x64748b,
      intensity: 0.75,
      power: 3.8,
      bias: 0.05,
    });

    // 13. Pending Convex Blank Face (Apple 24K Olympic Gold)
    this.pendingBlankFace = new THREE.MeshPhysicalMaterial({
      color: 0xf5c542,
      roughness: 0.12,
      metalness: 0.96,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      reflectivity: 1.0,
      envMap: this.envMap,
      envMapIntensity: 2.0,
    });
    this.applyDynamicFresnel(this.pendingBlankFace, {
      fresnelColor: 0xfff6c0,
      intensity: 1.5,
      power: 2.9,
      bias: 0.08,
    });

    // 14. Pending Razor Chamfer Mirror Bevel (Dazzling Polished Gold Highlight Rim)
    this.pendingChamferMirror = new THREE.MeshStandardMaterial({
      color: 0xffea88,
      roughness: 0.04,
      metalness: 0.99,
      envMap: this.envMap,
      envMapIntensity: 2.4,
    });
    this.applyDynamicFresnel(this.pendingChamferMirror, {
      fresnelColor: 0xffffff,
      intensity: 1.8,
      power: 2.5,
      bias: 0.12,
    });

    // 15. Pending Side Wall Brushed Metal (Substantial 3D thickness with brushed warm gold)
    this.pendingSideWall = new THREE.MeshStandardMaterial({
      color: 0xcca028,
      roughness: 0.22,
      metalness: 0.94,
      envMap: this.envMap,
      envMapIntensity: 1.5,
    });
    this.applyDynamicFresnel(this.pendingSideWall, {
      fresnelColor: 0xffdf78,
      intensity: 1.1,
      power: 3.2,
      bias: 0.06,
    });

    // 16. Pending Liquid Glass Refractive Outer Shield (Warm Golden Luster)
    this.pendingLiquidGlass = new THREE.MeshPhysicalMaterial({
      color: 0xfff6d0,
      transmission: 0.72,
      opacity: 1,
      transparent: true,
      roughness: 0.03,
      ior: 1.54,
      thickness: 0.22,
      reflectivity: 0.95,
      envMap: this.envMap,
    });

    // 17. Pending Micro Tactile Laser Guide
    this.pendingMicroHairline = new THREE.MeshStandardMaterial({
      color: 0x2e3846,
      roughness: 0.45,
      metalness: 0.85,
      envMap: this.envMap,
      envMapIntensity: 0.7,
    });
  }

  /**
   * Injects Dynamic View-Angle Fresnel Reflection into Three.js PBR Shader
   * Calculates Schlick Fresnel factor: F = F0 + (1 - F0) * (1 - N·V)^power
   * Enhances edge luster, grazing reflections, and metal wetness.
   */
  public applyDynamicFresnel(
    material: THREE.Material,
    config: Partial<FresnelConfig> = {}
  ): void {
    const colorVal = config.fresnelColor !== undefined ? config.fresnelColor : 0xffffff;
    const baseColor = colorVal instanceof THREE.Color ? colorVal : new THREE.Color(colorVal);

    const uniforms: FresnelUniforms = {
      uFresnelColor: { value: baseColor },
      uFresnelIntensity: { value: config.intensity !== undefined ? config.intensity : 1.0 },
      uFresnelPower: { value: config.power !== undefined ? config.power : 3.2 },
      uFresnelBias: { value: config.bias !== undefined ? config.bias : 0.08 },
      uFresnelCenterSuppression: {
        value: config.centerSuppression !== undefined ? config.centerSuppression : 0.88,
      },
      uFresnelIridescence: { value: config.iridescence ? 1 : 0 },
    };

    this.registeredFresnelUniforms.push(uniforms);
    material.userData.fresnelUniforms = uniforms;

    material.onBeforeCompile = (shader) => {
      shader.uniforms.uFresnelColor = uniforms.uFresnelColor;
      shader.uniforms.uFresnelIntensity = uniforms.uFresnelIntensity;
      shader.uniforms.uFresnelPower = uniforms.uFresnelPower;
      shader.uniforms.uFresnelBias = uniforms.uFresnelBias;
      shader.uniforms.uFresnelCenterSuppression = uniforms.uFresnelCenterSuppression;
      shader.uniforms.uFresnelIridescence = uniforms.uFresnelIridescence;

      // 1. Vertex Shader Injection
      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `#include <common>
        varying vec3 vWorldNormalFresnel;
        varying vec3 vWorldPositionFresnel;`
      );

      shader.vertexShader = shader.vertexShader.replace(
        '#include <worldpos_vertex>',
        `#include <worldpos_vertex>
        vWorldNormalFresnel = normalize(mat3(modelMatrix) * normal);
        vWorldPositionFresnel = (modelMatrix * vec4(position, 1.0)).xyz;`
      );

      // 2. Fragment Shader Injection
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        `#include <common>
        uniform vec3 uFresnelColor;
        uniform float uFresnelIntensity;
        uniform float uFresnelPower;
        uniform float uFresnelBias;
        uniform float uFresnelCenterSuppression;
        uniform int uFresnelIridescence;

        varying vec3 vWorldNormalFresnel;
        varying vec3 vWorldPositionFresnel;`
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        `#include <dithering_fragment>

        // ─────────────────────────────────────────────────────────────
        // View-Dependent Fresnel Falloff & Grazing Rim Specular Transition
        // (基于视角的菲涅尔高光衰减与细腻过渡)
        // ─────────────────────────────────────────────────────────────
        vec3 N_fresnel = normalize(vWorldNormalFresnel);
        vec3 V_fresnel = normalize(cameraPosition - vWorldPositionFresnel);
        float NdotV_fresnel = clamp(dot(N_fresnel, V_fresnel), 0.0, 1.0);

        // Grazing term: 0 at head-on normal view, 1 at extreme grazing angles (edges/bevels)
        float grazingTerm = pow(1.0 - NdotV_fresnel, uFresnelPower);
        float fresnelFactor = uFresnelBias + (1.0 - uFresnelBias) * grazingTerm;

        // View-dependent reflection attenuation: prevents flat/blown-out global reflection in center
        // while preserving deep golden alloy color and razor-sharp rim highlights
        float centerFalloff = mix(uFresnelCenterSuppression, 1.0, grazingTerm);

        vec3 activeFresnelCol = uFresnelColor;
        if (uFresnelIridescence == 1) {
          float shift = (1.0 - NdotV_fresnel) * 3.14159265;
          vec3 irid = vec3(
            0.5 + 0.5 * sin(shift + 0.0),
            0.5 + 0.5 * sin(shift + 2.094),
            0.5 + 0.5 * sin(shift + 4.188)
          );
          activeFresnelCol = mix(uFresnelColor, irid, 0.40);
        }

        gl_FragColor.rgb *= centerFalloff;
        gl_FragColor.rgb += activeFresnelCol * (fresnelFactor * uFresnelIntensity);`
      );
    };

    material.needsUpdate = true;
  }

  /**
   * Set View-Dependent Fresnel Falloff Parameters on Pending Materials
   */
  public setPendingFresnelFalloff(options: {
    intensity?: number;
    power?: number;
    centerSuppression?: number;
    bias?: number;
    colorHex?: number;
  }) {
    const pendingMats = [this.pendingBlankFace, this.pendingChamferMirror, this.pendingSideWall];
    for (const mat of pendingMats) {
      const u = mat.userData?.fresnelUniforms as FresnelUniforms | undefined;
      if (u) {
        if (options.intensity !== undefined) u.uFresnelIntensity.value = options.intensity;
        if (options.power !== undefined) u.uFresnelPower.value = options.power;
        if (options.centerSuppression !== undefined) u.uFresnelCenterSuppression.value = options.centerSuppression;
        if (options.bias !== undefined) u.uFresnelBias.value = options.bias;
        if (options.colorHex !== undefined) u.uFresnelColor.value.setHex(options.colorHex);
      }
    }
  }

  /**
   * Dynamically Adjust Global Fresnel Reflection Intensity (0.0 ~ 3.0)
   */
  public setGlobalFresnelIntensity(scale: number): void {
    this.fresnelIntensity = scale;
    for (const u of this.registeredFresnelUniforms) {
      u.uFresnelIntensity.value = scale;
    }
  }

  /**
   * Dynamically Adjust Global Fresnel Rim Power / Edge Sharpness (1.5 ~ 6.0)
   */
  public setGlobalFresnelPower(power: number): void {
    this.fresnelPower = power;
    for (const u of this.registeredFresnelUniforms) {
      u.uFresnelPower.value = power;
    }
  }

  /**
   * Dynamically switch lighting environment panorama and re-tune Fresnel color tints
   */
  public setLightingEnvironment(env: AwardLightingEnvironment): void {
    this.currentEnvironment = env;
    this.renderProceduralStudioEnv(env);
    this.envMap.needsUpdate = true;

    // Adaptively adjust Fresnel tints to match ambient environment lighting
    switch (env) {
      case 'warm_gold':
        this.goldBezel.userData.fresnelUniforms?.uFresnelColor.value.setHex(0xffea78);
        this.pendingBlankFace.userData.fresnelUniforms?.uFresnelColor.value.setHex(0xfff490);
        this.silverBezel.userData.fresnelUniforms?.uFresnelColor.value.setHex(0xfff0c0);
        break;
      case 'sunset':
        this.goldBezel.userData.fresnelUniforms?.uFresnelColor.value.setHex(0xffaa55);
        this.pendingBlankFace.userData.fresnelUniforms?.uFresnelColor.value.setHex(0xff8833);
        this.silverBezel.userData.fresnelUniforms?.uFresnelColor.value.setHex(0xffcc88);
        break;
      case 'cyberpunk':
        this.goldBezel.userData.fresnelUniforms?.uFresnelColor.value.setHex(0x00f0ff);
        this.pendingBlankFace.userData.fresnelUniforms?.uFresnelColor.value.setHex(0xff007f);
        this.silverBezel.userData.fresnelUniforms?.uFresnelColor.value.setHex(0x38bdf8);
        break;
      case 'outdoor':
        this.goldBezel.userData.fresnelUniforms?.uFresnelColor.value.setHex(0xfef08a);
        this.pendingBlankFace.userData.fresnelUniforms?.uFresnelColor.value.setHex(0xfde047);
        this.silverBezel.userData.fresnelUniforms?.uFresnelColor.value.setHex(0xe0f2fe);
        break;
      case 'studio':
      default:
        this.goldBezel.userData.fresnelUniforms?.uFresnelColor.value.setHex(0xfff0a0);
        this.pendingBlankFace.userData.fresnelUniforms?.uFresnelColor.value.setHex(0xfff6c0);
        this.silverBezel.userData.fresnelUniforms?.uFresnelColor.value.setHex(0xf0f8ff);
        break;
    }
  }

  /**
   * Procedurally generates dynamic 360° Studio Lighting Panorama
   */
  private createProceduralStudioEnv(env: AwardLightingEnvironment = 'studio'): THREE.Texture {
    this.envCanvas = document.createElement('canvas');
    this.envCanvas.width = 512;
    this.envCanvas.height = 256;
    this.envCtx = this.envCanvas.getContext('2d');
    this.renderProceduralStudioEnv(env);

    const texture = new THREE.CanvasTexture(this.envCanvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.center.set(0.5, 0.5);
    return texture;
  }

  /**
   * Switch HDRi lighting environment preset dynamically
   */
  public updateEnvironmentPreset(env: AwardLightingEnvironment) {
    this.currentEnvironment = env;
    this.renderProceduralStudioEnv(env);
    if (this.envMap) {
      this.envMap.needsUpdate = true;
    }
  }

  /**
   * Update Dynamic HDRi Environmental Reflection Rotation & Viewport Offset
   */
  public updateDynamicEnvironmentRotation(angleRad: number, pitchOffset: number = 0) {
    if (this.envMap) {
      this.envMap.offset.x = (angleRad / (Math.PI * 2)) % 1.0;
      this.envMap.offset.y = THREE.MathUtils.clamp(pitchOffset * 0.1, -0.2, 0.2);
      this.envMap.rotation = angleRad;
    }
  }

  private renderProceduralStudioEnv(env: AwardLightingEnvironment) {
    if (!this.envCtx) return;
    const ctx = this.envCtx;

    if (env === 'sunset') {
      const bgGrad = ctx.createLinearGradient(0, 0, 0, 256);
      bgGrad.addColorStop(0, '#1c0b16');
      bgGrad.addColorStop(0.5, '#3b1220');
      bgGrad.addColorStop(1, '#090408');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 512, 256);

      const keyGrad = ctx.createRadialGradient(380, 80, 10, 380, 80, 130);
      keyGrad.addColorStop(0, '#ffedd5');
      keyGrad.addColorStop(0.4, '#fb923c');
      keyGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = keyGrad;
      ctx.fillRect(250, 0, 260, 200);

      const rimGrad = ctx.createRadialGradient(100, 130, 5, 100, 130, 100);
      rimGrad.addColorStop(0, '#f43f5e');
      rimGrad.addColorStop(0.6, '#881337');
      rimGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = rimGrad;
      ctx.fillRect(0, 30, 200, 200);
    } else if (env === 'cyberpunk') {
      const bgGrad = ctx.createLinearGradient(0, 0, 0, 256);
      bgGrad.addColorStop(0, '#050714');
      bgGrad.addColorStop(0.5, '#0b112c');
      bgGrad.addColorStop(1, '#030509');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 512, 256);

      const keyGrad = ctx.createRadialGradient(380, 70, 10, 380, 70, 120);
      keyGrad.addColorStop(0, '#a5f3fc');
      keyGrad.addColorStop(0.5, '#06b6d4');
      keyGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = keyGrad;
      ctx.fillRect(250, 0, 260, 180);

      const rimGrad = ctx.createRadialGradient(100, 120, 5, 100, 120, 100);
      rimGrad.addColorStop(0, '#f472b6');
      rimGrad.addColorStop(0.5, '#db2777');
      rimGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = rimGrad;
      ctx.fillRect(0, 30, 200, 180);
    } else if (env === 'warm_gold') {
      const bgGrad = ctx.createLinearGradient(0, 0, 0, 256);
      bgGrad.addColorStop(0, '#130e06');
      bgGrad.addColorStop(0.5, '#261b0c');
      bgGrad.addColorStop(1, '#080502');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 512, 256);

      const keyGrad = ctx.createRadialGradient(380, 70, 10, 380, 70, 120);
      keyGrad.addColorStop(0, '#fef9c3');
      keyGrad.addColorStop(0.4, '#eab308');
      keyGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = keyGrad;
      ctx.fillRect(250, 0, 260, 180);

      const rimGrad = ctx.createRadialGradient(100, 120, 5, 100, 120, 90);
      rimGrad.addColorStop(0, '#fde047');
      rimGrad.addColorStop(0.5, '#ca8a04');
      rimGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = rimGrad;
      ctx.fillRect(0, 30, 200, 180);
    } else if (env === 'outdoor') {
      const bgGrad = ctx.createLinearGradient(0, 0, 0, 256);
      bgGrad.addColorStop(0, '#0c192c');
      bgGrad.addColorStop(0.5, '#1e3a5f');
      bgGrad.addColorStop(1, '#070f1a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 512, 256);

      const keyGrad = ctx.createRadialGradient(380, 60, 10, 380, 60, 120);
      keyGrad.addColorStop(0, '#ffffff');
      keyGrad.addColorStop(0.3, '#fef08a');
      keyGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = keyGrad;
      ctx.fillRect(250, 0, 260, 180);

      const rimGrad = ctx.createRadialGradient(100, 120, 5, 100, 120, 100);
      rimGrad.addColorStop(0, '#bae6fd');
      rimGrad.addColorStop(0.5, '#0284c7');
      rimGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = rimGrad;
      ctx.fillRect(0, 30, 200, 180);
    } else {
      // Default 'studio'
      const bgGrad = ctx.createLinearGradient(0, 0, 0, 256);
      bgGrad.addColorStop(0, '#0a0d14');
      bgGrad.addColorStop(0.5, '#121824');
      bgGrad.addColorStop(1, '#05070a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 512, 256);

      const keyGrad = ctx.createRadialGradient(380, 70, 10, 380, 70, 110);
      keyGrad.addColorStop(0, '#ffffff');
      keyGrad.addColorStop(0.4, '#eef5ff');
      keyGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = keyGrad;
      ctx.fillRect(250, 0, 260, 180);

      const rimGrad = ctx.createRadialGradient(100, 120, 5, 100, 120, 90);
      rimGrad.addColorStop(0, '#a5f3fc');
      rimGrad.addColorStop(0.5, '#0284c7');
      rimGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = rimGrad;
      ctx.fillRect(0, 30, 200, 180);

      const amberGrad = ctx.createRadialGradient(280, 220, 10, 280, 220, 80);
      amberGrad.addColorStop(0, '#fef08a');
      amberGrad.addColorStop(0.6, '#b45309');
      amberGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = amberGrad;
      ctx.fillRect(180, 140, 200, 116);
    }
  }

  /**
   * Helper to create a vibrant Cloisonné Enamel material with dynamic Fresnel
   */
  createEnamel(hexColor: number, emissiveIntensity = 0.08): THREE.MeshStandardMaterial {
    const mat = new THREE.MeshStandardMaterial({
      color: hexColor,
      roughness: 0.18,
      metalness: 0.25,
      emissive: hexColor,
      emissiveIntensity,
      envMap: this.envMap,
      envMapIntensity: 0.9,
    });
    this.applyDynamicFresnel(mat, {
      fresnelColor: hexColor,
      intensity: 0.9,
      power: 3.5,
      bias: 0.05,
    });
    return mat;
  }
}

