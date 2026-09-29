import * as THREE from 'three';

/**
 * Accurately maps Correlated Color Temperature (Kelvin, 1500K - 12000K) to standard linear sRGB
 * based on the Planckian blackbody locus algorithm.
 */
export function kelvinToRGBColor(kelvin: number): THREE.Color {
  const temp = Math.max(1500, Math.min(15000, kelvin)) / 100;
  let r: number, g: number, b: number;

  if (temp <= 66) {
    r = 255;
    g = 99.4708025861 * Math.log(temp) - 161.1195681661;
    b = temp <= 19 ? 0 : 138.5177312231 * Math.log(temp - 10) - 305.0447927307;
  } else {
    r = 329.698727446 * Math.pow(temp - 60, -0.1332047592);
    g = 288.1221695283 * Math.pow(temp - 60, -0.0755148492);
    b = 255;
  }

  const red = Math.max(0, Math.min(255, r)) / 255;
  const green = Math.max(0, Math.min(255, g)) / 255;
  const blue = Math.max(0, Math.min(255, b)) / 255;

  return new THREE.Color(red, green, blue);
}

/**
 * Creates Ultra-Refined Apple Studio Lighting HDRI Environment Map
 * Reproduces the precise softbox banks, specular edge strips, and ambient floor reflectors
 * used in Apple Keynote product videos and the Fitness app.
 */
export function createAppleStudioEnvMap(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Deep obsidian studio void with subtle slate gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, 1024);
  bgGrad.addColorStop(0, '#06070a');
  bgGrad.addColorStop(0.5, '#0a0b10');
  bgGrad.addColorStop(1, '#030406');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 2048, 1024);

  // Key Overhead Diffuse Softbox (6500K Neutral White with high-energy core)
  const keySoftbox = ctx.createRadialGradient(1024, 160, 10, 1024, 160, 520);
  keySoftbox.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
  keySoftbox.addColorStop(0.2, 'rgba(250, 252, 255, 0.9)');
  keySoftbox.addColorStop(0.5, 'rgba(215, 230, 255, 0.4)');
  keySoftbox.addColorStop(0.8, 'rgba(150, 180, 220, 0.1)');
  keySoftbox.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = keySoftbox;
  ctx.fillRect(400, 0, 1248, 560);

  // Razor Edge Specular Strip Light - Left (Creates the crisp chamfer glint seen in IMG_2949)
  const leftRim = ctx.createLinearGradient(60, 120, 320, 900);
  leftRim.addColorStop(0, 'rgba(255, 255, 255, 0.98)');
  leftRim.addColorStop(0.25, 'rgba(235, 245, 255, 0.7)');
  leftRim.addColorStop(0.6, 'rgba(180, 210, 250, 0.2)');
  leftRim.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = leftRim;
  ctx.fillRect(30, 80, 320, 840);

  // Razor Edge Specular Strip Light - Right (IMG_2950 mirror bevel highlight)
  const rightRim = ctx.createLinearGradient(1988, 120, 1728, 900);
  rightRim.addColorStop(0, 'rgba(255, 255, 255, 0.98)');
  rightRim.addColorStop(0.25, 'rgba(235, 245, 255, 0.7)');
  rightRim.addColorStop(0.6, 'rgba(180, 210, 250, 0.2)');
  rightRim.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = rightRim;
  ctx.fillRect(1698, 80, 320, 840);

  // Cool Tint Bottom Bounce Reflector (Subtle backlight for bottom concave edges)
  const bottomBounce = ctx.createRadialGradient(1024, 960, 20, 1024, 960, 680);
  bottomBounce.addColorStop(0, 'rgba(180, 215, 255, 0.28)');
  bottomBounce.addColorStop(0.4, 'rgba(120, 160, 220, 0.12)');
  bottomBounce.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = bottomBounce;
  ctx.fillRect(424, 600, 1200, 424);

  // Horizontal Precision Horizon Glint
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 512);
  ctx.lineTo(2048, 512);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Creates Apple Fitness Laser-Engraved Backplate Texture (Ceramic Satin White Edition)
 * High-DPI 2048x2048 vector-rendered pristine satin white ceramic / brushed silver
 * with micro-concentric lathe finish and crisp dark laser-etched typography.
 */
export function createAppleLaserBackplateTexture(
  earnedDate: string = 'OCTOBER 20, 2019',
  badgeTitle: string = 'PERFECT WEEK'
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 2048;
  const ctx = canvas.getContext('2d')!;

  const cx = 1024;
  const cy = 1024;

  // Pristine warm satin ceramic white gradient (replaces former dark charcoal)
  const bgGrad = ctx.createRadialGradient(cx, cy, 60, cx, cy, 1100);
  bgGrad.addColorStop(0, '#FAF9F6');
  bgGrad.addColorStop(0.65, '#F2F1EC');
  bgGrad.addColorStop(1, '#E8E6DF');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 2048, 2048);

  // Ultra-fine micro-concentric lathe-turned brushing lines in soft silver/warm gray
  for (let r = 120; r < 1000; r += 4) {
    ctx.strokeStyle = (r % 12 === 0) ? 'rgba(0, 0, 0, 0.035)' : 'rgba(0, 0, 0, 0.016)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Precision Outer Guide Rings (like Apple Watch ceramic sensor engravings)
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, 780, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.06)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(cx, cy, 796, 0, Math.PI * 2);
  ctx.stroke();

  // Compass / degree tick marks on outer ring
  for (let deg = 0; deg < 360; deg += 15) {
    const rad = (deg * Math.PI) / 180;
    const isMajor = deg % 90 === 0;
    const r1 = isMajor ? 760 : 770;
    const r2 = 780;
    ctx.strokeStyle = isMajor ? 'rgba(0, 0, 0, 0.32)' : 'rgba(0, 0, 0, 0.12)';
    ctx.lineWidth = isMajor ? 2.5 : 1.2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(rad) * r1, cy + Math.sin(rad) * r1);
    ctx.lineTo(cx + Math.cos(rad) * r2, cy + Math.sin(rad) * r2);
    ctx.stroke();
  }

  // Laser Etched Typography in crisp, elegant charcoal/black
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 1. Minest Tri-Centric Ring Monogram (Top Emblem)
  const emblemY = cy - 145;
  // Outer crimson ring
  ctx.strokeStyle = '#FA114F';
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.arc(cx, emblemY, 44, 0, Math.PI * 2);
  ctx.stroke();
  // Middle volt ring
  ctx.strokeStyle = '#A6FF00';
  ctx.lineWidth = 4.0;
  ctx.beginPath();
  ctx.arc(cx, emblemY, 32, 0, Math.PI * 2);
  ctx.stroke();
  // Inner cyan ring
  ctx.strokeStyle = '#00F0FF';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(cx, emblemY, 20, 0, Math.PI * 2);
  ctx.stroke();

  // 2. "EARNED ON" Sub-headline
  ctx.font = '600 42px -apple-system, "SF Pro Text", "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#6E6E73';
  ctx.letterSpacing = '10px';
  ctx.fillText('EARNED ON', cx, cy - 24);

  // 3. Date Inscription Line (Large bold, crisp deep black laser burn)
  ctx.font = '700 66px -apple-system, "SF Pro Display", "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#1D1D1F';
  ctx.letterSpacing = '6px';
  ctx.fillText(earnedDate.toUpperCase(), cx, cy + 56);

  // 4. Badge Title Line
  ctx.font = '600 36px -apple-system, "SF Pro Text", sans-serif';
  ctx.fillStyle = '#3A3A3C';
  ctx.letterSpacing = '8px';
  ctx.fillText(badgeTitle.toUpperCase(), cx, cy + 132);

  // 5. Bottom Craftsmanship Engraving
  ctx.font = '500 24px -apple-system, "SF Pro Text", sans-serif';
  ctx.fillStyle = '#86868B';
  ctx.letterSpacing = '8px';
  ctx.fillText('DESIGNED BY MINEST IN CALIFORNIA', cx, cy + 232);

  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Apple Award Material Library
 */
export class AppleAwardMaterials {
  public envMap: THREE.Texture;

  constructor() {
    this.envMap = createAppleStudioEnvMap();
  }

  // Mirror-Polished Aerospace Silver Rim / Chamfer
  getMirrorSilverBezel(isLocked: boolean = false): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: isLocked ? 0x2e3036 : 0xffffff,
      metalness: isLocked ? 0.8 : 0.98,
      roughness: isLocked ? 0.35 : 0.04,
      envMap: this.envMap,
      envMapIntensity: isLocked ? 0.4 : 2.2,
      side: THREE.DoubleSide,
    });
  }

  // Mirror-Polished 24K Gold Rim (Used in "100 Closed" and Challenge awards)
  getMirrorGoldBezel(isLocked: boolean = false): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: isLocked ? 0x3d3526 : 0xffd97d,
      metalness: isLocked ? 0.8 : 0.96,
      roughness: isLocked ? 0.35 : 0.05,
      envMap: this.envMap,
      envMapIntensity: isLocked ? 0.4 : 2.2,
      side: THREE.DoubleSide,
    });
  }

  // Mirror-Polished Aerospace Space Gray / Graphite Rim
  getSpaceGrayBezel(isLocked: boolean = false): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: isLocked ? 0x22242a : 0x3d414a,
      metalness: isLocked ? 0.8 : 0.92,
      roughness: isLocked ? 0.4 : 0.12,
      envMap: this.envMap,
      envMapIntensity: isLocked ? 0.35 : 2.0,
      side: THREE.DoubleSide,
    });
  }

  // Satin Bone / Off-White Ceramic Enamel (The bottom segments of Perfect Week in IMG_2950)
  getOffWhiteEnamel(isLocked: boolean = false): THREE.MeshPhysicalMaterial {
    return new THREE.MeshPhysicalMaterial({
      color: isLocked ? 0x1f2126 : 0xeae8e1,
      roughness: isLocked ? 0.8 : 0.22,
      metalness: 0.04,
      clearcoat: isLocked ? 0.0 : 0.9,
      clearcoatRoughness: 0.06,
      reflectivity: 0.6,
      envMap: this.envMap,
      envMapIntensity: isLocked ? 0.1 : 0.5,
      side: THREE.DoubleSide,
    });
  }

  // Vitreous Color Lacquer (Study Crimson, Focus Volt, Review Cyan, Challenge Amber)
  getColorLacquer(colorHex: number, isLocked: boolean = false): THREE.MeshPhysicalMaterial {
    if (isLocked) {
      return new THREE.MeshPhysicalMaterial({
        color: 0x24262c,
        roughness: 0.75,
        metalness: 0.4,
        envMap: this.envMap,
        envMapIntensity: 0.2,
        side: THREE.DoubleSide,
      });
    }

    return new THREE.MeshPhysicalMaterial({
      color: colorHex,
      roughness: 0.12,
      metalness: 0.15,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      ior: 1.52, // Vitreous jewelry enamel refractive index
      reflectivity: 0.9,
      sheen: 0.35,
      sheenColor: new THREE.Color(colorHex),
      envMap: this.envMap,
      envMapIntensity: 1.6,
      side: THREE.DoubleSide,
    });
  }

  // Pristine Satin Ceramic White Back Shell with High-DPI Laser Engraving
  getAppleBackShell(earnedDate: string, badgeTitle: string, isLocked: boolean = false): THREE.MeshPhysicalMaterial {
    const map = createAppleLaserBackplateTexture(earnedDate, badgeTitle);
    return new THREE.MeshPhysicalMaterial({
      map: isLocked ? undefined : map,
      color: isLocked ? 0x24262b : 0xffffff,
      roughness: isLocked ? 0.6 : 0.22,
      metalness: isLocked ? 0.3 : 0.06,
      clearcoat: isLocked ? 0.0 : 0.75,
      clearcoatRoughness: 0.06,
      reflectivity: 0.75,
      envMap: this.envMap,
      envMapIntensity: isLocked ? 0.2 : 0.75,
      side: THREE.DoubleSide,
    });
  }

  // Dark Recessed Wireframe Channel Material (Partition grooves)
  getGrooveChannelMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0x0f1013,
      roughness: 0.65,
      metalness: 0.75,
      envMap: this.envMap,
      envMapIntensity: 0.25,
      side: THREE.DoubleSide,
    });
  }
}
