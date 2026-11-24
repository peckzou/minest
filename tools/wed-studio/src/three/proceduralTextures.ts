import * as THREE from 'three';
import { BlueprintId, BLUEPRINT_SPECS } from '../types/studio';

/**
 * Draws an authentic 1954 WED Enterprises Cyanotype / Architectural Blueprint
 * onto any HTMLCanvasElement (used for 3D Drafting Board textures, Wall Blueprints,
 * and the 2D Full-Screen Blueprint Inspector).
 */
export function renderBlueprintToCanvas(
  canvas: HTMLCanvasElement,
  blueprintId: BlueprintId,
  variant: 'cyanotype' | 'vellum' = 'cyanotype'
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  const spec = BLUEPRINT_SPECS[blueprintId];

  // Background fill: Prussian Cyanotype Blue or Vintage Tracing Vellum
  if (variant === 'cyanotype') {
    const grad = ctx.createRadialGradient(w * 0.5, h * 0.45, w * 0.05, w * 0.5, h * 0.5, w * 0.75);
    grad.addColorStop(0, '#134074');
    grad.addColorStop(0.65, '#0b2b53');
    grad.addColorStop(1, '#071b36');
    ctx.fillStyle = grad;
  } else {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#f4ecd8');
    grad.addColorStop(1, '#e7dbb8');
    ctx.fillStyle = grad;
  }
  ctx.fillRect(0, 0, w, h);

  const linePrimary = variant === 'cyanotype' ? 'rgba(235, 248, 255, 0.92)' : 'rgba(28, 45, 72, 0.9)';
  const lineSecondary = variant === 'cyanotype' ? 'rgba(147, 207, 255, 0.55)' : 'rgba(56, 82, 118, 0.55)';
  const lineGrid = variant === 'cyanotype' ? 'rgba(115, 185, 255, 0.16)' : 'rgba(40, 70, 110, 0.12)';
  const accentAmber = variant === 'cyanotype' ? '#ffd166' : '#b83b2a';

  // 1. Fine Engineering Grid (Voxel & Foot module grid)
  ctx.strokeStyle = lineGrid;
  ctx.lineWidth = 1;
  const step = Math.round(w / 32);
  for (let x = step; x < w - step; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, step);
    ctx.lineTo(x, h - step);
    ctx.stroke();
  }
  for (let y = step; y < h - step; y += step) {
    ctx.beginPath();
    ctx.moveTo(step, y);
    ctx.lineTo(w - step, y);
    ctx.stroke();
  }

  // 2. Double Architectural Border & Registration Marks
  const m = Math.round(w * 0.032);
  ctx.strokeStyle = linePrimary;
  ctx.lineWidth = 3;
  ctx.strokeRect(m, m, w - m * 2, h - m * 2);

  ctx.strokeStyle = lineSecondary;
  ctx.lineWidth = 1.2;
  ctx.strokeRect(m + 8, m + 8, w - (m + 8) * 2, h - (m + 8) * 2);

  // Coordinate numbers along top and left border
  ctx.fillStyle = lineSecondary;
  ctx.font = `600 ${Math.round(w * 0.012)}px "JetBrains Mono", monospace`;
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  for (let i = 0; i < 8; i++) {
    const bx = m + ((w - m * 2) / 8) * (i + 0.5);
    ctx.fillText(String(i + 1), bx, m + 22);
  }
  for (let i = 0; i < 6; i++) {
    const by = m + ((h - m * 2) / 6) * (i + 0.5);
    ctx.fillText(letters[i], m + 12, by);
  }

  // 3. Domain-Specific Blueprint Schematic Content
  ctx.save();
  if (blueprintId === 'cinderella-castle-189') {
    drawCinderellaCastle189Schematic(ctx, w, h, linePrimary, lineSecondary, accentAmber);
  } else if (blueprintId === 'florida-project-epcot') {
    drawFloridaProjectEpcotSchematic(ctx, w, h, linePrimary, lineSecondary, accentAmber);
  } else if (blueprintId === 'spaceship-earth-geodesic') {
    drawSpaceshipEarthSchematic(ctx, w, h, linePrimary, lineSecondary, accentAmber);
  } else if (blueprintId === 'monorail-contemporary') {
    drawMonorailContemporarySchematic(ctx, w, h, linePrimary, lineSecondary, accentAmber);
  } else if (blueprintId === 'castle-elevation') {
    drawCastleElevationSchematic(ctx, w, h, linePrimary, lineSecondary, accentAmber);
  } else if (blueprintId === 'master-plan') {
    drawMasterPlanSchematic(ctx, w, h, linePrimary, lineSecondary, accentAmber);
  } else if (blueprintId === 'locomotive-mark1') {
    drawLocomotiveSchematic(ctx, w, h, linePrimary, lineSecondary, accentAmber);
  } else {
    drawMoonlinerSchematic(ctx, w, h, linePrimary, lineSecondary, accentAmber);
  }
  ctx.restore();

  // 4. Official WED Enterprises 1954 Title Block (Bottom Right)
  const tbW = Math.round(w * 0.36);
  const tbH = Math.round(h * 0.19);
  const tbX = w - m - 8 - tbW;
  const tbY = h - m - 8 - tbH;

  ctx.fillStyle = variant === 'cyanotype' ? 'rgba(9, 32, 64, 0.92)' : 'rgba(240, 231, 208, 0.94)';
  ctx.fillRect(tbX, tbY, tbW, tbH);
  ctx.strokeStyle = linePrimary;
  ctx.lineWidth = 2;
  ctx.strokeRect(tbX, tbY, tbW, tbH);

  // Internal dividers of Title Block
  ctx.beginPath();
  ctx.moveTo(tbX, tbY + tbH * 0.34);
  ctx.lineTo(tbX + tbW, tbY + tbH * 0.34);
  ctx.moveTo(tbX, tbY + tbH * 0.68);
  ctx.lineTo(tbX + tbW, tbY + tbH * 0.68);
  ctx.moveTo(tbX + tbW * 0.55, tbY + tbH * 0.68);
  ctx.lineTo(tbX + tbW * 0.55, tbY + tbH);
  ctx.stroke();

  ctx.fillStyle = linePrimary;
  ctx.font = `700 ${Math.round(w * 0.016)}px "Fraunces", Georgia, serif`;
  ctx.fillText('WED ENTERPRISES, INC. · BURBANK, CALIF.', tbX + 14, tbY + tbH * 0.23);

  ctx.font = `600 ${Math.round(w * 0.014)}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillText(spec.subtitle.toUpperCase(), tbX + 14, tbY + tbH * 0.55);

  ctx.fillStyle = accentAmber;
  ctx.font = `600 ${Math.round(w * 0.013)}px "JetBrains Mono", monospace`;
  ctx.fillText(`DWG: ${spec.code} · SCALE: ${spec.scale}`, tbX + 14, tbY + tbH * 0.88);
  ctx.fillStyle = linePrimary;
  ctx.fillText(`APPROVED: W.E.D. ${spec.date}`, tbX + tbW * 0.58, tbY + tbH * 0.88);

  // 5. Voxel Scale Bar & North Arrow (Bottom Left)
  const sbX = m + 28;
  const sbY = h - m - 36;
  ctx.strokeStyle = linePrimary;
  ctx.lineWidth = 1.8;
  ctx.strokeRect(sbX, sbY - 12, 160, 10);
  for (let i = 0; i < 4; i++) {
    if (i % 2 === 0) {
      ctx.fillStyle = linePrimary;
      ctx.fillRect(sbX + i * 40, sbY - 12, 40, 10);
    }
  }
  ctx.fillStyle = linePrimary;
  ctx.font = `600 ${Math.round(w * 0.011)}px "JetBrains Mono", monospace`;
  ctx.fillText('VOXEL GRID MODULE: 1 UNIT = 2.0 FT (1:48 SCALE MODEL TABLE)', sbX, sbY + 12);
}

function drawCastleElevationSchematic(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  primary: string,
  secondary: string,
  accent: string
) {
  const cx = w * 0.38;
  const baseLine = h * 0.78;

  // Centerline & Forced Perspective Tier Horizon Lines
  ctx.save();
  ctx.strokeStyle = secondary;
  ctx.setLineDash([8, 6]);
  ctx.lineWidth = 1.4;
  // Vertical axis
  ctx.beginPath();
  ctx.moveTo(cx, h * 0.11);
  ctx.lineTo(cx, h * 0.84);
  ctx.stroke();

  // 3 Forced perspective tiers
  const tiers = [
    { y: baseLine - h * 0.18, label: 'TIER 1 · 1:1 FULL SCALE ASHLAR STONE (+22.0 FT)' },
    { y: baseLine - h * 0.38, label: 'TIER 2 · 5/8 FORCED PERSPECTIVE KEEP (+48.5 FT)' },
    { y: baseLine - h * 0.62, label: 'TIER 3 · 1/2 SCALE BAVARIAN FINIAL SPIRE (+77.0 FT)' },
  ];
  tiers.forEach((t) => {
    ctx.beginPath();
    ctx.moveTo(w * 0.1, t.y);
    ctx.lineTo(w * 0.68, t.y);
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.font = `600 ${Math.round(w * 0.011)}px "JetBrains Mono", monospace`;
    ctx.fillText(t.label, w * 0.11, t.y - 6);
  });
  ctx.restore();

  // Moat & Foundation Cross-Section
  ctx.strokeStyle = primary;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(w * 0.08, baseLine);
  ctx.lineTo(w * 0.68, baseLine);
  ctx.stroke();

  // Water Moat basins left and right
  ctx.fillStyle = 'rgba(100, 200, 255, 0.15)';
  ctx.fillRect(cx - w * 0.22, baseLine, w * 0.09, h * 0.045);
  ctx.fillRect(cx + w * 0.13, baseLine, w * 0.09, h * 0.045);
  ctx.strokeRect(cx - w * 0.22, baseLine, w * 0.09, h * 0.045);
  ctx.strokeRect(cx + w * 0.13, baseLine, w * 0.09, h * 0.045);

  // Main Lower Curtain Wall & Battlements (Voxel Stepped Profile)
  const wallW = w * 0.28;
  const wallH = h * 0.19;
  ctx.strokeRect(cx - wallW / 2, baseLine - wallH, wallW, wallH);

  // Voxel Crenellations on lower wall
  const crenCount = 11;
  const crenW = wallW / crenCount;
  for (let i = 0; i < crenCount; i += 2) {
    ctx.strokeRect(cx - wallW / 2 + i * crenW, baseLine - wallH - 12, crenW, 12);
  }

  // Drawbridge Archway & Portcullis Grate
  const archW = w * 0.065;
  const archH = h * 0.11;
  ctx.strokeRect(cx - archW / 2, baseLine - archH, archW, archH);
  // Portcullis grid
  ctx.strokeStyle = secondary;
  ctx.lineWidth = 1.2;
  for (let gx = cx - archW * 0.35; gx <= cx + archW * 0.35; gx += archW * 0.175) {
    ctx.beginPath();
    ctx.moveTo(gx, baseLine - archH);
    ctx.lineTo(gx, baseLine);
    ctx.stroke();
  }

  // Left & Right Flanking Round Towers with Conical Voxel Roofs
  ctx.strokeStyle = primary;
  ctx.lineWidth = 2.2;
  const flankOffsets = [-w * 0.155, w * 0.155];
  flankOffsets.forEach((offset) => {
    const tx = cx + offset;
    const tw = w * 0.055;
    const th = h * 0.28;
    ctx.strokeRect(tx - tw / 2, baseLine - th, tw, th);
    // Stepped voxel conical roof
    const steps = 6;
    const roofH = h * 0.13;
    for (let s = 0; s < steps; s++) {
      const rw = tw * 1.25 * (1 - s / steps);
      const ry = baseLine - th - (roofH / steps) * (s + 1);
      ctx.strokeRect(tx - rw / 2, ry, rw, roofH / steps);
    }
    // Spire finial
    ctx.beginPath();
    ctx.moveTo(tx, baseLine - th - roofH);
    ctx.lineTo(tx, baseLine - th - roofH - 24);
    ctx.stroke();
  });

  // Upper Pink Keep & Tall Central Bavarian Turret
  const keepW = w * 0.14;
  const keepH = h * 0.36;
  ctx.strokeRect(cx - keepW / 2, baseLine - keepH, keepW, keepH - wallH);

  // Tall Principal Spire (Slightly off-center for organic picturesque balance)
  const spireX = cx + w * 0.022;
  const spireW = w * 0.048;
  const spireBaseY = baseLine - keepH;
  const spireShaftH = h * 0.13;
  ctx.strokeRect(spireX - spireW / 2, spireBaseY - spireShaftH, spireW, spireShaftH);

  // Voxel Crown Roof on Principal Spire
  const mainSteps = 8;
  const mainRoofH = h * 0.14;
  for (let s = 0; s < mainSteps; s++) {
    const rw = spireW * 1.3 * (1 - s / mainSteps);
    const ry = spireBaseY - spireShaftH - (mainRoofH / mainSteps) * (s + 1);
    ctx.strokeRect(spireX - rw / 2, ry, rw, mainRoofH / mainSteps);
  }

  // Right-side Inset Detail: Voxel Brick Module & Drawbridge Winch Gear
  const insetX = w * 0.71;
  const insetY = h * 0.12;
  const insetW = w * 0.23;
  const insetH = h * 0.56;
  ctx.strokeStyle = secondary;
  ctx.lineWidth = 1.6;
  ctx.strokeRect(insetX, insetY, insetW, insetH);

  ctx.fillStyle = primary;
  ctx.font = `600 ${Math.round(w * 0.012)}px "JetBrains Mono", monospace`;
  ctx.fillText('DETAIL A: VOXEL TURRET MODULE', insetX + 14, insetY + 26);

  // Isometric Voxel Cube Stack Diagram inside Detail Box
  const isoCx = insetX + insetW * 0.5;
  const isoCy = insetY + insetH * 0.35;
  const r = w * 0.035;
  for (let layer = 0; layer < 3; layer++) {
    const ly = isoCy - layer * r * 0.85;
    const lr = r * (1 - layer * 0.22);
    ctx.strokeStyle = layer === 2 ? accent : primary;
    ctx.beginPath();
    ctx.moveTo(isoCx, ly - lr);
    ctx.lineTo(isoCx + lr, ly - lr * 0.5);
    ctx.lineTo(isoCx + lr, ly + lr * 0.5);
    ctx.lineTo(isoCx, ly + lr);
    ctx.lineTo(isoCx - lr, ly + lr * 0.5);
    ctx.lineTo(isoCx - lr, ly - lr * 0.5);
    ctx.closePath();
    ctx.stroke();
  }

  ctx.fillStyle = secondary;
  ctx.font = `400 ${Math.round(w * 0.0105)}px "JetBrains Mono", monospace`;
  ctx.fillText('· BASE: BAVARIAN LIMESTONE', insetX + 16, insetY + insetH * 0.68);
  ctx.fillText('· UPPER: WARM ROSE STUCCO', insetX + 16, insetY + insetH * 0.76);
  ctx.fillText('· ROOF: ROYAL COBALT GLAZE', insetX + 16, insetY + insetH * 0.84);
  ctx.fillText('· FINIAL: 22K GOLD LEAF VOXEL', insetX + 16, insetY + insetH * 0.92);
}

function drawMasterPlanSchematic(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  primary: string,
  secondary: string,
  accent: string
) {
  const cx = w * 0.42;
  const cy = h * 0.48;

  // Perimeter Berm & Santa Fe Railroad Oval Track
  ctx.strokeStyle = primary;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(cx, cy, w * 0.31, h * 0.35, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = secondary;
  ctx.setLineDash([10, 6]);
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.ellipse(cx, cy, w * 0.295, h * 0.332, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Central Hub (The Hub) concentric circles
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(cx, cy - h * 0.02, w * 0.048, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy - h * 0.02, w * 0.018, 0, Math.PI * 2);
  ctx.stroke();

  // Radial Spokes to 5 Lands
  const spokes = [
    { angle: Math.PI * 0.5, len: h * 0.28, label: 'MAIN STREET, U.S.A. (SOUTH ENTRY)' },
    { angle: -Math.PI * 0.5, len: h * 0.25, label: 'FANTASYLAND & SLEEPING BEAUTY CASTLE' },
    { angle: 0, len: w * 0.22, label: 'TOMORROWLAND & TWA MOONLINER' },
    { angle: Math.PI * 0.82, len: w * 0.22, label: 'ADVENTURELAND JUNGLE RIVER' },
    { angle: -Math.PI * 0.82, len: w * 0.23, label: 'FRONTIERLAND & RIVERS OF AMERICA' },
  ];

  spokes.forEach((s) => {
    const ex = cx + Math.cos(s.angle) * s.len;
    const ey = cy - h * 0.02 + Math.sin(s.angle) * s.len;
    ctx.strokeStyle = primary;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy - h * 0.02);
    ctx.lineTo(ex, ey);
    ctx.stroke();

    // Node box at land entrance
    ctx.fillStyle = accent;
    ctx.fillRect(ex - 6, ey - 6, 12, 12);
    ctx.fillStyle = primary;
    ctx.font = `600 ${Math.round(w * 0.011)}px "JetBrains Mono", monospace`;
    ctx.fillText(s.label, ex - 75, ey - 14);
  });

  // Voxel Table Grid Callouts on Right Sidebar
  const boxX = w * 0.74;
  const boxY = h * 0.12;
  ctx.strokeStyle = secondary;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(boxX, boxY, w * 0.2, h * 0.52);
  ctx.fillStyle = primary;
  ctx.font = `600 ${Math.round(w * 0.012)}px "JetBrains Mono", monospace`;
  ctx.fillText('SITE ZONES (1:48 TABLE)', boxX + 14, boxY + 28);
  const zones = [
    '01. MAIN ST. TRAIN DEPOT',
    '02. TOWN SQUARE & EMPORIUM',
    '03. CENTRAL PLAZA HUB',
    '04. SLEEPING BEAUTY CASTLE',
    '05. KING ARTHUR CARROUSEL',
    '06. TWA MOONLINER ROCKET',
    '07. ASTRO JETS LAUNCHER',
    '08. JUNGLE CRUISE WATERWAY',
    '09. BIG THUNDER RED BUTTES',
  ];
  ctx.fillStyle = secondary;
  ctx.font = `400 ${Math.round(w * 0.0105)}px "JetBrains Mono", monospace`;
  zones.forEach((z, idx) => {
    ctx.fillText(z, boxX + 14, boxY + 62 + idx * 34);
  });
}

function drawLocomotiveSchematic(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  primary: string,
  secondary: string,
  accent: string
) {
  const railY = h * 0.65;
  // Track bed & steel rails
  ctx.strokeStyle = primary;
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.moveTo(w * 0.08, railY);
  ctx.lineTo(w * 0.75, railY);
  ctx.stroke();

  // Crossties
  for (let x = w * 0.09; x < w * 0.74; x += 22) {
    ctx.strokeRect(x, railY, 10, 8);
  }

  // 4-4-0 Locomotive Boiler & Cab Elevation
  const bx = w * 0.22;
  const by = railY - h * 0.24;
  // Boiler barrel
  ctx.strokeRect(bx, by, w * 0.22, h * 0.11);
  // Engineer Cab
  ctx.strokeRect(bx - w * 0.09, by - h * 0.05, w * 0.09, h * 0.16);
  // Balloon Smokestack
  ctx.beginPath();
  ctx.moveTo(bx + w * 0.17, by);
  ctx.lineTo(bx + w * 0.15, by - h * 0.12);
  ctx.lineTo(bx + w * 0.21, by - h * 0.12);
  ctx.lineTo(bx + w * 0.19, by);
  ctx.closePath();
  ctx.stroke();
  // Steam Dome & Sand Dome
  ctx.strokeRect(bx + w * 0.04, by - h * 0.06, w * 0.04, h * 0.06);
  ctx.strokeRect(bx + w * 0.11, by - h * 0.05, w * 0.035, h * 0.05);
  // Cowcatcher (Pilot)
  ctx.beginPath();
  ctx.moveTo(bx + w * 0.22, railY - 12);
  ctx.lineTo(bx + w * 0.27, railY - 4);
  ctx.lineTo(bx + w * 0.22, railY - h * 0.1);
  ctx.closePath();
  ctx.stroke();

  // Driving Wheels (2 large) + Leading Truck Wheels (2 small)
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2.4;
  [bx - w * 0.04, bx + w * 0.04].forEach((wx) => {
    ctx.beginPath();
    ctx.arc(wx, railY - h * 0.065, h * 0.065, 0, Math.PI * 2);
    ctx.stroke();
  });
  [bx + w * 0.14, bx + w * 0.2].forEach((wx) => {
    ctx.beginPath();
    ctx.arc(wx, railY - h * 0.035, h * 0.035, 0, Math.PI * 2);
    ctx.stroke();
  });

  ctx.fillStyle = primary;
  ctx.font = `600 ${Math.round(w * 0.013)}px "JetBrains Mono", monospace`;
  ctx.fillText('LOCOMOTIVE NO. 1 "C.K. HOLLIDAY" · 4-4-0 LIVE STEAM VOXEL ASSEMBLY', w * 0.12, h * 0.22);
}

function drawMoonlinerSchematic(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  primary: string,
  secondary: string,
  accent: string
) {
  const rx = w * 0.34;
  const groundY = h * 0.78;
  // Rocket fuselage profile
  ctx.strokeStyle = primary;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(rx, h * 0.14); // Nose cone tip
  ctx.quadraticCurveTo(rx + w * 0.055, h * 0.35, rx + w * 0.04, groundY - h * 0.12);
  ctx.lineTo(rx - w * 0.04, groundY - h * 0.12);
  ctx.quadraticCurveTo(rx - w * 0.055, h * 0.35, rx, h * 0.14);
  ctx.stroke();

  // 3 Landing Strut Fins
  ctx.strokeStyle = accent;
  ctx.beginPath();
  ctx.moveTo(rx - w * 0.04, groundY - h * 0.2);
  ctx.lineTo(rx - w * 0.1, groundY);
  ctx.lineTo(rx - w * 0.03, groundY - h * 0.12);
  ctx.moveTo(rx + w * 0.04, groundY - h * 0.2);
  ctx.lineTo(rx + w * 0.1, groundY);
  ctx.lineTo(rx + w * 0.03, groundY - h * 0.12);
  ctx.stroke();

  // Plan View of Rocket & Astro Jets on right
  ctx.strokeStyle = secondary;
  ctx.beginPath();
  ctx.arc(w * 0.62, h * 0.38, w * 0.09, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = primary;
  ctx.font = `600 ${Math.round(w * 0.012)}px "JetBrains Mono", monospace`;
  ctx.fillText('TWA MOONLINER (+76.0 FT) & ASTRO JETS ORBITAL ROTOR', w * 0.48, h * 0.2);
}

function drawCinderellaCastle189Schematic(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  primary: string,
  secondary: string,
  accent: string
) {
  const cx = w * 0.36;
  const parkDeckY = h * 0.72;
  const utilidorFloorY = h * 0.83;

  // 1. Sub-Level Utilidor Underground Tunnel Cross-Section (Below Park Deck!)
  ctx.fillStyle = 'rgba(255, 209, 102, 0.12)';
  ctx.fillRect(w * 0.08, parkDeckY, w * 0.56, utilidorFloorY - parkDeckY);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2.2;
  ctx.strokeRect(w * 0.08, parkDeckY, w * 0.56, utilidorFloorY - parkDeckY);

  // Utilidor Structural Columns & AVAC Pneumatic Tubes
  for (let ux = w * 0.14; ux < w * 0.62; ux += w * 0.08) {
    ctx.strokeRect(ux - 4, parkDeckY, 8, utilidorFloorY - parkDeckY);
  }
  ctx.fillStyle = accent;
  ctx.font = `600 ${Math.round(w * 0.011)}px "JetBrains Mono", monospace`;
  ctx.fillText(
    'LEVEL 01: UTILIDOR SUB-TERRANEAN CORRIDOR & DACS CENTRAL COMPUTER (+14.0 FT ELEV)',
    w * 0.095,
    utilidorFloorY - 12
  );

  // 2. Magic Kingdom Second-Floor Grade Deck & Swan Moat
  ctx.strokeStyle = primary;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(w * 0.07, parkDeckY);
  ctx.lineTo(w * 0.66, parkDeckY);
  ctx.stroke();

  // 3. Cinderella Castle 189-ft Soaring Gothic-French Spire Profile
  // Lower Ashlar Bastion & Clock Archway
  const baseW = w * 0.26;
  const baseH = h * 0.16;
  ctx.strokeRect(cx - baseW / 2, parkDeckY - baseH, baseW, baseH);

  // Clock above Gothic Archway
  ctx.beginPath();
  ctx.arc(cx, parkDeckY - baseH * 0.72, w * 0.016, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeRect(cx - w * 0.03, parkDeckY - baseH * 0.52, w * 0.06, baseH * 0.52);

  // Flanking Turrets with Tall Conical Spires
  [-w * 0.14, -w * 0.085, w * 0.085, w * 0.14].forEach((offset, idx) => {
    const tx = cx + offset;
    const tw = idx === 0 || idx === 3 ? w * 0.038 : w * 0.044;
    const th = idx === 0 || idx === 3 ? h * 0.25 : h * 0.36;
    ctx.strokeRect(tx - tw / 2, parkDeckY - th, tw, th);

    // Tall French Gothic Cone Spire
    const coneH = idx === 0 || idx === 3 ? h * 0.11 : h * 0.15;
    ctx.beginPath();
    ctx.moveTo(tx - tw * 0.65, parkDeckY - th);
    ctx.lineTo(tx, parkDeckY - th - coneH);
    ctx.lineTo(tx + tw * 0.65, parkDeckY - th);
    ctx.closePath();
    ctx.stroke();
  });

  // Central Soaring 189-ft Golden Spire & Flying Buttresses
  const mainKeepW = w * 0.085;
  const mainKeepH = h * 0.44;
  ctx.strokeRect(cx - mainKeepW / 2, parkDeckY - mainKeepH, mainKeepW, mainKeepH - baseH);

  // Principal 189-ft Crown Spire
  const crownW = w * 0.045;
  const crownH = h * 0.58;
  ctx.strokeStyle = accent;
  ctx.strokeRect(cx - crownW / 2, parkDeckY - crownH, crownW, crownH - mainKeepH);
  ctx.beginPath();
  ctx.moveTo(cx - crownW * 0.75, parkDeckY - crownH);
  ctx.lineTo(cx, h * 0.06);
  ctx.lineTo(cx + crownW * 0.75, parkDeckY - crownH);
  ctx.closePath();
  ctx.stroke();

  // Elevation Datum Callouts
  ctx.fillStyle = primary;
  ctx.font = `600 ${Math.round(w * 0.0115)}px "JetBrains Mono", monospace`;
  ctx.fillText('← +189\'-0" FINIAL GOLD SPIRE (FAA LIMIT)', cx + w * 0.035, h * 0.085);
  ctx.fillText('← +125\'-0" ROYAL BANQUET HALL & BALCONY', cx + w * 0.065, parkDeckY - mainKeepH);

  // Right Inset: Utilidor Ring Plan Diagram
  const insetX = w * 0.69;
  const insetY = h * 0.11;
  ctx.strokeStyle = secondary;
  ctx.lineWidth = 1.6;
  ctx.strokeRect(insetX, insetY, w * 0.25, h * 0.54);
  ctx.fillStyle = primary;
  ctx.fillText('ORLANDO UTILIDOR TUNNEL LOOP', insetX + 14, insetY + 26);

  ctx.strokeStyle = accent;
  ctx.beginPath();
  ctx.arc(insetX + w * 0.125, insetY + h * 0.28, w * 0.075, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(insetX + w * 0.125, insetY + h * 0.205);
  ctx.lineTo(insetX + w * 0.125, insetY + h * 0.42);
  ctx.stroke();
}

function drawFloridaProjectEpcotSchematic(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  primary: string,
  secondary: string,
  accent: string
) {
  // North-South High-Speed Monorail Spine connecting Magic Kingdom (Top Left) & EPCOT Radial City (Center-Right)
  const mkX = w * 0.24;
  const mkY = h * 0.28;
  const epcotX = w * 0.54;
  const epcotY = h * 0.52;

  // Magic Kingdom Hub & Seven Seas Lagoon at North
  ctx.strokeStyle = primary;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(mkX, mkY, w * 0.11, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = primary;
  ctx.font = `600 ${Math.round(w * 0.0115)}px "JetBrains Mono", monospace`;
  ctx.fillText('NORTH: MAGIC KINGDOM & CINDERELLA CASTLE', mkX - w * 0.11, mkY - w * 0.125);

  // High-Speed Alweg Monorail Highway Corridor
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(mkX, mkY + w * 0.11);
  ctx.quadraticCurveTo(w * 0.34, h * 0.5, epcotX, epcotY);
  ctx.stroke();

  // Walt Disney's 1966 E.P.C.O.T. Radial Concentric Circles Topology
  const radii = [w * 0.04, w * 0.085, w * 0.135, w * 0.185];
  radii.forEach((r, idx) => {
    ctx.strokeStyle = idx === 0 ? accent : idx % 2 === 0 ? primary : secondary;
    ctx.lineWidth = idx === 0 ? 2.5 : 1.8;
    ctx.beginPath();
    ctx.arc(epcotX, epcotY, r, 0, Math.PI * 2);
    ctx.stroke();
  });

  // 16 Radial Transit Spokes of E.P.C.O.T.
  ctx.strokeStyle = secondary;
  ctx.lineWidth = 1.2;
  for (let a = 0; a < 16; a++) {
    const theta = (a * Math.PI * 2) / 16;
    ctx.beginPath();
    ctx.moveTo(epcotX + Math.cos(theta) * radii[0], epcotY + Math.sin(theta) * radii[0]);
    ctx.lineTo(epcotX + Math.cos(theta) * radii[3], epcotY + Math.sin(theta) * radii[3]);
    ctx.stroke();
  }

  ctx.fillStyle = accent;
  ctx.fillText('E.P.C.O.T. RADIAL CITY & SPACESHIP EARTH SPHERE', epcotX - w * 0.13, epcotY - w * 0.2);
}

function drawSpaceshipEarthSchematic(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  primary: string,
  secondary: string,
  accent: string
) {
  const cx = w * 0.36;
  const cy = h * 0.43;
  const r = h * 0.25;
  const groundY = h * 0.77;

  // Complete 360-deg Geodesic Sphere Outline
  ctx.strokeStyle = primary;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  // Geodesic Triangulated Latitude/Longitude Grid Lines
  ctx.strokeStyle = secondary;
  ctx.lineWidth = 1.3;
  for (let i = -3; i <= 3; i++) {
    if (i === 0) continue;
    const latY = cy + (i / 4) * r;
    const chordHalf = Math.sqrt(Math.max(0, r * r - Math.pow((i / 4) * r, 2)));
    ctx.beginPath();
    ctx.moveTo(cx - chordHalf, latY);
    ctx.lineTo(cx + chordHalf, latY);
    ctx.stroke();
  }
  for (let i = 1; i <= 3; i++) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, (r * i) / 4, r, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 3 Pairs of Heavy A-Frame Support Legs Lifting Sphere 18 ft Above Plaza
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  [-r * 0.58, 0, r * 0.58].forEach((lx) => {
    ctx.beginPath();
    ctx.moveTo(cx + lx * 0.75, cy + r * 0.65);
    ctx.lineTo(cx + lx * 1.15, groundY);
    ctx.stroke();
  });

  ctx.strokeStyle = primary;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(w * 0.12, groundY);
  ctx.lineTo(w * 0.64, groundY);
  ctx.stroke();

  ctx.fillStyle = primary;
  ctx.font = `600 ${Math.round(w * 0.012)}px "JetBrains Mono", monospace`;
  ctx.fillText('SPACESHIP EARTH · 180\'-0" GEODESIC SPHERE · 11,324 ALUCOBOND PYRAMIDS', w * 0.14, h * 0.13);
}

function drawMonorailContemporarySchematic(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  primary: string,
  secondary: string,
  accent: string
) {
  const cx = w * 0.36;
  const groundY = h * 0.78;
  const topY = h * 0.18;

  // Contemporary Resort 14-Story A-Frame Structural Steel Trusses
  ctx.strokeStyle = primary;
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.2, groundY);
  ctx.lineTo(cx - w * 0.07, topY);
  ctx.lineTo(cx + w * 0.07, topY);
  ctx.lineTo(cx + w * 0.2, groundY);
  ctx.closePath();
  ctx.stroke();

  // Modular Room Tiers along Left & Right Slopes
  ctx.strokeStyle = secondary;
  ctx.lineWidth = 1.3;
  for (let tier = 1; tier <= 9; tier++) {
    const ty = groundY - (tier / 10) * (groundY - topY);
    const halfSpan = w * 0.2 - (tier / 10) * w * 0.13;
    ctx.beginPath();
    ctx.moveTo(cx - halfSpan, ty);
    ctx.lineTo(cx + halfSpan, ty);
    ctx.stroke();
  }

  // Grand Canyon Concourse Open Atrium & Mark IV Monorail Beamway Passing Through!
  const concourseY = groundY - (groundY - topY) * 0.36;
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(w * 0.08, concourseY);
  ctx.lineTo(w * 0.72, concourseY);
  ctx.stroke();

  // Monorail Train Car inside Concourse
  ctx.fillStyle = accent;
  ctx.fillRect(cx - w * 0.09, concourseY - 18, w * 0.18, 16);

  ctx.fillStyle = primary;
  ctx.font = `600 ${Math.round(w * 0.012)}px "JetBrains Mono", monospace`;
  ctx.fillText('CONTEMPORARY RESORT 14-STORY A-FRAME & MARK IV MONORAIL CONCOURSE', w * 0.12, h * 0.13);
}

export function createBlueprintTexture(
  blueprintId: BlueprintId,
  maxAnisotropy: number,
  variant: 'cyanotype' | 'vellum' = 'cyanotype'
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 720;
  renderBlueprintToCanvas(canvas, blueprintId, variant);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return texture;
}

export function createDraftingMatTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 768;
  const ctx = canvas.getContext('2d')!;

  // Vintage 1950s self-healing green linoleum drafting surface
  const grad = ctx.createLinearGradient(0, 0, 1024, 768);
  grad.addColorStop(0, '#1f4d3a');
  grad.addColorStop(0.5, '#1a4231');
  grad.addColorStop(1, '#143527');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 768);

  // Fine centimeter/inch grid lines
  ctx.strokeStyle = 'rgba(182, 232, 204, 0.15)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= 1024; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 768);
    ctx.stroke();
  }
  for (let y = 0; y <= 768; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }

  // Major 4-inch grid lines & protractor angle arcs
  ctx.strokeStyle = 'rgba(210, 248, 225, 0.32)';
  ctx.lineWidth = 1.6;
  for (let x = 0; x <= 1024; x += 128) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 768);
    ctx.stroke();
  }
  for (let y = 0; y <= 768; y += 128) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }

  // Protractor arc in corner
  ctx.beginPath();
  ctx.arc(160, 620, 110, -Math.PI * 0.5, 0);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  return texture;
}

export function createRulerTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#d4a857';
  ctx.fillRect(0, 0, 512, 64);

  ctx.fillStyle = '#2b1d0c';
  for (let x = 8; x < 504; x += 8) {
    const isMajor = x % 32 === 0;
    const tickH = isMajor ? 26 : x % 16 === 0 ? 18 : 11;
    ctx.fillRect(x, 0, 2, tickH);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  return texture;
}

export function createCorkboardTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Warm cork background
  ctx.fillStyle = '#8c5e37';
  ctx.fillRect(0, 0, 1024, 512);

  // Subtle cork speckle grain
  for (let i = 0; i < 2400; i++) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(60, 35, 15, 0.25)' : 'rgba(185, 138, 92, 0.22)';
    ctx.fillRect(Math.random() * 1024, Math.random() * 512, 3, 3);
  }

  // Pinned Storyboard & Mary Blair Color Cards
  const cards = [
    { x: 45, y: 40, w: 210, h: 150, bg: '#f7f1e1', title: 'STORYBOARD #12 · MAIN ST.' },
    { x: 280, y: 50, w: 195, h: 140, bg: '#163c6e', title: 'CASTLE NIGHT LIGHTING' },
    { x: 505, y: 36, w: 230, h: 155, bg: '#f4e7cb', title: 'JUNGLE RIVER LAYOUT' },
    { x: 760, y: 45, w: 220, h: 145, bg: '#1b3b2b', title: 'SANTA FE NO. 1 ELEV.' },
    { x: 55, y: 230, w: 280, h: 225, bg: '#f9f3e3', title: 'MARY BLAIR PALETTE SWATCHES' },
    { x: 365, y: 235, w: 310, h: 220, bg: '#0e2d54', title: 'HUB RADIAL TRAFFIC FLOW' },
    { x: 705, y: 230, w: 275, h: 225, bg: '#f4ebd4', title: 'TIKI ANIMATRONIC CAM GEAR' },
  ];

  cards.forEach((c, idx) => {
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(c.x + 5, c.y + 6, c.w, c.h);

    ctx.fillStyle = c.bg;
    ctx.fillRect(c.x, c.y, c.w, c.h);

    // Pushpin head
    ctx.fillStyle = idx % 2 === 0 ? '#d93829' : '#f4b942';
    ctx.beginPath();
    ctx.arc(c.x + c.w * 0.5, c.y + 12, 6, 0, Math.PI * 2);
    ctx.fill();

    // Card header & schematic lines
    const isDark = c.bg.startsWith('#1') || c.bg.startsWith('#0');
    ctx.fillStyle = isDark ? '#e6f3ff' : '#233142';
    ctx.font = '700 13px "JetBrains Mono", monospace';
    ctx.fillText(c.title, c.x + 14, c.y + 34);

    if (idx === 4) {
      // Mary Blair color swatches grid
      const swatches = ['#e05368', '#3c78b5', '#f2b749', '#49a078', '#8d5b9c', '#e87a41', '#2c4c7e', '#d6c29f'];
      swatches.forEach((sw, sIdx) => {
        const sx = c.x + 18 + (sIdx % 4) * 62;
        const sy = c.y + 55 + Math.floor(sIdx / 4) * 74;
        ctx.fillStyle = sw;
        ctx.fillRect(sx, sy, 50, 56);
      });
    } else {
      ctx.strokeStyle = isDark ? 'rgba(180,225,255,0.7)' : 'rgba(40,60,90,0.6)';
      ctx.lineWidth = 2;
      ctx.strokeRect(c.x + 16, c.y + 48, c.w - 32, c.h - 66);
      ctx.beginPath();
      ctx.moveTo(c.x + 28, c.y + c.h - 32);
      ctx.lineTo(c.x + c.w * 0.5, c.y + 64);
      ctx.lineTo(c.x + c.w - 28, c.y + c.h - 32);
      ctx.stroke();
    }
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  return texture;
}

export function createStudioFloorTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#38291e';
  ctx.fillRect(0, 0, 512, 512);

  // Parquet oak planks
  const plankH = 64;
  for (let y = 0; y < 512; y += plankH) {
    const shade = (y / plankH) % 2 === 0 ? '#413023' : '#35261b';
    ctx.fillStyle = shade;
    ctx.fillRect(0, y, 512, plankH - 2);
    ctx.strokeStyle = '#241810';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, y, 512, plankH);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  texture.anisotropy = maxAnisotropy;
  return texture;
}

/**
 * Herb Ryman's Famous September 1953 Weekend Aerial Concept Painting
 * (Warm sepia charcoal & gouache washes of Disneyland mounted on the Display Easel)
 */
export function createHerbRymanAerialTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 540;
  const ctx = canvas.getContext('2d')!;

  // Warm vintage illustration board background
  const bgGrad = ctx.createRadialGradient(384, 240, 40, 384, 270, 440);
  bgGrad.addColorStop(0, '#f7ecd5');
  bgGrad.addColorStop(0.65, '#e8d5b5');
  bgGrad.addColorStop(1, '#cbb289');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 768, 540);

  // Outer cream mat board border
  ctx.strokeStyle = '#5c4028';
  ctx.lineWidth = 14;
  ctx.strokeRect(14, 14, 740, 512);
  ctx.strokeStyle = '#8c6b4a';
  ctx.lineWidth = 2;
  ctx.strokeRect(28, 28, 712, 484);

  // Sky horizon wash at top
  const skyGrad = ctx.createLinearGradient(0, 30, 0, 175);
  skyGrad.addColorStop(0, 'rgba(92, 158, 214, 0.45)');
  skyGrad.addColorStop(1, 'rgba(245, 218, 168, 0.05)');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(30, 30, 708, 145);

  // Green berm foliage washes
  ctx.fillStyle = 'rgba(72, 122, 78, 0.35)';
  ctx.beginPath();
  ctx.ellipse(384, 295, 310, 175, 0, 0, Math.PI * 2);
  ctx.fill();

  // Frontierland / Adventureland Waterways on Left (Watercolor turquoise)
  ctx.fillStyle = 'rgba(42, 148, 166, 0.45)';
  ctx.beginPath();
  ctx.ellipse(205, 275, 78, 110, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Castle Moat & Hub Plaza in Center
  ctx.strokeStyle = '#3b2818';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(384, 285, 48, 0, Math.PI * 2);
  ctx.stroke();

  // Main Street Corridor leading south
  ctx.fillStyle = 'rgba(184, 88, 66, 0.38)';
  ctx.fillRect(354, 333, 60, 125);
  ctx.strokeRect(354, 333, 60, 125);

  // Hand-sketched Sleeping Beauty Castle silhouette at North Axis
  ctx.fillStyle = 'rgba(224, 132, 152, 0.65)';
  ctx.fillRect(350, 138, 68, 56);
  ctx.strokeStyle = '#2d1e12';
  ctx.lineWidth = 2.2;
  ctx.strokeRect(350, 138, 68, 56);

  // Castle Blue Spires in Gouache
  ctx.fillStyle = '#255c99';
  [356, 384, 412].forEach((sx, i) => {
    const sh = i === 1 ? 58 : 38;
    ctx.beginPath();
    ctx.moveTo(sx - 12, 138);
    ctx.lineTo(sx, 138 - sh);
    ctx.lineTo(sx + 12, 138);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });

  // Tomorrowland Rocket on East Side
  ctx.fillStyle = '#d93829';
  ctx.beginPath();
  ctx.moveTo(565, 265);
  ctx.lineTo(575, 190);
  ctx.lineTo(585, 265);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Herb Ryman Title Banner at Bottom
  ctx.fillStyle = '#2d1e12';
  ctx.font = '700 20px "Fraunces", Georgia, serif';
  ctx.fillText('DISNEYLAND · AERIAL CONCEPT PERSPECTIVE', 175, 492);
  ctx.font = '600 12px "JetBrains Mono", monospace';
  ctx.fillStyle = '#6e4e32';
  ctx.fillText('DELINEATED BY HERB RYMAN · SEPT. 26-27, 1953 · BURBANK', 202, 508);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  return texture;
}

/**
 * Kem Weber Animation Desk Illuminated Rotoscope Disc Texture
 * (Backlit warm milk-glass disc with blue animation rough pencil lines & Acme peg holes)
 */
export function createAnimationDiscTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Backlit frosted glass glow
  const grad = ctx.createRadialGradient(256, 256, 30, 256, 256, 250);
  grad.addColorStop(0, '#fffbeb');
  grad.addColorStop(0.75, '#fef3c7');
  grad.addColorStop(1, '#d97706');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Translucent animation bond paper sheet
  ctx.fillStyle = 'rgba(255, 252, 240, 0.85)';
  ctx.fillRect(56, 76, 400, 340);
  ctx.strokeStyle = 'rgba(180, 140, 90, 0.6)';
  ctx.lineWidth = 2;
  ctx.strokeRect(56, 76, 400, 340);

  // 12-Field Animation Crosshair Grid
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.25)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(256, 76);
  ctx.lineTo(256, 416);
  ctx.moveTo(56, 246);
  ctx.lineTo(456, 246);
  ctx.stroke();

  // Animator's Non-Photo Blue Pencil Construction Sketch (Mickey & Tinker Bell over Castle)
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 3;
  // Head circle
  ctx.beginPath();
  ctx.arc(235, 250, 48, 0, Math.PI * 2);
  ctx.stroke();
  // Ears
  ctx.beginPath();
  ctx.arc(192, 198, 28, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(282, 204, 28, 0, Math.PI * 2);
  ctx.stroke();

  // Clean Red Tie-Down Lines
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(235, 250, 50, -0.3, Math.PI + 0.3);
  ctx.stroke();

  // Frame Number Callout in Bottom Right Corner of Animation Sheet
  ctx.fillStyle = '#1e293b';
  ctx.font = '700 18px "JetBrains Mono", monospace';
  ctx.fillText('SC-01 · CEL 14A', 295, 398);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  return texture;
}

/**
 * 1950s Tektronix CRT Oscilloscope Phosphor Screen for Audio-Animatronics Pulse Testing
 */
export function createOscilloscopeTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#042f1a';
  ctx.fillRect(0, 0, 256, 256);

  // Graticule grid
  ctx.strokeStyle = 'rgba(52, 211, 153, 0.25)';
  ctx.lineWidth = 1;
  for (let i = 32; i < 256; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 256);
    ctx.moveTo(0, i);
    ctx.lineTo(256, i);
    ctx.stroke();
  }

  // Channel 1: Audio-Animatronics Solenoid Sine/Cam Wave
  ctx.strokeStyle = '#4ade80';
  ctx.lineWidth = 4;
  ctx.beginPath();
  for (let x = 0; x < 256; x += 4) {
    const y = 92 + Math.sin(x * 0.08) * 34 + Math.cos(x * 0.22) * 12;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Channel 2: Square Step Sync Pulse for Project Little Man
  ctx.strokeStyle = '#a7f3d0';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let x = 0; x < 256; x += 32) {
    const high = (x / 32) % 2 === 0 ? 168 : 205;
    ctx.lineTo(x, high);
    ctx.lineTo(x + 32, high);
  }
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  return texture;
}

/**
 * Roger Broggie's Machine Shop Perforated Pegboard Tool Wall
 */
export function createPegboardToolTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 384;
  const ctx = canvas.getContext('2d')!;

  // Masonite pegboard brown
  ctx.fillStyle = '#4a3525';
  ctx.fillRect(0, 0, 512, 384);

  // Pegboard hole matrix
  ctx.fillStyle = '#1f140d';
  for (let x = 16; x < 512; x += 16) {
    for (let y = 16; y < 384; y += 16) {
      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // White painted shadow-board tool organization outlines + metallic tools
  const drawWrench = (wx: number, wy: number, len: number) => {
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 3;
    ctx.strokeRect(wx - 7, wy, 14, len);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(wx - 5, wy + 2, 10, len - 4);
    ctx.beginPath();
    ctx.arc(wx, wy, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(wx, wy + len, 11, 0, Math.PI * 2);
    ctx.fill();
  };

  [55, 95, 135, 175, 215].forEach((wx, idx) => {
    drawWrench(wx, 55, 140 - idx * 14);
  });

  // Brass Calipers & Steam Pressure Gauges on Right half of Pegboard
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(325, 115, 38, 0.4, Math.PI * 2 - 0.4);
  ctx.stroke();

  // Steam Gauge Dials
  [415, 465].forEach((gx) => {
    ctx.fillStyle = '#e3b448';
    ctx.beginPath();
    ctx.arc(gx, 110, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(gx, 110, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(gx, 110);
    ctx.lineTo(gx + 10, 99);
    ctx.stroke();
  });

  // Machine Shop Header Stencil
  ctx.fillStyle = '#fbbf24';
  ctx.font = '700 16px "JetBrains Mono", monospace';
  ctx.fillText('WED MACHINE SHOP · LIVE STEAM TOOLING', 45, 348);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  return texture;
}

/**
 * Suite 3H Executive Burgundy & Gold Woven Wool Carpet Texture
 */
export function createOfficeRugTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 384;
  const ctx = canvas.getContext('2d')!;

  // Rich mid-century burgundy wool base
  const grad = ctx.createRadialGradient(256, 192, 40, 256, 192, 310);
  grad.addColorStop(0, '#6b1d28');
  grad.addColorStop(0.7, '#4f121b');
  grad.addColorStop(1, '#380b12');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 384);

  // Subtle woven tweed cross-hatch
  ctx.strokeStyle = 'rgba(255, 215, 140, 0.06)';
  ctx.lineWidth = 1;
  for (let x = 0; x < 512; x += 6) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 384);
    ctx.stroke();
  }
  for (let y = 0; y < 384; y += 6) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  // Gold & cream Art Deco double border
  ctx.strokeStyle = '#d4a857';
  ctx.lineWidth = 5;
  ctx.strokeRect(18, 18, 476, 348);
  ctx.strokeStyle = 'rgba(244, 235, 214, 0.55)';
  ctx.lineWidth = 2;
  ctx.strokeRect(28, 28, 456, 328);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  return texture;
}

/**
 * Framed 1928 "Steamboat Willie" Original Animation Cel in Walt Disney's Suite 3H Office
 */
export function createWaltsSteamboatCelTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 384;
  const ctx = canvas.getContext('2d')!;

  // Museum cream archival mat board
  ctx.fillStyle = '#efe6d0';
  ctx.fillRect(0, 0, 512, 384);

  // Inner gold bevel mat window
  ctx.strokeStyle = '#c59b38';
  ctx.lineWidth = 6;
  ctx.strokeRect(44, 38, 424, 282);

  // 1928 Vintage Silver-Screen Grey Cel Background
  const celGrad = ctx.createLinearGradient(48, 42, 48, 316);
  celGrad.addColorStop(0, '#d8d6cf');
  celGrad.addColorStop(0.65, '#bdbab0');
  celGrad.addColorStop(1, '#8c8980');
  ctx.fillStyle = celGrad;
  ctx.fillRect(48, 42, 416, 274);

  // Steamboat Twin angled Smokestacks on Right
  ctx.fillStyle = '#262626';
  ctx.strokeStyle = '#111111';
  ctx.lineWidth = 3;
  [335, 385].forEach((sx, i) => {
    ctx.beginPath();
    ctx.moveTo(sx, 215);
    ctx.lineTo(sx + 18, 105 + i * 12);
    ctx.lineTo(sx + 44, 110 + i * 12);
    ctx.lineTo(sx + 28, 215);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Puff of musical steam clouds
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(sx + 38, 82 + i * 8, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#262626';
  });

  // Ship's Wooden Pilot Wheel
  const wx = 185;
  const wy = 212;
  ctx.strokeStyle = '#1f2937';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(wx, wy, 48, 0, Math.PI * 2);
  ctx.stroke();
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
    ctx.beginPath();
    ctx.moveTo(wx, wy);
    ctx.lineTo(wx + Math.cos(a) * 62, wy + Math.sin(a) * 62);
    ctx.stroke();
  }

  // Classic 1928 Pie-Eyed Mickey Silhouette at the Wheel
  ctx.fillStyle = '#171717';
  // Torso & white shorts
  ctx.beginPath();
  ctx.ellipse(258, 224, 24, 32, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.ellipse(258, 238, 24, 18, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Two iconic buttons on shorts
  ctx.fillStyle = '#171717';
  ctx.beginPath();
  ctx.arc(250, 236, 4, 0, Math.PI * 2);
  ctx.arc(264, 238, 4, 0, Math.PI * 2);
  ctx.fill();

  // Head & Ears
  ctx.beginPath();
  ctx.arc(252, 166, 24, 0, Math.PI * 2);
  ctx.arc(274, 142, 16, 0, Math.PI * 2);
  ctx.arc(236, 138, 15, 0, Math.PI * 2);
  ctx.fill();

  // White Steamboat Captain Cap
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.ellipse(252, 141, 20, 9, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Whistling Musical Notes in the Air
  ctx.fillStyle = '#171717';
  ctx.font = '700 26px Georgia, serif';
  ctx.fillText('♪   ♫', 162, 128);

  // Brass Museum Plaque at Bottom Mat
  ctx.fillStyle = '#2d1e12';
  ctx.font = '700 14px "JetBrains Mono", monospace';
  ctx.fillText('STEAMBOAT WILLIE (1928) · ORIGINAL PRODUCTION CEL · UB IWERKS & WALT DISNEY', 48, 352);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  return texture;
}

/**
 * Walt Disney's Secret Suite 3H "Project X / Florida Project" Land Acquisition Wall Map
 */
export function createWaltsFloridaSecretMapTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d')!;

  // Vintage 1965 USGS Survey Map Parchment
  ctx.fillStyle = '#e9dec2';
  ctx.fillRect(0, 0, 640, 480);

  // Survey Grid Lines
  ctx.strokeStyle = 'rgba(72, 95, 78, 0.25)';
  ctx.lineWidth = 1;
  for (let x = 40; x < 600; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 30);
    ctx.lineTo(x, 440);
    ctx.stroke();
  }
  for (let y = 30; y < 440; y += 40) {
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.lineTo(600, y);
    ctx.stroke();
  }

  // Color-coded Dummy Corporation Land Parcels (27,400 Acres across Orange & Osceola Counties)
  const parcels = [
    { x: 120, y: 75, w: 160, h: 110, col: 'rgba(217, 119, 6, 0.38)', label: 'RETLAW ENTERPRISES' },
    { x: 280, y: 75, w: 185, h: 130, col: 'rgba(37, 99, 235, 0.32)', label: 'M.T. LOTT CO. (BAY LAKE)' },
    { x: 140, y: 185, w: 180, h: 145, col: 'rgba(22, 163, 74, 0.35)', label: 'REEDY CREEK RANCH' },
    { x: 320, y: 205, w: 165, h: 155, col: 'rgba(220, 38, 38, 0.32)', label: 'COMPASS EAST CORP.' },
  ];
  parcels.forEach((p) => {
    ctx.fillStyle = p.col;
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.strokeRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = '#0f172a';
    ctx.font = '700 11px "JetBrains Mono", monospace';
    ctx.fillText(p.label, p.x + 10, p.y + 24);
  });

  // Bay Lake & Seven Seas Lagoon Water Bodies
  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.ellipse(355, 138, 36, 26, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(285, 145, 28, 18, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Red Grease-Pencil North-South High-Speed Monorail Spine & EPCOT Radial Circles
  ctx.strokeStyle = '#b91c1c';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(285, 98);
  ctx.lineTo(315, 375);
  ctx.stroke();

  // EPCOT Radial Concentric Rings drawn by Walt
  [22, 44, 68].forEach((r) => {
    ctx.beginPath();
    ctx.arc(305, 268, r, 0, Math.PI * 2);
    ctx.stroke();
  });

  // Top Confidential Stamp Banner
  ctx.fillStyle = '#991b1b';
  ctx.fillRect(42, 32, 556, 30);
  ctx.fillStyle = '#fef2f2';
  ctx.font = '700 14px "JetBrains Mono", monospace';
  ctx.fillText('CONFIDENTIAL · SUITE 3H · "THE FLORIDA PROJECT" (27,400 ACRES · E.P.C.O.T.)', 56, 52);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  return texture;
}


