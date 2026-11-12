/**
 * Typing Worlds · 2D Canvas Animated Previews
 *
 * Renders lightweight 3-4s looping previews for each world in the Gallery.
 * Zero 3D WebGL resource loading keeps 22 cards silky smooth at 60fps.
 */
import type { WorldDefinition } from '../engine/types';

function hexToRgba(hex: string, alpha: number): string {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const num = parseInt(c, 16);
  if (isNaN(num)) return `rgba(200,200,200,${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

export function drawPreview(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  world: WorldDefinition,
  t: number
) {
  ctx.clearRect(0, 0, w, h);
  const accent = world.accent || '#ff7a9c';

  // Radial ambient gradient
  const bg = ctx.createRadialGradient(w * 0.5, h * 0.5, 5, w * 0.5, h * 0.5, w * 0.6);
  bg.addColorStop(0, hexToRgba(accent, 0.25));
  bg.addColorStop(1, hexToRgba(accent, 0.02));
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const cx = w * 0.5;
  const cy = h * 0.52;
  const size = Math.min(w, h) * 0.38;
  const p = (t % 3.5) / 3.5; // loop 0..1

  ctx.save();

  if (world.id === 'magnetic-jelly') {
    // 果冻下落、弹跳与形变
    const drop = p < 0.4 ? (1 - p / 0.4) * (h * 0.35) : 0;
    const squash = p >= 0.4 && p < 0.7 ? Math.sin(((p - 0.4) / 0.3) * Math.PI * 2) * 0.28 * (1 - (p - 0.4) / 0.3) : 0;
    ctx.translate(cx, cy - drop);
    ctx.scale(1 + squash, 1 - squash);
    ctx.font = `bold ${size}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = accent;
    ctx.shadowColor = hexToRgba(accent, 0.6);
    ctx.shadowBlur = 12;
    ctx.fillText('W', 0, 0);

    // 地面波纹
    if (p >= 0.4) {
      const rip = (p - 0.4) / 0.6;
      ctx.restore();
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, cy + size * 0.45, size * 0.8 * rip, size * 0.25 * rip, 0, 0, Math.PI * 2);
      ctx.strokeStyle = hexToRgba('#ffffff', (1 - rip) * 0.8);
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
  } else if (world.id === 'chalk-flow') {
    // 粉笔书写轨迹
    ctx.font = `bold ${size}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#f4f1e6';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';

    const drawK = Math.min(1, p / 0.7);
    ctx.save();
    ctx.beginPath();
    ctx.rect(cx - size * 0.8, cy - size * 0.8, size * 1.6 * drawK, size * 1.6);
    ctx.clip();
    ctx.strokeText('W', cx, cy);
    ctx.restore();

    // 粉尘粒子
    if (drawK < 1) {
      for (let i = 0; i < 6; i++) {
        const px = cx - size * 0.6 + size * 1.2 * drawK + (Math.sin(t * 10 + i) * 6);
        const py = cy + Math.cos(t * 8 + i) * 12;
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillRect(px, py, 2.5, 2.5);
      }
    }
  } else if (world.id === 'noble-gas-neon') {
    // 霓虹通电与放电光晕
    const flicker = p < 0.25 ? (Math.sin(p * 50) > 0 ? 1 : 0.2) : 1;
    ctx.font = `bold ${size}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = accent;
    ctx.shadowBlur = 18 * flicker;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 5;
    ctx.strokeText('W', cx, cy);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('W', cx, cy);
  } else if (world.id === 'magic-wand') {
    // 魔法棒星光
    ctx.font = `bold ${size}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = accent;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 16;
    ctx.fillText('W', cx, cy);

    // 环绕星尘
    for (let i = 0; i < 8; i++) {
      const angle = (p * Math.PI * 2) + (i * Math.PI) / 4;
      const r = size * 0.65 + Math.sin(t * 4 + i) * 8;
      const sx = cx + Math.cos(angle) * r;
      const sy = cy + Math.sin(angle) * (r * 0.6);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // 通用世界预览
    ctx.font = `bold ${size}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = accent;
    ctx.shadowColor = hexToRgba(accent, 0.4);
    ctx.shadowBlur = 10;
    ctx.fillText('W', cx, cy);

    // 漂浮粒子点缀
    for (let i = 0; i < 4; i++) {
      const yOff = ((p + i * 0.25) % 1) * size * 0.8;
      ctx.fillStyle = hexToRgba(accent, 0.5 * (1 - yOff / (size * 0.8)));
      ctx.beginPath();
      ctx.arc(cx - size * 0.4 + i * (size * 0.28), cy + size * 0.4 - yOff, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}
