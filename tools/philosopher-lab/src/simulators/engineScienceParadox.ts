import {
  clamp,
  txt,
  drawRoundBox,
  drawCanvasSlider,
  hitSlider,
  drawFooterHint
} from './canvasHelpers';
import { StageEngine } from './engineEthics';

export function createScienceParadoxEngine(modelId: number): Record<number, StageEngine> {
  // ==================== #77 拉卡托斯 · 科学研究纲领 ====================
  if (modelId === 77) {
    let S: any = {};
    return {
      1: {
        init() {
          S = { shots: 0, neptuneFound: false, flashT: 0 };
        },
        down(x, y, { W, H, hit, toast }) {
          if (x < W * 0.45 && y < H * 0.78) {
            S.shots++;
            S.flashT = 0.7;
            hit(1, 0, '反面启发法启动：外围保护带（辅助假设）承受冲击，引力硬核毫发无损！');
            toast('☄ 天王星轨道反常撞击：反面启发法禁止把矛头指向牛顿硬核！');
          } else if (x > W * 0.55 && y < H * 0.78) {
            S.neptuneFound = true;
            hit(1, 1, '正面启发法调整保护带：增设“未知外行星”辅助假设，成功预言并发现海王星！');
            toast('🔭 发现海王星（Neptune）！反常转化为研究纲领的伟大胜利！');
          }
        },
        tick({ ctx, W, H, dt }) {
          ctx.fillStyle = '#f4efe6';
          ctx.fillRect(0, 0, W, H);
          if (S.flashT > 0) S.flashT = Math.max(0, S.flashT - dt);

          const cx = W / 2;
          const cy = H * 0.42;

          // Protective Belt ring
          ctx.fillStyle = S.flashT > 0 ? '#fdebd0' : '#d6eaf8';
          ctx.beginPath();
          ctx.arc(cx, cy, 88, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = S.neptuneFound ? '#27ae60' : '#2e86c1';
          ctx.lineWidth = 3;
          ctx.stroke();

          // Hard Core center
          ctx.fillStyle = '#1f2b38';
          ctx.beginPath();
          ctx.arc(cx, cy, 44, 0, Math.PI * 2);
          ctx.fill();
          txt(ctx, '硬核', cx, cy - 4, '#f3a52b', 13, 'center', true);
          txt(ctx, '牛顿三定律', cx, cy + 14, '#fff', 10.5, 'center');

          txt(ctx, S.neptuneFound ? '外围保护带：已增设【海王星引力摄动】辅助假设' : '外围保护带：行星数量与初始轨道辅助假设', cx, cy - 62, '#1f2b38', 11.5, 'center', true);

          // Left Action Box: Launch Anomaly Meteor
          drawRoundBox(ctx, W * 0.06, H * 0.25, 175, 100, 14, '#fff', '#c0392b', 2.5);
          txt(ctx, '☄ ① 点击发射反常冲击', W * 0.06 + 87, H * 0.25 + 36, '#c0392b', 13, 'center', true);
          txt(ctx, `天王星轨道偏差 (${S.shots}次)`, W * 0.06 + 87, H * 0.25 + 62, '#667', 11.5, 'center');

          // Right Action Box: Positive Heuristic (Predict Neptune)
          drawRoundBox(ctx, W * 0.94 - 175, H * 0.25, 175, 100, 14, S.neptuneFound ? '#e8f8f5' : '#fff8e6', '#27ae60', 2.5);
          txt(ctx, '🔭 ② 点击调整保护带', W * 0.94 - 87, H * 0.25 + 36, '#1e8449', 13, 'center', true);
          txt(ctx, '正面启发：预言海王星', W * 0.94 - 87, H * 0.25 + 62, '#667', 11.5, 'center');

          drawFooterHint(ctx, W, H, '先点击左侧“发射天王星轨道反常冲击”，再点击右侧“调整保护带预言海王星”');
        }
      },
      2: {
        init() {
          S = { v: 0.3, drag: false };
        },
        down(x, y, { W, H }) {
          const s = hitSlider(x, y, W * 0.16, H * 0.78, W * 0.68);
          if (s !== null || y < H * 0.85) {
            S.drag = true;
            S.v = clamp((x - W * 0.16) / (W * 0.68), 0, 1);
          }
        },
        move(x, _y, _dx, _dy, { W }) {
          if (S.drag) {
            S.v = clamp((x - W * 0.16) / (W * 0.68), 0, 1);
          }
        },
        up() {
          S.drag = false;
        },
        tick({ ctx, W, H, hit }) {
          ctx.fillStyle = '#f4efe6';
          ctx.fillRect(0, 0, W, H);

          const isProgressive = S.v >= 0.55;
          drawRoundBox(
            ctx,
            W * 0.14,
            H * 0.16,
            W * 0.72,
            H * 0.46,
            16,
            isProgressive ? '#e8f8f5' : '#fadbd8',
            isProgressive ? '#27ae60' : '#c0392b',
            2.5
          );
          txt(
            ctx,
            isProgressive ? '🚀 进步的研究纲领（Progressive Programme）' : '🥀 退化的研究纲领（Degenerating Programme）',
            W / 2,
            H * 0.27,
            isProgressive ? '#1e8449' : '#c0392b',
            15,
            'center',
            true
          );
          txt(
            ctx,
            isProgressive
              ? '理论走在经验前面：持续预言前所未闻的新颖事实（如爱因斯坦预言星光弯曲）并获证实！'
              : '理论落后于经验：仅能在事后打特设性（Ad hoc）补丁来解释反例，毫无新颖预言力。',
            W / 2,
            H * 0.41,
            '#1f2b38',
            13,
            'center'
          );

          if (S.v < 0.32) hit(2, 0);
          if (S.v > 0.72) hit(2, 1);

          drawCanvasSlider(
            ctx,
            W * 0.16,
            H * 0.78,
            W * 0.68,
            S.v,
            `研究纲领的新颖事实预言力（经验进步度）：${Math.round(S.v * 100)}%`,
            '事后特设性修补（退化）',
            '超前预言新颖事实（进步）',
            isProgressive ? '#27ae60' : '#c0392b'
          );
          drawFooterHint(ctx, W, H, '将底部滑杆先拉至左端（观察退化纲领的特设性补丁），再拉至右端（观察进步纲领的新颖事实预言）');
        }
      }
    };
  }

  // ==================== #79 贝叶斯认识论 ====================
  if (modelId === 79) {
    let S: any = {};
    return {
      1: {
        init() {
          S = { prior: 0.01, sens: 0.99, fpr: 0.05, drag: 0 };
        },
        down(x, y, { W, H }) {
          const s1 = hitSlider(x, y, W * 0.14, H * 0.66, W * 0.32);
          if (s1 !== null) {
            S.drag = 1;
            S.prior = clamp(0.005 + s1 * 0.495, 0.005, 0.5);
            return;
          }
          const s2 = hitSlider(x, y, W * 0.54, H * 0.66, W * 0.32);
          if (s2 !== null) {
            S.drag = 2;
            S.fpr = clamp(0.01 + s2 * 0.24, 0.01, 0.25);
          }
        },
        move(x, _y, _dx, _dy, { W }) {
          if (S.drag === 1) {
            const v = clamp((x - W * 0.14) / (W * 0.32), 0, 1);
            S.prior = clamp(0.005 + v * 0.495, 0.005, 0.5);
          } else if (S.drag === 2) {
            const v = clamp((x - W * 0.54) / (W * 0.32), 0, 1);
            S.fpr = clamp(0.01 + v * 0.24, 0.01, 0.25);
          }
        },
        up() {
          S.drag = 0;
        },
        tick({ ctx, W, H, hit }) {
          ctx.fillStyle = '#f4efe6';
          ctx.fillRect(0, 0, W, H);

          const pE_H = S.sens;
          const pE = pE_H * S.prior + S.fpr * (1 - S.prior);
          const post = (pE_H * S.prior) / Math.max(0.0001, pE);

          // Base-rate visual grid (100 people icons/dots)
          drawRoundBox(ctx, W * 0.12, H * 0.12, W * 0.76, H * 0.38, 14, '#fffdf8', '#3a6f99', 2);
          txt(
            ctx,
            `先验患病率 P(H) = ${(S.prior * 100).toFixed(1)}%  |  假阳性率 P(E|¬H) = ${(S.fpr * 100).toFixed(1)}%`,
            W / 2,
            H * 0.2,
            '#1f2b38',
            13.5,
            'center',
            true
          );
          txt(
            ctx,
            `🎯 检测呈阳性后的真实后验患病概率 P(H|E) = ${(post * 100).toFixed(1)}%`,
            W / 2,
            H * 0.31,
            post < 0.3 ? '#c0392b' : '#27ae60',
            17,
            'center',
            true
          );
          txt(
            ctx,
            post < 0.25
              ? '⚠️ 基础率谬误警示：虽然准确率 99%，但由于先验罕见，大多数阳性其实来自假阳性！'
              : '✓ 随着先验基础率提高或假阳性降低，后验信念度显著跃升！',
            W / 2,
            H * 0.42,
            '#33475b',
            12.5,
            'center',
            true
          );

          if (S.prior < 0.03 && post < 0.25) hit(1, 0);
          if (post > 0.65) hit(1, 1);

          drawCanvasSlider(
            ctx,
            W * 0.14,
            H * 0.66,
            W * 0.32,
            (S.prior - 0.005) / 0.495,
            `① 先验概率 P(H): ${(S.prior * 100).toFixed(1)}%`,
            '0.5% (罕见)',
            '50% (常见)',
            '#3a6f99'
          );
          drawCanvasSlider(
            ctx,
            W * 0.54,
            H * 0.66,
            W * 0.32,
            (S.fpr - 0.01) / 0.24,
            `② 假阳性率 P(E|¬H): ${(S.fpr * 100).toFixed(1)}%`,
            '1% (精准)',
            '25% (粗糙)',
            '#e67e22'
          );

          drawFooterHint(ctx, W, H, '直接拖动左下“先验概率”与右下“假阳性率”两条画布滑杆，实时体验贝叶斯信念更新与基础率谬误');
        }
      },
      2: {
        init() {
          S = { pA: 0.1, pB: 0.9, n: 0 };
        },
        down(_x, y, { H, hit, toast }) {
          if (y < H * 0.82) {
            S.n++;
            // Observe strong positive evidence with Likelihood Ratio = 3
            const update = (p: number) => (p * 3) / (p * 3 + (1 - p) * 1);
            S.pA = update(S.pA);
            S.pB = update(S.pB);
            hit(2, 0);
            if (Math.abs(S.pA - S.pB) < 0.05) {
              hit(2, 1, '先验冲洗（Washing out of Priors）：随着公共证据累积，截然不同的主观先验最终收敛一致！');
              toast('🎯 主观先验分歧已消除：两位科学家在客观证据面前收敛到相同的后验信念！');
            }
          }
        },
        tick({ ctx, W, H }) {
          ctx.fillStyle = '#f4efe6';
          ctx.fillRect(0, 0, W, H);

          drawRoundBox(ctx, W * 0.12, H * 0.14, W * 0.76, H * 0.52, 16, '#fffdf8', '#3a6f99', 2);
          txt(ctx, `已连续注入公共实验证据次数：${S.n} 次（点击画布任意处继续注入新证据）`, W / 2, H * 0.23, '#1f2b38', 14, 'center', true);

          // Bar A: Skeptic (started at 10%)
          txt(ctx, `怀疑派学者 A（初始先验 10%）：当前后验 ${(S.pA * 100).toFixed(1)}%`, W * 0.18, H * 0.34, '#c0392b', 13, 'left', true);
          ctx.fillStyle = '#e74c3c';
          ctx.fillRect(W * 0.18, H * 0.37, W * 0.64 * S.pA, 22);

          // Bar B: Optimist (started at 90%)
          txt(ctx, `乐观派学者 B（初始先验 90%）：当前后验 ${(S.pB * 100).toFixed(1)}%`, W * 0.18, H * 0.5, '#27ae60', 13, 'left', true);
          ctx.fillStyle = '#27ae60';
          ctx.fillRect(W * 0.18, H * 0.53, W * 0.64 * S.pB, 22);

          drawRoundBox(ctx, W * 0.28, H * 0.72, W * 0.44, 42, 12, '#fff8e6', '#f3a52b', 2.5);
          txt(ctx, '🔬 点击此处：注入新一轮有利实验证据 (LR = 3:1)', W / 2, H * 0.72 + 26, '#1f2b38', 13, 'center', true);

          drawFooterHint(ctx, W, H, '连续点击画布注入 5 次以上实验证据，观察 10% 与 90% 的悬殊主观先验如何被客观证据“冲洗”收敛');
        }
      }
    };
  }

  // ==================== #82 囚徒困境 ====================
  if (modelId === 82) {
    let S: any = {};
    return {
      1: {
        init() {
          S = { myMove: 'C', oppMove: 'C', testedCC: false, testedDD: false };
        },
        down(x, y, { W, H, hit, toast }) {
          const cx = W / 2;
          const cy = H * 0.44;
          if (Math.abs(x - cx) < 190 && Math.abs(y - cy) < 115) {
            S.myMove = y < cy ? 'C' : 'D';
            S.oppMove = x < cx ? 'C' : 'D';
            if (S.myMove === 'C' && S.oppMove === 'C') {
              S.testedCC = true;
              hit(1, 0, '双方合作 (C, C)：各判 1 年（帕累托最优），但各自都有背叛以求 0 年释放的诱惑！');
            }
            if (S.myMove === 'D' && S.oppMove === 'D') {
              S.testedDD = true;
              hit(1, 1, '纳什均衡 (D, D)：由于背叛是严格占优策略，个体理性将双方锁入各判 3 年的集体次优结局！');
              toast('🔒 陷入 (背叛, 背叛) 纳什均衡陷阱：双方各判 3 年，比双方合作更糟！');
            }
          }
        },
        tick({ ctx, W, H }) {
          ctx.fillStyle = '#f4efe6';
          ctx.fillRect(0, 0, W, H);

          const cx = W / 2;
          const cy = H * 0.44;
          const cells = [
            { r: 'C', c: 'C', x: cx - 175, y: cy - 100, title: '双方合作 (C, C)', sub: '各判 1 年（集体最优）', col: '#e8f8f5' },
            { r: 'C', c: 'D', x: cx + 10, y: cy - 100, title: '我合作 · 彼背叛', sub: '我判 5 年 / 彼 0 年释放', col: '#fef9e7' },
            { r: 'D', c: 'C', x: cx - 175, y: cy + 8, title: '我背叛 · 彼合作', sub: '我 0 年释放 / 彼判 5 年', col: '#fef9e7' },
            { r: 'D', c: 'D', x: cx + 10, y: cy + 8, title: '双方背叛 (D, D)', sub: '各判 3 年（纳什均衡！）', col: '#fadbd8' }
          ];

          cells.forEach((cell) => {
            const active = S.myMove === cell.r && S.oppMove === cell.c;
            drawRoundBox(ctx, cell.x, cell.y, 165, 95, 12, cell.col, active ? '#f3a52b' : '#8a9ba8', active ? 3.5 : 1.5);
            txt(ctx, cell.title, cell.x + 82, cell.y + 36, '#1f2b38', 13, 'center', true);
            txt(ctx, cell.sub, cell.x + 82, cell.y + 64, active ? '#c0392b' : '#555', 11.5, 'center', active);
          });

          drawFooterHint(ctx, W, H, '直接点击收益矩阵的四个象限格子：对比左上角「双方合作 (C,C)」与右下角「纳什均衡 (D,D)」');
        }
      },
      2: {
        init() {
          S = { rounds: [] as Array<{ me: string; tft: string }>, myScore: 0, tftScore: 0 };
        },
        down(x, y, { W, H, hit }) {
          if (y > H * 0.85) return;
          const me = x < W / 2 ? 'C' : 'D';
          // Tit-for-Tat copies player's previous move (starts with C)
          const tft = S.rounds.length === 0 ? 'C' : S.rounds[S.rounds.length - 1].me;
          const pts =
            me === 'C' && tft === 'C'
              ? [3, 3]
              : me === 'D' && tft === 'D'
              ? [1, 1]
              : me === 'D' && tft === 'C'
              ? [5, 0]
              : [0, 5];
          S.myScore += pts[0];
          S.tftScore += pts[1];
          S.rounds.push({ me, tft });
          if (S.rounds.length > 8) S.rounds.shift();

          if (me === 'D') hit(2, 0, '你选择了背叛：下一轮“一报还一报（Tit-for-Tat）”将立即对你实施对等报复！');
          if (S.rounds.length >= 3 && me === 'C' && tft === 'C') {
            hit(2, 1, '未来的阴影与一报还一报：善意开局、有仇必报、立即宽恕，促成长期合作演化！');
          }
        },
        tick({ ctx, W, H }) {
          ctx.fillStyle = '#f4efe6';
          ctx.fillRect(0, 0, W, H);

          drawRoundBox(ctx, W * 0.14, H * 0.14, W * 0.33, 86, 14, '#e8f8f5', '#27ae60', 2.5);
          txt(ctx, '🤝 点击左半场：本轮出【合作 C】', W * 0.305, H * 0.14 + 36, '#1e8449', 13.5, 'center', true);
          txt(ctx, '向“一报还一报”释放善意或修复关系', W * 0.305, H * 0.14 + 62, '#555', 11.5, 'center');

          drawRoundBox(ctx, W * 0.53, H * 0.14, W * 0.33, 86, 14, '#fadbd8', '#c0392b', 2.5);
          txt(ctx, '🗡 点击右半场：本轮出【背叛 D】', W * 0.695, H * 0.14 + 36, '#c0392b', 13.5, 'center', true);
          txt(ctx, '试探偷袭（将触发对方下一轮报复）', W * 0.695, H * 0.14 + 62, '#555', 11.5, 'center');

          txt(
            ctx,
            `累计得分 —— 你：${S.myScore} 分  |  “一报还一报 (Tit-for-Tat)”对手：${S.tftScore} 分`,
            W / 2,
            H * 0.48,
            '#1f2b38',
            14,
            'center',
            true
          );

          // History beads
          S.rounds.forEach((r: any, i: number) => {
            const bx = W * 0.18 + i * 74;
            drawRoundBox(ctx, bx, H * 0.55, 62, 54, 10, '#fff', '#3a6f99', 1.5);
            txt(ctx, `你:${r.me}`, bx + 31, H * 0.55 + 22, r.me === 'C' ? '#27ae60' : '#c0392b', 12, 'center', true);
            txt(ctx, `TFT:${r.tft}`, bx + 31, H * 0.55 + 42, r.tft === 'C' ? '#27ae60' : '#c0392b', 12, 'center', true);
          });

          drawFooterHint(ctx, W, H, '与阿克塞尔罗德“一报还一报”机器人实时多轮博弈：先点右侧试探背叛，再点左侧重归合作');
        }
      }
    };
  }

  // ==================== #83 芝诺运动悖论 ====================
  if (modelId === 83) {
    let S: any = {};
    return {
      1: {
        init() {
          S = { n: 0, pos: 0 };
        },
        down(_x, y, { H, hit, toast }) {
          if (y < H * 0.85) {
            S.n++;
            S.pos = 1 - Math.pow(0.5, S.n);
            if (S.n >= 1) hit(1, 0, `第 ${S.n} 次二分中点：已走完总路程的 ${(S.pos * 100).toFixed(3)}%，前方仍有无限个半程！`);
            if (S.n >= 5) {
              hit(1, 1, '无穷级数收敛：Σ(1/2)ⁿ = 1，无限个半程所需的时间级数同样收敛于有限时间！');
              toast('🏁 数学极限揭晓：无穷多个递减时间段之和等于有限常数 1，阿基里斯顺利抵达终点！');
            }
          }
        },
        tick({ ctx, W, H }) {
          ctx.fillStyle = '#f4efe6';
          ctx.fillRect(0, 0, W, H);

          const x0 = W * 0.14;
          const bw = W * 0.72;
          const by = H * 0.44;

          ctx.strokeStyle = '#33475b';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(x0, by);
          ctx.lineTo(x0 + bw, by);
          ctx.stroke();

          // Draw bisection markers 1/2, 3/4, 7/8, 15/16...
          for (let k = 1; k <= Math.max(5, S.n); k++) {
            const p = 1 - Math.pow(0.5, k);
            const mx = x0 + bw * p;
            ctx.strokeStyle = k <= S.n ? '#27ae60' : '#bdc3c7';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(mx, by - 16);
            ctx.lineTo(mx, by + 16);
            ctx.stroke();
            if (k <= 4) {
              txt(ctx, `${Math.pow(2, k) - 1}/${Math.pow(2, k)}`, mx, by + 34, '#33475b', 11);
            }
          }

          // Runner position
          const rx = x0 + bw * S.pos;
          ctx.fillStyle = '#f3a52b';
          ctx.beginPath();
          ctx.arc(rx, by - 26, 16, 0, Math.PI * 2);
          ctx.fill();
          txt(ctx, '🏃', rx, by - 21, '#111', 15);

          txt(
            ctx,
            `已分割推进 ${S.n} 步  |  当前累计行程 Σ(1/2)ⁿ = ${(S.pos * 100).toFixed(4)}%`,
            W / 2,
            H * 0.2,
            '#1f2b38',
            15,
            'center',
            true
          );

          drawRoundBox(ctx, W * 0.27, H * 0.68, W * 0.46, 44, 12, '#fff8e6', '#f3a52b', 2.5);
          txt(ctx, '⚡ 点击赛道：继续切分并跨越剩余路程的一半 (+1/2ⁿ)', W / 2, H * 0.68 + 27, '#1f2b38', 13, 'center', true);

          drawFooterHint(ctx, W, H, '连续点击赛道 5 次以上，亲手把剩余路程不断二分，观察无穷级数如何逼近极限 1');
        }
      },
      2: {
        init() {
          S = { t: 0.2, freeze: true, drag: false };
        },
        down(x, y, { W, H, hit }) {
          const s = hitSlider(x, y, W * 0.16, H * 0.78, W * 0.68);
          if (s !== null) {
            S.drag = true;
            S.t = s;
            return;
          }
          S.freeze = !S.freeze;
          hit(2, S.freeze ? 0 : 1);
        },
        move(x, _y, _dx, _dy, { W, hit }) {
          if (S.drag) {
            S.t = clamp((x - W * 0.16) / (W * 0.68), 0, 1);
            if (S.t < 0.35) hit(2, 0);
            if (S.t > 0.75) hit(2, 1);
          }
        },
        up() {
          S.drag = false;
        },
        tick({ ctx, W, H }) {
          ctx.fillStyle = '#f4efe6';
          ctx.fillRect(0, 0, W, H);

          const ax = W * (0.2 + S.t * 0.6);
          const ay = H * 0.4;

          drawRoundBox(ctx, ax - 55, ay - 28, 110, 56, 10, '#fff8e6', '#e67e22', 2);
          txt(ctx, '🏹 飞矢 (Arrow)', ax, ay - 2, '#d35400', 13, 'center', true);
          txt(ctx, `时刻 t=${S.t.toFixed(2)}s`, ax, ay + 18, '#555', 11.5, 'center');

          txt(
            ctx,
            '芝诺飞矢不动：在孤立无延展的瞬间 Δt = 0，飞矢占据等于自身体积的空间',
            W / 2,
            H * 0.18,
            '#1f2b38',
            13.5,
            'center',
            true
          );
          txt(
            ctx,
            '微积分与点集连续统解答：瞬时速度 v = lim(Δx/Δt) 是时刻邻域的变化率函数！',
            W / 2,
            H * 0.62,
            '#1e8449',
            13,
            'center',
            true
          );

          drawCanvasSlider(ctx, W * 0.16, H * 0.78, W * 0.68, S.t, '拖动时间轴时刻 t（比较静态瞬时切片 vs 连续位移导数 dx/dt）', 't = 0.00s', 't = 1.00s', '#e67e22');
          drawFooterHint(ctx, W, H, '拖动时间轴滑杆观察飞矢在每个孤立瞬间的“静止切片”与连续函数运动');
        }
      }
    };
  }

  // ==================== #84 希尔伯特无限旅馆悖论 ====================
  if (modelId === 84) {
    let S: any = {};
    return {
      1: {
        init() {
          S = { shift: 0, mode: 'full' };
        },
        down(x, y, { W, H, hit, toast }) {
          if (y > H * 0.85) return;
          if (x < W * 0.5) {
            S.shift = 1;
            S.mode = 'plus1';
            hit(1, 0, '全体住客从 n 号房移至 n+1 号房：1 号房瞬间腾空，客满的无限旅馆顺利入住新客！');
            toast('🏨 广播指令 n → n+1：1 号房已腾空，新旅客顺利入住！');
          } else {
            S.shift = 2;
            S.mode = 'double';
            hit(1, 1, '全体住客从 n 号房移至 2n 偶数房：所有无穷多间奇数号房全部腾空！');
            toast('🚌 广播指令 n → 2n：所有奇数房（1, 3, 5, 7…）全部腾空，容纳可数无穷新客！');
          }
        },
        tick({ ctx, W, H }) {
          ctx.fillStyle = '#f4efe6';
          ctx.fillRect(0, 0, W, H);

          // Draw first 8 rooms of Hilbert's Grand Hotel
          for (let i = 1; i <= 8; i++) {
            const rx = W * 0.08 + (i - 1) * (W * 0.105);
            const ry = H * 0.22;
            let occupant = `旧客 #${i}`;
            let bg = '#d6eaf8';
            if (S.mode === 'plus1') {
              occupant = i === 1 ? '★ 新客入住!' : `旧客 #${i - 1}`;
              bg = i === 1 ? '#fef9e7' : '#d6eaf8';
            } else if (S.mode === 'double') {
              const isOdd = i % 2 === 1;
              occupant = isOdd ? '★ 空出(迎新)' : `旧客 #${i / 2}`;
              bg = isOdd ? '#e8f8f5' : '#d6eaf8';
            }
            drawRoundBox(ctx, rx, ry, W * 0.095, 86, 10, bg, '#3a6f99', 2);
            txt(ctx, `${i} 号房`, rx + W * 0.0475, ry + 26, '#1f2b38', 12.5, 'center', true);
            txt(ctx, occupant, rx + W * 0.0475, ry + 56, '#c0392b', 11, 'center', true);
          }

          drawRoundBox(ctx, W * 0.12, H * 0.62, W * 0.35, 52, 12, '#fff8e6', '#f3a52b', 2.5);
          txt(ctx, '📢 ① 点击广播：全体移至 n + 1 号房', W * 0.295, H * 0.62 + 31, '#1f2b38', 13, 'center', true);

          drawRoundBox(ctx, W * 0.53, H * 0.62, W * 0.35, 52, 12, '#e8f8f5', '#27ae60', 2.5);
          txt(ctx, '📢 ② 点击广播：全体移至 2n 偶数号房', W * 0.705, H * 0.62 + 31, '#1e8449', 13, 'center', true);

          drawFooterHint(ctx, W, H, '先后点击左下“n → n+1”与右下“n → 2n”两条旅馆广播按钮，观察可数无穷集合的双射奇迹');
        }
      },
      2: {
        init() {
          S = { flipped: [false, false, false, false] };
        },
        down(x, y, { W, H, hit, toast }) {
          for (let i = 0; i < 4; i++) {
            const bx = W * 0.32 + i * 75;
            const by = H * 0.2 + i * 44;
            if (Math.hypot(x - bx, y - by) < 35 || y < H * 0.8) {
              S.flipped[i] = true;
              hit(2, 0);
              if (S.flipped.filter(Boolean).length >= 2) {
                hit(2, 1, '康托尔对角线翻转：构造出的新实数在第 k 位与第 k 行不同，实数不可数（c > ℵ₀）！');
                toast('♾ 康托尔对角线论证完成：实数连续统无法住进可数无限旅馆！');
              }
            }
          }
        },
        tick({ ctx, W, H }) {
          ctx.fillStyle = '#f4efe6';
          ctx.fillRect(0, 0, W, H);

          const rows = [
            ['r₁ = 0.', '0', '1', '0', '1'],
            ['r₂ = 0.', '1', '1', '0', '0'],
            ['r₃ = 0.', '0', '0', '1', '1'],
            ['r₄ = 0.', '1', '0', '1', '0']
          ];

          txt(ctx, '康托尔对角线法：点击对角线上的橙色数字将其翻转（0↔1）', W / 2, H * 0.13, '#1f2b38', 14, 'center', true);

          rows.forEach((r, i) => {
            const ry = H * 0.24 + i * 42;
            txt(ctx, r[0], W * 0.24, ry + 6, '#33475b', 14, 'right', true);
            for (let j = 0; j < 4; j++) {
              const bx = W * 0.32 + j * 75;
              const isDiag = i === j;
              drawRoundBox(
                ctx,
                bx - 22,
                ry - 16,
                44,
                32,
                8,
                isDiag ? (S.flipped[i] ? '#27ae60' : '#f3a52b') : '#fff',
                '#33475b',
                1.5
              );
              const digit = isDiag && S.flipped[i] ? (r[j + 1] === '0' ? '1*' : '0*') : r[j + 1];
              txt(ctx, digit, bx, ry + 5, isDiag ? '#fff' : '#1f2b38', 13, 'center', true);
            }
          });

          drawFooterHint(ctx, W, H, '直接点击画面对角线上的橙色方格将其翻转（0 变 1，1 变 0），构造出不在列表中的逃逸实数');
        }
      }
    };
  }

  // ==================== #85 蒙提霍尔问题 ====================
  if (modelId === 85) {
    let S: any = {};
    return {
      1: {
        init() {
          S = {
            car: Math.floor(Math.random() * 3),
            picked: -1,
            opened: -1,
            finalPick: -1,
            switchWins: 0,
            switchTotal: 0,
            stayWins: 0,
            stayTotal: 0
          };
        },
        down(x, y, { W, H, hit, toast }) {
          // Batch 100 trials button at bottom
          if (y > H * 0.64 && y < H * 0.84) {
            for (let k = 0; k < 50; k++) {
              const car = Math.floor(Math.random() * 3);
              const pick = Math.floor(Math.random() * 3);
              S.switchTotal++;
              if (pick !== car) S.switchWins++;
              S.stayTotal++;
              if (pick === car) S.stayWins++;
            }
            hit(1, 0);
            hit(1, 1, '大数定律验证：换门胜率稳定收敛于 66.7% (2/3)，不换门仅为 33.3% (1/3)！');
            toast('🎲 已快速模拟 +50 局：换门胜率 ~66.7%，不换胜率 ~33.3%！');
            return;
          }

          // Click on one of the 3 doors
          for (let i = 0; i < 3; i++) {
            const dx = W * (0.24 + i * 0.26);
            if (Math.abs(x - dx) < 68 && y > H * 0.14 && y < H * 0.6) {
              if (S.picked === -1) {
                S.picked = i;
                // Host opens a goat door
                const candidates = [0, 1, 2].filter((d) => d !== S.picked && d !== S.car);
                S.opened = candidates[Math.floor(Math.random() * candidates.length)];
                hit(1, 0, `你选了 ${i + 1} 号门（1/3 有车）；主持人知情打开了有山羊的 ${S.opened + 1} 号门！`);
              } else if (S.finalPick === -1 && i !== S.opened) {
                S.finalPick = i;
                const switched = S.finalPick !== S.picked;
                const won = S.finalPick === S.car;
                if (switched) {
                  S.switchTotal++;
                  if (won) S.switchWins++;
                } else {
                  S.stayTotal++;
                  if (won) S.stayWins++;
                }
                hit(1, 1, switched ? (won ? '换门成功赢得跑车！(2/3 概率集中于另一扇门)' : '本局换门遇山羊，再来一局体验 2/3 长期胜率') : '你选择了坚持原门（胜率仅 1/3）');
              } else {
                // Reset round for immediate replay
                S.car = Math.floor(Math.random() * 3);
                S.picked = i;
                const candidates = [0, 1, 2].filter((d) => d !== S.picked && d !== S.car);
                S.opened = candidates[Math.floor(Math.random() * candidates.length)];
                S.finalPick = -1;
              }
            }
          }
        },
        tick({ ctx, W, H }) {
          ctx.fillStyle = '#f4efe6';
          ctx.fillRect(0, 0, W, H);

          for (let i = 0; i < 3; i++) {
            const dx = W * (0.24 + i * 0.26);
            const isOpen = S.opened === i || S.finalPick !== -1;
            const isCar = S.car === i;
            drawRoundBox(
              ctx,
              dx - 64,
              H * 0.16,
              128,
              140,
              12,
              isOpen ? (isCar ? '#fef9e7' : '#eaecee') : '#d35400',
              S.picked === i ? '#f3a52b' : '#33475b',
              S.picked === i ? 4 : 2
            );
            txt(ctx, `${i + 1} 号门`, dx, H * 0.24, isOpen ? '#1f2b38' : '#fff', 14, 'center', true);
            if (isOpen) {
              txt(ctx, isCar ? '🏎 跑车!' : '🐐 山羊', dx, H * 0.38, isCar ? '#d35400' : '#555', 16, 'center', true);
            } else {
              txt(ctx, S.picked === i ? '★ 初选此门' : '点击选择', dx, H * 0.38, '#fff8e6', 12.5, 'center', true);
            }
            if (S.picked !== -1 && S.finalPick === -1 && i !== S.opened) {
              txt(ctx, i === S.picked ? '点击=坚持不换' : '★ 点击=换到这扇门!', dx, H * 0.5, '#f1c40f', 11.5, 'center', true);
            }
          }

          const swRate = S.switchTotal > 0 ? ((S.switchWins / S.switchTotal) * 100).toFixed(1) : '66.7';
          const stRate = S.stayTotal > 0 ? ((S.stayWins / S.stayTotal) * 100).toFixed(1) : '33.3';

          drawRoundBox(ctx, W * 0.18, H * 0.66, W * 0.64, 44, 12, '#fff8e6', '#27ae60', 2);
          txt(
            ctx,
            `🎲 点击快速模拟 +50 局  |  换门胜率: ${swRate}% (${S.switchWins}/${S.switchTotal})  vs  不换胜率: ${stRate}% (${S.stayWins}/${S.stayTotal})`,
            W / 2,
            H * 0.66 + 27,
            '#1f2b38',
            12.5,
            'center',
            true
          );

          drawFooterHint(ctx, W, H, '直接点击三扇门亲自体验“初选 → 主持人开山羊门 → 决定是否换门”，或点击下方按钮批量模拟');
        }
      },
      2: {
        init() {
          S = { doors: 10, drag: false };
        },
        down(x, y, { W, H }) {
          const s = hitSlider(x, y, W * 0.16, H * 0.78, W * 0.68);
          if (s !== null || y < H * 0.85) {
            S.drag = true;
            S.doors = Math.round(3 + clamp((x - W * 0.16) / (W * 0.68), 0, 1) * 97);
          }
        },
        move(x, _y, _dx, _dy, { W }) {
          if (S.drag) {
            S.doors = Math.round(3 + clamp((x - W * 0.16) / (W * 0.68), 0, 1) * 97);
          }
        },
        up() {
          S.drag = false;
        },
        tick({ ctx, W, H, hit }) {
          ctx.fillStyle = '#f4efe6';
          ctx.fillRect(0, 0, W, H);

          const stayP = (1 / S.doors) * 100;
          const switchP = ((S.doors - 1) / S.doors) * 100;

          drawRoundBox(ctx, W * 0.13, H * 0.15, W * 0.74, H * 0.48, 16, '#fffdf8', '#3a6f99', 2);
          txt(ctx, `N = ${S.doors} 扇门思想实验：主持人知情排除了其余 ${S.doors - 2} 扇山羊门`, W / 2, H * 0.25, '#1f2b38', 14.5, 'center', true);
          txt(ctx, `坚持初选 1 号门的胜率：1/${S.doors} (${stayP.toFixed(1)}%)`, W / 2, H * 0.37, '#c0392b', 14, 'center', true);
          txt(ctx, `★ 换到唯一剩下的那扇门胜率：${S.doors - 1}/${S.doors} (${switchP.toFixed(1)}%)`, W / 2, H * 0.49, '#27ae60', 16, 'center', true);

          if (S.doors <= 15) hit(2, 0);
          if (S.doors >= 80) hit(2, 1, '百门直觉放大镜：主持人帮你筛掉了 98 扇山羊门，99/100 的概率全部浓缩在剩下的那扇门上！');

          drawCanvasSlider(
            ctx,
            W * 0.16,
            H * 0.78,
            W * 0.68,
            (S.doors - 3) / 97,
            `总门数 N = ${S.doors} 扇（主持人打开 ${S.doors - 2} 扇山羊门）`,
            '3 扇门 (2/3)',
            '100 扇门 (99/100)',
            '#27ae60'
          );
          drawFooterHint(ctx, W, H, '向右拖动底部滑杆将总门数从 3 扇扩展到 100 扇，瞬间看清为什么主持人筛选操作会浓缩概率');
        }
      }
    };
  }

  // ==================== #86 辛普森悖论 ====================
  if (modelId === 86) {
    let S: any = {};
    return {
      1: {
        init() {
          S = { weight: 0.15, drag: false };
        },
        down(x, y, { W, H }) {
          const s = hitSlider(x, y, W * 0.16, H * 0.78, W * 0.68);
          if (s !== null || y < H * 0.85) {
            S.drag = true;
            S.weight = clamp((x - W * 0.16) / (W * 0.68), 0, 1);
          }
        },
        move(x, _y, _dx, _dy, { W }) {
          if (S.drag) {
            S.weight = clamp((x - W * 0.16) / (W * 0.68), 0, 1);
          }
        },
        up() {
          S.drag = false;
        },
        tick({ ctx, W, H, hit }) {
          ctx.fillStyle = '#f4efe6';
          ctx.fillRect(0, 0, W, H);

          // Within both mild and severe groups, Therapy A > Therapy B:
          // Mild group: A = 93%, B = 87%
          // Severe group: A = 73%, B = 69%
          // When Therapy A gets disproportionate share of Severe patients (weight -> 1), aggregate reverses!
          const aSevereShare = 0.2 + S.weight * 0.7; // A gets up to 90% severe cases
          const bSevereShare = 0.8 - S.weight * 0.65; // B gets mostly mild cases

          const totalA = 0.93 * (1 - aSevereShare) + 0.73 * aSevereShare;
          const totalB = 0.87 * (1 - bSevereShare) + 0.69 * bSevereShare;
          const reversed = totalB > totalA;

          drawRoundBox(ctx, W * 0.08, H * 0.13, W * 0.4, H * 0.48, 14, '#e8f8f5', '#27ae60', 2);
          txt(ctx, '📊 分组对比（新疗法 A 在两组皆胜出！）', W * 0.28, H * 0.21, '#1e8449', 13, 'center', true);
          txt(ctx, '轻症组治愈率：疗法 A 93%  >  传统 B 87%', W * 0.28, H * 0.34, '#1f2b38', 12.5, 'center', true);
          txt(ctx, '重症组治愈率：疗法 A 73%  >  传统 B 69%', W * 0.28, H * 0.47, '#1f2b38', 12.5, 'center', true);

          drawRoundBox(
            ctx,
            W * 0.52,
            H * 0.13,
            W * 0.4,
            H * 0.48,
            14,
            reversed ? '#fadbd8' : '#fffdf8',
            reversed ? '#c0392b' : '#3a6f99',
            2.5
          );
          txt(ctx, reversed ? '⚡ 辛普森悖论触发：汇总胜率反转！' : '📈 总体汇总对比（样本均衡时）', W * 0.72, H * 0.21, reversed ? '#c0392b' : '#1f2b38', 13, 'center', true);
          txt(ctx, `新疗法 A 总治愈率：${(totalA * 100).toFixed(1)}% (重症占比 ${Math.round(aSevereShare * 100)}%)`, W * 0.72, H * 0.34, '#1f2b38', 12.5, 'center', true);
          txt(ctx, `传统疗法 B 总治愈率：${(totalB * 100).toFixed(1)}% (轻症占比 ${Math.round((1 - bSevereShare) * 100)}%)`, W * 0.72, H * 0.47, reversed ? '#c0392b' : '#1f2b38', 12.5, 'center', true);

          if (!reversed) hit(1, 0);
          if (reversed) hit(1, 1, '辛普森悖论：新疗法 A 在轻症与重症两组都更好，但因接收了大量重症患者，汇总总胜率反而低于 B！');

          drawCanvasSlider(
            ctx,
            W * 0.16,
            H * 0.78,
            W * 0.68,
            S.weight,
            `混杂变量偏移度（将重症患者集中分配给新疗法 A 的比例）：${Math.round(aSevereShare * 100)}%`,
            '分组样本均衡 (A总评胜)',
            'A集中收治重症 (B总评反超!)',
            reversed ? '#c0392b' : '#27ae60'
          );
          drawFooterHint(ctx, W, H, '向右拖动底部滑杆，提高新疗法 A 接收重症患者的比例，亲眼见证“分组皆赢、总评却输”的统计反转');
        }
      },
      2: {
        init() {
          S = { blockConfounder: false };
        },
        down(_x, y, { H, hit, toast }) {
          if (y < H * 0.85) {
            S.blockConfounder = !S.blockConfounder;
            if (!S.blockConfounder) {
              hit(2, 0);
            } else {
              hit(2, 1, '朱迪亚·珍珠 do-算子干预：斩断“病情严重度 → 疗法选择”的后门混杂路径，恢复真实因果效应！');
              toast('✂️ 已施行 do(疗法) 因果干预：阻断后门混杂路径，应当采用分层数据推荐新疗法 A！');
            }
          }
        },
        tick({ ctx, W, H }) {
          ctx.fillStyle = '#f4efe6';
          ctx.fillRect(0, 0, W, H);

          drawRoundBox(ctx, W * 0.14, H * 0.14, W * 0.72, H * 0.54, 16, S.blockConfounder ? '#e8f8f5' : '#fff8e6', '#3a6f99', 2.5);
          txt(ctx, '朱迪亚·珍珠因果图（DAG）：点击画布施行 do(X) 干预切断混杂路径', W / 2, H * 0.23, '#1f2b38', 14, 'center', true);

          // Confounder node Z (Severity) at top
          drawRoundBox(ctx, W / 2 - 75, H * 0.28, 150, 38, 10, '#fdebd0', '#e67e22', 2);
          txt(ctx, '混杂变量 Z：病情轻重', W / 2, H * 0.28 + 24, '#1f2b38', 12.5, 'center', true);

          // Treatment X (Left) and Recovery Y (Right)
          drawRoundBox(ctx, W * 0.22, H * 0.48, 140, 42, 10, '#d6eaf8', '#2e86c1', 2);
          txt(ctx, '疗法选择 X (A/B)', W * 0.22 + 70, H * 0.48 + 26, '#1f2b38', 12.5, 'center', true);

          drawRoundBox(ctx, W * 0.78 - 140, H * 0.48, 140, 42, 10, '#d5f5e3', '#27ae60', 2);
          txt(ctx, '康复结果 Y', W * 0.78 - 70, H * 0.48 + 26, '#1f2b38', 12.5, 'center', true);

          txt(
            ctx,
            S.blockConfounder
              ? '✂️ 已切断 Z → X 后门混杂路径（随机对照/分层控制）：真实因果结论为【新疗法 A 更优】！'
              : '⚠️ 后门路径 Z → X 敞开（重症更倾向选 A）：粗略汇总数据被混杂污染！点击画布将其切断',
            W / 2,
            H * 0.62,
            S.blockConfounder ? '#1e8449' : '#c0392b',
            13,
            'center',
            true
          );

          drawFooterHint(ctx, W, H, '直接点击画布中央的因果图切换“未控制混杂”与“do(X) 阻断后门混杂路径”');
        }
      }
    };
  }

  // ==================== #78, #80, #81 (费耶阿本德、亨普尔乌鸦悖论、纽康悖论) ====================
  let P: any = {};
  return {
    1: {
      init() {
        P = {
          v: 0.25,
          drag: null,
          count: 0,
          items: [
            { x: 0.24, y: 0.36, done: false },
            { x: 0.5, y: 0.44, done: false },
            { x: 0.76, y: 0.36, done: false }
          ]
        };
      },
      down(x, y, { W, H }) {
        const s = hitSlider(x, y, W * 0.16, H * 0.8, W * 0.68);
        if (s !== null) {
          P.drag = 'slider';
          P.v = s;
          return;
        }
        for (const it of P.items) {
          if (Math.hypot(x - W * it.x, y - H * it.y) < 48) {
            P.drag = it;
            return;
          }
        }
      },
      move(x, y, _dx, _dy, { W, H }) {
        if (P.drag === 'slider') {
          P.v = clamp((x - W * 0.16) / (W * 0.68), 0, 1);
        } else if (P.drag && typeof P.drag === 'object') {
          P.drag.x = clamp(x / W, 0.12, 0.88);
          P.drag.y = clamp(y / H, 0.18, 0.66);
        }
      },
      up({ hit }) {
        if (P.drag && typeof P.drag === 'object') {
          P.drag.done = true;
          P.count++;
          hit(1, 0);
          if (P.count >= 2) hit(1, 1);
        } else if (P.drag === 'slider') {
          if (P.v > 0.3) hit(1, 0);
          if (P.v > 0.75) hit(1, 1);
        }
        P.drag = null;
      },
      tick({ ctx, W, H, hit }) {
        ctx.fillStyle = '#f4efe6';
        ctx.fillRect(0, 0, W, H);
        const cfg1: Record<number, [string, string[], string]> = {
          78: ['费耶阿本德：伽利略的反归纳突破与“怎么都行（Anything Goes）”', ['望远镜新光学假说', '动力学相对性反归纳', '打破亚里士多德教条'], '方法论多元自由度（拒绝单一僵化规则）'],
          80: ['亨普尔乌鸦悖论：∀x(Rx→Bx) 逻辑等价于逆否命题 ∀x(¬Bx→¬Rx)', ['观察：一只黑乌鸦 (R∧B)', '观察：一颗红苹果 (¬B∧¬R)', '逻辑等价性传导桥'], '等价条件下的室内确证传导度'],
          81: ['纽康悖论：超级预测者 Omega 的透明盒 ($1,000) 与不透明盒 ($1,000,000)', ['只拿 B 盒（单盒派 EDT：$100万）', '两盒都拿（双盒派 CDT：$1千）', 'Omega 99.9% 事前预测镜'], '证据决策论（EDT）与因果决策论（CDT）张力']
        };
        const c = cfg1[modelId] || cfg1[78];

        drawRoundBox(ctx, W * 0.13, H * 0.14, W * 0.74, H * 0.52, 16, '#fffdf8', '#3a6f99', 2);
        txt(ctx, c[0], W / 2, H * 0.21, '#1f2b38', 14, 'center', true);

        P.items.forEach((it: any, i: number) => {
          const ix = W * it.x;
          const iy = H * it.y;
          ctx.strokeStyle = 'rgba(58,111,153,0.4)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(W / 2, H * 0.42);
          ctx.lineTo(ix, iy);
          ctx.stroke();

          drawRoundBox(ctx, ix - 82, iy - 22, 164, 44, 14, it.done ? '#e8f8f5' : '#fff8e6', it.done ? '#27ae60' : '#f3a52b', 2.5);
          txt(ctx, c[1][i], ix, iy + 5, '#1f2b38', 12, 'center', true);
        });

        if (P.v > 0.76) hit(1, 1);
        drawCanvasSlider(ctx, W * 0.16, H * 0.8, W * 0.68, P.v, `${c[2]}：${Math.round(P.v * 100)}%`, '0%', '100%', '#3a6f99');
        drawFooterHint(ctx, W, H, '直接拖动画面中的三个实验组件进行交互验证，并将底部滑杆拉至右端');
      }
    },
    2: {
      init() {
        P = { v: 0.25, mode: 0, drag: false, count: 0 };
      },
      down(x, y, { W, H, hit }) {
        const s = hitSlider(x, y, W * 0.16, H * 0.78, W * 0.68);
        if (s !== null) {
          P.drag = true;
          P.v = s;
          return;
        }
        P.mode = (P.mode + 1) % 2;
        P.count++;
        hit(2, 0);
        if (P.count >= 2) hit(2, 1);
      },
      move(x, _y, _dx, _dy, { W, hit }) {
        if (P.drag) {
          P.v = clamp((x - W * 0.16) / (W * 0.68), 0, 1);
          if (P.v > 0.35) hit(2, 0);
          if (P.v > 0.78) hit(2, 1);
        }
      },
      up() {
        P.drag = false;
      },
      tick({ ctx, W, H }) {
        ctx.fillStyle = '#f4efe6';
        ctx.fillRect(0, 0, W, H);
        const cfg2: Record<number, [string, string, string]> = {
          78: ['② 理论增生原则（Proliferation of Theories）与科学在自由社会中的去特权化', '点击切换：引入非正统竞争假说打破主流理论盲区', '科学共同体的方法多元与民主监督度'],
          80: ['② 贝叶斯消解乌鸦悖论：全宇宙“非黑物”基数远大于“乌鸦”基数', '点击切换：观察黑乌鸦（大幅提升后验）vs 观察红苹果（仅提升十亿分之一微弱确证）', '集合基数比例对确证度（Confirmation）的稀释效应'],
          81: ['② 透明盒子变体与逆向因果边界：既然钱已在盒中，现在拿两盒能否改变过去？', '点击切换：EDT（关联好消息：$100万）↔ CDT（支配原则：比单盒多拿 $1,000）', '决策论原则在自由意志与预测宿命间的权重']
        };
        const c = cfg2[modelId] || cfg2[78];

        drawRoundBox(ctx, W * 0.13, H * 0.14, W * 0.74, H * 0.5, 16, P.v > 0.6 || P.mode > 0 ? '#e8f8f5' : '#fff8e6', '#27ae60', 2.5);
        txt(ctx, c[0], W / 2, H * 0.23, '#1f2b38', 13.5, 'center', true);
        txt(ctx, `🔄 点击中央卡片切换分析视角（当前 #${P.mode + 1}）：${c[1]}`, W / 2, H * 0.39, '#1e8449', 12.5, 'center', true);

        drawCanvasSlider(ctx, W * 0.16, H * 0.78, W * 0.68, P.v, `${c[2]}：${Math.round(P.v * 100)}%`, '0%', '100%', '#27ae60');
        drawFooterHint(ctx, W, H, '直接点击中央卡片切换实验视角，并将底部滑杆拖动至右端以点亮全部原文');
      }
    }
  };
}
