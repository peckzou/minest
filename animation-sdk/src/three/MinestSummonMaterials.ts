/**
 * Minest Hex Badge Summon Materials (Exact match to 4530E4C3-2A2B-4A7E-B52C-2DB392466777.png)
 *
 * Color Palette:
 * - Royal Blue (#0075FF / #0051C7)
 * - Ice Crystal Blue (#80C5FF / #A6E1FF)
 * - 24K Brilliant Gold (#FFC72C / #FFAA00 / #FFE072)
 * - Royal Amethyst / Purple (#7B3FE4 / #9B51E0)
 * - Energy Cyan Glow (#00F0FF)
 */

import * as THREE from 'three';

export class MinestSummonMaterials {
  public envMap: THREE.Texture;

  // 1. Crystal Hex Core (Semi-transparent glowing ice blue crystal)
  public iceCrystalHex: THREE.MeshPhysicalMaterial;
  public iceCrystalCoreGlow: THREE.MeshStandardMaterial;

  // 2. Armor Bracket Materials (Gold frame + Blue inlaid gemstone)
  public bracketGoldChamber: THREE.MeshStandardMaterial;
  public bracketBlueGem: THREE.MeshPhysicalMaterial;
  public bracketLockTeeth: THREE.MeshStandardMaterial;

  // 3. Locked Shell Materials
  public shellArmorBase: THREE.MeshStandardMaterial;
  public shellEmblemCrown: THREE.MeshStandardMaterial;

  // 4. Energy Aura & Vortex Rings
  public vortexEnergyCyan: THREE.MeshBasicMaterial;
  public vortexEnergyGold: THREE.MeshBasicMaterial;

  // 5. Revealed True Badge: Royal Crown Badge (Stage 6 & 7)
  public crownGold: THREE.MeshStandardMaterial;
  public badgeRoyalPurplePlate: THREE.MeshStandardMaterial;
  public badgeRibbonGold: THREE.MeshStandardMaterial;
  public badgeBezelGold: THREE.MeshStandardMaterial;

  constructor() {
    this.envMap = this.createPBRStudioEnv();

    // 1. Ice Blue Crystal Hex Core (Initial state)
    this.iceCrystalHex = new THREE.MeshPhysicalMaterial({
      color: 0x64b5f6,
      transparent: true,
      opacity: 0.65,
      roughness: 0.08,
      metalness: 0.1,
      transmission: 0.75,
      ior: 1.45,
      reflectivity: 0.8,
      emissive: 0x00b0ff,
      emissiveIntensity: 0.45,
      envMap: this.envMap,
    });

    this.iceCrystalCoreGlow = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 1.2,
      transparent: true,
      opacity: 0.85,
    });

    // 2. Brackets: Clash Royale Gold + Lapis Blue Jewel
    this.bracketGoldChamber = new THREE.MeshStandardMaterial({
      color: 0xffbf1f,
      roughness: 0.22,
      metalness: 0.94,
      envMap: this.envMap,
      envMapIntensity: 1.6,
    });

    this.bracketBlueGem = new THREE.MeshPhysicalMaterial({
      color: 0x0066ff,
      transmission: 0.6,
      opacity: 0.9,
      roughness: 0.12,
      metalness: 0.2,
      ior: 1.54,
      emissive: 0x0044cc,
      emissiveIntensity: 0.4,
      envMap: this.envMap,
    });

    this.bracketLockTeeth = new THREE.MeshStandardMaterial({
      color: 0xffe082,
      roughness: 0.15,
      metalness: 0.98,
      envMap: this.envMap,
    });

    // 3. Complete Locked Shell
    this.shellArmorBase = new THREE.MeshStandardMaterial({
      color: 0x0b2447,
      roughness: 0.3,
      metalness: 0.75,
      envMap: this.envMap,
    });

    this.shellEmblemCrown = new THREE.MeshStandardMaterial({
      color: 0x1976d2,
      emissive: 0x00e5ff,
      emissiveIntensity: 0.5,
      roughness: 0.2,
      metalness: 0.8,
    });

    // 4. Vortex Energy Rings
    this.vortexEnergyCyan = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });

    this.vortexEnergyGold = new THREE.MeshBasicMaterial({
      color: 0xffd60a,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });

    // 5. Revealed True Badge: Royal Crown 3D
    this.crownGold = new THREE.MeshStandardMaterial({
      color: 0xffc400,
      roughness: 0.16,
      metalness: 0.96,
      emissive: 0xff9100,
      emissiveIntensity: 0.25,
      envMap: this.envMap,
      envMapIntensity: 1.8,
    });

    this.badgeRoyalPurplePlate = new THREE.MeshStandardMaterial({
      color: 0x3f1d8c,
      roughness: 0.25,
      metalness: 0.5,
      emissive: 0x5e239d,
      emissiveIntensity: 0.35,
      envMap: this.envMap,
    });

    this.badgeRibbonGold = new THREE.MeshStandardMaterial({
      color: 0xffd54f,
      roughness: 0.2,
      metalness: 0.9,
      envMap: this.envMap,
    });

    this.badgeBezelGold = new THREE.MeshStandardMaterial({
      color: 0xffb300,
      roughness: 0.18,
      metalness: 0.95,
      envMap: this.envMap,
      envMapIntensity: 1.5,
    });
  }

  private createPBRStudioEnv(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Midnight dark gradient
      const bg = ctx.createLinearGradient(0, 0, 0, 256);
      bg.addColorStop(0, '#060a12');
      bg.addColorStop(0.5, '#0b1626');
      bg.addColorStop(1, '#030508');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 512, 256);

      // Gold key light top right
      const goldG = ctx.createRadialGradient(380, 80, 5, 380, 80, 120);
      goldG.addColorStop(0, '#ffe89c');
      goldG.addColorStop(0.4, '#d49700');
      goldG.addColorStop(1, 'transparent');
      ctx.fillStyle = goldG;
      ctx.fillRect(250, 0, 260, 200);

      // Royal blue rim light left
      const blueG = ctx.createRadialGradient(100, 130, 5, 100, 130, 100);
      blueG.addColorStop(0, '#80d4ff');
      blueG.addColorStop(0.5, '#0059ff');
      blueG.addColorStop(1, 'transparent');
      ctx.fillStyle = blueG;
      ctx.fillRect(0, 30, 200, 200);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    return tex;
  }
}
