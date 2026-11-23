import { PhilosophyModel, StageConfig } from '../types/philosophy';

export interface SimState {
  params: Record<string, number | string>;
  counters: Record<string, number>;
  placed: Record<string, string>;
  pointer: { x: number; y: number; down: boolean };
  history: number[];
  montyStats: { switchWins: number; switchTrials: number; stayWins: number; stayTrials: number; lastCar: number; lastPick: number; lastOpen: number; lastSwitched: boolean };
}

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

function lerp(a: number, b: number, k: number) {
  return a + (b - a) * k;
}

export function drawSimulationCanvas(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  model: PhilosophyModel,
  stage: StageConfig,
  state: SimState
) {
  // Soft warm parchment / laboratory background matching Minest canvas style
  ctx.fillStyle = '#f5f2ea';
  ctx.fillRect(0, 0, w, h);

  // Subtle blueprint grid lines
  ctx.strokeStyle = 'rgba(159, 176, 195, 0.18)';
  ctx.lineWidth = 1;
  const gridStep = 44;
  for (let gx = gridStep; gx < w; gx += gridStep) {
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, h);
    ctx.stroke();
  }
  for (let gy = gridStep; gy < h; gy += gridStep) {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(w, gy);
    ctx.stroke();
  }

  const num = (key: string, def = 50): number => {
    const v = state.params[key];
    return typeof v === 'number' ? v : def;
  };
  const str = (key: string, def = ''): string => {
    const v = state.params[key];
    return typeof v === 'string' ? v : def;
  };

  const cx = w * 0.5;
  const cy = h * 0.44;

  const txt = (
    text: string,
    x: number,
    y: number,
    color = '#1f2b38',
    size = 13,
    align: CanvasTextAlign = 'center',
    bold = false
  ) => {
    ctx.fillStyle = color;
    ctx.font = `${bold ? 'bold ' : ''}${size}px -apple-system, "PingFang SC", sans-serif`;
    ctx.textAlign = align;
    ctx.fillText(text, x, y);
  };

  const drawBadge = (x: number, y: number, label: string, bg = '#3a6f99', fg = '#fff') => {
    ctx.font = 'bold 12px -apple-system, "PingFang SC", sans-serif';
    const tw = ctx.measureText(label).width + 20;
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(x - tw / 2, y - 14, tw, 26, 8);
    ctx.fill();
    txt(label, x, y + 4, fg, 12, 'center', true);
  };

  // Bespoke model visualizers for #45–86
  switch (model.id) {
    case 45: {
      // Kripke Possible Worlds
      const wIdx = num('worldIdx', 0);
      const tug = num('tugForce', 0);
      const ariState = str('ariState', 'philosopher');
      const elec = num('electrolysis', 10);
      const tension = num('chainTension', 0);

      if (stage.id === 1) {
        drawBadge(w * 0.32, 34, '严格指示词：“尼克松”', '#3a6f99');
        drawBadge(w * 0.68, 34, '非严格摹状词：“1968 获胜者”', '#c0392b');
        const winners = ['尼克松', '汉弗莱', '尼克松', '华莱士', '马斯基', '汉弗莱'];
        for (let i = 0; i < 6; i++) {
          const wx = w * 0.1 + i * (w * 0.145);
          const wy = h * 0.28;
          const ww = w * 0.13;
          const wh = h * 0.42;
          const isCur = i === wIdx;
          ctx.fillStyle = isCur ? '#fff8e6' : '#eef3f8';
          ctx.strokeStyle = isCur ? '#f3a52b' : '#9fb0c3';
          ctx.lineWidth = isCur ? 3 : 1.5;
          ctx.beginPath();
          ctx.roundRect(wx, wy, ww, wh, 10);
          ctx.fill();
          ctx.stroke();
          txt(i === 0 ? 'W₀ 现实' : `可能世界 W${i}`, wx + ww / 2, wy + 20, '#1f2b38', 12, 'center', true);

          // Nixon node
          const nx = wx + ww * 0.32;
          const ny = wy + wh * 0.56;
          ctx.fillStyle = '#3a6f99';
          ctx.beginPath();
          ctx.arc(nx, ny, 11, 0, Math.PI * 2);
          ctx.fill();
          txt('尼克松', nx, ny + 24, '#1f2b38', 11);

          // Rival node
          const rx = wx + ww * 0.72;
          const ry = wy + wh * 0.56;
          ctx.fillStyle = '#2fa35a';
          ctx.beginPath();
          ctx.arc(rx, ry, 11, 0, Math.PI * 2);
          ctx.fill();
          txt(winners[i] === '尼克松' ? '汉弗莱' : winners[i], rx, ry + 24, '#1f2b38', 11);

          // Rigid line always goes to Nixon
          const jitter = isCur ? Math.sin(t * 25) * (tug * 0.08) : 0;
          ctx.strokeStyle = '#3a6f99';
          ctx.lineWidth = isCur ? 3 : 1.8;
          ctx.beginPath();
          ctx.moveTo(w * 0.32, 48);
          ctx.lineTo(nx + jitter, ny - 12);
          ctx.stroke();

          // Flaccid description jumps to winner
          const winX = winners[i] === '尼克松' ? nx : rx;
          ctx.strokeStyle = 'rgba(192,57,43,0.75)';
          ctx.lineWidth = isCur ? 2.5 : 1.5;
          ctx.setLineDash([5, 4]);
          ctx.beginPath();
          ctx.moveTo(w * 0.68, 48);
          ctx.lineTo(winX, ny - 12);
          ctx.stroke();
          ctx.setLineDash([]);
          txt('🏆', winX, ny - 18, '#f3a52b', 13);
        }
        if (tug > 60) {
          txt('⚡ 严格指示词拉不动：在任何可能世界里，“尼克松”都只指尼克松本人！', cx, h * 0.8, '#c0392b', 13, 'center', true);
        }
      } else if (stage.id === 2) {
        drawBadge(cx, 38, '专名：“亚里士多德” (Rigid Designator)', '#c79b2f');
        ctx.fillStyle = '#fff8e6';
        ctx.strokeStyle = '#c79b2f';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(cx - 160, cy - 60, 320, 140, 14);
        ctx.fill();
        ctx.stroke();
        if (ariState === 'unborn') {
          ctx.setLineDash([5, 5]);
          ctx.strokeStyle = '#999';
          ctx.beginPath();
          ctx.arc(cx, cy + 5, 28, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          txt('（在此反事实世界中未曾出生）', cx, cy + 55, '#888', 13, 'center', true);
        } else {
          ctx.fillStyle = '#c79b2f';
          ctx.beginPath();
          ctx.arc(cx, cy - 5, 24, 0, Math.PI * 2);
          ctx.fill();
          txt(
            ariState === 'age2'
              ? '两岁夭折（未写《形而上学》，但仍是亚里士多德！）'
              : '著《形而上学》、亚历山大之师',
            cx,
            cy + 48,
            '#1f2b38',
            13,
            'center',
            true
          );
        }
        ctx.strokeStyle = '#c79b2f';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx, 52);
        ctx.lineTo(cx, cy - 30);
        ctx.stroke();
      } else {
        // Water = H2O
        const shake = Math.sin(t * 30) * (tension * 0.08);
        drawBadge(cx - 90 + shake, cy - 30, '“水 (Water)”', '#2980b9');
        drawBadge(cx + 90 - shake, cy - 30, '“H₂O 分子结构”', '#16a085');
        ctx.strokeStyle = tension > 75 ? '#c0392b' : '#2c3e50';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(cx - 35 + shake, cy - 30);
        ctx.lineTo(cx + 35 - shake, cy - 30);
        ctx.stroke();
        txt(`经验电解检验进度：${elec}% · 后天经验发现，但一旦为真则跨所有可能世界必然为真`, cx, cy + 45, '#1f2b38', 13, 'center', true);
      }
      break;
    }

    case 46: {
      // Goodman's Grue Paradox
      const count = (state.counters.mineEmerald || 0) + (state.counters.mineBatch || 0) * 5 + 3;
      const nowT = num('nowTime', 25);
      const threshT = num('tThreshold', 60);
      const langAng = num('langAngle', 0);
      const histW = num('historyWeight', 85);

      if (stage.id === 1) {
        txt(`时刻 t 之前已开采并检验绿宝石：${count} 颗`, cx, 42, '#1f2b38', 15, 'center', true);
        for (let i = 0; i < Math.min(count, 16); i++) {
          const gx = w * 0.18 + (i % 8) * 38;
          const gy = h * 0.28 + Math.floor(i / 8) * 42;
          ctx.fillStyle = '#2fa35a';
          ctx.beginPath();
          ctx.arc(gx, gy, 13, 0, Math.PI * 2);
          ctx.fill();
          txt('💎', gx, gy + 5, '#fff', 12);
        }
        const conf = Math.min(100, Math.round((1 - 1 / (1 + count * 0.25)) * 100));
        // Two equal confirmation bars
        drawBadge(w * 0.68, h * 0.3, `假说 H₁（所有绿宝石皆【绿】）确证度：${conf}%`, '#2fa35a');
        drawBadge(w * 0.68, h * 0.5, `假说 H₂（所有绿宝石皆【绿蓝】）确证度：${conf}%`, '#2980b9');
        txt('在时刻 t 之前，每一颗绿色宝石都同时以完全相同的程度确证了 H₁ 与 H₂！', cx, h * 0.78, '#1f2b38', 13, 'center', true);
      } else if (stage.id === 2) {
        const x0 = w * 0.12;
        const x1 = w * 0.88;
        const tx = lerp(x0, x1, threshT / 100);
        const nx = lerp(x0, x1, nowT / 100);
        ctx.strokeStyle = '#33475b';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x0, cy - 20);
        ctx.lineTo(tx, cy - 20);
        ctx.stroke();
        // Diverging predictions after t
        ctx.strokeStyle = '#2fa35a';
        ctx.beginPath();
        ctx.moveTo(tx, cy - 20);
        ctx.lineTo(x1, cy - 75);
        ctx.stroke();
        txt('依“绿”预测：t 之后仍是绿的', x1 - 70, cy - 85, '#2fa35a', 12, 'center', true);

        ctx.strokeStyle = '#2980b9';
        ctx.beginPath();
        ctx.moveTo(tx, cy - 20);
        ctx.lineTo(x1, cy + 35);
        ctx.stroke();
        txt('依“绿蓝”预测：t 之后首检变为蓝的！', x1 - 80, cy + 56, '#2980b9', 12, 'center', true);

        // t marker & Now marker
        ctx.fillStyle = '#f3a52b';
        ctx.fillRect(tx - 2, cy - 60, 4, 80);
        txt(`临界时刻 t (${threshT}%)`, tx, cy - 68, '#d35400', 12, 'center', true);

        ctx.fillStyle = '#1f2b38';
        ctx.beginPath();
        ctx.arc(nx, cy - 20, 9, 0, Math.PI * 2);
        ctx.fill();
        txt(`现在 (${nowT}%)`, nx, cy + 12, '#1f2b38', 12, 'center', true);
      } else {
        // Entrenchment balance scale
        const tilt = ((histW - 50) / 50) * 0.35 + (langAng / 180) * 0.2;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(tilt);
        ctx.strokeStyle = '#33475b';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(-140, 0);
        ctx.lineTo(140, 0);
        ctx.stroke();
        drawBadge(-130, -24, '“绿 (Green)”：根深蒂固', '#2fa35a');
        drawBadge(130, -24, '“绿蓝 (Grue)”：缺乏投射历史', '#2980b9');
        ctx.restore();
      }
      break;
    }

    case 47: {
      // Aristotle Golden Mean
      const disp = num('disposition', 20);
      const food = num('foodAmount', 6);
      const trainee = str('trainee', 'milo');
      const drift = num('naturalDrift', -35);
      const pull = num('counterPull', 0);

      if (stage.id === 1) {
        const barW = Math.min(560, w * 0.76);
        const bx = cx - barW / 2;
        const by = cy - 16;
        // Three zones: Defect (0-35), Mean (35-65), Excess (65-100)
        ctx.fillStyle = '#3a6f99';
        ctx.fillRect(bx, by, barW * 0.35, 28);
        ctx.fillStyle = '#2fa35a';
        ctx.fillRect(bx + barW * 0.35, by, barW * 0.3, 28);
        ctx.fillStyle = '#e67e22';
        ctx.fillRect(bx + barW * 0.65, by, barW * 0.35, 28);

        txt('不足之恶（怯懦 / 麻木 / 吝啬）', bx + barW * 0.17, by - 12, '#3a6f99', 12, 'center', true);
        txt('★ 德性中道（勇敢 / 节制 / 慷慨）', cx, by - 12, '#2fa35a', 13, 'center', true);
        txt('过度之恶（鲁莽 / 放纵 / 挥霍）', bx + barW * 0.83, by - 12, '#e67e22', 12, 'center', true);

        const px = bx + (disp / 100) * barW;
        ctx.fillStyle = '#1f2b38';
        ctx.beginPath();
        ctx.arc(px, by + 14, 14, 0, Math.PI * 2);
        ctx.fill();
        txt(`${disp}%`, px, by + 48, '#1f2b38', 13, 'center', true);
      } else if (stage.id === 2) {
        const target = trainee === 'milo' ? 8.5 : 3.5;
        const diff = Math.abs(food - target);
        drawBadge(cx, cy - 55, trainee === 'milo' ? '摔跤冠军米隆（最佳中道 ≈ 8.5 明那）' : '体操初学者（最佳中道 ≈ 3.5 明那）', '#3a6f99');
        drawBadge(cx, cy, `当前配给：${food} 明那（算术中点 = 6 明那）`, diff <= 1 ? '#2fa35a' : '#e67e22');
        txt(
          diff <= 1
            ? '✓ 恰到好处！这就是“相对于我们的中道”，而非死板的算术平均数 6 明那'
            : food > target
            ? '▲ 配给过多（过度）：超过此人的身体负荷'
            : '▼ 配给过少（不足）：无法支撑此人的训练消耗',
          cx,
          cy + 52,
          diff <= 1 ? '#2fa35a' : '#c0392b',
          13,
          'center',
          true
        );
      } else {
        // Straightening bent wood
        const netBend = drift + pull;
        ctx.strokeStyle = '#95a5a6';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(cx, cy - 85);
        ctx.lineTo(cx, cy + 85);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.strokeStyle = Math.abs(netBend) <= 10 ? '#2fa35a' : '#a0522d';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(cx, cy + 80);
        ctx.quadraticCurveTo(cx + netBend * 2.2, cy, cx + netBend * 1.4, cy - 80);
        ctx.stroke();
        txt(
          Math.abs(netBend) <= 10 ? '✓ 木料已矫正归于中正笔直！' : `当前木料净弯曲度：${netBend}（需向反方向拉拽矫枉过正）`,
          cx,
          cy + 110,
          '#1f2b38',
          13,
          'center',
          true
        );
      }
      break;
    }

    case 48: {
      // Epicurus Pleasure & Ataraxia
      const relief = num('basicRelief', 40);
      const luxury = num('luxuryExcess', 50);
      const waveAmp = Math.max(2, (100 - relief) * 0.25 + luxury * 0.35);
      // Draw soul water surface
      ctx.fillStyle = 'rgba(58, 111, 153, 0.16)';
      ctx.beginPath();
      ctx.moveTo(w * 0.1, cy + 70);
      for (let x = w * 0.1; x <= w * 0.9; x += 10) {
        const y = cy + Math.sin(x * 0.04 + t * 3.5) * waveAmp;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w * 0.9, cy + 70);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = waveAmp < 10 ? '#2fa35a' : '#e67e22';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = w * 0.1; x <= w * 0.9; x += 10) {
        const y = cy + Math.sin(x * 0.04 + t * 3.5) * waveAmp;
        x === w * 0.1 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      drawBadge(
        cx,
        cy - 55,
        waveAmp < 12
          ? '★ 灵魂无纷扰 (Ataraxia) & 身体无痛苦 (Aponia)'
          : `灵魂水面纷扰波动度：${Math.round(waveAmp * 2)}%`,
        waveAmp < 12 ? '#2fa35a' : '#c0392b'
      );
      break;
    }

    case 49: {
      // Stoic Dichotomy of Control
      const aim = num('aimEffort', 90);
      const wind = num('windGust', 35);
      const lens = str('internalLens', 'catastrophe');
      const calm = lens === 'stoic' || stage.id !== 2;

      // Inner shield of Prohairesis
      ctx.fillStyle = calm ? 'rgba(47, 163, 90, 0.18)' : 'rgba(231, 76, 60, 0.2)';
      ctx.strokeStyle = calm ? '#2fa35a' : '#c0392b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, 56, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      txt('内圈：取决于我', cx, cy - 6, '#1f2b38', 13, 'center', true);
      txt('信念 · 判断 · 意欲', cx, cy + 14, '#2fa35a', 12, 'center', true);

      // Outer ring
      ctx.strokeStyle = '#3a6f99';
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.arc(cx, cy, 115, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      txt(`外圈（不可控）：风向 ${wind} m/s · 名誉 · 财富 · 际遇`, cx, cy - 126, '#3a6f99', 12, 'center', true);
      if (stage.id === 3) {
        txt(`弓箭手自身瞄准努力（可控）：${aim}%`, cx, cy + 142, '#1f2b38', 13, 'center', true);
      }
      break;
    }

    case 50: {
      // Hobbes Leviathan
      const scarcity = num('scarcity', 65);
      const diffidence = num('diffidence', 70);
      const sword = stage.id === 2 ? num('authoritySword', 0) : stage.id === 3 ? num('swordPower', 80) : 0;
      const mode = str('covenantMode', 'words_only');
      const order = mode === 'leviathan' ? sword : stage.id === 2 ? sword : Math.max(0, 100 - (scarcity + diffidence) / 2);

      // Draw citizens
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 + t * (order > 60 ? 0.3 : 1.8);
        const r = order > 60 ? 74 : 50 + Math.sin(t * 5 + i * 3) * 38;
        const px = cx + Math.cos(a) * r;
        const py = cy + Math.sin(a) * r;
        ctx.fillStyle = order > 60 ? '#2fa35a' : '#c0392b';
        ctx.beginPath();
        ctx.arc(px, py, 9, 0, Math.PI * 2);
        ctx.fill();
        if (order > 60) {
          ctx.strokeStyle = 'rgba(243,165,43,0.5)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(cx, cy);
          ctx.stroke();
        }
      }
      drawBadge(
        cx,
        cy,
        order > 60 ? '👑 利维坦主权之剑（和平与产业）' : '⚔ 自然战争状态（孤独·贫困·短寿）',
        order > 60 ? '#f3a52b' : '#c0392b',
        order > 60 ? '#111' : '#fff'
      );
      break;
    }

    case 79: {
      // Bayesian Epistemology
      const prior = stage.id === 2 ? num('baseRate', 2) / 100 : num('priorP', 30) / 100;
      const sens = stage.id === 2 ? num('testAccuracy', 95) / 100 : num('truePos', 85) / 100;
      const fpr = stage.id === 2 ? (100 - num('testAccuracy', 95)) / 100 : num('falsePos', 20) / 100;
      const plusE = state.counters.addEvidence || 0;
      const minusE = state.counters.addCounterEvidence || 0;

      const pE = prior * sens + (1 - prior) * fpr;
      const post = pE > 0 ? (prior * sens) / pE : 0;

      if (stage.id <= 2) {
        const barW = Math.min(480, w * 0.7);
        const bx = cx - barW / 2;
        // Prior vs Posterior bars
        ctx.fillStyle = '#3a6f99';
        ctx.fillRect(bx, cy - 45, barW * prior, 26);
        ctx.strokeStyle = '#33475b';
        ctx.strokeRect(bx, cy - 45, barW, 26);
        txt(`先验概率 P(H) = ${(prior * 100).toFixed(1)}%`, bx, cy - 52, '#3a6f99', 13, 'left', true);

        ctx.fillStyle = '#2fa35a';
        ctx.fillRect(bx, cy + 15, barW * post, 26);
        ctx.strokeRect(bx, cy + 15, barW, 26);
        txt(
          `贝叶斯更新后验概率 P(H|E) = ${(post * 100).toFixed(1)}%  [似然比 = ${(sens / Math.max(0.01, fpr)).toFixed(2)}]`,
          bx,
          cy + 8,
          '#2fa35a',
          13,
          'left',
          true
        );
      } else {
        // Washing out of priors convergence
        const net = plusE - minusE;
        const updateP = (p0: number) => {
          let p = p0;
          const lr = Math.pow(3, net);
          const odds = (p / (1 - p)) * lr;
          return odds / (1 + odds);
        };
        const pSkeptic = updateP(0.05);
        const pOptimist = updateP(0.9);
        drawBadge(cx, cy - 45, `怀疑论者（初始 5%）当前后验：${(pSkeptic * 100).toFixed(1)}%`, '#3a6f99');
        drawBadge(cx, cy + 10, `乐观论者（初始 90%）当前后验：${(pOptimist * 100).toFixed(1)}%`, '#2fa35a');
        txt(`已累积独立证据净轮数：${net >= 0 ? '+' + net : net} 轮 · 分歧差值：${(Math.abs(pOptimist - pSkeptic) * 100).toFixed(1)}%`, cx, cy + 62, '#1f2b38', 13, 'center', true);
      }
      break;
    }

    case 82: {
      // Prisoner's Dilemma 2x2 Matrix
      const moveA = str('playerAMove', 'cooperate');
      const moveB = str('playerBMove', 'cooperate');
      const T = num('temptationT', 5) - num('contractPenalty', 0);
      const R = num('rewardR', 3);
      const P = 1;
      const S = 0;

      const mw = 260;
      const mh = 130;
      const mx = cx - mw / 2;
      const my = cy - mh / 2;

      const cells = [
        { r: 0, c: 0, a: 'cooperate', b: 'cooperate', title: '双方合作 (C, C)', pay: `A: +${R} , B: +${R}`, col: '#2fa35a' },
        { r: 0, c: 1, a: 'cooperate', b: 'defect', title: 'A合作 / B背叛', pay: `A: +${S} , B: +${T}`, col: '#e67e22' },
        { r: 1, c: 0, a: 'defect', b: 'cooperate', title: 'A背叛 / B合作', pay: `A: +${T} , B: +${S}`, col: '#e67e22' },
        { r: 1, c: 1, a: 'defect', b: 'defect', title: '双方背叛 (D, D)', pay: `A: +${P} , B: +${P}`, col: '#c0392b' }
      ];

      cells.forEach((cell) => {
        const x = mx + cell.c * (mw / 2);
        const y = my + cell.r * (mh / 2);
        const active = moveA === cell.a && moveB === cell.b;
        ctx.fillStyle = active ? cell.col : '#fff';
        ctx.strokeStyle = '#33475b';
        ctx.lineWidth = active ? 3 : 1.5;
        ctx.fillRect(x, y, mw / 2 - 4, mh / 2 - 4);
        ctx.strokeRect(x, y, mw / 2 - 4, mh / 2 - 4);
        txt(cell.title, x + mw / 4 - 2, y + 22, active ? '#fff' : '#1f2b38', 12, 'center', true);
        txt(cell.pay, x + mw / 4 - 2, y + 44, active ? '#fff' : cell.col, 13, 'center', true);
      });
      break;
    }

    case 83: {
      // Zeno's Paradoxes
      const steps = (state.counters.bisectStep || 0) + (state.counters.bisectMany || 0) * 10 + 1;
      const x0 = w * 0.12;
      const totalW = w * 0.76;
      const sum = 1 - Math.pow(0.5, Math.min(steps, 30));

      ctx.fillStyle = '#dfe6e9';
      ctx.fillRect(x0, cy - 18, totalW, 32);
      let cur = 0;
      let seg = totalW / 2;
      for (let i = 0; i < Math.min(steps, 14); i++) {
        ctx.fillStyle = i % 2 === 0 ? '#3a6f99' : '#f3a52b';
        ctx.fillRect(x0 + cur, cy - 18, Math.max(1, seg - 1), 32);
        cur += seg;
        seg /= 2;
      }
      drawBadge(
        cx,
        cy - 52,
        `已无限折半分割 n = ${steps} 段 · 累计走过路程 ∑(1/2)ⁿ = ${sum.toFixed(6)}`,
        '#3a6f99'
      );
      txt('数学极限 lim (n→∞) ∑ (1/2)ⁿ = 1（有限时间内跨越无穷多个成比例缩小的区间）', cx, cy + 42, '#1f2b38', 13, 'center', true);
      break;
    }

    case 84: {
      // Hilbert's Infinite Hotel
      const k = num('newGuestsK', 1);
      const shiftedPlus = state.counters.shiftPlusK || 0;
      const shiftedEven = state.counters.shiftEven2N || 0;
      const rooms = 8;
      const rw = Math.min(64, (w * 0.8) / rooms);
      const startX = cx - (rooms * rw) / 2;

      for (let i = 1; i <= rooms; i++) {
        const rx = startX + (i - 1) * rw;
        const isVacant =
          stage.id === 1
            ? shiftedPlus > 0 && i <= k
            : stage.id === 2
            ? shiftedEven > 0 && i % 2 === 1
            : false;
        ctx.fillStyle = isVacant ? '#e8f8f5' : '#fff8e6';
        ctx.strokeStyle = isVacant ? '#2fa35a' : '#f3a52b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(rx + 3, cy - 35, rw - 6, 70, 8);
        ctx.fill();
        ctx.stroke();
        txt(`#${i}房`, rx + rw / 2, cy - 14, '#1f2b38', 12, 'center', true);
        txt(isVacant ? '空出 ✓' : '住满 👤', rx + rw / 2, cy + 16, isVacant ? '#2fa35a' : '#d35400', 11, 'center', true);
      }
      txt('⋯ ⋯ → ∞ (可数无穷 ℵ₀ 间房：ℵ₀ + k = ℵ₀，ℵ₀ + ℵ₀ = ℵ₀)', cx, cy + 60, '#1f2b38', 13, 'center', true);
      break;
    }

    case 85: {
      // Monty Hall 3 Doors + Monte Carlo stats
      const st = state.montyStats;
      const swRate = st.switchTrials > 0 ? ((st.switchWins / st.switchTrials) * 100).toFixed(1) : '66.7';
      const stRate = st.stayTrials > 0 ? ((st.stayWins / st.stayTrials) * 100).toFixed(1) : '33.3';
      const nDoors = stage.id === 3 ? num('totalDoorsN', 3) : 3;

      [1, 2, 3].forEach((d, idx) => {
        const dx = cx - 155 + idx * 115;
        const isOpenGoat = d === st.lastOpen;
        const isCar = d === st.lastCar;
        ctx.fillStyle = isOpenGoat ? '#ecf0f1' : '#3a6f99';
        ctx.strokeStyle = d === st.lastPick ? '#f3a52b' : '#2c3e50';
        ctx.lineWidth = d === st.lastPick ? 4 : 2;
        ctx.beginPath();
        ctx.roundRect(dx, cy - 55, 80, 100, 10);
        ctx.fill();
        ctx.stroke();
        txt(`${d} 号门`, dx + 40, cy - 30, isOpenGoat ? '#333' : '#fff', 13, 'center', true);
        txt(isOpenGoat ? '🐐 山羊(已排除)' : isCar && st.switchTrials + st.stayTrials > 0 ? '🏎 跑车' : '❓', dx + 40, cy + 10, isOpenGoat ? '#c0392b' : '#ffd96b', 13, 'center', true);
      });

      drawBadge(
        cx,
        cy + 72,
        stage.id === 3
          ? `${nDoors} 扇门推广：不换门胜率 1/${nDoors} (${(100 / nDoors).toFixed(1)}%) vs 换门胜率 ${nDoors - 1}/${nDoors} (${(((nDoors - 1) * 100) / nDoors).toFixed(1)}%)`
          : `累计实测 · 换门胜率：${swRate}% (${st.switchWins}/${st.switchTrials})  |  不换胜率：${stRate}% (${st.stayWins}/${st.stayTrials})`,
        '#2fa35a'
      );
      break;
    }

    case 86: {
      // Simpson's Paradox
      const sevA = num('severeShareA', 80) / 100;
      const sevB = num('severeShareB', 20) / 100;
      // Mild cure rates: A = 93%, B = 87% (A > B)
      // Severe cure rates: A = 73%, B = 69% (A > B)
      const totalA = (1 - sevA) * 93 + sevA * 73;
      const totalB = (1 - sevB) * 87 + sevB * 69;
      const reversed = totalA < totalB;

      const cols = [
        { label: '轻症组治愈率', a: 93, b: 87 },
        { label: '重症组治愈率', a: 73, b: 69 },
        { label: '总体汇总治愈率', a: Math.round(totalA * 10) / 10, b: Math.round(totalB * 10) / 10 }
      ];

      cols.forEach((c, i) => {
        const gx = cx - 210 + i * 160;
        txt(c.label, gx + 45, cy - 60, '#1f2b38', 13, 'center', true);
        // Bar A
        ctx.fillStyle = '#3a6f99';
        ctx.fillRect(gx + 10, cy + 40 - c.a * 0.85, 30, c.a * 0.85);
        txt(`A:${c.a}%`, gx + 25, cy + 56, '#3a6f99', 11, 'center', true);
        // Bar B
        ctx.fillStyle = '#e67e22';
        ctx.fillRect(gx + 50, cy + 40 - c.b * 0.85, 30, c.b * 0.85);
        txt(`B:${c.b}%`, gx + 65, cy + 56, '#e67e22', 11, 'center', true);
      });

      drawBadge(
        cx,
        cy + 84,
        reversed
          ? `⚠ 辛普森趋势反转触发！分组皆为 A > B，但汇总后 A (${totalA.toFixed(1)}%) < B (${totalB.toFixed(1)}%)`
          : `当前无反转：分组与总体均为 A (${totalA.toFixed(1)}%) > B (${totalB.toFixed(1)}%)`,
        reversed ? '#c0392b' : '#2fa35a'
      );
      break;
    }

    default: {
      // Dynamic relational system diagram for all other models (#51–78) responding live to sliders & choices
      const entries = Object.entries(state.params);
      const numVals = entries.filter(([, v]) => typeof v === 'number') as [string, number][];
      const strVals = entries.filter(([, v]) => typeof v === 'string') as [string, string][];

      const primaryVal = numVals.length > 0 ? clamp(numVals[0][1], 0, 100) : 65;
      const secondaryVal = numVals.length > 1 ? clamp(numVals[1][1], 0, 100) : 50;

      // Central interactive concept hub
      const radius = 38 + (primaryVal / 100) * 32;
      const grad = ctx.createRadialGradient(cx, cy, 8, cx, cy, radius * 1.4);
      grad.addColorStop(0, 'rgba(243, 165, 43, 0.45)');
      grad.addColorStop(1, 'rgba(58, 111, 153, 0.05)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.4, 0, Math.PI * 2);
      ctx.fill();

      // Orbiting / connected concept nodes
      const nodeCount = Math.max(3, stage.mappings.length + 1);
      for (let i = 0; i < nodeCount; i++) {
        const ang = (i / nodeCount) * Math.PI * 2 + t * 0.35;
        const dist = 70 + (secondaryVal / 100) * 55;
        const nx = cx + Math.cos(ang) * dist * 1.45;
        const ny = cy + Math.sin(ang) * dist * 0.78;

        ctx.strokeStyle = i % 2 === 0 ? '#3a6f99' : '#2fa35a';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.quadraticCurveTo(cx + Math.cos(ang + 0.4) * 40, cy + Math.sin(ang + 0.4) * 30, nx, ny);
        ctx.stroke();

        ctx.fillStyle = ['#3a6f99', '#2fa35a', '#e67e22', '#8e44ad'][i % 4];
        ctx.beginPath();
        ctx.arc(nx, ny, 14, 0, Math.PI * 2);
        ctx.fill();
        txt(`节点 ${i + 1}`, nx, ny + 26, '#1f2b38', 11, 'center', true);
      }

      drawBadge(cx, cy, `${model.philosopher} · ${model.concept.split('、')[0]}`, '#1f2b38');

      // Show current live parameters at bottom of canvas
      const statusParts: string[] = [];
      numVals.forEach(([k, v]) => {
        const sl = stage.sliders?.find((s) => s.key === k);
        statusParts.push(`${sl ? sl.label.split('（')[0] : k}: ${v}${sl?.unit || ''}`);
      });
      strVals.forEach(([k, v]) => {
        const ch = stage.choices?.find((c) => c.key === k);
        const opt = ch?.options.find((o) => o.value === v);
        if (opt) statusParts.push(opt.label.split('：')[0]);
      });
      if (statusParts.length > 0) {
        txt(statusParts.join('  |  '), cx, h - 18, '#3a6f99', 12.5, 'center', true);
      }
      break;
    }
  }
}
