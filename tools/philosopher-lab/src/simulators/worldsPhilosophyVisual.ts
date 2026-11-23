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
  drawTinyHint
} from './visualPrimitives';

export function createPhilosophyVisualWorld(modelId: number, stageId: number): StageEngine | null {
  const trigger = (hit: (l: number, i: number, m?: string) => void, idx: number, msg?: string) => {
    hit(stageId, idx, msg);
  };

  // ==================== #51 洛克 · 自然权利 (Orchard, Labor Mixing & Enough-and-as-Good Proviso) ====================
  if (modelId === 51) {
    let S: any = {};
    return {
      init() {
        S = {
          harvest: 0.25,
          drag: false,
          apples: Array.from({ length: 18 }, (_, i) => ({
            x: 0.18 + (i % 6) * 0.125,
            y: 0.28 + Math.floor(i / 6) * 0.12,
            picked: false
          })),
          t: 0
        };
      },
      down(x, y, { W, H }) {
        if (hitSlider(x, y, W * 0.18, H * 0.8, W * 0.64)) {
          S.drag = true;
          S.harvest = clamp((x - W * 0.18) / (W * 0.64), 0, 1);
        }
      },
      move(x, _y, _dx, _dy, { W }) {
        if (S.drag) S.harvest = clamp((x - W * 0.18) / (W * 0.64), 0, 1);
      },
      up() {
        S.drag = false;
      },
      tick({ ctx, W, H, dt, hit }) {
        S.t += dt;
        drawPaperBg(ctx, W, H, false);
        const pickedCount = Math.round(S.harvest * S.apples.length);
        const spoiled = pickedCount > 11; // Lockean Spoilage & Enough-and-as-Good Proviso
        if (pickedCount >= 4 && pickedCount <= 10) trigger(hit, 0, '劳动混入自然物，使公有果实转化为正当私有财产权');
        if (spoiled) {
          trigger(hit, 1, '超出自身享用而令果实腐烂，违背洛克「留有足够且同样好」限制条款！');
          trigger(hit, 2);
        }

        // Common meadow + private fenced basket
        ctx.fillStyle = '#dcfce7';
        ctx.fillRect(W * 0.1, H * 0.18, W * 0.8, H * 0.48);
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 3;
        const fenceX = W * 0.1 + S.harvest * W * 0.72;
        ctx.strokeRect(W * 0.1, H * 0.18, Math.max(24, fenceX - W * 0.1), H * 0.48);
        drawLabel(ctx, '私有围栏', (W * 0.1 + fenceX) / 2, H * 0.22, '#78350f', 11.5, 'center', true);
        drawLabel(ctx, '公共共有地', Math.min(W * 0.84, fenceX + 52), H * 0.22, '#166534', 11.5, 'center', true);

        S.apples.forEach((a: any, i: number) => {
          const isPicked = i < pickedCount;
          const isRot = isPicked && i >= 11;
          ctx.fillStyle = isRot ? '#78716c' : isPicked ? '#dc2626' : '#22c55e';
          ctx.beginPath();
          ctx.arc(a.x * W, a.y * H, 11, 0, Math.PI * 2);
          ctx.fill();
          if (isRot) drawLabel(ctx, '✕', a.x * W, a.y * H + 4, '#fff', 10, 'center', true);
        });

        drawMonoNum(
          ctx,
          `圈占果实: ${pickedCount}/18  |  ${spoiled ? '腐烂浪费 · 违反洛克但书!' : '正当劳动所得 ✓'}`,
          W * 0.5,
          H * 0.1,
          spoiled ? '#dc2626' : '#059669',
          14,
          'center'
        );
        drawCompactSlider(ctx, W * 0.18, H * 0.8, W * 0.64, S.harvest, '投入劳动圈占比例', `${Math.round(S.harvest * 100)}%`, spoiled ? '#dc2626' : '#059669');
        drawTinyHint(ctx, W, H, '拖动围栏扩展劳动圈占范围，观察「留有足够且同样好」的自然法红线');
      }
    };
  }

  // ==================== #52 卢梭 · 公意理论 (12 Citizen Vectors: Private Will vs General Will) ====================
  if (modelId === 52) {
    let S: any = {};
    return {
      init() {
        S = {
          civic: 0.2,
          drag: false,
          angles: Array.from({ length: 12 }, (_, i) => (i * 1.9) % (Math.PI * 2)),
          t: 0
        };
      },
      down(x, y, { W, H }) {
        if (hitSlider(x, y, W * 0.18, H * 0.8, W * 0.64)) {
          S.drag = true;
          S.civic = clamp((x - W * 0.18) / (W * 0.64), 0, 1);
        }
      },
      move(x, _y, _dx, _dy, { W }) {
        if (S.drag) S.civic = clamp((x - W * 0.18) / (W * 0.64), 0, 1);
      },
      up() {
        S.drag = false;
      },
      tick({ ctx, W, H, dt, hit }) {
        S.t += dt;
        drawPaperBg(ctx, W, H, true);
        if (S.civic < 0.25) trigger(hit, 0, '众意 (Will of All)：私利矢量相互抵消，合力归零');
        if (S.civic > 0.78) {
          trigger(hit, 1, '公意 (General Will)：各公民超越私利对齐公共善，涌现强大共同合力！');
          trigger(hit, 2);
        }

        const cx = W * 0.5;
        const cy = H * 0.44;
        let sumX = 0;
        let sumY = 0;
        S.angles.forEach((rawA: number, i: number) => {
          const px = W * 0.18 + (i % 6) * (W * 0.128);
          const py = H * 0.28 + Math.floor(i / 6) * (H * 0.3);
          // Target common angle is -PI/2 (upward)
          const ang = lerp(rawA, -Math.PI / 2, S.civic);
          sumX += Math.cos(ang);
          sumY += Math.sin(ang);
          drawArrow(ctx, px, py, px + Math.cos(ang) * 32, py + Math.sin(ang) * 32, S.civic > 0.6 ? '#34d399' : '#fb923c', 2.6, 8);
          ctx.fillStyle = '#e2e8f0';
          ctx.beginPath();
          ctx.arc(px, py, 4.5, 0, Math.PI * 2);
          ctx.fill();
        });

        const mag = Math.hypot(sumX, sumY) / 12;
        drawArrow(ctx, cx, cy + 40, cx + (sumX / 12) * 90, cy + 40 + (sumY / 12) * 90, '#facc15', 5, 13);
        drawMonoNum(ctx, `公共合力指数: ${Math.round(mag * 100)}%`, cx, H * 0.1, mag > 0.7 ? '#34d399' : '#fb923c', 15, 'center');
        drawCompactSlider(ctx, W * 0.18, H * 0.8, W * 0.64, S.civic, '公民公心共识度（私利众意 ↔ 公共公意）', `${Math.round(S.civic * 100)}%`, '#34d399', true);
        drawTinyHint(ctx, W, H, '拖动共识滑块对齐 12 枚公民意志矢量，看中央金色「公意合力」拔地而起', true);
      }
    };
  }

  // ==================== #53 诺齐克 · 权利与分配 (Wilt Chamberlain Coin Box — Free Transfers Break Pattern) ====================
  if (modelId === 53) {
    let S: any = {};
    return {
      init() {
        S = { fansPaid: 0, wiltCoins: 10, others: Array(8).fill(10), flights: [] as any[], t: 0 };
      },
      down(x, y, { W, H }) {
        if (hitBox(x, y, W * 0.18, H * 0.8, 175, 34)) {
          // Each fan voluntarily drops 1 coin into Wilt's box!
          S.fansPaid++;
          const idx = S.fansPaid % 8;
          if (S.others[idx] > 2) {
            S.others[idx] -= 2;
            S.wiltCoins += 2;
            S.flights.push({ sx: W * 0.16 + idx * 62, sy: H * 0.56, p: 0 });
          }
        } else if (hitBox(x, y, W * 0.52, H * 0.8, 175, 34)) {
          S.fansPaid = 0;
          S.wiltCoins = 10;
          S.others = Array(8).fill(10);
        }
      },
      tick({ ctx, W, H, dt, hit }) {
        S.t += dt;
        drawPaperBg(ctx, W, H, false);
        if (S.fansPaid >= 3) trigger(hit, 0, '自由自愿的 25 美分门票交易，瞬间打破最初完全平均的 D1 格局！');
        if (S.fansPaid >= 6) {
          trigger(hit, 1, '诺齐克追问：若起点公正且每步交易皆自愿，凭何强制没收张伯伦所得？');
          trigger(hit, 2);
        }

        // Wilt Chamberlain tower on right
        const wx = W * 0.82;
        const baseY = H * 0.66;
        const wH = Math.min(180, S.wiltCoins * 5);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(wx - 28, baseY - wH, 56, wH);
        drawLabel(ctx, '张伯伦', wx, baseY + 20, '#b45309', 12, 'center', true);
        drawMonoNum(ctx, `$${S.wiltCoins}`, wx, baseY - wH - 8, '#b45309', 13, 'center');

        // 8 Fan towers on left
        S.others.forEach((c: number, i: number) => {
          const fx = W * 0.12 + i * (W * 0.075);
          const fh = c * 5;
          ctx.fillStyle = '#2563eb';
          ctx.fillRect(fx - 14, baseY - fh, 28, fh);
          drawMonoNum(ctx, `${c}`, fx, baseY - fh - 6, '#1e3a8a', 10, 'center');
        });
        drawLabel(ctx, '8 位球迷（自愿购票）', W * 0.38, baseY + 20, '#1e3a8a', 12, 'center', true);

        // Flying coins
        S.flights.forEach((f: any) => {
          f.p += dt * 2.5;
          const cx = lerp(f.sx, wx, f.p);
          const cy = lerp(f.sy, baseY - wH, f.p) - Math.sin(f.p * Math.PI) * 55;
          drawCoin(ctx, cx, cy, 7, '$');
        });
        S.flights = S.flights.filter((f: any) => f.p < 1);

        drawMonoNum(ctx, S.fansPaid === 0 ? '初始平等格局 D1 (人人 $10)' : `自愿交易 ${S.fansPaid} 次 → 新格局 D2 (不均等但合法)`, W * 0.5, H * 0.1, '#0f172a', 14, 'center');
        drawToggleButton(ctx, W * 0.18, H * 0.8, 175, 34, '球迷自愿投币看球 +$2', true, '#d97706');
        drawToggleButton(ctx, W * 0.52, H * 0.8, 175, 34, '强制重分回平等 D1', false, '#64748b');
        drawTinyHint(ctx, W, H, '连续点击「球迷自愿投币」，亲眼见证自由行动如何瓦解静态模式化分配');
      }
    };
  }

  // ==================== #54 森 · 能力方法 (Same Bicycle + Different Riders & Road Ramp) ====================
  if (modelId === 54) {
    let S: any = {};
    return {
      init() {
        S = { road: 0.15, ramp: false, bikeX: 0.2, t: 0, drag: false };
      },
      down(x, y, { W, H }) {
        if (hitSlider(x, y, W * 0.14, H * 0.8, W * 0.42)) {
          S.drag = true;
          S.road = clamp((x - W * 0.14) / (W * 0.42), 0, 1);
        } else if (hitBox(x, y, W * 0.62, H * 0.76, 175, 34)) {
          S.ramp = !S.ramp;
        }
      },
      move(x, _y, _dx, _dy, { W }) {
        if (S.drag) S.road = clamp((x - W * 0.14) / (W * 0.42), 0, 1);
      },
      up() {
        S.drag = false;
      },
      tick({ ctx, W, H, dt, hit }) {
        S.t += dt;
        drawPaperBg(ctx, W, H, false);
        const speedA = 0.08 + S.road * 0.22;
        const speedB = S.ramp ? 0.08 + S.road * 0.2 : 0.01;
        S.bikeX = (S.bikeX + dt * speedA) % 0.78;

        if (!S.ramp) trigger(hit, 0, '同样的资源（自行车）对行动受限者无法直接转化为出行能力');
        if (S.ramp && S.road > 0.65) {
          trigger(hit, 1, '改善无障碍设施与社会转化条件，才真正拓展了人的实质自由（能力）！');
          trigger(hit, 2);
        }

        // Two horizontal tracks: Rider A (top) vs Wheelchair/Adapted Rider B (bottom)
        [
          { y: H * 0.34, lbl: '骑行者 A（相同资源）', spd: speedA, col: '#0284c7', bx: (S.t * speedA * 220) % (W * 0.7) },
          { y: H * 0.56, lbl: S.ramp ? '行动不便者 B（有无障碍改造）' : '行动不便者 B（无设施支持）', spd: speedB, col: S.ramp ? '#059669' : '#dc2626', bx: S.ramp ? (S.t * speedB * 220) % (W * 0.7) : 20 }
        ].forEach((lane) => {
          ctx.strokeStyle = S.road > 0.5 ? '#334155' : '#a16207';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(W * 0.12, lane.y + 16);
          ctx.lineTo(W * 0.88, lane.y + 16);
          ctx.stroke();

          // Wheels
          const cx = W * 0.14 + lane.bx;
          ctx.strokeStyle = lane.col;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(cx - 12, lane.y + 6, 10, 0, Math.PI * 2);
          ctx.arc(cx + 12, lane.y + 6, 10, 0, Math.PI * 2);
          ctx.stroke();
          drawLabel(ctx, lane.lbl, W * 0.12, lane.y - 18, lane.col, 12, 'left', true);
        });

        drawMonoNum(ctx, `实质出行能力覆盖率: ${S.ramp ? Math.round(50 + S.road * 50) : Math.round(25 + S.road * 25)}%`, W * 0.5, H * 0.1, S.ramp ? '#059669' : '#d97706', 14.5, 'center');
        drawCompactSlider(ctx, W * 0.14, H * 0.8, W * 0.42, S.road, '公共道路与教育条件', `${Math.round(S.road * 100)}%`, '#0284c7');
        drawToggleButton(ctx, W * 0.62, H * 0.76, 175, 34, S.ramp ? '无障碍转化设施 ✓' : '增设无障碍转化设施', S.ramp, '#059669');
        drawTinyHint(ctx, W, H, '相同资源不等于相同能力：铺平公共条件并开启无障碍设施，看两位出行者同步疾驰');
      }
    };
  }

  // ==================== #55 吉利根 · 关怀伦理 (Glowing Web of Relationships vs Detached Scale) ====================
  if (modelId === 55) {
    let S: any = {};
    return {
      init() {
        S = { careMode: true, pulse: 0, clickedNodes: new Set<number>(), t: 0 };
      },
      down(x, y, { W, H }) {
        if (hitBox(x, y, W * 0.34, H * 0.8, 200, 34)) {
          S.careMode = !S.careMode;
          return;
        }
        const cx = W * 0.5;
        const cy = H * 0.44;
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          if (Math.hypot(x - (cx + Math.cos(a) * 95), y - (cy + Math.sin(a) * 76)) < 26) {
            S.clickedNodes.add(i);
            S.pulse = 1;
          }
        }
      },
      tick({ ctx, W, H, dt, hit }) {
        S.t += dt;
        S.pulse = Math.max(0, S.pulse - dt * 1.4);
        drawPaperBg(ctx, W, H, true);
        const cx = W * 0.5;
        const cy = H * 0.44;
        const roles = ['自己', '病重家人', '药剂师', '邻居', '幼童', '社区'];
        const pts = roles.map((r, i) => {
          const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
          return { x: cx + Math.cos(a) * 108, y: cy + Math.sin(a) * 82, r };
        });

        if (S.careMode && S.clickedNodes.size >= 1) trigger(hit, 0, '关怀伦理将道德视作关系网络中的具体回应与维系');
        if (!S.careMode) {
          trigger(hit, 1, '抽象权利天平追求普遍规则，却容易割断具体脆弱者的联结');
          trigger(hit, 2);
        }

        // Draw web edges in Care mode vs detached rigid boxes in Justice-only mode
        if (S.careMode) {
          for (let i = 0; i < pts.length; i++) {
            for (let j = i + 1; j < pts.length; j++) {
              ctx.strokeStyle = 'rgba(244, 114, 182, 0.45)';
              ctx.lineWidth = 1.8 + S.pulse * 2;
              ctx.beginPath();
              ctx.moveTo(pts[i].x, pts[i].y);
              ctx.lineTo(pts[j].x, pts[j].y);
              ctx.stroke();
            }
          }
        } else {
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(cx - 110, cy);
          ctx.lineTo(cx + 110, cy);
          ctx.stroke();
          drawLabel(ctx, '抽象规则边界', cx, cy - 12, '#94a3b8', 11.5, 'center', true);
        }

        pts.forEach((p, i) => {
          const lit = S.clickedNodes.has(i);
          ctx.fillStyle = S.careMode ? (lit ? '#f472b6' : '#ec4899') : '#475569';
          ctx.beginPath();
          ctx.arc(p.x, p.y, lit ? 22 : 18, 0, Math.PI * 2);
          ctx.fill();
          drawLabel(ctx, p.r, p.x, p.y + 4, '#fff', 10.5, 'center', true);
        });

        drawMonoNum(ctx, S.careMode ? '关系之网 · 倾听与回应具体脆弱者' : '抽象天平 · 独立原子个体', cx, H * 0.1, S.careMode ? '#f472b6' : '#94a3b8', 14.5, 'center');
        drawToggleButton(ctx, W * 0.34, H * 0.8, 200, 34, S.careMode ? '切换至抽象规则视角' : '切换回关怀关系网络', S.careMode, '#db2777', true);
        drawTinyHint(ctx, W, H, '点击关系网中的节点传递温暖脉冲，并切换「关系网 / 抽象天平」道德视角', true);
      }
    };
  }

  // ==================== #56 麦金太尔 · 实践与德性 (Chessboard: Candy Bribe vs Internal Skill Mastery) ====================
  if (modelId === 56) {
    let S: any = {};
    return {
      init() {
        S = { motive: 0, skill: 0.25, t: 0, visited: new Set([0]) }; // 0=Candy (External), 1=Mastery (Internal)
      },
      down(x, y, { W, H }) {
        if (hitBox(x, y, W * 0.18, H * 0.8, 175, 34)) {
          S.motive = 0;
          S.visited.add(0);
        } else if (hitBox(x, y, W * 0.52, H * 0.8, 175, 34)) {
          S.motive = 1;
          S.visited.add(1);
        }
      },
      tick({ ctx, W, H, dt, hit }) {
        S.t += dt;
        drawPaperBg(ctx, W, H, false);
        S.skill = lerp(S.skill, S.motive === 1 ? 0.94 : 0.28, dt * 1.4);
        if (S.visited.has(0) && S.t > 0.8) trigger(hit, 0, '若只为外在善（糖果/金钱）下棋，孩子一有机会就会作弊');
        if (S.visited.has(1)) {
          trigger(hit, 1, '当爱上棋艺本身的内在善，诚实、耐心与卓越德性随之生长！');
          trigger(hit, 2);
        }

        // Draw 6x4 Chessboard center
        const bx = W * 0.5 - 108;
        const by = H * 0.24;
        const cs = 36;
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 6; c++) {
            ctx.fillStyle = (r + c) % 2 === 0 ? '#fef3c7' : '#78350f';
            ctx.fillRect(bx + c * cs, by + r * cs, cs, cs);
          }
        }
        // Moving chess piece (smooth knight jump when internal, jittery cheat jump when external!)
        const p = (S.t * 0.8) % 1;
        const px = bx + lerp(18, 198, p);
        const py = by + 72 - Math.abs(Math.sin(p * Math.PI * 2)) * 28;
        ctx.fillStyle = S.motive === 1 ? '#059669' : '#dc2626';
        ctx.beginPath();
        ctx.arc(px, py, 13, 0, Math.PI * 2);
        ctx.fill();
        drawLabel(ctx, S.motive === 1 ? '♔' : '🍬', px, py + 5, '#fff', 14, 'center', true);

        drawMonoNum(ctx, `棋艺内在卓越度: ${Math.round(S.skill * 100)}%  |  作弊诱惑: ${S.motive === 1 ? '0%' : '85%'}`, W * 0.5, H * 0.12, S.motive === 1 ? '#059669' : '#dc2626', 14, 'center');
        drawToggleButton(ctx, W * 0.18, H * 0.8, 175, 34, '外在善激励 (赢了给糖)', S.motive === 0, '#dc2626');
        drawToggleButton(ctx, W * 0.52, H * 0.8, 175, 34, '内在善热爱 (爱上棋艺)', S.motive === 1, '#059669');
        drawTinyHint(ctx, W, H, '切换外在糖果诱因与内在棋艺热爱，对比实践共同体中的德性生长');
      }
    };
  }

  // ==================== #59 德谟克利特 · 原子论 (Colliding Atoms in Void Forming Gas/Liquid/Crystal) ====================
  if (modelId === 59) {
    let S: any = {};
    return {
      init() {
        S = {
          temp: 0.7,
          drag: false,
          atoms: Array.from({ length: 28 }, (_, i) => ({
            x: 0.2 + (i % 7) * 0.1,
            y: 0.25 + Math.floor(i / 7) * 0.11,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            shape: i % 3
          }))
        };
      },
      down(x, y, { W, H }) {
        if (hitSlider(x, y, W * 0.18, H * 0.8, W * 0.64)) {
          S.drag = true;
          S.temp = clamp((x - W * 0.18) / (W * 0.64), 0, 1);
        }
      },
      move(x, _y, _dx, _dy, { W }) {
        if (S.drag) S.temp = clamp((x - W * 0.18) / (W * 0.64), 0, 1);
      },
      up() {
        S.drag = false;
      },
      tick({ ctx, W, H, dt, hit }) {
        drawPaperBg(ctx, W, H, true);
        if (S.temp < 0.22) trigger(hit, 0, '相同不可分原子紧密排列，宏观涌现为坚硬晶体！');
        if (S.temp > 0.78) {
          trigger(hit, 1, '原子在虚空中高速碰撞散开，宏观呈现为无形气体——万物唯原子与虚空');
          trigger(hit, 2);
        }

        // Void chamber
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.strokeRect(W * 0.12, H * 0.16, W * 0.76, H * 0.52);

        S.atoms.forEach((a: any, i: number) => {
          const gridX = 0.28 + (i % 7) * 0.072;
          const gridY = 0.3 + Math.floor(i / 7) * 0.095;
          if (S.temp < 0.28) {
            a.x = lerp(a.x, gridX, dt * 4);
            a.y = lerp(a.y, gridY, dt * 4);
          } else {
            a.x += a.vx * dt * (0.2 + S.temp * 1.6);
            a.y += a.vy * dt * (0.2 + S.temp * 1.6);
            if (a.x < 0.15 || a.x > 0.85) a.vx *= -1;
            if (a.y < 0.2 || a.y > 0.64) a.vy *= -1;
          }
          ctx.fillStyle = a.shape === 0 ? '#38bdf8' : a.shape === 1 ? '#fbbf24' : '#34d399';
          ctx.beginPath();
          ctx.arc(a.x * W, a.y * H, 8, 0, Math.PI * 2);
          ctx.fill();
        });

        drawMonoNum(
          ctx,
          S.temp < 0.28 ? '宏观态: 固态晶体 (有序咬合)' : S.temp < 0.65 ? '宏观态: 流动液体' : '宏观态: 弥散气体 (虚空碰撞)',
          W * 0.5,
          H * 0.1,
          '#38bdf8',
          14.5,
          'center'
        );
        drawCompactSlider(ctx, W * 0.18, H * 0.8, W * 0.64, S.temp, '原子动能与排列松散度', `${Math.round(S.temp * 100)}%`, '#38bdf8', true);
        drawTinyHint(ctx, W, H, '拉动原子动能滑块，看同一批不可分原子如何在虚空中组合出固、液、气三态', true);
      }
    };
  }

  // ==================== #60 阿奎那 · 本质与存在 (Blueprint Phoenix vs Spark of Existence) ====================
  if (modelId === 60) {
    let S: any = {};
    return {
      init() {
        S = { essence: 0, ignited: false, t: 0 };
      },
      down(x, y, { W, H }) {
        if (hitBox(x, y, W * 0.18, H * 0.8, 175, 34)) S.essence = (S.essence + 1) % 3;
        if (hitBox(x, y, W * 0.52, H * 0.8, 175, 34)) S.ignited = !S.ignited;
      },
      tick({ ctx, W, H, dt, hit }) {
        S.t += dt;
        drawPaperBg(ctx, W, H, true);
        if (!S.ignited) trigger(hit, 0, '你可以精确描绘凤凰/独角兽的「本质」蓝图，却不知它是否实际「存在」');
        if (S.ignited) {
          trigger(hit, 1, '存在 (Esse) 是使本质从潜能跃迁为现实的现实性火花！');
          trigger(hit, 2);
        }

        const cx = W * 0.5;
        const cy = H * 0.43;
        const names = ['凤凰 (本质蓝图)', '独角兽 (本质蓝图)', '三角形 (几何本质)'];
        // Draw wireframe blueprint vs glowing solid manifestation
        ctx.strokeStyle = S.ignited ? '#facc15' : '#38bdf8';
        ctx.fillStyle = S.ignited ? 'rgba(250, 204, 21, 0.35)' : 'rgba(56, 189, 248, 0.06)';
        ctx.lineWidth = S.ignited ? 3.5 : 2;
        if (!S.ignited) ctx.setLineDash([6, 5]);
        ctx.beginPath();
        const sides = S.essence === 2 ? 3 : S.essence === 1 ? 5 : 8;
        for (let i = 0; i <= sides; i++) {
          const a = (i / sides) * Math.PI * 2 + S.t * 0.4;
          const r = i % 2 === 0 ? 78 : 50;
          const px = cx + Math.cos(a) * r;
          const py = cy + Math.sin(a) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);

        drawMonoNum(ctx, `${names[S.essence]}  ·  ${S.ignited ? '已获「存在」现实性 ✨' : '仅存潜能概念'}`, cx, H * 0.1, S.ignited ? '#fde047' : '#38bdf8', 14.5, 'center');
        drawToggleButton(ctx, W * 0.18, H * 0.8, 175, 34, '切换本质蓝图 ✦', false, '#0284c7', true);
        drawToggleButton(ctx, W * 0.52, H * 0.8, 175, 34, S.ignited ? '熄灭现实存在' : '注入存在火花 (Esse) ⚡', S.ignited, '#d97706', true);
        drawTinyHint(ctx, W, H, '切换本质蓝图并点亮/熄灭「存在火花」，区分「是什么」与「是否存在」', true);
      }
    };
  }

  // ==================== #61 伯克莱 · 唯心主义 (Eye Spotlight Cone — Esse Est Percipi) ====================
  if (modelId === 61) {
    let S: any = {};
    return {
      init() {
        S = { eyeOpen: true, gazeAngle: 0, godEye: false, drag: false };
      },
      down(x, y, { W, H }) {
        if (hitBox(x, y, W * 0.16, H * 0.8, 170, 34)) {
          S.eyeOpen = !S.eyeOpen;
          return;
        }
        if (hitBox(x, y, W * 0.52, H * 0.8, 175, 34)) {
          S.godEye = !S.godEye;
          return;
        }
        S.drag = true;
        S.gazeAngle = clamp((y - H * 0.45) / (H * 0.25), -1, 1);
      },
      move(_x, y, _dx, _dy, { H }) {
        if (S.drag) S.gazeAngle = clamp((y - H * 0.45) / (H * 0.25), -1, 1);
      },
      up() {
        S.drag = false;
      },
      tick({ ctx, W, H, hit }) {
        drawPaperBg(ctx, W, H, true);
        if (!S.eyeOpen && !S.godEye) trigger(hit, 0, '存在就是被感知：移开感知之光，所谓独立「物质」无从显现');
        if (S.godEye) {
          trigger(hit, 1, '伯克莱的解答：当我们闭眼时，房间仍因永恒心灵持续感知而存在');
          trigger(hit, 2);
        }

        const ex = W * 0.2;
        const ey = H * 0.45;
        const tx = W * 0.72;
        const ty = H * 0.45 + S.gazeAngle * 85;

        // Spotlight cone when eye is open
        if (S.eyeOpen) {
          ctx.fillStyle = 'rgba(250, 204, 21, 0.16)';
          ctx.beginPath();
          ctx.moveTo(ex, ey);
          ctx.lineTo(tx + 50, ty - 75);
          ctx.lineTo(tx + 50, ty + 75);
          ctx.closePath();
          ctx.fill();
        }
        if (S.godEye) {
          ctx.fillStyle = 'rgba(56, 189, 248, 0.14)';
          ctx.beginPath();
          ctx.arc(tx, H * 0.45, 110, 0, Math.PI * 2);
          ctx.fill();
        }

        // Stylized Observer Eye
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(ex, ey, 28, S.eyeOpen ? 16 : 2, 0, 0, Math.PI * 2);
        ctx.stroke();
        if (S.eyeOpen) {
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(ex + 6, ey + S.gazeAngle * 5, 8, 0, Math.PI * 2);
          ctx.fill();
        }

        // 3 Sensible Objects (Cherry, Book, Tree) appear ONLY inside spotlight or God's Eye!
        const objs = [
          { y: H * 0.28, col: '#ef4444', lbl: '红樱桃' },
          { y: H * 0.45, col: '#f59e0b', lbl: '暖木桌' },
          { y: H * 0.62, col: '#10b981', lbl: '庭院树' }
        ];
        objs.forEach((o) => {
          const litByHuman = S.eyeOpen && Math.abs(o.y - ty) < 72;
          const visible = litByHuman || S.godEye;
          ctx.globalAlpha = visible ? 1 : 0.08;
          ctx.fillStyle = o.col;
          ctx.beginPath();
          ctx.arc(tx, o.y, 20, 0, Math.PI * 2);
          ctx.fill();
          drawLabel(ctx, o.lbl, tx + 32, o.y + 4, '#f8fafc', 11.5, 'left', true);
          ctx.globalAlpha = 1;
        });

        drawMonoNum(ctx, 'Esse Est Percipi · 存在即被感知', W * 0.5, H * 0.1, '#fde047', 15, 'center');
        drawToggleButton(ctx, W * 0.16, H * 0.8, 170, 34, S.eyeOpen ? '闭上感知之眼' : '睁开感知之眼', S.eyeOpen, '#d97706', true);
        drawToggleButton(ctx, W * 0.52, H * 0.8, 175, 34, S.godEye ? '永恒心灵持续感知 ✓' : '开启永恒心灵之光', S.godEye, '#0284c7', true);
        drawTinyHint(ctx, W, H, '上下拖动扫射眼睛光束或闭上双眼，观察对象仅在被感知处显现', true);
      }
    };
  }

  // ==================== #62 梅洛-庞蒂 · 身体知觉 (Blind Man's Cane Extending Body Schema) ====================
  if (modelId === 62) {
    let S: any = {};
    return {
      init() {
        S = { hasCane: false, mx: 0.45, my: 0.45, touches: 0 };
      },
      down(x, y, { W, H }) {
        if (hitBox(x, y, W * 0.34, H * 0.8, 200, 34)) {
          S.hasCane = !S.hasCane;
          return;
        }
        S.mx = clamp(x / W, 0.15, 0.85);
        S.my = clamp(y / H, 0.2, 0.7);
      },
      move(x, y, _dx, _dy, { W, H }) {
        S.mx = clamp(x / W, 0.15, 0.85);
        S.my = clamp(y / H, 0.2, 0.7);
      },
      tick({ ctx, W, H, hit }) {
        drawPaperBg(ctx, W, H, true);
        const bx = W * 0.25;
        const by = H * 0.5;
        const ang = Math.atan2(S.my * H - by, S.mx * W - bx);
        const reach = S.hasCane ? 195 : 72;
        const tipX = bx + Math.cos(ang) * reach;
        const tipY = by + Math.sin(ang) * reach;

        // Hidden obstacles revealed when cane tip / hand touches them!
        const obstacles = [
          { x: W * 0.55, y: H * 0.34, r: 28 },
          { x: W * 0.62, y: H * 0.56, r: 32 },
          { x: W * 0.48, y: H * 0.62, r: 22 }
        ];
        obstacles.forEach((ob) => {
          const d = Math.hypot(tipX - ob.x, tipY - ob.y);
          const sensed = d < ob.r + 30;
          if (sensed) S.touches++;
          ctx.fillStyle = sensed ? 'rgba(52, 211, 153, 0.75)' : 'rgba(148, 163, 184, 0.1)';
          ctx.strokeStyle = sensed ? '#34d399' : 'rgba(148,163,184,0.22)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(ob.x, ob.y, ob.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        });

        if (S.hasCane && S.touches > 8) {
          trigger(hit, 0, '盲杖不再是外在客体，而成为向外延伸的「身体图式」感官！');
          trigger(hit, 1, '知觉不是大脑静观屏幕，而是具身行动与世界的交织');
          trigger(hit, 2);
        }

        // Body & Cane
        ctx.strokeStyle = S.hasCane ? '#facc15' : '#38bdf8';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(bx, by, 22, 0, Math.PI * 2);
        ctx.fill();
        drawLabel(ctx, '身体', bx, by + 4, '#fff', 11, 'center', true);

        // Sensory halo at cane tip!
        ctx.fillStyle = 'rgba(250, 204, 21, 0.32)';
        ctx.beginPath();
        ctx.arc(tipX, tipY, 24, 0, Math.PI * 2);
        ctx.fill();

        drawMonoNum(ctx, S.hasCane ? '感知边界延展至杖尖 · 具身融入工具' : '徒手触碰半径受限', W * 0.5, H * 0.1, '#fde047', 14.5, 'center');
        drawToggleButton(ctx, W * 0.34, H * 0.8, 200, 34, S.hasCane ? '放下盲杖' : '握起盲杖延伸身体图式', S.hasCane, '#d97706', true);
        drawTinyHint(ctx, W, H, '移动鼠标挥动手臂与盲杖探知暗处障碍，体会感知边界延伸至杖尖', true);
      }
    };
  }

  // ==================== #63 列维纳斯 · 他者伦理 (The Face Radiating Infinite Ethical Call) ====================
  if (modelId === 63) {
    let S: any = {};
    return {
      init() {
        S = { boxSize: 0.45, drag: false, t: 0 };
      },
      down(x, y, { W, H }) {
        if (hitSlider(x, y, W * 0.18, H * 0.8, W * 0.64)) {
          S.drag = true;
          S.boxSize = clamp((x - W * 0.18) / (W * 0.64), 0, 1);
        }
      },
      move(x, _y, _dx, _dy, { W }) {
        if (S.drag) S.boxSize = clamp((x - W * 0.18) / (W * 0.64), 0, 1);
      },
      up() {
        S.drag = false;
      },
      tick({ ctx, W, H, dt, hit }) {
        S.t += dt;
        drawPaperBg(ctx, W, H, true);
        const cx = W * 0.5;
        const cy = H * 0.44;
        if (S.boxSize < 0.25) trigger(hit, 0, '概念总体化试图把他人压缩进标签盒，却始终无法穷尽他者');
        if (S.boxSize > 0.78) {
          trigger(hit, 1, '撤除概念框架面对「他者之面容」，无限伦理责任先于一切存在论');
          trigger(hit, 2);
        }

        // Infinite radiant rings overflowing from the Face of the Other
        for (let i = 0; i < 5; i++) {
          const r = 36 + ((S.t * 34 + i * 32) % 155);
          ctx.strokeStyle = `rgba(250, 204, 21, ${(1 - r / 195) * (0.3 + S.boxSize * 0.7)})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Rigid Totality Cage shrinking/dissolving as user opens to Infinity
        if (S.boxSize < 0.85) {
          ctx.strokeStyle = `rgba(239, 68, 68, ${1 - S.boxSize})`;
          ctx.lineWidth = 3;
          const s = 68 + S.boxSize * 50;
          ctx.strokeRect(cx - s, cy - s, s * 2, s * 2);
        }

        // Abstract luminous Face
        ctx.fillStyle = '#fef3c7';
        ctx.beginPath();
        ctx.arc(cx, cy, 34, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(cx - 11, cy - 5, 4, 0, Math.PI * 2);
        ctx.arc(cx + 11, cy - 5, 4, 0, Math.PI * 2);
        ctx.fill();

        drawMonoNum(ctx, S.boxSize > 0.75 ? '无限 (Infinity) · 面对面伦理呼唤' : '总体 (Totality) · 概念框定企图', cx, H * 0.1, '#fde047', 14.5, 'center');
        drawCompactSlider(ctx, W * 0.18, H * 0.8, W * 0.64, S.boxSize, '消解标签总体化 → 敞开面对他者', `${Math.round(S.boxSize * 100)}%`, '#facc15', true);
        drawTinyHint(ctx, W, H, '向右拉动消解红色概念牢笼，感受列维纳斯「他者面容」溢出的无限伦理光环', true);
      }
    };
  }

  // ==================== #64 加缪 · 荒诞哲学 (Animated Sisyphus Pushing Boulder Up & Rolling Back) ====================
  if (modelId === 64) {
    let S: any = {};
    return {
      init() {
        S = { progress: 0.1, rollingBack: false, pushes: 0, revolt: false, t: 0 };
      },
      down(x, y, { W, H }) {
        if (hitBox(x, y, W * 0.52, H * 0.8, 175, 34)) {
          S.revolt = !S.revolt;
          return;
        }
        if (!S.rollingBack) {
          S.progress = clamp(S.progress + 0.18, 0, 1);
          S.pushes++;
          if (S.progress >= 0.98) S.rollingBack = true;
        }
      },
      tick({ ctx, W, H, dt, hit }) {
        S.t += dt;
        drawPaperBg(ctx, W, H, false);
        if (S.rollingBack) {
          S.progress -= dt * 0.85;
          if (S.progress <= 0.08) {
            S.progress = 0.08;
            S.rollingBack = false;
            trigger(hit, 0, '巨石滚回山脚：世界本身保持沉默，重复永无终极答案');
          }
        }
        if (S.revolt && S.pushes >= 2) {
          trigger(hit, 1, '反抗荒诞而不逃避：我们必须想象西西弗斯是幸福的！');
          trigger(hit, 2);
        }

        // Mountain slope
        const x0 = W * 0.14;
        const y0 = H * 0.66;
        const x1 = W * 0.84;
        const y1 = H * 0.22;
        ctx.fillStyle = S.revolt ? '#fef3c7' : '#e2e8f0';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.lineTo(x1, y0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Boulder rolling along slope
        const bx = lerp(x0 + 36, x1 - 24, S.progress);
        const by = lerp(y0 - 24, y1 - 14, S.progress);
        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(S.progress * 10);
        ctx.fillStyle = '#64748b';
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-14, 0);
        ctx.lineTo(14, 0);
        ctx.stroke();
        ctx.restore();

        // Sisyphus figure behind boulder
        const sx = bx - 32;
        const sy = by + 12;
        ctx.fillStyle = S.revolt ? '#d97706' : '#334155';
        ctx.beginPath();
        ctx.arc(sx, sy - 16, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(sx - 5, sy - 6, 10, 22);

        drawMonoNum(
          ctx,
          S.rollingBack ? '巨石滚落山脚...' : S.revolt ? '清醒反抗 · 过程即自由 ☀' : `推石高度: ${Math.round(S.progress * 100)}%`,
          W * 0.5,
          H * 0.1,
          S.revolt ? '#d97706' : '#334155',
          15,
          'center'
        );
        drawToggleButton(ctx, W * 0.18, H * 0.8, 175, 34, '点击山坡推石上山 🪨', !S.rollingBack, '#334155');
        drawToggleButton(ctx, W * 0.52, H * 0.8, 175, 34, S.revolt ? '清醒反抗姿态 ☀' : '切换清醒反抗态度', S.revolt, '#d97706');
        drawTinyHint(ctx, W, H, '反复点击把巨石推向山顶看它滚落，并切换加缪的「清醒反抗」阳光姿态');
      }
    };
  }

  // ==================== #65 怀特海 · 过程哲学 (Solid Stone Dissolving Into Event Wave Stream) ====================
  if (modelId === 65) {
    let S: any = {};
    return {
      init() {
        S = { zoom: 0.1, drag: false, t: 0 };
      },
      down(x, y, { W, H }) {
        if (hitSlider(x, y, W * 0.18, H * 0.8, W * 0.64)) {
          S.drag = true;
          S.zoom = clamp((x - W * 0.18) / (W * 0.64), 0, 1);
        }
      },
      move(x, _y, _dx, _dy, { W }) {
        if (S.drag) S.zoom = clamp((x - W * 0.18) / (W * 0.64), 0, 1);
      },
      up() {
        S.drag = false;
      },
      tick({ ctx, W, H, dt, hit }) {
        S.t += dt;
        drawPaperBg(ctx, W, H, true);
        if (S.zoom < 0.25) trigger(hit, 0, '宏观错觉把事物看成孤立静止的实体（具体性误置谬误）');
        if (S.zoom > 0.72) {
          trigger(hit, 1, '微观展开：看似静止的石头实为亿万相互摄受的流变事件之网！');
          trigger(hit, 2);
        }

        const cx = W * 0.5;
        const cy = H * 0.44;
        // Solid stone fades out while dynamic wave-nodes & prehension links emerge!
        ctx.fillStyle = `rgba(148, 163, 184, ${(1 - S.zoom) * 0.85})`;
        ctx.beginPath();
        ctx.roundRect(cx - 85, cy - 55, 170, 110, 26);
        ctx.fill();

        if (S.zoom > 0.15) {
          const pts = Array.from({ length: 16 }, (_, i) => {
            const x = cx - 140 + (i % 4) * 92 + Math.sin(S.t * 3 + i) * 14 * S.zoom;
            const y = cy - 66 + Math.floor(i / 4) * 44 + Math.cos(S.t * 2.5 + i) * 12 * S.zoom;
            return { x, y };
          });
          ctx.strokeStyle = `rgba(56, 189, 248, ${S.zoom * 0.55})`;
          ctx.lineWidth = 1.6;
          for (let i = 0; i < pts.length; i++) {
            for (let j = i + 1; j < pts.length; j++) {
              if (Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y) < 120) {
                ctx.beginPath();
                ctx.moveTo(pts[i].x, pts[i].y);
                ctx.lineTo(pts[j].x, pts[j].y);
                ctx.stroke();
              }
            }
          }
          pts.forEach((p) => {
            ctx.fillStyle = `rgba(52, 211, 153, ${S.zoom})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
            ctx.fill();
          });
        }

        drawMonoNum(ctx, S.zoom > 0.65 ? '现实实有 (Actual Occasions) · 过程事件流' : '静止实体幻象', cx, H * 0.1, '#34d399', 14.5, 'center');
        drawCompactSlider(ctx, W * 0.18, H * 0.8, W * 0.64, S.zoom, '过程展开倍率（静止实体 ↔ 关联事件流）', `${Math.round(S.zoom * 100)}%`, '#34d399', true);
        drawTinyHint(ctx, W, H, '向右拉动把静止巨石溶解为相互摄受、持续生成的动态事件网络', true);
      }
    };
  }

  // ==================== #66 德勒兹 · 生成与差异 (Tree Hierarchy vs Click-to-Sprout Rhizome Network) ====================
  if (modelId === 66) {
    let S: any = {};
    return {
      init() {
        S = {
          rhizome: false,
          nodes: [
            { x: 0.5, y: 0.44 },
            { x: 0.34, y: 0.36 },
            { x: 0.66, y: 0.38 },
            { x: 0.42, y: 0.58 },
            { x: 0.6, y: 0.56 }
          ],
          t: 0
        };
      },
      down(x, y, { W, H }) {
        if (hitBox(x, y, W * 0.34, H * 0.8, 200, 34)) {
          S.rhizome = !S.rhizome;
          return;
        }
        if (S.rhizome && y > H * 0.16 && y < H * 0.72 && S.nodes.length < 18) {
          S.nodes.push({ x: clamp(x / W, 0.12, 0.88), y: clamp(y / H, 0.18, 0.7) });
        }
      },
      tick({ ctx, W, H, dt, hit }) {
        S.t += dt;
        drawPaperBg(ctx, W, H, true);
        if (!S.rhizome) trigger(hit, 0, '树状结构强迫一切概念归属于单一树根与二元层级');
        if (S.rhizome && S.nodes.length >= 7) {
          trigger(hit, 1, '块茎 (Rhizome)：无中心、无起点，任意节点皆可横向连接、生成差异！');
          trigger(hit, 2);
        }

        if (!S.rhizome) {
          // Rigid Binary Tree
          const drawBranch = (x: number, y: number, dx: number, depth: number) => {
            if (depth === 0) return;
            const ny = y + 66;
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = depth * 1.4;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x - dx, ny);
            ctx.moveTo(x, y);
            ctx.lineTo(x + dx, ny);
            ctx.stroke();
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.arc(x, y, 7, 0, Math.PI * 2);
            ctx.fill();
            drawBranch(x - dx, ny, dx * 0.52, depth - 1);
            drawBranch(x + dx, ny, dx * 0.52, depth - 1);
          };
          drawBranch(W * 0.5, H * 0.22, 110, 3);
        } else {
          // Organic Rhizome Mesh
          for (let i = 0; i < S.nodes.length; i++) {
            for (let j = i + 1; j < S.nodes.length; j++) {
              const a = S.nodes[i];
              const b = S.nodes[j];
              if (Math.hypot((a.x - b.x) * W, (a.y - b.y) * H) < 175) {
                ctx.strokeStyle = 'rgba(168, 85, 247, 0.55)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(a.x * W, a.y * H);
                ctx.lineTo(b.x * W, b.y * H);
                ctx.stroke();
              }
            }
          }
          S.nodes.forEach((n: any) => {
            ctx.fillStyle = '#c084fc';
            ctx.beginPath();
            ctx.arc(n.x * W, n.y * H, 8, 0, Math.PI * 2);
            ctx.fill();
          });
        }

        drawMonoNum(ctx, S.rhizome ? `块茎网络 (${S.nodes.length} 异质节点 · 点画布生长)` : '树状层级结构 (单一中心根)', W * 0.5, H * 0.1, S.rhizome ? '#c084fc' : '#38bdf8', 14.5, 'center');
        drawToggleButton(ctx, W * 0.34, H * 0.8, 200, 34, S.rhizome ? '切回树状层级' : '切换为块茎生成网络 ✦', S.rhizome, '#9333ea', true);
        drawTinyHint(ctx, W, H, '切换至块茎模式后，点击画布任意处萌发新节点，观察无中心横向连接', true);
      }
    };
  }

  // ==================== #68 塞尔 · 言语行为分类 (Direction-of-Fit Arrows: Word <-> World) ====================
  if (modelId === 68) {
    let S: any = {};
    return {
      init() {
        S = { mode: 0, visited: new Set([0]), t: 0 };
      },
      down(x, y, { W, H }) {
        for (let i = 0; i < 4; i++) {
          if (hitBox(x, y, W * 0.08 + i * (W * 0.215), H * 0.8, W * 0.195, 34)) {
            S.mode = i;
            S.visited.add(i);
          }
        }
      },
      tick({ ctx, W, H, dt, hit }) {
        S.t += dt;
        drawPaperBg(ctx, W, H, false);
        if (S.visited.size >= 2) trigger(hit, 0, '断言让「语词去匹配世界」，指令与承诺则让「世界去匹配语词」');
        if (S.visited.size >= 4) {
          trigger(hit, 1, '宣告式言语行为双向同时适配：说出的瞬间即创造了制度事实！');
          trigger(hit, 2);
        }

        const lx = W * 0.28;
        const rx = W * 0.72;
        const cy = H * 0.44;

        ctx.fillStyle = '#2563eb';
        ctx.beginPath();
        ctx.arc(lx, cy, 44, 0, Math.PI * 2);
        ctx.fill();
        drawLabel(ctx, '语词 Word', lx, cy + 5, '#fff', 13, 'center', true);

        ctx.fillStyle = '#059669';
        ctx.beginPath();
        ctx.arc(rx, cy, 44, 0, Math.PI * 2);
        ctx.fill();
        drawLabel(ctx, '世界 World', rx, cy + 5, '#fff', 13, 'center', true);

        // Direction of Fit animated arrows
        const titles = ['断言 (词 → 世界)', '指令 (世界 → 词)', '承诺 (世界 → 词)', '宣告 (双向同步改变!)'];
        if (S.mode === 0) drawArrow(ctx, lx + 56, cy, rx - 56, cy, '#2563eb', 5, 13);
        else if (S.mode === 1 || S.mode === 2) drawArrow(ctx, rx - 56, cy, lx + 56, cy, '#d97706', 5, 13);
        else {
          drawArrow(ctx, lx + 56, cy - 14, rx - 56, cy - 14, '#7c3aed', 4.5, 12);
          drawArrow(ctx, rx - 56, cy + 14, lx + 56, cy + 14, '#7c3aed', 4.5, 12);
        }

        drawMonoNum(ctx, `适配方向: ${titles[S.mode]}`, W * 0.5, H * 0.12, '#0f172a', 15, 'center');
        ['断言类', '指令类', '承诺类', '宣告类'].forEach((lbl, i) => {
          drawToggleButton(ctx, W * 0.08 + i * (W * 0.215), H * 0.8, W * 0.195, 34, lbl, S.mode === i, '#2563eb');
        });
        drawTinyHint(ctx, W, H, '切换塞尔四类言语行为，观察「语词」与「世界」之间的适配箭头方向');
      }
    };
  }

  // ==================== #69 格赖斯 · 合作原则 (4 Maxim Dials Producing Implicature Spark) ====================
  if (modelId === 69) {
    let S: any = {};
    return {
      init() {
        S = { maxims: [true, true, true, true], flouted: 0 };
      },
      down(x, y, { W, H }) {
        for (let i = 0; i < 4; i++) {
          const bx = W * 0.16 + i * (W * 0.225);
          if (Math.hypot(x - bx, y - H * 0.44) < 42) {
            S.maxims[i] = !S.maxims[i];
            S.flouted++;
          }
        }
      },
      tick({ ctx, W, H, hit }) {
        drawPaperBg(ctx, W, H, true);
        const brokenCount = S.maxims.filter((m: boolean) => !m).length;
        if (brokenCount === 0) trigger(hit, 0, '四准则全亮时，字面意思与听者理解直接对齐');
        if (brokenCount >= 1) {
          trigger(hit, 1, '故意违反某条准则时，听者推导出言外之意——会话含义！');
          trigger(hit, 2);
        }

        const names = ['数量准则', '质量(真实)', '关联准则', '方式(清晰)'];
        names.forEach((n, i) => {
          const bx = W * 0.16 + i * (W * 0.225);
          const on = S.maxims[i];
          ctx.fillStyle = on ? '#10b981' : '#f59e0b';
          ctx.beginPath();
          ctx.arc(bx, H * 0.44, 34, 0, Math.PI * 2);
          ctx.fill();
          drawLabel(ctx, n, bx, H * 0.44 + 4, '#0f172a', 11.5, 'center', true);
          drawMonoNum(ctx, on ? '遵守 ✓' : '故意违背 ⚡', bx, H * 0.44 + 52, on ? '#34d399' : '#fbbf24', 11, 'center');
        });

        drawMonoNum(
          ctx,
          brokenCount === 0 ? '字面直译通道' : `检测到 ${brokenCount} 处蓄意违背 → 触发「会话含义」言外之意！`,
          W * 0.5,
          H * 0.14,
          brokenCount === 0 ? '#34d399' : '#fde047',
          14.5,
          'center'
        );
        drawTinyHint(ctx, W, H, '点击任意合作准则灯泡将其蓄意关暗，触发格赖斯的「会话含义」推理', true);
      }
    };
  }

  // ==================== #70 伽达默尔 · 视域融合 (Two Translucent Horizon Disks Dragged to Fuse) ====================
  if (modelId === 70) {
    let S: any = {};
    return {
      init() {
        S = { dist: 0.78, drag: false };
      },
      down(x, y, { W, H }) {
        if (hitSlider(x, y, W * 0.18, H * 0.8, W * 0.64)) {
          S.drag = true;
          S.dist = clamp(1 - (x - W * 0.18) / (W * 0.64), 0, 1);
        }
      },
      move(x, _y, _dx, _dy, { W }) {
        if (S.drag) S.dist = clamp(1 - (x - W * 0.18) / (W * 0.64), 0, 1);
      },
      up() {
        S.drag = false;
      },
      tick({ ctx, W, H, hit }) {
        drawPaperBg(ctx, W, H, true);
        const cx = W * 0.5;
        const cy = H * 0.44;
        const offset = 22 + S.dist * 125;
        const fused = S.dist < 0.28;
        if (S.dist > 0.65) trigger(hit, 0, '未对话前，古代文本视域与当代读者前见彼此隔绝');
        if (fused) {
          trigger(hit, 1, '视域融合：既未抹杀历史他性，又在交汇区诞生全新理解！');
          trigger(hit, 2);
        }

        ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(cx - offset, cy, 86, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        drawLabel(ctx, '文本历史视域', cx - offset - 18, cy + 4, '#fff', 12, 'center', true);

        ctx.fillStyle = 'rgba(251, 191, 36, 0.35)';
        ctx.strokeStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(cx + offset, cy, 86, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        drawLabel(ctx, '读者当下视域', cx + offset + 18, cy + 4, '#fff', 12, 'center', true);

        if (fused) {
          drawLabel(ctx, '视域融合 ✨', cx, cy + 4, '#ecfdf5', 14, 'center', true);
        }

        drawMonoNum(ctx, `视域交叠融合度: ${Math.round((1 - S.dist) * 100)}%`, cx, H * 0.1, fused ? '#34d399' : '#38bdf8', 15, 'center');
        drawCompactSlider(ctx, W * 0.18, H * 0.8, W * 0.64, 1 - S.dist, '诠释学对话推进', `${Math.round((1 - S.dist) * 100)}%`, '#34d399', true);
        drawTinyHint(ctx, W, H, '向右推进对话滑块，将「历史文本」与「当下前见」两轮视域融合叠加', true);
      }
    };
  }

  // ==================== #71 利科 · 叙事身份 (Draggable Story Beads Changing Emotional Arc) ====================
  if (modelId === 71) {
    let S: any = {};
    return {
      init() {
        S = { order: [0, 1, 2, 3], swaps: 0 };
      },
      down(x, y, { W, H }) {
        if (hitBox(x, y, W * 0.34, H * 0.8, 200, 34)) {
          // Rotate / shuffle plotline!
          S.order = [S.order[1], S.order[2], S.order[3], S.order[0]];
          S.swaps++;
        }
      },
      tick({ ctx, W, H, hit }) {
        drawPaperBg(ctx, W, H, false);
        const events = [
          { lbl: '失意', val: 0.25, col: '#dc2626' },
          { lbl: '离乡', val: 0.45, col: '#d97706' },
          { lbl: '顿悟', val: 0.72, col: '#2563eb' },
          { lbl: '重逢', val: 0.88, col: '#059669' }
        ];
        if (S.swaps >= 1) trigger(hit, 0, '相同人生事件，改变「情节编织」(Emplotment) 顺序即改写整个故事弧线！');
        if (S.swaps >= 2) {
          trigger(hit, 1, '叙事身份 (Ipse) 在不断重述自我中维持统一又开放蜕变');
          trigger(hit, 2);
        }

        const pts = S.order.map((evIdx: number, pos: number) => ({
          x: W * 0.18 + pos * (W * 0.21),
          y: H * 0.64 - events[evIdx].val * H * 0.38,
          ...events[evIdx]
        }));

        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        pts.forEach((p: any, i: number) => {
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();

        pts.forEach((p: any) => {
          ctx.fillStyle = p.col;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 22, 0, Math.PI * 2);
          ctx.fill();
          drawLabel(ctx, p.lbl, p.x, p.y + 4, '#fff', 12, 'center', true);
        });

        const rising = pts[3].val > pts[0].val;
        drawMonoNum(ctx, rising ? '当前叙事弧线: 成长救赎史诗 ↗' : '当前叙事弧线: 宿命悲剧坠落 ↘', W * 0.5, H * 0.11, rising ? '#059669' : '#dc2626', 15, 'center');
        drawToggleButton(ctx, W * 0.34, H * 0.8, 200, 34, '重排人生事件叙事顺序 🔀', true, '#2563eb');
        drawTinyHint(ctx, W, H, '点击重排四颗相同人生经历珠子，观察叙事弧线在「成长」与「悲剧」间翻转');
      }
    };
  }

  // ==================== #72 索绪尔 · 语言符号 (Signifier / Signified Coin + Color Spectrum Cuts) ====================
  if (modelId === 72) {
    let S: any = {};
    return {
      init() {
        S = { cutPos: 0.5, drag: false };
      },
      down(x, y, { W, H }) {
        if (hitSlider(x, y, W * 0.18, H * 0.8, W * 0.64)) {
          S.drag = true;
          S.cutPos = clamp((x - W * 0.18) / (W * 0.64), 0.18, 0.82);
        }
      },
      move(x, _y, _dx, _dy, { W }) {
        if (S.drag) S.cutPos = clamp((x - W * 0.18) / (W * 0.64), 0.18, 0.82);
      },
      up() {
        S.drag = false;
      },
      tick({ ctx, W, H, hit }) {
        drawPaperBg(ctx, W, H, false);
        if (S.cutPos < 0.35) trigger(hit, 0, '不同语言系统对连续光谱切出不同边界（如「青」涵盖蓝与绿）');
        if (S.cutPos > 0.65) {
          trigger(hit, 1, '符号价值不靠独立本质，而靠系统内部彼此「差异」界定！');
          trigger(hit, 2);
        }

        // Continuous Blue-Cyan-Green gradient bar
        const gx = W * 0.14;
        const gw = W * 0.72;
        const gy = H * 0.32;
        const gh = 86;
        const grad = ctx.createLinearGradient(gx, 0, gx + gw, 0);
        grad.addColorStop(0, '#1d4ed8');
        grad.addColorStop(0.5, '#06b6d4');
        grad.addColorStop(1, '#16a34a');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(gx, gy, gw, gh, 10);
        ctx.fill();

        // Movable Linguistic Boundary Knife!
        const kx = gx + S.cutPos * gw;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(kx, gy - 16);
        ctx.lineTo(kx, gy + gh + 16);
        ctx.stroke();

        drawLabel(ctx, '词项 A 领地', (gx + kx) / 2, gy + gh / 2 + 5, '#fff', 13, 'center', true);
        drawLabel(ctx, '词项 B 领地', (kx + gx + gw) / 2, gy + gh / 2 + 5, '#fff', 13, 'center', true);

        drawMonoNum(ctx, `语言切分界线: ${Math.round(S.cutPos * 100)}%`, W * 0.5, H * 0.14, '#0f172a', 15, 'center');
        drawCompactSlider(ctx, W * 0.18, H * 0.8, W * 0.64, S.cutPos, '移动语言系统的概念切分刀', `${Math.round(S.cutPos * 100)}%`, '#0284c7');
        drawTinyHint(ctx, W, H, '在连续色彩光谱上拖动白色语言切分刀，直观体会符号价值的系统差异性');
      }
    };
  }

  // ==================== #73 皮尔士 · 符号三元关系 (Animated Semiotic Triangle: Icon / Index / Symbol) ====================
  if (modelId === 73) {
    let S: any = {};
    return {
      init() {
        S = { mode: 0, visited: new Set([0]), t: 0 };
      },
      down(x, y, { W, H }) {
        for (let i = 0; i < 3; i++) {
          if (hitBox(x, y, W * 0.14 + i * W * 0.25, H * 0.8, W * 0.22, 34)) {
            S.mode = i;
            S.visited.add(i);
          }
        }
      },
      tick({ ctx, W, H, dt, hit }) {
        S.t += dt;
        drawPaperBg(ctx, W, H, true);
        if (S.visited.size >= 2) trigger(hit, 0, '皮尔士三元关系：符号须经由「解释项」才与对象产生活的意义');
        if (S.visited.size >= 3) {
          trigger(hit, 1, '像似(肖像)、指示(烟雾)、规约(红灯)构成三种根本符号机制！');
          trigger(hit, 2);
        }

        const top = { x: W * 0.5, y: H * 0.22, lbl: '解释项 (意义)' };
        const left = { x: W * 0.24, y: H * 0.62, lbl: ['肖像画(像似)', '黑烟(指示)', '红灯(规约)'][S.mode] };
        const right = { x: W * 0.76, y: H * 0.62, lbl: ['人物对象', '火焰对象', '停车规则'][S.mode] };

        const cols = ['#38bdf8', '#fb923c', '#f43f5e'];
        ctx.strokeStyle = cols[S.mode];
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(left.x, left.y);
        ctx.lineTo(top.x, top.y);
        ctx.lineTo(right.x, right.y);
        ctx.stroke();

        // Orbiting spark traveling through Representamen -> Interpretant -> Object
        const p = (S.t * 0.7) % 1;
        const sx = p < 0.5 ? lerp(left.x, top.x, p * 2) : lerp(top.x, right.x, (p - 0.5) * 2);
        const sy = p < 0.5 ? lerp(left.y, top.y, p * 2) : lerp(top.y, right.y, (p - 0.5) * 2);
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(sx, sy, 7, 0, Math.PI * 2);
        ctx.fill();

        [top, left, right].forEach((n) => {
          ctx.fillStyle = cols[S.mode];
          ctx.beginPath();
          ctx.arc(n.x, n.y, 26, 0, Math.PI * 2);
          ctx.fill();
          drawLabel(ctx, n.lbl, n.x, n.y + 42, '#f8fafc', 12, 'center', true);
        });

        ['像似符号 Icon', '指示符号 Index', '规约符号 Symbol'].forEach((lbl, i) => {
          drawToggleButton(ctx, W * 0.14 + i * W * 0.25, H * 0.8, W * 0.22, 34, lbl, S.mode === i, cols[i], true);
        });
        drawTinyHint(ctx, W, H, '切换像似、指示、规约三类符号，观察金色意义脉冲经由解释项流向对象', true);
      }
    };
  }

  // ==================== #74 德里达 · 延异 (Infinite Dictionary Signifier Chain Deferral) ====================
  if (modelId === 74) {
    let S: any = {};
    return {
      init() {
        S = { hops: 0, chain: ['存在'] };
      },
      down(x, y, { W, H }) {
        if (hitBox(x, y, W * 0.34, H * 0.8, 200, 34)) {
          const words = ['在场', '痕迹', '差异', '时间', '延宕', '书写', '缺席', '符号'];
          S.hops++;
          S.chain.push(words[S.hops % words.length]);
          if (S.chain.length > 6) S.chain.shift();
        }
      },
      tick({ ctx, W, H, hit }) {
        drawPaperBg(ctx, W, H, true);
        if (S.hops >= 2) trigger(hit, 0, '查阅任何一个词的意义，永远只把你指向其他词的链条');
        if (S.hops >= 4) {
          trigger(hit, 1, '延异 (Différance)：意义永不终结于纯粹在场，而在差异与延宕中滑行！');
          trigger(hit, 2);
        }

        const y = H * 0.44;
        S.chain.forEach((w: string, i: number) => {
          const x = W * 0.14 + i * (W * 0.145);
          if (i < S.chain.length - 1) {
            drawArrow(ctx, x + 28, y, x + W * 0.145 - 28, y, '#a78bfa', 2.5, 8);
          }
          ctx.fillStyle = i === S.chain.length - 1 ? '#8b5cf6' : '#334155';
          ctx.beginPath();
          ctx.arc(x, y, 26, 0, Math.PI * 2);
          ctx.fill();
          drawLabel(ctx, w, x, y + 4, '#fff', 12, 'center', true);
        });

        drawMonoNum(ctx, `意义延宕追踪深度: ${S.hops} 跳 → 永无终点在场`, W * 0.5, H * 0.12, '#c4b5fd', 14.5, 'center');
        drawToggleButton(ctx, W * 0.34, H * 0.8, 200, 34, '继续追问下一层定义 →', true, '#7c3aed', true);
        drawTinyHint(ctx, W, H, '不断点击追问词典定义，体验能指链无限延宕却永不抵达终极所指', true);
      }
    };
  }

  // ==================== #75 布迪厄 · 惯习与场域 (Capital Sliders Moving Player Across Social Field) ====================
  if (modelId === 75) {
    let S: any = {};
    return {
      init() {
        S = { econ: 0.35, cult: 0.72, drag: 0 };
      },
      down(x, y, { W, H }) {
        if (hitSlider(x, y, W * 0.1, H * 0.8, W * 0.36)) {
          S.drag = 1;
          S.econ = clamp((x - W * 0.1) / (W * 0.36), 0, 1);
        } else if (hitSlider(x, y, W * 0.54, H * 0.8, W * 0.36)) {
          S.drag = 2;
          S.cult = clamp((x - W * 0.54) / (W * 0.36), 0, 1);
        }
      },
      move(x, _y, _dx, _dy, { W }) {
        if (S.drag === 1) S.econ = clamp((x - W * 0.1) / (W * 0.36), 0, 1);
        if (S.drag === 2) S.cult = clamp((x - W * 0.54) / (W * 0.36), 0, 1);
      },
      up() {
        S.drag = 0;
      },
      tick({ ctx, W, H, hit }) {
        drawPaperBg(ctx, W, H, false);
        if (S.cult > 0.75 && S.econ < 0.4) trigger(hit, 0, '高文化资本低经济资本占据学术/艺术场域，塑造鲜明品味惯习');
        if (S.econ > 0.75) {
          trigger(hit, 1, '场域位置取决于资本总量与结构比例，实践源于惯习与场域的遭遇');
          trigger(hit, 2);
        }

        const gx = W * 0.18;
        const gy = H * 0.16;
        const gw = W * 0.64;
        const gh = H * 0.48;
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.strokeRect(gx, gy, gw, gh);
        // Crosshairs
        ctx.strokeStyle = 'rgba(100,116,139,0.28)';
        ctx.beginPath();
        ctx.moveTo(gx + gw / 2, gy);
        ctx.lineTo(gx + gw / 2, gy + gh);
        ctx.moveTo(gx, gy + gh / 2);
        ctx.lineTo(gx + gw, gy + gh / 2);
        ctx.stroke();

        drawLabel(ctx, '高文化资本 (先锋艺术)', gx + 12, gy + 20, '#7c3aed', 11, 'left', true);
        drawLabel(ctx, '双高精英场域', gx + gw - 12, gy + 20, '#059669', 11, 'right', true);
        drawLabel(ctx, '高经济资本 (商业豪奢)', gx + gw - 12, gy + gh - 10, '#d97706', 11, 'right', true);

        const px = gx + S.econ * gw;
        const py = gy + (1 - S.cult) * gh;
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.arc(px, py, 14, 0, Math.PI * 2);
        ctx.fill();
        drawLabel(ctx, '惯习', px, py + 4, '#fff', 10, 'center', true);

        drawCompactSlider(ctx, W * 0.1, H * 0.8, W * 0.36, S.econ, '经济资本', `${Math.round(S.econ * 100)}`, '#d97706');
        drawCompactSlider(ctx, W * 0.54, H * 0.8, W * 0.36, S.cult, '文化资本', `${Math.round(S.cult * 100)}`, '#7c3aed');
        drawTinyHint(ctx, W, H, '调配经济与文化资本坐标，移动行动者在布迪厄社会空间场域中的位置');
      }
    };
  }

  // ==================== #76 戈夫曼 · 拟剧理论 (Animated Velvet Curtain: Front Stage vs Back Stage) ====================
  if (modelId === 76) {
    let S: any = {};
    return {
      init() {
        S = { curtain: 0, target: 0 }; // 0=Front Stage (Mask on), 1=Back Stage (Mask off)
      },
      down(x, y, { W, H }) {
        if (hitBox(x, y, W * 0.34, H * 0.8, 200, 34)) S.target = 1 - S.target;
      },
      tick({ ctx, W, H, dt, hit }) {
        S.curtain = lerp(S.curtain, S.target, dt * 4);
        drawPaperBg(ctx, W, H, true);
        if (S.curtain < 0.2) trigger(hit, 0, '前台区：面对观众维持印象管理与礼仪面具');
        if (S.curtain > 0.8) {
          trigger(hit, 1, '后台区：拉上帷幕卸下职业角色面具，放松排练真实自我！');
          trigger(hit, 2);
        }

        const cx = W * 0.5;
        const cy = H * 0.44;
        // Stage spotlight
        ctx.fillStyle = S.curtain < 0.5 ? 'rgba(250, 204, 21, 0.16)' : 'rgba(56, 189, 248, 0.12)';
        ctx.beginPath();
        ctx.arc(cx, cy, 108, 0, Math.PI * 2);
        ctx.fill();

        // Actor face: Smiles formally on Front Stage, yawns/relaxes on Back Stage
        ctx.fillStyle = S.curtain < 0.5 ? '#f59e0b' : '#38bdf8';
        ctx.beginPath();
        ctx.arc(cx, cy, 42, 0, Math.PI * 2);
        ctx.fill();
        drawLabel(ctx, S.curtain < 0.5 ? '🎭 礼仪面具' : '😌 卸妆放松', cx, cy + 5, '#0f172a', 13, 'center', true);

        // Red velvet theater curtain sliding across!
        const cw = W * 0.44 * S.curtain;
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(W * 0.06, H * 0.16, cw, H * 0.56);
        ctx.fillRect(W * 0.94 - cw, H * 0.16, cw, H * 0.56);

        drawMonoNum(ctx, S.curtain < 0.5 ? '前台区 (Front Stage) · 印象管理表演' : '后台区 (Back Stage) · 退出角色排练', cx, H * 0.1, '#fde047', 14.5, 'center');
        drawToggleButton(ctx, W * 0.34, H * 0.8, 200, 34, S.target === 0 ? '拉合帷幕进入后台 🎭' : '拉开帷幕走上前台 ✨', S.target === 1, '#dc2626', true);
        drawTinyHint(ctx, W, H, '点击拉合剧场红绒帷幕，体验社会角色在前台表演与后台放松之间的切换', true);
      }
    };
  }

  // ==================== #78 费耶阿本德 · 方法多元主义 (Locked Single Method vs Multi-Key Toolbox) ====================
  if (modelId === 78) {
    let S: any = {};
    return {
      init() {
        S = { plural: false, unlocked: 1, t: 0 };
      },
      down(x, y, { W, H }) {
        if (hitBox(x, y, W * 0.34, H * 0.8, 200, 34)) S.plural = !S.plural;
      },
      tick({ ctx, W, H, dt, hit }) {
        S.t += dt;
        drawPaperBg(ctx, W, H, false);
        S.unlocked = S.plural ? 4 : 1;
        if (!S.plural) trigger(hit, 0, '僵化单一方法论只打开了一扇门，却锁死了反常规重大突破');
        if (S.plural) {
          trigger(hit, 1, '「怎么都行」(Anything Goes)：方法多元主义释放科学史上的突破性发现！');
          trigger(hit, 2);
        }

        const doors = ['归纳法', '望远镜直觉', '思想实验', '反常规猜想'];
        doors.forEach((d, i) => {
          const dx = W * 0.16 + i * (W * 0.225);
          const open = i === 0 || S.plural;
          ctx.fillStyle = open ? '#059669' : '#cbd5e1';
          ctx.strokeStyle = open ? '#065f46' : '#64748b';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.roundRect(dx - 44, H * 0.3, 88, 120, 10);
          ctx.fill();
          ctx.stroke();
          drawLabel(ctx, d, dx, H * 0.3 + 52, open ? '#fff' : '#475569', 12, 'center', true);
          drawLabel(ctx, open ? '🔓 突破' : '🔒 禁止', dx, H * 0.3 + 82, open ? '#fef08a' : '#64748b', 12, 'center', true);
        });

        drawMonoNum(ctx, `已解锁科学发现通道: ${S.unlocked} / 4`, W * 0.5, H * 0.14, S.plural ? '#059669' : '#dc2626', 15, 'center');
        drawToggleButton(ctx, W * 0.34, H * 0.8, 200, 34, S.plural ? '退回单一僵化规则' : '开启方法多元主义 🔓', S.plural, '#059669');
        drawTinyHint(ctx, W, H, '切换单一教条方法与方法多元主义，看被锁死的非标准科学突破之门打开');
      }
    };
  }

  // ==================== #80 哥德尔 · 不完备定理 (Truth Universe Overflowing Axiomatic System Box) ====================
  if (modelId === 80) {
    let S: any = {};
    return {
      init() {
        S = { axioms: 1, t: 0 };
      },
      down(x, y, { W, H }) {
        if (hitBox(x, y, W * 0.32, H * 0.8, 220, 34)) {
          S.axioms = Math.min(5, S.axioms + 1);
        }
      },
      tick({ ctx, W, H, dt, hit }) {
        S.t += dt;
        drawPaperBg(ctx, W, H, true);
        if (S.axioms >= 2) trigger(hit, 0, '强行把哥德尔句 G₁ 加入公理后，系统立刻催生出新的不可证真命题 G₂！');
        if (S.axioms >= 3) {
          trigger(hit, 1, '任何一致且足够强的形式系统，其真命题海洋永远大于可证定理盒子');
          trigger(hit, 2);
        }

        const cx = W * 0.5;
        const cy = H * 0.44;
        // Vast Truth Circle
        ctx.fillStyle = 'rgba(56, 189, 248, 0.14)';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, 128, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        drawLabel(ctx, '数学真理之海', cx, cy - 108, '#7dd3fc', 12, 'center', true);

        // Expanding Provable Box inside, ALWAYS leaving a glowing G_n outside!
        const boxR = 46 + S.axioms * 12;
        ctx.fillStyle = 'rgba(16, 185, 129, 0.28)';
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(cx - boxR, cy - boxR * 0.72, boxR * 2, boxR * 1.44, 10);
        ctx.fill();
        ctx.stroke();
        drawLabel(ctx, `公理系统 S${S.axioms} 可证区`, cx, cy + 4, '#ecfdf5', 12, 'center', true);

        // Unprovable True Gödel Sentence G_n orbiting JUST outside the box!
        const gx = cx + Math.cos(S.t * 1.2) * (boxR + 24);
        const gy = cy + Math.sin(S.t * 1.2) * (boxR * 0.72 + 24);
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(gx, gy, 13, 0, Math.PI * 2);
        ctx.fill();
        drawMonoNum(ctx, `G${S.axioms}`, gx, gy + 4, '#0f172a', 11, 'center');

        drawMonoNum(ctx, `当前公理扩展次数: ${S.axioms}  |  仍有真命题 G${S.axioms} 溢出不可证!`, cx, H * 0.09, '#fde047', 13.5, 'center');
        drawToggleButton(ctx, W * 0.32, H * 0.8, 220, 34, `将 G${S.axioms} 强行塞入新公理 +`, true, '#059669', true);
        drawTinyHint(ctx, W, H, '尝试不断扩充公理箱去吞并金色哥德尔句 G，观察永远有新真命题溢出箱外', true);
      }
    };
  }

  // ==================== #81 蒯因-普特南 · 数学不可或缺性 (Physics Bridge Collapsing When Math Pillars Removed) ====================
  if (modelId === 81) {
    let S: any = {};
    return {
      init() {
        S = { mathPillars: true, sag: 0, t: 0 };
      },
      down(x, y, { W, H }) {
        if (hitBox(x, y, W * 0.32, H * 0.8, 220, 34)) S.mathPillars = !S.mathPillars;
      },
      tick({ ctx, W, H, dt, hit }) {
        S.t += dt;
        S.sag = lerp(S.sag, S.mathPillars ? 0 : 75, dt * 3.5);
        drawPaperBg(ctx, W, H, false);
        if (!S.mathPillars) trigger(hit, 0, '抽走数学实体支柱后，最优物理理论大桥瞬间塌陷失灵！');
        if (S.mathPillars && S.t > 0.8) {
          trigger(hit, 1, '不可或缺性论证：既然我们承诺最佳科学理论为真，便应承认数学对象存在');
          trigger(hit, 2);
        }

        const by = H * 0.38;
        // Math Pillars (Calculus, Hilbert Space, Groups)
        if (S.mathPillars) {
          ['微积分', '希尔伯特空间', '群论'].forEach((lbl, i) => {
            const px = W * 0.28 + i * (W * 0.22);
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(px - 22, by, 44, H * 0.28);
            drawLabel(ctx, lbl, px, by + H * 0.16, '#fff', 11, 'center', true);
          });
        }

        // Physics Theory Bridge bending down when math pillars removed
        ctx.strokeStyle = S.mathPillars ? '#059669' : '#dc2626';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(W * 0.12, by);
        ctx.quadraticCurveTo(W * 0.5, by + S.sag, W * 0.88, by);
        ctx.stroke();
        drawLabel(ctx, S.mathPillars ? '现代物理科学理论大桥 ✓' : '物理理论塌陷 ✕', W * 0.5, by - 18 + S.sag * 0.4, S.mathPillars ? '#059669' : '#dc2626', 13, 'center', true);

        drawToggleButton(ctx, W * 0.32, H * 0.8, 220, 34, S.mathPillars ? '试着抽走所有数学支柱 ✕' : '恢复数学抽象对象支柱 ✓', !S.mathPillars, '#0284c7');
        drawTinyHint(ctx, W, H, '点击抽走桥下数学抽象支柱，检验物理科学能否脱离数学独立屹立');
      }
    };
  }

  return null;
}
