import { clamp, lerp } from './canvasHelpers';

export function drawPaperBg(ctx: CanvasRenderingContext2D, W: number, H: number, dark = false) {
  if (dark) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0f1722');
    g.addColorStop(1, '#182434');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // Subtle blueprint grid
    ctx.strokeStyle = 'rgba(148, 184, 218, 0.06)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 36) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += 36) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
  } else {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#f7f4ec');
    g.addColorStop(1, '#ede7d9');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(31, 43, 56, 0.045)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
  }
}

export function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color = '#1e293b',
  size = 12,
  align: CanvasTextAlign = 'center',
  bold = false
) {
  ctx.fillStyle = color;
  ctx.font = `${bold ? '600 ' : ''}${size}px -apple-system, "PingFang SC", "Helvetica Neue", sans-serif`;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
}

export function drawMonoNum(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color = '#0f172a',
  size = 13,
  align: CanvasTextAlign = 'center'
) {
  ctx.fillStyle = color;
  ctx.font = `600 ${size}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
}

export function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color = '#2563eb',
  width = 2.5,
  headSize = 9
) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - Math.cos(ang - 0.42) * headSize, y2 - Math.sin(ang - 0.42) * headSize);
  ctx.lineTo(x2 - Math.cos(ang + 0.42) * headSize, y2 - Math.sin(ang + 0.42) * headSize);
  ctx.closePath();
  ctx.fill();
}

export function drawGear(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  teeth: number,
  angle: number,
  fill: string,
  stroke = '#1e293b'
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  const outer = r + Math.max(5, r * 0.17);
  const inner = r - 2;
  for (let i = 0; i < teeth; i++) {
    const a0 = (i / teeth) * Math.PI * 2;
    const a1 = ((i + 0.25) / teeth) * Math.PI * 2;
    const a2 = ((i + 0.5) / teeth) * Math.PI * 2;
    const a3 = ((i + 0.75) / teeth) * Math.PI * 2;
    if (i === 0) ctx.moveTo(Math.cos(a0) * inner, Math.sin(a0) * inner);
    ctx.lineTo(Math.cos(a1) * outer, Math.sin(a1) * outer);
    ctx.lineTo(Math.cos(a2) * outer, Math.sin(a2) * outer);
    ctx.lineTo(Math.cos(a3) * inner, Math.sin(a3) * inner);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#f7f4ec';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.34, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function drawCar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  isPeach: boolean,
  revealed: boolean,
  smokePhase: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Exhaust smoke puffs for revealed or smoking lemons
  if (!isPeach && (revealed || smokePhase > 0)) {
    for (let i = 0; i < 3; i++) {
      const p = (smokePhase + i * 0.33) % 1;
      ctx.fillStyle = `rgba(110, 118, 129, ${(1 - p) * (revealed ? 0.55 : 0.25)})`;
      ctx.beginPath();
      ctx.arc(-34 - p * 18, 6 - p * 16, 4 + p * 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Body color: looks identical slate-blue when hidden unless X-ray revealed!
  const bodyColor = revealed ? (isPeach ? '#059669' : '#ca8a04') : '#475569';
  const roofColor = revealed ? (isPeach ? '#10b981' : '#eab308') : '#64748b';

  // Car lower chassis
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.roundRect(-28, -4, 56, 18, 5);
  ctx.fill();

  // Cabin roof
  ctx.fillStyle = roofColor;
  ctx.beginPath();
  ctx.moveTo(-16, -4);
  ctx.lineTo(-10, -17);
  ctx.lineTo(12, -17);
  ctx.lineTo(20, -4);
  ctx.closePath();
  ctx.fill();

  // Windows
  ctx.fillStyle = revealed && isPeach ? '#d1fae5' : '#e2e8f0';
  ctx.beginPath();
  ctx.moveTo(-12, -5);
  ctx.lineTo(-8, -14);
  ctx.lineTo(9, -14);
  ctx.lineTo(15, -5);
  ctx.closePath();
  ctx.fill();

  // Wheels
  [-15, 15].forEach((wx) => {
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(wx, 14, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(wx, 14, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  // Quality badge inside car when revealed
  if (revealed) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(isPeach ? '★' : '!', 1, 7);
  }
  ctx.restore();
}

export function drawFish(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dir: number,
  size: number,
  color: string,
  wag: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir >= 0 ? 1 : -1, 1);
  // Tail
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-size * 0.7, 0);
  ctx.lineTo(-size * 1.4, -size * 0.5 + wag);
  ctx.lineTo(-size * 1.4, size * 0.5 + wag);
  ctx.closePath();
  ctx.fill();
  // Body
  ctx.beginPath();
  ctx.ellipse(0, 0, size, size * 0.52, 0, 0, Math.PI * 2);
  ctx.fill();
  // Eye
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(size * 0.48, -size * 0.1, size * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(size * 0.54, -size * 0.1, size * 0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawBoat(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  netDepth: number,
  color = '#92400e',
  fined = false
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Fishing net dropping down
  if (netDepth > 0.05) {
    const nh = netDepth * 70;
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(-10, 6);
    ctx.lineTo(-22, 6 + nh);
    ctx.lineTo(22, 6 + nh);
    ctx.lineTo(10, 6);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Hull
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-24, 0);
  ctx.lineTo(24, 0);
  ctx.lineTo(16, 12);
  ctx.lineTo(-16, 12);
  ctx.closePath();
  ctx.fill();

  // Mast + sail
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -24);
  ctx.stroke();
  ctx.fillStyle = fined ? '#fecaca' : '#fef3c7';
  ctx.beginPath();
  ctx.moveTo(2, -22);
  ctx.lineTo(18, -6);
  ctx.lineTo(2, -4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawPolygonCitizen(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  type: 1 | 2,
  happy: boolean,
  wiggle = 0
) {
  ctx.save();
  ctx.translate(cx + Math.sin(wiggle) * (happy ? 0 : 2.2), cy);

  if (type === 1) {
    // Blue rounded square
    ctx.fillStyle = happy ? '#2563eb' : '#60a5fa';
    ctx.strokeStyle = happy ? '#1d4ed8' : '#dc2626';
    ctx.lineWidth = happy ? 1.8 : 2.4;
    ctx.beginPath();
    ctx.roundRect(-size, -size, size * 2, size * 2, 5);
    ctx.fill();
    ctx.stroke();
  } else {
    // Amber triangle
    ctx.fillStyle = happy ? '#ea580c' : '#fb923c';
    ctx.strokeStyle = happy ? '#c2410c' : '#dc2626';
    ctx.lineWidth = happy ? 1.8 : 2.4;
    ctx.beginPath();
    ctx.moveTo(0, -size * 1.15);
    ctx.lineTo(size * 1.15, size * 0.95);
    ctx.lineTo(-size * 1.15, size * 0.95);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Eyes
  const ey = type === 1 ? -size * 0.2 : size * 0.08;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(-size * 0.32, ey, 2.3, 0, Math.PI * 2);
  ctx.arc(size * 0.32, ey, 2.3, 0, Math.PI * 2);
  ctx.fill();

  // Mouth (smile or frown)
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  if (happy) {
    ctx.arc(0, ey + size * 0.28, size * 0.32, 0.15 * Math.PI, 0.85 * Math.PI);
  } else {
    ctx.arc(0, ey + size * 0.62, size * 0.3, 1.15 * Math.PI, 1.85 * Math.PI);
  }
  ctx.stroke();
  ctx.restore();
}

export function drawBeaker(
  ctx: CanvasRenderingContext2D,
  cx: number,
  bottomY: number,
  w: number,
  h: number,
  fill01: number,
  liquidColor = '#38bdf8',
  tiltRad = 0
) {
  ctx.save();
  ctx.translate(cx, bottomY - h / 2);
  ctx.rotate(tiltRad);

  // Liquid inside
  const lh = clamp(fill01, 0, 1) * (h - 8);
  if (lh > 1) {
    ctx.fillStyle = liquidColor;
    ctx.globalAlpha = 0.78;
    ctx.fillRect(-w / 2 + 3, h / 2 - lh - 2, w - 6, lh);
    ctx.globalAlpha = 1;
    // Meniscus shimmer
    ctx.fillStyle = '#bae6fd';
    ctx.fillRect(-w / 2 + 3, h / 2 - lh - 2, w - 6, 3);
  }

  // Glass outline
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-w / 2 - 4, -h / 2);
  ctx.lineTo(-w / 2, -h / 2 + 4);
  ctx.lineTo(-w / 2, h / 2);
  ctx.lineTo(w / 2, h / 2);
  ctx.lineTo(w / 2, -h / 2 + 4);
  ctx.lineTo(w / 2 + 4, -h / 2);
  ctx.stroke();

  // Graduation ticks
  ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
  ctx.lineWidth = 1.2;
  for (let i = 1; i <= 4; i++) {
    const ty = h / 2 - (h * i) / 5;
    ctx.beginPath();
    ctx.moveTo(-w / 2 + 2, ty);
    ctx.lineTo(-w / 2 + 10, ty);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawBell(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale: number,
  ringPhase: number
) {
  ctx.save();
  ctx.translate(cx, cy);
  const swing = Math.sin(ringPhase * 28) * Math.min(1, ringPhase) * 0.35;
  ctx.rotate(swing);
  ctx.scale(scale, scale);

  // Sound wave arcs when ringing
  if (ringPhase > 0.05) {
    ctx.strokeStyle = `rgba(234, 179, 8, ${clamp(ringPhase, 0, 1)})`;
    ctx.lineWidth = 2;
    [-1, 1].forEach((side) => {
      for (let k = 1; k <= 2; k++) {
        ctx.beginPath();
        ctx.arc(0, 0, 22 + k * 10 + (1 - ringPhase) * 8, side > 0 ? -0.5 : Math.PI - 0.5, side > 0 ? 0.5 : Math.PI + 0.5);
        ctx.stroke();
      }
    });
  }

  // Bell dome
  ctx.fillStyle = '#eab308';
  ctx.strokeStyle = '#854d0e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-18, 12);
  ctx.quadraticCurveTo(-14, -18, 0, -20);
  ctx.quadraticCurveTo(14, -18, 18, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Clapper
  ctx.fillStyle = '#713f12';
  ctx.beginPath();
  ctx.arc(Math.sin(ringPhase * 28) * 5, 14, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawCoin(ctx: CanvasRenderingContext2D, x: number, y: number, r = 8, text = '$') {
  ctx.fillStyle = '#f59e0b';
  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#fffbeb';
  ctx.font = `bold ${Math.round(r * 1.15)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y + r * 0.4);
}

export function drawCompactSlider(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  val01: number,
  label: string,
  valueText: string,
  color = '#0284c7',
  dark = false
) {
  const v = clamp(val01, 0, 1);
  // Label left, value right (single line, clean!)
  drawLabel(ctx, label, x, y - 11, dark ? '#cbd5e1' : '#334155', 11.5, 'left', true);
  drawMonoNum(ctx, valueText, x + w, y - 11, color, 12, 'right');

  // Track
  ctx.fillStyle = dark ? 'rgba(255,255,255,0.16)' : '#cbd5e1';
  ctx.beginPath();
  ctx.roundRect(x, y - 3.5, w, 7, 3.5);
  ctx.fill();

  // Fill
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y - 3.5, w * v, 7, 3.5);
  ctx.fill();

  // Thumb
  const kx = x + w * v;
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(kx, y, 9.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

export function drawToggleButton(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  active: boolean,
  accent = '#0284c7',
  dark = false
) {
  ctx.fillStyle = active ? accent : dark ? '#1e293b' : '#ffffff';
  ctx.strokeStyle = active ? accent : dark ? '#475569' : '#94a3b8';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 7);
  ctx.fill();
  ctx.stroke();

  drawLabel(
    ctx,
    label,
    x + w / 2,
    y + h / 2 + 4,
    active ? '#ffffff' : dark ? '#e2e8f0' : '#1e293b',
    12,
    'center',
    true
  );
}

export function hitBox(x: number, y: number, bx: number, by: number, bw: number, bh: number) {
  return x >= bx && x <= bx + bw && y >= by && y <= by + bh;
}

export function drawSparkline(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  series: { data: number[]; color: string; label?: string }[],
  dark = false
) {
  ctx.fillStyle = dark ? 'rgba(15, 23, 42, 0.72)' : 'rgba(255, 255, 255, 0.86)';
  ctx.strokeStyle = dark ? '#334155' : '#cbd5e1';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.fill();
  ctx.stroke();

  // Horizontal dashed midline
  ctx.strokeStyle = dark ? 'rgba(148,163,184,0.2)' : 'rgba(100,116,139,0.2)';
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(x + 8, y + h / 2);
  ctx.lineTo(x + w - 8, y + h / 2);
  ctx.stroke();
  ctx.setLineDash([]);

  series.forEach((s, si) => {
    if (s.data.length < 2) return;
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    s.data.forEach((v, i) => {
      const px = x + 8 + (i / Math.max(1, s.data.length - 1)) * (w - 16);
      const py = y + h - 8 - clamp(v, 0, 1) * (h - 22);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
    if (s.label) {
      drawLabel(ctx, s.label, x + 10 + si * 74, y + 13, s.color, 10.5, 'left', true);
    }
  });
}

export function drawTinyHint(ctx: CanvasRenderingContext2D, W: number, H: number, text: string, dark = false) {
  ctx.fillStyle = dark ? 'rgba(15, 23, 42, 0.7)' : 'rgba(30, 41, 59, 0.07)';
  ctx.fillRect(0, H - 26, W, 26);
  drawLabel(ctx, text, W / 2, H - 9, dark ? '#cbd5e1' : '#334155', 11.5, 'center', true);
}

export { clamp, lerp };
