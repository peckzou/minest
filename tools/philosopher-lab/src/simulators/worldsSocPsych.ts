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
  drawBeaker,
  drawBell,
  drawCoin,
  drawCompactSlider,
  drawToggleButton,
  hitBox,
  drawSparkline,
  drawTinyHint
} from './visualPrimitives';

export function createSocPsychVisualWorld(modelId: number): Record<number, StageEngine> | null {
  // =========================================================================
  // #102 马克斯·韦伯 · 理想类型 (Ternary Authority Triangle + Draggable Case Orb)
  // =========================================================================
  if (modelId === 102) {
    let S: any = {};
    return {
      1: {
        init() {
          S = { px: 0.5, py: 0.48, drag: false, visited: new Set<string>() };
        },
        down(x, y, { W, H }) {
          S.drag = true;
          S.px = clamp(x / W, 0.2, 0.8);
          S.py = clamp(y / H, 0.18, 0.72);
        },
        move(x, y, _dx, _dy, { W, H }) {
          if (S.drag) {
            S.px = clamp(x / W, 0.2, 0.8);
            S.py = clamp(y / H, 0.18, 0.72);
          }
        },
        up() {
          S.drag = false;
        },
        tick({ ctx, W, H, hit }) {
          drawPaperBg(ctx, W, H, false);
          // 3 vertices of Weber's Ideal-Type Authority Triangle
          const vTop = { x: W * 0.5, y: H * 0.17, name: '法理型 (科层规则)', col: '#2563eb' };
          const vLeft = { x: W * 0.22, y: H * 0.7, name: '传统型 (血缘习俗)', col: '#d97706' };
          const vRight = { x: W * 0.78, y: H * 0.7, name: '克里斯玛型 (个人魅力)', col: '#dc2626' };

          // Triangle fill & edges
          ctx.fillStyle = 'rgba(255,255,255,0.65)';
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(vTop.x, vTop.y);
          ctx.lineTo(vLeft.x, vLeft.y);
          ctx.lineTo(vRight.x, vRight.y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Current case orb clamped roughly near triangle
          const ox = S.px * W;
          const oy = S.py * H;
          const dT = Math.hypot(ox - vTop.x, oy - vTop.y) + 1;
          const dL = Math.hypot(ox - vLeft.x, oy - vLeft.y) + 1;
          const dR = Math.hypot(ox - vRight.x, oy - vRight.y) + 1;
          const wT = 1 / dT;
          const wL = 1 / dL;
          const wR = 1 / dR;
          const sum = wT + wL + wR;
          const pT = Math.round((wT / sum) * 100);
          const pL = Math.round((wL / sum) * 100);
          const pR = 100 - pT - pL;

          if (pT > 55) S.visited.add('T');
          if (pL > 55) S.visited.add('L');
          if (pR > 55) S.visited.add('R');
          if (S.visited.size >= 2) hit(1, 0, '理想类型是纯净的思维坐标，现实案例常处于三极混合区');
          if (S.visited.size >= 3) hit(1, 1, '通过测量与纯粹顶点的距离，精确比较不同社会制度特征');

          // Distance tethers
          [
            { v: vTop, p: pT },
            { v: vLeft, p: pL },
            { v: vRight, p: pR }
          ].forEach(({ v, p }) => {
            ctx.strokeStyle = v.col;
            ctx.lineWidth = 1 + (p / 100) * 4;
            ctx.beginPath();
            ctx.moveTo(ox, oy);
            ctx.lineTo(v.x, v.y);
            ctx.stroke();

            ctx.fillStyle = v.col;
            ctx.beginPath();
            ctx.arc(v.x, v.y, 12, 0, Math.PI * 2);
            ctx.fill();
            drawLabel(ctx, v.name, v.x, v.y === vTop.y ? v.y - 18 : v.y + 26, v.col, 12, 'center', true);
          });

          // Draggable Case Orb
          ctx.fillStyle = '#0f172a';
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(ox, oy, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          drawMonoNum(ctx, `法理 ${pT}%  ·  传统 ${pL}%  ·  魅力 ${pR}%`, W * 0.5, H * 0.84, '#0f172a', 14, 'center');
          drawTinyHint(ctx, W, H, '在三角坐标系中拖动黑色「现实案例球」，测量它与三种纯净理想类型的距离');
        }
      },
      2: {
        init() {
          S = { lens: 0.25, drag: false };
        },
        down(x, y, { W, H }) {
          if (hitSlider(x, y, W * 0.2, H * 0.79, W * 0.6)) {
            S.drag = true;
            S.lens = clamp((x - W * 0.2) / (W * 0.6), 0, 1);
          }
        },
        move(x, _y, _dx, _dy, { W }) {
          if (S.drag) S.lens = clamp((x - W * 0.2) / (W * 0.6), 0, 1);
        },
        up() {
          S.drag = false;
        },
        tick({ ctx, W, H, hit }) {
          drawPaperBg(ctx, W, H, false);
          if (S.lens > 0.72) hit(2, 0, '抽象放大核心逻辑特征，剔除经验杂音以提炼理想类型');
          if (S.lens < 0.28) hit(2, 1, '经验现实本身浑沌杂乱，需要分析棱镜才能建立比较尺');

          // 24 scattered noisy polygons morphing into a crisp symmetrical crystal as lens increases!
          const cx = W * 0.5;
          const cy = H * 0.42;
          for (let i = 0; i < 18; i++) {
            const ang = (i / 18) * Math.PI * 2;
            const noiseR = 30 + ((i * 37) % 90);
            const cleanR = i % 2 === 0 ? 78 : 44;
            const r = lerp(noiseR, cleanR, S.lens);
            const jitterX = (1 - S.lens) * Math.sin(i * 4.3) * 28;
            const jitterY = (1 - S.lens) * Math.cos(i * 2.9) * 24;
            const x = cx + Math.cos(ang) * r + jitterX;
            const y = cy + Math.sin(ang) * r + jitterY;
            ctx.fillStyle = S.lens > 0.65 ? '#2563eb' : '#64748b';
            ctx.beginPath();
            ctx.arc(x, y, lerp(4 + (i % 5), 7, S.lens), 0, Math.PI * 2);
            ctx.fill();
            if (S.lens > 0.35) {
              const nextAng = ((i + 1) / 18) * Math.PI * 2;
              const nextR = lerp(30 + (((i + 1) * 37) % 90), (i + 1) % 2 === 0 ? 78 : 44, S.lens);
              ctx.strokeStyle = `rgba(37,99,235,${S.lens * 0.6})`;
              ctx.lineWidth = 1.6;
              ctx.beginPath();
              ctx.moveTo(x, y);
              ctx.lineTo(cx + Math.cos(nextAng) * nextR, cy + Math.sin(nextAng) * nextR);
              ctx.stroke();
            }
          }
          drawMonoNum(ctx, S.lens > 0.7 ? '纯净理想类型晶体' : '杂乱经验现实', cx, H * 0.1, '#1e3a8a', 15, 'center');
          drawCompactSlider(ctx, W * 0.2, H * 0.79, W * 0.6, S.lens, '概念提纯聚焦度', `${Math.round(S.lens * 100)}%`, '#2563eb');
          drawTinyHint(ctx, W, H, '拉动提纯聚焦滑块，把浑沌的经验碎片提炼为对称清晰的理想类型');
        }
      }
    };
  }

  // =========================================================================
  // #103 涂尔干 · 社会团结 (Identical Synced Blocks -> Interlocking Multicolor Gears)
  // =========================================================================
  if (modelId === 103) {
    let S: any = {};
    return {
      1: {
        init() {
          S = { division: 0.1, drag: false, t: 0 };
        },
        down(x, y, { W, H }) {
          if (hitSlider(x, y, W * 0.18, H * 0.8, W * 0.64)) {
            S.drag = true;
            S.division = clamp((x - W * 0.18) / (W * 0.64), 0, 1);
          }
        },
        move(x, _y, _dx, _dy, { W }) {
          if (S.drag) S.division = clamp((x - W * 0.18) / (W * 0.64), 0, 1);
        },
        up() {
          S.drag = false;
        },
        tick({ ctx, W, H, dt, hit }) {
          S.t += dt;
          drawPaperBg(ctx, W, H, false);
          if (S.division < 0.25) hit(1, 0, '机械团结：同质个体靠一致的集体意识同步维系');
          if (S.division > 0.75) hit(1, 1, '有机团结：高度分工的不同角色像器官齿轮般相互依存');

          const cx = W * 0.5;
          const cy = H * 0.44;
          const colors = ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2'];

          if (S.division < 0.5) {
            // Mechanical: 6 identical terracotta squares pulsing in exact unison
            const pulse = Math.sin(S.t * 3.5) * 6;
            for (let i = 0; i < 6; i++) {
              const bx = W * 0.18 + i * (W * 0.128);
              const by = cy + pulse;
              ctx.fillStyle = '#b45309';
              ctx.strokeStyle = '#78350f';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.roundRect(bx - 22, by - 22, 44, 44, 6);
              ctx.fill();
              ctx.stroke();
              drawLabel(ctx, '同质', bx, by + 4, '#fef3c7', 11, 'center', true);
            }
          } else {
            // Organic: 6 differently sized, differently colored interlocking gears!
            const specs = [
              { dx: -115, dy: -22, r: 34, teeth: 10, dir: 1 },
              { dx: -48, dy: 12, r: 42, teeth: 12, dir: -1 },
              { dx: 30, dy: -24, r: 36, teeth: 10, dir: 1 },
              { dx: 98, dy: 14, r: 38, teeth: 11, dir: -1 },
              { dx: -10, dy: -74, r: 26, teeth: 8, dir: 1 },
              { dx: 45, dy: 64, r: 28, teeth: 8, dir: 1 }
            ];
            specs.forEach((g, i) => {
              drawGear(ctx, cx + g.dx, cy + g.dy, g.r, g.teeth, S.t * 1.4 * g.dir, colors[i], '#1e293b');
            });
          }

          drawMonoNum(
            ctx,
            S.division < 0.5 ? '机械团结 · 相似性共振' : '有机团结 · 差异化互赖',
            cx,
            H * 0.1,
            S.division < 0.5 ? '#b45309' : '#059669',
            16,
            'center'
          );
          drawCompactSlider(ctx, W * 0.18, H * 0.8, W * 0.64, S.division, '社会劳动分工深度', `${Math.round(S.division * 100)}%`, '#059669');
          drawTinyHint(ctx, W, H, '向右拉动分工滑块，看同质方块演化为彼此咬合的异质分工齿轮');
        }
      },
      2: {
        init() {
          S = { norm: 0.8, drag: false, t: 0, particles: Array.from({ length: 18 }, (_, i) => ({ a: (i / 18) * Math.PI * 2, r: 70 })) };
        },
        down(x, y, { W, H }) {
          if (hitSlider(x, y, W * 0.2, H * 0.79, W * 0.6)) {
            S.drag = true;
            S.norm = clamp((x - W * 0.2) / (W * 0.6), 0, 1);
          }
        },
        move(x, _y, _dx, _dy, { W }) {
          if (S.drag) S.norm = clamp((x - W * 0.2) / (W * 0.6), 0, 1);
        },
        up() {
          S.drag = false;
        },
        tick({ ctx, W, H, dt, hit }) {
          S.t += dt;
          drawPaperBg(ctx, W, H, true);
          if (S.norm < 0.25) hit(2, 0, '规范失范 (Anomie)：分工剧变而规则断裂，个体漂浮失向');
          if (S.norm > 0.72) hit(2, 1, '健全的职业规范与制度纽带重建有机整合');

          const cx = W * 0.5;
          const cy = H * 0.43;
          // Ring of norms
          ctx.strokeStyle = `rgba(52, 211, 153, ${S.norm * 0.85})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(cx, cy, 84, 0, Math.PI * 2);
          ctx.stroke();

          S.particles.forEach((p: any, i: number) => {
            p.a += dt * (S.norm > 0.35 ? 0.9 : 2.2 * (i % 2 === 0 ? 1 : -1));
            const drift = (1 - S.norm) * (45 + Math.sin(S.t * 3 + i) * 35);
            const r = 84 + (i % 2 === 0 ? drift : -drift * 0.6);
            ctx.fillStyle = S.norm > 0.35 ? '#34d399' : '#f87171';
            ctx.beginPath();
            ctx.arc(cx + Math.cos(p.a) * r, cy + Math.sin(p.a) * r, 6.5, 0, Math.PI * 2);
            ctx.fill();
          });

          drawMonoNum(ctx, S.norm < 0.3 ? '失范危机 (Anomie)' : '规范整合稳定', cx, H * 0.1, S.norm < 0.3 ? '#f87171' : '#34d399', 15, 'center');
          drawCompactSlider(ctx, W * 0.2, H * 0.79, W * 0.6, S.norm, '社会规范整合度', `${Math.round(S.norm * 100)}%`, '#34d399', true);
          drawTinyHint(ctx, W, H, '调低规范整合度，观察粒子脱离轨道陷入涂尔干所说的「失范」漂移', true);
        }
      }
    };
  }

  // =========================================================================
  // #104 齐美尔 · 社会关系形式 (Interactive Dyad -> Triad Drag-to-Mediate/Coalition)
  // =========================================================================
  if (modelId === 104) {
    let S: any = {};
    return {
      1: {
        init() {
          S = { hasThird: false, cPos: { x: 0.5, y: 0.24 }, drag: false, t: 0 };
        },
        down(x, y, { W, H }) {
          if (hitBox(x, y, W * 0.34, H * 0.8, 200, 34)) {
            S.hasThird = !S.hasThird;
            return;
          }
          if (S.hasThird && Math.hypot(x - S.cPos.x * W, y - S.cPos.y * H) < 34) {
            S.drag = true;
          }
        },
        move(x, y, _dx, _dy, { W, H }) {
          if (S.drag) {
            S.cPos.x = clamp(x / W, 0.16, 0.84);
            S.cPos.y = clamp(y / H, 0.18, 0.7);
          }
        },
        up() {
          S.drag = false;
        },
        tick({ ctx, W, H, dt, hit }) {
          S.t += dt;
          drawPaperBg(ctx, W, H, false);
          const ax = W * 0.26;
          const bx = W * 0.74;
          const by = H * 0.56;

          // Edge A-B
          ctx.strokeStyle = S.hasThird ? '#94a3b8' : '#2563eb';
          ctx.lineWidth = S.hasThird ? 2 : 4;
          ctx.beginPath();
          ctx.moveTo(ax, by);
          ctx.lineTo(bx, by);
          ctx.stroke();

          if (!S.hasThird) {
            hit(1, 0, '二人群体 (Dyad)：没有超个人结构，任意一人退出即瞬间瓦解');
            drawMonoNum(ctx, '二人群体 (Dyad) · 关系数: 1', W * 0.5, H * 0.1, '#2563eb', 15, 'center');
          } else {
            const cx = S.cPos.x * W;
            const cy = S.cPos.y * H;
            const dA = Math.hypot(cx - ax, cy - by);
            const dB = Math.hypot(cx - bx, cy - by);
            const role = Math.abs(dA - dB) < 42 ? '中立调解者' : dA < dB ? '与 A 结盟 (2 对 1)' : '与 B 结盟 (2 对 1)';
            hit(1, 1, '第三者入场瞬间催生调解、结盟与多数压制结构！');

            ctx.strokeStyle = dA < dB ? '#059669' : '#cbd5e1';
            ctx.lineWidth = dA < dB ? 4 : 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(ax, by);
            ctx.stroke();

            ctx.strokeStyle = dB < dA ? '#059669' : '#cbd5e1';
            ctx.lineWidth = dB < dA ? 4 : 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(bx, by);
            ctx.stroke();

            ctx.fillStyle = '#059669';
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(cx, cy, 22, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            drawLabel(ctx, 'C', cx, cy + 5, '#fff', 14, 'center', true);
            drawMonoNum(ctx, `三人群体 (Triad) · ${role}`, W * 0.5, H * 0.1, '#059669', 15, 'center');
          }

          // Nodes A & B
          [
            { x: ax, lbl: 'A', col: '#2563eb' },
            { x: bx, lbl: 'B', col: '#d97706' }
          ].forEach((n) => {
            ctx.fillStyle = n.col;
            ctx.beginPath();
            ctx.arc(n.x, by, 22, 0, Math.PI * 2);
            ctx.fill();
            drawLabel(ctx, n.lbl, n.x, by + 5, '#fff', 14, 'center', true);
          });

          drawToggleButton(ctx, W * 0.34, H * 0.8, 200, 34, S.hasThird ? '移除第三者 (回到 Dyad)' : '加入第三者 C (Triad)', S.hasThird, '#059669');
          drawTinyHint(ctx, W, H, '点击加入第三者 C，并任意拖动 C 靠近 A、B 或居中体验调解与结盟');
        }
      },
      2: {
        init() {
          S = { n: 3, drag: false };
        },
        down(x, y, { W, H }) {
          if (hitSlider(x, y, W * 0.2, H * 0.79, W * 0.6)) {
            S.drag = true;
            S.n = Math.round(2 + clamp((x - W * 0.2) / (W * 0.6), 0, 1) * 10);
          }
        },
        move(x, _y, _dx, _dy, { W }) {
          if (S.drag) S.n = Math.round(2 + clamp((x - W * 0.2) / (W * 0.6), 0, 1) * 10);
        },
        up() {
          S.drag = false;
        },
        tick({ ctx, W, H, hit }) {
          drawPaperBg(ctx, W, H, true);
          const edges = (S.n * (S.n - 1)) / 2;
          if (S.n >= 9) hit(2, 0, '人数线性增长时，关系通道呈二次方爆炸，催生科层规则');
          if (S.n <= 4) hit(2, 1, '小群体可凭直接面对面互动维系');

          const cx = W * 0.5;
          const cy = H * 0.43;
          const r = 98;
          const pts = Array.from({ length: S.n }, (_, i) => {
            const a = (i / S.n) * Math.PI * 2 - Math.PI / 2;
            return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
          });
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
          ctx.lineWidth = 1.4;
          for (let i = 0; i < pts.length; i++) {
            for (let j = i + 1; j < pts.length; j++) {
              ctx.beginPath();
              ctx.moveTo(pts[i].x, pts[i].y);
              ctx.lineTo(pts[j].x, pts[j].y);
              ctx.stroke();
            }
          }
          pts.forEach((p) => {
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
            ctx.fill();
          });

          drawMonoNum(ctx, `人数 N = ${S.n}   |   潜在关系数 = ${edges}`, cx, H * 0.1, '#38bdf8', 15, 'center');
          drawCompactSlider(ctx, W * 0.2, H * 0.79, W * 0.6, (S.n - 2) / 10, '群体规模 N', `${S.n} 人`, '#38bdf8', true);
          drawTinyHint(ctx, W, H, '拉大群体规模 N，观察完全图的连线密度呈 N(N-1)/2 爆炸增长', true);
        }
      }
    };
  }

  // =========================================================================
  // #105 米德 · 自我形成理论 (Baseball Diamond Perspective Cone: Play -> Game)
  // =========================================================================
  if (modelId === 105) {
    let S: any = {};
    return {
      1: {
        init() {
          S = { stage: 0, ballT: 0, visited: new Set([0]) };
        },
        down(x, y, { W, H }) {
          for (let i = 0; i < 3; i++) {
            if (hitBox(x, y, W * 0.14 + i * W * 0.25, H * 0.8, W * 0.22, 34)) {
              S.stage = i;
              S.visited.add(i);
            }
          }
        },
        tick({ ctx, W, H, dt, hit }) {
          S.ballT += dt * 0.7;
          drawPaperBg(ctx, W, H, false);
          if (S.visited.size >= 2) hit(1, 0, '从单一扮演转向同时预判队友位置，学会采择他人视角');
          if (S.visited.size >= 3) hit(1, 1, '内化「概化他人」的规则全景，客我 (Me) 与主我 (I) 成熟！');

          // Baseball diamond field
          const cx = W * 0.5;
          const cy = H * 0.44;
          const rad = 88;
          ctx.fillStyle = '#dcfce7';
          ctx.strokeStyle = '#16a34a';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(cx, cy - rad);
          ctx.lineTo(cx + rad, cy);
          ctx.lineTo(cx, cy + rad);
          ctx.lineTo(cx - rad, cy);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          const bases = [
            { x: cx, y: cy + rad, lbl: '捕手(我)' },
            { x: cx + rad, y: cy, lbl: '一垒' },
            { x: cx, y: cy - rad, lbl: '二垒' },
            { x: cx - rad, y: cy, lbl: '三垒' }
          ];

          // Perspective sightlines depending on stage
          if (S.stage === 0) {
            // Imitation: only sees self circle
            ctx.strokeStyle = 'rgba(37,99,235,0.4)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(bases[0].x, bases[0].y, 26, 0, Math.PI * 2);
            ctx.stroke();
          } else if (S.stage === 1) {
            // Play stage: single rotating spotlight cone to 1 other role at a time
            const targetIdx = 1 + (Math.floor(S.ballT) % 3);
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 4]);
            ctx.beginPath();
            ctx.moveTo(bases[0].x, bases[0].y);
            ctx.lineTo(bases[targetIdx].x, bases[targetIdx].y);
            ctx.stroke();
            ctx.setLineDash([]);
          } else {
            // Game stage (Generalized Other): full golden mesh connecting ALL 4 roles simultaneously!
            for (let i = 0; i < 4; i++) {
              for (let j = i + 1; j < 4; j++) {
                ctx.strokeStyle = 'rgba(16, 185, 129, 0.75)';
                ctx.lineWidth = 2.4;
                ctx.beginPath();
                ctx.moveTo(bases[i].x, bases[i].y);
                ctx.lineTo(bases[j].x, bases[j].y);
                ctx.stroke();
              }
            }
          }

          bases.forEach((b, i) => {
            ctx.fillStyle = i === 0 ? '#2563eb' : S.stage === 2 ? '#059669' : '#64748b';
            ctx.beginPath();
            ctx.arc(b.x, b.y, 14, 0, Math.PI * 2);
            ctx.fill();
            drawLabel(ctx, b.lbl, b.x, b.y + (i === 0 ? 28 : i === 2 ? -20 : 26), '#1e293b', 11, 'center', true);
          });

          const titles = ['模仿期 · 孤立动作', '玩耍期 (Play) · 一次只扮演一个角色', '游戏期 (Game) · 统摄全场「概化他人」'];
          drawMonoNum(ctx, titles[S.stage], cx, H * 0.09, '#0f172a', 14, 'center');

          ['模仿期', '玩耍期 (Play)', '游戏期 (Game)'].forEach((lbl, i) => {
            drawToggleButton(ctx, W * 0.14 + i * W * 0.25, H * 0.8, W * 0.22, 34, lbl, S.stage === i, '#059669');
          });
          drawTinyHint(ctx, W, H, '切换米德棒球场三阶段，看视线如何从单一角色扩展为全景「概化他人」');
        }
      },
      2: {
        init() {
          S = { balance: 0.5, drag: false, t: 0 };
        },
        down(x, y, { W, H }) {
          if (hitSlider(x, y, W * 0.2, H * 0.79, W * 0.6)) {
            S.drag = true;
            S.balance = clamp((x - W * 0.2) / (W * 0.6), 0, 1);
          }
        },
        move(x, _y, _dx, _dy, { W }) {
          if (S.drag) S.balance = clamp((x - W * 0.2) / (W * 0.6), 0, 1);
        },
        up() {
          S.drag = false;
        },
        tick({ ctx, W, H, dt, hit }) {
          S.t += dt;
          drawPaperBg(ctx, W, H, false);
          if (S.balance < 0.25) hit(2, 0, '过度客我 (Me)：完全顺从他人期待，丧失创造性');
          if (S.balance > 0.75) hit(2, 1, '主我 (I) 驱动突破与革新，与客我构成持续内对话');

          const cx = W * 0.5;
          const cy = H * 0.43;
          // Orbiting dual orbs: Me (structured blue ring) and I (sparking amber core)
          const rMe = 35 + (1 - S.balance) * 50;
          const rI = 35 + S.balance * 50;
          ctx.fillStyle = 'rgba(37, 99, 235, 0.25)';
          ctx.strokeStyle = '#2563eb';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(cx - 56, cy, rMe, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          drawLabel(ctx, '客我 Me', cx - 56, cy + 4, '#1e3a8a', 13, 'center', true);

          ctx.fillStyle = 'rgba(245, 158, 11, 0.3)';
          ctx.strokeStyle = '#d97706';
          ctx.beginPath();
          ctx.arc(cx + 56, cy, rI, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          drawLabel(ctx, '主我 I', cx + 56, cy + 4, '#92400e', 13, 'center', true);

          drawCompactSlider(ctx, W * 0.2, H * 0.79, W * 0.6, S.balance, '客我 Me (社会规则)  ↔  主我 I (自发创造)', `${Math.round(S.balance * 100)}%`, '#d97706');
          drawTinyHint(ctx, W, H, '拖动平衡主我 I 与客我 Me 的张力半径，体验自我的动态对话');
        }
      }
    };
  }

  // =========================================================================
  // #106 库利 · 镜中我 (Optical Rays Reflecting Off Adjustable-Curvature Mirror)
  // =========================================================================
  if (modelId === 106) {
    let S: any = {};
    return {
      1: {
        init() {
          S = { curve: 0.5, drag: false, t: 0 }; // 0=concave dim/shrink, 0.5=flat true, 1=convex radiant/boost
        },
        down(x, y, { W, H }) {
          if (hitSlider(x, y, W * 0.18, H * 0.8, W * 0.64)) {
            S.drag = true;
            S.curve = clamp((x - W * 0.18) / (W * 0.64), 0, 1);
          }
        },
        move(x, _y, _dx, _dy, { W }) {
          if (S.drag) S.curve = clamp((x - W * 0.18) / (W * 0.64), 0, 1);
        },
        up() {
          S.drag = false;
        },
        tick({ ctx, W, H, dt, hit }) {
          S.t += dt;
          drawPaperBg(ctx, W, H, true);
          if (S.curve < 0.22) hit(1, 0, '扭曲贬损的「他人之镜」使自我光环剧烈收缩');
          if (S.curve > 0.78) hit(1, 1, '正向欣赏的反馈折射出膨胀自信的「镜中我」');

          const selfX = W * 0.25;
          const mirrorX = W * 0.72;
          const cy = H * 0.44;
          const bend = (S.curve - 0.5) * 65;

          // Curved Mirror (Social Other)
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(mirrorX, cy - 95);
          ctx.quadraticCurveTo(mirrorX + bend, cy, mirrorX, cy + 95);
          ctx.stroke();
          drawLabel(ctx, '他人反馈之镜', mirrorX + 10, cy - 104, '#7dd3fc', 12, 'center', true);

          // Incident & Reflected light rays
          for (let i = -2; i <= 2; i++) {
            const sy = cy + i * 24;
            const mx = mirrorX + bend * (1 - (i * i) / 9) * 0.45;
            // Outgoing ray
            ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(selfX + 20, cy);
            ctx.lineTo(mx, sy);
            ctx.stroke();
            // Reflected ray colored by mirror valence
            const refCol = S.curve > 0.6 ? '#34d399' : S.curve < 0.4 ? '#f87171' : '#38bdf8';
            ctx.strokeStyle = refCol;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(mx, sy);
            ctx.lineTo(selfX + 12, cy + i * (10 + S.curve * 24));
            ctx.stroke();
            ctx.setLineDash([]);
          }

          // Self Core + Aura expanding/shrinking with reflected perception
          const auraR = 26 + S.curve * 48;
          ctx.fillStyle = S.curve > 0.55 ? 'rgba(52, 211, 153, 0.24)' : S.curve < 0.4 ? 'rgba(248, 113, 113, 0.24)' : 'rgba(56, 189, 248, 0.22)';
          ctx.beginPath();
          ctx.arc(selfX, cy, auraR + Math.sin(S.t * 3) * 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(selfX, cy, 20, 0, Math.PI * 2);
          ctx.fill();
          drawLabel(ctx, '自我', selfX, cy + 4, '#fff', 11.5, 'center', true);

          drawMonoNum(
            ctx,
            `镜中自我效能感: ${Math.round(20 + S.curve * 80)}%`,
            W * 0.5,
            H * 0.1,
            S.curve > 0.55 ? '#34d399' : S.curve < 0.4 ? '#f87171' : '#38bdf8',
            15,
            'center'
          );
          drawCompactSlider(ctx, W * 0.18, H * 0.8, W * 0.64, S.curve, '他人之镜曲率（挑剔批评 ↔ 欣赏肯定）', `${Math.round((S.curve - 0.5) * 200)}%`, '#38bdf8', true);
          drawTinyHint(ctx, W, H, '改变右侧「他人之镜」的曲率，观察反射光线如何放大或萎缩左侧自我光环', true);
        }
      },
      2: {
        init() {
          S = { filterBias: 0.5, drag: false };
        },
        down(x, y, { W, H }) {
          if (hitSlider(x, y, W * 0.2, H * 0.79, W * 0.6)) {
            S.drag = true;
            S.filterBias = clamp((x - W * 0.2) / (W * 0.6), 0, 1);
          }
        },
        move(x, _y, _dx, _dy, { W }) {
          if (S.drag) S.filterBias = clamp((x - W * 0.2) / (W * 0.6), 0, 1);
        },
        up() {
          S.drag = false;
        },
        tick({ ctx, W, H, hit }) {
          drawPaperBg(ctx, W, H, true);
          if (S.filterBias < 0.25) hit(2, 0, '即便客观评价中性，焦虑脑补滤镜也会将其解读为否定');
          if (S.filterBias > 0.75) hit(2, 1, '「镜中我」取决于你想象中的他人评价，而非客观评价本身');

          const cy = H * 0.44;
          // Neutral beam -> Cognitive Filter Prism -> Colored output
          drawArrow(ctx, W * 0.16, cy, W * 0.45, cy, '#94a3b8', 5, 12);
          drawLabel(ctx, '中性眼神 (客观)', W * 0.28, cy - 18, '#cbd5e1', 12, 'center', true);

          // Prism
          ctx.fillStyle = 'rgba(139, 92, 246, 0.35)';
          ctx.strokeStyle = '#a78bfa';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(W * 0.5, cy - 58);
          ctx.lineTo(W * 0.56, cy + 52);
          ctx.lineTo(W * 0.44, cy + 52);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          drawLabel(ctx, '脑补滤镜', W * 0.5, cy + 72, '#c4b5fd', 12, 'center', true);

          const outCol = S.filterBias < 0.35 ? '#f87171' : S.filterBias > 0.65 ? '#34d399' : '#38bdf8';
          drawArrow(ctx, W * 0.55, cy, W * 0.84, cy + (0.5 - S.filterBias) * 90, outCol, 5, 12);
          drawLabel(
            ctx,
            S.filterBias < 0.35 ? '“他讨厌我”' : S.filterBias > 0.65 ? '“他欣赏我”' : '“只是路过”',
            W * 0.84,
            cy + (0.5 - S.filterBias) * 90 - 16,
            outCol,
            13,
            'center',
            true
          );

          drawCompactSlider(ctx, W * 0.2, H * 0.79, W * 0.6, S.filterBias, '主观解释滤镜（自我怀疑 ↔ 自信解读）', `${Math.round(S.filterBias * 100)}%`, '#a78bfa', true);
          drawTinyHint(ctx, W, H, '客观输入完全不变，拖动中央「脑补滤镜」改变你感受到的他人评价', true);
        }
      }
    };
  }

  // =========================================================================
  // #107 帕森斯 · AGIL 系统 (4 Interconnected Pumping Liquid Reservoirs)
  // =========================================================================
  if (modelId === 107) {
    let S: any = {};
    return {
      1: {
        init() {
          S = { levels: [0.75, 0.75, 0.75, 0.75], broken: -1, t: 0 };
        },
        down(x, y, { W, H }) {
          const centers = [
            { x: W * 0.32, y: H * 0.32 },
            { x: W * 0.68, y: H * 0.32 },
            { x: W * 0.32, y: H * 0.64 },
            { x: W * 0.68, y: H * 0.64 }
          ];
          centers.forEach((c, i) => {
            if (Math.hypot(x - c.x, y - c.y) < 55) {
              S.broken = S.broken === i ? -1 : i;
            }
          });
        },
        tick({ ctx, W, H, dt, hit }) {
          S.t += dt;
          drawPaperBg(ctx, W, H, false);
          const meta = [
            { code: 'A', name: '适应 (经济)', x: W * 0.32, y: H * 0.32, col: '#0284c7' },
            { code: 'G', name: '目标 (政治)', x: W * 0.68, y: H * 0.32, col: '#dc2626' },
            { code: 'L', name: '维模 (文化)', x: W * 0.32, y: H * 0.64, col: '#7c3aed' },
            { code: 'I', name: '整合 (法律)', x: W * 0.68, y: H * 0.64, col: '#059669' }
          ];

          // Broken reservoir drains itself and drags adjacent reservoirs down!
          for (let i = 0; i < 4; i++) {
            const target = S.broken === -1 ? 0.85 : S.broken === i ? 0.08 : 0.42;
            S.levels[i] = lerp(S.levels[i], target, dt * 1.4);
          }
          if (S.broken >= 0) hit(1, 0, '任一 AGIL 子系统停摆都会经由管道拖垮整个社会系统');
          if (S.broken === -1 && S.levels.every((l: number) => l > 0.78) && S.t > 2) {
            hit(1, 1, '四大功能子系统相互供给能量，维持社会动态均衡');
          }

          // Connecting pipes
          const pairs = [
            [0, 1],
            [1, 3],
            [3, 2],
            [2, 0]
          ];
          pairs.forEach(([a, b], idx) => {
            ctx.strokeStyle = S.broken >= 0 ? '#fca5a5' : '#93c5fd';
            ctx.lineWidth = 10;
            ctx.beginPath();
            ctx.moveTo(meta[a].x, meta[a].y);
            ctx.lineTo(meta[b].x, meta[b].y);
            ctx.stroke();

            // Flowing fluid drop along pipe
            const speed = S.broken >= 0 ? 0.25 : 0.9;
            const p = (S.t * speed + idx * 0.25) % 1;
            ctx.fillStyle = S.broken >= 0 ? '#dc2626' : '#0284c7';
            ctx.beginPath();
            ctx.arc(lerp(meta[a].x, meta[b].x, p), lerp(meta[a].y, meta[b].y, p), 5, 0, Math.PI * 2);
            ctx.fill();
          });

          // Draw 4 tanks
          meta.forEach((m, i) => {
            const isBroken = S.broken === i;
            drawBeaker(ctx, m.x, m.y + 38, 72, 76, S.levels[i], isBroken ? '#ef4444' : m.col);
            drawLabel(ctx, `${m.code} · ${m.name}`, m.x, m.y - 46, isBroken ? '#dc2626' : m.col, 12, 'center', true);
            drawMonoNum(ctx, `${Math.round(S.levels[i] * 100)}%`, m.x, m.y + 54, '#334155', 11, 'center');
          });

          const sysHealth = Math.round((S.levels.reduce((a: number, b: number) => a + b, 0) / 4) * 100);
          drawMonoNum(ctx, `社会系统稳态: ${sysHealth}%`, W * 0.5, H * 0.1, sysHealth > 75 ? '#059669' : '#dc2626', 15, 'center');
          drawTinyHint(ctx, W, H, '点击任意一个 AGIL 烧杯令其停摆（再点修复），观察连锁系统性枯竭');
        }
      },
      2: {
        init() {
          S = { shock: 0, t: 0 };
        },
        down(x, y, { W, H }) {
          if (hitBox(x, y, W * 0.34, H * 0.8, 200, 34)) S.shock = 1;
        },
        tick({ ctx, W, H, dt, hit }) {
          S.t += dt;
          S.shock = Math.max(0, S.shock - dt * 0.45);
          drawPaperBg(ctx, W, H, false);
          if (S.shock > 0.3) hit(2, 0, '帕森斯假定系统具有自动回归均衡的稳态偏好');
          if (S.shock === 0 && S.t > 2) hit(2, 1, '批评者指出：过度强调均衡容易忽视社会冲突与变迁动力');

          // Spring-damped pendulum ball representing society
          const cx = W * 0.5;
          const cy = H * 0.45;
          const sway = Math.sin(S.t * 9) * S.shock * 140;
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(cx, H * 0.16);
          ctx.lineTo(cx + sway, cy + 40);
          ctx.stroke();
          ctx.fillStyle = S.shock > 0.2 ? '#f59e0b' : '#059669';
          ctx.beginPath();
          ctx.arc(cx + sway, cy + 40, 26, 0, Math.PI * 2);
          ctx.fill();
          drawLabel(ctx, '社会均衡', cx + sway, cy + 44, '#fff', 10.5, 'center', true);

          drawToggleButton(ctx, W * 0.34, H * 0.8, 200, 34, '施加外部冲击波 ⚡', S.shock > 0.1, '#d97706');
          drawTinyHint(ctx, W, H, '点击撞击社会摆球，观察功能主义预设的自动阻尼回正特性');
        }
      }
    };
  }

  // =========================================================================
  // #108 默顿 · 显功能与潜功能 (X-Ray Slider Over Hopi Rain Dance -> Glowing Tribal Unity Ring)
  // =========================================================================
  if (modelId === 108) {
    let S: any = {};
    return {
      1: {
        init() {
          S = { xray: 0.05, drag: false, t: 0 };
        },
        down(x, y, { W, H }) {
          if (hitSlider(x, y, W * 0.18, H * 0.8, W * 0.64)) {
            S.drag = true;
            S.xray = clamp((x - W * 0.18) / (W * 0.64), 0, 1);
          }
        },
        move(x, _y, _dx, _dy, { W }) {
          if (S.drag) S.xray = clamp((x - W * 0.18) / (W * 0.64), 0, 1);
        },
        up() {
          S.drag = false;
        },
        tick({ ctx, W, H, dt, hit }) {
          S.t += dt;
          drawPaperBg(ctx, W, H, true);
          if (S.xray < 0.25) hit(1, 0, '显功能（表面求雨）未达成，但仪式依然代代存续');
          if (S.xray > 0.72) hit(1, 1, 'X 光透视揭开潜功能：共同仪式编织了炽热的部族凝聚力网络！');

          const cx = W * 0.5;
          const cy = H * 0.48;

          // Top cloud (Manifest: Rain fails -> dry gray cloud)
          ctx.fillStyle = `rgba(148, 163, 184, ${1 - S.xray * 0.65})`;
          ctx.beginPath();
          ctx.arc(cx - 28, H * 0.2, 24, 0, Math.PI * 2);
          ctx.arc(cx, H * 0.17, 30, 0, Math.PI * 2);
          ctx.arc(cx + 30, H * 0.2, 22, 0, Math.PI * 2);
          ctx.fill();
          drawLabel(ctx, '显功能：求雨 (0 mm)', cx, H * 0.27, '#cbd5e1', 11.5, 'center', true);

          // Dancing tribe ring around campfire
          const n = 10;
          const pts = Array.from({ length: n }, (_, i) => {
            const a = (i / n) * Math.PI * 2 + S.t * 0.5;
            return { x: cx + Math.cos(a) * 95, y: cy + Math.sin(a) * 58 };
          });

          // Latent social cohesion mesh revealed by X-Ray!
          if (S.xray > 0.15) {
            ctx.strokeStyle = `rgba(251, 191, 36, ${S.xray * 0.75})`;
            ctx.lineWidth = 2;
            for (let i = 0; i < n; i++) {
              for (let j = i + 2; j < n; j += 2) {
                ctx.beginPath();
                ctx.moveTo(pts[i].x, pts[i].y);
                ctx.lineTo(pts[j].x, pts[j].y);
                ctx.stroke();
              }
            }
          }

          // Campfire core
          ctx.fillStyle = '#ea580c';
          ctx.beginPath();
          ctx.arc(cx, cy, 16 + S.xray * 10 + Math.sin(S.t * 8) * 2, 0, Math.PI * 2);
          ctx.fill();

          pts.forEach((p) => {
            ctx.fillStyle = S.xray > 0.5 ? '#fde047' : '#94a3b8';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
            ctx.fill();
          });

          drawMonoNum(
            ctx,
            S.xray > 0.65 ? '潜功能显影：部族凝聚力 +94%' : '表层观察：无降雨迹象',
            cx,
            H * 0.09,
            S.xray > 0.65 ? '#fde047' : '#94a3b8',
            15,
            'center'
          );
          drawCompactSlider(ctx, W * 0.18, H * 0.8, W * 0.64, S.xray, '社会学 X 光透视镜', `${Math.round(S.xray * 100)}%`, '#f59e0b', true);
          drawTinyHint(ctx, W, H, '向右拉动 X 光滑块穿透霍皮祈雨舞表象，看见隐藏的金色部族凝聚网络', true);
        }
      },
      2: {
        init() {
          S = { panic: false, bankCash: 0.85, t: 0 };
        },
        down(x, y, { W, H }) {
          if (hitBox(x, y, W * 0.34, H * 0.8, 200, 34)) {
            S.panic = !S.panic;
            if (!S.panic) S.bankCash = 0.85;
          }
        },
        tick({ ctx, W, H, dt, hit }) {
          S.t += dt;
          drawPaperBg(ctx, W, H, false);
          if (S.panic) {
            S.bankCash = clamp(S.bankCash - dt * 0.25, 0.02, 1);
            if (S.bankCash < 0.2) hit(2, 0, '自我实现预言：虚假谣言引发挤兑，硬生生把健康银行变成真破产！');
          } else {
            hit(2, 1, '信念与预期本身具有改变社会现实的因果力量');
          }

          drawBeaker(ctx, W * 0.5, H * 0.64, 140, 150, S.bankCash, S.bankCash < 0.3 ? '#ef4444' : '#059669');
          drawLabel(ctx, '银行准备金库', W * 0.5, H * 0.22, '#1e293b', 13, 'center', true);
          drawMonoNum(ctx, `储备 ${Math.round(S.bankCash * 100)}%`, W * 0.5, H * 0.7, S.bankCash < 0.3 ? '#dc2626' : '#059669', 14, 'center');

          // Depositors rushing out with coins when panic is active
          if (S.panic && S.bankCash > 0.04) {
            for (let i = 0; i < 4; i++) {
              const p = (S.t * 1.4 + i * 0.25) % 1;
              drawCoin(ctx, lerp(W * 0.58, W * 0.88, p), H * 0.52 + (i - 1.5) * 14, 7, '¥');
            }
          }

          drawToggleButton(ctx, W * 0.34, H * 0.8, 200, 34, S.panic ? '重置健康银行' : '散布“银行要倒闭”谣言', S.panic, '#dc2626');
          drawTinyHint(ctx, W, H, '点击散布虚假谣言，目睹默顿「自我实现预言」如何瞬间抽干健康银行');
        }
      }
    };
  }

  // =========================================================================
  // #110 米尔格拉姆 · 六度分隔 (24-Node Watts-Strogatz Ring + Cyan Chords + BFS Path)
  // =========================================================================
  if (modelId === 110) {
    let S: any = {};
    const buildSmallWorld = (shortcuts: number) => {
      const N = 24;
      const adj: number[][] = Array.from({ length: N }, () => []);
      for (let i = 0; i < N; i++) {
        const n1 = (i + 1) % N;
        const n2 = (i + 2) % N;
        adj[i].push(n1, n2);
        adj[n1].push(i);
        adj[n2].push(i);
      }
      const chords: [number, number][] = [
        [2, 14],
        [5, 19],
        [8, 22],
        [1, 11],
        [6, 17],
        [3, 21]
      ];
      const activeChords = chords.slice(0, shortcuts);
      activeChords.forEach(([a, b]) => {
        adj[a].push(b);
        adj[b].push(a);
      });
      // BFS from 0 to 12 (opposite side of ring)
      const q = [[0]];
      const seen = new Set([0]);
      let path: number[] = [];
      while (q.length) {
        const cur = q.shift()!;
        const last = cur[cur.length - 1];
        if (last === 12) {
          path = cur;
          break;
        }
        for (const nb of adj[last]) {
          if (!seen.has(nb)) {
            seen.add(nb);
            q.push([...cur, nb]);
          }
        }
      }
      return { N, activeChords, path };
    };
    return {
      1: {
        init() {
          S = { shortcuts: 0, drag: false, t: 0 };
        },
        down(x, y, { W, H }) {
          if (hitSlider(x, y, W * 0.2, H * 0.8, W * 0.6)) {
            S.drag = true;
            S.shortcuts = Math.round(clamp((x - W * 0.2) / (W * 0.6), 0, 1) * 6);
          }
        },
        move(x, _y, _dx, _dy, { W }) {
          if (S.drag) S.shortcuts = Math.round(clamp((x - W * 0.2) / (W * 0.6), 0, 1) * 6);
        },
        up() {
          S.drag = false;
        },
        tick({ ctx, W, H, dt, hit }) {
          S.t += dt;
          drawPaperBg(ctx, W, H, true);
          const { N, activeChords, path } = buildSmallWorld(S.shortcuts);
          const hops = Math.max(1, path.length - 1);
          if (S.shortcuts === 0) hit(1, 0, '纯规则邻近网络中，信件跨越大洋需要漫长接力');
          if (S.shortcuts >= 2) hit(1, 1, '只需极少数跨界长程捷径，平均路径长度瞬间坍缩！');

          const cx = W * 0.5;
          const cy = H * 0.44;
          const r = Math.min(W, H) * 0.29;
          const pos = (i: number) => {
            const a = (i / N) * Math.PI * 2 - Math.PI / 2;
            return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
          };

          // Ring local edges
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
          ctx.lineWidth = 1.4;
          for (let i = 0; i < N; i++) {
            const p = pos(i);
            const p1 = pos((i + 1) % N);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.stroke();
          }

          // Cyan random shortcuts
          activeChords.forEach(([a, b]) => {
            const pa = pos(a);
            const pb = pos(b);
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.moveTo(pa.x, pa.y);
            ctx.lineTo(pb.x, pb.y);
            ctx.stroke();
          });

          // Gold shortest BFS path from 0 (Start) to 12 (Target)
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          path.forEach((id, idx) => {
            const p = pos(id);
            if (idx === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          });
          ctx.stroke();

          // Nodes
          for (let i = 0; i < N; i++) {
            const p = pos(i);
            const isEnd = i === 0 || i === 12;
            ctx.fillStyle = i === 0 ? '#34d399' : i === 12 ? '#f43f5e' : path.includes(i) ? '#facc15' : '#475569';
            ctx.beginPath();
            ctx.arc(p.x, p.y, isEnd ? 10 : 6, 0, Math.PI * 2);
            ctx.fill();
          }
          drawLabel(ctx, '寄件人', pos(0).x, pos(0).y - 16, '#34d399', 11, 'center', true);
          drawLabel(ctx, '波士顿目标', pos(12).x, pos(12).y + 22, '#fb7185', 11, 'center', true);

          drawMonoNum(ctx, `当前最短跳数: ${hops} 跳  (捷径数: ${S.shortcuts})`, cx, H * 0.09, '#facc15', 15, 'center');
          drawCompactSlider(ctx, W * 0.2, H * 0.8, W * 0.6, S.shortcuts / 6, '添加跨界长程捷径数', `${S.shortcuts} 条`, '#38bdf8', true);
          drawTinyHint(ctx, W, H, '向右拉动增加少量青色跨界捷径，看金色最短路径瞬间从 6 跳骤降至 2 跳', true);
        }
      },
      2: {
        init() {
          S = { useHub: false, t: 0 };
        },
        down(x, y, { W, H }) {
          if (hitBox(x, y, W * 0.22, H * 0.8, 170, 34)) S.useHub = false;
          if (hitBox(x, y, W * 0.54, H * 0.8, 170, 34)) S.useHub = true;
        },
        tick({ ctx, W, H, dt, hit }) {
          S.t += dt;
          drawPaperBg(ctx, W, H, true);
          if (!S.useHub) hit(2, 0, '盲目随机转发容易在局部迷失');
          if (S.useHub) hit(2, 1, '米尔格拉姆实验证明：人们会刻意定向传给「超级连接者」枢纽！');

          const sx = W * 0.16;
          const tx = W * 0.84;
          const cy = H * 0.44;
          const hubX = W * 0.5;
          const hubY = cy;

          // Hub glowing star
          ctx.fillStyle = S.useHub ? '#f59e0b' : '#475569';
          ctx.beginPath();
          ctx.arc(hubX, hubY, S.useHub ? 28 : 14, 0, Math.PI * 2);
          ctx.fill();
          drawLabel(ctx, '超级枢纽', hubX, hubY - 36, '#fde68a', 11.5, 'center', true);

          // Animated letter path
          const p = (S.t * 0.6) % 1;
          ctx.strokeStyle = S.useHub ? '#34d399' : '#94a3b8';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(sx, cy);
          if (S.useHub) {
            ctx.lineTo(hubX, hubY);
            ctx.lineTo(tx, cy);
          } else {
            ctx.lineTo(W * 0.3, cy - 60);
            ctx.lineTo(W * 0.42, cy + 55);
            ctx.lineTo(W * 0.58, cy - 50);
            ctx.lineTo(W * 0.72, cy + 45);
            ctx.lineTo(tx, cy);
          }
          ctx.stroke();

          // Moving letter envelope dot
          const lx = lerp(sx, tx, p);
          const ly = S.useHub ? cy : cy + Math.sin(p * Math.PI * 4) * 52;
          ctx.fillStyle = '#fde047';
          ctx.fillRect(lx - 8, ly - 5, 16, 10);

          drawMonoNum(ctx, S.useHub ? '枢纽定向导航: 仅 2 跳抵达 ✓' : '随机盲传: 曲折低效', W * 0.5, H * 0.1, S.useHub ? '#34d399' : '#94a3b8', 15, 'center');
          drawToggleButton(ctx, W * 0.22, H * 0.8, 170, 34, '随机盲目转发', !S.useHub, '#64748b', true);
          drawToggleButton(ctx, W * 0.54, H * 0.8, 170, 34, '定向传给超级枢纽', S.useHub, '#d97706', true);
          drawTinyHint(ctx, W, H, '切换转发策略，观察小世界网络如何依赖少数「枢纽节点」实现可导航性', true);
        }
      }
    };
  }

  // =========================================================================
  // #112 奥尔森 · 集体行动的逻辑 (Public Park Fountain + Free-Rider Decay + Selective Ticket)
  // =========================================================================
  if (modelId === 112) {
    let S: any = {};
    return {
      1: {
        init() {
          S = { groupN: 5, selective: false, drag: false, t: 0 };
        },
        down(x, y, { W, H }) {
          if (hitSlider(x, y, W * 0.14, H * 0.8, W * 0.42)) {
            S.drag = true;
            S.groupN = Math.round(4 + clamp((x - W * 0.14) / (W * 0.42), 0, 1) * 26);
          } else if (hitBox(x, y, W * 0.62, H * 0.76, 180, 36)) {
            S.selective = !S.selective;
          }
        },
        move(x, _y, _dx, _dy, { W }) {
          if (S.drag) S.groupN = Math.round(4 + clamp((x - W * 0.14) / (W * 0.42), 0, 1) * 26);
        },
        up() {
          S.drag = false;
        },
        tick({ ctx, W, H, dt, hit }) {
          S.t += dt;
          drawPaperBg(ctx, W, H, false);
          // Without selective incentive, contributor ratio drops steeply as N grows!
          const contribRate = S.selective ? 0.88 : clamp(1.15 - S.groupN * 0.036, 0.12, 0.92);
          const contribCount = Math.max(1, Math.round(S.groupN * contribRate));

          if (S.groupN >= 22 && !S.selective) hit(1, 0, '大集团稀释个人收益，绝大多数成员选择「搭便车」导致喷泉干涸！');
          if (S.groupN >= 18 && S.selective) hit(1, 1, '选择性激励（专属会员福利）让大集团重新恢复高贡献率！');

          const cx = W * 0.5;
          const cy = H * 0.42;

          // Center Public Good Fountain (water jet height proportional to contribRate)
          ctx.fillStyle = '#cbd5e1';
          ctx.beginPath();
          ctx.ellipse(cx, cy + 20, 48, 20, 0, 0, Math.PI * 2);
          ctx.fill();
          const jetH = 15 + contribRate * 75;
          ctx.strokeStyle = '#0ea5e9';
          ctx.lineWidth = 4;
          [-1, 0, 1].forEach((side) => {
            ctx.beginPath();
            ctx.moveTo(cx, cy + 16);
            ctx.quadraticCurveTo(cx + side * 22, cy - jetH, cx + side * 40, cy + 16);
            ctx.stroke();
          });
          drawLabel(ctx, '公共物品喷泉', cx, cy + 52, '#0369a1', 11.5, 'center', true);

          // Citizens in ring: Emerald = Contributing, Gray = Free-Rider
          for (let i = 0; i < S.groupN; i++) {
            const a = (i / S.groupN) * Math.PI * 2;
            const px = cx + Math.cos(a) * 145;
            const py = cy + Math.sin(a) * 95;
            const pays = i < contribCount;
            ctx.fillStyle = pays ? '#059669' : '#94a3b8';
            ctx.beginPath();
            ctx.arc(px, py, 8, 0, Math.PI * 2);
            ctx.fill();
            if (pays) {
              const p = (S.t * 0.8 + i * 0.1) % 1;
              drawCoin(ctx, lerp(px, cx, p), lerp(py, cy, p), 4.5, S.selective ? '★' : '¥');
            }
          }

          drawMonoNum(
            ctx,
            `人数 N=${S.groupN}  |  缴费者: ${Math.round(contribRate * 100)}%  |  搭便车者: ${Math.round((1 - contribRate) * 100)}%`,
            cx,
            H * 0.09,
            contribRate > 0.6 ? '#059669' : '#dc2626',
            13.5,
            'center'
          );

          drawCompactSlider(ctx, W * 0.14, H * 0.8, W * 0.42, (S.groupN - 4) / 26, '群体规模 N', `${S.groupN} 人`, '#0284c7');
          drawToggleButton(ctx, W * 0.62, H * 0.76, 180, 36, S.selective ? '选择性激励: 已开启 ★' : '开启选择性激励 ★', S.selective, '#d97706');
          drawTinyHint(ctx, W, H, '拉大群体规模看公共喷泉因搭便车而干涸，再点击开启「选择性激励」挽救');
        }
      },
      2: {
        init() {
          S = { smallLobby: true, t: 0 };
        },
        down(x, y, { W, H }) {
          if (hitBox(x, y, W * 0.34, H * 0.8, 200, 34)) S.smallLobby = !S.smallLobby;
        },
        tick({ ctx, W, H, dt, hit }) {
          S.t += dt;
          drawPaperBg(ctx, W, H, false);
          if (S.smallLobby) hit(2, 0, '少数既得利益小集团人均 stakes 极高，极易结盟游说');
          else hit(2, 1, '分散的广大消费者虽总利益巨大，却因组织成本高而沉默');

          // Balance scale: 5 Giant Gold Bars (Concentrated Lobby) outweighing 40 Tiny Scattered Dots (Dispersed Public)
          const cx = W * 0.5;
          const cy = H * 0.46;
          const tilt = S.smallLobby ? -0.22 : 0.14;
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(tilt);
          ctx.fillStyle = '#475569';
          ctx.fillRect(-150, -5, 300, 10);
          // Left: 5 concentrated heavy blocks
          for (let i = 0; i < 5; i++) {
            ctx.fillStyle = '#d97706';
            ctx.fillRect(-142 + i * 22, -32, 18, 26);
          }
          // Right: many tiny faint dots
          for (let i = 0; i < 20; i++) {
            ctx.fillStyle = S.smallLobby ? '#94a3b8' : '#059669';
            ctx.beginPath();
            ctx.arc(55 + (i % 5) * 18, -12 - Math.floor(i / 5) * 14, S.smallLobby ? 4 : 6.5, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();

          drawLabel(ctx, '5人集中利益集团', W * 0.28, H * 0.26, '#b45309', 12, 'center', true);
          drawLabel(ctx, '百万分散公众', W * 0.72, H * 0.26, '#475569', 12, 'center', true);
          drawToggleButton(ctx, W * 0.34, H * 0.8, 200, 34, S.smallLobby ? '赋予公众低成本组织工具' : '恢复分散沉默状态', !S.smallLobby, '#059669');
          drawTinyHint(ctx, W, H, '观察少数高集中度利益集团如何压倒分散的大众，切换公众组织成本');
        }
      }
    };
  }

  // =========================================================================
  // #113 帕特南 · 社会资本 (Isolated Bowling Lanes -> Interwoven Civic Mesh)
  // =========================================================================
  if (modelId === 113) {
    let S: any = {};
    return {
      1: {
        init() {
          S = { league: 0.15, drag: false, t: 0 };
        },
        down(x, y, { W, H }) {
          if (hitSlider(x, y, W * 0.18, H * 0.8, W * 0.64)) {
            S.drag = true;
            S.league = clamp((x - W * 0.18) / (W * 0.64), 0, 1);
          }
        },
        move(x, _y, _dx, _dy, { W }) {
          if (S.drag) S.league = clamp((x - W * 0.18) / (W * 0.64), 0, 1);
        },
        up() {
          S.drag = false;
        },
        tick({ ctx, W, H, dt, hit }) {
          S.t += dt;
          drawPaperBg(ctx, W, H, false);
          if (S.league < 0.25) hit(1, 0, '「独自打保龄球」：个体原子化导致社区信任与互助骤降');
          if (S.league > 0.75) hit(1, 1, '丰富的横向社团联赛编织起高密度互惠信任网络！');

          // 5 parallel bowling lanes with bowlers; cross-lane golden trust threads appear as S.league increases
          const lanes = 5;
          const pts: { x: number; y: number }[] = [];
          for (let i = 0; i < lanes; i++) {
            const lx = W * 0.16 + i * (W * 0.17);
            // Wooden lane
            ctx.fillStyle = '#fef3c7';
            ctx.strokeStyle = '#d97706';
            ctx.lineWidth = 1.5;
            ctx.fillRect(lx - 22, H * 0.2, 44, H * 0.46);
            ctx.strokeRect(lx - 22, H * 0.2, 44, H * 0.46);

            // Rolling ball
            const p = (S.t * 0.7 + i * 0.2) % 1;
            const by = lerp(H * 0.62, H * 0.25, p);
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.arc(lx, by, 7, 0, Math.PI * 2);
            ctx.fill();

            pts.push({ x: lx, y: H * 0.56 });
          }

          // Cross-lane civic trust bridges
          if (S.league > 0.2) {
            ctx.strokeStyle = `rgba(16, 185, 129, ${S.league})`;
            ctx.lineWidth = 2 + S.league * 2.5;
            for (let i = 0; i < lanes - 1; i++) {
              ctx.beginPath();
              ctx.moveTo(pts[i].x, pts[i].y);
              ctx.quadraticCurveTo((pts[i].x + pts[i + 1].x) / 2, pts[i].y - 34 * S.league, pts[i + 1].x, pts[i + 1].y);
              ctx.stroke();
            }
          }

          // Bowlers
          pts.forEach((pt) => {
            ctx.fillStyle = S.league > 0.5 ? '#059669' : '#64748b';
            ctx.beginPath();
            ctx.arc(pt.x, pt.y + 18, 11, 0, Math.PI * 2);
            ctx.fill();
          });

          drawMonoNum(ctx, `社区普遍信任度: ${Math.round(18 + S.league * 78)}%`, W * 0.5, H * 0.1, S.league > 0.5 ? '#059669' : '#64748b', 15, 'center');
          drawCompactSlider(ctx, W * 0.18, H * 0.8, W * 0.64, S.league, '保龄球联赛社团参与度', `${Math.round(S.league * 100)}%`, '#059669');
          drawTinyHint(ctx, W, H, '拉动社团参与度滑块，观察孤立球道间生出绿色横向信任纽带');
        }
      },
      2: {
        init() {
          S = { bridging: 0.2, drag: false };
        },
        down(x, y, { W, H }) {
          if (hitSlider(x, y, W * 0.2, H * 0.79, W * 0.6)) {
            S.drag = true;
            S.bridging = clamp((x - W * 0.2) / (W * 0.6), 0, 1);
          }
        },
        move(x, _y, _dx, _dy, { W }) {
          if (S.drag) S.bridging = clamp((x - W * 0.2) / (W * 0.6), 0, 1);
        },
        up() {
          S.drag = false;
        },
        tick({ ctx, W, H, hit }) {
          drawPaperBg(ctx, W, H, true);
          if (S.bridging < 0.25) hit(2, 0, '仅有「粘合型」资本易强化圈内排外，隔绝跨群体交流');
          if (S.bridging > 0.75) hit(2, 1, '「桥接型」社会资本打通异质群体，提升整体公共包容');

          const drawCluster = (cx: number, cy: number, col: string) => {
            const nodes = Array.from({ length: 6 }, (_, i) => {
              const a = (i / 6) * Math.PI * 2;
              return { x: cx + Math.cos(a) * 58, y: cy + Math.sin(a) * 58 };
            });
            ctx.strokeStyle = col;
            ctx.lineWidth = 1.6;
            for (let i = 0; i < 6; i++) {
              ctx.beginPath();
              ctx.moveTo(nodes[i].x, nodes[i].y);
              ctx.lineTo(nodes[(i + 1) % 6].x, nodes[(i + 1) % 6].y);
              ctx.stroke();
            }
            nodes.forEach((n) => {
              ctx.fillStyle = col;
              ctx.beginPath();
              ctx.arc(n.x, n.y, 7, 0, Math.PI * 2);
              ctx.fill();
            });
            return nodes;
          };

          const left = drawCluster(W * 0.28, H * 0.44, '#38bdf8');
          const right = drawCluster(W * 0.72, H * 0.44, '#fb923c');

          const bridges = Math.round(S.bridging * 5);
          ctx.strokeStyle = '#34d399';
          ctx.lineWidth = 2.6;
          for (let i = 0; i < bridges; i++) {
            ctx.beginPath();
            ctx.moveTo(left[i].x, left[i].y);
            ctx.lineTo(right[(i + 3) % 6].x, right[(i + 3) % 6].y);
            ctx.stroke();
          }

          drawMonoNum(ctx, `跨群体桥接连线: ${bridges} 条`, W * 0.5, H * 0.1, '#34d399', 15, 'center');
          drawCompactSlider(ctx, W * 0.2, H * 0.79, W * 0.6, S.bridging, '桥接型社会资本 (Bridging)', `${Math.round(S.bridging * 100)}%`, '#34d399', true);
          drawTinyHint(ctx, W, H, '向右拉动增加绿色跨群桥接，打破封闭同质小圈子的隔绝', true);
        }
      }
    };
  }

  // =========================================================================
  // #114 皮亚杰 · 认知发展阶段 (Animated Beaker Pouring Water + Conservation Eye Toggle)
  // =========================================================================
  if (modelId === 114) {
    let S: any = {};
    return {
      1: {
        init() {
          S = { pour: 0, pouring: false, stage: 0, t: 0 }; // stage 0=前运算(看高度), 1=具体运算(守恒)
        },
        down(x, y, { W, H }) {
          if (hitBox(x, y, W * 0.2, H * 0.8, 175, 34)) {
            S.pouring = !S.pouring;
          } else if (hitBox(x, y, W * 0.52, H * 0.8, 175, 34)) {
            S.stage = 1 - S.stage;
          }
        },
        tick({ ctx, W, H, dt, hit }) {
          S.t += dt;
          drawPaperBg(ctx, W, H, false);
          S.pour = clamp(S.pour + (S.pouring ? dt * 0.55 : -dt * 0.55), 0, 1);

          if (S.pour > 0.85 && S.stage === 0) hit(1, 0, '前运算期儿童受「中心化」限制，误判细高量筒里的水更多！');
          if (S.pour > 0.85 && S.stage === 1) hit(1, 1, '具体运算期掌握可逆性与补偿：高度虽升、宽度变窄，总量守恒！');

          // Reference wide beaker A (left), Pouring wide beaker B (center), Tall narrow cylinder C (right)
          const baseY = H * 0.66;
          drawBeaker(ctx, W * 0.2, baseY, 76, 110, 0.55, '#38bdf8', 0);
          drawLabel(ctx, '参照杯 A (200ml)', W * 0.2, baseY + 22, '#334155', 11.5, 'center', true);

          // Center beaker tilts & drains into right tall narrow cylinder
          const tilt = S.pour > 0.05 && S.pour < 0.95 ? 0.52 : 0;
          drawBeaker(ctx, W * 0.46, baseY - (tilt > 0 ? 52 : 0), 76, 110, 0.55 * (1 - S.pour), '#38bdf8', tilt);
          drawLabel(ctx, '原杯 B', W * 0.46, baseY + 22, '#334155', 11.5, 'center', true);

          // Pouring water stream
          if (S.pour > 0.05 && S.pour < 0.95) {
            ctx.strokeStyle = '#0ea5e9';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(W * 0.46 + 46, baseY - 102);
            ctx.quadraticCurveTo(W * 0.64, baseY - 105, W * 0.76, baseY - 10);
            ctx.stroke();
          }

          // Tall narrow cylinder (half width -> double height!)
          drawBeaker(ctx, W * 0.76, baseY, 40, 175, clamp(S.pour * 0.86, 0, 0.92), '#38bdf8', 0);
          drawLabel(ctx, '细高杯 C', W * 0.76, baseY + 22, '#0284c7', 11.5, 'center', true);

          // Visual perception comparison callout
          if (S.pour > 0.75) {
            if (S.stage === 0) {
              // Red height-only bracket
              ctx.strokeStyle = '#dc2626';
              ctx.lineWidth = 2.4;
              ctx.beginPath();
              ctx.moveTo(W * 0.83, baseY - 148);
              ctx.lineTo(W * 0.83, baseY);
              ctx.stroke();
              drawMonoNum(ctx, '仅看液面高度 → 误判 C > A', W * 0.5, H * 0.1, '#dc2626', 14.5, 'center');
            } else {
              drawMonoNum(ctx, '高×宽 补偿守恒 → C = A (200ml) ✓', W * 0.5, H * 0.1, '#059669', 14.5, 'center');
            }
          } else {
            drawMonoNum(ctx, 'A 与 B 水量完全相等 (200ml)', W * 0.5, H * 0.1, '#0284c7', 14.5, 'center');
          }

          drawToggleButton(ctx, W * 0.2, H * 0.8, 175, 34, S.pouring ? '倒回原杯 B ↩' : '倒入细高量筒 C 💧', S.pouring, '#0284c7');
          drawToggleButton(ctx, W * 0.52, H * 0.8, 175, 34, S.stage === 0 ? '视角: 前运算期 (4岁)' : '视角: 具体运算期 (8岁)', S.stage === 1, '#059669');
          drawTinyHint(ctx, W, H, '点击将 B 杯水倒入细高杯 C，并切换儿童认知阶段观察守恒判断');
        }
      },
      2: {
        init() {
          S = { schemaSize: 38, ballType: 0, accommodated: false, t: 0 };
        },
        down(x, y, { W, H }) {
          if (hitBox(x, y, W * 0.18, H * 0.8, 175, 34)) {
            S.ballType = 0; // fits easily -> Assimilation
          } else if (hitBox(x, y, W * 0.52, H * 0.8, 185, 34)) {
            S.ballType = 1; // giant square -> triggers Accommodation!
            S.accommodated = true;
          }
        },
        tick({ ctx, W, H, dt, hit }) {
          S.t += dt;
          drawPaperBg(ctx, W, H, false);
          const targetSize = S.ballType === 1 ? 68 : 42;
          S.schemaSize = lerp(S.schemaSize, targetSize, dt * 2.4);

          if (S.ballType === 0 && S.t > 1) hit(2, 0, '同化 (Assimilation)：新经验顺利装入既有认知图式');
          if (S.accommodated) hit(2, 1, '顺应 (Accommodation)：新异对象撞破旧框，迫使图式重构升级！');

          const cx = W * 0.5;
          const cy = H * 0.44;
          // Cognitive Schema Frame morphing from circle to rounded octagon when accommodated
          ctx.strokeStyle = S.ballType === 1 ? '#059669' : '#2563eb';
          ctx.lineWidth = 4;
          ctx.beginPath();
          if (S.ballType === 1) {
            ctx.roundRect(cx - S.schemaSize, cy - S.schemaSize, S.schemaSize * 2, S.schemaSize * 2, 14);
          } else {
            ctx.arc(cx, cy, S.schemaSize, 0, Math.PI * 2);
          }
          ctx.stroke();

          // Incoming object
          ctx.fillStyle = S.ballType === 1 ? '#f59e0b' : '#38bdf8';
          if (S.ballType === 1) {
            ctx.fillRect(cx - 34, cy - 34, 68, 68);
            drawLabel(ctx, '鲸鱼(哺乳)', cx, cy + 4, '#fff', 11, 'center', true);
          } else {
            ctx.beginPath();
            ctx.arc(cx, cy, 24, 0, Math.PI * 2);
            ctx.fill();
            drawLabel(ctx, '金鱼', cx, cy + 4, '#fff', 11, 'center', true);
          }

          drawMonoNum(ctx, S.ballType === 1 ? '图式扩张重构 → 顺应 (Accommodation)' : '归入旧图式 → 同化 (Assimilation)', cx, H * 0.1, '#0f172a', 14.5, 'center');
          drawToggleButton(ctx, W * 0.18, H * 0.8, 175, 34, '投喂“金鱼” (同化)', S.ballType === 0, '#2563eb');
          drawToggleButton(ctx, W * 0.52, H * 0.8, 185, 34, '投喂“胎生鲸鱼” (顺应)', S.ballType === 1, '#059669');
          drawTinyHint(ctx, W, H, '切换投喂常规与反常经验，观察蓝色认知图式框架的同化吸收与顺应变形');
        }
      }
    };
  }

  // =========================================================================
  // #116 斯金纳 · 操作性条件反射 (Skinner Box Lever + Falling Pellets + Cumulative Chart)
  // =========================================================================
  if (modelId === 116) {
    let S: any = {};
    return {
      1: {
        init() {
          S = {
            schedule: 0, // 0=Fixed Ratio (every 3), 1=Variable Ratio (random 1..5), 2=Extinction (0)
            presses: 0,
            sinceReward: 0,
            nextVR: 2,
            leverDip: 0,
            pellets: [] as { y: number; vy: number }[],
            rateHist: [] as number[],
            recentPresses: 0,
            t: 0,
            triedVR: false,
            triedExt: false
          };
        },
        down(x, y, { W, H }) {
          // Click lever or anywhere in Skinner box to press lever!
          if (hitBox(x, y, W * 0.08, H * 0.16, W * 0.44, H * 0.56)) {
            S.presses++;
            S.recentPresses++;
            S.sinceReward++;
            S.leverDip = 1;
            let reward = false;
            if (S.schedule === 0 && S.sinceReward >= 3) {
              reward = true;
              S.sinceReward = 0;
            } else if (S.schedule === 1 && S.sinceReward >= S.nextVR) {
              reward = true;
              S.sinceReward = 0;
              S.nextVR = 1 + Math.floor(Math.random() * 5);
            }
            if (reward) {
              S.pellets.push({ y: H * 0.24, vy: 120 });
            }
            return;
          }
          for (let i = 0; i < 3; i++) {
            if (hitBox(x, y, W * 0.12 + i * W * 0.26, H * 0.8, W * 0.23, 34)) {
              S.schedule = i;
              S.sinceReward = 0;
              if (i === 1) S.triedVR = true;
              if (i === 2) S.triedExt = true;
            }
          }
        },
        tick({ ctx, W, H, dt, hit }) {
          S.t += dt;
          S.leverDip = Math.max(0, S.leverDip - dt * 5);
          drawPaperBg(ctx, W, H, false);

          // Auto-press simulation gently reflecting schedule psychology + user clicks!
          const autoProb = S.schedule === 1 ? 0.09 : S.schedule === 0 ? 0.055 : 0.012;
          if (Math.random() < autoProb) {
            S.presses++;
            S.recentPresses++;
            S.sinceReward++;
            S.leverDip = 0.8;
            if ((S.schedule === 0 && S.sinceReward >= 3) || (S.schedule === 1 && S.sinceReward >= S.nextVR)) {
              S.sinceReward = 0;
              S.nextVR = 1 + Math.floor(Math.random() * 5);
              S.pellets.push({ y: H * 0.24, vy: 120 });
            }
          }

          if (Math.floor(S.t * 4) !== Math.floor((S.t - dt) * 4)) {
            S.rateHist.push(clamp(S.recentPresses / 4, 0.05, 1));
            S.recentPresses = 0;
            if (S.rateHist.length > 50) S.rateHist.shift();
          }

          if (S.triedVR) hit(1, 0, '变动比率 (VR) 强化触发最高、最抗消退的持续压杆频率！');
          if (S.triedExt) hit(1, 1, '撤除强化物后，操作行为频率逐步消退');

          // Left: Cutaway Skinner Box
          const bx = W * 0.08;
          const by = H * 0.16;
          const bw = W * 0.44;
          const bh = H * 0.56;
          ctx.fillStyle = '#f8fafc';
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.roundRect(bx, by, bw, bh, 10);
          ctx.fill();
          ctx.stroke();

          // Signal Light + Food Hopper
          ctx.fillStyle = S.pellets.length > 0 ? '#22c55e' : '#cbd5e1';
          ctx.beginPath();
          ctx.arc(bx + bw - 34, by + 28, 10, 0, Math.PI * 2);
          ctx.fill();

          // Interactive Lever
          const ly = by + bh * 0.58 + S.leverDip * 14;
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(bx + bw - 8, by + bh * 0.58);
          ctx.lineTo(bx + bw - 72, ly);
          ctx.stroke();
          ctx.fillStyle = '#dc2626';
          ctx.beginPath();
          ctx.arc(bx + bw - 72, ly, 12, 0, Math.PI * 2);
          ctx.fill();
          drawLabel(ctx, '点我压杆', bx + bw - 72, ly - 18, '#dc2626', 11, 'center', true);

          // Cute stylized lab pigeon / mouse silhouette approaching lever
          ctx.fillStyle = '#64748b';
          ctx.beginPath();
          ctx.ellipse(bx + bw * 0.42, by + bh - 34, 34, 22, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(bx + bw * 0.54, by + bh - 46, 15, 0, Math.PI * 2);
          ctx.fill();

          // Falling gold food pellets
          S.pellets.forEach((p: any) => {
            p.y += p.vy * dt;
            p.vy += 180 * dt;
            drawCoin(ctx, bx + bw - 34, p.y, 6, '★');
          });
          S.pellets = S.pellets.filter((p: any) => p.y < by + bh - 12);

          // Right: Live Response Frequency Recorder
          drawSparkline(ctx, W * 0.56, by, W * 0.36, bh, [
            { data: S.rateHist, color: S.schedule === 1 ? '#d97706' : S.schedule === 0 ? '#0284c7' : '#94a3b8', label: '压杆行为速率' }
          ]);

          drawMonoNum(ctx, `总压杆次数: ${S.presses}`, W * 0.5, H * 0.1, '#0f172a', 14, 'center');
          ['固定比率 (3次1粒)', '变动比率 (老虎机)', '停止强化 (消退)'].forEach((lbl, i) => {
            drawToggleButton(ctx, W * 0.12 + i * W * 0.26, H * 0.8, W * 0.23, 34, lbl, S.schedule === i, i === 1 ? '#d97706' : '#0284c7');
          });
          drawTinyHint(ctx, W, H, '点击箱内红色压杆，切换三种强化程序并观察右侧行为频率记录仪');
        }
      },
      2: {
        init() {
          S = { quad: 0, visited: new Set([0]) };
        },
        down(x, y, { W, H }) {
          const cx = W * 0.5;
          const cy = H * 0.46;
          if (y > H * 0.18 && y < H * 0.74 && x > W * 0.15 && x < W * 0.85) {
            const col = x < cx ? 0 : 1;
            const row = y < cy ? 0 : 1;
            S.quad = row * 2 + col;
            S.visited.add(S.quad);
          }
        },
        tick({ ctx, W, H, hit }) {
          drawPaperBg(ctx, W, H, false);
          if (S.visited.size >= 2) hit(2, 0, '「正/负」代表施加或撤除刺激，「强化/惩罚」决定行为增减');
          if (S.visited.size >= 4) hit(2, 1, '负强化是撤除厌恶刺激以增加行为，与惩罚完全不同！');

          const items = [
            { title: '正强化 (+奖赏)', arrow: '行为 ↑', col: '#059669' },
            { title: '负强化 (-噪声)', arrow: '行为 ↑', col: '#0284c7' },
            { title: '正惩罚 (+电击)', arrow: '行为 ↓', col: '#dc2626' },
            { title: '负惩罚 (-特权)', arrow: '行为 ↓', col: '#d97706' }
          ];
          const cw = W * 0.34;
          const ch = H * 0.25;
          items.forEach((it, i) => {
            const c = i % 2;
            const r = Math.floor(i / 2);
            const x = W * 0.16 + c * (cw + 16);
            const y = H * 0.2 + r * (ch + 16);
            const active = S.quad === i;
            ctx.fillStyle = active ? it.col : '#ffffff';
            ctx.strokeStyle = it.col;
            ctx.lineWidth = active ? 3 : 1.6;
            ctx.beginPath();
            ctx.roundRect(x, y, cw, ch, 12);
            ctx.fill();
            ctx.stroke();
            drawLabel(ctx, it.title, x + cw / 2, y + ch * 0.42, active ? '#fff' : it.col, 14, 'center', true);
            drawMonoNum(ctx, it.arrow, x + cw / 2, y + ch * 0.72, active ? '#fef08a' : '#334155', 16, 'center');
          });
          drawMonoNum(ctx, '强化与惩罚四象限矩阵', W * 0.5, H * 0.11, '#0f172a', 15, 'center');
          drawTinyHint(ctx, W, H, '依次点击四个操作象限，区分正/负强化与正/负惩罚的行为方向');
        }
      }
    };
  }

  // =========================================================================
  // #117 巴甫洛夫 · 经典条件反射 (Swinging Brass Bell + Food Bowl + Thickening Synapse + Saliva)
  // =========================================================================
  if (modelId === 117) {
    let S: any = {};
    return {
      1: {
        init() {
          S = { assoc: 0.05, bellRing: 0, foodGlow: 0, saliva: 0, paired: 0, bellOnlyTested: false };
        },
        down(x, y, { W, H }) {
          if (hitBox(x, y, W * 0.16, H * 0.8, 175, 34)) {
            // Pair Bell + Food!
            S.bellRing = 1;
            S.foodGlow = 1;
            S.assoc = clamp(S.assoc + 0.24, 0, 1);
            S.saliva = 0.95;
            S.paired++;
          } else if (hitBox(x, y, W * 0.52, H * 0.8, 175, 34)) {
            // Bell ONLY!
            S.bellRing = 1;
            S.saliva = S.assoc;
            if (S.assoc > 0.65) S.bellOnlyTested = true;
            else S.assoc = Math.max(0.05, S.assoc - 0.12);
          }
        },
        tick({ ctx, W, H, dt, hit }) {
          S.bellRing = Math.max(0, S.bellRing - dt * 0.9);
          S.foodGlow = Math.max(0, S.foodGlow - dt * 0.8);
          S.saliva = lerp(S.saliva, 0.05, dt * 1.1);
          drawPaperBg(ctx, W, H, false);

          if (S.paired >= 3) hit(1, 0, '铃声与食物反复配对，建立起粗壮的条件神经联结！');
          if (S.bellOnlyTested) hit(1, 1, '仅摇响铃声（无食物）即触发强烈唾液分泌——经典条件反射习得！');

          // Brass Bell (Left)
          drawBell(ctx, W * 0.22, H * 0.34, 1.35, S.bellRing);
          drawLabel(ctx, '条件刺激 CS (铃声)', W * 0.22, H * 0.48, '#b45309', 12, 'center', true);

          // Food Bowl (Center Top)
          ctx.fillStyle = S.foodGlow > 0.1 ? '#dc2626' : '#94a3b8';
          ctx.beginPath();
          ctx.ellipse(W * 0.5, H * 0.28, 34, 15, 0, 0, Math.PI * 2);
          ctx.fill();
          drawLabel(ctx, '无条件刺激 US (肉)', W * 0.5, H * 0.38, '#991b1b', 12, 'center', true);

          // Thickening Synapse Bridge from Bell -> Saliva Gauge
          ctx.strokeStyle = `rgba(37, 99, 235, ${0.2 + S.assoc * 0.8})`;
          ctx.lineWidth = 2 + S.assoc * 10;
          ctx.beginPath();
          ctx.moveTo(W * 0.27, H * 0.35);
          ctx.quadraticCurveTo(W * 0.5, H * 0.62, W * 0.74, H * 0.42);
          ctx.stroke();
          drawMonoNum(ctx, `突触联结强度 ${Math.round(S.assoc * 100)}%`, W * 0.5, H * 0.57, '#1d4ed8', 12.5, 'center');

          // Saliva Glass Beaker (Right)
          drawBeaker(ctx, W * 0.78, H * 0.58, 66, 120, S.saliva, '#38bdf8', 0);
          drawLabel(ctx, '唾液分泌量 CR', W * 0.78, H * 0.64, '#0284c7', 12, 'center', true);

          drawToggleButton(ctx, W * 0.16, H * 0.8, 175, 34, '配对训练: 铃声 + 食物', S.foodGlow > 0.1, '#d97706');
          drawToggleButton(ctx, W * 0.52, H * 0.8, 175, 34, '单独测试: 只摇铃声 🔔', S.bellRing > 0.1 && S.foodGlow <= 0.1, '#2563eb');
          drawTinyHint(ctx, W, H, '连续点击 3 次「铃声+食物」强化突触桥梁，再点击「只摇铃声」验收反射');
        }
      },
      2: {
        init() {
          S = { freq: 500, drag: false }; // Trained at 500Hz
        },
        down(x, y, { W, H }) {
          if (hitSlider(x, y, W * 0.18, H * 0.79, W * 0.64)) {
            S.drag = true;
            S.freq = 200 + clamp((x - W * 0.18) / (W * 0.64), 0, 1) * 600;
          }
        },
        move(x, _y, _dx, _dy, { W }) {
          if (S.drag) S.freq = 200 + clamp((x - W * 0.18) / (W * 0.64), 0, 1) * 600;
        },
        up() {
          S.drag = false;
        },
        tick({ ctx, W, H, hit }) {
          drawPaperBg(ctx, W, H, false);
          // Generalization Gaussian gradient centered at 500Hz
          const resp = Math.exp(-Math.pow((S.freq - 500) / 140, 2));
          if (Math.abs(S.freq - 500) > 70 && Math.abs(S.freq - 500) < 160) hit(2, 0, '刺激泛化：相近音调也能唤起部分条件反射');
          if (Math.abs(S.freq - 500) > 220) hit(2, 1, '刺激分化：差异过大的频率不再引发反应');

          const gx = W * 0.14;
          const gy = H * 0.16;
          const gw = W * 0.72;
          const gh = H * 0.48;
          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = 3;
          ctx.beginPath();
          for (let i = 0; i <= 60; i++) {
            const f = 200 + (i / 60) * 600;
            const r = Math.exp(-Math.pow((f - 500) / 140, 2));
            const px = gx + (i / 60) * gw;
            const py = gy + gh - r * gh * 0.85;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();

          const ux = gx + ((S.freq - 200) / 600) * gw;
          const uy = gy + gh - resp * gh * 0.85;
          ctx.fillStyle = '#d97706';
          ctx.beginPath();
          ctx.arc(ux, uy, 9, 0, Math.PI * 2);
          ctx.fill();

          drawMonoNum(ctx, `测试音调 ${Math.round(S.freq)} Hz  |  反射强度 ${Math.round(resp * 100)}%`, W * 0.5, H * 0.1, '#0284c7', 14.5, 'center');
          drawCompactSlider(ctx, W * 0.18, H * 0.79, W * 0.64, (S.freq - 200) / 600, '测试音调频率 (训练基准 500Hz)', `${Math.round(S.freq)} Hz`, '#d97706');
          drawTinyHint(ctx, W, H, '沿音调频谱拖动滑块，观察条件反射的泛化梯度与分化边界');
        }
      }
    };
  }

  // =========================================================================
  // #118 班杜拉 · 社会学习理论 (Wobbling Bobo Doll + Mirror Observer + Vicarious Outcome)
  // =========================================================================
  if (modelId === 118) {
    let S: any = {};
    return {
      1: {
        init() {
          S = { outcome: 0, wobble: 0, imitateProb: 0.75, t: 0, visited: new Set([0]) }; // 0=Rewarded, 1=Neutral, 2=Punished
        },
        down(x, y, { W, H }) {
          for (let i = 0; i < 3; i++) {
            if (hitBox(x, y, W * 0.14 + i * W * 0.25, H * 0.8, W * 0.22, 34)) {
              S.outcome = i;
              S.wobble = 1;
              S.visited.add(i);
            }
          }
        },
        tick({ ctx, W, H, dt, hit }) {
          S.t += dt;
          S.wobble = Math.max(0, S.wobble - dt * 0.9);
          drawPaperBg(ctx, W, H, false);
          const targetProb = S.outcome === 0 ? 0.88 : S.outcome === 1 ? 0.62 : 0.22;
          S.imitateProb = lerp(S.imitateProb, targetProb, dt * 3);

          if (S.visited.size >= 2) hit(1, 0, '观察者无需亲身试错，光看榜样动作即可习得完整行为');
          if (S.visited.has(2)) hit(1, 1, '替代性强化：看见榜样受罚会抑制儿童外显模仿，但动作已编码在脑中');

          // Left: Bobo Doll (wobbling roly-poly!)
          const dx = W * 0.3;
          const dy = H * 0.62;
          ctx.save();
          ctx.translate(dx, dy);
          ctx.rotate(Math.sin(S.t * 14) * S.wobble * 0.45);
          ctx.fillStyle = '#f59e0b';
          ctx.strokeStyle = '#92400e';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, -24, 28, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(0, -68, 19, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
          drawLabel(ctx, '波波玩偶 + 榜样示范', dx, dy + 22, '#92400e', 11.5, 'center', true);

          // Mirror Wave from Model to Child Observer
          drawArrow(ctx, W * 0.4, H * 0.42, W * 0.6, H * 0.42, S.outcome === 0 ? '#dc2626' : S.outcome === 2 ? '#059669' : '#64748b', 3, 10);
          drawLabel(ctx, '观察模仿', W * 0.5, H * 0.39, '#475569', 11, 'center', true);

          // Right: Child Observer + Imitation Bar
          const ox = W * 0.72;
          ctx.fillStyle = '#2563eb';
          ctx.beginPath();
          ctx.arc(ox, H * 0.44, 26, 0, Math.PI * 2);
          ctx.fill();
          drawLabel(ctx, '儿童观察者', ox, H * 0.54, '#1e3a8a', 11.5, 'center', true);
          drawMonoNum(ctx, `模仿攻击率: ${Math.round(S.imitateProb * 100)}%`, ox, H * 0.32, S.imitateProb > 0.6 ? '#dc2626' : '#059669', 14, 'center');

          ['榜样获糖果奖励', '榜样无后果', '榜样受责罚'].forEach((lbl, i) => {
            drawToggleButton(ctx, W * 0.14 + i * W * 0.25, H * 0.8, W * 0.22, 34, lbl, S.outcome === i, i === 0 ? '#dc2626' : i === 2 ? '#059669' : '#64748b');
          });
          drawTinyHint(ctx, W, H, '切换榜样推倒波波玩偶后的奖惩结果，观察儿童的替代性模仿概率');
        }
      },
      2: {
        init() {
          S = { efficacy: 0.6, drag: false };
        },
        down(x, y, { W, H }) {
          if (hitSlider(x, y, W * 0.2, H * 0.79, W * 0.6)) {
            S.drag = true;
            S.efficacy = clamp((x - W * 0.2) / (W * 0.6), 0.1, 1);
          }
        },
        move(x, _y, _dx, _dy, { W }) {
          if (S.drag) S.efficacy = clamp((x - W * 0.2) / (W * 0.6), 0.1, 1);
        },
        up() {
          S.drag = false;
        },
        tick({ ctx, W, H, hit }) {
          drawPaperBg(ctx, W, H, false);
          if (S.efficacy > 0.75) hit(2, 0, '高自我效能感驱使个体迎接高难度挑战并延长坚持时长');
          if (S.efficacy < 0.3) hit(2, 1, '低效能感导致未战先退，形成回避的负向循环');

          // Jumping hurdle height bar
          const by = H * 0.64;
          const jumpH = S.efficacy * 165;
          ctx.fillStyle = '#059669';
          ctx.fillRect(W * 0.45, by - jumpH, 90, jumpH);
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(W * 0.15, by);
          ctx.lineTo(W * 0.85, by);
          ctx.stroke();

          drawMonoNum(ctx, `敢于跨越挑战高度: ${Math.round(S.efficacy * 100)} 分`, W * 0.5, H * 0.12, '#059669', 15, 'center');
          drawCompactSlider(ctx, W * 0.2, H * 0.79, W * 0.6, (S.efficacy - 0.1) / 0.9, '自我效能感信念', `${Math.round(S.efficacy * 100)}%`, '#059669');
          drawTinyHint(ctx, W, H, '拖动自我效能感滑块，看个体愿投入努力与挑战的目标高度同步跃升');
        }
      }
    };
  }

  // =========================================================================
  // #119 鲍尔比 · 依恋理论 (Warm Lighthouse Secure Base + Explorer Orb + Storm Cloud)
  // =========================================================================
  if (modelId === 119) {
    let S: any = {};
    return {
      1: {
        init() {
          S = { responsive: true, storm: false, orbX: 0.42, orbY: 0.46, t: 0, testedStorm: false };
        },
        down(x, y, { W, H }) {
          if (hitBox(x, y, W * 0.18, H * 0.8, 175, 34)) {
            S.responsive = !S.responsive;
          } else if (hitBox(x, y, W * 0.52, H * 0.8, 175, 34)) {
            S.storm = !S.storm;
            if (S.storm) S.testedStorm = true;
          }
        },
        tick({ ctx, W, H, dt, hit }) {
          S.t += dt;
          drawPaperBg(ctx, W, H, true);
          const baseX = W * 0.22;
          const baseY = H * 0.5;

          // Target position of explorer child orb
          let tx = W * 0.72;
          let ty = H * 0.45 + Math.sin(S.t * 2) * 36;
          if (S.storm) {
            // In storm: darts back to Secure Base if responsive, or freezes anxiously halfway if unresponsive!
            tx = S.responsive ? baseX + 46 : W * 0.48 + Math.sin(S.t * 16) * 8;
            ty = S.responsive ? baseY : H * 0.54;
          } else if (!S.responsive) {
            // Without secure base, hesitates to venture far
            tx = W * 0.42;
            ty = H * 0.5;
          }
          S.orbX = lerp(S.orbX, tx / W, dt * 3);
          S.orbY = lerp(S.orbY, ty / H, dt * 3);

          if (S.responsive && !S.storm && S.orbX > 0.65) hit(1, 0, '稳定回应的「安全基地」反而赋予孩子勇敢探索远方的底气');
          if (S.testedStorm) hit(1, 1, '遭遇惊吓压力时，安全依恋个体能迅速回港平复并再次出发');

          // Warm Lighthouse Base
          const glowR = S.responsive ? 72 + Math.sin(S.t * 2.5) * 6 : 26;
          ctx.fillStyle = S.responsive ? 'rgba(251, 191, 36, 0.22)' : 'rgba(148, 163, 184, 0.15)';
          ctx.beginPath();
          ctx.arc(baseX, baseY, glowR, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = S.responsive ? '#f59e0b' : '#64748b';
          ctx.beginPath();
          ctx.arc(baseX, baseY, 22, 0, Math.PI * 2);
          ctx.fill();
          drawLabel(ctx, S.responsive ? '温暖安全基地' : '冷漠/缺席基地', baseX, baseY + 42, S.responsive ? '#fde047' : '#94a3b8', 11.5, 'center', true);

          // Exploration playground stars on right
          for (let i = 0; i < 4; i++) {
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.arc(W * 0.74 + (i % 2) * 44, H * 0.34 + Math.floor(i / 2) * 80, 7, 0, Math.PI * 2);
            ctx.fill();
          }
          drawLabel(ctx, '未知探索区', W * 0.76, H * 0.24, '#7dd3fc', 11.5, 'center', true);

          // Storm cloud if active
          if (S.storm) {
            ctx.fillStyle = '#475569';
            ctx.beginPath();
            ctx.arc(W * 0.68, H * 0.22, 26, 0, Math.PI * 2);
            ctx.arc(W * 0.74, H * 0.2, 30, 0, Math.PI * 2);
            ctx.fill();
            drawLabel(ctx, '⚡ 陌生压力', W * 0.72, H * 0.26, '#fca5a5', 11.5, 'center', true);
          }

          // Explorer Orb + elastic tether to base
          const ox = S.orbX * W;
          const oy = S.orbY * H;
          ctx.strokeStyle = S.responsive ? 'rgba(251,191,36,0.45)' : 'rgba(248,113,113,0.4)';
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(baseX, baseY);
          ctx.lineTo(ox, oy);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = '#34d399';
          ctx.beginPath();
          ctx.arc(ox, oy, 13, 0, Math.PI * 2);
          ctx.fill();

          drawToggleButton(ctx, W * 0.18, H * 0.8, 175, 34, S.responsive ? '基地: 稳定回应 ✓' : '基地: 不可预测', S.responsive, '#d97706', true);
          drawToggleButton(ctx, W * 0.52, H * 0.8, 175, 34, S.storm ? '解除陌生压力 ☀' : '触发惊吓风暴 ⚡', S.storm, '#dc2626', true);
          drawTinyHint(ctx, W, H, '切换基地回应度并触发压力风暴，观察探索小球的远航半径与回港行为', true);
        }
      },
      2: {
        init() {
          S = { style: 0, visited: new Set([0]) };
        },
        down(x, y, { W, H }) {
          for (let i = 0; i < 3; i++) {
            if (hitBox(x, y, W * 0.14 + i * W * 0.25, H * 0.8, W * 0.22, 34)) {
              S.style = i;
              S.visited.add(i);
            }
          }
        },
        tick({ ctx, W, H, hit }) {
          drawPaperBg(ctx, W, H, true);
          if (S.visited.size >= 2) hit(2, 0, '早期互动沉淀为「内部工作模型」，影响成年后的亲密距离感');
          if (S.visited.size >= 3) hit(2, 1, '内部工作模型并非定命，可在后续稳定关系中持续修正');

          const cx = W * 0.5;
          const cy = H * 0.44;
          const configs = [
            { sep: 58, col: '#34d399', lbl: '安全型 · 亲密与独立平衡' },
            { sep: 26, col: '#fbbf24', lbl: '焦虑型 · 害怕抛弃紧贴' },
            { sep: 145, col: '#94a3b8', lbl: '回避型 · 压抑需求疏离' }
          ];
          const c = configs[S.style];
          ctx.strokeStyle = c.col;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(cx - c.sep, cy);
          ctx.lineTo(cx + c.sep, cy);
          ctx.stroke();

          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(cx - c.sep, cy, 24, 0, Math.PI * 2);
          ctx.fill();
          drawLabel(ctx, '自我', cx - c.sep, cy + 4, '#fff', 11, 'center', true);

          ctx.fillStyle = c.col;
          ctx.beginPath();
          ctx.arc(cx + c.sep, cy, 24, 0, Math.PI * 2);
          ctx.fill();
          drawLabel(ctx, '他人', cx + c.sep, cy + 4, '#0f172a', 11, 'center', true);

          drawMonoNum(ctx, c.lbl, cx, H * 0.12, c.col, 15, 'center');
          ['安全型', '焦虑型', '回避型'].forEach((lbl, i) => {
            drawToggleButton(ctx, W * 0.14 + i * W * 0.25, H * 0.8, W * 0.22, 34, lbl, S.style === i, '#0284c7', true);
          });
          drawTinyHint(ctx, W, H, '切换三种常见依恋模式原型，观察「自我—他人」心理距离向量', true);
        }
      }
    };
  }

  // =========================================================================
  // #120 费斯汀格 · 认知失调 (Belief & Action Orbs + Vibrating Red Coil + $1 vs $20)
  // =========================================================================
  if (modelId === 120) {
    let S: any = {};
    return {
      1: {
        init() {
          S = { reward: 20, beliefShift: 0, t: 0, tried1: false, tried20: false }; // $1 vs $20 classic experiment
        },
        down(x, y, { W, H }) {
          if (hitBox(x, y, W * 0.2, H * 0.8, 175, 34)) {
            S.reward = 20;
            S.tried20 = true;
          } else if (hitBox(x, y, W * 0.52, H * 0.8, 175, 34)) {
            S.reward = 1;
            S.tried1 = true;
          }
        },
        tick({ ctx, W, H, dt, hit }) {
          S.t += dt;
          drawPaperBg(ctx, W, H, false);
          // $20 gives ample external justification -> Belief stays "Boring" (0), tension low
          // $1 gives NO external justification -> High dissonance -> Brain rationalizes Belief toward "Actually Fun!" (0.85)
          const targetBelief = S.reward === 1 ? 0.85 : 0.08;
          S.beliefShift = lerp(S.beliefShift, targetBelief, dt * 1.4);
          const dissonance = S.reward === 1 ? clamp(1 - S.beliefShift, 0.12, 1) : 0.1;

          if (S.tried20) hit(1, 0, '拿到 $20 报酬拥有充分外在理由，无需修改内心真实态度');
          if (S.tried1 && S.beliefShift > 0.65) hit(1, 1, '仅拿 $1 撒谎引发剧烈认知失调，大脑自动把无聊任务改写成「挺有趣」！');

          const actX = W * 0.72;
          const actY = H * 0.44;
          const belX = lerp(W * 0.24, W * 0.56, S.beliefShift);
          const belY = H * 0.44;

          // Vibrating red coil spring between Belief & Action
          ctx.strokeStyle = dissonance > 0.35 ? '#dc2626' : '#059669';
          ctx.lineWidth = 2.6;
          ctx.beginPath();
          const segs = 12;
          for (let i = 0; i <= segs; i++) {
            const u = i / segs;
            const px = lerp(belX + 28, actX - 28, u);
            const zig = i === 0 || i === segs ? 0 : (i % 2 === 0 ? 1 : -1) * (6 + dissonance * 18) * Math.sin(S.t * 20 + i);
            if (i === 0) ctx.moveTo(px, belY + zig);
            else ctx.lineTo(px, belY + zig);
          }
          ctx.stroke();

          // Belief Orb (drifts closer to Action under $1 dissonance!)
          ctx.fillStyle = '#2563eb';
          ctx.beginPath();
          ctx.arc(belX, belY, 34, 0, Math.PI * 2);
          ctx.fill();
          drawLabel(ctx, S.beliefShift > 0.5 ? '信念: 挺有趣!' : '信念: 好无聊', belX, belY + 4, '#fff', 10.5, 'center', true);

          // Action Orb
          ctx.fillStyle = '#d97706';
          ctx.beginPath();
          ctx.arc(actX, actY, 34, 0, Math.PI * 2);
          ctx.fill();
          drawLabel(ctx, '行为: 夸它好玩', actX, actY + 4, '#fff', 10.5, 'center', true);

          drawMonoNum(
            ctx,
            S.reward === 1 ? '仅给 $1 报酬 → 外在理由不足 → 自动改写内心信念！' : '给 $20 报酬 → 外在理由充足 → 保持“其实很无聊”',
            W * 0.5,
            H * 0.11,
            S.reward === 1 ? '#dc2626' : '#059669',
            13.5,
            'center'
          );

          drawToggleButton(ctx, W * 0.2, H * 0.8, 175, 34, '支付 $20 让他夸有趣', S.reward === 20, '#059669');
          drawToggleButton(ctx, W * 0.52, H * 0.8, 175, 34, '仅付 $1 让他夸有趣', S.reward === 1, '#dc2626');
          drawTinyHint(ctx, W, H, '切换经典实验的 $20 与 $1 报酬，看红色失调弹簧如何强行拉近蓝色信念球');
        }
      },
      2: {
        init() {
          S = { choice: 0, visited: new Set([0]) };
        },
        down(x, y, { W, H }) {
          for (let i = 0; i < 3; i++) {
            if (hitBox(x, y, W * 0.14 + i * W * 0.25, H * 0.8, W * 0.22, 34)) {
              S.choice = i;
              S.visited.add(i);
            }
          }
        },
        tick({ ctx, W, H, hit }) {
          drawPaperBg(ctx, W, H, false);
          if (S.visited.size >= 2) hit(2, 0, '消除失调的三条路径：改行为、改信念，或增加合理化借口');
          if (S.visited.size >= 3) hit(2, 1, '「酸葡萄」与「合理化」是大脑自我减压的本能机制');

          const cx = W * 0.5;
          const cy = H * 0.44;
          const labels = ['路径1: 改变行为 (戒烟)', '路径2: 淡化风险信念', '路径3: 加新借口 (解压)'];
          const cols = ['#059669', '#d97706', '#7c3aed'];
          ctx.fillStyle = cols[S.choice];
          ctx.beginPath();
          ctx.arc(cx, cy, 56, 0, Math.PI * 2);
          ctx.fill();
          drawLabel(ctx, '失调归零', cx, cy + 5, '#fff', 14, 'center', true);
          drawMonoNum(ctx, labels[S.choice], cx, H * 0.12, cols[S.choice], 15, 'center');

          ['改变行为', '修改信念', '添加借口'].forEach((lbl, i) => {
            drawToggleButton(ctx, W * 0.14 + i * W * 0.25, H * 0.8, W * 0.22, 34, lbl, S.choice === i, cols[i]);
          });
          drawTinyHint(ctx, W, H, '切换三种心理减压路径，观察大脑如何平复行为与认知之间的张力');
        }
      }
    };
  }

  // =========================================================================
  // #121 马斯洛 · 需求层次理论 (5-Tier Luminous Pyramid Filling From Base Up)
  // =========================================================================
  if (modelId === 121) {
    let S: any = {};
    return {
      1: {
        init() {
          S = { supply: 0.22, drag: false, t: 0 };
        },
        down(x, y, { W, H }) {
          if (hitSlider(x, y, W * 0.18, H * 0.82, W * 0.64)) {
            S.drag = true;
            S.supply = clamp((x - W * 0.18) / (W * 0.64), 0.05, 1);
          }
        },
        move(x, _y, _dx, _dy, { W }) {
          if (S.drag) S.supply = clamp((x - W * 0.18) / (W * 0.64), 0.05, 1);
        },
        up() {
          S.drag = false;
        },
        tick({ ctx, W, H, dt, hit }) {
          S.t += dt;
          drawPaperBg(ctx, W, H, true);
          if (S.supply < 0.35) hit(1, 0, '基础匮乏需求未满足时，全部注意力被锁定在底层生存');
          if (S.supply > 0.82) hit(1, 1, '随着各层依次充盈，注意灯塔升至塔尖「自我实现」成长需求！');

          const tiers = [
            { name: '生理需求', col: '#ef4444' },
            { name: '安全需求', col: '#f59e0b' },
            { name: '归属与爱', col: '#10b981' },
            { name: '尊重需求', col: '#38bdf8' },
            { name: '自我实现', col: '#a78bfa' }
          ];
          const cx = W * 0.5;
          const baseY = H * 0.68;
          const tierH = 44;
          const activeTier = Math.min(4, Math.floor(S.supply * 5));

          tiers.forEach((tier, i) => {
            const yBot = baseY - i * tierH;
            const yTop = yBot - tierH + 4;
            const wBot = 260 - i * 44;
            const wTop = 260 - (i + 1) * 44;
            const filled = S.supply >= (i + 1) * 0.2;
            const active = i === activeTier;

            ctx.fillStyle = filled ? tier.col : active ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.06)';
            ctx.strokeStyle = active ? '#fde047' : tier.col;
            ctx.lineWidth = active ? 3 : 1.5;
            ctx.beginPath();
            ctx.moveTo(cx - wBot / 2, yBot);
            ctx.lineTo(cx + wBot / 2, yBot);
            ctx.lineTo(cx + wTop / 2, yTop);
            ctx.lineTo(cx - wTop / 2, yTop);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            drawLabel(ctx, tier.name, cx, (yBot + yTop) / 2 + 4, filled || active ? '#fff' : '#94a3b8', 12, 'center', true);
            if (active) {
              // Glowing focus beacon arrow on left
              drawArrow(ctx, cx - wBot / 2 - 46, (yBot + yTop) / 2, cx - wBot / 2 - 12, (yBot + yTop) / 2, '#fde047', 3, 9);
            }
          });

          drawMonoNum(ctx, `当前主导动机: ${tiers[activeTier].name}`, cx, H * 0.1, '#fde047', 15, 'center');
          drawCompactSlider(ctx, W * 0.18, H * 0.82, W * 0.64, S.supply, '基础条件满足度（自下而上充盈）', `${Math.round(S.supply * 100)}%`, '#a78bfa', true);
          drawTinyHint(ctx, W, H, '向右拉动供给水位，看金色注意力箭头逐层攀升至塔尖自我实现', true);
        }
      },
      2: {
        init() {
          S = { crisis: false };
        },
        down(x, y, { W, H }) {
          if (hitBox(x, y, W * 0.34, H * 0.8, 200, 34)) S.crisis = !S.crisis;
        },
        tick({ ctx, W, H, hit }) {
          drawPaperBg(ctx, W, H, true);
          if (S.crisis) hit(2, 0, '底层危机爆发会令优势动机瞬间回落，但高阶理想亦可在逆境并存');
          else hit(2, 1, '马斯洛晚年强调：各层需求是波浪重叠而非死板台阶');

          // Overlapping wave bands rather than rigid steps
          const cols = ['#ef4444', '#f59e0b', '#10b981', '#38bdf8', '#a78bfa'];
          const gx = W * 0.12;
          const gw = W * 0.76;
          const by = H * 0.64;
          cols.forEach((col, k) => {
            ctx.strokeStyle = col;
            ctx.lineWidth = 3;
            ctx.beginPath();
            for (let i = 0; i <= 60; i++) {
              const u = i / 60;
              const center = S.crisis ? 0.15 + k * 0.08 : 0.15 + k * 0.18;
              const h = Math.exp(-Math.pow((u - center) / 0.18, 2)) * 130;
              const px = gx + u * gw;
              const py = by - h;
              if (i === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.stroke();
          });
          drawMonoNum(ctx, S.crisis ? '危机状态：底层波峰压倒性飙升' : '常态：五层需求呈交叠波浪并存', W * 0.5, H * 0.11, '#f8fafc', 14.5, 'center');
          drawToggleButton(ctx, W * 0.34, H * 0.8, 200, 34, S.crisis ? '恢复和平常态' : '触发底层生存危机 ⚡', S.crisis, '#ef4444', true);
          drawTinyHint(ctx, W, H, '切换常态与危机，观察五条彩色需求波峰如何重叠起伏', true);
        }
      }
    };
  }

  // =========================================================================
  // #122 艾宾浩斯 · 遗忘曲线 (Live Exponential Decay R = e^(-t/S) + Clickable Review Spikes)
  // =========================================================================
  if (modelId === 122) {
    let S: any = {};
    return {
      1: {
        init() {
          S = { reviews: [] as number[], t: 0 }; // review timestamps in [0.1..0.9]
        },
        down(x, y, { W, H }) {
          const gx = W * 0.14;
          const gw = W * 0.72;
          if (hitBox(x, y, W * 0.36, H * 0.8, 175, 34)) {
            S.reviews = [];
            return;
          }
          if (x > gx && x < gx + gw && y > H * 0.16 && y < H * 0.68) {
            const u = clamp((x - gx) / gw, 0.06, 0.94);
            S.reviews.push(u);
            S.reviews.sort((a: number, b: number) => a - b);
            if (S.reviews.length > 6) S.reviews.shift();
          }
        },
        tick({ ctx, W, H, dt, hit }) {
          S.t += dt;
          drawPaperBg(ctx, W, H, false);
          const gx = W * 0.14;
          const gy = H * 0.16;
          const gw = W * 0.72;
          const gh = H * 0.5;

          // Axes
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(gx, gy);
          ctx.lineTo(gx, gy + gh);
          ctx.lineTo(gx + gw, gy + gh);
          ctx.stroke();
          drawLabel(ctx, '记忆保持率 100%', gx - 8, gy + 10, '#334155', 11, 'right', true);
          drawLabel(ctx, '时间 (30天)', gx + gw, gy + gh + 18, '#334155', 11, 'right', true);

          // Baseline unreviewed curve (dashed gray)
          ctx.strokeStyle = 'rgba(148,163,184,0.65)';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 4]);
          ctx.beginPath();
          for (let i = 0; i <= 80; i++) {
            const u = i / 80;
            const r = Math.exp(-u / 0.18);
            const px = gx + u * gw;
            const py = gy + gh - r * gh;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();
          ctx.setLineDash([]);

          // Active curve with Review Spikes! Each review multiplies stability S by 2.1x!
          let stability = 0.18;
          let lastReview = 0;
          let finalRet = 0;
          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = 3.2;
          ctx.beginPath();
          let revPtr = 0;
          for (let i = 0; i <= 120; i++) {
            const u = i / 120;
            while (revPtr < S.reviews.length && u >= S.reviews[revPtr]) {
              lastReview = S.reviews[revPtr];
              stability *= 2.15;
              revPtr++;
              // Vertical jump back up to 100%!
              ctx.lineTo(gx + u * gw, gy);
            }
            const r = Math.exp(-(u - lastReview) / stability);
            if (i === 120) finalRet = r;
            const px = gx + u * gw;
            const py = gy + gh - r * gh;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();

          // Draw gold review pins
          S.reviews.forEach((ru: number) => {
            const rx = gx + ru * gw;
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(rx, gy, 7, 0, Math.PI * 2);
            ctx.fill();
          });

          if (S.reviews.length === 0 && S.t > 1) hit(1, 0, '遗忘遵循先快后慢规律：不复习在头几天内就会流失大半');
          if (S.reviews.length >= 2 && finalRet > 0.65) hit(1, 1, '间隔复习不断倍增记忆半衰期，把陡峭遗忘拉平为长期记忆！');

          drawMonoNum(ctx, `第30天留存率: ${Math.round(finalRet * 100)}%  (已安排 ${S.reviews.length} 次复习)`, W * 0.5, H * 0.1, finalRet > 0.6 ? '#059669' : '#dc2626', 14.5, 'center');
          drawToggleButton(ctx, W * 0.36, H * 0.8, 175, 34, '清空复习节点 ↺', false, '#64748b');
          drawTinyHint(ctx, W, H, '直接点击曲线图任意时间点插入「金色复习节点」，把 30 天记忆留存拉升至 70%+');
        }
      },
      2: {
        init() {
          S = { spaced: false };
        },
        down(x, y, { W, H }) {
          if (hitBox(x, y, W * 0.2, H * 0.8, 175, 34)) S.spaced = false;
          if (hitBox(x, y, W * 0.52, H * 0.8, 175, 34)) S.spaced = true;
        },
        tick({ ctx, W, H, hit }) {
          drawPaperBg(ctx, W, H, false);
          if (!S.spaced) hit(2, 0, '考前集中突击（填鸭式）虽短期得分，长期迅速遗忘');
          if (S.spaced) hit(2, 1, '同等总学习时长下，分散间隔提取效率远超集中刷题！');

          const slots = S.spaced ? [0.1, 0.28, 0.52, 0.78] : [0.08, 0.12, 0.16, 0.2];
          slots.forEach((u) => {
            ctx.fillStyle = S.spaced ? '#059669' : '#f59e0b';
            ctx.fillRect(W * 0.14 + u * W * 0.72, H * 0.54, 18, 44);
          });
          drawMonoNum(
            ctx,
            S.spaced ? '同等 4 小时间隔分散 → 30天后留存 82%' : '同等 4 小时集中突击 → 30天后留存 19%',
            W * 0.5,
            H * 0.24,
            S.spaced ? '#059669' : '#dc2626',
            15,
            'center'
          );
          drawToggleButton(ctx, W * 0.2, H * 0.8, 175, 34, '集中突击 (4小时连刷)', !S.spaced, '#d97706');
          drawToggleButton(ctx, W * 0.52, H * 0.8, 175, 34, '间隔分散 (1+1+1+1h)', S.spaced, '#059669');
          drawTinyHint(ctx, W, H, '切换同等总时长下的两种排期方式，对比长期记忆回报率');
        }
      }
    };
  }

  // =========================================================================
  // #123 巴德利 · 工作记忆模型 (Dual Audio/Visual Lanes + Central Executive CPU Gauge)
  // =========================================================================
  if (modelId === 123) {
    let S: any = {};
    return {
      1: {
        init() {
          S = { audioLoad: 2, visualLoad: 2, t: 0, overflowed: false, balanced: false };
        },
        down(x, y, { W, H }) {
          if (hitBox(x, y, W * 0.12, H * 0.8, 145, 34)) S.audioLoad = Math.min(5, S.audioLoad + 1);
          if (hitBox(x, y, W * 0.34, H * 0.8, 145, 34)) S.visualLoad = Math.min(5, S.visualLoad + 1);
          if (hitBox(x, y, W * 0.62, H * 0.8, 145, 34)) {
            S.audioLoad = 1;
            S.visualLoad = 1;
          }
        },
        tick({ ctx, W, H, dt, hit }) {
          S.t += dt;
          drawPaperBg(ctx, W, H, true);
          const audioOver = S.audioLoad > 3;
          const visualOver = S.visualLoad > 3;
          const totalOver = S.audioLoad + S.visualLoad > 6;
          if (audioOver || visualOver) {
            S.overflowed = true;
            hit(1, 0, '单通道超载溢出错漏！说明语音环与视空间画板各有容量上限');
          }
          if (S.audioLoad === 3 && S.visualLoad === 3) {
            S.balanced = true;
            hit(1, 1, '双通道并行分担（图文并茂），总工作记忆吞吐量显著提升！');
          }

          // Central Executive CPU at top
          const cpuLoad = clamp((S.audioLoad + S.visualLoad) / 7, 0, 1);
          ctx.fillStyle = '#1e293b';
          ctx.strokeStyle = totalOver ? '#ef4444' : '#38bdf8';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.roundRect(W * 0.35, H * 0.14, W * 0.3, 52, 10);
          ctx.fill();
          ctx.stroke();
          drawLabel(ctx, '中央执行系统 (注意力调度)', W * 0.5, H * 0.14 + 22, '#f8fafc', 11.5, 'center', true);
          drawMonoNum(ctx, `负载 ${Math.round(cpuLoad * 100)}%`, W * 0.5, H * 0.14 + 42, totalOver ? '#f87171' : '#34d399', 12, 'center');

          // Left Tube: Phonological Loop (Audio)
          const drawLane = (x: number, title: string, count: number, col: string) => {
            const over = count > 3;
            ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
            ctx.strokeStyle = over ? '#ef4444' : col;
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.roundRect(x, H * 0.32, W * 0.34, H * 0.36, 10);
            ctx.fill();
            ctx.stroke();
            drawLabel(ctx, title, x + W * 0.17, H * 0.32 + 22, col, 12, 'center', true);
            for (let i = 0; i < count; i++) {
              const bx = x + 28 + i * 44;
              const by = H * 0.52 + (i >= 3 ? Math.sin(S.t * 14) * 8 : 0);
              ctx.fillStyle = i >= 3 ? '#ef4444' : col;
              ctx.beginPath();
              ctx.roundRect(bx - 16, by - 16, 32, 32, 6);
              ctx.fill();
              drawMonoNum(ctx, `${i + 1}`, bx, by + 5, '#0f172a', 12, 'center');
            }
            if (over) drawLabel(ctx, '容量溢出丢失!', x + W * 0.17, H * 0.65, '#f87171', 11, 'center', true);
          };

          drawLane(W * 0.1, '语音回路 (听觉/默读)', S.audioLoad, '#38bdf8');
          drawLane(W * 0.56, '视空间画板 (图像/位置)', S.visualLoad, '#34d399');

          drawToggleButton(ctx, W * 0.12, H * 0.8, 145, 34, '+ 语音词块', false, '#0284c7', true);
          drawToggleButton(ctx, W * 0.34, H * 0.8, 145, 34, '+ 视觉图形', false, '#059669', true);
          drawToggleButton(ctx, W * 0.62, H * 0.8, 145, 34, '清空释放', false, '#64748b', true);
          drawTinyHint(ctx, W, H, '向语音与视觉双通道分别投喂词块，体验独立上限与双通道并行增容', true);
        }
      },
      2: {
        init() {
          S = { chunked: false };
        },
        down(x, y, { W, H }) {
          if (hitBox(x, y, W * 0.34, H * 0.8, 200, 34)) S.chunked = !S.chunked;
        },
        tick({ ctx, W, H, hit }) {
          drawPaperBg(ctx, W, H, true);
          if (!S.chunked) hit(2, 0, '12 个零散数字远超 4±1 组块上限，工作记忆瞬间崩溃');
          if (S.chunked) hit(2, 1, '「组块化」(Chunking) 借助长时记忆把 12 位压缩成 3 个意义组块！');

          const raw = '194920082026';
          if (!S.chunked) {
            for (let i = 0; i < 12; i++) {
              const bx = W * 0.1 + i * (W * 0.068);
              ctx.fillStyle = i < 4 ? '#38bdf8' : 'rgba(239,68,68,0.4)';
              ctx.beginPath();
              ctx.roundRect(bx, H * 0.42, 34, 42, 6);
              ctx.fill();
              drawMonoNum(ctx, raw[i], bx + 17, H * 0.42 + 26, '#fff', 15, 'center');
            }
            drawMonoNum(ctx, '占用 12 槽位 → 严重超载丢失！', W * 0.5, H * 0.24, '#f87171', 15, 'center');
          } else {
            ['1949', '2008', '2026'].forEach((chunk, i) => {
              const bx = W * 0.24 + i * (W * 0.22);
              ctx.fillStyle = '#10b981';
              ctx.beginPath();
              ctx.roundRect(bx, H * 0.4, 110, 48, 10);
              ctx.fill();
              drawMonoNum(ctx, chunk, bx + 55, H * 0.4 + 30, '#0f172a', 18, 'center');
            });
            drawMonoNum(ctx, '压缩为 3 个年份组块 → 轻松记住 100% ✓', W * 0.5, H * 0.24, '#34d399', 15, 'center');
          }

          drawToggleButton(ctx, W * 0.34, H * 0.8, 200, 34, S.chunked ? '打散为 12 位散码' : '启动意义组块化 (Chunking)', S.chunked, '#059669', true);
          drawTinyHint(ctx, W, H, '点击切换「散码」与「组块化」，直观感受记忆容量的魔法扩容', true);
        }
      }
    };
  }

  return null;
}
