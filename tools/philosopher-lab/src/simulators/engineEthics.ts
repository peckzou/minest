import {
  CanvasEnv,
  clamp,
  lerp,
  txt,
  drawRoundBox,
  drawCanvasSlider,
  hitSlider,
  drawBalanceBeam,
  drawPerson,
  drawHoldRing,
  drawFooterHint
} from './canvasHelpers';

export interface StageEngine {
  init: () => void;
  down?: (x: number, y: number, env: CanvasEnv) => void;
  move?: (x: number, y: number, dx: number, dy: number, env: CanvasEnv) => void;
  up?: (env: CanvasEnv) => void;
  tick: (env: CanvasEnv) => void;
}

export function createEthicsEngine(modelId: number): Record<number, StageEngine> {
  // ==================== #47 亚里士多德 · 德性中道 ====================
  if (modelId === 47) {
    let S: any = {};
    return {
      1: {
        init() {
          S = { v: 0.18, drag: false, sphere: 0, visitedLow: false, visitedHigh: false, holdMean: 0 };
        },
        down(x, y, { W, H }) {
          // Top sphere buttons on canvas
          for (let i = 0; i < 3; i++) {
            const bx = W * 0.32 + i * W * 0.18;
            if (Math.hypot(x - bx, y - H * 0.14) < 48) {
              S.sphere = i;
              S.switched = (S.switched || 0) + 1;
              return;
            }
          }
          if (Math.abs(y - H * 0.56) < 65) {
            S.drag = true;
            S.v = clamp((x - W * 0.14) / (W * 0.72), 0, 1);
          }
        },
        move(x, _y, _dx, _dy, { W }) {
          if (S.drag) {
            S.v = clamp((x - W * 0.14) / (W * 0.72), 0, 1);
          }
        },
        up() {
          S.drag = false;
        },
        tick({ ctx, W, H, dt, hit, toast }) {
          ctx.fillStyle = '#f4efe6';
          ctx.fillRect(0, 0, W, H);
          const spheres = [
            { name: '恐惧与信心', low: '怯懦（不足）', mid: '勇敢（中道）', high: '鲁莽（过度）' },
            { name: '肉体快乐', low: '麻木（不足）', mid: '节制（中道）', high: '放纵（过度）' },
            { name: '钱财施予', low: '吝啬（不足）', mid: '慷慨（中道）', high: '挥霍（过度）' }
          ];
          spheres.forEach((sp, i) => {
            const bx = W * 0.32 + i * W * 0.18;
            drawRoundBox(ctx, bx - 54, H * 0.1 - 16, 108, 32, 16, S.sphere === i ? '#f3a52b' : '#dfe6ed', '#33475b', 1.5);
            txt(ctx, sp.name, bx, H * 0.1 + 5, '#1f2b38', 12.5, 'center', S.sphere === i);
          });

          const cur = spheres[S.sphere];
          const x0 = W * 0.14;
          const bw = W * 0.72;
          const by = H * 0.56;

          // Track zones
          ctx.fillStyle = '#d6e4f0';
          ctx.fillRect(x0, by - 14, bw * 0.36, 28);
          ctx.fillStyle = '#c8ebd4';
          ctx.fillRect(x0 + bw * 0.36, by - 14, bw * 0.28, 28);
          ctx.fillStyle = '#f5d5c6';
          ctx.fillRect(x0 + bw * 0.64, by - 14, bw * 0.36, 28);
          ctx.strokeStyle = '#6c7a89';
          ctx.strokeRect(x0, by - 14, bw, 28);

          txt(ctx, cur.low, x0 + bw * 0.18, by - 24, '#2980b9', 13, 'center', true);
          txt(ctx, '★ ' + cur.mid, x0 + bw * 0.5, by - 24, '#27ae60', 14, 'center', true);
          txt(ctx, cur.high, x0 + bw * 0.82, by - 24, '#d35400', 13, 'center', true);

          const px = x0 + bw * S.v;
          const inMean = S.v >= 0.38 && S.v <= 0.62;
          drawPerson(ctx, px, by - 46, inMean ? '#27ae60' : S.v < 0.38 ? '#2980b9' : '#d35400', `${Math.round(S.v * 100)}%`, 1.25);

          // Draggable handle
          ctx.fillStyle = inMean ? '#27ae60' : '#1f2b38';
          ctx.beginPath();
          ctx.arc(px, by, 15, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 3;
          ctx.stroke();

          if (S.v < 0.25) S.visitedLow = true;
          if (S.v > 0.75) S.visitedHigh = true;
          if (S.visitedLow || S.visitedHigh) {
            hit(1, 0);
          }
          if (inMean) {
            S.holdMean += dt;
            drawHoldRing(ctx, px, by, 22, S.holdMean / 0.8, '#27ae60');
            if (S.holdMean > 0.8) {
              hit(1, 1);
              if (S.switched >= 1) hit(1, 2, '在不同伦理领域中，德性皆是过与不及之间的中道');
            }
          } else {
            S.holdMean = 0;
          }
          drawFooterHint(ctx, W, H, '直接左右拖动轨道上的小人体会“不足、中道与过度”；点击上方三个胶囊切换领域');
        }
      },
      2: {
        init() {
          S = { food: 6, drag: false, who: 'milo', mOk: false, nOk: false };
        },
        down(x, y, { W, H }) {
          if (x < W * 0.45 && y < H * 0.65) {
            S.who = 'milo';
          } else if (x > W * 0.55 && y < H * 0.65) {
            S.who = 'novice';
          }
          const v = hitSlider(x, y, W * 0.18, H * 0.78, W * 0.64);
          if (v !== null) {
            S.drag = true;
            S.food = Math.round((2 + v * 8) * 2) / 2;
          }
        },
        move(x, y, _dx, _dy, { W, H }) {
          if (S.drag) {
            const v = clamp((x - W * 0.18) / (W * 0.64), 0, 1);
            S.food = Math.round((2 + v * 8) * 2) / 2;
          }
        },
        up() {
          S.drag = false;
        },
        tick({ ctx, W, H, hit }) {
          ctx.fillStyle = '#f4efe6';
          ctx.fillRect(0, 0, W, H);

          // Left: Wrestler Milo; Right: Novice
          const mx = W * 0.3;
          const nx = W * 0.7;
          const cy = H * 0.4;

          drawRoundBox(ctx, mx - 120, cy - 85, 240, 165, 14, S.who === 'milo' ? '#fff8e6' : '#eae6dc', S.who === 'milo' ? '#f3a52b' : '#bbb', 2.5);
          drawPerson(ctx, mx, cy - 15, '#a0522d', '摔跤冠军米隆 (Milo)', 1.6);
          const miloStatus = S.food < 7.5 ? '▼ 太少（饥饿乏力）' : S.food > 9.5 ? '▲ 太多（撑胀）' : '✓ 恰到好处（相对中道 ≈ 8.5 明那）';
          txt(ctx, miloStatus, mx, cy + 56, S.food >= 7.5 && S.food <= 9.5 ? '#27ae60' : '#c0392b', 12.5, 'center', true);

          drawRoundBox(ctx, nx - 120, cy - 85, 240, 165, 14, S.who === 'novice' ? '#fff8e6' : '#eae6dc', S.who === 'novice' ? '#f3a52b' : '#bbb', 2.5);
          drawPerson(ctx, nx, cy - 15, '#3a6f99', '体操初学者 (Novice)', 1.05);
          const novStatus = S.food < 2.8 ? '▼ 太少（营养不足）' : S.food > 4.5 ? '▲ 太多（负荷过重！）' : '✓ 恰到好处（相对中道 ≈ 3.5 明那）';
          txt(ctx, novStatus, nx, cy + 56, S.food >= 2.8 && S.food <= 4.5 ? '#27ae60' : '#c0392b', 12.5, 'center', true);

          if (Math.abs(S.food - 6) < 0.3) hit(2, 0);
          if (S.food >= 8 && S.food <= 9) S.mOk = true;
          if (S.food >= 3 && S.food <= 4) S.nOk = true;
          if (S.mOk && S.nOk) hit(2, 1);

          drawCanvasSlider(
            ctx,
            W * 0.18,
            H * 0.78,
            W * 0.64,
            (S.food - 2) / 8,
            `当前每日口粮配给：${S.food.toFixed(1)} 明那（算术正中间 6 明那对两人都不合适！）`,
            '2 明那（太少）',
            '10 明那（太多）',
            '#3a6f99'
          );
          drawFooterHint(ctx, W, H, '拖动口粮滑杆：先看算术中点 6 明那，再分别为米隆（~8.5）和初学者（~3.5）调出相对于各自的中道');
        }
      },
      3: {
        init() {
          S = { naturalBend: -42, pull: 0, drag: false, straightT: 0 };
        },
        down(x, y, { W, H }) {
          if (Math.hypot(x - (W / 2 + S.naturalBend + S.pull), y - H * 0.3) < 75 || y < H * 0.75) {
            S.drag = true;
            S.x0 = x;
          }
        },
        move(x, _y, dx) {
          if (S.drag) {
            S.pull = clamp(S.pull + dx * 0.45, -75, 75);
          }
        },
        up() {
          S.drag = false;
        },
        tick({ ctx, W, H, dt, hit }) {
          ctx.fillStyle = '#f4efe6';
          ctx.fillRect(0, 0, W, H);
          const cx = W / 2;
          const net = S.naturalBend + S.pull;

          if (!S.drag && Math.abs(net) > 6) {
            // Slight spring back if not held straight long enough
            S.pull = lerp(S.pull, 0, dt * 0.4);
          }

          if (Math.abs(S.pull) < 10) hit(3, 0);

          // Center plumb line
          ctx.strokeStyle = '#27ae60';
          ctx.setLineDash([6, 4]);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(cx, H * 0.14);
          ctx.lineTo(cx, H * 0.8);
          ctx.stroke();
          ctx.setLineDash([]);
          txt(ctx, '中道准绳', cx, H * 0.11, '#27ae60', 12.5, 'center', true);

          // Bent wood beam
          const topX = cx + net * 1.8;
          const midX = cx + net * 2.5;
          ctx.strokeStyle = Math.abs(net) < 7 ? '#27ae60' : '#8b5a2b';
          ctx.lineWidth = 14;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(cx, H * 0.78);
          ctx.quadraticCurveTo(midX, H * 0.46, topX, H * 0.22);
          ctx.stroke();

          // Drag handle on wood tip
          ctx.fillStyle = '#f3a52b';
          ctx.beginPath();
          ctx.arc(topX, H * 0.22, 18, 0, Math.PI * 2);
          ctx.fill();
          txt(ctx, '⇄ 拉拽', topX, H * 0.22 + 4, '#111', 11, 'center', true);

          if (Math.abs(net) < 8) {
            S.straightT += dt;
            drawHoldRing(ctx, topX, H * 0.22, 25, S.straightT / 1.0, '#27ae60');
            if (S.straightT >= 1.0) hit(3, 1, '矫枉过正：向天性偏斜的反方向用力，使弯曲的木料归于中正！');
          } else {
            S.straightT = 0;
          }

          drawFooterHint(ctx, W, H, '这根木料天生偏向左侧（享乐/退缩）：按住木料顶端橙色把手向右反方向拉拽并稳住 1 秒以矫正它');
        }
      },
      4: {
        init() {
          S = {
            cards: [
              { id: 'courage', t: '勇敢', z: 1, x: 0.2, y: 0.22, done: false },
              { id: 'rash', t: '鲁莽', z: 2, x: 0.4, y: 0.22, done: false },
              { id: 'coward', t: '怯懦', z: 0, x: 0.6, y: 0.22, done: false },
              { id: 'murder', t: '嫉妒 / 偷盗 / 谋杀', z: 3, x: 0.8, y: 0.22, done: false }
            ],
            drag: null
          };
        },
        down(x, y, { W, H }) {
          for (const c of S.cards) {
            if (!c.done && Math.hypot(x - W * c.x, y - H * c.y) < 48) {
              S.drag = c;
              return;
            }
          }
        },
        move(x, y, _dx, _dy, { W, H }) {
          if (S.drag) {
            S.drag.x = clamp(x / W, 0.06, 0.94);
            S.drag.y = clamp(y / H, 0.08, 0.88);
          }
        },
        up({ W, H, hit, toast }) {
          if (!S.drag) return;
          const c = S.drag;
          S.drag = null;
          if (c.y > 0.52) {
            const idx = clamp(Math.floor(c.x * 4), 0, 3);
            if (idx === c.z) {
              c.done = true;
              c.x = 0.125 + idx * 0.25;
              c.y = 0.72;
              if (c.id === 'murder') hit(4, 0, '嫉妒、偷盗、谋杀本身即恶，不存在“适度的谋杀”！');
              if (S.cards.every((k: any) => k.done)) hit(4, 1, '全部归类正确！');
            } else {
              toast('位置不对：再想想它属于不足、中道、过度，还是本身即恶（无中道）？');
              c.y = 0.22;
            }
          }
        },
        tick({ ctx, W, H }) {
          ctx.fillStyle = '#f4efe6';
          ctx.fillRect(0, 0, W, H);
          const zones = [
            { t: '不足之恶 (Defect)', c: '#2980b9' },
            { t: '中道之德 (Mean)', c: '#27ae60' },
            { t: '过度之恶 (Excess)', c: '#d35400' },
            { t: '无中道（本身即恶）', c: '#c0392b' }
          ];
          zones.forEach((z, i) => {
            const zx = W * (0.02 + i * 0.245);
            drawRoundBox(ctx, zx, H * 0.55, W * 0.23, H * 0.3, 12, '#fffdf8', z.c, 2);
            txt(ctx, z.t, zx + W * 0.115, H * 0.62, z.c, 13, 'center', true);
          });
          S.cards.forEach((c: any) => {
            const cx = W * c.x;
            const cy = H * c.y;
            drawRoundBox(ctx, cx - 64, cy - 20, 128, 40, 10, c.done ? '#e8f8f5' : '#fff', c.done ? '#27ae60' : '#33475b', 2);
            txt(ctx, (c.done ? '✓ ' : '') + c.t, cx, cy + 5, '#1f2b38', 13, 'center', true);
          });
          drawFooterHint(ctx, W, H, '直接用鼠标/手指将上方四张词卡拖入下方对应的四个哲学范畴框中');
        }
      }
    };
  }

  // ==================== #48 伊壁鸠鲁 · 快乐分类 ====================
  if (modelId === 48) {
    let S: any = {};
    return {
      1: {
        init() {
          S = {
            items: [
              { id: 'water', t: '口渴时的清水与粗面包', z: 0, x: 0.18, y: 0.22, done: false },
              { id: 'friend', t: '哲学友谊与心灵安全', z: 0, x: 0.4, y: 0.22, done: false },
              { id: 'feast', t: '昂贵奢华的进口美酒豪宴', z: 1, x: 0.62, y: 0.22, done: false },
              { id: 'crown', t: '权位桂冠与万人雕像喝彩', z: 2, x: 0.84, y: 0.22, done: false }
            ],
            drag: null
          };
        },
        down(x, y, { W, H }) {
          for (const it of S.items) {
            if (!it.done && Math.hypot(x - W * it.x, y - H * it.y) < 55) {
              S.drag = it;
              return;
            }
          }
        },
        move(x, y, _dx, _dy, { W, H }) {
          if (S.drag) {
            S.drag.x = clamp(x / W, 0.06, 0.94);
            S.drag.y = clamp(y / H, 0.08, 0.88);
          }
        },
        up({ hit, toast }) {
          if (!S.drag) return;
          const it = S.drag;
          S.drag = null;
          if (it.y > 0.5) {
            const idx = clamp(Math.floor(it.x * 3), 0, 2);
            if (idx === it.z) {
              it.done = true;
              it.x = 0.16 + idx * 0.33;
              it.y = 0.7 + (it.id === 'friend' ? 0.09 : 0);
              if (idx === 0) hit(1, 0);
              if (idx === 2) hit(1, 1);
              if (S.items.every((k: any) => k.done)) hit(1, 2, '自然财富有限且易得，空洞欲望却坠入无底深渊！');
            } else {
              toast('再想想：这项欲望对于消除痛苦、达到灵魂安宁是必要的，还是空洞虚妄的？');
              it.y = 0.22;
            }
          }
        },
        tick({ ctx, W, H }) {
          ctx.fillStyle = '#f4efe6';
          ctx.fillRect(0, 0, W, H);
          const bins = [
            { t: '① 自然且必要的欲望', sub: '消除饥渴与恐惧 · 极易自足', c: '#27ae60' },
            { t: '② 自然但不必要的欲望', sub: '仅变换享乐花样 · 可适度舍弃', c: '#e67e22' },
            { t: '③ 既不自然也不必要的欲望', sub: '源于虚妄意见 · 永无止境', c: '#c0392b' }
          ];
          bins.forEach((b, i) => {
            const bx = W * (0.03 + i * 0.32);
            drawRoundBox(ctx, bx, H * 0.52, W * 0.3, H * 0.34, 12, '#fffdf7', b.c, 2);
            txt(ctx, b.t, bx + W * 0.15, H * 0.59, b.c, 13.5, 'center', true);
            txt(ctx, b.sub, bx + W * 0.15, H * 0.65, '#667', 11.5, 'center');
          });
          S.items.forEach((it: any) => {
            const ix = W * it.x;
            const iy = H * it.y;
            drawRoundBox(ctx, ix - 82, iy - 19, 164, 38, 10, it.done ? '#e8f8f5' : '#fff', it.done ? '#27ae60' : '#3a6f99', 2);
            txt(ctx, (it.done ? '✓ ' : '') + it.t, ix, iy + 5, '#1f2b38', 12, 'center', true);
          });
          drawFooterHint(ctx, W, H, '直接将上方 4 个欲望气泡拖入伊壁鸠鲁的三个欲望筛篮中');
        }
      },
      2: {
        init() {
          S = { water: 0.35, luxury: 0.55, holdWater: false, holdLux: false };
        },
        down(x, y, { W, H }) {
          if (x < W * 0.38 && y < H * 0.78) S.holdWater = true;
          else if (x > W * 0.62 && y < H * 0.78) S.holdLux = true;
        },
        up() {
          S.holdWater = false;
          S.holdLux = false;
        },
        tick({ ctx, W, H, T, dt, hit }) {
          ctx.fillStyle = '#f4efe6';
          ctx.fillRect(0, 0, W, H);
          if (S.holdWater) {
            S.water = clamp(S.water + dt * 0.45, 0, 1);
            S.luxury = clamp(S.luxury - dt * 0.4, 0, 1);
          }
          if (S.holdLux) {
            S.luxury = clamp(S.luxury + dt * 0.45, 0, 1);
          }

          if (S.water > 0.92 && S.luxury < 0.15) hit(2, 0);
          if (S.water > 0.85 && S.luxury > 0.75) hit(2, 1);

          // Left & right hold pitchers
          drawRoundBox(ctx, W * 0.08, H * 0.25, W * 0.22, H * 0.36, 12, S.holdWater ? '#d4efdf' : '#fff', '#27ae60', 2);
          txt(ctx, '💧 按住注入：清水与简食', W * 0.19, H * 0.4, '#27ae60', 13, 'center', true);
          txt(ctx, `饥渴消除度：${Math.round(S.water * 100)}%`, W * 0.19, H * 0.49, '#1f2b38', 12);

          drawRoundBox(ctx, W * 0.7, H * 0.25, W * 0.22, H * 0.36, 12, S.holdLux ? '#fadbd8' : '#fff', '#c0392b', 2);
          txt(ctx, '🍷 按住狂灌：奢华盛宴与虚名', W * 0.81, H * 0.4, '#c0392b', 13, 'center', true);
          txt(ctx, `奢华刺激度：${Math.round(S.luxury * 100)}%`, W * 0.81, H * 0.49, '#1f2b38', 12);

          // Center Vessel of Soul (Ataraxia)
          const vx = W * 0.38;
          const vw = W * 0.24;
          const vy = H * 0.18;
          const vh = H * 0.56;
          ctx.strokeStyle = '#33475b';
          ctx.lineWidth = 3;
          ctx.strokeRect(vx, vy, vw, vh);

          const fillH = vh * S.water;
          const wave = (1 - S.water) * 10 + S.luxury * 22;
          ctx.fillStyle = S.luxury > 0.5 ? 'rgba(230, 126, 34, 0.55)' : 'rgba(47, 163, 90, 0.55)';
          ctx.beginPath();
          ctx.moveTo(vx, vy + vh);
          for (let x = vx; x <= vx + vw; x += 8) {
            const wy = vy + vh - fillH + Math.sin(x * 0.08 + T * 5) * wave;
            ctx.lineTo(x, clamp(wy, vy, vy + vh));
          }
          ctx.lineTo(vx + vw, vy + vh);
          ctx.closePath();
          ctx.fill();

          txt(
            ctx,
            wave < 4 ? '★ 静态快乐顶点：身体无痛苦 · 灵魂无纷扰 (Ataraxia)' : `灵魂水面纷扰波浪：${Math.round(wave * 3)}%`,
            W / 2,
            H * 0.84,
            wave < 4 ? '#27ae60' : '#c0392b',
            14,
            'center',
            true
          );
          drawFooterHint(ctx, W, H, '按住左侧注入清水简食直达“无痛苦顶点（快乐上限）”；再按住右侧狂灌奢华盛宴，看快乐是否还能增加');
        }
      },
      3: {
        init() {
          S = {
            choices: [
              { id: 'binge', n: '通宵狂饮豪宴', now: +35, later: -80, x: 0.2, y: 0.24 },
              { id: 'surgery', n: '接受苦药/手术', now: -25, later: +85, x: 0.5, y: 0.24 },
              { id: 'garden', n: '花园与友清谈哲思', now: +40, later: +55, x: 0.8, y: 0.24 }
            ],
            cur: null,
            drag: null,
            ang: 0,
            va: 0,
            seenBinge: false,
            seenSurg: false
          };
        },
        down(x, y, { W, H }) {
          for (const c of S.choices) {
            if (Math.hypot(x - W * c.x, y - H * c.y) < 55) {
              S.drag = c;
              return;
            }
          }
        },
        move(x, y, _dx, _dy, { W, H }) {
          if (S.drag) {
            S.drag.x = clamp(x / W, 0.08, 0.92);
            S.drag.y = clamp(y / H, 0.1, 0.85);
          }
        },
        up({ hit }) {
          if (!S.drag) return;
          const c = S.drag;
          S.drag = null;
          if (c.y > 0.36) {
            S.cur = c;
            if (c.id === 'binge') S.seenBinge = true;
            if (c.id === 'surgery') S.seenSurg = true;
            if (S.seenBinge && S.seenSurg) hit(3, 0);
            if (c.id === 'garden') hit(3, 1);
          }
        },
        tick({ ctx, W, H, dt }) {
          ctx.fillStyle = '#f4efe6';
          ctx.fillRect(0, 0, W, H);
          const net = S.cur ? S.cur.now + S.cur.later : 0;
          const tgt = clamp(-net * 0.004, -0.38, 0.38);
          S.va += (tgt - S.ang) * dt * 6;
          S.va *= 0.9;
          S.ang += S.va * dt * 4;

          const pans = drawBalanceBeam(ctx, W * 0.5, H * 0.52, H, W * 0.42, S.ang);
          txt(ctx, '长期总快乐', pans[0].x, pans[0].y + 28, '#27ae60', 13, 'center', true);
          txt(ctx, '长期总痛苦', pans[1].x, pans[1].y + 28, '#c0392b', 13, 'center', true);

          S.choices.forEach((c: any) => {
            const cx = W * c.x;
            const cy = H * c.y;
            drawRoundBox(ctx, cx - 74, cy - 22, 148, 44, 10, S.cur === c ? '#fff8e6' : '#fff', S.cur === c ? '#f3a52b' : '#3a6f99', 2);
            txt(ctx, c.n, cx, cy - 2, '#1f2b38', 13, 'center', true);
            txt(ctx, `当下 ${c.now > 0 ? '+' : ''}${c.now} / 后续 ${c.later > 0 ? '+' : ''}${c.later}`, cx, cy + 15, '#667', 11);
          });

          if (S.cur) {
            txt(
              ctx,
              `审慎权衡「${S.cur.n}」净值：${net > 0 ? '+' + net + '（值得选择）' : net + '（带来更大痛苦，应当舍弃）'}`,
              W / 2,
              H * 0.85,
              net > 0 ? '#27ae60' : '#c0392b',
              14,
              'center',
              true
            );
          }
          drawFooterHint(ctx, W, H, '将上方三种生活抉择卡片拖到中央审慎天平上，比较短期快感与长远苦乐净值');
        }
      }
    };
  }

  // ==================== #49 斯多葛 · 控制二分法 ====================
  if (modelId === 49) {
    let S: any = {};
    return {
      1: {
        init() {
          S = {
            orbs: [
              { id: 'j', t: '我的判断与信念', inside: true, x: 0.16, y: 0.25, done: false },
              { id: 'd', t: '我的意欲与品格行动', inside: true, x: 0.16, y: 0.55, done: false },
              { id: 'w', t: '财富、官职与他人的赞誉', inside: false, x: 0.84, y: 0.25, done: false },
              { id: 's', t: '先天体质、风暴与生死', inside: false, x: 0.84, y: 0.55, done: false }
            ],
            drag: null
          };
        },
        down(x, y, { W, H }) {
          for (const o of S.orbs) {
            if (!o.done && Math.hypot(x - W * o.x, y - H * o.y) < 55) {
              S.drag = o;
              return;
            }
          }
        },
        move(x, y, _dx, _dy, { W, H }) {
          if (S.drag) {
            S.drag.x = clamp(x / W, 0.06, 0.94);
            S.drag.y = clamp(y / H, 0.08, 0.88);
          }
        },
        up({ W, H, hit, toast }) {
          if (!S.drag) return;
          const o = S.drag;
          S.drag = null;
          const dist = Math.hypot(W * o.x - W * 0.5, H * o.y - H * 0.46);
          const putInside = dist < 88;
          if (putInside === o.inside) {
            o.done = true;
            if (o.inside) hit(1, 0);
            else hit(1, 1);
            if (S.orbs.every((k: any) => k.done)) hit(1, 2, '只把属于你的当作自己的，便无人能强迫或阻碍你！');
          } else {
            toast(
              o.inside
                ? '这是你自己的心灵行动，完全取决于你——请把它拖进中央绿色内圈！'
                : '把外在际遇放进内心城堡只会招致焦虑与奴役——请把它放到蓝色外圈！'
            );
          }
        },
        tick({ ctx, W, H }) {
          ctx.fillStyle = '#eef3f7';
          ctx.fillRect(0, 0, W, H);
          const cx = W / 2;
          const cy = H * 0.46;

          // Outer ring
          ctx.fillStyle = 'rgba(58, 111, 153, 0.1)';
          ctx.strokeStyle = '#3a6f99';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 4]);
          ctx.beginPath();
          ctx.arc(cx, cy, 165, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.setLineDash([]);
          txt(ctx, '外圈：不取决于我们的事 (Not Up to Us)', cx, cy - 138, '#3a6f99', 13, 'center', true);

          // Inner citadel
          ctx.fillStyle = 'rgba(39, 174, 96, 0.18)';
          ctx.strokeStyle = '#27ae60';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(cx, cy, 85, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          txt(ctx, '内圈：取决于我们', cx, cy - 8, '#1e8449', 13.5, 'center', true);
          txt(ctx, '(Up to Us)', cx, cy + 12, '#1e8449', 12);

          S.orbs.forEach((o: any) => {
            const ox = W * o.x;
            const oy = H * o.y;
            drawRoundBox(ctx, ox - 74, oy - 18, 148, 36, 18, o.done ? '#e8f8f5' : '#fff', o.done ? '#27ae60' : '#33475b', 2);
            txt(ctx, (o.done ? '✓ ' : '') + o.t, ox, oy + 5, '#1f2b38', 12, 'center', true);
          });
          drawFooterHint(ctx, W, H, '直接拖动两侧的事件球：可控的拖入中央绿色内圈，不可控的外物放入蓝色外圈环带');
        }
      },
      2: {
        init() {
          S = { shieldAng: 0, drag: false, arrows: [], deflected: 0, hitMind: 0 };
        },
        down(x, y, { W, H }) {
          S.drag = true;
          S.shieldAng = Math.atan2(y - H * 0.48, x - W * 0.5);
        },
        move(x, y, _dx, _dy, { W, H }) {
          if (S.drag) {
            S.shieldAng = Math.atan2(y - H * 0.48, x - W * 0.5);
          }
        },
        up() {
          S.drag = false;
        },
        tick({ ctx, W, H, dt, hit }) {
          ctx.fillStyle = '#eef3f7';
          ctx.fillRect(0, 0, W, H);
          const cx = W / 2;
          const cy = H * 0.48;

          if (Math.random() < dt * 1.4 && S.arrows.length < 4) {
            const a = Math.random() * Math.PI * 2;
            const labels = ['当众羞辱', '商船沉没', '恶疾降临', '流放罢官'];
            S.arrows.push({
              a,
              r: 220,
              t: labels[Math.floor(Math.random() * labels.length)]
            });
          }

          // Mind core
          ctx.fillStyle = S.hitMind > 0 ? '#fadbd8' : '#d4efdf';
          ctx.strokeStyle = '#2c3e50';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(cx, cy, 42, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          txt(ctx, '理性心灵', cx, cy + 4, '#1f2b38', 13, 'center', true);

          // Stoic Judgment Shield arc
          ctx.strokeStyle = '#f3a52b';
          ctx.lineWidth = 8;
          ctx.beginPath();
          ctx.arc(cx, cy, 72, S.shieldAng - 0.9, S.shieldAng + 0.9);
          ctx.stroke();

          S.arrows.forEach((ar: any) => {
            ar.r -= dt * 95;
            const ax = cx + Math.cos(ar.a) * ar.r;
            const ay = cy + Math.sin(ar.a) * ar.r;
            ctx.fillStyle = '#c0392b';
            ctx.beginPath();
            ctx.arc(ax, ay, 8, 0, Math.PI * 2);
            ctx.fill();
            txt(ctx, ar.t, ax, ay - 12, '#c0392b', 11.5, 'center', true);

            if (ar.r <= 74 && ar.r >= 62 && !ar.done) {
              const diff = Math.atan2(Math.sin(ar.a - S.shieldAng), Math.cos(ar.a - S.shieldAng));
              if (Math.abs(diff) < 1.0) {
                ar.done = true;
                ar.r = -10;
                S.deflected++;
                if (S.deflected >= 3) hit(2, 1, '“你只是一个外在印象，绝不是你表面装作的灾难！”');
              }
            } else if (ar.r < 42 && !ar.done) {
              ar.done = true;
              ar.r = -10;
              S.hitMind++;
              hit(2, 0);
            }
          });
          S.arrows = S.arrows.filter((ar: any) => ar.r > 0);
          txt(ctx, `已用理性判断化解严酷印象：${S.deflected} 次`, cx, H * 0.85, '#27ae60', 13.5, 'center', true);
          drawFooterHint(ctx, W, H, '按住画布旋转橙色“理性判断护盾”，拦截四面袭来的严酷外物印象');
        }
      },
      3: {
        init() {
          S = { pull: 0, pulling: false, arrow: null, wind: 25, shots: 0, windyShot: false, calmShot: false };
        },
        down(x, _y, { W }) {
          if (x < W * 0.4) {
            S.pulling = true;
          }
        },
        move(x, _y, _dx, _dy, { W }) {
          if (S.pulling) {
            S.pull = clamp((W * 0.25 - x) / 110, 0.1, 1);
          }
        },
        up({ W, H }) {
          if (S.pulling && S.pull > 0.2) {
            S.wind = (Math.random() - 0.3) * 70;
            S.arrow = { x: W * 0.22, y: H * 0.5, vx: 380 * S.pull, vy: 0 };
            S.shots++;
          }
          S.pulling = false;
          S.pull = 0;
        },
        tick({ ctx, W, H, dt, hit }) {
          ctx.fillStyle = '#eef3f7';
          ctx.fillRect(0, 0, W, H);
          const bx = W * 0.22;
          const by = H * 0.5;
          const tx = W * 0.82;
          const ty = H * 0.5;

          // Bow
          ctx.strokeStyle = '#8b5a2b';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(bx - 10, by, 55, -1.1, 1.1);
          ctx.stroke();

          // Bowstring
          ctx.strokeStyle = '#333';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(bx - 10 + Math.cos(-1.1) * 55, by + Math.sin(-1.1) * 55);
          ctx.lineTo(bx - S.pull * 55, by);
          ctx.lineTo(bx - 10 + Math.cos(1.1) * 55, by + Math.sin(1.1) * 55);
          ctx.stroke();

          // Target
          [42, 28, 14].forEach((r, i) => {
            ctx.fillStyle = ['#3a6f99', '#fff', '#e74c3c'][i];
            ctx.beginPath();
            ctx.arc(tx, ty, r, 0, Math.PI * 2);
            ctx.fill();
          });

          if (S.arrow) {
            S.arrow.x += S.arrow.vx * dt;
            S.arrow.vy += S.wind * dt * 1.6;
            S.arrow.y += S.arrow.vy * dt;
            ctx.strokeStyle = '#1f2b38';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(S.arrow.x - 24, S.arrow.y);
            ctx.lineTo(S.arrow.x, S.arrow.y);
            ctx.stroke();

            if (S.arrow.x >= tx) {
              S.arrow.vx = 0;
              hit(3, 0);
              if (Math.abs(S.wind) > 20) S.windyShot = true;
              else S.calmShot = true;
              if (S.shots >= 2) hit(3, 1, '弓箭手的德性在于尽全力拉弓瞄准；射出后的横风属于外在命运');
            }
          }

          txt(
            ctx,
            S.pulling
              ? `正在全力拉弓瞄准（可控努力）：${Math.round(S.pull * 100)}% —— 松手射出`
              : `随机横风干扰（不可控命运）：${S.wind.toFixed(0)} m/s · 已射出 ${S.shots} 箭`,
            W / 2,
            H * 0.84,
            '#1f2b38',
            13.5,
            'center',
            true
          );
          drawFooterHint(ctx, W, H, '按住左侧弓弦向后拉满瞄准（可控），松手射出箭矢，体验“尽人事而坦然接受横风结果”');
        }
      }
    };
  }

  // ==================== #50 霍布斯 · 社会契约 ====================
  if (modelId === 50) {
    let S: any = {};
    return {
      1: {
        init() {
          S = {
            comp: 0.65,
            diff: 0.7,
            dragIdx: -1,
            agents: Array.from({ length: 10 }, (_, i) => ({
              x: 0.2 + (i % 5) * 0.15,
              y: 0.28 + Math.floor(i / 5) * 0.25,
              vx: (Math.random() - 0.5) * 0.2,
              vy: (Math.random() - 0.5) * 0.2
            }))
          };
        },
        down(x, y, { W, H }) {
          const v1 = hitSlider(x, y, W * 0.12, H * 0.82, W * 0.34);
          if (v1 !== null) {
            S.dragIdx = 1;
            S.comp = v1;
            return;
          }
          const v2 = hitSlider(x, y, W * 0.54, H * 0.82, W * 0.34);
          if (v2 !== null) {
            S.dragIdx = 2;
            S.diff = v2;
          }
        },
        move(x, _y, _dx, _dy, { W }) {
          if (S.dragIdx === 1) S.comp = clamp((x - W * 0.12) / (W * 0.34), 0, 1);
          if (S.dragIdx === 2) S.diff = clamp((x - W * 0.54) / (W * 0.34), 0, 1);
        },
        up() {
          S.dragIdx = -1;
        },
        tick({ ctx, W, H, dt, hit }) {
          ctx.fillStyle = '#f4efe6';
          ctx.fillRect(0, 0, W, H);
          const speed = 0.2 + (S.comp + S.diff) * 0.9;
          if (S.comp + S.diff > 1.2) hit(1, 0);
          if (S.diff > 0.82) hit(1, 1);

          S.agents.forEach((a: any, i: number) => {
            a.x += a.vx * speed * dt;
            a.y += a.vy * speed * dt;
            if (a.x < 0.12 || a.x > 0.88) a.vx *= -1;
            if (a.y < 0.18 || a.y > 0.65) a.vy *= -1;
            drawPerson(ctx, W * a.x, H * a.y, S.diff > 0.6 ? '#c0392b' : '#3a6f99', `人${i + 1}`);
            S.agents.forEach((b: any, j: number) => {
              if (i < j && Math.hypot(W * (a.x - b.x), H * (a.y - b.y)) < 85 && S.comp + S.diff > 0.8) {
                ctx.strokeStyle = 'rgba(192, 57, 43, 0.7)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(W * a.x, H * a.y);
                ctx.lineTo(W * b.x, H * b.y);
                ctx.stroke();
              }
            });
          });

          drawCanvasSlider(ctx, W * 0.12, H * 0.82, W * 0.34, S.comp, `竞争与稀缺：${Math.round(S.comp * 100)}%`, '充裕', '匮乏争夺', '#e67e22');
          drawCanvasSlider(ctx, W * 0.54, H * 0.82, W * 0.34, S.diff, `彼此猜疑与先发制人：${Math.round(S.diff * 100)}%`, '信任', '恐惧猜忌', '#c0392b');
          drawFooterHint(ctx, W, H, '直接拖动底部两根滑杆：观察能力平等的人如何因资源竞争与彼此猜疑而先发制人');
        }
      },
      2: {
        init() {
          S = { holdBuild: false, progress: 0, raids: 0 };
        },
        down() {
          S.holdBuild = true;
        },
        up() {
          S.holdBuild = false;
        },
        tick({ ctx, W, H, dt, hit, toast }) {
          ctx.fillStyle = '#efe9df';
          ctx.fillRect(0, 0, W, H);
          const cx = W / 2;
          const cy = H * 0.45;
          hit(2, 0);

          if (S.holdBuild) {
            S.progress += dt * 0.55;
            if (S.progress > 0.72) {
              S.progress = 0.1;
              S.raids++;
              hit(2, 1);
              toast('⚔ 没有共同权威震慑：你刚种下的庄稼与房屋在收获前就被他人掠夺摧毁！');
            }
          }

          drawRoundBox(ctx, cx - 130, cy - 60, 260, 120, 14, '#fff', '#c0392b', 2.5);
          txt(ctx, '🌾 按住此处：在自然状态中尝试耕种与建造', cx, cy - 20, '#1f2b38', 13, 'center', true);
          ctx.fillStyle = '#ddd';
          ctx.fillRect(cx - 100, cy + 5, 200, 16);
          ctx.fillStyle = '#e67e22';
          ctx.fillRect(cx - 100, cy + 5, 200 * S.progress, 16);
          txt(ctx, `已被暴力掠夺摧毁 ${S.raids} 次 · 产业、航海、学术皆归于零`, cx, cy + 42, '#c0392b', 12, 'center', true);
          drawFooterHint(ctx, W, H, '按住画面中央尝试耕作盖房：体验在“一切人对一切人的战争”中为何任何产业成果都无法保存');
        }
      },
      3: {
        init() {
          S = {
            paper: { x: 0.22, y: 0.3 },
            sword: { x: 0.78, y: 0.3 },
            drag: null,
            mode: 'none'
          };
        },
        down(x, y, { W, H }) {
          if (Math.hypot(x - W * S.paper.x, y - H * S.paper.y) < 55) S.drag = 'paper';
          else if (Math.hypot(x - W * S.sword.x, y - H * S.sword.y) < 55) S.drag = 'sword';
        },
        move(x, y, _dx, _dy, { W, H }) {
          if (S.drag === 'paper') {
            S.paper.x = clamp(x / W, 0.08, 0.92);
            S.paper.y = clamp(y / H, 0.1, 0.85);
          } else if (S.drag === 'sword') {
            S.sword.x = clamp(x / W, 0.08, 0.92);
            S.sword.y = clamp(y / H, 0.1, 0.85);
          }
        },
        up({ W, H, hit, toast }) {
          if (S.drag === 'paper' && Math.hypot(W * S.paper.x - W * 0.5, H * S.paper.y - H * 0.52) < 90) {
            S.mode = 'words';
            hit(3, 0, '没有剑的契约不过是一纸空文，根本无法保障守约者的安全！');
          } else if (S.drag === 'sword' && Math.hypot(W * S.sword.x - W * 0.5, H * S.sword.y - H * 0.52) < 90) {
            S.mode = 'leviathan';
            hit(3, 1, '全体让渡自然权利，诞生执掌公共佩剑的利维坦主权者，和平与秩序确立！');
          } else {
            toast('把左侧“一纸口头契约”或右侧“利维坦公共之剑”拖到中央共同体祭坛上');
          }
          S.drag = null;
        },
        tick({ ctx, W, H }) {
          ctx.fillStyle = '#f4efe6';
          ctx.fillRect(0, 0, W, H);
          const cx = W / 2;
          const cy = H * 0.52;

          drawRoundBox(
            ctx,
            cx - 110,
            cy - 65,
            220,
            130,
            16,
            S.mode === 'leviathan' ? '#e8f8f5' : S.mode === 'words' ? '#fadbd8' : '#fff',
            S.mode === 'leviathan' ? '#27ae60' : '#33475b',
            3
          );
          txt(
            ctx,
            S.mode === 'leviathan'
              ? '👑 利维坦诞生（和平与法权）'
              : S.mode === 'words'
              ? '📄 一纸空文被撕毁（重回战争）'
              : '将契约或公共佩剑拖入此处',
            cx,
            cy + 4,
            '#1f2b38',
            13.5,
            'center',
            true
          );

          drawRoundBox(ctx, W * S.paper.x - 64, H * S.paper.y - 22, 128, 44, 10, '#fff', '#e67e22', 2);
          txt(ctx, '📜 口头契约(无剑)', W * S.paper.x, H * S.paper.y + 5, '#d35400', 12.5, 'center', true);

          drawRoundBox(ctx, W * S.sword.x - 68, H * S.sword.y - 22, 136, 44, 10, '#fff8e6', '#27ae60', 2);
          txt(ctx, '⚔ 利维坦公共佩剑', W * S.sword.x, H * S.sword.y + 5, '#1e8449', 12.5, 'center', true);

          drawFooterHint(ctx, W, H, '先后把左侧“口头契约（无剑）”与右侧“利维坦公共佩剑”拖入中央共同体');
        }
      }
    };
  }

  // ==================== #51–56 (洛克、卢梭、诺齐克、森、吉利根、麦金太尔) ====================
  // Dedicated full-canvas interactive mechanics for #51–56
  let G: any = {};
  return {
    1: {
      init() {
        G = { v1: 0.25, v2: 0.35, drag: null, count: 0, nodes: [0.22, 0.5, 0.78].map((x, i) => ({ x, y: 0.36, i, done: false })) };
      },
      down(x, y, { W, H }) {
        const s1 = hitSlider(x, y, W * 0.15, H * 0.8, W * 0.7);
        if (s1 !== null) {
          G.drag = 'slider';
          G.v1 = s1;
          return;
        }
        for (const n of G.nodes) {
          if (Math.hypot(x - W * n.x, y - H * n.y) < 48) {
            G.drag = n;
            return;
          }
        }
      },
      move(x, y, _dx, _dy, { W, H }) {
        if (G.drag === 'slider') {
          G.v1 = clamp((x - W * 0.15) / (W * 0.7), 0, 1);
        } else if (G.drag && typeof G.drag === 'object') {
          G.drag.x = clamp(x / W, 0.08, 0.92);
          G.drag.y = clamp(y / H, 0.12, 0.72);
        }
      },
      up({ hit }) {
        if (G.drag === 'slider') {
          if (G.v1 < 0.25 || G.v1 > 0.75) hit(1, 0);
          if (G.v1 > 0.8) hit(1, 1);
        } else if (G.drag && typeof G.drag === 'object') {
          G.drag.done = true;
          G.count++;
          hit(1, 0);
          if (G.count >= 2) hit(1, 1);
        }
        G.drag = null;
      },
      tick({ ctx, W, H, hit }) {
        ctx.fillStyle = '#f4efe6';
        ctx.fillRect(0, 0, W, H);
        const labels51_56: Record<number, [string, string[], string]> = {
          51: ['理性自然法护盾：拖动权利节点测试侵犯边界', ['生命权 (Life)', '自由权 (Liberty)', '财产权 (Property)'], '自然法约束与权利互敬度'],
          52: ['从枷锁到共同体契约：拖动公民节点汇入主权圆环', ['公民甲（让渡）', '公民乙（同等结合）', '公民丙（只服从自己）'], '共同体同等结合度'],
          53: ['持有正义历史链：拖动产权节点检验获取、转让与矫正', ['① 正当最初获取', '② 自愿交换转让', '③ 历史不义矫正'], '历史链条清白与矫正进度'],
          54: ['资源 vs 转换因素：拖动相同自行车配给不同处境居民', ['健全居民（直接骑行）', '轮椅居民（需无障碍坡道）', '受限群体（需制度赋权）'], '公共无障碍与社会转换因素支持度'],
          55: ['海因茨困境的两种道德声音：拖动视角焦点连接关系网', ['海因茨（求助）', '患病妻子（脆弱连接）', '药剂师（对话沟通）'], '从抽象权利阶梯转向关系沟通网络'],
          56: ['下棋的孩子：拖动动力焦点从“50美分糖果”转向“棋艺内部善”', ['外在善：50美分糖果', '作弊冲动（仅求糖果时）', '内部善：棋艺布局之美'], '对棋艺内部卓越标准的领悟度']
        };
        const cfg = labels51_56[modelId] || labels51_56[51];

        // Central zone
        drawRoundBox(ctx, W * 0.22, H * 0.16, W * 0.56, H * 0.48, 16, '#fffdf7', '#3a6f99', 2);
        txt(ctx, cfg[0], W / 2, H * 0.23, '#1f2b38', 13.5, 'center', true);

        G.nodes.forEach((n: any, idx: number) => {
          const nx = W * n.x;
          const ny = H * n.y;
          ctx.strokeStyle = 'rgba(58,111,153,0.4)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(W / 2, H * 0.42);
          ctx.lineTo(nx, ny);
          ctx.stroke();

          drawRoundBox(ctx, nx - 72, ny - 22, 144, 44, 12, n.done ? '#e8f8f5' : '#fff8e6', n.done ? '#27ae60' : '#f3a52b', 2.5);
          txt(ctx, cfg[1][idx], nx, ny + 5, '#1f2b38', 12.5, 'center', true);
        });

        if (G.v1 > 0.78) hit(1, 1);
        drawCanvasSlider(ctx, W * 0.15, H * 0.8, W * 0.7, G.v1, `${cfg[2]}：${Math.round(G.v1 * 100)}%`, '0%', '100%', '#27ae60');
        drawFooterHint(ctx, W, H, '直接拖动画面中的三个交互节点进行组合碰撞，并左右拖动底部滑杆完成第 ① 关验证');
      }
    },
    2: {
      init() {
        G = { v1: 0.2, v2: 0.4, drag: 0, tokens: 0, holdT: 0 };
      },
      down(x, y, { W, H }) {
        const s1 = hitSlider(x, y, W * 0.15, H * 0.78, W * 0.7);
        if (s1 !== null) {
          G.drag = 1;
          G.v1 = s1;
          return;
        }
        G.drag = 2;
      },
      move(x, _y, _dx, _dy, { W }) {
        if (G.drag === 1) {
          G.v1 = clamp((x - W * 0.15) / (W * 0.7), 0, 1);
        }
      },
      up({ hit }) {
        if (G.drag === 2) {
          G.tokens++;
          hit(2, 0);
          if (G.tokens >= 3) hit(2, 1);
        }
        G.drag = 0;
      },
      tick({ ctx, W, H, dt, hit }) {
        ctx.fillStyle = '#f4efe6';
        ctx.fillRect(0, 0, W, H);
        if (G.drag === 2) {
          G.holdT += dt;
          if (G.holdT > 0.7) {
            G.v1 = clamp(G.v1 + dt * 0.35, 0, 1);
            hit(2, 0);
          }
        } else {
          G.holdT = 0;
        }
        if (G.v1 > 0.55) hit(2, 0);
        if (G.v1 > 0.82) hit(2, 1);

        const titles2: Record<number, [string, string, string]> = {
          51: ['② 劳动掺入（Mixing Labor）与洛克但书', '按住或点击采集橡果并掺入劳动；超过 85% 将触发腐烂违背自然法但书', '掺入劳动与占有程度'],
          52: ['② 公意（General Will）vs 众意（Will of All）', '向右拖动滑杆使正负极端私利向量相互抵消，显露垂直向上的金色公意合力', '私利正负抵消与公共利益聚焦度'],
          53: ['② 张伯伦买票看球实验（自由交换颠覆固定模式）', '拖动滑杆让 100 万球迷自愿向张伯伦门票箱投 25 美分，从平等 D₁ 演变为 D₂', '自愿投币买票看球的球迷比例'],
          54: ['② 功能性活动 vs 可行能力集（甘地斋戒 vs 饥荒挨饿）', '拖动滑杆打开充盈的粮仓：同样“今日未进食”，斋戒者拥有“本可进食”的选择自由', '可行能力集（真实选择空间）扩展度'],
          55: ['② 关系之网（Web of Relationships）的张力传递', '拖动滑杆向网络中脆弱求助的他者传递倾听与关怀，防止关系网断裂', '关系网络倾听与关怀回应强度'],
          56: ['② 实践（Practices）的内部善 vs 制度（Institutions）的外部腐蚀', '拖动滑杆筑起诚实、正义、勇敢的德性护盾，抵御金钱与权力的制度腐蚀', '实践共同体的德性坚守强度']
        };
        const cfg = titles2[modelId] || titles2[51];

        drawRoundBox(ctx, W * 0.15, H * 0.14, W * 0.7, H * 0.5, 16, '#fffdf8', '#3a6f99', 2);
        txt(ctx, cfg[0], W / 2, H * 0.22, '#1f2b38', 15, 'center', true);
        txt(ctx, cfg[1], W / 2, H * 0.29, '#667', 12.5, 'center');

        // Dynamic visual bar / vectors inside box
        const count = 8;
        for (let i = 0; i < count; i++) {
          const bx = W * 0.22 + i * (W * 0.08);
          const bh =
            modelId === 53
              ? i === count - 1
                ? 25 + G.v1 * 95
                : 65 - G.v1 * 28
              : 25 + G.v1 * 80 * (0.7 + 0.3 * Math.sin(i));
          ctx.fillStyle = i === count - 1 && modelId === 53 ? '#f3a52b' : G.v1 > 0.85 && modelId === 51 ? '#c0392b' : '#27ae60';
          ctx.fillRect(bx, H * 0.58 - bh, 28, bh);
        }

        drawCanvasSlider(ctx, W * 0.15, H * 0.78, W * 0.7, G.v1, `${cfg[2]}：${Math.round(G.v1 * 100)}%`, '0%', '100%', '#3a6f99');
        drawFooterHint(ctx, W, H, '直接按住画布或拖动滑杆至 60% 及 85% 以上，观察哲学状态跃迁并点亮全部原文');
      }
    },
    3: {
      init() {
        G = { v1: 0.3, mode: 0, drag: false };
      },
      down(x, y, { W, H, hit }) {
        const s = hitSlider(x, y, W * 0.15, H * 0.78, W * 0.7);
        if (s !== null) {
          G.drag = true;
          G.v1 = s;
          return;
        }
        G.mode = (G.mode + 1) % 2;
        hit(3, G.mode);
      },
      move(x, _y, _dx, _dy, { W, hit }) {
        if (G.drag) {
          G.v1 = clamp((x - W * 0.15) / (W * 0.7), 0, 1);
          if (G.v1 > 0.75) hit(3, 1);
          else if (G.v1 < 0.35) hit(3, 0);
        }
      },
      up() {
        G.drag = false;
      },
      tick({ ctx, W, H }) {
        ctx.fillStyle = '#f4efe6';
        ctx.fillRect(0, 0, W, H);
        const titles3: Record<number, [string, string, string]> = {
          51: ['③ 政府委托信托与人民抵抗权', '依法保护公民生命自由与财产（信托稳固）', '违背信托专断夺产 → 权力回归人民！'],
          52: ['③ 派系集团对公意的劫持与消解', '巨型派系结党垄断（公意失真）', '无派系独立审议或分散制衡（公意彰显）'],
          53: ['③ 自我所有权与最小国家（守夜人）', '强制对工时征税维持固定终态模式', '最小国家：仅防暴力欺诈、守护自我所有权'],
          54: ['③ 发展即自由：多维可行能力协同扩展', '单一追求 GDP 收入而忽视公共教育医疗', '教育、医疗与公民权利协同撑开实质自由'],
          55: ['③ 关怀伦理的成熟：超越自私与盲目自我牺牲', '传统第二阶段：把盲目自我抹杀当作唯一善', '成熟第三阶段：将自我与他人共同纳入不伤害之网'],
          56: ['③ 人生的叙事统一性与活的传统（Living Tradition）', '现代碎片化自我：角色割裂、仅余任意情绪偏好', '叙事统一性：在历史传统中对良善生活的统一追寻']
        };
        const cfg = titles3[modelId] || titles3[51];

        drawRoundBox(ctx, W * 0.16, H * 0.15, W * 0.68, H * 0.48, 16, G.mode === 1 || G.v1 > 0.6 ? '#e8f8f5' : '#fff8e6', '#3a6f99', 2.5);
        txt(ctx, cfg[0], W / 2, H * 0.24, '#1f2b38', 15, 'center', true);
        txt(ctx, G.v1 > 0.6 || G.mode === 1 ? '★ 当前状态：' + cfg[2] : '当前状态：' + cfg[1], W / 2, H * 0.4, G.v1 > 0.6 || G.mode === 1 ? '#27ae60' : '#d35400', 14, 'center', true);
        txt(ctx, '（点击中央卡片切换状态，或拖动下方滑杆）', W / 2, H * 0.52, '#667', 12);

        drawCanvasSlider(ctx, W * 0.15, H * 0.78, W * 0.7, G.v1, `制度与伦理成熟度调节：${Math.round(G.v1 * 100)}%`, cfg[1].slice(0, 10), cfg[2].slice(0, 10), '#27ae60');
        drawFooterHint(ctx, W, H, '直接点击中央情境框切换对比，或将下方滑杆拉至左端与右端以点亮全部原文');
      }
    }
  };
}
