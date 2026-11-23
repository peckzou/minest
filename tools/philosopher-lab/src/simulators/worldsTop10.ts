import { hitSlider } from './canvasHelpers';
import { StageEngine } from './engineEthics';
import {
  clamp,
  lerp,
  drawPaperBg,
  drawLabel,
  drawMonoNum,
  drawArrow,
  drawCar,
  drawFish,
  drawBoat,
  drawPolygonCitizen,
  drawCoin,
  drawCompactSlider,
  drawToggleButton,
  hitBox,
  drawSparkline,
  drawTinyHint
} from './visualPrimitives';

export function createTop10VisualWorld(modelId: number): Record<number, StageEngine> | null {
  // ==================== #89 纳什均衡 (Real Interactive Payoff Arena + Best-Response Vectors) ====================
  if (modelId === 89) {
    let S: any = {};
    return {
      1: {
        init() {
          S = {
            // payoffs[r][c] = [rowPayoff, colPayoff]
            pay: [
              [
                [3, 3],
                [0, 5]
              ],
              [
                [5, 0],
                [2, 2]
              ]
            ],
            r: 0,
            c: 0,
            pawnX: 0,
            pawnY: 0,
            pulse: 0
          };
        },
        down(x, y, { W, H, hit, toast }) {
          const cx = W * 0.5;
          const cy = H * 0.45;
          const cellW = Math.min(180, W * 0.25);
          const cellH = Math.min(110, H * 0.27);
          const x0 = cx - cellW;
          const y0 = cy - cellH;

          for (let r = 0; r < 2; r++) {
            for (let c = 0; c < 2; c++) {
              const bx = x0 + c * cellW;
              const by = y0 + r * cellH;
              if (hitBox(x, y, bx, by, cellW, cellH)) {
                S.r = r;
                S.c = c;
                S.pulse = 1;
                const rowBest = S.pay[r][c][0] >= S.pay[1 - r][c][0];
                const colBest = S.pay[r][c][1] >= S.pay[r][1 - c][1];
                if (rowBest && colBest) {
                  hit(1, 1, '双向最优反应锁定：纳什均衡！');
                  toast('★ 纳什均衡：双方均无单方面偏离动力');
                } else {
                  hit(1, 0, '存在单方面偏离获利路径（见红色箭头）');
                }
                return;
              }
            }
          }
        },
        tick({ ctx, W, H, dt, T }) {
          drawPaperBg(ctx, W, H);
          if (S.pulse > 0) S.pulse = Math.max(0, S.pulse - dt * 2.5);

          const cx = W * 0.5;
          const cy = H * 0.46;
          const cellW = Math.min(180, W * 0.25);
          const cellH = Math.min(110, H * 0.27);
          const x0 = cx - cellW;
          const y0 = cy - cellH;

          // Axis headers
          drawLabel(ctx, '列方 B：合作', x0 + cellW * 0.5, y0 - 14, '#0284c7', 12.5, 'center', true);
          drawLabel(ctx, '列方 B：背叛', x0 + cellW * 1.5, y0 - 14, '#0284c7', 12.5, 'center', true);
          drawLabel(ctx, '行方 A：合作', x0 - 14, y0 + cellH * 0.5 + 4, '#d97706', 12.5, 'right', true);
          drawLabel(ctx, '行方 A：背叛', x0 - 14, y0 + cellH * 1.5 + 4, '#d97706', 12.5, 'right', true);

          for (let r = 0; r < 2; r++) {
            for (let c = 0; c < 2; c++) {
              const bx = x0 + c * cellW;
              const by = y0 + r * cellH;
              const [pA, pB] = S.pay[r][c];
              const rowBest = pA >= S.pay[1 - r][c][0];
              const colBest = pB >= S.pay[r][1 - c][1];
              const isEq = rowBest && colBest;
              const isSel = S.r === r && S.c === c;

              ctx.fillStyle = isEq ? '#ecfdf5' : '#ffffff';
              ctx.strokeStyle = isSel ? '#f59e0b' : isEq ? '#10b981' : '#cbd5e1';
              ctx.lineWidth = isSel ? 3.2 : 1.5;
              ctx.beginPath();
              ctx.roundRect(bx + 4, by + 4, cellW - 8, cellH - 8, 10);
              ctx.fill();
              ctx.stroke();

              // Visual coin stacks representing payoffs
              for (let k = 0; k < pA; k++) {
                drawCoin(ctx, bx + 28 + k * 14, by + cellH - 24, 6.5, '');
              }
              for (let k = 0; k < pB; k++) {
                ctx.fillStyle = '#0284c7';
                ctx.beginPath();
                ctx.arc(bx + cellW - 24 - k * 14, by + 26, 5.5, 0, Math.PI * 2);
                ctx.fill();
              }

              drawMonoNum(ctx, `A:${pA}`, bx + 22, by + cellH - 38, '#b45309', 13, 'left');
              drawMonoNum(ctx, `B:${pB}`, bx + cellW - 20, by + 45, '#0369a1', 13, 'right');

              if (isEq) {
                const glow = 0.7 + 0.3 * Math.sin(T * 4);
                ctx.strokeStyle = `rgba(16, 185, 129, ${glow})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(bx + cellW / 2, by + cellH / 2, 16 + Math.sin(T * 4) * 2, 0, Math.PI * 2);
                ctx.stroke();
                drawLabel(ctx, '★ 均衡', bx + cellW / 2, by + cellH / 2 + 4, '#059669', 11.5, 'center', true);
              }
            }
          }

          // Animated best-response deviation arrows from selected cell
          const scx = x0 + (S.c + 0.5) * cellW;
          const scy = y0 + (S.r + 0.5) * cellH;
          if (!S.pawnX) {
            S.pawnX = scx;
            S.pawnY = scy;
          }
          S.pawnX = lerp(S.pawnX, scx, dt * 12);
          S.pawnY = lerp(S.pawnY, scy, dt * 12);

          const curA = S.pay[S.r][S.c][0];
          const altA = S.pay[1 - S.r][S.c][0];
          if (altA > curA) {
            const ty = y0 + (1 - S.r + 0.5) * cellH;
            drawArrow(ctx, S.pawnX - 18, S.pawnY, S.pawnX - 18, lerp(S.pawnY, ty, 0.78), '#dc2626', 3.5, 11);
          }
          const curB = S.pay[S.r][S.c][1];
          const altB = S.pay[S.r][1 - S.c][1];
          if (altB > curB) {
            const tx = x0 + (1 - S.c + 0.5) * cellW;
            drawArrow(ctx, S.pawnX, S.pawnY - 14, lerp(S.pawnX, tx, 0.78), S.pawnY - 14, '#0284c7', 3.5, 11);
          }

          // Selected pawn token
          ctx.fillStyle = '#f59e0b';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(S.pawnX, S.pawnY, 11 + S.pulse * 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          drawTinyHint(ctx, W, H, '点击 2×2 格子移动金色棋子：观察红色/蓝色最优反应偏离箭头，锁定无箭头的纳什均衡');
        }
      },
      2: {
        init() {
          S = { coopBonus: 0.3, drag: false, mixP: 0.5 };
        },
        down(x, y, { W, H }) {
          const s = hitSlider(x, y, W * 0.2, H * 0.78, W * 0.6);
          if (s !== null) {
            S.drag = true;
            S.coopBonus = s;
          }
        },
        move(x, _y, _dx, _dy, { W }) {
          if (S.drag) S.coopBonus = clamp((x - W * 0.2) / (W * 0.6), 0, 1);
        },
        up() {
          S.drag = false;
        },
        tick({ ctx, W, H, T, hit }) {
          drawPaperBg(ctx, W, H);
          const reward = Math.round(2 + S.coopBonus * 6); // 2..8
          const isStag = reward >= 5;

          // Left: Animated Stag-Hunt / Equilibrium Basin landscape (rolling ball!)
          const lx = W * 0.14;
          const lw = W * 0.72;
          const by = H * 0.58;

          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 3;
          ctx.beginPath();
          for (let i = 0; i <= 60; i++) {
            const u = i / 60; // 0 = (B,B) Safe, 1 = (A,A) Coop
            // Potential well: single well at left if !isStag; double well if isStag!
            let well = 0;
            if (!isStag) {
              well = -Math.exp(-Math.pow((u - 0.18) * 4, 2)) * 70 + u * 35;
            } else {
              const depthRight = 40 + (reward - 4) * 14;
              well =
                -Math.exp(-Math.pow((u - 0.18) * 5, 2)) * 55 -
                Math.exp(-Math.pow((u - 0.82) * 5, 2)) * depthRight +
                Math.exp(-Math.pow((u - 0.5) * 6, 2)) * 32;
            }
            const px = lx + u * lw;
            const py = by + well;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();

          // Left Equilibrium Ball (Safe B,B)
          const bx1 = lx + 0.18 * lw;
          const by1 = by - (isStag ? 55 : 64) - 10;
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(bx1, by1, 11, 0, Math.PI * 2);
          ctx.fill();
          drawLabel(ctx, '均衡 1: 保守 (2,2)', bx1, by1 - 18, '#b45309', 12, 'center', true);

          // Right Equilibrium Ball appears when reward >= 5
          const bx2 = lx + 0.82 * lw;
          if (isStag) {
            const by2 = by - (40 + (reward - 4) * 14) - 10;
            ctx.fillStyle = '#10b981';
            ctx.beginPath();
            ctx.arc(bx2, by2, 12, 0, Math.PI * 2);
            ctx.fill();
            drawLabel(ctx, `均衡 2: 协同 (${reward},${reward})`, bx2, by2 - 18, '#059669', 12, 'center', true);

            // Unstable mixed equilibrium on ridge
            const mx = lx + 0.5 * lw;
            const my = by + 32 - 10 + Math.sin(T * 5) * 2;
            ctx.fillStyle = '#0284c7';
            ctx.beginPath();
            ctx.arc(mx, my, 8, 0, Math.PI * 2);
            ctx.fill();
            drawLabel(ctx, '混合均衡', mx, my - 14, '#0284c7', 11, 'center', true);
            hit(2, 1, '协同收益突破阈值：势能面裂变为双纯策略均衡 + 混合策略均衡！');
          } else {
            hit(2, 0);
          }

          drawCompactSlider(
            ctx,
            W * 0.2,
            H * 0.78,
            W * 0.6,
            S.coopBonus,
            '协同合作收益 (A, A)',
            `(${reward}, ${reward})`,
            isStag ? '#059669' : '#d97706'
          );
          drawTinyHint(ctx, W, H, '向右拖动滑杆抬高协同收益：观察势能地形从单均衡裂变为鹿猎双纳什均衡');
        }
      }
    };
  }

  // ==================== #111 谢林社会隔离 (Real 10×7 Parable of the Polygons City Grid) ====================
  if (modelId === 111) {
    let S: any = {};
    const COLS = 10;
    const ROWS = 6;
    const initGrid = () => {
      const cells: (0 | 1 | 2)[] = [];
      for (let i = 0; i < COLS * ROWS; i++) {
        const r = Math.random();
        cells.push(r < 0.2 ? 0 : r < 0.6 ? 1 : 2);
      }
      return cells;
    };
    const isHappy = (cells: (0 | 1 | 2)[], idx: number, tau: number) => {
      const me = cells[idx];
      if (me === 0) return true;
      const r = Math.floor(idx / COLS);
      const c = idx % COLS;
      let same = 0;
      let total = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
            const nb = cells[nr * COLS + nc];
            if (nb !== 0) {
              total++;
              if (nb === me) same++;
            }
          }
        }
      }
      if (total === 0) return true;
      return same / total >= tau;
    };
    const calcSegregation = (cells: (0 | 1 | 2)[]) => {
      let sum = 0;
      let count = 0;
      for (let i = 0; i < cells.length; i++) {
        const me = cells[i];
        if (me === 0) continue;
        const r = Math.floor(i / COLS);
        const c = i % COLS;
        let same = 0;
        let total = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
              const nb = cells[nr * COLS + nc];
              if (nb !== 0) {
                total++;
                if (nb === me) same++;
              }
            }
          }
        }
        if (total > 0) {
          sum += same / total;
          count++;
        }
      }
      return count ? sum / count : 0.5;
    };
    const stepOneUnhappy = (cells: (0 | 1 | 2)[], tau: number) => {
      const unhappy: number[] = [];
      const empties: number[] = [];
      cells.forEach((v, i) => {
        if (v === 0) empties.push(i);
        else if (!isHappy(cells, i, tau)) unhappy.push(i);
      });
      if (!unhappy.length || !empties.length) return false;
      const u = unhappy[Math.floor(Math.random() * unhappy.length)];
      const e = empties[Math.floor(Math.random() * empties.length)];
      cells[e] = cells[u];
      cells[u] = 0;
      return true;
    };

    const makeStage = (stageNum: number): StageEngine => ({
      init() {
        S = {
          cells: initGrid(),
          tau: stageNum === 1 ? 0.34 : 0.2,
          auto: false,
          timer: 0,
          moves: 0,
          dragIdx: -1,
          dragSlider: false,
          px: 0,
          py: 0,
          hist: [0.5]
        };
      },
      down(x, y, { W, H, hit }) {
        // Right panel controls
        const rx = W * 0.68;
        const rw = W * 0.27;
        const s = hitSlider(x, y, rx, H * 0.34, rw);
        if (s !== null) {
          S.dragSlider = true;
          S.tau = 0.1 + s * 0.65;
          return;
        }
        if (hitBox(x, y, rx, H * 0.46, rw * 0.47, 34)) {
          S.auto = !S.auto;
          return;
        }
        if (hitBox(x, y, rx + rw * 0.53, H * 0.46, rw * 0.47, 34)) {
          if (stepOneUnhappy(S.cells, S.tau)) {
            S.moves++;
            hit(stageNum, 0);
          }
          return;
        }
        if (hitBox(x, y, rx, H * 0.58, rw, 30)) {
          S.cells = initGrid();
          S.hist = [calcSegregation(S.cells)];
          S.moves = 0;
          return;
        }

        // Direct drag on grid
        const gx = W * 0.05;
        const gy = H * 0.1;
        const gw = W * 0.58;
        const gh = H * 0.78;
        const cw = gw / COLS;
        const ch = gh / ROWS;
        const c = Math.floor((x - gx) / cw);
        const r = Math.floor((y - gy) / ch);
        if (c >= 0 && c < COLS && r >= 0 && r < ROWS) {
          const idx = r * COLS + c;
          if (S.cells[idx] !== 0) {
            S.dragIdx = idx;
            S.px = x;
            S.py = y;
          }
        }
      },
      move(x, y, _dx, _dy, { W }) {
        if (S.dragSlider) {
          const rx = W * 0.68;
          const rw = W * 0.27;
          S.tau = 0.1 + clamp((x - rx) / rw, 0, 1) * 0.65;
        } else if (S.dragIdx >= 0) {
          S.px = x;
          S.py = y;
        }
      },
      up({ W, H, hit }) {
        if (S.dragIdx >= 0) {
          const gx = W * 0.05;
          const gy = H * 0.1;
          const gw = W * 0.58;
          const gh = H * 0.78;
          const cw = gw / COLS;
          const ch = gh / ROWS;
          const c = Math.floor((S.px - gx) / cw);
          const r = Math.floor((S.py - gy) / ch);
          if (c >= 0 && c < COLS && r >= 0 && r < ROWS) {
            const target = r * COLS + c;
            if (S.cells[target] === 0) {
              S.cells[target] = S.cells[S.dragIdx];
              S.cells[S.dragIdx] = 0;
              S.moves++;
              hit(stageNum, 0, '一人搬迁牵动原邻居比例');
            }
          }
        }
        S.dragIdx = -1;
        S.dragSlider = false;
      },
      tick({ ctx, W, H, dt, T, hit }) {
        drawPaperBg(ctx, W, H);
        if (S.auto) {
          S.timer += dt;
          if (S.timer > 0.12) {
            S.timer = 0;
            const moved = stepOneUnhappy(S.cells, S.tau);
            if (moved) S.moves++;
            const seg = calcSegregation(S.cells);
            S.hist.push(seg);
            if (S.hist.length > 50) S.hist.shift();
          }
        }

        const seg = calcSegregation(S.cells);
        if (stageNum === 1) {
          if (S.moves >= 2) hit(1, 0);
          if (seg >= 0.72) hit(1, 1, '仅要求 1/3 同类邻居，城市却自发演变为高度隔离板块！');
        } else {
          if (S.tau <= 0.25) hit(2, 0);
          if (S.tau >= 0.34 && seg >= 0.7) hit(2, 1, '跨过 33% 阈值后隔离度跃升！');
        }

        // Draw City Grid
        const gx = W * 0.05;
        const gy = H * 0.1;
        const gw = W * 0.58;
        const gh = H * 0.78;
        const cw = gw / COLS;
        const ch = gh / ROWS;
        const sz = Math.min(cw, ch) * 0.34;

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(gx - 6, gy - 6, gw + 12, gh + 12, 10);
        ctx.fill();
        ctx.stroke();

        let unhappyCnt = 0;
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            const idx = r * COLS + c;
            const x0 = gx + c * cw;
            const y0 = gy + r * ch;
            ctx.strokeStyle = '#f1f5f9';
            ctx.lineWidth = 1;
            ctx.strokeRect(x0, y0, cw, ch);

            const v = S.cells[idx];
            if (v !== 0 && idx !== S.dragIdx) {
              const happy = isHappy(S.cells, idx, S.tau);
              if (!happy) unhappyCnt++;
              drawPolygonCitizen(ctx, x0 + cw / 2, y0 + ch / 2, sz, v, happy, T * 16 + idx);
            }
          }
        }

        // Dragged citizen floating under pointer
        if (S.dragIdx >= 0 && S.cells[S.dragIdx] !== 0) {
          drawPolygonCitizen(ctx, S.px, S.py, sz * 1.15, S.cells[S.dragIdx], true, 0);
        }

        // Right HUD Panel (compact metrics + controls + live sparkline)
        const rx = W * 0.68;
        const rw = W * 0.27;
        drawLabel(ctx, '隔离度 (同类邻居均值)', rx, H * 0.15, '#475569', 11.5, 'left', true);
        drawMonoNum(ctx, `${Math.round(seg * 100)}%`, rx + rw, H * 0.15, seg > 0.7 ? '#dc2626' : '#059669', 18, 'right');

        drawLabel(ctx, '不满意居民', rx, H * 0.23, '#475569', 11.5, 'left');
        drawMonoNum(ctx, `${unhappyCnt} 户`, rx + rw, H * 0.23, unhappyCnt > 0 ? '#ea580c' : '#059669', 14, 'right');

        drawCompactSlider(
          ctx,
          rx,
          H * 0.34,
          rw,
          (S.tau - 0.1) / 0.65,
          '同类偏好阈值 τ',
          `${Math.round(S.tau * 100)}%`,
          S.tau > 0.33 ? '#dc2626' : '#0284c7'
        );

        drawToggleButton(ctx, rx, H * 0.46, rw * 0.47, 34, S.auto ? '⏸ 暂停' : '▶ 自动搬迁', S.auto, '#059669');
        drawToggleButton(ctx, rx + rw * 0.53, H * 0.46, rw * 0.47, 34, '单步搬家', false, '#0284c7');
        drawToggleButton(ctx, rx, H * 0.58, rw, 30, '随机洗牌', false, '#64748b');

        drawSparkline(ctx, rx, H * 0.69, rw, H * 0.2, [{ data: S.hist, color: '#dc2626', label: '隔离曲线' }]);

        drawTinyHint(ctx, W, H, '拖动抖动的不满意小方块/小三角进空位，或点击「▶ 自动搬迁」并调节同类偏好阈值 τ');
      }
    });

    return { 1: makeStage(1), 2: makeStage(2) };
  }

  // ==================== #134 福瑞斯特系统动力学 (Real Animated Water Tank + Live Oscilloscope + Bullwhip Trucks) ====================
  if (modelId === 134) {
    let S: any = {};
    return {
      1: {
        init() {
          S = {
            inflow: 0.72,
            outflow: 0.32,
            stock: 0.35,
            drag: 0,
            histS: [0.35],
            histIn: [0.72],
            histOut: [0.32],
            sampleT: 0
          };
        },
        down(x, y, { W, H }) {
          const s1 = hitSlider(x, y, W * 0.06, H * 0.76, W * 0.38);
          if (s1 !== null) {
            S.drag = 1;
            S.inflow = s1;
            return;
          }
          const s2 = hitSlider(x, y, W * 0.56, H * 0.76, W * 0.38);
          if (s2 !== null) {
            S.drag = 2;
            S.outflow = s2;
          }
        },
        move(x, _y, _dx, _dy, { W }) {
          if (S.drag === 1) S.inflow = clamp((x - W * 0.06) / (W * 0.38), 0, 1);
          if (S.drag === 2) S.outflow = clamp((x - W * 0.56) / (W * 0.38), 0, 1);
        },
        up() {
          S.drag = 0;
        },
        tick({ ctx, W, H, dt, T, hit }) {
          drawPaperBg(ctx, W, H);
          const net = S.inflow - S.outflow;
          S.stock = clamp(S.stock + net * dt * 0.22, 0.02, 0.98);
          S.sampleT += dt;
          if (S.sampleT > 0.08) {
            S.sampleT = 0;
            S.histS.push(S.stock);
            S.histIn.push(S.inflow);
            S.histOut.push(S.outflow);
            if (S.histS.length > 70) {
              S.histS.shift();
              S.histIn.shift();
              S.histOut.shift();
            }
          }

          if (S.inflow > S.outflow + 0.08 && S.inflow < 0.75) {
            hit(1, 0, '即使流入阀门关小，只要流入 > 流出，水位依然持续上升！');
          }
          if (Math.abs(S.inflow - S.outflow) < 0.04) {
            hit(1, 1, '流入 = 流出：存量水位进入动态稳态！');
          }

          // Left Half: Cutaway Bathtub Tank with Animated Pipes & Streams
          const tx = W * 0.14;
          const ty = H * 0.24;
          const tw = W * 0.28;
          const th = H * 0.38;

          // Inflow pipe & rotating valve wheel
          ctx.fillStyle = '#475569';
          ctx.fillRect(tx - 48, ty - 28, 72, 12);
          ctx.fillRect(tx + 14, ty - 28, 12, 20);
          // Pouring water stream
          if (S.inflow > 0.03) {
            const sw = 3 + S.inflow * 13;
            ctx.fillStyle = 'rgba(14, 165, 233, 0.78)';
            ctx.fillRect(tx + 20 - sw / 2, ty - 8, sw, th * (1 - S.stock) + 12);
          }

          // Outflow drain pipe & stream
          ctx.fillStyle = '#475569';
          ctx.fillRect(tx + tw - 26, ty + th, 12, 22);
          if (S.outflow > 0.03 && S.stock > 0.03) {
            const dw = 3 + S.outflow * 13;
            ctx.fillStyle = 'rgba(234, 88, 12, 0.75)';
            ctx.fillRect(tx + tw - 20 - dw / 2, ty + th + 20, dw, 28);
          }

          // Tank water with animated wave meniscus
          const wh = th * S.stock;
          ctx.fillStyle = 'rgba(56, 189, 248, 0.72)';
          ctx.beginPath();
          ctx.moveTo(tx, ty + th);
          for (let i = 0; i <= 20; i++) {
            const wx = tx + (i / 20) * tw;
            const wy = ty + th - wh + Math.sin(T * 5 + i * 0.6) * (1.5 + S.inflow * 2.5);
            ctx.lineTo(wx, wy);
          }
          ctx.lineTo(tx + tw, ty + th);
          ctx.closePath();
          ctx.fill();

          // Floating rubber buoy showing rise/fall
          const buoyY = ty + th - wh;
          ctx.fillStyle = net > 0.04 ? '#0284c7' : net < -0.04 ? '#ea580c' : '#059669';
          ctx.beginPath();
          ctx.arc(tx + tw * 0.55, buoyY, 9, 0, Math.PI * 2);
          ctx.fill();
          drawMonoNum(ctx, `${Math.round(S.stock * 100)}%`, tx + tw * 0.55, buoyY - 14, '#0f172a', 13);

          // Glass tank walls
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.lineTo(tx, ty + th);
          ctx.lineTo(tx + tw, ty + th);
          ctx.lineTo(tx + tw, ty);
          ctx.stroke();

          // Right Half: Live 3-channel Oscilloscope
          drawSparkline(ctx, W * 0.48, H * 0.14, W * 0.46, H * 0.48, [
            { data: S.histS, color: '#0284c7', label: '存量 Stock' },
            { data: S.histIn, color: '#10b981', label: '流入 In' },
            { data: S.histOut, color: '#ea580c', label: '流出 Out' }
          ]);

          drawCompactSlider(ctx, W * 0.06, H * 0.76, W * 0.38, S.inflow, '流入阀门', `${Math.round(S.inflow * 100)} L/s`, '#059669');
          drawCompactSlider(ctx, W * 0.56, H * 0.76, W * 0.38, S.outflow, '流出阀门', `${Math.round(S.outflow * 100)} L/s`, '#ea580c');
          drawTinyHint(ctx, W, H, '拖动左右阀门：试着关小流入但仍保持 流入>流出，观察右侧存量曲线为何继续攀升');
        }
      },
      2: {
        init() {
          S = { delay: 0.78, drag: false, shockT: 0 };
        },
        down(x, y, { W, H }) {
          const s = hitSlider(x, y, W * 0.18, H * 0.78, W * 0.64);
          if (s !== null) {
            S.drag = true;
            S.delay = s;
            return;
          }
          S.shockT = 1;
        },
        move(x, _y, _dx, _dy, { W }) {
          if (S.drag) S.delay = clamp((x - W * 0.18) / (W * 0.64), 0, 1);
        },
        up() {
          S.drag = false;
        },
        tick({ ctx, W, H, T, hit }) {
          drawPaperBg(ctx, W, H);
          const tiers = ['零售店', '批发商', '分销仓', '上游工厂'];
          const xs = [W * 0.18, W * 0.39, W * 0.61, W * 0.82];
          const baseY = H * 0.58;

          // Connecting conveyor belts & animated trucks
          for (let i = 0; i < 3; i++) {
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(xs[i] + 34, baseY - 22);
            ctx.lineTo(xs[i + 1] - 34, baseY - 22);
            ctx.stroke();
            const p = (T * 0.55 + i * 0.3) % 1;
            const kx = lerp(xs[i + 1] - 34, xs[i] + 34, p);
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(kx - 7, baseY - 30, 14, 9);
          }

          // Warehouse crate stacks oscillating with bullwhip amplification
          tiers.forEach((name, i) => {
            const amp = 12 * Math.pow(1 + S.delay * 0.88, i);
            const h = clamp(45 + Math.sin(T * 3.2 - i * (0.4 + S.delay * 1.1)) * amp, 10, H * 0.42);
            const crates = Math.max(1, Math.round(h / 14));
            for (let c = 0; c < crates; c++) {
              ctx.fillStyle = i === 3 && S.delay > 0.5 ? '#ef4444' : '#d97706';
              ctx.strokeStyle = '#78350f';
              ctx.lineWidth = 1.2;
              ctx.fillRect(xs[i] - 26, baseY - (c + 1) * 14, 52, 12);
              ctx.strokeRect(xs[i] - 26, baseY - (c + 1) * 14, 52, 12);
            }
            drawLabel(ctx, name, xs[i], baseY + 20, '#1e293b', 12, 'center', true);
            drawMonoNum(ctx, `±${Math.round(10 * Math.pow(1 + S.delay * 0.85, i))}%`, xs[i], baseY + 36, i === 3 && S.delay > 0.5 ? '#dc2626' : '#475569', 11.5);
          });

          if (S.delay > 0.6) hit(2, 0);
          if (S.delay < 0.22) hit(2, 1, '缩短信息与交货延迟：成功平抑上游工厂的牛鞭库存震荡！');

          drawCompactSlider(
            ctx,
            W * 0.18,
            H * 0.78,
            W * 0.64,
            S.delay,
            '交货与信息反馈延迟',
            `${Math.round(S.delay * 14)} 天`,
            S.delay > 0.5 ? '#dc2626' : '#059669'
          );
          drawTinyHint(ctx, W, H, '向右拉高延迟观察上游工厂货箱剧烈爆仓/断货震荡，再向左缩短延迟将其平抑');
        }
      }
    };
  }

  // ==================== #94 阿克洛夫柠檬市场 (Real Used-Car Dealership Lot + Driving Cars + X-Ray Lens) ====================
  if (modelId === 94) {
    let S: any = {};
    const makeCars = () =>
      Array.from({ length: 10 }, (_, i) => ({
        id: i,
        isPeach: i % 2 === 0,
        slotX: 0.14 + (i % 5) * 0.18,
        slotY: i < 5 ? 0.3 : 0.56,
        x: 0.14 + (i % 5) * 0.18,
        present: true,
        smoke: Math.random()
      }));

    return {
      1: {
        init() {
          S = { cars: makeCars(), bid: 1500, drag: false, round: 0 };
        },
        down(x, y, { W, H }) {
          const s = hitSlider(x, y, W * 0.16, H * 0.79, W * 0.68);
          if (s !== null) {
            S.drag = true;
            S.bid = Math.round(800 + s * 1400);
            return;
          }
          // Click "Next Market Round" button
          if (hitBox(x, y, W * 0.78, H * 0.08, 126, 32)) {
            S.round++;
            S.bid = Math.max(900, S.bid - 350);
          }
        },
        move(x, _y, _dx, _dy, { W }) {
          if (S.drag) S.bid = Math.round(800 + clamp((x - W * 0.16) / (W * 0.68), 0, 1) * 1400);
        },
        up() {
          S.drag = false;
        },
        tick({ ctx, W, H, dt, hit }) {
          drawPaperBg(ctx, W, H);

          // Asphalt parking lot
          ctx.fillStyle = '#e2e8f0';
          ctx.beginPath();
          ctx.roundRect(W * 0.06, H * 0.18, W * 0.88, H * 0.5, 12);
          ctx.fill();

          let peachesLeft = 0;
          S.cars.forEach((car: any) => {
            car.smoke = (car.smoke + dt * 0.7) % 1;
            // Peach sellers demand >= $1800; Lemon sellers accept >= $900
            const willing = car.isPeach ? S.bid >= 1800 : S.bid >= 900;
            const targetX = willing ? car.slotX : 1.18;
            car.x = lerp(car.x, targetX, dt * 3.5);
            if (willing && car.isPeach) peachesLeft++;

            // Parking bay outline
            ctx.strokeStyle = '#cbd5e1';
            ctx.setLineDash([4, 4]);
            ctx.strokeRect(W * car.slotX - 38, H * car.slotY - 22, 76, 44);
            ctx.setLineDash([]);

            if (car.x < 1.12) {
              drawCar(ctx, W * car.x, H * car.slotY, 1.05, car.isPeach, false, car.smoke);
            }
          });

          drawLabel(ctx, `在售好车(水蜜桃): ${peachesLeft}/5`, W * 0.07, H * 0.13, peachesLeft === 0 ? '#dc2626' : '#059669', 13, 'left', true);
          drawLabel(ctx, '好车底价 $1800 · 柠檬底价 $900', W * 0.48, H * 0.13, '#475569', 12, 'center');
          drawToggleButton(ctx, W * 0.78, H * 0.08, 126, 32, '买方压价试探', false, '#d97706');

          if (S.bid < 1800 && S.bid >= 1100) hit(1, 0, '均价低于 $1800：所有好车车主直接开车撤离市场！');
          if (S.bid <= 1050) hit(1, 1, '逆向选择螺旋完成：市场只剩下冒烟的柠檬车！');

          drawCompactSlider(
            ctx,
            W * 0.16,
            H * 0.79,
            W * 0.68,
            (S.bid - 800) / 1400,
            '买方盲出均价（看不清车况）',
            `$${S.bid}`,
            peachesLeft === 0 ? '#dc2626' : '#0284c7'
          );
          drawTinyHint(ctx, W, H, '向左拖动买方出价低于 $1800：亲眼看暗灰外表下的好车一辆辆开离车场，只剩冒烟的柠檬车');
        }
      },
      2: {
        init() {
          S = {
            cars: makeCars(),
            lensX: 0.25,
            lensY: 0.42,
            drag: false,
            scanned: new Set<number>()
          };
        },
        down(x, y, { W, H }) {
          S.drag = true;
          S.lensX = clamp(x / W, 0.08, 0.92);
          S.lensY = clamp(y / H, 0.16, 0.72);
        },
        move(x, y, _dx, _dy, { W, H }) {
          if (S.drag) {
            S.lensX = clamp(x / W, 0.08, 0.92);
            S.lensY = clamp(y / H, 0.16, 0.72);
          }
        },
        up() {
          S.drag = false;
        },
        tick({ ctx, W, H, dt, hit }) {
          drawPaperBg(ctx, W, H);
          const lx = W * S.lensX;
          const ly = H * S.lensY;
          const lensR = 78;

          ctx.fillStyle = '#e2e8f0';
          ctx.beginPath();
          ctx.roundRect(W * 0.06, H * 0.16, W * 0.88, H * 0.56, 12);
          ctx.fill();

          S.cars.forEach((car: any) => {
            car.smoke = (car.smoke + dt * 0.7) % 1;
            const cx = W * car.slotX;
            const cy = H * car.slotY;
            const inLens = Math.hypot(cx - lx, cy - ly) < lensR;
            if (inLens) S.scanned.add(car.id);
            const rev = inLens || S.scanned.has(car.id);
            drawCar(ctx, cx, cy, 1.05, car.isPeach, rev, car.smoke);
            if (rev) {
              drawMonoNum(ctx, car.isPeach ? '$2000 ★' : '$1000 🍋', cx, cy + 32, car.isPeach ? '#059669' : '#b45309', 11.5);
            }
          });

          // X-Ray Inspection Magnifier Ring
          ctx.strokeStyle = '#0284c7';
          ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.arc(lx, ly, lensR, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          drawLabel(ctx, '质检透视镜', lx, ly - lensR - 8, '#0284c7', 12, 'center', true);

          if (S.scanned.size >= 2) hit(2, 0, '第三方质检透视消除了信息不对称！');
          if (S.scanned.size >= 6) hit(2, 1, '分离定价恢复：好车 $2000、柠檬车 $1000 各得其所！');

          drawTinyHint(ctx, W, H, '直接按住并拖动蓝色「质检透视镜」扫过二手车场，揭开隐藏车况并重建分离定价');
        }
      }
    };
  }

  // ==================== #96 奥斯特罗姆公共资源治理 (Animated Ocean + 40 Reproducing Fish + 4 Boats + Governance Buoys) ====================
  if (modelId === 96) {
    let S: any = {};
    const spawnFish = (n: number) =>
      Array.from({ length: n }, () => ({
        x: 0.1 + Math.random() * 0.8,
        y: 0.4 + Math.random() * 0.36,
        vx: (Math.random() > 0.5 ? 1 : -1) * (0.04 + Math.random() * 0.05),
        phase: Math.random() * 6
      }));

    const makeCommonsStage = (stageNum: number): StageEngine => ({
      init() {
        S = {
          fish: spawnFish(32),
          effort: stageNum === 1 ? 0.35 : 0.75,
          boundary: false,
          monitor: false,
          sanction: false,
          drag: false,
          hist: [0.65],
          tickT: 0
        };
      },
      down(x, y, { W, H, hit }) {
        if (stageNum === 1) {
          const s = hitSlider(x, y, W * 0.18, H * 0.84, W * 0.64);
          if (s !== null) {
            S.drag = true;
            S.effort = s;
          }
        } else {
          if (hitBox(x, y, W * 0.08, H * 0.8, W * 0.25, 34)) {
            S.boundary = !S.boundary;
            hit(2, 0, '设立清晰渔场边界：排除外来无序掠夺船只');
          } else if (hitBox(x, y, W * 0.375, H * 0.8, W * 0.25, 34)) {
            S.monitor = !S.monitor;
            hit(2, 0);
          } else if (hitBox(x, y, W * 0.67, H * 0.8, W * 0.25, 34)) {
            S.sanction = !S.sanction;
            if (S.boundary && S.monitor && S.sanction) {
              hit(2, 1, '自主治理规则生效：渔场鱼群实现永续动态均衡！');
            }
          }
        }
      },
      move(x, _y, _dx, _dy, { W }) {
        if (S.drag) S.effort = clamp((x - W * 0.18) / (W * 0.64), 0, 1);
      },
      up() {
        S.drag = false;
      },
      tick({ ctx, W, H, dt, T, hit }) {
        // Sky & Animated Ocean
        const sky = ctx.createLinearGradient(0, 0, 0, H * 0.32);
        sky.addColorStop(0, '#bae6fd');
        sky.addColorStop(1, '#f0f9ff');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, H * 0.32);

        const sea = ctx.createLinearGradient(0, H * 0.32, 0, H);
        sea.addColorStop(0, '#0284c7');
        sea.addColorStop(1, '#0c4a6e');
        ctx.fillStyle = sea;
        ctx.fillRect(0, H * 0.32, W, H * 0.68);

        // Effective harvest effort drops cleanly when Ostrom's governance rules are active
        const rulesActive = (S.boundary ? 1 : 0) + (S.monitor ? 1 : 0) + (S.sanction ? 1 : 0);
        const effEffort = stageNum === 1 ? S.effort : clamp(0.82 - rulesActive * 0.2, 0.2, 0.85);

        // Ecological logistic growth & harvesting update
        S.tickT += dt;
        if (S.tickT > 0.25) {
          S.tickT = 0;
          const n = S.fish.length;
          const K = 44;
          const birth = Math.random() < (0.35 * n * (1 - n / K)) / 8 ? 1 : 0;
          const catchN = Math.random() < effEffort * 0.9 ? (effEffort > 0.65 ? 2 : 1) : 0;
          if (birth && n < K) S.fish.push(...spawnFish(1));
          for (let c = 0; c < catchN && S.fish.length > 0; c++) {
            S.fish.pop();
          }
          if (stageNum === 2 && rulesActive >= 2 && S.fish.length < 24) {
            S.fish.push(...spawnFish(2));
          }
          S.hist.push(S.fish.length / K);
          if (S.hist.length > 55) S.hist.shift();
        }

        // Draw swimming fish
        S.fish.forEach((f: any) => {
          f.x += f.vx * dt;
          if (f.x < 0.08 || f.x > 0.92) f.vx *= -1;
          drawFish(ctx, W * f.x, H * f.y, f.vx, 9, '#fbbf24', Math.sin(T * 10 + f.phase) * 3);
        });

        // Draw 4 fishing boats bobbing on waves
        const boatCount = stageNum === 2 && S.boundary ? 3 : 4;
        for (let b = 0; b < boatCount; b++) {
          const bx = W * (0.2 + b * 0.2) + Math.sin(T * 0.9 + b * 2) * 18;
          const by = H * 0.31 + Math.sin(T * 2.5 + b) * 3;
          drawBoat(ctx, bx, by, 1.05, effEffort, b === 3 ? '#dc2626' : '#92400e', S.sanction && b === 2);
        }

        // Governance visual objects in water
        if (stageNum === 2 && S.boundary) {
          ctx.strokeStyle = '#fbbf24';
          ctx.setLineDash([6, 6]);
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(W * 0.1, H * 0.32);
          ctx.lineTo(W * 0.1, H * 0.74);
          ctx.moveTo(W * 0.9, H * 0.32);
          ctx.lineTo(W * 0.9, H * 0.74);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        if (stageNum === 2 && S.monitor) {
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(W * 0.5, H * 0.14, 14, 0, Math.PI * 2);
          ctx.fill();
          drawLabel(ctx, '社区瞭望', W * 0.5, H * 0.14 + 26, '#0f172a', 11, 'center', true);
        }

        // Top-left live Fish Population Sparkline
        drawSparkline(ctx, W * 0.04, H * 0.04, 180, 68, [{ data: S.hist, color: '#fbbf24', label: `鱼群 ${S.fish.length}` }], true);

        if (stageNum === 1) {
          if (S.effort > 0.65) hit(1, 0);
          if (S.fish.length <= 8) hit(1, 1, '公地悲剧爆发：开放准入下的抢捕耗尽了渔场再生能力！');
          // Semi-opaque control bar on bottom ocean
          ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
          ctx.fillRect(0, H * 0.75, W, H * 0.25);
          drawCompactSlider(ctx, W * 0.18, H * 0.84, W * 0.64, S.effort, '各船捕捞强度', `${Math.round(S.effort * 100)}%`, S.effort > 0.65 ? '#ef4444' : '#38bdf8', true);
          drawTinyHint(ctx, W, H, '向右拉高捕捞强度，观察鱼群跌破再生线并崩溃', true);
        } else {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
          ctx.fillRect(0, H * 0.75, W, H * 0.25);
          drawToggleButton(ctx, W * 0.08, H * 0.8, W * 0.25, 34, S.boundary ? '✓ 清晰边界' : '+ 划定边界浮标', S.boundary, '#059669', true);
          drawToggleButton(ctx, W * 0.375, H * 0.8, W * 0.25, 34, S.monitor ? '✓ 本地互监' : '+ 开启社区瞭望', S.monitor, '#0284c7', true);
          drawToggleButton(ctx, W * 0.67, H * 0.8, W * 0.25, 34, S.sanction ? '✓ 分级制裁' : '+ 启用违规罚款', S.sanction, '#d97706', true);
          if (rulesActive === 3 && S.fish.length >= 20) hit(2, 1);
          drawTinyHint(ctx, W, H, '依次点击下方三项奥斯特罗姆自主治理机制，看渔场在无外部强权下恢复永续平衡', true);
        }
      }
    });

    return { 1: makeCommonsStage(1), 2: makeCommonsStage(2) };
  }

  // ==================== #97 卡尼曼前景理论 (Real Interactive S-Curve + 2.25x Thermometer + Spinning Lottery Wheel) ====================
  if (modelId === 97) {
    let S: any = {};
    const valFn = (x: number) => (x >= 0 ? Math.pow(x, 0.88) : -2.25 * Math.pow(-x, 0.88));
    return {
      1: {
        init() {
          S = { xVal: 0.5, drag: false, sawGain: false, sawLoss: false }; // -1..+1 -> -$1000..+$1000
        },
        down(x, y, { W, H }) {
          S.drag = true;
          const cx = W * 0.44;
          const span = Math.min(W * 0.34, 240);
          S.xVal = clamp((x - cx) / span, -1, 1);
          if (y > H) return;
        },
        move(x, _y, _dx, _dy, { W }) {
          if (S.drag) {
            const cx = W * 0.44;
            const span = Math.min(W * 0.34, 240);
            S.xVal = clamp((x - cx) / span, -1, 1);
          }
        },
        up() {
          S.drag = false;
        },
        tick({ ctx, W, H, hit }) {
          drawPaperBg(ctx, W, H);
          const cx = W * 0.44;
          const cy = H * 0.42;
          const spanX = Math.min(W * 0.34, 240);
          const spanY = H * 0.16;

          // Axes
          drawArrow(ctx, cx - spanX - 18, cy, cx + spanX + 24, cy, '#64748b', 1.8, 7);
          drawArrow(ctx, cx, cy + spanY * 2.5, cx, cy - spanY * 1.6, '#64748b', 1.8, 7);
          drawLabel(ctx, '收益 (+$)', cx + spanX + 18, cy + 16, '#059669', 11, 'right', true);
          drawLabel(ctx, '损失 (-$)', cx - spanX - 12, cy + 16, '#dc2626', 11, 'left', true);
          drawLabel(ctx, '主观价值 v(x)', cx + 10, cy - spanY * 1.45, '#334155', 11, 'left', true);
          drawLabel(ctx, '参照点 0', cx - 8, cy + 16, '#475569', 10.5, 'right');

          // Draw S-Shaped Value Curve
          ctx.lineWidth = 3.5;
          // Loss half (steep red)
          ctx.strokeStyle = '#dc2626';
          ctx.beginPath();
          for (let i = -50; i <= 0; i++) {
            const u = i / 50;
            const px = cx + u * spanX;
            const py = cy - valFn(u) * spanY;
            if (i === -50) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();

          // Gain half (gentle green)
          ctx.strokeStyle = '#059669';
          ctx.beginPath();
          for (let i = 0; i <= 50; i++) {
            const u = i / 50;
            const px = cx + u * spanX;
            const py = cy - valFn(u) * spanY;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();

          // Draggable bead & dashed crosshairs
          const bx = cx + S.xVal * spanX;
          const v = valFn(S.xVal);
          const by = cy - v * spanY;

          ctx.strokeStyle = S.xVal >= 0 ? 'rgba(5,150,105,0.45)' : 'rgba(220,38,38,0.45)';
          ctx.setLineDash([4, 4]);
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(bx, cy);
          ctx.lineTo(bx, by);
          ctx.lineTo(cx, by);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = S.xVal >= 0 ? '#10b981' : '#ef4444';
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(bx, by, 11, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Right Side: Equal-Amount Gain vs Loss Symmetry Barometer
          const rx = W * 0.84;
          const absX = Math.abs(S.xVal);
          const gainH = valFn(absX) * 75;
          const lossH = Math.abs(valFn(-absX)) * 75;
          drawLabel(ctx, `等额 $${Math.round(absX * 1000)} 对比`, rx, H * 0.16, '#1e293b', 12, 'center', true);
          ctx.fillStyle = '#10b981';
          ctx.fillRect(rx - 36, H * 0.68 - gainH, 26, gainH);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(rx + 10, H * 0.68 - lossH, 26, lossH);
          drawMonoNum(ctx, `+${Math.round(gainH)}`, rx - 23, H * 0.68 - gainH - 6, '#059669', 11.5);
          drawMonoNum(ctx, `-${Math.round(lossH)}`, rx + 23, H * 0.68 - lossH - 6, '#dc2626', 11.5);
          drawLabel(ctx, '快乐', rx - 23, H * 0.74, '#059669', 11);
          drawLabel(ctx, '痛苦 2.25×', rx + 23, H * 0.74, '#dc2626', 11, 'center', true);

          if (S.xVal > 0.35) S.sawGain = true;
          if (S.xVal < -0.35) S.sawLoss = true;
          if (S.sawGain) hit(1, 0);
          if (S.sawGain && S.sawLoss) hit(1, 1, '损失厌恶：失去同等金额的痛苦约为获得快乐的 2.25 倍！');

          drawTinyHint(ctx, W, H, '直接在坐标系上左右拖动圆珠，对比等额收益与等额损失在右侧柱状图中的 2.25 倍不对称斜率');
        }
      },
      2: {
        init() {
          S = { frame: 'gain', spin: 0, angle: 0 };
        },
        down(x, y, { W, H, hit }) {
          if (hitBox(x, y, W * 0.22, H * 0.1, W * 0.25, 34)) {
            S.frame = 'gain';
            S.spin = 1;
            hit(2, 0, '收益框架：84% 的人选稳拿 $900（风险规避）');
          } else if (hitBox(x, y, W * 0.53, H * 0.1, W * 0.25, 34)) {
            S.frame = 'loss';
            S.spin = 1;
            hit(2, 1, '损失框架：80% 的人反转为赌一把 90% 亏 $1000（反射效应）！');
          } else {
            S.spin = 1;
          }
        },
        tick({ ctx, W, H, dt }) {
          drawPaperBg(ctx, W, H);
          if (S.spin > 0) {
            S.angle += dt * S.spin * 14;
            S.spin = Math.max(0, S.spin - dt * 0.8);
          }

          drawToggleButton(ctx, W * 0.22, H * 0.1, W * 0.25, 34, '收益框架 (+$)', S.frame === 'gain', '#059669');
          drawToggleButton(ctx, W * 0.53, H * 0.1, W * 0.25, 34, '损失框架 (-$)', S.frame === 'loss', '#dc2626');

          const isGain = S.frame === 'gain';
          // Left: Solid Certainty Box
          const lx = W * 0.28;
          const cy = H * 0.52;
          ctx.fillStyle = isGain ? '#d1fae5' : '#fee2e2';
          ctx.strokeStyle = isGain ? '#059669' : '#dc2626';
          ctx.lineWidth = isGain ? 4 : 2;
          ctx.beginPath();
          ctx.roundRect(lx - 82, cy - 62, 164, 124, 14);
          ctx.fill();
          ctx.stroke();
          drawMonoNum(ctx, isGain ? '100% +$900' : '100% -$900', lx, cy - 6, isGain ? '#065f46' : '#991b1b', 18);
          drawLabel(ctx, isGain ? '★ 多数选择 (84%)' : '仅 20% 选择', lx, cy + 28, isGain ? '#059669' : '#64748b', 12.5, 'center', true);

          // Right: Animated 90%/10% Probability Wheel
          const rx = W * 0.7;
          const wr = 66;
          ctx.save();
          ctx.translate(rx, cy);
          ctx.rotate(S.angle);
          ctx.fillStyle = isGain ? '#0284c7' : '#ef4444';
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.arc(0, 0, wr, 0, Math.PI * 1.8);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#e2e8f0';
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.arc(0, 0, wr, Math.PI * 1.8, Math.PI * 2);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
          ctx.strokeStyle = !isGain ? '#dc2626' : '#64748b';
          ctx.lineWidth = !isGain ? 4 : 2;
          ctx.beginPath();
          ctx.arc(rx, cy, wr, 0, Math.PI * 2);
          ctx.stroke();
          drawMonoNum(ctx, isGain ? '90% +$1000' : '90% -$1000', rx, cy - wr - 14, '#0f172a', 13);
          drawLabel(ctx, !isGain ? '★ 多数冒险 (80%)' : '仅 16% 选择', rx, cy + wr + 22, !isGain ? '#dc2626' : '#64748b', 12.5, 'center', true);

          drawTinyHint(ctx, W, H, '点击顶部切换「收益框架」与「损失框架」，观察期望值完全相同时风险偏好的镜像反转');
        }
      }
    };
  }

  // ==================== #109 格兰诺维特弱关系 (Real 3-Cluster 24-Node Interactive Graph + Draw Bridge!) ====================
  if (modelId === 109) {
    let S: any = {};
    const buildGraph = () => {
      const centers = [
        { x: 0.24, y: 0.48 },
        { x: 0.56, y: 0.28 },
        { x: 0.76, y: 0.62 }
      ];
      const nodes: any[] = [];
      centers.forEach((c, cl) => {
        for (let i = 0; i < 7; i++) {
          const ang = (i / 7) * Math.PI * 2;
          const r = i === 0 ? 0 : 0.095;
          nodes.push({
            id: cl * 7 + i,
            cl,
            x: c.x + Math.cos(ang) * r,
            y: c.y + Math.sin(ang) * r * 1.4,
            lit: false
          });
        }
      });
      const edges: Array<{ a: number; b: number; weak: boolean }> = [];
      // Dense strong ties inside each cluster
      for (let cl = 0; cl < 3; cl++) {
        const base = cl * 7;
        for (let i = 1; i < 7; i++) {
          edges.push({ a: base, b: base + i, weak: false });
          edges.push({ a: base + i, b: base + (i % 6) + 1, weak: false });
        }
      }
      return { nodes, edges };
    };

    const makeWeakTieStage = (stageNum: number): StageEngine => ({
      init() {
        const g = buildGraph();
        S = {
          nodes: g.nodes,
          edges: g.edges,
          pulses: [] as any[],
          dragFrom: -1,
          mx: 0,
          my: 0,
          firedOnce: false
        };
      },
      down(x, y, { W, H, hit, toast }) {
        let clicked = -1;
        S.nodes.forEach((n: any) => {
          if (Math.hypot(x - W * n.x, y - H * n.y) < 20) clicked = n.id;
        });
        if (clicked >= 0) {
          if (stageNum === 2) {
            S.dragFrom = clicked;
            S.mx = x;
            S.my = y;
          }
          // Fire glowing message wave from clicked node!
          S.nodes.forEach((n: any) => (n.lit = false));
          S.nodes[clicked].lit = true;
          S.firedOnce = true;
          S.edges.forEach((e: any) => {
            if (e.a === clicked || e.b === clicked) {
              S.pulses.push({ from: clicked, to: e.a === clicked ? e.b : e.a, t: 0, weak: e.weak });
            }
          });
          if (stageNum === 1) {
            hit(1, 0, '强关系圈内部高度闭环：消息仅在 7 个死党间反复打转！');
            toast('信息被困在孤立强关系小圈子里（覆盖率 33%）');
          }
        }
      },
      move(x, y) {
        if (S.dragFrom >= 0) {
          S.mx = x;
          S.my = y;
        }
      },
      up({ W, H, hit, toast }) {
        if (S.dragFrom >= 0) {
          let target = -1;
          S.nodes.forEach((n: any) => {
            if (Math.hypot(S.mx - W * n.x, S.my - H * n.y) < 26) target = n.id;
          });
          if (target >= 0 && target !== S.dragFrom && S.nodes[target].cl !== S.nodes[S.dragFrom].cl) {
            S.edges.push({ a: S.dragFrom, b: target, weak: true });
            // Launch wave across new bridge!
            S.pulses.push({ from: S.dragFrom, to: target, t: 0, weak: true });
            hit(2, 0, '架设跨圈层弱关系之桥（Bridge）：信息瞬间突破同温层！');
            toast('⚡ 弱关系之桥连通！金色信息波正向新社群扩散');
          }
        }
        S.dragFrom = -1;
      },
      tick({ ctx, W, H, dt, hit }) {
        drawPaperBg(ctx, W, H, true);

        // Update animated pulses
        const nextPulses: any[] = [];
        S.pulses.forEach((p: any) => {
          p.t += dt * 1.9;
          if (p.t >= 1) {
            const dest = S.nodes[p.to];
            if (!dest.lit) {
              dest.lit = true;
              S.edges.forEach((e: any) => {
                if (e.a === p.to || e.b === p.to) {
                  const nxt = e.a === p.to ? e.b : e.a;
                  if (!S.nodes[nxt].lit) {
                    nextPulses.push({ from: p.to, to: nxt, t: 0, weak: e.weak });
                  }
                }
              });
            }
          } else {
            nextPulses.push(p);
          }
        });
        S.pulses = nextPulses;

        // Draw edges
        S.edges.forEach((e: any) => {
          const a = S.nodes[e.a];
          const b = S.nodes[e.b];
          ctx.strokeStyle = e.weak ? '#38bdf8' : 'rgba(148, 163, 184, 0.42)';
          ctx.lineWidth = e.weak ? 2.5 : 2;
          if (e.weak) ctx.setLineDash([6, 4]);
          ctx.beginPath();
          ctx.moveTo(W * a.x, H * a.y);
          ctx.lineTo(W * b.x, H * b.y);
          ctx.stroke();
          ctx.setLineDash([]);
        });

        // Dragging live cyan bridge preview
        if (S.dragFrom >= 0) {
          const a = S.nodes[S.dragFrom];
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([5, 4]);
          ctx.beginPath();
          ctx.moveTo(W * a.x, H * a.y);
          ctx.lineTo(S.mx, S.my);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Draw moving golden packets
        S.pulses.forEach((p: any) => {
          const a = S.nodes[p.from];
          const b = S.nodes[p.to];
          const px = lerp(W * a.x, W * b.x, p.t);
          const py = lerp(H * a.y, H * b.y, p.t);
          ctx.fillStyle = p.weak ? '#38bdf8' : '#fbbf24';
          ctx.beginPath();
          ctx.arc(px, py, 5.5, 0, Math.PI * 2);
          ctx.fill();
        });

        // Draw nodes
        const litCnt = S.nodes.filter((n: any) => n.lit).length;
        const colors = ['#60a5fa', '#34d399', '#f472b6'];
        S.nodes.forEach((n: any) => {
          const nx = W * n.x;
          const ny = H * n.y;
          if (n.lit) {
            ctx.fillStyle = 'rgba(251, 191, 36, 0.25)';
            ctx.beginPath();
            ctx.arc(nx, ny, 16, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = n.lit ? '#fbbf24' : colors[n.cl];
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(nx, ny, 9.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        });

        // Minimal HUD top-left
        drawMonoNum(ctx, `信息触达: ${litCnt} / 21 (${Math.round((litCnt / 21) * 100)}%)`, 20, 28, '#fbbf24', 14, 'left');
        if (stageNum === 1 && S.firedOnce && litCnt <= 7) hit(1, 1);
        if (stageNum === 2 && litCnt >= 14) hit(2, 1, '弱关系桥接将原本孤立的社群缝合为全网大社会！');

        drawTinyHint(
          ctx,
          W,
          H,
          stageNum === 1
            ? '点击任意圆点释放求职信息：观察信息为何被锁死在 7 人强关系死党圈内'
            : '按住任意社群节点并拖向另一个社群画一条虚线「弱关系桥」，观察金色信息瞬间传遍全网',
          true
        );
      }
    });

    return { 1: makeWeakTieStage(1), 2: makeWeakTieStage(2) };
  }

  // ==================== #115 维果茨基最近发展区 (Real Cliff Climbing + Draggable Wooden Scaffolds) ====================
  if (modelId === 115) {
    let S: any = {};
    return {
      1: {
        init() {
          S = { diff: 0.72, scaff: 0.1, drag: 0, jumpT: 0 };
        },
        down(x, y, { W, H }) {
          const s1 = hitSlider(x, y, W * 0.08, H * 0.82, W * 0.38);
          if (s1 !== null) {
            S.drag = 1;
            S.diff = s1;
            return;
          }
          const s2 = hitSlider(x, y, W * 0.54, H * 0.82, W * 0.38);
          if (s2 !== null) {
            S.drag = 2;
            S.scaff = s2;
            return;
          }
          S.jumpT = 1;
        },
        move(x, _y, _dx, _dy, { W }) {
          if (S.drag === 1) S.diff = clamp((x - W * 0.08) / (W * 0.38), 0, 1);
          if (S.drag === 2) S.scaff = clamp((x - W * 0.54) / (W * 0.38), 0, 1);
        },
        up() {
          S.drag = 0;
        },
        tick({ ctx, W, H, dt, T, hit }) {
          drawPaperBg(ctx, W, H);
          if (S.jumpT > 0) S.jumpT = Math.max(0, S.jumpT - dt * 2);

          const groundY = H * 0.68;
          const soloReach = 0.36; // Learner solo capability height
          const totalReach = soloReach + S.scaff * 0.45;
          const inZPD = S.diff > soloReach && S.diff <= totalReach + 0.04;
          const tooEasy = S.diff <= soloReach;

          // ZPD glowing golden band on background
          const zpdTop = groundY - totalReach * H * 0.56;
          const zpdBot = groundY - soloReach * H * 0.56;
          ctx.fillStyle = 'rgba(245, 158, 11, 0.14)';
          ctx.fillRect(W * 0.12, zpdTop, W * 0.76, Math.max(4, zpdBot - zpdTop));
          drawLabel(ctx, '★ 最近发展区 (ZPD)', W * 0.14, zpdTop + 16, '#b45309', 11.5, 'left', true);

          // Ground
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(0, groundY, W, 6);

          // Wooden Scaffold blocks stacked under learner
          const lx = W * 0.38;
          const scaffH = S.scaff * H * 0.25;
          const blocks = Math.round(S.scaff * 5);
          for (let b = 0; b < blocks; b++) {
            const by = groundY - (b + 1) * (H * 0.05);
            ctx.fillStyle = '#d97706';
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 1.5;
            ctx.fillRect(lx - 28, by, 56, H * 0.048);
            ctx.strokeRect(lx - 28, by, 56, H * 0.048);
          }

          // Animated Learner Character standing on scaffold
          const bounce = inZPD ? Math.abs(Math.sin(T * 5)) * 8 : S.jumpT * 24;
          const charY = groundY - scaffH - bounce;
          ctx.fillStyle = inZPD ? '#059669' : tooEasy ? '#64748b' : '#dc2626';
          ctx.beginPath();
          ctx.arc(lx, charY - 34, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.roundRect(lx - 11, charY - 22, 22, 22, 6);
          ctx.fill();

          // Target Cliff Platform & Flag
          const cliffH = S.diff * H * 0.56;
          const cliffY = groundY - cliffH;
          ctx.fillStyle = '#475569';
          ctx.fillRect(W * 0.56, cliffY, W * 0.24, cliffH);
          // Flag pole
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(W * 0.64, cliffY);
          ctx.lineTo(W * 0.64, cliffY - 34);
          ctx.stroke();
          ctx.fillStyle = inZPD ? '#10b981' : '#f59e0b';
          ctx.beginPath();
          ctx.moveTo(W * 0.64, cliffY - 34);
          ctx.lineTo(W * 0.64 + 26, cliffY - 24);
          ctx.lineTo(W * 0.64, cliffY - 14);
          ctx.fill();

          // State label above cliff
          const status = tooEasy ? '舒适区 (太简单)' : inZPD ? '✓ 恰好跃入最近发展区！' : '恐慌区 (缺鹰架支持)';
          drawLabel(ctx, status, W * 0.68, cliffY - 44, inZPD ? '#059669' : tooEasy ? '#64748b' : '#dc2626', 13, 'center', true);

          if (!inZPD) hit(1, 0);
          if (inZPD && S.scaff > 0.25) hit(1, 1, '教学走在发展前面：借助恰当鹰架突破独立能力上限！');

          drawCompactSlider(ctx, W * 0.08, H * 0.82, W * 0.38, S.diff, '任务悬崖高度', `${Math.round(S.diff * 100)}`, '#475569');
          drawCompactSlider(ctx, W * 0.54, H * 0.82, W * 0.38, S.scaff, '导师鹰架高度', `${blocks} 块`, '#d97706');
          drawTinyHint(ctx, W, H, '拖动右侧「导师鹰架」为小人垫高木块，让小人刚好跨入金色最近发展区摘下旗帜');
        }
      },
      2: {
        init() {
          S = { blocks: 4, growth: 0 };
        },
        down(x, y, { W, H, hit, toast }) {
          if (y < H * 0.78 && S.blocks > 0) {
            S.blocks--;
            S.growth = (4 - S.blocks) / 4;
            hit(2, 0, '逐步撤除外部鹰架（Fading），心理机能正向内部转化');
            if (S.blocks === 0) {
              hit(2, 1, '内化完成：昨日需要鹰架的任务，今日已能独自触达！');
              toast('🎓 鹰架已完全撤除：学习者已成长为可独立完成任务！');
            }
          }
          if (x < 0) return;
        },
        tick({ ctx, W, H, T }) {
          drawPaperBg(ctx, W, H);
          const groundY = H * 0.72;
          const lx = W * 0.38;

          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(0, groundY, W, 6);

          // Remaining scaffold blocks
          for (let b = 0; b < S.blocks; b++) {
            const by = groundY - (b + 1) * 26;
            ctx.fillStyle = '#d97706';
            ctx.strokeStyle = '#78350f';
            ctx.fillRect(lx - 28, by, 56, 24);
            ctx.strokeRect(lx - 28, by, 56, 24);
          }

          // Learner grows taller as blocks are removed! (Internalization!)
          const bodyH = 26 + S.growth * 104;
          const base = groundY - S.blocks * 26;
          ctx.fillStyle = '#059669';
          ctx.beginPath();
          ctx.roundRect(lx - 13, base - bodyH, 26, bodyH, 8);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(lx, base - bodyH - 13, 13, 0, Math.PI * 2);
          ctx.fill();

          // Constant target flag at top
          const flagY = groundY - 140;
          ctx.fillStyle = '#475569';
          ctx.fillRect(W * 0.56, flagY, W * 0.24, 140);
          drawLabel(
            ctx,
            S.blocks === 0 ? '★ 独立完成（完全内化）' : `点击画布撤除 1 块鹰架 (剩 ${S.blocks} 块)`,
            W * 0.68,
            flagY - 18 + Math.sin(T * 4) * 2,
            S.blocks === 0 ? '#059669' : '#d97706',
            13,
            'center',
            true
          );

          drawTinyHint(ctx, W, H, '连续点击画布一块块撤除木制鹰架：观察学习者随内化长高，最终独自摘取同一高度的旗帜');
        }
      }
    };
  }

  // ==================== #125 阿罗不可能定理 (Real Interactive Condorcet Cycle Wheel + 5 Axiom Bulbs) ====================
  if (modelId === 125) {
    let S: any = {};
    return {
      1: {
        init() {
          S = { pair: 0, tested: new Set<number>(), rot: 0 };
        },
        down(x, y, { W, H, hit }) {
          for (let i = 0; i < 3; i++) {
            if (hitBox(x, y, W * (0.14 + i * 0.25), H * 0.74, W * 0.22, 36)) {
              S.pair = i;
              S.tested.add(i);
              if (S.tested.size >= 2) hit(1, 0);
              if (S.tested.size >= 3) hit(1, 1, '孔多塞循环锁定：A 胜 B、B 胜 C、C 反胜 A！');
            }
          }
        },
        tick({ ctx, W, H, dt }) {
          drawPaperBg(ctx, W, H);
          S.rot += dt * 0.6;

          // Left: 3 Voters' Ranked Preference Columns (color blocks, minimal text)
          const colMap: Record<string, string> = { A: '#ef4444', B: '#3b82f6', C: '#10b981' };
          const ballots = [
            ['A', 'B', 'C'],
            ['B', 'C', 'A'],
            ['C', 'A', 'B']
          ];
          ballots.forEach((b, vi) => {
            const vx = W * 0.1 + vi * 74;
            drawLabel(ctx, `选民 ${vi + 1}`, vx + 26, H * 0.16, '#475569', 11.5, 'center', true);
            b.forEach((cand, rank) => {
              const by = H * 0.21 + rank * 44;
              ctx.fillStyle = colMap[cand];
              ctx.beginPath();
              ctx.roundRect(vx, by, 52, 36, 7);
              ctx.fill();
              drawMonoNum(ctx, `${rank + 1}. ${cand}`, vx + 26, by + 23, '#ffffff', 13);
            });
          });

          // Right: Animated Condorcet Rock-Paper-Scissors Cycle Triangle
          const cx = W * 0.7;
          const cy = H * 0.42;
          const r = 74;
          const pts = [
            { k: 'A', x: cx, y: cy - r },
            { k: 'B', x: cx + r * 0.88, y: cy + r * 0.55 },
            { k: 'C', x: cx - r * 0.88, y: cy + r * 0.55 }
          ];
          const pairs = [
            [0, 1],
            [1, 2],
            [2, 0]
          ];
          pairs.forEach(([i, j], idx) => {
            const active = S.pair === idx || S.tested.has(idx);
            const p1 = pts[i];
            const p2 = pts[j];
            drawArrow(
              ctx,
              lerp(p1.x, p2.x, 0.22),
              lerp(p1.y, p2.y, 0.22),
              lerp(p1.x, p2.x, 0.78),
              lerp(p1.y, p2.y, 0.78),
              active ? '#f59e0b' : '#cbd5e1',
              active ? 4 : 2,
              11
            );
            if (active) {
              drawMonoNum(ctx, '2:1', (p1.x + p2.x) / 2, (p1.y + p2.y) / 2 - 6, '#b45309', 12);
            }
          });
          pts.forEach((p) => {
            ctx.fillStyle = colMap[p.k];
            ctx.beginPath();
            ctx.arc(p.x, p.y, 22, 0, Math.PI * 2);
            ctx.fill();
            drawMonoNum(ctx, p.k, p.x, p.y + 5, '#ffffff', 16);
          });

          const labels = ['① 投票: A vs B', '② 投票: B vs C', '③ 投票: C vs A'];
          labels.forEach((lb, i) => {
            drawToggleButton(ctx, W * (0.14 + i * 0.25), H * 0.74, W * 0.22, 36, lb, S.pair === i, '#0284c7');
          });
          drawTinyHint(ctx, W, H, '依次点击下方三场两两对决投票，点亮右侧 2:1 多数决的石头剪刀布死循环');
        }
      },
      2: {
        init() {
          S = { rule: 0, tried: new Set<number>([0]) };
        },
        down(x, y, { W, H, hit }) {
          for (let i = 0; i < 3; i++) {
            if (hitBox(x, y, W * (0.1 + i * 0.28), H * 0.14, W * 0.24, 36)) {
              S.rule = i;
              S.tried.add(i);
              if (i === 1) hit(2, 0, '波达积分法违反 IIA（无关方案独立性）公理！');
              if (S.tried.size >= 3) hit(2, 1, '阿罗不可能定理：任何投票规则都必然至少亮起一盏红色违背警灯！');
            }
          }
        },
        tick({ ctx, W, H, T }) {
          drawPaperBg(ctx, W, H, true);
          const rules = ['多数决 (两两对决)', '波达积分 (3/2/1分)', '独裁者指定'];
          rules.forEach((r, i) => {
            drawToggleButton(ctx, W * (0.1 + i * 0.28), H * 0.14, W * 0.24, 36, r, S.rule === i, '#f59e0b', true);
          });

          // 5 Glowing Axiom Indicator Bulbs!
          const axioms = [
            { name: '无限制域 U', ok: [true, true, true] },
            { name: '帕累托一致 P', ok: [true, true, true] },
            { name: '传递性 (无循环)', ok: [false, true, true] },
            { name: '无关方案独立 IIA', ok: [true, false, true] },
            { name: '非独裁性 D', ok: [true, true, false] }
          ];

          axioms.forEach((ax, i) => {
            const bx = W * (0.12 + i * 0.19);
            const by = H * 0.52;
            const pass = ax.ok[S.rule];
            const glow = pass ? 0.25 : 0.25 + 0.2 * Math.sin(T * 8);
            ctx.fillStyle = pass ? `rgba(16, 185, 129, ${glow})` : `rgba(239, 68, 68, ${glow})`;
            ctx.beginPath();
            ctx.arc(bx, by, 34, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = pass ? '#10b981' : '#ef4444';
            ctx.beginPath();
            ctx.arc(bx, by, 20, 0, Math.PI * 2);
            ctx.fill();
            drawMonoNum(ctx, pass ? '✓' : '✗', bx, by + 6, '#ffffff', 18);
            drawLabel(ctx, ax.name, bx, by + 48, pass ? '#a7f3d0' : '#fca5a5', 11.5, 'center', true);
          });

          drawTinyHint(ctx, W, H, '依次切换上方三种投票规则：观察无论怎么切换，五盏公平公理灯中总有一盏红灯报警', true);
        }
      }
    };
  }

  // ==================== #129 罗杰斯创新扩散 (56-Node Village Network + Live S-Curve & Bell Curve) ====================
  if (modelId === 129) {
    let S: any = {};
    const makeVillage = () => {
      const nodes = Array.from({ length: 56 }, (_, i) => {
        const col = i % 8;
        const row = Math.floor(i / 8);
        return {
          x: 0.08 + col * 0.068 + (Math.random() - 0.5) * 0.02,
          y: 0.16 + row * 0.095 + (Math.random() - 0.5) * 0.02,
          adopted: false,
          tier: Math.random(), // <0.05 innovator, <0.18 early adopter, <0.52 early maj, <0.84 late maj, else laggard
          pulse: 0
        };
      });
      return nodes;
    };

    const makeDiffStage = (stageNum: number): StageEngine => ({
      init() {
        S = {
          nodes: makeVillage(),
          appeal: stageNum === 1 ? 0.65 : 0.35,
          drag: false,
          hist: [0],
          timer: 0
        };
        // Seed 2 initial innovators
        S.nodes[0].adopted = true;
        S.nodes[9].adopted = true;
      },
      down(x, y, { W, H, hit }) {
        const s = hitSlider(x, y, W * 0.64, H * 0.74, W * 0.3);
        if (s !== null) {
          S.drag = true;
          S.appeal = s;
          return;
        }
        // Click villager to adopt directly!
        S.nodes.forEach((n: any) => {
          if (Math.hypot(x - W * n.x, y - H * n.y) < 18) {
            n.adopted = true;
            n.pulse = 1;
            hit(stageNum, 0);
          }
        });
      },
      move(x, _y, _dx, _dy, { W }) {
        if (S.drag) S.appeal = clamp((x - W * 0.64) / (W * 0.3), 0, 1);
      },
      up() {
        S.drag = false;
      },
      tick({ ctx, W, H, dt, hit }) {
        drawPaperBg(ctx, W, H, true);
        S.timer += dt;

        const adoptedCnt = S.nodes.filter((n: any) => n.adopted).length;
        const pct = adoptedCnt / S.nodes.length;

        if (S.timer > 0.22) {
          S.timer = 0;
          // Spread across nearby villagers when appeal or critical mass (16%) kicks in!
          const boost = pct >= 0.16 ? 1.8 : 0.6;
          S.nodes.forEach((n: any) => {
            if (n.adopted) return;
            const nearAdopted = S.nodes.some(
              (other: any) => other.adopted && Math.hypot(other.x - n.x, other.y - n.y) < 0.13
            );
            if (nearAdopted && Math.random() < S.appeal * 0.25 * boost && n.tier < S.appeal + pct * 0.7) {
              n.adopted = true;
              n.pulse = 1;
            }
          });
          S.hist.push(pct);
          if (S.hist.length > 70) S.hist.shift();
        }

        if (pct >= 0.16) hit(stageNum, 0);
        if (pct >= 0.75) hit(stageNum, 1, '跨过 16% 临界大众鸿沟：S 型扩散曲线完成全网爆发！');

        // Draw Village Network Links & Nodes
        for (let i = 0; i < S.nodes.length; i++) {
          const a = S.nodes[i];
          for (let j = i + 1; j < S.nodes.length; j++) {
            const b = S.nodes[j];
            if (Math.hypot(a.x - b.x, a.y - b.y) < 0.11) {
              ctx.strokeStyle = a.adopted && b.adopted ? 'rgba(251,191,36,0.45)' : 'rgba(148,163,184,0.16)';
              ctx.lineWidth = 1.2;
              ctx.beginPath();
              ctx.moveTo(W * a.x, H * a.y);
              ctx.lineTo(W * b.x, H * b.y);
              ctx.stroke();
            }
          }
        }
        S.nodes.forEach((n: any) => {
          if (n.pulse > 0) n.pulse = Math.max(0, n.pulse - dt * 2);
          const nx = W * n.x;
          const ny = H * n.y;
          if (n.pulse > 0) {
            ctx.strokeStyle = `rgba(251, 191, 36, ${n.pulse})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(nx, ny, 8 + (1 - n.pulse) * 18, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.fillStyle = n.adopted ? (n.tier < 0.16 ? '#c084fc' : '#fbbf24') : '#334155';
          ctx.beginPath();
          ctx.arc(nx, ny, 6.5, 0, Math.PI * 2);
          ctx.fill();
        });

        // Right: Live S-Curve Chart + 16% Chasm Line
        const cx = W * 0.64;
        const cw = W * 0.3;
        drawMonoNum(ctx, `累计采用率: ${Math.round(pct * 100)}%`, cx, H * 0.14, pct >= 0.16 ? '#fbbf24' : '#94a3b8', 15, 'left');
        drawSparkline(ctx, cx, H * 0.19, cw, H * 0.42, [{ data: S.hist, color: '#fbbf24', label: 'S 型扩散曲线' }], true);
        // 16% critical mass threshold dashed line
        const lineY = H * 0.19 + H * 0.42 - 8 - 0.16 * (H * 0.42 - 22);
        ctx.strokeStyle = '#ef4444';
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(cx + 8, lineY);
        ctx.lineTo(cx + cw - 8, lineY);
        ctx.stroke();
        ctx.setLineDash([]);
        drawLabel(ctx, '16% 临界大众线', cx + cw - 10, lineY - 5, '#fca5a5', 10.5, 'right');

        drawCompactSlider(
          ctx,
          cx,
          H * 0.74,
          cw,
          S.appeal,
          stageNum === 1 ? '人际口碑强度' : '相对优势与易用性',
          `${Math.round(S.appeal * 100)}%`,
          '#fbbf24',
          true
        );
        drawTinyHint(ctx, W, H, '点击左侧村落圆点播撒早期采用者种子，并调高右侧滑杆冲破 16% 临界红线观察 S 型曲线起飞', true);
      }
    });

    return { 1: makeDiffStage(1), 2: makeDiffStage(2) };
  }

  // ==================== #133 诺伯特·维纳 · 控制论 (Real Servo Needle + Wind Gust Disturbance + Hunting Oscillation) ====================
  if (modelId === 133) {
    let S: any = {};
    const makeCyberStage = (stageNum: number): StageEngine => ({
      init() {
        S = {
          target: 0.5,
          pos: 0.5,
          vel: 0,
          gain: stageNum === 1 ? 0.55 : 0.88,
          delay: stageNum === 1 ? 0.05 : 0.72,
          buffer: Array(40).fill(0.5),
          histPos: [0.5],
          histTgt: [0.5],
          drag: 0,
          gustT: 0,
          sampleT: 0
        };
      },
      down(x, y, { W, H, hit }) {
        const s1 = hitSlider(x, y, W * 0.08, H * 0.8, W * 0.38);
        if (s1 !== null) {
          S.drag = 1;
          if (stageNum === 1) S.target = s1;
          else S.delay = s1;
          return;
        }
        const s2 = hitSlider(x, y, W * 0.54, H * 0.8, W * 0.38);
        if (s2 !== null) {
          S.drag = 2;
          S.gain = s2;
          return;
        }
        // Click anywhere in arena to blast Wind Gust disturbance!
        S.vel += (Math.random() > 0.5 ? 1 : -1) * 1.4;
        S.gustT = 0.8;
        hit(stageNum, 0, '施加外部扰动：观察传感器误差如何驱动负反馈舵机纠偏！');
      },
      move(x, _y, _dx, _dy, { W }) {
        if (S.drag === 1) {
          const v = clamp((x - W * 0.08) / (W * 0.38), 0, 1);
          if (stageNum === 1) S.target = v;
          else S.delay = v;
        }
        if (S.drag === 2) S.gain = clamp((x - W * 0.54) / (W * 0.38), 0, 1);
      },
      up() {
        S.drag = 0;
      },
      tick({ ctx, W, H, dt, hit }) {
        drawPaperBg(ctx, W, H, true);
        if (S.gustT > 0) S.gustT = Math.max(0, S.gustT - dt * 1.5);

        // Push current position into delay ring buffer
        S.buffer.push(S.pos);
        if (S.buffer.length > 45) S.buffer.shift();
        const delayIdx = Math.max(0, S.buffer.length - 1 - Math.round(S.delay * 32));
        const sensedPos = S.buffer[delayIdx];

        const error = S.target - sensedPos;
        const accel = error * (2 + S.gain * 18) - S.vel * (stageNum === 1 ? 3.2 : 1.1);
        S.vel = clamp(S.vel + accel * dt, -3, 3);
        S.pos = clamp(S.pos + S.vel * dt, 0.04, 0.96);

        S.sampleT += dt;
        if (S.sampleT > 0.04) {
          S.sampleT = 0;
          S.histPos.push(S.pos);
          S.histTgt.push(S.target);
          if (S.histPos.length > 85) {
            S.histPos.shift();
            S.histTgt.shift();
          }
        }

        // Left: Ship Rudder / Servo Dial Gauge
        const gx = W * 0.24;
        const gy = H * 0.42;
        const r = Math.min(95, H * 0.26);
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.arc(gx, gy, r, Math.PI * 0.8, Math.PI * 2.2);
        ctx.stroke();

        // Target green tick
        const tAng = lerp(Math.PI * 0.8, Math.PI * 2.2, S.target);
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(gx + Math.cos(tAng) * (r - 14), gy + Math.sin(tAng) * (r - 14));
        ctx.lineTo(gx + Math.cos(tAng) * (r + 14), gy + Math.sin(tAng) * (r + 14));
        ctx.stroke();

        // Actual orange servo needle
        const pAng = lerp(Math.PI * 0.8, Math.PI * 2.2, S.pos);
        drawArrow(ctx, gx, gy, gx + Math.cos(pAng) * (r - 6), gy + Math.sin(pAng) * (r - 6), '#f59e0b', 3.5, 10);
        drawMonoNum(ctx, `误差 e=${(S.target - S.pos).toFixed(2)}`, gx, gy + r * 0.65, '#38bdf8', 13);

        // Right: Real-Time Servo Oscilloscope
        drawSparkline(
          ctx,
          W * 0.44,
          H * 0.14,
          W * 0.5,
          H * 0.5,
          [
            { data: S.histTgt, color: '#10b981', label: '目标值' },
            { data: S.histPos, color: '#f59e0b', label: '实测输出' }
          ],
          true
        );

        if (stageNum === 1 && Math.abs(S.target - S.pos) < 0.03 && S.gustT === 0) hit(1, 1);
        if (stageNum === 2) {
          if (Math.abs(S.vel) > 0.65) hit(2, 0, '反馈延迟 + 高增益导致剧烈猎振（目的性震颤）！');
          if (S.delay < 0.2 && Math.abs(S.vel) < 0.12) hit(2, 1, '降低延迟与合理阻尼：震荡迅速平息收敛！');
        }

        drawCompactSlider(
          ctx,
          W * 0.08,
          H * 0.8,
          W * 0.38,
          stageNum === 1 ? S.target : S.delay,
          stageNum === 1 ? '目标设定值 Setpoint' : '反馈信号延迟 Delay',
          stageNum === 1 ? `${Math.round(S.target * 100)}` : `${Math.round(S.delay * 100)}%`,
          stageNum === 1 ? '#10b981' : '#ef4444',
          true
        );
        drawCompactSlider(ctx, W * 0.54, H * 0.8, W * 0.38, S.gain, '负反馈增益 Gain', `${Math.round(S.gain * 100)}%`, '#f59e0b', true);
        drawTinyHint(ctx, W, H, '点击画布施加风浪扰动，观察舵机负反馈纠偏；拉高延迟触发过冲猎振', true);
      }
    });

    return { 1: makeCyberStage(1), 2: makeCyberStage(2) };
  }

  // ==================== #135 约翰·霍兰德 · 复杂适应系统 (Real 55-Bird Boids Flocking Physics!) ====================
  if (modelId === 135) {
    let S: any = {};
    const spawnBoids = () =>
      Array.from({ length: 55 }, () => ({
        x: Math.random(),
        y: 0.12 + Math.random() * 0.62,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28
      }));

    const makeCasStage = (stageNum: number): StageEngine => ({
      init() {
        S = {
          boids: spawnBoids(),
          align: stageNum === 1 ? 0.65 : 0.7,
          cohere: stageNum === 1 ? 0.65 : 0.5,
          drag: 0,
          pred: null as { x: number; y: number } | null
        };
      },
      down(x, y, { W, H, hit }) {
        const s1 = hitSlider(x, y, W * 0.08, H * 0.82, W * 0.38);
        if (s1 !== null) {
          S.drag = 1;
          S.align = s1;
          hit(stageNum, 0);
          return;
        }
        const s2 = hitSlider(x, y, W * 0.54, H * 0.82, W * 0.38);
        if (s2 !== null) {
          S.drag = 2;
          S.cohere = s2;
          hit(stageNum, 0);
          return;
        }
        S.pred = { x: x / W, y: y / H };
        hit(stageNum, 1, '无中央指挥：鸟群靠局部规则自发分流躲避捕食者并重新合拢！');
      },
      move(x, y, _dx, _dy, { W, H }) {
        if (S.drag === 1) S.align = clamp((x - W * 0.08) / (W * 0.38), 0, 1);
        else if (S.drag === 2) S.cohere = clamp((x - W * 0.54) / (W * 0.38), 0, 1);
        else if (S.pred) S.pred = { x: x / W, y: y / H };
      },
      up() {
        S.drag = 0;
        S.pred = null;
      },
      tick({ ctx, W, H, dt, hit }) {
        drawPaperBg(ctx, W, H, true);

        const boids = S.boids;
        for (let i = 0; i < boids.length; i++) {
          const b = boids[i];
          let sx = 0,
            sy = 0,
            ax = 0,
            ay = 0,
            cx = 0,
            cy = 0,
            cnt = 0;
          for (let j = 0; j < boids.length; j++) {
            if (i === j) continue;
            const o = boids[j];
            const dx = o.x - b.x;
            const dy = o.y - b.y;
            const d = Math.hypot(dx, dy);
            if (d < 0.11 && d > 0.001) {
              ax += o.vx;
              ay += o.vy;
              cx += o.x;
              cy += o.y;
              cnt++;
              if (d < 0.036) {
                sx -= dx / d;
                sy -= dy / d;
              }
            }
          }
          if (cnt > 0) {
            ax = ax / cnt - b.vx;
            ay = ay / cnt - b.vy;
            cx = cx / cnt - b.x;
            cy = cy / cnt - b.y;
            b.vx += (sx * 0.35 + ax * S.align * 2.2 + cx * S.cohere * 1.4) * dt;
            b.vy += (sy * 0.35 + ay * S.align * 2.2 + cy * S.cohere * 1.4) * dt;
          }
          // Flee pointer predator
          if (S.pred) {
            const dx = b.x - S.pred.x;
            const dy = b.y - S.pred.y;
            const d = Math.hypot(dx, dy);
            if (d < 0.18 && d > 0.001) {
              b.vx += (dx / d) * 1.6 * dt;
              b.vy += (dy / d) * 1.6 * dt;
            }
          }
          // Speed clamp
          const sp = Math.hypot(b.vx, b.vy) || 0.01;
          const targetSp = 0.24;
          b.vx = (b.vx / sp) * lerp(sp, targetSp, dt * 4);
          b.vy = (b.vy / sp) * lerp(sp, targetSp, dt * 4);

          b.x += b.vx * dt;
          b.y += b.vy * dt;
          if (b.x < 0.04) b.vx += 0.5 * dt;
          if (b.x > 0.96) b.vx -= 0.5 * dt;
          if (b.y < 0.06) b.vy += 0.5 * dt;
          if (b.y > 0.72) b.vy -= 0.5 * dt;

          // Draw bird triangle oriented along velocity
          const ang = Math.atan2(b.vy, b.vx);
          ctx.save();
          ctx.translate(W * b.x, H * b.y);
          ctx.rotate(ang);
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.moveTo(9, 0);
          ctx.lineTo(-6, -4.5);
          ctx.lineTo(-3, 0);
          ctx.lineTo(-6, 4.5);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }

        if (S.pred) {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
          ctx.beginPath();
          ctx.arc(W * S.pred.x, H * S.pred.y, 44, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(W * S.pred.x, H * S.pred.y, 10, 0, Math.PI * 2);
          ctx.fill();
        }

        if (S.align > 0.5 && S.cohere > 0.5) hit(stageNum, 0);

        drawCompactSlider(
          ctx,
          W * 0.08,
          H * 0.82,
          W * 0.38,
          S.align,
          stageNum === 1 ? '方向对齐 Alignment' : '经验利用 Exploitation',
          `${Math.round(S.align * 100)}%`,
          '#38bdf8',
          true
        );
        drawCompactSlider(
          ctx,
          W * 0.54,
          H * 0.82,
          W * 0.38,
          S.cohere,
          stageNum === 1 ? '向心内聚 Cohesion' : '新规则探索 Exploration',
          `${Math.round(S.cohere * 100)}%`,
          '#fbbf24',
          true
        );
        drawTinyHint(ctx, W, H, '按住天空任意处化作红色老鹰追逐鸟群：看 55 只无领头鸟如何凭局部规则涌现分流与合拢', true);
      }
    });

    return { 1: makeCasStage(1), 2: makeCasStage(2) };
  }

  // ==================== #136 爱德华·洛伦兹 · 混沌理论 (Real 60fps RK4 Lorenz Butterfly Attractor!) ====================
  if (modelId === 136) {
    let S: any = {};
    const rk4Step = (p: { x: number; y: number; z: number }, rho: number, dt: number) => {
      const sigma = 10;
      const beta = 8 / 3;
      const dx = (x: number, y: number) => sigma * (y - x);
      const dy = (x: number, y: number, z: number) => x * (rho - z) - y;
      const dz = (x: number, y: number, z: number) => x * y - beta * z;
      const k1x = dx(p.x, p.y),
        k1y = dy(p.x, p.y, p.z),
        k1z = dz(p.x, p.y, p.z);
      const k2x = dx(p.x + 0.5 * dt * k1x, p.y + 0.5 * dt * k1y),
        k2y = dy(p.x + 0.5 * dt * k1x, p.y + 0.5 * dt * k1y, p.z + 0.5 * dt * k1z),
        k2z = dz(p.x + 0.5 * dt * k1x, p.y + 0.5 * dt * k1y, p.z + 0.5 * dt * k1z);
      p.x += dt * k2x;
      p.y += dt * k2y;
      p.z += dt * k2z;
    };

    const makeLorenzStage = (stageNum: number): StageEngine => ({
      init() {
        S = {
          p1: { x: 1, y: 1, z: 20 },
          p2: { x: 1.0005, y: 1, z: 20 },
          t1: [] as any[],
          t2: [] as any[],
          distHist: [0],
          yaw: 0.4,
          rho: 28,
          drag: 0,
          eps: 0.0005
        };
      },
      down(x, y, { W, H }) {
        const s = hitSlider(x, y, W * 0.18, H * 0.82, W * 0.64);
        if (s !== null) {
          S.drag = 1;
          if (stageNum === 1) {
            S.eps = 0.0001 + s * 0.05;
            S.p1 = { x: 1, y: 1, z: 20 };
            S.p2 = { x: 1 + S.eps, y: 1, z: 20 };
            S.t1 = [];
            S.t2 = [];
            S.distHist = [0];
          } else {
            S.rho = 12 + s * 20;
          }
          return;
        }
        S.drag = 2;
      },
      move(x, _y, dx, _dy, { W }) {
        if (S.drag === 1) {
          const s = clamp((x - W * 0.18) / (W * 0.64), 0, 1);
          if (stageNum === 1) {
            S.eps = 0.0001 + s * 0.05;
          } else {
            S.rho = 12 + s * 20;
          }
        } else if (S.drag === 2) {
          S.yaw += dx * 0.01;
        }
      },
      up() {
        if (S.drag === 1 && stageNum === 1) {
          S.p1 = { x: 1, y: 1, z: 20 };
          S.p2 = { x: 1 + S.eps, y: 1, z: 20 };
          S.t1 = [];
          S.t2 = [];
          S.distHist = [0];
        }
        S.drag = 0;
      },
      tick({ ctx, W, H, dt, hit }) {
        drawPaperBg(ctx, W, H, true);
        if (S.drag !== 2) S.yaw += dt * 0.18;

        for (let k = 0; k < 4; k++) {
          rk4Step(S.p1, S.rho, 0.006);
          rk4Step(S.p2, S.rho, 0.006);
          S.t1.push({ ...S.p1 });
          S.t2.push({ ...S.p2 });
          if (S.t1.length > 420) S.t1.shift();
          if (S.t2.length > 420) S.t2.shift();
        }

        const dist = Math.hypot(S.p1.x - S.p2.x, S.p1.y - S.p2.y, S.p1.z - S.p2.z);
        S.distHist.push(clamp(dist / 35, 0, 1));
        if (S.distHist.length > 90) S.distHist.shift();

        const cx = W * 0.38;
        const cy = H * 0.44;
        const sc = Math.min(W, H) * 0.0155;
        const cosY = Math.cos(S.yaw);
        const sinY = Math.sin(S.yaw);
        const proj = (p: any) => ({
          x: cx + (p.x * cosY - p.y * sinY) * sc,
          y: cy - (p.z - 25) * sc
        });

        const drawTrail = (arr: any[], color: string) => {
          if (arr.length < 2) return;
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          arr.forEach((p, i) => {
            const q = proj(p);
            if (i === 0) ctx.moveTo(q.x, q.y);
            else ctx.lineTo(q.x, q.y);
          });
          ctx.stroke();
          const head = proj(arr[arr.length - 1]);
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(head.x, head.y, 4.5, 0, Math.PI * 2);
          ctx.fill();
        };

        drawTrail(S.t1, '#38bdf8');
        drawTrail(S.t2, '#f97316');

        // Right: Live Divergence Meter
        drawSparkline(ctx, W * 0.68, H * 0.16, W * 0.27, H * 0.46, [{ data: S.distHist, color: '#f97316', label: `轨迹间距 Δ=${dist.toFixed(1)}` }], true);

        if (S.t1.length > 60) hit(stageNum, 0);
        if (dist > 14 || (stageNum === 2 && S.t1.length > 200)) {
          hit(stageNum, 1, '微小的初始误差呈指数放大，但轨迹始终被约束在双翼奇异吸引子之内！');
        }

        drawCompactSlider(
          ctx,
          W * 0.18,
          H * 0.82,
          W * 0.64,
          stageNum === 1 ? (S.eps - 0.0001) / 0.05 : (S.rho - 12) / 20,
          stageNum === 1 ? '初始微差 Δx₀ (蓝线 vs 橙线)' : '瑞利数参数 ρ (分岔进入混沌)',
          stageNum === 1 ? S.eps.toFixed(4) : `ρ = ${S.rho.toFixed(1)}`,
          '#f97316',
          true
        );
        drawTinyHint(ctx, W, H, '直接拖动三维蝴蝶旋转视角：观察蓝/橙两条几乎重合的轨迹如何在某一刻突然分道扬镳', true);
      }
    });

    return { 1: makeLorenzStage(1), 2: makeLorenzStage(2) };
  }

  return null;
}
