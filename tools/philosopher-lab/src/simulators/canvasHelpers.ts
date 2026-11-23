export interface CanvasEnv {
  ctx: CanvasRenderingContext2D;
  W: number;
  H: number;
  T: number;
  dt: number;
  L: number;
  PT: { x: number; y: number; x0: number; y0: number; down: boolean; holdT: number } | null;
  hit: (level: number, quoteIdx: number, toastMsg?: string) => void;
  toast: (msg: string) => void;
}

export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

export function txt(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color = '#223',
  size = 13,
  align: CanvasTextAlign = 'center',
  bold = false
) {
  ctx.fillStyle = color;
  ctx.font = `${bold ? 'bold ' : ''}${size}px -apple-system, "PingFang SC", "Helvetica Neue", Arial, sans-serif`;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
}

export function drawRoundBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r = 10,
  fill = '#fff',
  stroke = '#8a9ba8',
  lineWidth = 1.5
) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

export function drawCanvasSlider(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  val01: number,
  label: string,
  leftLbl = '',
  rightLbl = '',
  color = '#3a6f99'
) {
  const v = clamp(val01, 0, 1);
  ctx.fillStyle = '#d5d8de';
  ctx.beginPath();
  ctx.roundRect(x, y - 4, w, 8, 4);
  ctx.fill();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y - 4, w * v, 8, 4);
  ctx.fill();

  const kx = x + w * v;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(kx, y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  txt(ctx, label, x + w / 2, y - 14, '#1f2b38', 13, 'center', true);
  if (leftLbl) txt(ctx, leftLbl, x, y + 22, '#667', 11.5, 'left');
  if (rightLbl) txt(ctx, rightLbl, x + w, y + 22, '#667', 11.5, 'right');
}

export function hitSlider(x: number, y: number, sx: number, sy: number, sw: number): number | null {
  if (Math.abs(y - sy) < 28 && x >= sx - 18 && x <= sx + sw + 18) {
    return clamp((x - sx) / sw, 0, 1);
  }
  return null;
}

export function drawBalanceBeam(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  H: number,
  w: number,
  ang: number,
  colL = '#cfe3c8',
  colR = '#f1cfc8'
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = '#5a4a3a';
  ctx.beginPath();
  ctx.moveTo(-14, H * 0.34);
  ctx.lineTo(14, H * 0.34);
  ctx.lineTo(4, 0);
  ctx.lineTo(-4, 0);
  ctx.fill();

  ctx.rotate(ang);
  ctx.fillStyle = '#8a7350';
  ctx.fillRect(-w / 2, -4, w, 8);
  ctx.fillStyle = '#d9b54a';
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.fill();

  [-1, 1].forEach((s) => {
    const px = (s * w) / 2;
    ctx.strokeStyle = '#8a7350';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px - w * 0.11, H * 0.12);
    ctx.moveTo(px, 0);
    ctx.lineTo(px + w * 0.11, H * 0.12);
    ctx.stroke();
  });
  ctx.restore();

  return [-1, 1].map((s) => {
    const px = cx + Math.cos(ang) * ((s * w) / 2);
    const py = cy + Math.sin(ang) * ((s * w) / 2);
    const y = py + H * 0.12;
    ctx.fillStyle = s < 0 ? colL : colR;
    ctx.beginPath();
    ctx.ellipse(px, y, w * 0.13, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8a7350';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    return { x: px, y };
  });
}

export function drawPerson(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color = '#3a6f99',
  label = '',
  scale = 1
) {
  const r = 10 * scale;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y - r * 1.4, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - r * 1.3, y + r * 1.4);
  ctx.quadraticCurveTo(x, y - r * 0.4, x + r * 1.3, y + r * 1.4);
  ctx.fill();
  if (label) {
    txt(ctx, label, x, y + r * 2.5, '#1f2b38', Math.round(12 * scale), 'center', true);
  }
}

export function drawHoldRing(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  progress01: number,
  color = '#f3a52b'
) {
  if (progress01 <= 0) return;
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(progress01, 0, 1));
  ctx.stroke();
}

export function drawFooterHint(ctx: CanvasRenderingContext2D, W: number, H: number, hint: string) {
  ctx.fillStyle = 'rgba(31, 43, 56, 0.08)';
  ctx.fillRect(0, H - 30, W, 30);
  txt(ctx, hint, W / 2, H - 10, '#33475b', 12.5, 'center', true);
}
