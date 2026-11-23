import { StageEngine } from './engineEthics';
import { hitSlider } from './canvasHelpers';
import {
  clamp,
  lerp,
  drawPaperBg,
  drawLabel,
  drawMonoNum,
  drawArrow,
  drawGear,
  drawCoin,
  drawCompactSlider,
  drawToggleButton,
  hitBox,
  drawSparkline,
  drawTinyHint
} from './visualPrimitives';

export function createEconPoliticsVisualWorld(modelId: number): Record<number, StageEngine> | null {
  // =========================================================================
  // #87 亚当·斯密 · 看不见的手 (Live Supply/Demand X-Curve + Flying Coins + Surplus)
  // =========================================================================
  if (modelId === 87) {
    let S: any = {};
    return {
      1: {
        init() {
          S = {
            price: 0.78, // 0..1 mapped to $10..$90, eq at 0.5
            drag: false,
            coins: [] as { x: number; y: number; vx: number; vy: number; life: number }[],
            t: 0,
            sawGap: false,
            eqHold: 0
          };
        },
        down(x, y, { W, H }) {
          const gy = H * 0.14;
          const gh = H * 0.62;
          if (x > W * 0.14 && x < W * 0.86 && y > gy - 20 && y < gy + gh + 20) {
            S.drag = true;
            S.price = clamp(1 - (y - gy) / gh, 0.08, 0.92);
          }
        },
        move(_x, y, _dx, _dy, { H }) {
          if (S.drag) {
            const gy = H * 0.14;
            const gh = H * 0.62;
            S.price = clamp(1 - (y - gy) / gh, 0.08, 0.92);
          }
        },
        up() {
          S.drag = false;
        },
        tick({ ctx, W, H, dt, hit, toast }) {
          S.t += dt;
          drawPaperBg(ctx, W, H, false);
          const gx = W * 0.16;
          const gy = H * 0.14;
          const gw = W * 0.68;
          const gh = H * 0.62;

          // Axes
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(gx, gy);
          ctx.lineTo(gx, gy + gh);
          ctx.lineTo(gx + gw, gy + gh);
          ctx.stroke();
          drawLabel(ctx, '价格 P', gx - 8, gy + 8, '#334155', 11, 'right', true);
          drawLabel(ctx, '交易量 Q', gx + gw, gy + gh + 18, '#334155', 11, 'right', true);

          // Supply (upward) & Demand (downward)
          // D: y = gy + gh * (0.1 + 0.8 * q), S: y = gy + gh * (0.9 - 0.8 * q)
          // Equilibrium at q=0.5, p=0.5
          const p = S.price;
          const qD = clamp((0.9 - p) / 0.8, 0, 1);
          const qS = clamp((p - 0.1) / 0.8, 0, 1);
          const qTrade = Math.min(qD, qS);
          const py = gy + (1 - p) * gh;

          // Shaded consumer + producer surplus up to qTrade
          const eqX = gx + qTrade * gw;
          ctx.fillStyle = 'rgba(16, 185, 129, 0.16)';
          ctx.beginPath();
          ctx.moveTo(gx, gy + 0.1 * gh);
          ctx.lineTo(eqX, gy + (0.1 + 0.8 * qTrade) * gh);
          ctx.lineTo(eqX, py);
          ctx.lineTo(gx, py);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = 'rgba(37, 99, 235, 0.14)';
          ctx.beginPath();
          ctx.moveTo(gx, gy + 0.9 * gh);
          ctx.lineTo(eqX, gy + (0.9 - 0.8 * qTrade) * gh);
          ctx.lineTo(eqX, py);
          ctx.lineTo(gx, py);
          ctx.closePath();
          ctx.fill();

          // Curves
          ctx.strokeStyle = '#dc2626';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(gx, gy + 0.1 * gh);
          ctx.lineTo(gx + gw, gy + 0.9 * gh);
          ctx.stroke();
          drawLabel(ctx, '需求 D', gx + gw - 16, gy + 0.88 * gh - 10, '#dc2626', 12, 'right', true);

          ctx.strokeStyle = '#2563eb';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(gx, gy + 0.9 * gh);
          ctx.lineTo(gx + gw, gy + 0.1 * gh);
          ctx.stroke();
          drawLabel(ctx, '供给 S', gx + gw - 16, gy + 0.14 * gh, '#2563eb', 12, 'right', true);

          // Price bar (draggable)
          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 2.6;
          ctx.setLineDash([6, 4]);
          ctx.beginPath();
          ctx.moveTo(gx, py);
          ctx.lineTo(gx + gw, py);
          ctx.stroke();
          ctx.setLineDash([]);

          // Handle on left axis
          ctx.fillStyle = '#f59e0b';
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(gx, py, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          drawMonoNum(ctx, `$${Math.round(10 + p * 80)}`, gx - 16, py + 4, '#b45309', 12, 'right');

          // Shortage / Surplus gap bar
          const xD = gx + qD * gw;
          const xS = gx + qS * gw;
          if (Math.abs(qS - qD) > 0.06) {
            S.sawGap = true;
            hit(1, 0, '非均衡价格导致过剩或短缺');
            ctx.fillStyle = qS > qD ? 'rgba(239,68,68,0.22)' : 'rgba(245,158,11,0.25)';
            ctx.fillRect(Math.min(xD, xS), py - 8, Math.abs(xS - xD), 16);
            drawLabel(
              ctx,
              qS > qD ? '滞销过剩' : '排队短缺',
              (xD + xS) / 2,
              py - 14,
              qS > qD ? '#dc2626' : '#b45309',
              11,
              'center',
              true
            );
            // Invisible hand restoring arrow
            drawArrow(ctx, gx + gw + 22, py, gx + gw + 22, py + (qS > qD ? 34 : -34), '#059669', 3, 9);
          } else {
            S.eqHold += dt;
            if (S.eqHold > 0.6) {
              hit(1, 1, '供需自发出清，社会剩余最大化！');
              if (S.eqHold < 0.7) toast('市场出清：看不见的手实现自发协调');
            }
          }

          // Spawn coins proportional to qTrade
          if (Math.random() < qTrade * 0.45) {
            S.coins.push({
              x: gx + Math.random() * qTrade * gw,
              y: py,
              vx: (Math.random() - 0.5) * 40,
              vy: -35 - Math.random() * 45,
              life: 1
            });
          }
          S.coins = S.coins.filter((c: any) => c.life > 0);
          S.coins.forEach((c: any) => {
            c.x += c.vx * dt;
            c.y += c.vy * dt;
            c.vy += 80 * dt;
            c.life -= dt * 1.1;
            ctx.globalAlpha = clamp(c.life, 0, 1);
            drawCoin(ctx, c.x, c.y, 6, '¥');
            ctx.globalAlpha = 1;
          });

          // Top HUD numbers
          const surplusPct = Math.round((qTrade / 0.5) * (1 - Math.abs(p - 0.5)) * 100);
          drawMonoNum(ctx, `成交量: ${Math.round(qTrade * 100)}`, W * 0.25, H * 0.08, '#0f172a', 13, 'center');
          drawMonoNum(ctx, `总剩余: ${clamp(surplusPct, 0, 100)}%`, W * 0.52, H * 0.08, '#059669', 13, 'center');
          drawMonoNum(
            ctx,
            Math.abs(p - 0.5) < 0.05 ? '出清均衡' : p > 0.5 ? '价格偏高' : '价格偏低',
            W * 0.77,
            H * 0.08,
            Math.abs(p - 0.5) < 0.05 ? '#059669' : '#d97706',
            13,
            'center'
          );

          drawTinyHint(ctx, W, H, '上下拖动金色价格线，观察滞销、短缺与市场出清时的剩余最大化');
        }
      },
      2: {
        init() {
          S = {
            auto: true,
            shock: 0, // +0.25 demand boom or -0.25 supply cut
            price: 0.5,
            demandShift: 0,
            history: [] as number[],
            t: 0,
            shocksTriggered: 0
          };
        },
        down(x, y, { W, H }) {
          if (hitBox(x, y, W * 0.12, H * 0.8, 130, 32)) {
            S.demandShift = 0.22;
            S.shocksTriggered++;
          } else if (hitBox(x, y, W * 0.12 + 145, H * 0.8, 130, 32)) {
            S.demandShift = -0.2;
            S.shocksTriggered++;
          } else if (hitBox(x, y, W * 0.12 + 290, H * 0.8, 135, 32)) {
            S.auto = !S.auto;
          }
        },
        tick({ ctx, W, H, dt, hit }) {
          S.t += dt;
          drawPaperBg(ctx, W, H, false);
          const targetP = clamp(0.5 + S.demandShift * 0.5, 0.2, 0.85);
          if (S.auto) {
            S.price = lerp(S.price, targetP, dt * 2.2);
          }
          if (S.shocksTriggered >= 1) hit(2, 0, '外部冲击后观察价格自动搜寻新均衡');
          if (!S.auto && S.shocksTriggered >= 1) hit(2, 1, '价格管制冻结了自发调节，导致持续短缺/过剩');

          if (Math.floor(S.t * 15) !== Math.floor((S.t - dt) * 15)) {
            S.history.push(S.price);
            if (S.history.length > 70) S.history.shift();
          }

          // Animated marketplace stalls + flying arrows
          const cx = W * 0.34;
          const cy = H * 0.44;
          const r = Math.min(W, H) * 0.24;
          // Draw 3 trade nodes (Baker, Brewer, Butcher) exchanging coins
          const nodes = [
            { ang: -Math.PI / 2, label: '面包师', col: '#d97706' },
            { ang: Math.PI / 6, label: '酿酒师', col: '#2563eb' },
            { ang: (5 * Math.PI) / 6, label: '屠夫', col: '#dc2626' }
          ];
          const gap = Math.abs(S.price - targetP);
          const flowSpeed = clamp(1.3 - gap * 3.5, 0.2, 1.4);

          for (let i = 0; i < 3; i++) {
            const a = nodes[i];
            const b = nodes[(i + 1) % 3];
            const ax = cx + Math.cos(a.ang) * r;
            const ay = cy + Math.sin(a.ang) * r;
            const bx = cx + Math.cos(b.ang) * r;
            const by = cy + Math.sin(b.ang) * r;
            ctx.strokeStyle = 'rgba(100,116,139,0.35)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            ctx.stroke();

            // Moving goods/coin along edge
            const prog = (S.t * flowSpeed + i * 0.33) % 1;
            drawCoin(ctx, lerp(ax, bx, prog), lerp(ay, by, prog), 6.5, '¥');
          }

          nodes.forEach((n) => {
            const nx = cx + Math.cos(n.ang) * r;
            const ny = cy + Math.sin(n.ang) * r;
            ctx.fillStyle = n.col;
            ctx.beginPath();
            ctx.arc(nx, ny, 24, 0, Math.PI * 2);
            ctx.fill();
            drawLabel(ctx, n.label, nx, ny + 4, '#fff', 11, 'center', true);
          });

          // Right oscilloscope showing Price tracking Equilibrium
          drawSparkline(
            ctx,
            W * 0.62,
            H * 0.2,
            W * 0.32,
            H * 0.44,
            [
              { data: S.history, color: '#d97706', label: '市场价 P' },
              { data: S.history.map(() => targetP), color: '#059669', label: '均衡点 P*' }
            ],
            false
          );

          drawMonoNum(
            ctx,
            gap < 0.03 ? '交易畅通' : S.auto ? '价格自动收敛中...' : '限价管制 · 供需失衡',
            W * 0.78,
            H * 0.14,
            gap < 0.03 ? '#059669' : '#dc2626',
            13,
            'center'
          );

          drawToggleButton(ctx, W * 0.12, H * 0.8, 130, 32, '需求激增 (+)', S.demandShift > 0, '#059669');
          drawToggleButton(ctx, W * 0.12 + 145, H * 0.8, 130, 32, '需求骤降 (-)', S.demandShift < 0, '#dc2626');
          drawToggleButton(ctx, W * 0.12 + 290, H * 0.8, 135, 32, S.auto ? '价格自由浮动' : '价格管制冻结', !S.auto, '#7c3aed');

          drawTinyHint(ctx, W, H, '施加需求冲击并切换「自由浮动 / 价格管制」，观察交易循环速度与均衡追踪');
        }
      }
    };
  }

  // =========================================================================
  // #88 大卫·李嘉图 · 比较优势 (Twin Ports, Sailing Cloth/Wine Ships + PPF)
  // =========================================================================
  if (modelId === 88) {
    let S: any = {};
    return {
      1: {
        init() {
          S = { ukCloth: 0.5, ptWine: 0.5, drag: 0, t: 0, ships: 0 };
        },
        down(x, y, { W, H }) {
          if (hitSlider(x, y, W * 0.12, H * 0.74, W * 0.32)) {
            S.drag = 1;
            S.ukCloth = clamp((x - W * 0.12) / (W * 0.32), 0, 1);
          } else if (hitSlider(x, y, W * 0.56, H * 0.74, W * 0.32)) {
            S.drag = 2;
            S.ptWine = clamp((x - W * 0.56) / (W * 0.32), 0, 1);
          }
        },
        move(x, _y, _dx, _dy, { W }) {
          if (S.drag === 1) S.ukCloth = clamp((x - W * 0.12) / (W * 0.32), 0, 1);
          if (S.drag === 2) S.ptWine = clamp((x - W * 0.56) / (W * 0.32), 0, 1);
        },
        up() {
          S.drag = 0;
        },
        tick({ ctx, W, H, dt, hit }) {
          S.t += dt;
          drawPaperBg(ctx, W, H, false);

          // UK: 100 labor -> max 100 Cloth (cost 1) or 83 Wine (cost 1.2) -> comparative advantage in Cloth!
          // Portugal: 100 labor -> max 111 Cloth (cost 0.9) or 125 Wine (cost 0.8) -> absolute advantage in BOTH, comparative in Wine!
          const ukC = Math.round(S.ukCloth * 100);
          const ukW = Math.round((1 - S.ukCloth) * 83);
          const ptW = Math.round(S.ptWine * 125);
          const ptC = Math.round((1 - S.ptWine) * 111);
          const totC = ukC + ptC;
          const totW = ukW + ptW;
          const totalOutput = totC + totW;
          // Autarky baseline (50/50): uk(50C, 42W) + pt(55C, 62W) = 105C + 104W = 209
          // Full specialized (ukCloth=1, ptWine=1): 100C + 125W = 225 (+16 bonus!)
          const gain = totalOutput - 209;

          if (S.ukCloth > 0.85 || S.ptWine > 0.85) hit(1, 0, '比较优势取决于机会成本而非绝对效率');
          if (S.ukCloth > 0.9 && S.ptWine > 0.9) hit(1, 1, '完全专业化分工使世界总产出突破自给边界！');

          // Ocean channel between two ports
          ctx.fillStyle = '#bae6fd';
          ctx.fillRect(W * 0.32, H * 0.16, W * 0.36, H * 0.44);
          // Animated waves
          ctx.strokeStyle = 'rgba(2, 132, 199, 0.35)';
          ctx.lineWidth = 1.6;
          for (let row = 0; row < 4; row++) {
            const wy = H * 0.24 + row * 34;
            ctx.beginPath();
            for (let wx = W * 0.33; wx < W * 0.67; wx += 10) {
              const dy = Math.sin(wx * 0.08 + S.t * 3 + row) * 3;
              if (wx === W * 0.33) ctx.moveTo(wx, wy + dy);
              else ctx.lineTo(wx, wy + dy);
            }
            ctx.stroke();
          }

          // Left Port: England (Cloth mill)
          ctx.fillStyle = '#e2e8f0';
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(W * 0.06, H * 0.16, W * 0.26, H * 0.44, 10);
          ctx.fill();
          ctx.stroke();
          drawLabel(ctx, '英国港口', W * 0.19, H * 0.22, '#1e3a8a', 13, 'center', true);
          // Stacked cloth rolls (blue) & wine barrels (crimson)
          for (let i = 0; i < Math.round(ukC / 14); i++) {
            ctx.fillStyle = '#2563eb';
            ctx.fillRect(W * 0.1 + (i % 4) * 20, H * 0.34 - Math.floor(i / 4) * 14, 15, 10);
          }
          for (let i = 0; i < Math.round(ukW / 14); i++) {
            ctx.fillStyle = '#be123c';
            ctx.beginPath();
            ctx.arc(W * 0.11 + (i % 4) * 20, H * 0.49 - Math.floor(i / 4) * 14, 6, 0, Math.PI * 2);
            ctx.fill();
          }
          drawMonoNum(ctx, `布:${ukC}  酒:${ukW}`, W * 0.19, H * 0.56, '#334155', 12, 'center');

          // Right Port: Portugal (Vineyard)
          ctx.fillStyle = '#fef3c7';
          ctx.strokeStyle = '#b45309';
          ctx.beginPath();
          ctx.roundRect(W * 0.68, H * 0.16, W * 0.26, H * 0.44, 10);
          ctx.fill();
          ctx.stroke();
          drawLabel(ctx, '葡萄牙港口', W * 0.81, H * 0.22, '#9a3412', 13, 'center', true);
          for (let i = 0; i < Math.round(ptC / 14); i++) {
            ctx.fillStyle = '#2563eb';
            ctx.fillRect(W * 0.72 + (i % 4) * 20, H * 0.34 - Math.floor(i / 4) * 14, 15, 10);
          }
          for (let i = 0; i < Math.round(ptW / 14); i++) {
            ctx.fillStyle = '#be123c';
            ctx.beginPath();
            ctx.arc(W * 0.73 + (i % 4) * 20, H * 0.49 - Math.floor(i / 4) * 14, 6, 0, Math.PI * 2);
            ctx.fill();
          }
          drawMonoNum(ctx, `布:${ptC}  酒:${ptW}`, W * 0.81, H * 0.56, '#334155', 12, 'center');

          // Trade ships sailing across when specialized
          const tradeIntensity = clamp((S.ukCloth + S.ptWine - 1) * 1.2, 0, 1);
          if (tradeIntensity > 0.1) {
            const p1 = (S.t * 0.35) % 1;
            const sx1 = lerp(W * 0.35, W * 0.65, p1);
            ctx.fillStyle = '#1d4ed8';
            ctx.beginPath();
            ctx.roundRect(sx1 - 14, H * 0.28, 28, 12, 4);
            ctx.fill();
            drawLabel(ctx, '布 →', sx1, H * 0.25, '#1d4ed8', 10, 'center', true);

            const sx2 = lerp(W * 0.65, W * 0.35, p1);
            ctx.fillStyle = '#be123c';
            ctx.beginPath();
            ctx.roundRect(sx2 - 14, H * 0.44, 28, 12, 4);
            ctx.fill();
            drawLabel(ctx, '← 酒', sx2, H * 0.41, '#be123c', 10, 'center', true);
          }

          // Top total scoreboard
          drawMonoNum(ctx, `世界总布: ${totC}`, W * 0.26, H * 0.09, '#2563eb', 13, 'center');
          drawMonoNum(ctx, `世界总酒: ${totW}`, W * 0.5, H * 0.09, '#be123c', 13, 'center');
          drawMonoNum(
            ctx,
            `分工红利: ${gain >= 0 ? '+' : ''}${gain}`,
            W * 0.74,
            H * 0.09,
            gain > 8 ? '#059669' : '#64748b',
            14,
            'center'
          );

          drawCompactSlider(ctx, W * 0.12, H * 0.74, W * 0.32, S.ukCloth, '英国专产呢绒比例', `${Math.round(S.ukCloth * 100)}%`, '#2563eb');
          drawCompactSlider(ctx, W * 0.56, H * 0.74, W * 0.32, S.ptWine, '葡萄牙专产酒比例', `${Math.round(S.ptWine * 100)}%`, '#be123c');
          drawTinyHint(ctx, W, H, '尽管葡萄牙两样都更高效，仍拉满两国比较优势，看贸易红利跃升');
        }
      },
      2: {
        init() {
          S = { ratio: 1.0, drag: false, t: 0 };
        },
        down(x, y, { W, H }) {
          if (hitSlider(x, y, W * 0.2, H * 0.78, W * 0.6)) {
            S.drag = true;
            S.ratio = 0.6 + clamp((x - W * 0.2) / (W * 0.6), 0, 1) * 0.9; // 0.6 to 1.5
          }
        },
        move(x, _y, _dx, _dy, { W }) {
          if (S.drag) S.ratio = 0.6 + clamp((x - W * 0.2) / (W * 0.6), 0, 1) * 0.9;
        },
        up() {
          S.drag = false;
        },
        tick({ ctx, W, H, dt, hit }) {
          S.t += dt;
          drawPaperBg(ctx, W, H, false);
          // Mutually beneficial terms of trade: between 0.83 and 1.12 Wine per Cloth
          const winWin = S.ratio >= 0.83 && S.ratio <= 1.12;
          if (winWin) hit(2, 0, '贸易条件落入双赢区间：双方消费超越各自生产边界');
          if (!winWin) hit(2, 1, '汇率超出机会成本区间，一方拒绝贸易');

          // Draw PPF triangles for UK (left) and Portugal (right) + Trade Frontier dashed line
          const drawPPF = (ox: number, oy: number, w: number, h: number, title: string, maxC: number, maxW: number, exportCloth: boolean) => {
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(ox, oy - h);
            ctx.lineTo(ox, oy);
            ctx.lineTo(ox + w, oy);
            ctx.stroke();
            drawLabel(ctx, title, ox + w / 2, oy - h - 14, '#0f172a', 13, 'center', true);
            drawLabel(ctx, '酒', ox - 12, oy - h + 6, '#be123c', 11, 'right', true);
            drawLabel(ctx, '布', ox + w, oy + 16, '#2563eb', 11, 'right', true);

            // Autarky PPF
            const cx = ox + (maxC / 140) * w;
            const wy = oy - (maxW / 140) * h;
            ctx.fillStyle = 'rgba(148,163,184,0.22)';
            ctx.beginPath();
            ctx.moveTo(ox, oy);
            ctx.lineTo(cx, oy);
            ctx.lineTo(ox, wy);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx, oy);
            ctx.lineTo(ox, wy);
            ctx.stroke();

            // Trade consumption frontier
            const tradeW = exportCloth ? maxC * S.ratio : maxW;
            const tradeC = exportCloth ? maxC : maxW / S.ratio;
            const tcx = ox + Math.min(1.15, tradeC / 140) * w;
            const twy = oy - Math.min(1.15, tradeW / 140) * h;
            const better = exportCloth ? tradeW > maxW : tradeC > maxC;

            ctx.strokeStyle = better ? '#059669' : '#dc2626';
            ctx.lineWidth = 2.6;
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            ctx.moveTo(tcx, oy);
            ctx.lineTo(ox, twy);
            ctx.stroke();
            ctx.setLineDash([]);

            drawMonoNum(ctx, better ? '贸易获益 ✓' : '无利可图 ✕', ox + w * 0.65, oy - h * 0.72, better ? '#059669' : '#dc2626', 12, 'center');
          };

          drawPPF(W * 0.12, H * 0.62, W * 0.3, H * 0.42, '英国 PPF', 100, 83, true);
          drawPPF(W * 0.58, H * 0.62, W * 0.3, H * 0.42, '葡萄牙 PPF', 111, 125, false);

          // Highlight win-win zone on slider
          const sx = W * 0.2;
          const sw = W * 0.6;
          const z1 = sx + ((0.83 - 0.6) / 0.9) * sw;
          const z2 = sx + ((1.12 - 0.6) / 0.9) * sw;
          ctx.fillStyle = 'rgba(16, 185, 129, 0.22)';
          ctx.fillRect(z1, H * 0.78 - 10, z2 - z1, 20);

          drawCompactSlider(
            ctx,
            sx,
            H * 0.78,
            sw,
            (S.ratio - 0.6) / 0.9,
            '贸易交换比（1 单位布 换 酒）',
            `1 : ${S.ratio.toFixed(2)}`,
            winWin ? '#059669' : '#dc2626'
          );
          drawTinyHint(ctx, W, H, '拖动交换比滑块落入绿色双赢区间，观察两国消费边界同时向外扩张');
        }
      }
    };
  }

  // =========================================================================
  // #90 凯恩斯 · 乘数效应 (Circular Household <-> Firm Pipe Loop + MPC Valve)
  // =========================================================================
  if (modelId === 90) {
    let S: any = {};
    return {
      1: {
        init() {
          S = {
            mpc: 0.75,
            drag: false,
            packets: [] as { ang: number; amt: number; round: number }[],
            totalGDP: 0,
            leaked: 0,
            t: 0
          };
        },
        down(x, y, { W, H }) {
          if (hitBox(x, y, W * 0.38, H * 0.08, 160, 34)) {
            S.packets.push({ ang: 0, amt: 100, round: 1 });
            S.totalGDP += 100;
          } else if (hitSlider(x, y, W * 0.2, H * 0.82, W * 0.6)) {
            S.drag = true;
            S.mpc = 0.2 + clamp((x - W * 0.2) / (W * 0.6), 0, 1) * 0.72;
          }
        },
        move(x, _y, _dx, _dy, { W }) {
          if (S.drag) S.mpc = 0.2 + clamp((x - W * 0.2) / (W * 0.6), 0, 1) * 0.72;
        },
        up() {
          S.drag = false;
        },
        tick({ ctx, W, H, dt, hit }) {
          S.t += dt;
          drawPaperBg(ctx, W, H, false);
          const cx = W * 0.5;
          const cy = H * 0.45;
          const rx = Math.min(W * 0.28, 190);
          const ry = Math.min(H * 0.2, 88);

          // Circular economy glass pipe
          ctx.strokeStyle = 'rgba(37, 99, 235, 0.16)';
          ctx.lineWidth = 22;
          ctx.beginPath();
          ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(cx, cy, rx + 11, ry + 11, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.ellipse(cx, cy, rx - 11, ry - 11, 0, 0, Math.PI * 2);
          ctx.stroke();

          // Savings leak spout at bottom
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 10;
          ctx.beginPath();
          ctx.moveTo(cx, cy + ry + 8);
          ctx.lineTo(cx, cy + ry + 42);
          ctx.stroke();
          drawLabel(ctx, `储蓄漏出 ${Math.round((1 - S.mpc) * 100)}%`, cx + 16, cy + ry + 34, '#64748b', 11, 'left', true);

          // Left Node: Household, Right Node: Firms
          const drawStation = (sx: number, sy: number, title: string, col: string) => {
            ctx.fillStyle = col;
            ctx.beginPath();
            ctx.roundRect(sx - 44, sy - 24, 88, 48, 10);
            ctx.fill();
            drawLabel(ctx, title, sx, sy + 5, '#fff', 13, 'center', true);
          };
          drawStation(cx - rx, cy, '居民家庭', '#0284c7');
          drawStation(cx + rx, cy, '生产企业', '#059669');

          // Update & draw circulating money packets
          S.packets.forEach((p: any) => {
            const prevLap = Math.floor(p.ang / Math.PI);
            p.ang += dt * 2.1;
            const curLap = Math.floor(p.ang / Math.PI);
            if (curLap > prevLap) {
              const save = p.amt * (1 - S.mpc);
              p.amt *= S.mpc;
              p.round++;
              S.leaked += save;
              if (p.amt >= 2) {
                S.totalGDP += p.amt;
                hit(1, 0, '支出在家庭与企业间逐轮乘数放大');
              }
            }
          });
          S.packets = S.packets.filter((p: any) => p.amt >= 2);
          S.packets.forEach((p: any) => {
            const px = cx + Math.cos(p.ang) * rx;
            const py = cy + Math.sin(p.ang) * ry;
            const r = clamp(5 + Math.sqrt(p.amt) * 1.1, 6, 17);
            drawCoin(ctx, px, py, r, `${Math.round(p.amt)}`);
          });

          // Center multiplier readout
          const k = 1 / (1 - S.mpc);
          if (S.mpc > 0.82 && S.totalGDP > 150) hit(1, 1, '高边际消费倾向令理论乘数陡增！');
          drawMonoNum(ctx, `k = ${k.toFixed(2)}×`, cx, cy - 6, '#0f172a', 22, 'center');
          drawMonoNum(ctx, `累计拉动 GDP: ¥${Math.round(S.totalGDP)}`, cx, cy + 18, '#059669', 12, 'center');

          drawToggleButton(ctx, W * 0.38, H * 0.08, 160, 34, '注入 ¥100 财政支出', true, '#d97706');
          drawCompactSlider(ctx, W * 0.2, H * 0.82, W * 0.6, (S.mpc - 0.2) / 0.72, '边际消费倾向 MPC', `${(S.mpc * 100).toFixed(0)}%`, '#0284c7');
          drawTinyHint(ctx, W, H, '点击注入 ¥100 财政支出，拖动 MPC 阀门调节储蓄漏出与货币循环次数');
        }
      },
      2: {
        init() {
          S = { saveRate: 0.25, drag: false, t: 0, hist: [] as number[] };
        },
        down(x, y, { W, H }) {
          if (hitSlider(x, y, W * 0.2, H * 0.78, W * 0.6)) {
            S.drag = true;
            S.saveRate = 0.1 + clamp((x - W * 0.2) / (W * 0.6), 0, 1) * 0.65;
          }
        },
        move(x, _y, _dx, _dy, { W }) {
          if (S.drag) S.saveRate = 0.1 + clamp((x - W * 0.2) / (W * 0.6), 0, 1) * 0.65;
        },
        up() {
          S.drag = false;
        },
        tick({ ctx, W, H, dt, hit }) {
          S.t += dt;
          drawPaperBg(ctx, W, H, false);
          // Paradox of Thrift: higher individual saving shrinks aggregate demand -> shrinks income -> total savings actually drop or stagnate!
          const gdp = clamp(100 / (0.25 + S.saveRate * 1.4), 25, 160);
          const totalSavings = gdp * S.saveRate * 0.85;
          if (S.saveRate > 0.55) hit(2, 0, '节俭悖论：人人缩减消费导致总收入萎缩');
          if (S.saveRate < 0.25) hit(2, 1, '适度消费维持总需求，反哺就业与储蓄池');

          // Two animated glass cylinders: Aggregate Income vs Total Savings
          const drawTank = (cx: number, label: string, val: number, max: number, col: string) => {
            const h = H * 0.42;
            const w = 90;
            const by = H * 0.64;
            const fill = clamp(val / max, 0.05, 1);
            ctx.fillStyle = col;
            ctx.globalAlpha = 0.82;
            ctx.fillRect(cx - w / 2 + 4, by - fill * h, w - 8, fill * h);
            ctx.globalAlpha = 1;
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 2.4;
            ctx.strokeRect(cx - w / 2, by - h, w, h);
            drawLabel(ctx, label, cx, by - h - 12, '#1e293b', 13, 'center', true);
            drawMonoNum(ctx, `¥${Math.round(val)}`, cx, by + 20, col, 14, 'center');
          };

          drawTank(W * 0.34, '社会总收入 Y', gdp, 160, '#0284c7');
          drawTank(W * 0.66, '实际总储蓄 S', totalSavings, 70, '#059669');
          drawArrow(ctx, W * 0.43, H * 0.44, W * 0.57, H * 0.44, '#64748b', 2.5, 9);

          drawCompactSlider(
            ctx,
            W * 0.2,
            H * 0.78,
            W * 0.6,
            (S.saveRate - 0.1) / 0.65,
            '全民储蓄意愿 s',
            `${Math.round(S.saveRate * 100)}%`,
            '#d97706'
          );
          drawTinyHint(ctx, W, H, '拉高全民储蓄意愿，观察总收入水柱暴跌如何抵消个人节俭');
        }
      }
    };
  }

  // =========================================================================
  // #91 熊彼特 · 创造性破坏 (Animated City Skyline Morphing: Steam -> Electric -> AI)
  // =========================================================================
  if (modelId === 91) {
    let S: any = {};
    return {
      1: {
        init() {
          S = {
            wave: 0, // 0..1 innovation transition
            era: 0,
            t: 0,
            oldShare: 0.9,
            newShare: 0.1,
            histOld: [] as number[],
            histNew: [] as number[],
            innovated: 0
          };
        },
        down(x, y, { W, H }) {
          if (hitBox(x, y, W * 0.34, H * 0.79, 200, 36)) {
            S.era = (S.era + 1) % 3;
            S.wave = 0;
            S.innovated++;
          }
        },
        tick({ ctx, W, H, dt, hit }) {
          S.t += dt;
          drawPaperBg(ctx, W, H, false);
          S.wave = clamp(S.wave + dt * (S.era > 0 ? 0.32 : 0.02), 0, 1);
          const sCurve = 1 / (1 + Math.exp(-(S.wave - 0.45) * 10));
          S.newShare = S.era === 0 ? 0.08 : sCurve;
          S.oldShare = 1 - S.newShare;

          if (S.innovated >= 1 && S.wave > 0.4) hit(1, 0, '颠覆性创新摧毁旧产能的同时重塑生产边界');
          if (S.innovated >= 2) hit(1, 1, '经济在「创新—毁灭—重构」的周期浪潮中演进');

          // Sky horizon
          const groundY = H * 0.62;
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(W * 0.08, groundY, W * 0.84, 5);

          // Left half: Old industry (chimneys shrinking as oldShare drops)
          const oldH = 40 + S.oldShare * 110;
          for (let i = 0; i < 3; i++) {
            const bx = W * 0.14 + i * 68;
            const bh = oldH * (0.75 + (i % 2) * 0.25);
            ctx.fillStyle = `rgba(100, 116, 139, ${0.35 + S.oldShare * 0.65})`;
            ctx.fillRect(bx, groundY - bh, 42, bh);
            // Chimney + smoke
            ctx.fillRect(bx + 28, groundY - bh - 24, 10, 24);
            if (S.oldShare > 0.25) {
              const p = (S.t * 0.8 + i * 0.3) % 1;
              ctx.fillStyle = `rgba(148,163,184,${(1 - p) * 0.6})`;
              ctx.beginPath();
              ctx.arc(bx + 33 + p * 18, groundY - bh - 28 - p * 28, 5 + p * 9, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          drawLabel(ctx, '旧产业产能', W * 0.26, groundY + 20, '#64748b', 12, 'center', true);

          // Right half: New industry (wind turbines + solar towers rising with newShare)
          const newH = 30 + S.newShare * 130;
          for (let i = 0; i < 3; i++) {
            const bx = W * 0.58 + i * 76;
            // Glass skyscraper
            ctx.fillStyle = `rgba(14, 165, 233, ${0.25 + S.newShare * 0.75})`;
            ctx.fillRect(bx, groundY - newH * (0.7 + i * 0.12), 36, newH * (0.7 + i * 0.12));
            // Spinning turbine atop
            const ty = groundY - newH * (0.7 + i * 0.12) - 22;
            ctx.strokeStyle = '#0284c7';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(bx + 18, ty + 22);
            ctx.lineTo(bx + 18, ty);
            ctx.stroke();
            for (let b = 0; b < 3; b++) {
              const ang = S.t * (2 + S.newShare * 5) + (b * Math.PI * 2) / 3;
              ctx.beginPath();
              ctx.moveTo(bx + 18, ty);
              ctx.lineTo(bx + 18 + Math.cos(ang) * 18, ty + Math.sin(ang) * 18);
              ctx.stroke();
            }
          }
          drawLabel(ctx, '新产业集群', W * 0.72, groundY + 20, '#0284c7', 12, 'center', true);

          // Moving productivity gauge
          const prod = Math.round(100 + S.era * 65 + S.newShare * 85);
          drawMonoNum(ctx, `全要素生产率: ${prod}`, W * 0.5, H * 0.1, '#059669', 15, 'center');
          drawMonoNum(ctx, `旧就业 ${Math.round(S.oldShare * 100)}%  |  新就业 ${Math.round(S.newShare * 100)}%`, W * 0.5, H * 0.16, '#475569', 12, 'center');

          const eraLabels = ['引入电气与内燃机 ⚡', '引入数字与清洁能源 ☀', '重置至蒸汽时代 ⚙'];
          drawToggleButton(ctx, W * 0.34, H * 0.79, 200, 36, eraLabels[S.era], true, '#0284c7');
          drawTinyHint(ctx, W, H, '点击注入颠覆性技术浪潮，观察旧厂房萎缩与新产业城市拔地而起');
        }
      },
      2: {
        init() {
          S = { protectOld: 0.1, drag: false, t: 0, growth: [] as number[] };
        },
        down(x, y, { W, H }) {
          if (hitSlider(x, y, W * 0.2, H * 0.78, W * 0.6)) {
            S.drag = true;
            S.protectOld = clamp((x - W * 0.2) / (W * 0.6), 0, 1);
          }
        },
        move(x, _y, _dx, _dy, { W }) {
          if (S.drag) S.protectOld = clamp((x - W * 0.2) / (W * 0.6), 0, 1);
        },
        up() {
          S.drag = false;
        },
        tick({ ctx, W, H, dt, hit }) {
          S.t += dt;
          drawPaperBg(ctx, W, H, false);
          if (S.protectOld > 0.7) hit(2, 0, '过度补贴僵尸企业锁死了资本与人才流动');
          if (S.protectOld < 0.25) hit(2, 1, '允许旧部门出清，创新引擎加速运转');

          // Two interlocking gears: Old Subsidized Wall vs Innovation Engine
          const speed = (1.1 - S.protectOld * 0.95) * 2.5;
          drawGear(ctx, W * 0.34, H * 0.42, 46, 10, S.t * speed, '#0ea5e9', '#0369a1');
          drawGear(ctx, W * 0.34 + 84, H * 0.42, 34, 8, -S.t * speed * 1.25, '#10b981', '#047857');

          // Brake pad clamping onto gear proportional to protectOld
          const clampDist = lerp(42, 4, S.protectOld);
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(W * 0.34 - 26, H * 0.42 - 58 - clampDist, 52, 14);
          drawLabel(ctx, '旧产业保护壁垒', W * 0.34, H * 0.42 - 66 - clampDist, '#dc2626', 11, 'center', true);

          // Growth sparkline
          if (Math.floor(S.t * 14) !== Math.floor((S.t - dt) * 14)) {
            S.growth.push(clamp(0.15 + (1 - S.protectOld) * 0.78, 0.08, 0.95));
            if (S.growth.length > 60) S.growth.shift();
          }
          drawSparkline(ctx, W * 0.58, H * 0.22, W * 0.34, H * 0.4, [{ data: S.growth, color: '#059669', label: '长期增长率' }]);

          drawCompactSlider(ctx, W * 0.2, H * 0.78, W * 0.6, S.protectOld, '旧产业准入保护力度', `${Math.round(S.protectOld * 100)}%`, '#dc2626');
          drawTinyHint(ctx, W, H, '拖动保护壁垒滑块，看制动钳如何拖慢创新齿轮与长期增长曲线');
        }
      }
    };
  }

  // =========================================================================
  // #92 哈耶克 · 分散知识与价格信号 (Tin Mine Shock + Rippling Price Telegraph Rings)
  // =========================================================================
  if (modelId === 92) {
    let S: any = {};
    return {
      1: {
        init() {
          S = {
            mineCollapsed: false,
            pulseR: 0,
            price: 100,
            t: 0,
            factories: Array.from({ length: 6 }, (_, i) => ({
              ang: (i / 6) * Math.PI * 2 - Math.PI / 6,
              useTin: 1.0,
              name: ['焊锡厂', '罐头厂', '铜合金', '化工管', '芯片厂', '电池厂'][i]
            }))
          };
        },
        down(x, y, { W, H }) {
          const cx = W * 0.5;
          const cy = H * 0.45;
          if (Math.hypot(x - cx, y - cy) < 55 || hitBox(x, y, W * 0.36, H * 0.8, 180, 34)) {
            S.mineCollapsed = !S.mineCollapsed;
            S.pulseR = 10;
          }
        },
        tick({ ctx, W, H, dt, hit }) {
          S.t += dt;
          drawPaperBg(ctx, W, H, true);
          const cx = W * 0.5;
          const cy = H * 0.45;
          const rad = Math.min(W * 0.33, H * 0.32);

          const targetP = S.mineCollapsed ? 245 : 100;
          S.price = lerp(S.price, targetP, dt * 2.4);
          if (S.pulseR > 0) {
            S.pulseR += dt * 210;
            if (S.pulseR > rad + 90) S.pulseR = 0;
          }

          if (S.mineCollapsed && S.price > 190) hit(1, 0, '矿山坍塌触发价格脉冲，无需通知原因即可传导稀缺信号');
          if (S.mineCollapsed && S.factories.every((f: any) => f.useTin < 0.5)) hit(1, 1, '各厂仅凭价格信号自发寻找替代材料，实现分布式协调');

          // Expanding price telegraph ring
          if (S.pulseR > 0) {
            ctx.strokeStyle = S.mineCollapsed ? 'rgba(245, 158, 11, 0.85)' : 'rgba(56, 189, 248, 0.8)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(cx, cy, S.pulseR, 0, Math.PI * 2);
            ctx.stroke();
          }

          // Factories orbiting the Tin Mine
          S.factories.forEach((f: any) => {
            const fx = cx + Math.cos(f.ang) * rad;
            const fy = cy + Math.sin(f.ang) * rad;
            const targetTin = S.mineCollapsed ? 0.32 : 1.0;
            f.useTin = lerp(f.useTin, targetTin, dt * 1.6);

            // Connection wire
            ctx.strokeStyle = S.mineCollapsed ? 'rgba(245, 158, 11, 0.35)' : 'rgba(148, 163, 184, 0.25)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(fx, fy);
            ctx.stroke();

            // Factory node + fuel bar
            ctx.fillStyle = '#1e293b';
            ctx.strokeStyle = f.useTin < 0.55 ? '#10b981' : '#38bdf8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(fx, fy, 26, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            drawLabel(ctx, f.name, fx, fy - 2, '#f8fafc', 10.5, 'center', true);
            drawMonoNum(ctx, `锡 ${Math.round(f.useTin * 100)}%`, fx, fy + 13, f.useTin < 0.55 ? '#34d399' : '#7dd3fc', 10, 'center');
          });

          // Central Tin Mine
          ctx.fillStyle = S.mineCollapsed ? '#b91c1c' : '#0369a1';
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(cx, cy, 40, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          drawLabel(ctx, S.mineCollapsed ? '锡矿坍塌!' : '核心锡矿', cx, cy - 4, '#fff', 12, 'center', true);
          drawMonoNum(ctx, `¥${Math.round(S.price)}`, cx, cy + 16, '#fde68a', 14, 'center');

          drawToggleButton(ctx, W * 0.36, H * 0.8, 180, 34, S.mineCollapsed ? '修复锡矿供给' : '触发锡矿坍塌 ⚡', S.mineCollapsed, '#d97706', true);
          drawTinyHint(ctx, W, H, '点击中央锡矿触发供给中断，看价格信号环如何自发节约全网用锡量', true);
        }
      },
      2: {
        init() {
          S = { central: false, t: 0, errorHist: [] as number[], noise: 0.5 };
        },
        down(x, y, { W, H }) {
          if (hitBox(x, y, W * 0.25, H * 0.8, 160, 34)) S.central = false;
          if (hitBox(x, y, W * 0.53, H * 0.8, 160, 34)) S.central = true;
        },
        tick({ ctx, W, H, dt, hit }) {
          S.t += dt;
          drawPaperBg(ctx, W, H, true);
          if (S.central) hit(2, 0, '中央汇总面临信息延迟与局部默会知识丢失');
          else hit(2, 1, '分布式局部价格快速消化了局部信息');

          // Visual comparison: Star bottleneck vs Mesh fast-adjusting dots
          const cx = W * 0.32;
          const cy = H * 0.44;
          const r = 82;
          const err = S.central ? 0.55 + Math.sin(S.t * 3) * 0.22 : 0.14 + Math.sin(S.t * 6) * 0.04;
          if (Math.floor(S.t * 15) !== Math.floor((S.t - dt) * 15)) {
            S.errorHist.push(err);
            if (S.errorHist.length > 60) S.errorHist.shift();
          }

          for (let i = 0; i < 8; i++) {
            const ang = (i / 8) * Math.PI * 2;
            const nx = cx + Math.cos(ang) * r;
            const ny = cy + Math.sin(ang) * r;
            ctx.strokeStyle = S.central ? 'rgba(239,68,68,0.5)' : 'rgba(16,185,129,0.45)';
            ctx.beginPath();
            if (S.central) {
              ctx.moveTo(cx, cy);
              ctx.lineTo(nx, ny);
            } else {
              const nextAng = ((i + 1) / 8) * Math.PI * 2;
              ctx.moveTo(nx, ny);
              ctx.lineTo(cx + Math.cos(nextAng) * r, cy + Math.sin(nextAng) * r);
            }
            ctx.stroke();

            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.arc(nx, ny, 9, 0, Math.PI * 2);
            ctx.fill();
          }
          if (S.central) {
            ctx.fillStyle = '#dc2626';
            ctx.beginPath();
            ctx.arc(cx, cy, 22 + Math.sin(S.t * 8) * 3, 0, Math.PI * 2);
            ctx.fill();
            drawLabel(ctx, '中央拥堵', cx, cy + 4, '#fff', 10, 'center', true);
          } else {
            drawLabel(ctx, '去中心价格网', cx, cy + 4, '#34d399', 12, 'center', true);
          }

          drawSparkline(
            ctx,
            W * 0.56,
            H * 0.22,
            W * 0.36,
            H * 0.42,
            [{ data: S.errorHist, color: S.central ? '#ef4444' : '#10b981', label: '资源错配误差' }],
            true
          );

          drawToggleButton(ctx, W * 0.25, H * 0.8, 160, 34, '分散价格体系', !S.central, '#059669', true);
          drawToggleButton(ctx, W * 0.53, H * 0.8, 160, 34, '单一中央计划', S.central, '#dc2626', true);
          drawTinyHint(ctx, W, H, '切换「分散价格」与「中央计划」，对比信息延迟导致的资源错配曲线', true);
        }
      }
    };
  }

  // =========================================================================
  // #93 弗里德曼 · 货币主义 (Money Faucet + MV=PQ Glass Vessel + Inflation Mercury)
  // =========================================================================
  if (modelId === 93) {
    let S: any = {};
    return {
      1: {
        init() {
          S = { money: 0.35, drag: false, priceLevel: 100, output: 100, t: 0, drops: [] as any[] };
        },
        down(x, y, { W, H }) {
          if (hitSlider(x, y, W * 0.18, H * 0.8, W * 0.64)) {
            S.drag = true;
            S.money = clamp((x - W * 0.18) / (W * 0.64), 0.1, 1);
          }
        },
        move(x, _y, _dx, _dy, { W }) {
          if (S.drag) S.money = clamp((x - W * 0.18) / (W * 0.64), 0.1, 1);
        },
        up() {
          S.drag = false;
        },
        tick({ ctx, W, H, dt, hit }) {
          S.t += dt;
          drawPaperBg(ctx, W, H, false);
          // M*V = P*Q -> Q hits capacity ceiling ~115, extra M spills purely into P (inflation)!
          const targetQ = 85 + Math.min(S.money, 0.45) * 65;
          const targetP = 70 + S.money * 185;
          S.output = lerp(S.output, targetQ, dt * 2.5);
          S.priceLevel = lerp(S.priceLevel, targetP, dt * 1.8);

          if (S.money > 0.72) hit(1, 0, '货币超发突破实际产能上限，直接转化为物价飙升');
          if (S.money >= 0.3 && S.money <= 0.45) hit(1, 1, '稳定温和的货币供给维持价格平稳');

          // Faucet on left pouring gold coins into Economy Vessel
          const vx = W * 0.36;
          const vy = H * 0.64;
          const vw = 130;
          const vh = 140;
          ctx.fillStyle = '#475569';
          ctx.fillRect(vx - 70, vy - vh - 46, 70, 14);
          ctx.fillRect(vx - 8, vy - vh - 46, 16, 26);

          if (Math.random() < S.money * 0.65) {
            S.drops.push({ x: vx + (Math.random() - 0.5) * 14, y: vy - vh - 20, vy: 110 });
          }
          S.drops.forEach((d: any) => {
            d.y += d.vy * dt;
            drawCoin(ctx, d.x, d.y, 5.5, 'M');
          });
          S.drops = S.drops.filter((d: any) => d.y < vy - 14);

          // Vessel (real capacity Q)
          const qFill = clamp((S.output - 60) / 70, 0.1, 1);
          ctx.fillStyle = 'rgba(14, 165, 233, 0.35)';
          ctx.fillRect(vx - vw / 2, vy - qFill * vh, vw, qFill * vh);
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 2.5;
          ctx.strokeRect(vx - vw / 2, vy - vh, vw, vh);
          drawLabel(ctx, '实际产出 Q', vx, vy + 20, '#0369a1', 12, 'center', true);
          drawMonoNum(ctx, `Q = ${Math.round(S.output)}`, vx, vy - qFill * vh / 2, '#0c4a6e', 14, 'center');

          // Right: Inflation Thermometer (Price Level P)
          const tx = W * 0.7;
          const pNorm = clamp((S.priceLevel - 70) / 190, 0.05, 1);
          ctx.fillStyle = '#e2e8f0';
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(tx - 16, vy - vh, 32, vh, 16);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = pNorm > 0.6 ? '#dc2626' : '#f59e0b';
          ctx.beginPath();
          ctx.roundRect(tx - 11, vy - pNorm * vh, 22, pNorm * vh, 11);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(tx, vy + 4, 22, 0, Math.PI * 2);
          ctx.fill();
          drawLabel(ctx, '物价指数 CPI', tx, vy - vh - 14, '#991b1b', 12, 'center', true);
          drawMonoNum(ctx, `${Math.round(S.priceLevel)}`, tx, vy + 9, '#fff', 12, 'center');

          drawMonoNum(ctx, 'M · V = P · Q', W * 0.52, H * 0.1, '#0f172a', 16, 'center');
          drawCompactSlider(ctx, W * 0.18, H * 0.8, W * 0.64, S.money, '央行货币供给阀门 M', `${Math.round(S.money * 200)} 亿`, '#d97706');
          drawTinyHint(ctx, W, H, '拧大货币供给阀门，观察实际产出触顶后通胀温度计直线飙升');
        }
      },
      2: {
        init() {
          S = { kRule: false, t: 0, wave: [] as number[], target: [] as number[] };
        },
        down(x, y, { W, H }) {
          if (hitBox(x, y, W * 0.24, H * 0.78, 165, 34)) S.kRule = false;
          if (hitBox(x, y, W * 0.54, H * 0.78, 165, 34)) S.kRule = true;
        },
        tick({ ctx, W, H, dt, hit }) {
          S.t += dt;
          drawPaperBg(ctx, W, H, false);
          if (!S.kRule && S.t > 1.5) hit(2, 0, '相机抉择因政策时滞反而放大经济周期波动');
          if (S.kRule) hit(2, 1, '固定 k% 货币规则平滑预期，降低周期振幅');

          const val = S.kRule ? 0.52 + Math.sin(S.t * 2) * 0.08 : 0.5 + Math.sin(S.t * 3.4) * 0.36;
          if (Math.floor(S.t * 18) !== Math.floor((S.t - dt) * 18)) {
            S.wave.push(val);
            S.target.push(0.52);
            if (S.wave.length > 80) {
              S.wave.shift();
              S.target.shift();
            }
          }
          drawSparkline(ctx, W * 0.12, H * 0.16, W * 0.76, H * 0.52, [
            { data: S.target, color: '#94a3b8', label: '潜在增长线' },
            { data: S.wave, color: S.kRule ? '#059669' : '#dc2626', label: S.kRule ? '固定规则 (平稳)' : '相机微调 (时滞震荡)' }
          ]);
          drawToggleButton(ctx, W * 0.24, H * 0.78, 165, 34, '相机抉择微调', !S.kRule, '#dc2626');
          drawToggleButton(ctx, W * 0.54, H * 0.78, 165, 34, '固定 k% 增长规则', S.kRule, '#059669');
          drawTinyHint(ctx, W, H, '切换货币政策模式，对比政策时滞震荡与固定规则下的平稳周期');
        }
      }
    };
  }

  // =========================================================================
  // #95 科斯 · 交易成本 (Ranch & Wheat Field, Wandering Cows, Fence & Friction Wall)
  // =========================================================================
  if (modelId === 95) {
    let S: any = {};
    return {
      1: {
        init() {
          S = {
            rightToFarmer: true,
            fenceBuilt: false,
            friction: 0.05,
            cows: Array.from({ length: 5 }, (_, i) => ({ x: 0.25 + i * 0.04, y: 0.35 + (i % 3) * 0.12, vx: 0.06 })),
            t: 0,
            switched: false
          };
        },
        down(x, y, { W, H }) {
          if (hitBox(x, y, W * 0.15, H * 0.8, 175, 34)) {
            S.rightToFarmer = !S.rightToFarmer;
            S.switched = true;
          } else if (hitBox(x, y, W * 0.52, H * 0.8, 175, 34)) {
            S.fenceBuilt = !S.fenceBuilt;
          }
        },
        tick({ ctx, W, H, dt, hit }) {
          S.t += dt;
          drawPaperBg(ctx, W, H, false);
          // Ranch left (0.08..0.48), Wheat right (0.48..0.92)
          ctx.fillStyle = '#dcfce7';
          ctx.fillRect(W * 0.08, H * 0.16, W * 0.4, H * 0.54);
          ctx.fillStyle = '#fef3c7';
          ctx.fillRect(W * 0.48, H * 0.16, W * 0.44, H * 0.54);

          drawLabel(ctx, '牧场主（养牛）', W * 0.28, H * 0.22, '#166534', 12, 'center', true);
          drawLabel(ctx, '农夫（麦田）', W * 0.7, H * 0.22, '#92400e', 12, 'center', true);

          // Wheat stalks
          for (let i = 0; i < 14; i++) {
            const wx = W * 0.52 + (i % 7) * 32;
            const wy = H * 0.34 + Math.floor(i / 7) * 84;
            const trampled = !S.fenceBuilt && i % 2 === 0;
            ctx.strokeStyle = trampled ? '#ca8a04' : '#eab308';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(wx, wy + 22);
            ctx.lineTo(wx + (trampled ? 14 : 0), wy);
            ctx.stroke();
          }

          // Fence in the middle if built
          if (S.fenceBuilt) {
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(W * 0.48, H * 0.18);
            ctx.lineTo(W * 0.48, H * 0.68);
            ctx.stroke();
            hit(1, 0, '修筑围栏（成本 ¥30）避免 ¥80 麦田损毁，总福利净增 ¥50');
          }
          if (S.switched && S.fenceBuilt) hit(1, 1, '零交易成本下，无论产权归谁，协商都会达成修围栏的最优配置');

          // Wandering cows (brown ovals)
          S.cows.forEach((c: any) => {
            c.x += c.vx * dt;
            const maxX = S.fenceBuilt ? 0.44 : 0.82;
            if (c.x > maxX) c.vx = -Math.abs(c.vx);
            if (c.x < 0.12) c.vx = Math.abs(c.vx);
            const cx = c.x * W;
            const cy = c.y * H;
            ctx.fillStyle = '#78350f';
            ctx.beginPath();
            ctx.ellipse(cx, cy, 13, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(cx + (c.vx > 0 ? 10 : -10), cy - 3, 4, 0, Math.PI * 2);
            ctx.fill();
          });

          const totalWelfare = S.fenceBuilt ? 170 : 120;
          drawMonoNum(
            ctx,
            `产权归属: ${S.rightToFarmer ? '农夫(免受侵扰)' : '牧场主(自由放牧)'}  |  社会总产值: ¥${totalWelfare}`,
            W * 0.5,
            H * 0.1,
            S.fenceBuilt ? '#059669' : '#d97706',
            13,
            'center'
          );

          drawToggleButton(ctx, W * 0.15, H * 0.8, 175, 34, S.rightToFarmer ? '产权: 归农夫' : '产权: 归牧场主', true, '#2563eb');
          drawToggleButton(ctx, W * 0.52, H * 0.8, 175, 34, S.fenceBuilt ? '已协商筑篱笆 ✓' : '协商出资筑篱笆 (¥30)', S.fenceBuilt, '#059669');
          drawTinyHint(ctx, W, H, '切换初始产权归属并点击协商筑篱笆，验证零交易成本下的科斯定理');
        }
      },
      2: {
        init() {
          S = { friction: 0.15, drag: false, t: 0 };
        },
        down(x, y, { W, H }) {
          if (hitSlider(x, y, W * 0.2, H * 0.78, W * 0.6)) {
            S.drag = true;
            S.friction = clamp((x - W * 0.2) / (W * 0.6), 0, 1);
          }
        },
        move(x, _y, _dx, _dy, { W }) {
          if (S.drag) S.friction = clamp((x - W * 0.2) / (W * 0.6), 0, 1);
        },
        up() {
          S.drag = false;
        },
        tick({ ctx, W, H, dt, hit }) {
          S.t += dt;
          drawPaperBg(ctx, W, H, false);
          const cost = Math.round(S.friction * 100);
          const dealSuccess = cost < 50; // Surplus is 50
          if (!dealSuccess) hit(2, 0, '交易成本吞噬了合作剩余，市场协商破裂！');
          if (dealSuccess && cost < 25) hit(2, 1, '低摩擦制度下，自愿交易得以顺利成交');

          // Two trading parties + Red Friction Wall growing in between
          ctx.fillStyle = '#0284c7';
          ctx.beginPath();
          ctx.arc(W * 0.24, H * 0.44, 34, 0, Math.PI * 2);
          ctx.fill();
          drawLabel(ctx, '买方', W * 0.24, H * 0.44 + 4, '#fff', 13, 'center', true);

          ctx.fillStyle = '#059669';
          ctx.beginPath();
          ctx.arc(W * 0.76, H * 0.44, 34, 0, Math.PI * 2);
          ctx.fill();
          drawLabel(ctx, '卖方', W * 0.76, H * 0.44 + 4, '#fff', 13, 'center', true);

          // Friction wall in center
          const wallH = 20 + S.friction * 150;
          ctx.fillStyle = dealSuccess ? 'rgba(245,158,11,0.5)' : 'rgba(220,38,38,0.82)';
          ctx.fillRect(W * 0.5 - 16, H * 0.44 - wallH / 2, 32, wallH);
          drawMonoNum(ctx, `摩擦 ¥${cost}`, W * 0.5, H * 0.44 - wallH / 2 - 10, '#dc2626', 12, 'center');

          // Coin flying over or bouncing off wall
          const prog = (S.t * 0.65) % 1;
          if (dealSuccess) {
            const cx = lerp(W * 0.29, W * 0.71, prog);
            const cy = H * 0.44 - Math.sin(prog * Math.PI) * 65;
            drawCoin(ctx, cx, cy, 9, '¥');
          } else {
            const bounce = prog < 0.5 ? prog * 2 : (1 - prog) * 2;
            const cx = lerp(W * 0.29, W * 0.46, bounce);
            drawCoin(ctx, cx, H * 0.44, 9, '✕');
          }

          drawMonoNum(ctx, dealSuccess ? '剩余 ¥50 > 交易成本 · 交易达成 ✓' : '交易成本过高 · 交易流产 ✕', W * 0.5, H * 0.12, dealSuccess ? '#059669' : '#dc2626', 14, 'center');
          drawCompactSlider(ctx, W * 0.2, H * 0.78, W * 0.6, S.friction, '谈判与签约交易成本', `¥${cost}`, '#dc2626');
          drawTinyHint(ctx, W, H, '拖动交易成本滑块，看摩擦高墙如何阻断原本双赢的交易');
        }
      }
    };
  }

  // =========================================================================
  // #98 塞勒 · 助推理论 (30 Walking Citizens Splitting at Opt-In vs Opt-Out Gate)
  // =========================================================================
  if (modelId === 98) {
    let S: any = {};
    return {
      1: {
        init() {
          S = {
            optOut: false,
            agents: Array.from({ length: 28 }, (_, i) => ({
              x: -i * 0.045,
              y: 0.46 + (Math.random() - 0.5) * 0.14,
              choice: 0, // 0 undecided, 1 enroll, -1 skip
              effort: Math.random()
            })),
            enrolled: 0,
            total: 0,
            t: 0
          };
        },
        down(x, y, { W, H }) {
          if (hitBox(x, y, W * 0.22, H * 0.8, 175, 34)) {
            S.optOut = false;
            S.enrolled = 0;
            S.total = 0;
          } else if (hitBox(x, y, W * 0.52, H * 0.8, 175, 34)) {
            S.optOut = true;
            S.enrolled = 0;
            S.total = 0;
          }
        },
        tick({ ctx, W, H, dt, hit }) {
          S.t += dt;
          drawPaperBg(ctx, W, H, false);

          // Forked walkway: Left entrance -> Gate at x=0.45 -> Top (Enrolled) vs Bottom (Skipped)
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 34;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(W * 0.08, H * 0.46);
          ctx.lineTo(W * 0.45, H * 0.46);
          ctx.lineTo(W * 0.88, H * 0.26);
          ctx.moveTo(W * 0.45, H * 0.46);
          ctx.lineTo(W * 0.88, H * 0.66);
          ctx.stroke();

          // Default Green Rail guides passive walkers!
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 4;
          ctx.setLineDash([7, 5]);
          ctx.beginPath();
          ctx.moveTo(W * 0.45, H * 0.46);
          ctx.lineTo(W * 0.88, S.optOut ? H * 0.26 : H * 0.66);
          ctx.stroke();
          ctx.setLineDash([]);

          drawLabel(ctx, '参与养老储蓄 / 捐献 ✓', W * 0.86, H * 0.18, '#059669', 12, 'right', true);
          drawLabel(ctx, '未参与', W * 0.86, H * 0.74, '#64748b', 12, 'right', true);

          S.agents.forEach((a: any) => {
            a.x += dt * 0.24;
            if (a.x > 0.92) {
              a.x = 0.06;
              a.choice = 0;
              a.effort = Math.random();
            }
            if (a.x >= 0.45 && a.choice === 0) {
              // 82% stick to default; only 18% actively switch!
              const enroll = S.optOut ? a.effort < 0.84 : a.effort < 0.2;
              a.choice = enroll ? 1 : -1;
              S.total++;
              if (enroll) S.enrolled++;
              if (!S.optOut && S.total >= 6) hit(1, 0, '默认不参与时，多数人因现状偏差停留在未参与轨道');
              if (S.optOut && S.total >= 6) hit(1, 1, '保留退出自由，仅切换默认轨道即大幅提升参与率！');
            }
            let drawY = H * 0.46;
            if (a.x > 0.45) {
              const p = clamp((a.x - 0.45) / 0.45, 0, 1);
              drawY = lerp(H * 0.46, a.choice === 1 ? H * 0.26 : H * 0.66, p);
            }
            if (a.x > 0.06) {
              ctx.fillStyle = a.choice === 1 ? '#059669' : a.choice === -1 ? '#64748b' : '#2563eb';
              ctx.beginPath();
              ctx.arc(a.x * W, drawY + Math.sin(S.t * 8 + a.effort * 10) * 3, 6.5, 0, Math.PI * 2);
              ctx.fill();
            }
          });

          const rate = S.total > 0 ? Math.round((S.enrolled / S.total) * 100) : S.optOut ? 84 : 20;
          drawMonoNum(ctx, `当前参与率: ${rate}%`, W * 0.5, H * 0.1, S.optOut ? '#059669' : '#d97706', 17, 'center');

          drawToggleButton(ctx, W * 0.22, H * 0.8, 175, 34, '默认不参与 (Opt-In)', !S.optOut, '#64748b');
          drawToggleButton(ctx, W * 0.52, H * 0.8, 175, 34, '默认自动加入 (Opt-Out)', S.optOut, '#059669');
          drawTinyHint(ctx, W, H, '切换默认轨道（仍完全保留自由退出权），观察人群分流比例剧变');
        }
      },
      2: {
        init() {
          S = { eyeLevelFruit: false, t: 0, healthyCount: 0, junkCount: 0 };
        },
        down(x, y, { W, H }) {
          if (hitBox(x, y, W * 0.34, H * 0.79, 210, 34)) {
            S.eyeLevelFruit = !S.eyeLevelFruit;
          }
        },
        tick({ ctx, W, H, dt, hit }) {
          S.t += dt;
          drawPaperBg(ctx, W, H, false);
          if (S.eyeLevelFruit) hit(2, 0, '将健康食物摆在视线齐平层，不禁止甜点也能温柔助推');
          else hit(2, 1, '选择架构无处不在：无意摆放也在塑造人们的选择');

          // Cafeteria 3-tier shelf
          const sx = W * 0.22;
          const sw = W * 0.56;
          [0, 1, 2].forEach((tier) => {
            const ty = H * 0.22 + tier * 76;
            const isEye = tier === 1;
            ctx.fillStyle = isEye ? 'rgba(16,185,129,0.12)' : 'rgba(148,163,184,0.1)';
            ctx.fillRect(sx, ty, sw, 56);
            ctx.strokeStyle = isEye ? '#10b981' : '#94a3b8';
            ctx.lineWidth = isEye ? 2.4 : 1.4;
            ctx.strokeRect(sx, ty, sw, 56);
            if (isEye) drawLabel(ctx, '视线黄金层 →', sx - 10, ty + 32, '#059669', 11, 'right', true);

            const isFruit = (S.eyeLevelFruit && tier === 1) || (!S.eyeLevelFruit && tier === 2);
            for (let k = 0; k < 6; k++) {
              ctx.fillStyle = isFruit ? '#10b981' : tier === 0 ? '#64748b' : '#f43f5e';
              ctx.beginPath();
              ctx.arc(sx + 48 + k * ((sw - 96) / 5), ty + 28, 12, 0, Math.PI * 2);
              ctx.fill();
            }
            drawLabel(ctx, isFruit ? '新鲜水果' : tier === 0 ? '常规主食' : '高糖甜点', sx + sw + 10, ty + 32, '#334155', 11, 'left', true);
          });

          drawMonoNum(
            ctx,
            `水果选取率: ${S.eyeLevelFruit ? '68%' : '26%'}  |  甜点自由度: 100% 保留`,
            W * 0.5,
            H * 0.12,
            S.eyeLevelFruit ? '#059669' : '#d97706',
            14,
            'center'
          );
          drawToggleButton(ctx, W * 0.34, H * 0.79, 210, 34, S.eyeLevelFruit ? '还原随机摆放' : '将水果移至视线齐平层', S.eyeLevelFruit, '#059669');
          drawTinyHint(ctx, W, H, '点击重构餐厅货架视线层级，观察健康选择率上升而不剥夺任何选项');
        }
      }
    };
  }

  // =========================================================================
  // #99 赫伯特·西蒙 · 有限理性 (40-Needle Haystack: Optimizer Exhaustion vs Satisficer)
  // =========================================================================
  if (modelId === 99) {
    let S: any = {};
    return {
      1: {
        init() {
          S = {
            mode: 'satisfice', // 'optimize' | 'satisfice'
            threshold: 0.78,
            items: Array.from({ length: 36 }, (_, i) => ({
              x: 0.12 + (i % 9) * 0.095,
              y: 0.24 + Math.floor(i / 9) * 0.12,
              val: Math.round((0.35 + Math.random() * 0.63) * 100) / 100,
              checked: false
            })),
            idx: 0,
            bestVal: 0,
            bestIdx: -1,
            energy: 1.0,
            done: false,
            timer: 0,
            triedOpt: false,
            triedSat: false
          };
        },
        down(x, y, { W, H }) {
          const restart = (mode: string) => {
            S.mode = mode;
            S.idx = 0;
            S.bestVal = 0;
            S.bestIdx = -1;
            S.energy = 1.0;
            S.done = false;
            S.items.forEach((it: any) => {
              it.checked = false;
              it.val = Math.round((0.35 + Math.random() * 0.63) * 100) / 100;
            });
          };
          if (hitBox(x, y, W * 0.2, H * 0.8, 175, 34)) restart('optimize');
          if (hitBox(x, y, W * 0.52, H * 0.8, 175, 34)) restart('satisfice');
        },
        tick({ ctx, W, H, dt, hit }) {
          drawPaperBg(ctx, W, H, false);
          S.timer += dt;
          if (!S.done && S.timer > 0.12) {
            S.timer = 0;
            if (S.idx < S.items.length && S.energy > 0.02) {
              const it = S.items[S.idx];
              it.checked = true;
              S.energy = clamp(S.energy - 0.045, 0, 1);
              if (it.val > S.bestVal) {
                S.bestVal = it.val;
                S.bestIdx = S.idx;
              }
              if (S.mode === 'satisfice' && it.val >= S.threshold) {
                S.done = true;
                S.triedSat = true;
                hit(1, 0, '满意化策略在耗尽算力前快速锁定「足够好」的方案');
              }
              S.idx++;
            } else {
              S.done = true;
              if (S.mode === 'optimize') {
                S.triedOpt = true;
                hit(1, 1, '全局最优化试图穷举所有选项，导致认知算力耗尽！');
              }
            }
          }

          // Draw 36 option tiles in haystack
          S.items.forEach((it: any, i: number) => {
            const ix = it.x * W;
            const iy = it.y * H;
            const isBest = i === S.bestIdx;
            ctx.fillStyle = isBest ? '#059669' : it.checked ? '#cbd5e1' : '#f1f5f9';
            ctx.strokeStyle = isBest ? '#065f46' : it.checked ? '#64748b' : '#94a3b8';
            ctx.lineWidth = isBest ? 2.5 : 1.2;
            ctx.beginPath();
            ctx.roundRect(ix - 20, iy - 16, 40, 32, 6);
            ctx.fill();
            ctx.stroke();
            if (it.checked) {
              drawMonoNum(ctx, `${Math.round(it.val * 100)}`, ix, iy + 5, isBest ? '#fff' : '#334155', 11, 'center');
            } else {
              drawLabel(ctx, '?', ix, iy + 5, '#94a3b8', 12, 'center', true);
            }
          });

          // Cognitive Energy Bar
          const ex = W * 0.14;
          const ew = W * 0.72;
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(ex, H * 0.71, ew, 12);
          ctx.fillStyle = S.energy > 0.3 ? '#0284c7' : '#dc2626';
          ctx.fillRect(ex, H * 0.71, ew * S.energy, 12);
          drawMonoNum(ctx, `认知精力剩余: ${Math.round(S.energy * 100)}%`, W * 0.5, H * 0.69, '#334155', 11.5, 'center');

          drawMonoNum(
            ctx,
            `已检选项: ${S.idx}/36  |  锁定分值: ${Math.round(S.bestVal * 100)}  |  满意阈值: 78`,
            W * 0.5,
            H * 0.1,
            '#0f172a',
            13,
            'center'
          );

          drawToggleButton(ctx, W * 0.2, H * 0.8, 175, 34, '全局最优化 (穷举)', S.mode === 'optimize', '#dc2626');
          drawToggleButton(ctx, W * 0.52, H * 0.8, 175, 34, '满意化决策 (≥78即停)', S.mode === 'satisfice', '#059669');
          drawTinyHint(ctx, W, H, '切换「全局最优化」与「满意化决策」，对比草堆寻针的精力消耗');
        }
      },
      2: {
        init() {
          S = { aspiration: 0.75, drag: false, t: 0 };
        },
        down(x, y, { W, H }) {
          if (hitSlider(x, y, W * 0.2, H * 0.78, W * 0.6)) {
            S.drag = true;
            S.aspiration = 0.4 + clamp((x - W * 0.2) / (W * 0.6), 0, 1) * 0.55;
          }
        },
        move(x, _y, _dx, _dy, { W }) {
          if (S.drag) S.aspiration = 0.4 + clamp((x - W * 0.2) / (W * 0.6), 0, 1) * 0.55;
        },
        up() {
          S.drag = false;
        },
        tick({ ctx, W, H, dt, hit }) {
          S.t += dt;
          drawPaperBg(ctx, W, H, false);
          if (S.aspiration > 0.88) hit(2, 0, '过高的期望阈值会导致无限搜索与决策瘫痪');
          if (S.aspiration >= 0.65 && S.aspiration <= 0.8) hit(2, 1, '动态校准的期望水平平衡了收益与搜寻成本');

          // Scissors of Bounded Rationality: Cognition Blade vs Environment Blade
          const cx = W * 0.5;
          const cy = H * 0.43;
          const angle = 0.22 + (S.aspiration - 0.4) * 0.9;
          ctx.save();
          ctx.translate(cx, cy);
          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = 8;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(-120, Math.sin(-angle) * 70);
          ctx.lineTo(120, Math.sin(angle) * 70);
          ctx.stroke();

          ctx.strokeStyle = '#059669';
          ctx.beginPath();
          ctx.moveTo(-120, Math.sin(angle) * 70);
          ctx.lineTo(120, Math.sin(-angle) * 70);
          ctx.stroke();

          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(0, 0, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          drawLabel(ctx, '人类有限算力', cx - 125, cy - 48, '#0284c7', 12, 'right', true);
          drawLabel(ctx, '复杂任务环境', cx + 125, cy - 48, '#059669', 12, 'left', true);

          const expectedTime = Math.round(1 / Math.max(0.04, 1 - S.aspiration));
          drawMonoNum(ctx, `期望搜索步数: ${expectedTime} 步`, cx, H * 0.14, expectedTime > 12 ? '#dc2626' : '#059669', 15, 'center');
          drawCompactSlider(ctx, W * 0.2, H * 0.78, W * 0.6, (S.aspiration - 0.4) / 0.55, '满意期望阈值', `${Math.round(S.aspiration * 100)} 分`, '#0284c7');
          drawTinyHint(ctx, W, H, '调节满意阈值，体会西蒙「认知与环境两片剪刀」下的搜索时间暴涨');
        }
      }
    };
  }

  // =========================================================================
  // #100 托宾 · 投资组合选择 (Oscillating Wave Cancellation + Efficient Frontier Arc)
  // =========================================================================
  if (modelId === 100) {
    let S: any = {};
    return {
      1: {
        init() {
          S = { weightA: 0.5, corr: -0.6, drag: 0, t: 0 };
        },
        down(x, y, { W, H }) {
          if (hitSlider(x, y, W * 0.1, H * 0.78, W * 0.36)) {
            S.drag = 1;
            S.weightA = clamp((x - W * 0.1) / (W * 0.36), 0, 1);
          } else if (hitSlider(x, y, W * 0.54, H * 0.78, W * 0.36)) {
            S.drag = 2;
            S.corr = -1 + clamp((x - W * 0.54) / (W * 0.36), 0, 1) * 2;
          }
        },
        move(x, _y, _dx, _dy, { W }) {
          if (S.drag === 1) S.weightA = clamp((x - W * 0.1) / (W * 0.36), 0, 1);
          if (S.drag === 2) S.corr = -1 + clamp((x - W * 0.54) / (W * 0.36), 0, 1) * 2;
        },
        up() {
          S.drag = 0;
        },
        tick({ ctx, W, H, dt, hit }) {
          S.t += dt;
          drawPaperBg(ctx, W, H, true);
          const wA = S.weightA;
          const wB = 1 - wA;
          // Portfolio volatility sqrt(wA^2 + wB^2 + 2*wA*wB*corr)
          const vol = Math.sqrt(wA * wA + wB * wB + 2 * wA * wB * S.corr);
          if (wA > 0.25 && wA < 0.75 && S.corr < 0) hit(1, 0, '负相关资产的波动相互抵消，组合风险骤降！');
          if (S.corr > 0.85) hit(1, 1, '若资产高度正相关，分散持有也无法对冲系统性风险');

          // Live wave visualizer showing Asset A (blue), Asset B (amber), Combined Portfolio (emerald thick)
          const gx = W * 0.08;
          const gy = H * 0.18;
          const gw = W * 0.84;
          const gh = H * 0.44;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.roundRect(gx, gy, gw, gh, 10);
          ctx.fill();
          ctx.stroke();

          const phaseShift = Math.acos(clamp(S.corr, -1, 1));
          const midY = gy + gh / 2;
          const drawWave = (color: string, width: number, fn: (x01: number) => number) => {
            ctx.strokeStyle = color;
            ctx.lineWidth = width;
            ctx.beginPath();
            for (let i = 0; i <= 80; i++) {
              const u = i / 80;
              const px = gx + 14 + u * (gw - 28);
              const py = midY + fn(u) * (gh * 0.38);
              if (i === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.stroke();
          };

          drawWave('rgba(56, 189, 248, 0.5)', 1.6, (u) => Math.sin(u * 12 - S.t * 3));
          drawWave('rgba(251, 191, 36, 0.5)', 1.6, (u) => Math.sin(u * 12 - S.t * 3 + phaseShift));
          drawWave('#10b981', 3.4, (u) => wA * Math.sin(u * 12 - S.t * 3) + wB * Math.sin(u * 12 - S.t * 3 + phaseShift));

          drawLabel(ctx, '资产 A', gx + 20, gy + 20, '#38bdf8', 11, 'left', true);
          drawLabel(ctx, '资产 B', gx + 80, gy + 20, '#fbbf24', 11, 'left', true);
          drawLabel(ctx, '合成组合曲线', gx + 145, gy + 20, '#10b981', 11.5, 'left', true);

          drawMonoNum(ctx, `组合波动率 σ: ${(vol * 100).toFixed(0)}%`, W * 0.5, H * 0.1, vol < 0.55 ? '#34d399' : '#f87171', 16, 'center');

          drawCompactSlider(ctx, W * 0.1, H * 0.78, W * 0.36, S.weightA, '资产 A 权重', `${Math.round(wA * 100)}%`, '#38bdf8', true);
          drawCompactSlider(ctx, W * 0.54, H * 0.78, W * 0.36, (S.corr + 1) / 2, '相关系数 ρ', S.corr.toFixed(2), '#fbbf24', true);
          drawTinyHint(ctx, W, H, '调低相关系数 ρ 并均衡配比，看绿色合成波动几乎被拉成直线！', true);
        }
      },
      2: {
        init() {
          S = { cashShare: 0.35, drag: false };
        },
        down(x, y, { W, H }) {
          if (hitSlider(x, y, W * 0.2, H * 0.78, W * 0.6)) {
            S.drag = true;
            S.cashShare = clamp((x - W * 0.2) / (W * 0.6), 0, 1);
          }
        },
        move(x, _y, _dx, _dy, { W }) {
          if (S.drag) S.cashShare = clamp((x - W * 0.2) / (W * 0.6), 0, 1);
        },
        up() {
          S.drag = false;
        },
        tick({ ctx, W, H, hit }) {
          drawPaperBg(ctx, W, H, true);
          const gx = W * 0.16;
          const gy = H * 0.14;
          const gw = W * 0.68;
          const gh = H * 0.54;
          if (S.cashShare > 0.6) hit(2, 0, '托宾分离定理：保守投资者只需提高无风险资产比例');
          if (S.cashShare < 0.2) hit(2, 1, '激进投资者沿资本市场线拉高最优风险组合权重');

          // Axes: Risk X vs Return Y
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(gx, gy);
          ctx.lineTo(gx, gy + gh);
          ctx.lineTo(gx + gw, gy + gh);
          ctx.stroke();
          drawLabel(ctx, '期望收益 E(R)', gx + 8, gy + 10, '#cbd5e1', 11, 'left', true);
          drawLabel(ctx, '组合风险 σ', gx + gw, gy + gh + 18, '#cbd5e1', 11, 'right', true);

          // Efficient Frontier parabola
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 3;
          ctx.beginPath();
          for (let i = 0; i <= 40; i++) {
            const u = i / 40;
            const px = gx + gw * (0.28 + 0.55 * (u - 0.5) * (u - 0.5) * 4 + 0.12 * u);
            const py = gy + gh * (0.82 - u * 0.72);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();

          // Tangent line (Capital Allocation Line) from Risk-free Rf to Tangency Portfolio M
          const rfX = gx;
          const rfY = gy + gh * 0.72;
          const mX = gx + gw * 0.52;
          const mY = gy + gh * 0.24;
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.moveTo(rfX, rfY);
          ctx.lineTo(gx + gw * 0.78, gy + gh * 0.01);
          ctx.stroke();

          // Tangency M
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(mX, mY, 7, 0, Math.PI * 2);
          ctx.fill();
          drawLabel(ctx, '切点最优组合 M', mX + 12, mY + 4, '#fbbf24', 11, 'left', true);

          // User's chosen point along CAL
          const riskWeight = 1 - S.cashShare;
          const ux = lerp(rfX, mX, riskWeight);
          const uy = lerp(rfY, mY, riskWeight);
          ctx.fillStyle = '#10b981';
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(ux, uy, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          drawCompactSlider(ctx, W * 0.2, H * 0.78, W * 0.6, S.cashShare, '无风险国债/现金占比', `${Math.round(S.cashShare * 100)}%`, '#10b981', true);
          drawTinyHint(ctx, W, H, '沿金色资本配置线滑行：无需改变 M 内部结构，只需调配无风险比例', true);
        }
      }
    };
  }

  // =========================================================================
  // #101 罗伯特·索洛 · 经济增长模型 (Live sf(k) vs (δ+n)k Curves + Tech A Lift)
  // =========================================================================
  if (modelId === 101) {
    let S: any = {};
    return {
      1: {
        init() {
          S = { s: 0.35, A: 1.0, drag: 0, kCur: 0.15, t: 0 };
        },
        down(x, y, { W, H }) {
          if (hitSlider(x, y, W * 0.1, H * 0.79, W * 0.36)) {
            S.drag = 1;
            S.s = 0.12 + clamp((x - W * 0.1) / (W * 0.36), 0, 1) * 0.55;
          } else if (hitSlider(x, y, W * 0.54, H * 0.79, W * 0.36)) {
            S.drag = 2;
            S.A = 0.7 + clamp((x - W * 0.54) / (W * 0.36), 0, 1) * 1.1;
          }
        },
        move(x, _y, _dx, _dy, { W }) {
          if (S.drag === 1) S.s = 0.12 + clamp((x - W * 0.1) / (W * 0.36), 0, 1) * 0.55;
          if (S.drag === 2) S.A = 0.7 + clamp((x - W * 0.54) / (W * 0.36), 0, 1) * 1.1;
        },
        up() {
          S.drag = false;
        },
        tick({ ctx, W, H, dt, hit }) {
          S.t += dt;
          drawPaperBg(ctx, W, H, false);
          // y = A * k^0.45, dep = 0.38 * k => steady state k* = (s * A / 0.38)^(1/0.55)
          const depSlope = 0.38;
          const kStar = clamp(Math.pow((S.s * S.A) / depSlope, 1 / 0.55), 0.08, 0.96);
          S.kCur = lerp(S.kCur, kStar, dt * 1.6);

          if (S.s > 0.52) hit(1, 0, '单纯提高储蓄率只提升稳态水平，资本边际递减终将停滞');
          if (S.A > 1.45) hit(1, 1, '技术进步 A 抬升整条生产函数，打破稳态天花板！');

          const gx = W * 0.14;
          const gy = H * 0.14;
          const gw = W * 0.72;
          const gh = H * 0.52;

          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(gx, gy);
          ctx.lineTo(gx, gy + gh);
          ctx.lineTo(gx + gw, gy + gh);
          ctx.stroke();
          drawLabel(ctx, '人均产出 y', gx - 8, gy + 10, '#334155', 11, 'right', true);
          drawLabel(ctx, '人均资本 k', gx + gw, gy + gh + 18, '#334155', 11, 'right', true);

          // Output curve y = A * k^0.45
          const drawFn = (col: string, lw: number, fn: (k: number) => number) => {
            ctx.strokeStyle = col;
            ctx.lineWidth = lw;
            ctx.beginPath();
            for (let i = 0; i <= 60; i++) {
              const k = i / 60;
              const px = gx + k * gw;
              const py = gy + gh - clamp(fn(k) / 1.9, 0, 1.05) * gh;
              if (i === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.stroke();
          };
          drawFn('#0284c7', 3, (k) => S.A * Math.pow(k, 0.45));
          drawFn('#059669', 2.5, (k) => S.s * S.A * Math.pow(k, 0.45));
          drawFn('#dc2626', 2.2, (k) => depSlope * k);

          // Steady state intersection dot
          const ix = gx + S.kCur * gw;
          const iyInv = gy + gh - clamp((S.s * S.A * Math.pow(S.kCur, 0.45)) / 1.9, 0, 1) * gh;
          const iyOut = gy + gh - clamp((S.A * Math.pow(S.kCur, 0.45)) / 1.9, 0, 1) * gh;
          ctx.strokeStyle = 'rgba(15,23,42,0.35)';
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(ix, gy + gh);
          ctx.lineTo(ix, iyOut);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = '#059669';
          ctx.beginPath();
          ctx.arc(ix, iyInv, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#0284c7';
          ctx.beginPath();
          ctx.arc(ix, iyOut, 7, 0, Math.PI * 2);
          ctx.fill();

          drawLabel(ctx, '产出 A·f(k)', gx + gw - 6, gy + 16, '#0284c7', 11, 'right', true);
          drawLabel(ctx, '投资 s·A·f(k)', gx + gw - 6, gy + 32, '#059669', 11, 'right', true);
          drawLabel(ctx, '折旧 (δ+n)k', gx + gw - 6, gy + 48, '#dc2626', 11, 'right', true);

          const yStar = S.A * Math.pow(kStar, 0.45);
          drawMonoNum(ctx, `稳态人均产出 y*: ${(yStar * 100).toFixed(0)}`, W * 0.5, H * 0.09, '#0284c7', 14, 'center');

          drawCompactSlider(ctx, W * 0.1, H * 0.79, W * 0.36, (S.s - 0.12) / 0.55, '储蓄率 s', `${Math.round(S.s * 100)}%`, '#059669');
          drawCompactSlider(ctx, W * 0.54, H * 0.79, W * 0.36, (S.A - 0.7) / 1.1, '技术进步 A', `${S.A.toFixed(2)}×`, '#0284c7');
          drawTinyHint(ctx, W, H, '对比拖动「储蓄率 s」与「技术进步 A」，看稳态交点如何被彻底抬升');
        }
      },
      2: {
        init() {
          S = { s: 0.45, drag: false };
        },
        down(x, y, { W, H }) {
          if (hitSlider(x, y, W * 0.2, H * 0.78, W * 0.6)) {
            S.drag = true;
            S.s = 0.08 + clamp((x - W * 0.2) / (W * 0.6), 0, 1) * 0.84;
          }
        },
        move(x, _y, _dx, _dy, { W }) {
          if (S.drag) S.s = 0.08 + clamp((x - W * 0.2) / (W * 0.6), 0, 1) * 0.84;
        },
        up() {
          S.drag = false;
        },
        tick({ ctx, W, H, hit }) {
          drawPaperBg(ctx, W, H, false);
          // Golden Rule: consumption c* = (1 - s) * y*(s) peaks at s = alpha (0.45)!
          const yStar = (sv: number) => Math.pow(sv / 0.35, 0.45 / 0.55);
          const cStar = (sv: number) => (1 - sv) * yStar(sv);
          const curC = cStar(S.s);
          const maxC = cStar(0.45);
          if (Math.abs(S.s - 0.45) < 0.06) hit(2, 0, '黄金律储蓄率：稳态人均消费达到峰值！');
          if (S.s > 0.78) hit(2, 1, '过度储蓄导致资本积累过多，反挤压当代人消费');

          const gx = W * 0.16;
          const gy = H * 0.16;
          const gw = W * 0.68;
          const gh = H * 0.48;
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(gx, gy);
          ctx.lineTo(gx, gy + gh);
          ctx.lineTo(gx + gw, gy + gh);
          ctx.stroke();

          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 3.2;
          ctx.beginPath();
          for (let i = 1; i <= 60; i++) {
            const sv = i / 65;
            const px = gx + sv * gw;
            const py = gy + gh - clamp(cStar(sv) / (maxC * 1.15), 0, 1) * gh;
            if (i === 1) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();

          const ux = gx + S.s * gw;
          const uy = gy + gh - clamp(curC / (maxC * 1.15), 0, 1) * gh;
          ctx.fillStyle = Math.abs(S.s - 0.45) < 0.06 ? '#059669' : '#d97706';
          ctx.beginPath();
          ctx.arc(ux, uy, 9, 0, Math.PI * 2);
          ctx.fill();
          drawMonoNum(ctx, `稳态消费 c*: ${Math.round((curC / maxC) * 100)}% 峰值`, W * 0.5, H * 0.1, '#b45309', 15, 'center');

          drawCompactSlider(ctx, W * 0.2, H * 0.78, W * 0.6, (S.s - 0.08) / 0.84, '储蓄率 s (寻找黄金律峰值)', `${Math.round(S.s * 100)}%`, '#d97706');
          drawTinyHint(ctx, W, H, '拖动储蓄率寻找稳态消费曲线的黄金律峰顶，避免储蓄不足或过度');
        }
      }
    };
  }

  // =========================================================================
  // #124 孟德斯鸠 · 权力制衡 (3 Interlocking Brass Power Gears Pushing Back)
  // =========================================================================
  if (modelId === 124) {
    let S: any = {};
    return {
      1: {
        init() {
          S = { execPower: 0.35, drag: false, angle: 0, locked: false };
        },
        down(x, y, { W, H }) {
          if (hitSlider(x, y, W * 0.2, H * 0.8, W * 0.6)) {
            S.drag = true;
            S.execPower = clamp((x - W * 0.2) / (W * 0.6), 0.15, 0.95);
          }
        },
        move(x, _y, _dx, _dy, { W }) {
          if (S.drag) S.execPower = clamp((x - W * 0.2) / (W * 0.6), 0.15, 0.95);
        },
        up() {
          S.drag = false;
        },
        tick({ ctx, W, H, dt, hit }) {
          drawPaperBg(ctx, W, H, false);
          const balanced = Math.abs(S.execPower - 0.34) < 0.12;
          const speed = balanced ? 1.4 : clamp(1.4 - Math.abs(S.execPower - 0.34) * 2.2, 0.1, 1.4);
          S.angle += dt * speed;

          if (S.execPower > 0.72) hit(1, 0, '单一权力扩张触发咬合阻力，制衡齿轮卡死警报');
          if (balanced) hit(1, 1, '立法、行政、司法三权等势咬合，以权力制约权力');

          const cx = W * 0.5;
          const cy = H * 0.45;
          const rExec = 38 + S.execPower * 34;
          const rLeg = 50;
          const rJud = 50;

          // Draw 3 gears arranged in triangle
          drawGear(ctx, cx, cy - 54, rExec, 12, S.angle, S.execPower > 0.7 ? '#ef4444' : '#d97706', '#78350f');
          drawGear(ctx, cx - 68, cy + 48, rLeg, 12, -S.angle, '#2563eb', '#1e3a8a');
          drawGear(ctx, cx + 68, cy + 48, rJud, 12, -S.angle, '#059669', '#065f46');

          drawLabel(ctx, '行政权', cx, cy - 50, '#fff', 11.5, 'center', true);
          drawLabel(ctx, '立法权', cx - 68, cy + 52, '#fff', 11.5, 'center', true);
          drawLabel(ctx, '司法权', cx + 68, cy + 52, '#fff', 11.5, 'center', true);

          // Red tension sparks when exec gear invades
          if (S.execPower > 0.65) {
            ctx.strokeStyle = '#dc2626';
            ctx.lineWidth = 2.5;
            [-1, 1].forEach((side) => {
              const sx = cx + side * 36;
              const sy = cy + 6;
              ctx.beginPath();
              ctx.moveTo(sx - 8, sy - 8);
              ctx.lineTo(sx + 8, sy + 8);
              ctx.moveTo(sx + 8, sy - 8);
              ctx.lineTo(sx - 8, sy + 8);
              ctx.stroke();
            });
          }

          drawMonoNum(
            ctx,
            S.execPower > 0.68 ? '越权咬死 · 宪政警报!' : balanced ? '三权均衡运转 ✓' : '制衡张力中',
            cx,
            H * 0.09,
            S.execPower > 0.68 ? '#dc2626' : '#059669',
            15,
            'center'
          );

          drawCompactSlider(ctx, W * 0.2, H * 0.8, W * 0.6, (S.execPower - 0.15) / 0.8, '行政权扩张力度', `${Math.round(S.execPower * 100)}%`, '#d97706');
          drawTinyHint(ctx, W, H, '拖动行政权扩张滑块，观察齿轮咬合冲突与三权均衡运转');
        }
      },
      2: {
        init() {
          S = { merged: false, t: 0 };
        },
        down(x, y, { W, H }) {
          if (hitBox(x, y, W * 0.34, H * 0.78, 210, 34)) S.merged = !S.merged;
        },
        tick({ ctx, W, H, dt, hit }) {
          S.t += dt;
          drawPaperBg(ctx, W, H, false);
          if (S.merged) hit(2, 0, '若立法与司法合并于同一主体，公民自由失去缓冲屏障');
          else hit(2, 1, '三权分立维持独立否决门，保护公民免受任意专断');

          const cx = W * 0.5;
          const cy = H * 0.44;
          if (S.merged) {
            // Giant monolithic crimson gear crushing liberty meter
            drawGear(ctx, cx, cy, 82, 18, S.t * 0.8, '#dc2626', '#7f1d1d');
            drawLabel(ctx, '合一绝对权力', cx, cy + 4, '#fff', 14, 'center', true);
            drawMonoNum(ctx, '公民自由保障度: 12%', cx, H * 0.11, '#dc2626', 16, 'center');
          } else {
            drawGear(ctx, cx - 95, cy, 44, 10, S.t * 1.4, '#2563eb', '#1e3a8a');
            drawGear(ctx, cx, cy, 44, 10, -S.t * 1.4, '#d97706', '#78350f');
            drawGear(ctx, cx + 95, cy, 44, 10, S.t * 1.4, '#059669', '#065f46');
            drawLabel(ctx, '立法', cx - 95, cy + 4, '#fff', 12, 'center', true);
            drawLabel(ctx, '行政', cx, cy + 4, '#fff', 12, 'center', true);
            drawLabel(ctx, '司法', cx + 95, cy + 4, '#fff', 12, 'center', true);
            drawMonoNum(ctx, '公民自由保障度: 92%', cx, H * 0.11, '#059669', 16, 'center');
          }
          drawToggleButton(ctx, W * 0.34, H * 0.78, 210, 34, S.merged ? '恢复三权分立' : '合并权力观察后果', S.merged, '#dc2626');
          drawTinyHint(ctx, W, H, '点击切换权力合并与分立状态，直观对比公民自由保障度');
        }
      }
    };
  }

  // =========================================================================
  // #126 唐斯 · 中位选民定理 (80 Voter Dots Dynamically Recoloring as Candidate Flags Drag)
  // =========================================================================
  if (modelId === 126) {
    let S: any = {};
    return {
      1: {
        init() {
          // Gaussian-like bell distribution of 75 voters on [0.08, 0.92]
          const voters: { x: number; yOff: number }[] = [];
          for (let i = 0; i < 75; i++) {
            const u = (Math.random() + Math.random() + Math.random()) / 3;
            const x = clamp(0.08 + u * 0.84, 0.08, 0.92);
            voters.push({ x, yOff: Math.random() });
          }
          S = { voters, posA: 0.22, posB: 0.78, drag: 0 };
        },
        down(x, y, { W, H }) {
          const ax = S.posA * W;
          const bx = S.posB * W;
          if (Math.hypot(x - ax, y - H * 0.64) < 34) S.drag = 1;
          else if (Math.hypot(x - bx, y - H * 0.64) < 34) S.drag = 2;
        },
        move(x, _y, _dx, _dy, { W }) {
          if (S.drag === 1) S.posA = clamp(x / W, 0.1, 0.9);
          if (S.drag === 2) S.posB = clamp(x / W, 0.1, 0.9);
        },
        up() {
          S.drag = 0;
        },
        tick({ ctx, W, H, hit }) {
          drawPaperBg(ctx, W, H, false);
          const baseY = H * 0.64;

          // Count votes & draw voter dots
          let votesA = 0;
          let votesB = 0;
          S.voters.forEach((v: any) => {
            const dA = Math.abs(v.x - S.posA);
            const dB = Math.abs(v.x - S.posB);
            const winA = dA < dB;
            if (winA) votesA++;
            else votesB++;
            // Bell height visual cue
            const bell = Math.exp(-Math.pow((v.x - 0.5) / 0.19, 2));
            const vy = baseY - 16 - v.yOff * bell * H * 0.36;
            ctx.fillStyle = winA ? '#2563eb' : '#ef4444';
            ctx.beginPath();
            ctx.arc(v.x * W, vy, 5.5, 0, Math.PI * 2);
            ctx.fill();
          });

          // Axis & Median line
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(W * 0.08, baseY);
          ctx.lineTo(W * 0.92, baseY);
          ctx.stroke();

          ctx.strokeStyle = '#059669';
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(W * 0.5, H * 0.2);
          ctx.lineTo(W * 0.5, baseY + 14);
          ctx.stroke();
          ctx.setLineDash([]);
          drawLabel(ctx, '中位选民 M', W * 0.5, H * 0.18, '#059669', 11.5, 'center', true);

          // Draw draggable Candidate Flags A & B
          const drawFlag = (pos: number, col: string, name: string) => {
            const fx = pos * W;
            ctx.strokeStyle = col;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(fx, baseY);
            ctx.lineTo(fx, baseY + 38);
            ctx.stroke();
            ctx.fillStyle = col;
            ctx.beginPath();
            ctx.arc(fx, baseY, 13, 0, Math.PI * 2);
            ctx.fill();
            drawLabel(ctx, name, fx, baseY + 4, '#fff', 11, 'center', true);
          };
          drawFlag(S.posA, '#2563eb', 'A');
          drawFlag(S.posB, '#ef4444', 'B');

          if (Math.abs(S.posA - 0.5) < 0.08 || Math.abs(S.posB - 0.5) < 0.08) {
            hit(1, 0, '向中位选民靠拢能瞬间吞并大批中间选票');
          }
          if (Math.abs(S.posA - 0.5) < 0.08 && Math.abs(S.posB - 0.5) < 0.08) {
            hit(1, 1, '两党最终在中位选民处趋同，达成纳什均衡！');
          }

          drawMonoNum(ctx, `候选人 A: ${votesA} 票`, W * 0.28, H * 0.1, '#2563eb', 15, 'center');
          drawMonoNum(ctx, `候选人 B: ${votesB} 票`, W * 0.72, H * 0.1, '#ef4444', 15, 'center');
          drawTinyHint(ctx, W, H, '左右拖动蓝/红候选人圆钮，看谁抢占「中位选民」就能锁定胜局');
        }
      },
      2: {
        init() {
          S = { polar: 0.15, drag: false };
        },
        down(x, y, { W, H }) {
          if (hitSlider(x, y, W * 0.2, H * 0.78, W * 0.6)) {
            S.drag = true;
            S.polar = clamp((x - W * 0.2) / (W * 0.6), 0, 1);
          }
        },
        move(x, _y, _dx, _dy, { W }) {
          if (S.drag) S.polar = clamp((x - W * 0.2) / (W * 0.6), 0, 1);
        },
        up() {
          S.drag = false;
        },
        tick({ ctx, W, H, hit }) {
          drawPaperBg(ctx, W, H, false);
          if (S.polar > 0.7) hit(2, 0, '双峰极化分布撕裂中间地带，趋中不再是唯一策略');
          if (S.polar < 0.25) hit(2, 1, '单峰温和分布驱动温和中间路线');

          // Draw density curve morphing from unimodal to bimodal
          const gx = W * 0.12;
          const gw = W * 0.76;
          const by = H * 0.62;
          const peakH = H * 0.38;
          ctx.fillStyle = 'rgba(37, 99, 235, 0.18)';
          ctx.strokeStyle = '#2563eb';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(gx, by);
          for (let i = 0; i <= 80; i++) {
            const u = i / 80;
            const sep = S.polar * 0.26;
            const d1 = Math.exp(-Math.pow((u - (0.5 - sep)) / 0.12, 2));
            const d2 = Math.exp(-Math.pow((u - (0.5 + sep)) / 0.12, 2));
            const dens = (d1 + d2) * 0.55;
            ctx.lineTo(gx + u * gw, by - dens * peakH);
          }
          ctx.lineTo(gx + gw, by);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Candidate equilibrium markers splitting apart with polarization
          const sep = S.polar * 0.22;
          ctx.fillStyle = '#2563eb';
          ctx.beginPath();
          ctx.arc(gx + (0.5 - sep) * gw, by, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(gx + (0.5 + sep) * gw, by, 10, 0, Math.PI * 2);
          ctx.fill();

          drawMonoNum(ctx, S.polar > 0.65 ? '双峰极化 · 政纲撕裂' : '单峰集中 · 向中位收敛', W * 0.5, H * 0.12, S.polar > 0.65 ? '#dc2626' : '#059669', 15, 'center');
          drawCompactSlider(ctx, W * 0.2, H * 0.78, W * 0.6, S.polar, '选民意识形态极化度', `${Math.round(S.polar * 100)}%`, '#7c3aed');
          drawTinyHint(ctx, W, H, '拉高选民极化度，观察单峰分裂为双峰并拉开两党政策间距');
        }
      }
    };
  }

  // =========================================================================
  // #127 约瑟夫·奈 · 软实力与巧实力 (Diplomatic Orbit: Red Coercion vs Gold Attraction)
  // =========================================================================
  if (modelId === 127) {
    let S: any = {};
    return {
      1: {
        init() {
          S = {
            hard: 0.65,
            soft: 0.25,
            drag: 0,
            satellites: Array.from({ length: 8 }, (_, i) => ({ ang: (i / 8) * Math.PI * 2, dist: 120 })),
            t: 0
          };
        },
        down(x, y, { W, H }) {
          if (hitSlider(x, y, W * 0.1, H * 0.79, W * 0.36)) {
            S.drag = 1;
            S.hard = clamp((x - W * 0.1) / (W * 0.36), 0, 1);
          } else if (hitSlider(x, y, W * 0.54, H * 0.79, W * 0.36)) {
            S.drag = 2;
            S.soft = clamp((x - W * 0.54) / (W * 0.36), 0, 1);
          }
        },
        move(x, _y, _dx, _dy, { W }) {
          if (S.drag === 1) S.hard = clamp((x - W * 0.1) / (W * 0.36), 0, 1);
          if (S.drag === 2) S.soft = clamp((x - W * 0.54) / (W * 0.36), 0, 1);
        },
        up() {
          S.drag = 0;
        },
        tick({ ctx, W, H, dt, hit }) {
          S.t += dt;
          drawPaperBg(ctx, W, H, true);
          const cx = W * 0.5;
          const cy = H * 0.42;

          // Soft power pulls satellites closer in harmony; excessive hard power causes repulsion friction!
          const targetDist = clamp(145 - S.soft * 68 + S.hard * 42, 62, 165);
          const allyScore = Math.round(clamp((S.soft * 85 + (1 - S.hard) * 25 + Math.min(S.hard, S.soft) * 20), 5, 100));

          if (S.soft > 0.72) hit(1, 0, '软实力通过文化与制度吸引力令周边主动靠拢');
          if (S.hard > 0.75 && S.soft < 0.35) hit(1, 1, '纯硬实力威慑引发排斥波纹与高昂维稳成本');

          // Attraction golden rings vs coercion red shockwaves
          for (let k = 0; k < 3; k++) {
            const p = (S.t * 0.6 + k * 0.33) % 1;
            if (S.soft > 0.25) {
              ctx.strokeStyle = `rgba(250, 204, 21, ${(1 - p) * S.soft * 0.7})`;
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(cx, cy, 150 * (1 - p) + 25, 0, Math.PI * 2);
              ctx.stroke();
            }
            if (S.hard > 0.4) {
              ctx.strokeStyle = `rgba(239, 68, 68, ${(1 - p) * S.hard * 0.65})`;
              ctx.lineWidth = 2.2;
              ctx.beginPath();
              ctx.arc(cx, cy, 30 + p * 135, 0, Math.PI * 2);
              ctx.stroke();
            }
          }

          // Orbiting partner nations
          S.satellites.forEach((sat: any) => {
            sat.ang += dt * (0.45 + S.soft * 0.4);
            sat.dist = lerp(sat.dist, targetDist, dt * 2.5);
            const sx = cx + Math.cos(sat.ang) * sat.dist;
            const sy = cy + Math.sin(sat.ang) * sat.dist * 0.72;
            ctx.fillStyle = sat.dist < 105 ? '#34d399' : '#94a3b8';
            ctx.beginPath();
            ctx.arc(sx, sy, 9, 0, Math.PI * 2);
            ctx.fill();
          });

          // Center hub
          ctx.fillStyle = '#0284c7';
          ctx.strokeStyle = '#fde047';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(cx, cy, 28, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          drawLabel(ctx, '核心节点', cx, cy + 4, '#fff', 10.5, 'center', true);

          drawMonoNum(ctx, `同盟凝聚力: ${allyScore}%`, cx, H * 0.09, allyScore > 70 ? '#34d399' : '#f87171', 15, 'center');
          drawCompactSlider(ctx, W * 0.1, H * 0.79, W * 0.36, S.hard, '硬实力威慑', `${Math.round(S.hard * 100)}%`, '#ef4444', true);
          drawCompactSlider(ctx, W * 0.54, H * 0.79, W * 0.36, S.soft, '软实力吸引', `${Math.round(S.soft * 100)}%`, '#facc15', true);
          drawTinyHint(ctx, W, H, '调节硬实力排斥波与软实力引力环，观察外围节点向心聚集', true);
        }
      },
      2: {
        init() {
          S = { mix: 0.5, drag: false, t: 0 };
        },
        down(x, y, { W, H }) {
          if (hitSlider(x, y, W * 0.2, H * 0.78, W * 0.6)) {
            S.drag = true;
            S.mix = clamp((x - W * 0.2) / (W * 0.6), 0, 1);
          }
        },
        move(x, _y, _dx, _dy, { W }) {
          if (S.drag) S.mix = clamp((x - W * 0.2) / (W * 0.6), 0, 1);
        },
        up() {
          S.drag = false;
        },
        tick({ ctx, W, H, dt, hit }) {
          S.t += dt;
          drawPaperBg(ctx, W, H, true);
          // Smart Power peaks when Hard & Soft combine synergistically (~0.45..0.6)
          const synergy = 1 - Math.abs(S.mix - 0.5) * 1.65;
          if (synergy > 0.85) hit(2, 0, '巧实力：硬实力兜底 + 软实力感召的协同最优配比');
          if (S.mix < 0.15 || S.mix > 0.85) hit(2, 1, '单一维度极端化在复杂危机中容易失灵');

          const cx = W * 0.5;
          const cy = H * 0.43;
          // Overlapping Venn light beams
          const sep = Math.abs(S.mix - 0.5) * 160;
          ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
          ctx.beginPath();
          ctx.arc(cx - sep, cy, 64, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(250, 204, 21, 0.45)';
          ctx.beginPath();
          ctx.arc(cx + sep, cy, 64, 0, Math.PI * 2);
          ctx.fill();

          drawLabel(ctx, '硬实力', cx - sep - 20, cy + 4, '#fff', 12, 'center', true);
          drawLabel(ctx, '软实力', cx + sep + 20, cy + 4, '#fff', 12, 'center', true);
          if (synergy > 0.75) {
            drawLabel(ctx, '巧实力共振', cx, cy + 4, '#ecfdf5', 13, 'center', true);
          }

          drawMonoNum(ctx, `战略综合效能: ${Math.round(clamp(synergy, 0.15, 1) * 100)}%`, cx, H * 0.11, synergy > 0.8 ? '#34d399' : '#fbbf24', 15, 'center');
          drawCompactSlider(ctx, W * 0.2, H * 0.78, W * 0.6, S.mix, '硬实力 ← 巧实力配比 → 软实力', `${Math.round(S.mix * 100)}%`, '#34d399', true);
          drawTinyHint(ctx, W, H, '将红金双光束调节至中心重叠，激发「巧实力」协同效应', true);
        }
      }
    };
  }

  // =========================================================================
  // #128 麦克卢汉 · 媒介即讯息 (Morphing Signal: Oral Campfire -> Print Grid -> Global Village)
  // =========================================================================
  if (modelId === 128) {
    let S: any = {};
    return {
      1: {
        init() {
          S = { medium: 0, t: 0, visited: new Set([0]) };
        },
        down(x, y, { W, H }) {
          for (let i = 0; i < 3; i++) {
            if (hitBox(x, y, W * 0.14 + i * W * 0.25, H * 0.8, W * 0.22, 34)) {
              S.medium = i;
              S.visited.add(i);
            }
          }
        },
        tick({ ctx, W, H, dt, hit }) {
          S.t += dt;
          drawPaperBg(ctx, W, H, true);
          if (S.visited.size >= 2) hit(1, 0, '相同一句消息在不同媒介中被重塑为完全不同的感知结构');
          if (S.visited.size >= 3) hit(1, 1, '媒介本身重塑了时空尺度与人类感官比例');

          const cx = W * 0.5;
          const cy = H * 0.43;

          if (S.medium === 0) {
            // Oral Campfire: concentric warm acoustic ripples around intimate circle
            for (let k = 0; k < 4; k++) {
              const r = ((S.t * 45 + k * 34) % 135) + 18;
              ctx.strokeStyle = `rgba(251, 146, 60, ${1 - r / 155})`;
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              ctx.arc(cx, cy, r, 0, Math.PI * 2);
              ctx.stroke();
            }
            for (let i = 0; i < 8; i++) {
              const a = (i / 8) * Math.PI * 2;
              ctx.fillStyle = '#fdba74';
              ctx.beginPath();
              ctx.arc(cx + Math.cos(a) * 86, cy + Math.sin(a) * 86, 8, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.fillStyle = '#ea580c';
            ctx.beginPath();
            ctx.arc(cx, cy, 18, 0, Math.PI * 2);
            ctx.fill();
            drawMonoNum(ctx, '口语部落 · 听觉共鸣 · 半径 30 米', cx, H * 0.1, '#fb923c', 14, 'center');
          } else if (S.medium === 1) {
            // Printing Press: rigid linear rows of identical metal type marching left->right
            const cols = 10;
            const rows = 4;
            for (let r = 0; r < rows; r++) {
              for (let c = 0; c < cols; c++) {
                const shift = (S.t * 1.8) % 1;
                const bx = W * 0.16 + ((c + shift) % cols) * (W * 0.068);
                const by = H * 0.25 + r * 44;
                ctx.fillStyle = '#e2e8f0';
                ctx.fillRect(bx, by, 30, 26);
                ctx.fillStyle = '#1e293b';
                ctx.fillRect(bx + 6, by + 10, 18, 4);
              }
            }
            drawMonoNum(ctx, '印刷术 · 视觉线性 · 标准化孤立阅读', cx, H * 0.1, '#cbd5e1', 14, 'center');
          } else {
            // Electronic Global Village: instant all-to-all glowing mesh
            const pts = Array.from({ length: 12 }, (_, i) => {
              const a = (i / 12) * Math.PI * 2 + S.t * 0.2;
              return { x: cx + Math.cos(a) * 125, y: cy + Math.sin(a) * 90 };
            });
            for (let i = 0; i < pts.length; i++) {
              for (let j = i + 1; j < pts.length; j++) {
                if ((i + j) % 3 === 0) {
                  ctx.strokeStyle = 'rgba(56, 189, 248, 0.32)';
                  ctx.lineWidth = 1.2;
                  ctx.beginPath();
                  ctx.moveTo(pts[i].x, pts[i].y);
                  ctx.lineTo(pts[j].x, pts[j].y);
                  ctx.stroke();
                }
              }
            }
            pts.forEach((p, idx) => {
              const pulse = 5 + Math.sin(S.t * 6 + idx) * 2.5;
              ctx.fillStyle = '#38bdf8';
              ctx.beginPath();
              ctx.arc(p.x, p.y, pulse, 0, Math.PI * 2);
              ctx.fill();
            });
            drawMonoNum(ctx, '电子网络 · 即时同步 · 地球村再部落化', cx, H * 0.1, '#38bdf8', 14, 'center');
          }

          ['口语篝火', '印刷活字', '电子地球村'].forEach((lbl, i) => {
            drawToggleButton(ctx, W * 0.14 + i * W * 0.25, H * 0.8, W * 0.22, 34, lbl, S.medium === i, '#0284c7', true);
          });
          drawTinyHint(ctx, W, H, '切换三大媒介技术时代，直观感受同一讯息如何重塑空间与社会拓扑', true);
        }
      },
      2: {
        init() {
          S = { temp: 0.5, drag: false, t: 0 };
        },
        down(x, y, { W, H }) {
          if (hitSlider(x, y, W * 0.2, H * 0.78, W * 0.6)) {
            S.drag = true;
            S.temp = clamp((x - W * 0.2) / (W * 0.6), 0, 1);
          }
        },
        move(x, _y, _dx, _dy, { W }) {
          if (S.drag) S.temp = clamp((x - W * 0.2) / (W * 0.6), 0, 1);
        },
        up() {
          S.drag = false;
        },
        tick({ ctx, W, H, dt, hit }) {
          S.t += dt;
          drawPaperBg(ctx, W, H, true);
          // Cool medium (low definition -> user brain fills gaps = high participation) vs Hot medium (high definition -> passive)
          if (S.temp < 0.25) hit(2, 0, '冷媒介留白清晰度低，激发受众高深度卷入与补全');
          if (S.temp > 0.75) hit(2, 1, '热媒介高清晰度填满感官，受众趋于低介入被动接收');

          // Render pixel grid whose resolution increases with S.temp, while user "brain sparks" decrease
          const cx = W * 0.5;
          const cy = H * 0.42;
          const res = Math.round(4 + S.temp * 14);
          const cell = 120 / res;
          for (let r = 0; r < res; r++) {
            for (let c = 0; c < res; c++) {
              const dist = Math.hypot(r - res / 2 + 0.5, c - res / 2 + 0.5) / (res / 2);
              if (dist < 0.9) {
                ctx.fillStyle = S.temp > 0.5 ? `rgba(248, 113, 113, ${1 - dist * 0.5})` : `rgba(56, 189, 248, ${1 - dist * 0.5})`;
                ctx.fillRect(cx - 60 + c * cell, cy - 60 + r * cell, cell - 1, cell - 1);
              }
            }
          }
          // Orbiting brain participation sparks (more when cool!)
          const sparks = Math.round((1 - S.temp) * 14);
          for (let i = 0; i < sparks; i++) {
            const a = S.t * 2 + (i / Math.max(1, sparks)) * Math.PI * 2;
            ctx.fillStyle = '#34d399';
            ctx.beginPath();
            ctx.arc(cx + Math.cos(a) * 95, cy + Math.sin(a) * 95, 5, 0, Math.PI * 2);
            ctx.fill();
          }

          drawMonoNum(
            ctx,
            `清晰度: ${Math.round(S.temp * 100)}%  |  受众脑补卷入度: ${Math.round((1 - S.temp) * 100)}%`,
            cx,
            H * 0.1,
            S.temp > 0.5 ? '#f87171' : '#38bdf8',
            14,
            'center'
          );
          drawCompactSlider(ctx, W * 0.2, H * 0.78, W * 0.6, S.temp, '冷媒介 (漫画/对话)  ↔  热媒介 (高清电影)', `${Math.round(S.temp * 100)}°`, '#f59e0b', true);
          drawTinyHint(ctx, W, H, '拖动媒介清晰度滑块，观察信息留白如何激发绿色受众卷入火花', true);
        }
      }
    };
  }

  // =========================================================================
  // #130 彼得·圣吉 · 系统思考与学习型组织 (Figure-8 Dual Loops + Bottleneck Gate)
  // =========================================================================
  if (modelId === 130) {
    let S: any = {};
    return {
      1: {
        init() {
          S = { push: 0.4, bottleneck: 0.45, drag: 0, perf: 0.4, hist: [] as number[], t: 0 };
        },
        down(x, y, { W, H }) {
          if (hitSlider(x, y, W * 0.1, H * 0.79, W * 0.36)) {
            S.drag = 1;
            S.push = clamp((x - W * 0.1) / (W * 0.36), 0.1, 1);
          } else if (hitSlider(x, y, W * 0.54, H * 0.79, W * 0.36)) {
            S.drag = 2;
            S.bottleneck = clamp((x - W * 0.54) / (W * 0.36), 0.1, 1);
          }
        },
        move(x, _y, _dx, _dy, { W }) {
          if (S.drag === 1) S.push = clamp((x - W * 0.1) / (W * 0.36), 0.1, 1);
          if (S.drag === 2) S.bottleneck = clamp((x - W * 0.54) / (W * 0.36), 0.1, 1);
        },
        up() {
          S.drag = 0;
        },
        tick({ ctx, W, H, dt, hit }) {
          S.t += dt;
          drawPaperBg(ctx, W, H, false);
          // Limits to Growth archetype: pushing R-loop hits B-loop ceiling unless bottleneck is widened!
          const ceiling = 0.25 + S.bottleneck * 0.72;
          const targetPerf = Math.min(S.push * 0.95, ceiling);
          S.perf = lerp(S.perf, targetPerf, dt * 2.2);

          if (S.push > 0.75 && S.bottleneck < 0.45) hit(1, 0, '成长上限：猛推增强环反而撞上调节环天花板');
          if (S.bottleneck > 0.75) hit(1, 1, '杠杆解在于拓宽制约瓶颈，而非盲目加码推力！');

          // Figure-8 loop: Left Reinforcing (R) + Right Balancing (B)
          const lx = W * 0.26;
          const rx = W * 0.52;
          const cy = H * 0.44;
          const rad = 64;

          ctx.strokeStyle = '#059669';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.arc(lx, cy, rad, 0, Math.PI * 2);
          ctx.stroke();
          drawLabel(ctx, 'R 增强环', lx, cy + 4, '#059669', 13, 'center', true);

          ctx.strokeStyle = '#dc2626';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.arc(rx, cy, rad, 0, Math.PI * 2);
          ctx.stroke();
          drawLabel(ctx, 'B 制约环', rx, cy + 4, '#dc2626', 13, 'center', true);

          // Moving marbles on R and B loops
          const aR = S.t * (1.5 + S.push * 3);
          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.arc(lx + Math.cos(aR) * rad, cy + Math.sin(aR) * rad, 8, 0, Math.PI * 2);
          ctx.fill();

          const brakeForce = clamp((S.push - ceiling) * 3, 0, 1);
          const aB = -S.t * (1 + brakeForce * 4);
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(rx + Math.cos(aB) * rad, cy + Math.sin(aB) * rad, 8, 0, Math.PI * 2);
          ctx.fill();

          if (Math.floor(S.t * 16) !== Math.floor((S.t - dt) * 16)) {
            S.hist.push(S.perf);
            if (S.hist.length > 55) S.hist.shift();
          }
          drawSparkline(ctx, W * 0.68, H * 0.2, W * 0.26, H * 0.46, [
            { data: S.hist, color: '#0284c7', label: '组织产出' },
            { data: S.hist.map(() => ceiling), color: '#dc2626', label: '瓶颈上限' }
          ]);

          drawCompactSlider(ctx, W * 0.1, H * 0.79, W * 0.36, (S.push - 0.1) / 0.9, '增长推力 (加班/营销)', `${Math.round(S.push * 100)}%`, '#059669');
          drawCompactSlider(ctx, W * 0.54, H * 0.79, W * 0.36, (S.bottleneck - 0.1) / 0.9, '瓶颈容量 (杠杆解)', `${Math.round(S.bottleneck * 100)}%`, '#0284c7');
          drawTinyHint(ctx, W, H, '先拉满左滑块撞上红色上限，再拉右滑块拓宽制约瓶颈找到杠杆解');
        }
      },
      2: {
        init() {
          S = { patch: 0, rootFix: 0, debt: 0.2, t: 0 };
        },
        down(x, y, { W, H }) {
          if (hitBox(x, y, W * 0.18, H * 0.79, 175, 34)) {
            S.patch++;
            S.debt = clamp(S.debt + 0.18, 0, 1);
          } else if (hitBox(x, y, W * 0.54, H * 0.79, 175, 34)) {
            S.rootFix++;
            S.debt = clamp(S.debt - 0.28, 0.05, 1);
          }
        },
        tick({ ctx, W, H, dt, hit }) {
          S.t += dt;
          drawPaperBg(ctx, W, H, false);
          if (S.patch >= 2) hit(2, 0, '舍本逐末：临时急救虽见效快，却不断累积隐性系统债务');
          if (S.rootFix >= 2) hit(2, 1, '治本重构虽有短暂延迟，却彻底消除复发根源');

          // Iceberg visualization: Surface Symptom vs Underwater Systemic Debt
          const waterY = H * 0.42;
          ctx.fillStyle = '#bae6fd';
          ctx.fillRect(W * 0.12, waterY, W * 0.76, H * 0.3);

          const topSize = 26 + S.debt * 30;
          const bottomSize = 40 + S.debt * 110;
          ctx.fillStyle = '#f8fafc';
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(W * 0.5, waterY - topSize);
          ctx.lineTo(W * 0.5 + topSize * 1.1, waterY);
          ctx.lineTo(W * 0.5 - topSize * 1.1, waterY);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = 'rgba(220, 38, 38, 0.35)';
          ctx.beginPath();
          ctx.moveTo(W * 0.5 - topSize * 1.1, waterY);
          ctx.lineTo(W * 0.5 + topSize * 1.1, waterY);
          ctx.lineTo(W * 0.5 + bottomSize * 0.8, waterY + bottomSize);
          ctx.lineTo(W * 0.5 - bottomSize * 0.8, waterY + bottomSize);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          drawLabel(ctx, '水面症状', W * 0.5, waterY - topSize - 10, '#334155', 12, 'center', true);
          drawMonoNum(ctx, `水下结构债务: ${Math.round(S.debt * 100)}%`, W * 0.5, waterY + 42, '#991b1b', 14, 'center');

          drawToggleButton(ctx, W * 0.18, H * 0.79, 175, 34, '临时打补丁 (+债务)', false, '#dc2626');
          drawToggleButton(ctx, W * 0.54, H * 0.79, 175, 34, '投入治本重构 (-债务)', true, '#059669');
          drawTinyHint(ctx, W, H, '对比「临时急救」与「治本重构」，看水下冰山结构债务的膨胀与消解');
        }
      }
    };
  }

  // =========================================================================
  // #131 克里斯坦森 · 破坏性创新 (Live Performance-vs-Time Trajectory Chart)
  // =========================================================================
  if (modelId === 131) {
    let S: any = {};
    return {
      1: {
        init() {
          S = { time: 0.25, drag: false };
        },
        down(x, y, { W, H }) {
          if (hitSlider(x, y, W * 0.18, H * 0.8, W * 0.64)) {
            S.drag = true;
            S.time = clamp((x - W * 0.18) / (W * 0.64), 0.05, 1);
          }
        },
        move(x, _y, _dx, _dy, { W }) {
          if (S.drag) S.time = clamp((x - W * 0.18) / (W * 0.64), 0.05, 1);
        },
        up() {
          S.drag = false;
        },
        tick({ ctx, W, H, hit }) {
          drawPaperBg(ctx, W, H, false);
          const gx = W * 0.14;
          const gy = H * 0.14;
          const gw = W * 0.72;
          const gh = H * 0.54;

          if (S.time > 0.45) hit(1, 0, '在位巨头延续性创新过度供给，超出主流用户需求');
          if (S.time > 0.75) hit(1, 1, '低端破坏者沿陡峭斜率跨入主流带，瞬间颠覆巨头！');

          // Mainstream Customer Demand Band (shaded corridor)
          ctx.fillStyle = 'rgba(16, 185, 129, 0.14)';
          ctx.beginPath();
          ctx.moveTo(gx, gy + gh * 0.55);
          ctx.lineTo(gx + gw, gy + gh * 0.36);
          ctx.lineTo(gx + gw, gy + gh * 0.56);
          ctx.lineTo(gx, gy + gh * 0.75);
          ctx.closePath();
          ctx.fill();
          drawLabel(ctx, '主流市场需求区间', gx + gw - 10, gy + gh * 0.48, '#047857', 11, 'right', true);

          // Axes
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(gx, gy);
          ctx.lineTo(gx, gy + gh);
          ctx.lineTo(gx + gw, gy + gh);
          ctx.stroke();
          drawLabel(ctx, '产品性能', gx - 8, gy + 10, '#334155', 11, 'right', true);

          // Incumbent sustaining curve (starts high, overshoots)
          const t = S.time;
          ctx.strokeStyle = '#2563eb';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(gx, gy + gh * 0.52);
          ctx.lineTo(gx + gw * t, gy + gh * (0.52 - t * 0.48));
          ctx.stroke();

          // Disruptor curve (starts below mainstream, steep climb!)
          ctx.strokeStyle = '#ea580c';
          ctx.lineWidth = 3.2;
          ctx.beginPath();
          ctx.moveTo(gx, gy + gh * 0.92);
          ctx.lineTo(gx + gw * t, gy + gh * (0.92 - t * 0.56));
          ctx.stroke();

          // Vertical time cursor
          const cx = gx + gw * t;
          ctx.strokeStyle = 'rgba(15,23,42,0.3)';
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(cx, gy);
          ctx.lineTo(cx, gy + gh);
          ctx.stroke();
          ctx.setLineDash([]);

          // Dots
          const iy = gy + gh * (0.52 - t * 0.48);
          const dy = gy + gh * (0.92 - t * 0.56);
          ctx.fillStyle = '#2563eb';
          ctx.beginPath();
          ctx.arc(cx, iy, 7, 0, Math.PI * 2);
          ctx.fill();
          drawLabel(ctx, '在位巨头', cx + 10, iy + 4, '#2563eb', 11, 'left', true);

          ctx.fillStyle = '#ea580c';
          ctx.beginPath();
          ctx.arc(cx, dy, 7, 0, Math.PI * 2);
          ctx.fill();
          drawLabel(ctx, '破坏者', cx + 10, dy + 4, '#ea580c', 11, 'left', true);

          const disrupted = t > 0.68;
          drawMonoNum(ctx, disrupted ? '交叉颠覆时刻：低价够用横扫主流！' : '早期阶段：巨头不屑低端边缘市场', W * 0.5, H * 0.09, disrupted ? '#ea580c' : '#2563eb', 14, 'center');
          drawCompactSlider(ctx, W * 0.18, H * 0.8, W * 0.64, S.time, '技术演进时间轴', `第 ${Math.round(1 + t * 9)} 年`, '#ea580c');
          drawTinyHint(ctx, W, H, '向右拖动时间轴，见证低端破坏者如何悄然爬入绿色主流需求带');
        }
      },
      2: {
        init() {
          S = { spinout: false, t: 0 };
        },
        down(x, y, { W, H }) {
          if (hitBox(x, y, W * 0.22, H * 0.79, 175, 34)) S.spinout = false;
          if (hitBox(x, y, W * 0.54, H * 0.79, 175, 34)) S.spinout = true;
        },
        tick({ ctx, W, H, dt, hit }) {
          S.t += dt;
          drawPaperBg(ctx, W, H, false);
          if (!S.spinout) hit(2, 0, '留在母公司内部，高利润率考核会扼杀早期低毛利创新');
          if (S.spinout) hit(2, 1, '设立独立小团队与独立成本结构，让破坏性幼苗存活壮大');

          const cx = W * 0.5;
          const cy = H * 0.44;
          // Mother corp box
          ctx.fillStyle = '#e2e8f0';
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(cx - 190, cy - 80, 170, 160, 12);
          ctx.fill();
          ctx.stroke();
          drawLabel(ctx, '母公司核心部', cx - 105, cy - 54, '#1e293b', 12, 'center', true);
          drawMonoNum(ctx, 'KPI: 毛利>40%', cx - 105, cy - 32, '#dc2626', 11, 'center');

          // Disruptive seed orb
          const seedX = S.spinout ? cx + 115 : cx - 105;
          const seedR = S.spinout ? 36 + Math.sin(S.t * 3) * 4 : 16;
          if (S.spinout) {
            ctx.fillStyle = 'rgba(16, 185, 129, 0.14)';
            ctx.strokeStyle = '#059669';
            ctx.setLineDash([5, 4]);
            ctx.beginPath();
            ctx.roundRect(cx + 35, cy - 80, 160, 160, 12);
            ctx.fill();
            ctx.stroke();
            ctx.setLineDash([]);
            drawLabel(ctx, '独立孵化机构', cx + 115, cy - 54, '#047857', 12, 'center', true);
          }

          ctx.fillStyle = S.spinout ? '#10b981' : '#94a3b8';
          ctx.beginPath();
          ctx.arc(seedX, cy + 16, seedR, 0, Math.PI * 2);
          ctx.fill();
          drawLabel(ctx, S.spinout ? '新物种壮大' : '被砍预算', seedX, cy + 20, '#fff', 11, 'center', true);

          drawToggleButton(ctx, W * 0.22, H * 0.79, 175, 34, '留在母公司KPI内', !S.spinout, '#64748b');
          drawToggleButton(ctx, W * 0.54, H * 0.79, 175, 34, '独立组织孵化 ✓', S.spinout, '#059669');
          drawTinyHint(ctx, W, H, '切换创新团队的组织隔离模式，破解「创新者的窘境」');
        }
      }
    };
  }

  // =========================================================================
  // #132 贝塔朗菲 · 一般系统论 (Open vs Closed Membrane + Equifinality Dual Paths)
  // =========================================================================
  if (modelId === 132) {
    let S: any = {};
    return {
      1: {
        init() {
          S = {
            open: true,
            order: 0.85,
            particles: Array.from({ length: 24 }, () => ({
              x: (Math.random() - 0.5) * 140,
              y: (Math.random() - 0.5) * 100,
              vx: (Math.random() - 0.5) * 70,
              vy: (Math.random() - 0.5) * 70
            })),
            t: 0
          };
        },
        down(x, y, { W, H }) {
          if (hitBox(x, y, W * 0.22, H * 0.8, 170, 34)) S.open = true;
          if (hitBox(x, y, W * 0.54, H * 0.8, 170, 34)) S.open = false;
        },
        tick({ ctx, W, H, dt, hit }) {
          S.t += dt;
          drawPaperBg(ctx, W, H, true);
          const cx = W * 0.5;
          const cy = H * 0.44;
          const rad = 95;

          S.order = lerp(S.order, S.open ? 0.92 : 0.14, dt * 0.85);
          if (!S.open && S.order < 0.4) hit(1, 0, '封闭系统隔绝负熵输入，内部有序度不可逆衰减');
          if (S.open && S.order > 0.75) hit(1, 1, '开放系统通过与环境交换物质能量维持动态稳态');

          // System boundary membrane (dashed permeable when open, solid thick when closed)
          ctx.strokeStyle = S.open ? '#34d399' : '#ef4444';
          ctx.lineWidth = S.open ? 3 : 6;
          if (S.open) ctx.setLineDash([10, 7]);
          ctx.beginPath();
          ctx.arc(cx, cy, rad, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);

          // Inflow & Outflow streams when open
          if (S.open) {
            for (let i = 0; i < 4; i++) {
              const p = (S.t * 0.9 + i * 0.25) % 1;
              ctx.fillStyle = '#38bdf8';
              ctx.beginPath();
              ctx.arc(lerp(cx - rad - 80, cx - rad + 10, p), cy + (i - 1.5) * 20, 5, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#94a3b8';
              ctx.beginPath();
              ctx.arc(lerp(cx + rad - 10, cx + rad + 80, p), cy + (i - 1.5) * 20, 4.5, 0, Math.PI * 2);
              ctx.fill();
            }
            drawLabel(ctx, '能量/信息输入 →', cx - rad - 54, cy - 52, '#38bdf8', 11, 'center', true);
            drawLabel(ctx, '→ 熵排出', cx + rad + 54, cy - 52, '#94a3b8', 11, 'center', true);
          }

          // Particles inside: structured geometric ring when order high, chaotic jitter when order low
          S.particles.forEach((p: any, i: number) => {
            const targetA = (i / S.particles.length) * Math.PI * 2 + S.t * 0.8;
            const ringR = i % 2 === 0 ? 54 : 28;
            const ox = Math.cos(targetA) * ringR;
            const oy = Math.sin(targetA) * ringR;
            if (S.open) {
              p.x = lerp(p.x, ox, dt * 3);
              p.y = lerp(p.y, oy, dt * 3);
            } else {
              p.x += p.vx * dt;
              p.y += p.vy * dt;
              if (Math.hypot(p.x, p.y) > rad - 10) {
                p.vx *= -1;
                p.vy *= -1;
              }
            }
            ctx.fillStyle = S.order > 0.5 ? '#34d399' : '#f87171';
            ctx.beginPath();
            ctx.arc(cx + p.x, cy + p.y, 5, 0, Math.PI * 2);
            ctx.fill();
          });

          drawMonoNum(ctx, `系统有序度: ${Math.round(S.order * 100)}%`, cx, H * 0.1, S.order > 0.5 ? '#34d399' : '#f87171', 15, 'center');
          drawToggleButton(ctx, W * 0.22, H * 0.8, 170, 34, '开放边界 (交换)', S.open, '#059669', true);
          drawToggleButton(ctx, W * 0.54, H * 0.8, 170, 34, '封闭隔绝 (熵增)', !S.open, '#dc2626', true);
          drawTinyHint(ctx, W, H, '切换开放与封闭系统膜，观察内部粒子在稳态结晶与热寂混沌间演化', true);
        }
      },
      2: {
        init() {
          S = {
            starts: [
              { x: 0.15, y: 0.22, col: '#38bdf8' },
              { x: 0.15, y: 0.66, col: '#fbbf24' }
            ],
            t: 0,
            dragIdx: -1
          };
        },
        down(x, y, { W, H }) {
          S.starts.forEach((st: any, i: number) => {
            if (Math.hypot(x - st.x * W, y - st.y * H) < 28) S.dragIdx = i;
          });
        },
        move(x, y, _dx, _dy, { W, H }) {
          if (S.dragIdx >= 0) {
            S.starts[S.dragIdx].x = clamp(x / W, 0.1, 0.45);
            S.starts[S.dragIdx].y = clamp(y / H, 0.18, 0.74);
          }
        },
        up() {
          S.dragIdx = -1;
        },
        tick({ ctx, W, H, dt, hit }) {
          S.t += dt;
          drawPaperBg(ctx, W, H, true);
          const gx = W * 0.8;
          const gy = H * 0.44;
          if (S.dragIdx >= 0) hit(2, 0, '异途同归性：不同起点经由不同路径仍收敛到同一动态稳态');
          if (S.t > 2.2) hit(2, 1, '开放系统的最终态取决于系统自身参数而非初始条件');

          // Attractor basin target
          ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(gx, gy, 34 + Math.sin(S.t * 3) * 4, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.arc(gx, gy, 16, 0, Math.PI * 2);
          ctx.fill();
          drawLabel(ctx, '动态稳态', gx, gy + 36, '#34d399', 12, 'center', true);

          S.starts.forEach((st: any, idx: number) => {
            const sx = st.x * W;
            const sy = st.y * H;
            const cpx = (sx + gx) / 2;
            const cpy = idx === 0 ? sy - 40 : sy + 40;
            ctx.strokeStyle = st.col;
            ctx.lineWidth = 2.6;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.quadraticCurveTo(cpx, cpy, gx, gy);
            ctx.stroke();

            // Traveling bead
            const p = (S.t * 0.45 + idx * 0.3) % 1;
            const bx = (1 - p) * (1 - p) * sx + 2 * (1 - p) * p * cpx + p * p * gx;
            const by = (1 - p) * (1 - p) * sy + 2 * (1 - p) * p * cpy + p * p * gy;
            ctx.fillStyle = st.col;
            ctx.beginPath();
            ctx.arc(bx, by, 6, 0, Math.PI * 2);
            ctx.fill();

            // Draggable start node
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(sx, sy, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            drawLabel(ctx, `起点 ${idx + 1}`, sx, sy - 18, st.col, 11, 'center', true);
          });

          drawMonoNum(ctx, 'Equifinality · 异途同归收敛', W * 0.5, H * 0.1, '#34d399', 15, 'center');
          drawTinyHint(ctx, W, H, '任意拖动左侧两个起点圆球，观察开放系统始终异途同归收敛至右侧稳态', true);
        }
      }
    };
  }

  return null;
}
