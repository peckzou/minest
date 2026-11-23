import {
  CanvasEnv,
  clamp,
  lerp,
  txt,
  drawRoundBox,
  drawCanvasSlider,
  hitSlider,
  drawPerson,
  drawHoldRing,
  drawFooterHint
} from './canvasHelpers';
import { StageEngine } from './engineEthics';

export function createMetaphysicsEngine(modelId: number): Record<number, StageEngine> {
  // ==================== #57 巴门尼德 · 存在论 ====================
  if (modelId === 57) {
    let S: any = {};
    return {
      1: {
        init() {
          S = {
            x: 0.22,
            y: 0.45,
            drag: false,
            hitBeing: false,
            rebounds: 0,
            flashT: 0
          };
        },
        down(x, y, { W, H }) {
          if (Math.hypot(x - W * S.x, y - H * S.y) < 42 || y < H * 0.8) {
            S.drag = true;
          }
        },
        move(x, y, _dx, _dy, { W, H, hit, toast }) {
          if (!S.drag) return;
          S.x = clamp(x / W, 0.1, 0.9);
          S.y = clamp(y / H, 0.18, 0.72);
          // Upper fork: Way of Truth (Being)
          if (S.x > 0.65 && S.y < 0.42) {
            S.hitBeing = true;
            hit(1, 0, '真理之路：存在者存在，它能够被思想与言说！');
          }
          // Lower fork: Way of Non-Being -> Rebound wall!
          if (S.x > 0.6 && S.y > 0.52) {
            S.x = 0.42;
            S.y = 0.56;
            S.drag = false;
            S.rebounds++;
            S.flashT = 0.8;
            hit(1, 1, '逻辑壁垒弹回：非存在者绝不可被思想或言说！');
            toast('⚡ 逻辑禁止通行：「非存在」无法成为思想的对象，思维光球被弹回！');
          }
        },
        up() {
          S.drag = false;
        },
        tick({ ctx, W, H, dt }) {
          ctx.fillStyle = '#f4efe6';
          ctx.fillRect(0, 0, W, H);
          if (S.flashT > 0) S.flashT = Math.max(0, S.flashT - dt);

          // Fork paths
          ctx.strokeStyle = '#d4ac0d';
          ctx.lineWidth = 22;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(W * 0.18, H * 0.45);
          ctx.lineTo(W * 0.45, H * 0.45);
          ctx.lineTo(W * 0.78, H * 0.27);
          ctx.stroke();

          ctx.strokeStyle = S.flashT > 0 ? '#e74c3c' : '#7f8c8d';
          ctx.beginPath();
          ctx.moveTo(W * 0.45, H * 0.45);
          ctx.lineTo(W * 0.78, H * 0.63);
          ctx.stroke();

          // Upper gate: Being
          drawRoundBox(ctx, W * 0.68, H * 0.16, 150, 56, 12, S.hitBeing ? '#fef9e7' : '#fff', '#d4ac0d', 2.5);
          txt(ctx, '☀ 真理之路：存在', W * 0.68 + 75, H * 0.16 + 24, '#b7950b', 13, 'center', true);
          txt(ctx, '思维 = 存在（可通达）', W * 0.68 + 75, H * 0.16 + 44, '#555', 11.5, 'center');

          // Lower gate: Non-Being (Blocked)
          drawRoundBox(ctx, W * 0.68, H * 0.54, 150, 56, 12, S.flashT > 0 ? '#fadbd8' : '#eaecee', '#c0392b', 2.5);
          txt(ctx, '⛔ 荒谬绝路：非存在', W * 0.68 + 75, H * 0.54 + 24, '#c0392b', 13, 'center', true);
          txt(ctx, `不可思想 · 已弹回 ${S.rebounds} 次`, W * 0.68 + 75, H * 0.54 + 44, '#7f1d1d', 11.5, 'center');

          // Draggable thought orb
          const ox = W * S.x;
          const oy = H * S.y;
          ctx.fillStyle = '#3a6f99';
          ctx.beginPath();
          ctx.arc(ox, oy, 22, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 3;
          ctx.stroke();
          txt(ctx, '思维', ox, oy + 4, '#fff', 12.5, 'center', true);

          drawFooterHint(ctx, W, H, '直接拖动蓝色「思维光球」分别驶向上方“存在之路”与下方“非存在绝路”，观察逻辑壁垒');
        }
      },
      2: {
        init() {
          S = { pressGen: 0, pressSplit: 0, mode: 0 };
        },
        down(x, y, { W, H }) {
          if (x < W * 0.45 && y < H * 0.78) {
            S.mode = 1; // Attempt generation from nothing
          } else if (x > W * 0.55 && y < H * 0.78) {
            S.mode = 2; // Attempt splitting Being with void
          }
        },
        up() {
          S.mode = 0;
        },
        tick({ ctx, W, H, dt, hit }) {
          ctx.fillStyle = '#f4efe6';
          ctx.fillRect(0, 0, W, H);

          if (S.mode === 1) {
            S.pressGen = clamp(S.pressGen + dt * 0.9, 0, 1);
            if (S.pressGen >= 0.85) hit(2, 0, '不生不灭：若从无中生，非存在中怎能生出存在？');
          } else {
            S.pressGen = lerp(S.pressGen, 0, dt * 3);
          }

          if (S.mode === 2) {
            S.pressSplit = clamp(S.pressSplit + dt * 0.9, 0, 1);
            if (S.pressSplit >= 0.85) hit(2, 1, '滚圆球体：不存在虚空能割裂存在，存在处处均匀充实！');
          } else {
            S.pressSplit = lerp(S.pressSplit, 0, dt * 3);
          }

          const cx = W / 2;
          const cy = H * 0.42;
          const r = 74;

          // Parmenidean Sphere of Being
          const grad = ctx.createRadialGradient(cx - 18, cy - 18, 12, cx, cy, r);
          grad.addColorStop(0, '#fff9db');
          grad.addColorStop(1, '#d4ac0d');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#9a7d0a';
          ctx.lineWidth = 3;
          ctx.stroke();

          txt(ctx, '滚圆的存在之球', cx, cy - 6, '#1f2b38', 14, 'center', true);
          txt(ctx, '不生 · 不灭 · 连续不可分', cx, cy + 16, '#5c4b00', 11.5, 'center', true);

          // Left Interactive Pad: Try to birth/destroy
          drawRoundBox(ctx, W * 0.08, H * 0.25, 165, 110, 14, S.mode === 1 ? '#fdebd0' : '#fff', '#e67e22', 2);
          txt(ctx, '① 按住尝试：从无生有', W * 0.08 + 82, H * 0.25 + 34, '#d35400', 12.5, 'center', true);
          txt(ctx, '或使存在消灭', W * 0.08 + 82, H * 0.25 + 54, '#667', 11.5, 'center');
          drawHoldRing(ctx, W * 0.08 + 82, H * 0.25 + 82, 16, S.pressGen, '#e67e22');

          // Right Interactive Pad: Try to cleave with knife
          drawRoundBox(ctx, W * 0.92 - 165, H * 0.25, 165, 110, 14, S.mode === 2 ? '#e8f8f5' : '#fff', '#27ae60', 2);
          txt(ctx, '② 按住尝试：插入虚空', W * 0.92 - 82, H * 0.25 + 34, '#1e8449', 12.5, 'center', true);
          txt(ctx, '切割存在球体', W * 0.92 - 82, H * 0.25 + 54, '#667', 11.5, 'center');
          drawHoldRing(ctx, W * 0.92 - 82, H * 0.25 + 82, 16, S.pressSplit, '#27ae60');

          if (S.pressGen > 0.1) {
            txt(ctx, '驳斥：非存在是无，何物、何时能促使其生出存在？', cx, H * 0.77, '#c0392b', 13, 'center', true);
          } else if (S.pressSplit > 0.1) {
            txt(ctx, '驳斥：若要分割存在，中间必是“非存在（虚空）”，但虚空不存在！', cx, H * 0.77, '#1e8449', 13, 'center', true);
          }

          drawFooterHint(ctx, W, H, '分别按住左侧卡片（尝试生灭）与右侧卡片（尝试用虚空分割球体）约 1 秒，体验严密的还原论证');
        }
      },
      3: {
        init() {
          S = { lens: 0.15, drag: false, sawOpinion: false, sawTruth: false };
        },
        down(x, y, { W, H }) {
          const v = hitSlider(x, y, W * 0.18, H * 0.78, W * 0.64);
          if (v !== null || y < H * 0.85) {
            S.drag = true;
            S.lens = clamp((x - W * 0.18) / (W * 0.64), 0, 1);
          }
        },
        move(x, _y, _dx, _dy, { W }) {
          if (S.drag) {
            S.lens = clamp((x - W * 0.18) / (W * 0.64), 0, 1);
          }
        },
        up() {
          S.drag = false;
        },
        tick({ ctx, W, H, T, hit }) {
          ctx.fillStyle = '#f4efe6';
          ctx.fillRect(0, 0, W, H);

          const splitX = W * (0.18 + S.lens * 0.64);

          // Left side of curtain: Sensory Opinion (flowing colors)
          ctx.save();
          ctx.beginPath();
          ctx.rect(W * 0.12, H * 0.14, splitX - W * 0.12, H * 0.5);
          ctx.clip();
          ctx.fillStyle = '#2c3e50';
          ctx.fillRect(W * 0.12, H * 0.14, W * 0.76, H * 0.5);
          for (let i = 0; i < 7; i++) {
            const px = W * 0.2 + i * 75 + Math.sin(T * 2 + i) * 18;
            const py = H * 0.38 + Math.cos(T * 2.4 + i) * 32;
            ctx.fillStyle = i % 2 === 0 ? '#e67e22' : '#9b59b6';
            ctx.beginPath();
            ctx.arc(px, py, 20, 0, Math.PI * 2);
            ctx.fill();
          }
          txt(ctx, '凡人意见之路：感官幻象（生灭、光暗流转）', W * 0.36, H * 0.23, '#f8c471', 13, 'center', true);
          ctx.restore();

          // Right side of curtain: Rational Logos (Unchanging One)
          ctx.save();
          ctx.beginPath();
          ctx.rect(splitX, H * 0.14, W * 0.88 - splitX, H * 0.5);
          ctx.clip();
          ctx.fillStyle = '#fef9e7';
          ctx.fillRect(W * 0.12, H * 0.14, W * 0.76, H * 0.5);
          ctx.fillStyle = '#f1c40f';
          ctx.beginPath();
          ctx.arc(W / 2, H * 0.39, 55, 0, Math.PI * 2);
          ctx.fill();
          txt(ctx, '理性逻各斯（Logos）裁决：唯一不动之存在', W * 0.64, H * 0.23, '#9a7d0a', 13, 'center', true);
          ctx.restore();

          ctx.strokeStyle = '#33475b';
          ctx.lineWidth = 2;
          ctx.strokeRect(W * 0.12, H * 0.14, W * 0.76, H * 0.5);

          // Curtain divider handle
          ctx.strokeStyle = '#f3a52b';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(splitX, H * 0.12);
          ctx.lineTo(splitX, H * 0.66);
          ctx.stroke();

          if (S.lens > 0.72) {
            S.sawOpinion = true;
            hit(3, 0);
          }
          if (S.lens < 0.25 && S.sawOpinion) {
            hit(3, 1, '不要让习惯驱使你依赖盲目的眼睛，而要用理性（Logos）裁决！');
          }

          drawCanvasSlider(
            ctx,
            W * 0.18,
            H * 0.78,
            W * 0.64,
            S.lens,
            '左右拉动「感官意见 vs 理性逻各斯」透视帷幕',
            '纯靠理性逻各斯',
            '轻信感官流变意见',
            '#d4ac0d'
          );
          drawFooterHint(ctx, W, H, '先向右拉开帷幕观察凡人感官的生灭意见，再向左拉回让理性（Logos）揭穿感官幻象');
        }
      }
    };
  }

  // ==================== #58 赫拉克利特 · 流变思想 ====================
  if (modelId === 58) {
    let S: any = {};
    return {
      1: {
        init() {
          S = { steps: 0, batchId: 101, footprintY: 0.22, particles: Array.from({ length: 18 }, (_, i) => ({ x: (i / 18), y: 0.38 + (i % 3) * 0.09, id: 100 + i })) };
        },
        down(_x, y, { H, hit, toast }) {
          if (y < H * 0.82) {
            S.steps++;
            S.batchId += 17;
            S.footprintY = S.steps % 2 === 1 ? 0.45 : 0.52;
            if (S.steps === 1) {
              hit(1, 0, '第一次踏入河流：当前水流批次 #' + S.batchId);
            } else if (S.steps >= 2) {
              hit(1, 1, '第二次踏入：新的水流不断涌来，你无法两次踏入同一条河流！');
              toast(`🌊 第 ${S.steps} 次踏入：脚下已是全新的水分子批次 #${S.batchId}！`);
            }
          }
        },
        tick({ ctx, W, H, dt }) {
          ctx.fillStyle = '#f4efe6';
          ctx.fillRect(0, 0, W, H);

          // River bank and flowing water
          ctx.fillStyle = '#d6eaf8';
          ctx.fillRect(W * 0.08, H * 0.3, W * 0.84, H * 0.36);
          ctx.strokeStyle = '#5dade2';
          ctx.lineWidth = 2;
          ctx.strokeRect(W * 0.08, H * 0.3, W * 0.84, H * 0.36);

          S.particles.forEach((p: any) => {
            p.x += dt * 0.22;
            if (p.x > 1) {
              p.x -= 1;
              p.id += 18;
            }
            const px = W * 0.08 + p.x * W * 0.84;
            const py = H * p.y;
            ctx.fillStyle = '#2e86c1';
            ctx.beginPath();
            ctx.arc(px, py, 12, 0, Math.PI * 2);
            ctx.fill();
            txt(ctx, `#${p.id}`, px, py + 4, '#fff', 9.5, 'center', true);
          });

          // Person stepping into river
          drawPerson(ctx, W / 2, H * S.footprintY, '#d35400', `已踏入 ${S.steps} 次 (当前水批 #${S.batchId})`, 1.35);

          drawRoundBox(ctx, W * 0.28, H * 0.73, W * 0.44, 42, 12, '#fff8e6', '#f3a52b', 2);
          txt(ctx, '👣 点击河面任意处：再次迈步踏入河流', W / 2, H * 0.73 + 26, '#1f2b38', 13, 'center', true);

          drawFooterHint(ctx, W, H, '连续点击河面两次以上，观察脚下流过的水分子编号批次变化');
        }
      },
      2: {
        init() {
          S = { ratio: 0.2, drag: false, holdT: 0 };
        },
        down(x, y, { W, H }) {
          const v = hitSlider(x, y, W * 0.16, H * 0.78, W * 0.68);
          if (v !== null || y < H * 0.82) {
            S.drag = true;
            S.ratio = clamp((x - W * 0.16) / (W * 0.68), 0, 1);
          }
        },
        move(x, _y, _dx, _dy, { W }) {
          if (S.drag) {
            S.ratio = clamp((x - W * 0.16) / (W * 0.68), 0, 1);
          }
        },
        up() {
          S.drag = false;
        },
        tick({ ctx, W, H, T, dt, hit }) {
          ctx.fillStyle = '#f4efe6';
          ctx.fillRect(0, 0, W, H);

          const cx = W / 2;
          const cy = H * 0.4;
          const flameH = 45 + Math.sin(T * 5) * 8 + (1 - Math.abs(S.ratio - 0.5) * 1.4) * 45;

          // Ever-living Fire in center
          const grad = ctx.createRadialGradient(cx, cy, 8, cx, cy, flameH);
          grad.addColorStop(0, '#fff176');
          grad.addColorStop(0.6, '#ff9800');
          grad.addColorStop(1, 'rgba(231, 76, 60, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(cx, cy, flameH, 0, Math.PI * 2);
          ctx.fill();

          txt(ctx, '🔥 永恒的活火', cx, cy + 5, '#7f1d1d', 14, 'center', true);
          txt(ctx, `点燃分寸 ${(S.ratio * 100).toFixed(0)}% : 熄灭分寸 ${((1 - S.ratio) * 100).toFixed(0)}%`, cx, cy + 68, '#1f2b38', 13, 'center', true);

          if (S.ratio < 0.28 || S.ratio > 0.72) hit(2, 0);
          if (Math.abs(S.ratio - 0.5) < 0.1) {
            S.holdT += dt;
            drawHoldRing(ctx, cx, cy, 58, S.holdT / 0.8, '#27ae60');
            if (S.holdT >= 0.8) hit(2, 1, '按分寸点燃，按分寸熄灭：逻各斯（Logos）是流变背后的永恒尺度！');
          } else {
            S.holdT = 0;
          }

          drawCanvasSlider(
            ctx,
            W * 0.16,
            H * 0.78,
            W * 0.68,
            S.ratio,
            '调节「活火点燃与熄灭」的逻各斯尺度（50% 为动态守恒）',
            '过度熄灭（寒水）',
            '过度燃烧（焦土）',
            '#e67e22'
          );
          drawFooterHint(ctx, W, H, '拖动滑杆体会失衡与平衡，将其稳定在 50% 逻各斯等量点保持 1 秒');
        }
      },
      3: {
        init() {
          S = { tension: 0.15, drag: false, pluckT: 0 };
        },
        down(x, y, { W, H }) {
          const v = hitSlider(x, y, W * 0.16, H * 0.78, W * 0.68);
          if (v !== null || y < H * 0.82) {
            S.drag = true;
            S.tension = clamp((x - W * 0.16) / (W * 0.68), 0, 1);
            S.pluckT = 1.0;
          }
        },
        move(x, _y, _dx, _dy, { W }) {
          if (S.drag) {
            S.tension = clamp((x - W * 0.16) / (W * 0.68), 0, 1);
          }
        },
        up() {
          S.drag = false;
          S.pluckT = 1.0;
        },
        tick({ ctx, W, H, T, dt, hit }) {
          ctx.fillStyle = '#f4efe6';
          ctx.fillRect(0, 0, W, H);
          if (S.pluckT > 0) S.pluckT = Math.max(0, S.pluckT - dt);

          const cx = W / 2;
          const cy = H * 0.4;
          const bend = 35 + S.tension * 65;

          // Bow wood frame pulling outward/inward
          ctx.strokeStyle = '#8b5a2b';
          ctx.lineWidth = 8;
          ctx.beginPath();
          ctx.moveTo(cx - 110, cy - 55);
          ctx.quadraticCurveTo(cx - 110 - bend, cy, cx - 110, cy + 55);
          ctx.stroke();

          // Bowstring vibrating
          const vib = Math.sin(T * 35) * S.pluckT * 14 * S.tension;
          const inHarmony = S.tension >= 0.45 && S.tension <= 0.72;
          ctx.strokeStyle = inHarmony ? '#27ae60' : '#c0392b';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(cx - 110, cy - 55);
          ctx.quadraticCurveTo(cx - 110 + vib, cy, cx - 110, cy + 55);
          ctx.stroke();

          // Arrows showing opposing forces
          txt(ctx, '← 弓臂向外弹张力', cx - 180, cy, '#8b5a2b', 12.5, 'center', true);
          txt(ctx, '弓弦向内拉紧力 →', cx + 10, cy, inHarmony ? '#27ae60' : '#c0392b', 12.5, 'center', true);

          const status =
            S.tension < 0.3
              ? '张力松弛：无对立冲突则弓不成弓、琴不成音'
              : S.tension > 0.8
              ? '单向过载：弓弦崩断！'
              : '🎵 反向张力的和谐（如弓与竖琴）：对立面拉拽成就统一功能！';
          txt(ctx, status, cx + 60, cy + 45, inHarmony ? '#1e8449' : '#c0392b', 13, 'center', true);

          if (S.tension < 0.25 || S.tension > 0.8) hit(3, 0);
          if (inHarmony) hit(3, 1);

          drawCanvasSlider(
            ctx,
            W * 0.16,
            H * 0.78,
            W * 0.68,
            S.tension,
            `弓与竖琴的反向对立张力：${Math.round(S.tension * 100)}%`,
            '松弛（缺乏对立）',
            '过紧（失去均衡）',
            '#27ae60'
          );
          drawFooterHint(ctx, W, H, '拖动滑杆先体验松弛状态，再拉至 50%–70% 黄金对抗张力区奏响竖琴与弓的反向和谐');
        }
      }
    };
  }

  // ==================== #59–66 形而上学与存在哲学交互专案 ====================
  let M: any = {};
  return {
    1: {
      init() {
        M = {
          v: 0.2,
          drag: null,
          mode: 0,
          atoms: [
            { x: 0.25, y: 0.35, label: 'A', done: false },
            { x: 0.5, y: 0.45, label: 'N', done: false },
            { x: 0.75, y: 0.35, label: 'Z', done: false }
          ],
          interactions: 0
        };
      },
      down(x, y, { W, H }) {
        const s = hitSlider(x, y, W * 0.16, H * 0.8, W * 0.68);
        if (s !== null) {
          M.drag = 'slider';
          M.v = s;
          return;
        }
        for (const a of M.atoms) {
          if (Math.hypot(x - W * a.x, y - H * a.y) < 42) {
            M.drag = a;
            return;
          }
        }
      },
      move(x, y, _dx, _dy, { W, H }) {
        if (M.drag === 'slider') {
          M.v = clamp((x - W * 0.16) / (W * 0.68), 0, 1);
        } else if (M.drag && typeof M.drag === 'object') {
          M.drag.x = clamp(x / W, 0.12, 0.88);
          M.drag.y = clamp(y / H, 0.18, 0.65);
        }
      },
      up({ hit }) {
        if (M.drag && typeof M.drag === 'object') {
          M.drag.done = true;
          M.interactions++;
          hit(1, 0);
          if (M.interactions >= 2) hit(1, 1);
        } else if (M.drag === 'slider') {
          if (M.v > 0.3) hit(1, 0);
          if (M.v > 0.75) hit(1, 1);
        }
        M.drag = null;
      },
      tick({ ctx, W, H, hit }) {
        ctx.fillStyle = '#f4efe6';
        ctx.fillRect(0, 0, W, H);
        const cfg1: Record<number, [string, string[], string]> = {
          59: ['德谟克利特：原子（充实）与虚空（运动场所）', ['钩状原子 A', '球状火原子 N', '凹槽水原子 Z'], '虚空体积占比（0% 则原子锁死无法运动）'],
          60: ['阿奎那：本质（Essence / 是什么）vs 存在（Esse / 存在着）', ['凤凰（有本质·无实存）', '骏马（本质+受造实存）', '实存注入火花 (Esse)'], '从纯粹概念本质向现实存在（Esse）的跃迁度'],
          61: ['伯克莱：存在即被感知（Esse est percipi）', ['心灵感知之眼', '樱桃（色味香触观念束）', '虚构的“不可感物质基底”'], '心灵注视强度（移开目光则可感对象解除呈现）'],
          62: ['梅洛-庞蒂：身体图式（Body Schema）与盲人手杖延伸', ['主体的手', '盲人手杖（知觉延伸端）', '空间障碍物触点'], '手杖熟练内化为身体图式的程度'],
          63: ['列维纳斯：他者的面容（The Face）与“不可杀戮”', ['自我总体化之手', '他者赤裸的面容', '伦理律令：不可杀戮'], '放弃总体化占有、向他者面容敞开的程度'],
          64: ['加缪：西西弗斯推石上山与荒诞的觉醒', ['西西弗斯（反抗者）', '巨石（推至山顶又滚落）', '清醒意识之光'], '推石登顶高度与下山时刻的清醒蔑视度'],
          65: ['怀特海：把“固态石头”展开为“实际缘现（事件过程）”', ['表象固态巨石', '量子振动事件流 A', '历史关系摄入流 B'], '过程显微镜倍率（将静态实体还原为生成事件）'],
          66: ['德勒兹：块茎（Rhizome）网络 vs 树状等级体系', ['任意节点 A（跨界连接）', '任意节点 B（断裂重生）', '多元游牧连线 C'], '去中心化块茎连通度']
        };
        const c = cfg1[modelId] || cfg1[59];

        drawRoundBox(ctx, W * 0.14, H * 0.14, W * 0.72, H * 0.52, 16, '#fffdf8', '#3a6f99', 2);
        txt(ctx, c[0], W / 2, H * 0.21, '#1f2b38', 14.5, 'center', true);

        M.atoms.forEach((a: any, i: number) => {
          const ax = W * a.x;
          const ay = H * a.y;
          ctx.strokeStyle = 'rgba(58,111,153,0.45)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(W / 2, H * 0.42);
          ctx.lineTo(ax, ay);
          ctx.stroke();

          drawRoundBox(ctx, ax - 74, ay - 22, 148, 44, 20, a.done ? '#e8f8f5' : '#fff8e6', a.done ? '#27ae60' : '#f3a52b', 2.5);
          txt(ctx, c[1][i], ax, ay + 5, '#1f2b38', 12, 'center', true);
        });

        if (M.v > 0.78) hit(1, 1);
        drawCanvasSlider(ctx, W * 0.16, H * 0.8, W * 0.68, M.v, `${c[2]}：${Math.round(M.v * 100)}%`, '0%', '100%', '#3a6f99');
        drawFooterHint(ctx, W, H, '直接拖动画面中的三个哲学组件交互，并将下方滑杆拉至右端以点亮全部原文');
      }
    },
    2: {
      init() {
        M = { v: 0.25, mode: 0, drag: false, count: 0 };
      },
      down(x, y, { W, H, hit }) {
        const s = hitSlider(x, y, W * 0.16, H * 0.78, W * 0.68);
        if (s !== null) {
          M.drag = true;
          M.v = s;
          return;
        }
        M.mode = (M.mode + 1) % 3;
        M.count++;
        hit(2, 0);
        if (M.count >= 2) hit(2, 1);
      },
      move(x, _y, _dx, _dy, { W, hit }) {
        if (M.drag) {
          M.v = clamp((x - W * 0.16) / (W * 0.68), 0, 1);
          if (M.v > 0.35) hit(2, 0);
          if (M.v > 0.78) hit(2, 1);
        }
      },
      up() {
        M.drag = false;
      },
      tick({ ctx, W, H }) {
        ctx.fillStyle = '#f4efe6';
        ctx.fillRect(0, 0, W, H);
        const cfg2: Record<number, [string, string, string]> = {
          59: ['② 形状(A/N)、次序(AN/NA)与位置(Z/N)生成万物；甜苦冷热皆约定', '切换原子几何排列组合（生成火、水、铁）', '微观原子碰撞与宏观感官性质涌现度'],
          60: ['② 受造物（本质≠存在，需他者赋存）vs 自存之存在本身（Ipsum Esse）', '点击切换：偶然受造物 vs 本质即存在的必然源头', '存在链条向第一因溯源深度'],
          61: ['② 反驳洛克第一性质/第二性质二分；无人森林之树由无限心灵维系', '点击切换：个体心灵闭眼 vs 无限心灵（永恒感知者）持续感知', '观念世界的连续性维系度'],
          62: ['② 双手互触的可逆性（触者与被触者交织）与“世界之肉（Flesh）”', '点击切换：右手触左手（主客体瞬间反转）', '知觉可逆性与身体嵌入世界的深度'],
          63: ['② 先于自由契约的无限责任（“我在此”）与第三者（正义之秤）', '点击切换：二人面对面无限责任 vs 第三者到场引入公共正义衡量', '不对称伦理责任与社会正义平衡度'],
          64: ['② 拒绝自杀与哲学自杀（虚假宗教跳跃），以反抗、自由、激情活在当下', '点击切换：荒诞高墙对峙 → 蔑视命运 → 想象西西弗斯是幸福的', '反抗激情与当下生命丰盈度'],
          65: ['② 摄入（Prehension：万物彼此内在关联）与具体性误置谬误批判', '点击切换：揭露孤立时空点抽象谬误 → 展开宇宙事件交织网', '事件网络相互摄入（Prehension）强度'],
          66: ['② 差异先于同一、生成（Becoming-黄蜂与兰花共生）与辖域/解辖域化', '点击切换：黄蜂与兰花的跨界共生生成（去领地化运动）', '解辖域化（Deterritorialization）突破强度']
        };
        const c = cfg2[modelId] || cfg2[59];

        drawRoundBox(ctx, W * 0.14, H * 0.14, W * 0.72, H * 0.5, 16, M.v > 0.6 || M.mode > 0 ? '#e8f8f5' : '#fff8e6', '#27ae60', 2.5);
        txt(ctx, c[0], W / 2, H * 0.23, '#1f2b38', 13.5, 'center', true);
        txt(ctx, `🔄 点击画布中央切换状态（当前状态 #${M.mode + 1}）：${c[1]}`, W / 2, H * 0.38, '#1e8449', 13, 'center', true);

        // Animated progress bars / wave inside
        for (let i = 0; i < 9; i++) {
          const bx = W * 0.24 + i * (W * 0.065);
          const bh = 18 + M.v * 60 * (0.6 + 0.4 * Math.cos(i + M.mode));
          ctx.fillStyle = i % 2 === 0 ? '#3a6f99' : '#f3a52b';
          ctx.fillRect(bx, H * 0.58 - bh, 24, bh);
        }

        drawCanvasSlider(ctx, W * 0.16, H * 0.78, W * 0.68, M.v, `${c[2]}：${Math.round(M.v * 100)}%`, '0%', '100%', '#27ae60');
        drawFooterHint(ctx, W, H, '点击中央卡片切换哲学状态并向右拖动滑杆至 80% 以上，点亮本关全部原文');
      }
    }
  };
}
