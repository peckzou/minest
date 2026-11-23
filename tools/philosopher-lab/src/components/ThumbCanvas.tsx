import React, { useEffect, useRef } from 'react';

interface ThumbCanvasProps {
  thumbType: string;
  modelId: number;
}

function lerp(a: number, b: number, k: number) {
  return a + (b - a) * k;
}

export const ThumbCanvas: React.FC<ThumbCanvasProps> = ({ thumbType, modelId }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let startTime = performance.now();

    const render = (now: number) => {
      const t = (now - startTime) / 1000;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = cv.clientWidth || 280;
      const h = cv.clientHeight || 120;
      if (cv.width !== w * dpr || cv.height !== h * dpr) {
        cv.width = w * dpr;
        cv.height = h * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.save();

      switch (thumbType) {
        case 'kripke': {
          for (let i = 0; i < 3; i++) {
            const wx = w * 0.22 + i * w * 0.28;
            ctx.strokeStyle = i === 0 ? '#f3a52b' : '#4a627a';
            ctx.lineWidth = i === 0 ? 2 : 1.5;
            ctx.strokeRect(wx - 28, h * 0.35, 56, 52);
            ctx.fillStyle = '#3a6f99';
            ctx.beginPath();
            ctx.arc(wx - 10, h * 0.62, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#2fa35a';
            ctx.beginPath();
            ctx.arc(wx + 12, h * 0.62, 6, 0, Math.PI * 2);
            ctx.fill();
            // Rigid line always hits blue
            ctx.strokeStyle = '#6ec6ff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(w * 0.35, 16);
            ctx.lineTo(wx - 10, h * 0.62 - 6);
            ctx.stroke();
            // Flaccid line jumps
            const targetX = i % 2 === 0 ? wx - 10 : wx + 12;
            ctx.strokeStyle = 'rgba(231,76,60,0.8)';
            ctx.setLineDash([4, 3]);
            ctx.beginPath();
            ctx.moveTo(w * 0.68, 16);
            ctx.lineTo(targetX, h * 0.62 - 6);
            ctx.stroke();
            ctx.setLineDash([]);
          }
          break;
        }
        case 'goodman': {
          const split = (Math.sin(t * 1.4) + 1) / 2;
          ctx.strokeStyle = '#5c7085';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(w * 0.12, h * 0.55);
          ctx.lineTo(w * 0.52, h * 0.55);
          ctx.stroke();
          // Branch green vs blue after t
          ctx.strokeStyle = '#2fa35a';
          ctx.beginPath();
          ctx.moveTo(w * 0.52, h * 0.55);
          ctx.lineTo(w * 0.86, h * 0.55 - split * 26);
          ctx.stroke();
          ctx.strokeStyle = '#3d7fe0';
          ctx.beginPath();
          ctx.moveTo(w * 0.52, h * 0.55);
          ctx.lineTo(w * 0.86, h * 0.55 + split * 26);
          ctx.stroke();
          // t marker
          ctx.fillStyle = '#f3a52b';
          ctx.fillRect(w * 0.52 - 2, h * 0.25, 4, h * 0.6);
          ctx.font = 'bold 12px sans-serif';
          ctx.fillText('t', w * 0.52 - 3, h * 0.2);
          break;
        }
        case 'mean': {
          // Aristotle golden mean arc & pendulum
          ctx.strokeStyle = '#33475b';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.arc(w / 2, h * 0.82, 54, Math.PI, 0);
          ctx.stroke();
          ctx.strokeStyle = '#2fa35a';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.arc(w / 2, h * 0.82, 54, Math.PI * 1.38, Math.PI * 1.62);
          ctx.stroke();
          const ang = Math.PI * 1.5 + Math.sin(t * 1.6) * 0.35;
          ctx.strokeStyle = '#f3a52b';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(w / 2, h * 0.82);
          ctx.lineTo(w / 2 + Math.cos(ang) * 48, h * 0.82 + Math.sin(ang) * 48);
          ctx.stroke();
          break;
        }
        case 'epicurus': {
          // Calm water of Ataraxia vs 3 vessels
          ['#2fa35a', '#f3a52b', '#e74c3c'].forEach((col, i) => {
            const x = w * 0.25 + i * w * 0.25;
            const hBar = i === 0 ? 36 : i === 1 ? 22 : 12 + Math.sin(t * 4) * 8;
            ctx.strokeStyle = col;
            ctx.lineWidth = 2;
            ctx.strokeRect(x - 18, h * 0.25, 36, 52);
            ctx.fillStyle = col;
            ctx.globalAlpha = 0.65;
            ctx.fillRect(x - 16, h * 0.25 + 50 - hBar, 32, hBar);
            ctx.globalAlpha = 1;
          });
          break;
        }
        case 'stoic': {
          // Inner circle of control + bouncing external arrows
          ctx.strokeStyle = '#2fa35a';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(w / 2, h / 2, 26, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = 'rgba(47,163,90,0.2)';
          ctx.fill();
          for (let i = 0; i < 6; i++) {
            const a = i * (Math.PI / 3) + t * 0.6;
            const r = 34 + Math.abs(Math.sin(t * 2 + i)) * 18;
            ctx.fillStyle = '#e67e22';
            ctx.beginPath();
            ctx.arc(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r, 3.5, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
        }
        case 'hobbes': {
          // Chaos particles converging under Leviathan crown/sword
          const k = (Math.sin(t * 1.1) + 1) / 2;
          for (let i = 0; i < 16; i++) {
            const a = (i / 16) * Math.PI * 2;
            const cx = lerp(w / 2 + Math.cos(a + t) * 55, w / 2 + Math.cos(a) * 28, k);
            const cy = lerp(h * 0.62 + Math.sin(a * 2 + t) * 28, h * 0.62 + Math.sin(a) * 20, k);
            ctx.fillStyle = k > 0.5 ? '#6ec6ff' : '#e74c3c';
            ctx.beginPath();
            ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = '#f3a52b';
          ctx.beginPath();
          ctx.moveTo(w / 2, h * 0.14);
          ctx.lineTo(w / 2 - 12, h * 0.32);
          ctx.lineTo(w / 2 + 12, h * 0.32);
          ctx.closePath();
          ctx.fill();
          break;
        }
        case 'locke_rights': {
          const pts = [
            [w * 0.5, h * 0.2],
            [w * 0.26, h * 0.78],
            [w * 0.74, h * 0.78]
          ];
          ctx.strokeStyle = '#f3a52b';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(pts[0][0], pts[0][1]);
          ctx.lineTo(pts[1][0], pts[1][1]);
          ctx.lineTo(pts[2][0], pts[2][1]);
          ctx.closePath();
          ctx.stroke();
          ['生命', '自由', '财产'].forEach((lb, i) => {
            ctx.fillStyle = '#1d2733';
            ctx.beginPath();
            ctx.arc(pts[i][0], pts[i][1], 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#7dffb0';
            ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(lb, pts[i][0], pts[i][1] + 3);
          });
          break;
        }
        case 'rousseau': {
          // Individual arrows canceling out into upward General Will arrow
          const k = (Math.sin(t * 1.4) + 1) / 2;
          for (let i = -3; i <= 3; i++) {
            if (i === 0) continue;
            ctx.strokeStyle = 'rgba(159,176,195,0.45)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(w / 2, h * 0.78);
            ctx.lineTo(w / 2 + i * 24 * (1 - k * 0.7), h * 0.42);
            ctx.stroke();
          }
          ctx.strokeStyle = '#7dffb0';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(w / 2, h * 0.82);
          ctx.lineTo(w / 2, h * 0.22);
          ctx.stroke();
          break;
        }
        case 'nozick': {
          // Bars shifting voluntarily to star player
          const p = (Math.sin(t * 1.2) + 1) / 2;
          for (let i = 0; i < 6; i++) {
            const isStar = i === 5;
            const bh = isStar ? lerp(28, 72, p) : lerp(28, 19, p);
            ctx.fillStyle = isStar ? '#f3a52b' : '#4a9fe0';
            ctx.fillRect(w * 0.18 + i * 32, h * 0.85 - bh, 22, bh);
          }
          break;
        }
        case 'sen': {
          // Radar capability polygon expanding
          const rBase = 22 + ((Math.sin(t * 1.5) + 1) / 2) * 22;
          ctx.strokeStyle = '#7dffb0';
          ctx.fillStyle = 'rgba(125,255,176,0.22)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
            const r = rBase * (0.8 + 0.2 * Math.sin(i * 2 + t));
            const x = w / 2 + Math.cos(a) * r;
            const y = h / 2 + Math.sin(a) * r;
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          break;
        }
        case 'gilligan': {
          // Glowing relational web
          const nodes = [
            [w * 0.5, h * 0.5],
            [w * 0.28, h * 0.3],
            [w * 0.72, h * 0.3],
            [w * 0.3, h * 0.75],
            [w * 0.7, h * 0.75]
          ];
          ctx.strokeStyle = 'rgba(243,165,43,0.55)';
          ctx.lineWidth = 1.8;
          nodes.forEach((n1, i) => {
            nodes.forEach((n2, j) => {
              if (i < j) {
                ctx.beginPath();
                ctx.moveTo(n1[0], n1[1]);
                ctx.lineTo(n2[0], n2[1]);
                ctx.stroke();
              }
            });
          });
          nodes.forEach((n, i) => {
            ctx.fillStyle = i === 0 ? '#f3a52b' : '#6ec6ff';
            ctx.beginPath();
            ctx.arc(n[0], n[1], i === 0 ? 8 : 6, 0, Math.PI * 2);
            ctx.fill();
          });
          break;
        }
        case 'macintyre': {
          // Chess board grid & glowing internal jewel
          for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
              ctx.fillStyle = (r + c) % 2 === 0 ? '#2c3b4c' : '#1b2430';
              ctx.fillRect(w / 2 - 36 + c * 24, h / 2 - 36 + r * 24, 24, 24);
            }
          }
          ctx.fillStyle = '#ffd96b';
          ctx.beginPath();
          ctx.arc(w / 2 + Math.sin(t * 1.5) * 16, h / 2, 9, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case 'parmenides': {
          // Immutable golden sphere of Being
          const grad = ctx.createRadialGradient(w / 2 - 8, h / 2 - 8, 4, w / 2, h / 2, 36);
          grad.addColorStop(0, '#fff3c4');
          grad.addColorStop(1, '#c79b2f');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(w / 2, h / 2, 34, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case 'heraclitus': {
          // Flowing river sine waves & flame
          for (let j = 0; j < 3; j++) {
            ctx.strokeStyle = ['#3d7fe0', '#6ec6ff', '#f3a52b'][j];
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            for (let x = 20; x < w - 20; x += 8) {
              const y = h * (0.35 + j * 0.16) + Math.sin(x * 0.05 - t * 3 + j) * 8;
              x === 20 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.stroke();
          }
          break;
        }
        case 'democritus': {
          // Colliding & bonding atoms
          const k = (Math.sin(t * 1.5) + 1) / 2;
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2 + t * 0.5;
            const r = lerp(14, 42, k);
            ctx.fillStyle = ['#f3a52b', '#6ec6ff', '#7dffb0'][i % 3];
            ctx.beginPath();
            ctx.arc(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r, 6, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
        }
        case 'aquinas': {
          // Blueprint wireframe (Essence) + Golden fill (Esse)
          const k = (Math.sin(t * 1.3) + 1) / 2;
          ctx.strokeStyle = '#6ec6ff';
          ctx.lineWidth = 2;
          ctx.strokeRect(w * 0.25, h * 0.28, 44, 44);
          ctx.fillStyle = `rgba(243,165,43,${0.15 + 0.75 * k})`;
          ctx.fillRect(w * 0.56, h * 0.28, 44, 44);
          ctx.strokeStyle = '#f3a52b';
          ctx.strokeRect(w * 0.56, h * 0.28, 44, 44);
          break;
        }
        case 'berkeley': {
          // Perceiving eye & object beam
          ctx.strokeStyle = '#ffd96b';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(w * 0.28, h / 2, 18, 11, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = '#6ec6ff';
          ctx.beginPath();
          ctx.arc(w * 0.28, h / 2, 5, 0, Math.PI * 2);
          ctx.fill();
          const vis = (Math.sin(t * 1.5) + 1) / 2;
          ctx.fillStyle = `rgba(243,165,43,${0.25 * vis})`;
          ctx.beginPath();
          ctx.moveTo(w * 0.34, h / 2);
          ctx.lineTo(w * 0.74, h * 0.24);
          ctx.lineTo(w * 0.74, h * 0.76);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = `rgba(47,163,90,${0.2 + 0.8 * vis})`;
          ctx.beginPath();
          ctx.arc(w * 0.72, h / 2, 16, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case 'zeno': {
          // Infinite bisection intervals 1/2, 1/4, 1/8...
          const x0 = w * 0.12;
          const totalW = w * 0.76;
          ctx.strokeStyle = '#4a627a';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x0, h * 0.6);
          ctx.lineTo(x0 + totalW, h * 0.6);
          ctx.stroke();
          let cur = 0;
          let step = totalW / 2;
          const nSteps = 1 + (Math.floor(t * 1.5) % 6);
          for (let i = 0; i < nSteps; i++) {
            ctx.fillStyle = i % 2 === 0 ? '#f3a52b' : '#6ec6ff';
            ctx.fillRect(x0 + cur, h * 0.45, step - 1, 12);
            cur += step;
            step /= 2;
          }
          break;
        }
        case 'hotel': {
          // Infinite hotel doors shifting right
          const shift = (t * 25) % 36;
          for (let i = 0; i < 6; i++) {
            const rx = w * 0.12 + i * 36;
            ctx.strokeStyle = '#6ec6ff';
            ctx.strokeRect(rx, h * 0.32, 26, 44);
            ctx.fillStyle = '#f3a52b';
            ctx.beginPath();
            ctx.arc(rx + 13 + Math.min(shift, 36), h * 0.55, 6, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
        }
        case 'monty': {
          // 3 doors with probability bars 1/3 vs 2/3
          [0, 1, 2].forEach((i) => {
            const dx = w * 0.22 + i * 56;
            ctx.fillStyle = i === 1 ? '#f3a52b' : '#2c3b4c';
            ctx.fillRect(dx, h * 0.24, 36, 56);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(i === 0 ? '1/3' : i === 1 ? '2/3 ★' : '🐐', dx + 18, h * 0.56);
          });
          break;
        }
        case 'simpson': {
          // Subgroup positive slopes vs negative overall slope
          ctx.strokeStyle = '#6ec6ff';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(w * 0.18, h * 0.45);
          ctx.lineTo(w * 0.45, h * 0.22);
          ctx.moveTo(w * 0.55, h * 0.78);
          ctx.lineTo(w * 0.82, h * 0.55);
          ctx.stroke();
          // Reversed red aggregate line
          ctx.strokeStyle = '#e74c3c';
          ctx.setLineDash([5, 3]);
          ctx.beginPath();
          ctx.moveTo(w * 0.2, h * 0.26);
          ctx.lineTo(w * 0.8, h * 0.74);
          ctx.stroke();
          ctx.setLineDash([]);
          break;
        }
        case 'econ_hand':
        case 'econ_trade':
        case 'econ_solow': {
          // Animated Supply-Demand / PPF / Solow Curves
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(w * 0.14, h * 0.16);
          ctx.lineTo(w * 0.14, h * 0.84);
          ctx.lineTo(w * 0.86, h * 0.84);
          ctx.stroke();
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.moveTo(w * 0.18, h * 0.22);
          ctx.lineTo(w * 0.82, h * 0.8);
          ctx.stroke();
          ctx.strokeStyle = '#38bdf8';
          ctx.beginPath();
          ctx.moveTo(w * 0.18, h * 0.8);
          ctx.lineTo(w * 0.82, h * 0.22);
          ctx.stroke();
          const py = h * 0.51 + Math.sin(t * 2) * 18;
          ctx.strokeStyle = '#f59e0b';
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.moveTo(w * 0.14, py);
          ctx.lineTo(w * 0.86, py);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.arc(w * 0.5, h * 0.51, 5.5, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case 'econ_nash': {
          // 2x2 Nash Payoff Matrix + glowing best-response equilibrium cell
          const mx = w * 0.5 - 48;
          const my = h * 0.18;
          for (let r = 0; r < 2; r++) {
            for (let c = 0; c < 2; c++) {
              const eq = r === 1 && c === 1;
              ctx.fillStyle = eq ? 'rgba(245, 158, 11, 0.32)' : 'rgba(51, 65, 85, 0.55)';
              ctx.strokeStyle = eq ? '#f59e0b' : '#475569';
              ctx.lineWidth = eq ? 2 : 1.2;
              ctx.fillRect(mx + c * 48, my + r * 38, 44, 34);
              ctx.strokeRect(mx + c * 48, my + r * 38, 44, 34);
            }
          }
          const pulse = (Math.sin(t * 3) + 1) / 2;
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(mx + 70, my + 55, 6 + pulse * 3, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case 'econ_lemons': {
          // 4 cars: green peaches vs smoking yellow lemons
          for (let i = 0; i < 4; i++) {
            const cx = w * 0.2 + i * (w * 0.2);
            const peach = i % 2 === 0;
            const yOff = peach ? Math.sin(t * 2 + i) * 3 : 0;
            ctx.fillStyle = peach ? '#10b981' : '#eab308';
            ctx.beginPath();
            ctx.roundRect(cx - 16, h * 0.54 + yOff, 32, 12, 3);
            ctx.fill();
            ctx.fillRect(cx - 9, h * 0.45 + yOff, 18, 9);
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(cx - 9, h * 0.67 + yOff, 4, 0, Math.PI * 2);
            ctx.arc(cx + 9, h * 0.67 + yOff, 4, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
        }
        case 'econ_ostrom': {
          // Ocean waves + swimming glowing fish
          ctx.fillStyle = 'rgba(14, 165, 233, 0.22)';
          ctx.fillRect(0, h * 0.38, w, h * 0.62);
          for (let i = 0; i < 6; i++) {
            const fx = ((t * 35 + i * 52) % (w + 20)) - 10;
            const fy = h * 0.52 + Math.sin(t * 3 + i * 1.3) * 18;
            ctx.fillStyle = i % 2 === 0 ? '#38bdf8' : '#34d399';
            ctx.beginPath();
            ctx.ellipse(fx, fy, 8, 4, 0, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
        }
        case 'econ_prospect': {
          // S-Shaped Kahneman Value Curve (steep loss branch!)
          const ox = w * 0.5;
          const oy = h * 0.48;
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(w * 0.12, oy);
          ctx.lineTo(w * 0.88, oy);
          ctx.moveTo(ox, h * 0.14);
          ctx.lineTo(ox, h * 0.88);
          ctx.stroke();
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 2.6;
          ctx.beginPath();
          for (let i = 0; i <= 25; i++) {
            const u = i / 25;
            ctx.lineTo(ox + u * w * 0.36, oy - Math.pow(u, 0.65) * 32);
          }
          ctx.stroke();
          ctx.strokeStyle = '#ef4444';
          ctx.beginPath();
          ctx.moveTo(ox, oy);
          for (let i = 1; i <= 25; i++) {
            const u = i / 25;
            ctx.lineTo(ox - u * w * 0.36, oy + Math.pow(u, 0.65) * 52);
          }
          ctx.stroke();
          const u = Math.sin(t * 2);
          const bx = ox + u * w * 0.3;
          const by = u >= 0 ? oy - Math.pow(u, 0.65) * 28 : oy + Math.pow(-u, 0.65) * 46;
          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.arc(bx, by, 5, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case 'econ_cycle':
        case 'econ_money':
        case 'econ_coase':
        case 'econ_nudge':
        case 'econ_simon':
        case 'econ_tobin':
        case 'econ_schumpeter':
        case 'econ_hayek': {
          // Circular economic flow / wave interference
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(w / 2, h / 2, w * 0.32, h * 0.28, 0, 0, Math.PI * 2);
          ctx.stroke();
          for (let i = 0; i < 6; i++) {
            const a = t * 1.4 + (i / 6) * Math.PI * 2;
            ctx.fillStyle = i % 2 === 0 ? '#f59e0b' : '#34d399';
            ctx.beginPath();
            ctx.arc(w / 2 + Math.cos(a) * w * 0.32, h / 2 + Math.sin(a) * h * 0.28, 5, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
        }
        case 'soc_schelling': {
          // Schelling Blue Squares & Amber Triangles sorting grid
          const cols = 8;
          const rows = 4;
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const x = w * 0.14 + c * (w * 0.102);
              const y = h * 0.2 + r * 22;
              const isBlue = (c + Math.sin(t + r) * 0.5) < 4;
              ctx.fillStyle = isBlue ? '#3b82f6' : '#f97316';
              if (isBlue) {
                ctx.fillRect(x - 6, y - 6, 12, 12);
              } else {
                ctx.beginPath();
                ctx.moveTo(x, y - 7);
                ctx.lineTo(x + 7, y + 6);
                ctx.lineTo(x - 7, y + 6);
                ctx.closePath();
                ctx.fill();
              }
            }
          }
          break;
        }
        case 'soc_weakties':
        case 'soc_smallworld':
        case 'soc_putnam': {
          // Two dense clusters connected by a pulsing cyan Weak-Tie Bridge
          const drawClust = (cx: number, col: string) => {
            for (let i = 0; i < 5; i++) {
              const a = (i / 5) * Math.PI * 2;
              ctx.fillStyle = col;
              ctx.beginPath();
              ctx.arc(cx + Math.cos(a) * 24, h / 2 + Math.sin(a) * 22, 4.5, 0, Math.PI * 2);
              ctx.fill();
            }
          };
          ctx.strokeStyle = '#22d3ee';
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.moveTo(w * 0.34, h / 2);
          ctx.lineTo(w * 0.66, h / 2);
          ctx.stroke();
          const px = lerp(w * 0.34, w * 0.66, (t * 0.8) % 1);
          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.arc(px, h / 2, 4, 0, Math.PI * 2);
          ctx.fill();
          drawClust(w * 0.26, '#38bdf8');
          drawClust(w * 0.74, '#fb923c');
          break;
        }
        case 'soc_weber':
        case 'soc_durkheim':
        case 'soc_simmel':
        case 'soc_mead':
        case 'soc_cooley':
        case 'soc_agil':
        case 'soc_merton':
        case 'soc_olson': {
          // Social structure triangle / interlocking nodes
          const pts = [
            { x: w * 0.5, y: h * 0.2 },
            { x: w * 0.25, y: h * 0.76 },
            { x: w * 0.75, y: h * 0.76 }
          ];
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          ctx.lineTo(pts[1].x, pts[1].y);
          ctx.lineTo(pts[2].x, pts[2].y);
          ctx.closePath();
          ctx.stroke();
          pts.forEach((p, i) => {
            ctx.fillStyle = ['#38bdf8', '#f59e0b', '#34d399'][i];
            ctx.beginPath();
            ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
            ctx.fill();
          });
          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.arc(w * 0.5 + Math.cos(t * 2) * 18, h * 0.55 + Math.sin(t * 2) * 10, 5, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case 'psy_zpd':
        case 'psy_maslow': {
          // Rising stepped scaffold / pyramid with climbing golden orb
          for (let i = 0; i < 4; i++) {
            const bw = 110 - i * 22;
            ctx.fillStyle = ['#ef4444', '#f59e0b', '#10b981', '#38bdf8'][i];
            ctx.fillRect(w / 2 - bw / 2, h * 0.76 - i * 16, bw, 13);
          }
          const climb = (Math.sin(t * 2) + 1) / 2;
          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.arc(w / 2, h * 0.76 - climb * 58, 6, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case 'psy_piaget':
        case 'psy_skinner':
        case 'psy_pavlov':
        case 'psy_bandura':
        case 'psy_bowlby':
        case 'psy_dissonance':
        case 'psy_ebbinghaus':
        case 'psy_baddeley': {
          // Memory decay + golden review spikes / conditioning wave
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          for (let i = 0; i <= 40; i++) {
            const u = i / 40;
            const seg = (u * 3) % 1;
            const y = h * 0.25 + (1 - Math.exp(-seg * 2.5)) * h * 0.55;
            if (i === 0) ctx.moveTo(w * 0.1 + u * w * 0.8, y);
            else ctx.lineTo(w * 0.1 + u * w * 0.8, y);
          }
          ctx.stroke();
          ctx.fillStyle = '#f59e0b';
          [0.1, 0.37, 0.63].forEach((u) => {
            ctx.beginPath();
            ctx.arc(w * 0.1 + u * w * 0.8, h * 0.25, 4.5, 0, Math.PI * 2);
            ctx.fill();
          });
          break;
        }
        case 'pol_arrow':
        case 'pol_downs':
        case 'pol_montesquieu':
        case 'pol_nye':
        case 'pol_mcluhan':
        case 'pol_rogers':
        case 'pol_senge':
        case 'pol_christensen': {
          // Rogers S-Curve / Disruptive Crossing Trajectory
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 2.8;
          ctx.beginPath();
          for (let i = 0; i <= 40; i++) {
            const u = i / 40;
            const s = 1 / (1 + Math.exp(-(u - 0.5) * 9));
            const px = w * 0.12 + u * w * 0.76;
            const py = h * 0.82 - s * h * 0.64;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();
          const u = (t * 0.4) % 1;
          const s = 1 / (1 + Math.exp(-(u - 0.5) * 9));
          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.arc(w * 0.12 + u * w * 0.76, h * 0.82 - s * h * 0.64, 5.5, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case 'sys_forrester':
        case 'sys_wiener':
        case 'sys_gst': {
          // Cutaway bathtub stock level oscillating with wave
          const lvl = 0.5 + Math.sin(t * 2.2) * 0.22;
          ctx.fillStyle = 'rgba(56, 189, 248, 0.55)';
          ctx.fillRect(w * 0.28, h * 0.78 - lvl * 54, w * 0.44, lvl * 54);
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2.2;
          ctx.strokeRect(w * 0.28, h * 0.24, w * 0.44, 54);
          break;
        }
        case 'sys_holland': {
          // Boids swarming triangles around center
          for (let i = 0; i < 14; i++) {
            const a = t * 1.4 + i * 0.45;
            const rx = w * 0.34 + Math.sin(t + i) * 14;
            const ry = h * 0.28 + Math.cos(t * 1.2 + i) * 8;
            const bx = w / 2 + Math.cos(a) * rx;
            const by = h / 2 + Math.sin(a) * ry;
            ctx.fillStyle = i % 3 === 0 ? '#34d399' : '#38bdf8';
            ctx.beginPath();
            ctx.arc(bx, by, 3.5, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
        }
        case 'sys_lorenz': {
          // Animated butterfly figure-8 attractor wings!
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (let i = 0; i <= 70; i++) {
            const a = (i / 70) * Math.PI * 2 + t * 0.5;
            const px = w / 2 + Math.sin(a) * 62;
            const py = h / 2 + Math.sin(a * 2) * 30;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();
          ctx.strokeStyle = '#f43f5e';
          ctx.beginPath();
          for (let i = 0; i <= 70; i++) {
            const a = (i / 70) * Math.PI * 2 + t * 0.5 + 0.14;
            const px = w / 2 + Math.sin(a) * 56;
            const py = h / 2 + Math.sin(a * 2) * 26;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();
          break;
        }
        default: {
          // Dynamic geometric signature based on modelId for any remaining thumbType
          const hue1 = (modelId * 47) % 360;
          const hue2 = (hue1 + 140) % 360;
          for (let i = 0; i < 5; i++) {
            const a = (i / 5) * Math.PI * 2 + t * 0.5;
            const r = 24 + Math.sin(t * 1.5 + i) * 10;
            const nx = w / 2 + Math.cos(a) * r * 1.4;
            const ny = h / 2 + Math.sin(a) * r * 0.9;
            ctx.strokeStyle = `hsla(${hue1}, 75%, 65%, 0.45)`;
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(w / 2, h / 2);
            ctx.lineTo(nx, ny);
            ctx.stroke();
            ctx.fillStyle = i % 2 === 0 ? `hsl(${hue1}, 80%, 62%)` : `hsl(${hue2}, 80%, 62%)`;
            ctx.beginPath();
            ctx.arc(nx, ny, 7, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = '#f3a52b';
          ctx.beginPath();
          ctx.arc(w / 2, h / 2, 10 + Math.sin(t * 2) * 2, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [thumbType, modelId]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-[120px] block bg-[#0f141b]"
    />
  );
};
