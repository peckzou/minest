import {
  CanvasEnv,
  clamp,
  txt,
  drawRoundBox,
  drawCanvasSlider,
  hitSlider,
  drawFooterHint
} from './canvasHelpers';
import { StageEngine } from './engineEthics';

export function createLanguageSocialEngine(modelId: number): Record<number, StageEngine> {
  // ==================== #67 奥斯汀 · 言语行为理论 ====================
  if (modelId === 67) {
    let S: any = {};
    return {
      1: {
        init() {
          S = {
            drag: null,
            placedValid: false,
            placedInvalid: false,
            stampX: 0.5,
            stampY: 0.72
          };
        },
        down(x, y, { W, H }) {
          if (Math.hypot(x - W * S.stampX, y - H * S.stampY) < 65 || y > H * 0.52) {
            S.drag = true;
          }
        },
        move(x, y, _dx, _dy, { W, H }) {
          if (S.drag) {
            S.stampX = clamp(x / W, 0.12, 0.88);
            S.stampY = clamp(y / H, 0.18, 0.82);
          }
        },
        up({ hit, toast }) {
          if (!S.drag) return;
          S.drag = false;
          // Left target: Authorized Captain with Champagne
          if (S.stampX < 0.44 && S.stampY < 0.55) {
            S.placedValid = true;
            hit(1, 0, '恰当性条件满足：以言行事成功！该船正式获名“伊丽莎白女王号”！');
          } else if (S.stampX > 0.56 && S.stampY < 0.55) {
            // Right target: Unauthorized Bystander
            S.placedInvalid = true;
            hit(1, 1, '失误（Misfire）：路人无权命名，规约程序不具备，言语行为无效！');
            toast('⚠ 失误（Misfire）：主体不具备规定权限，句子的命名行为落空！');
          }
          S.stampX = 0.5;
          S.stampY = 0.74;
        },
        tick({ ctx, W, H }) {
          ctx.fillStyle = '#f4efe6';
          ctx.fillRect(0, 0, W, H);

          // Left box: Authorized ceremony
          drawRoundBox(
            ctx,
            W * 0.08,
            H * 0.14,
            W * 0.38,
            H * 0.38,
            14,
            S.placedValid ? '#e8f8f5' : '#fff',
            '#27ae60',
            2.5
          );
          txt(ctx, '⚓ 情境 A：获授权船长 + 下水典礼', W * 0.27, H * 0.22, '#1e8449', 13, 'center', true);
          txt(
            ctx,
            S.placedValid ? '✓ 施为成功（Happy）：以言行事完成命名！' : '（将下方话语拖入此处执行命名）',
            W * 0.27,
            H * 0.36,
            S.placedValid ? '#1e8449' : '#667',
            12,
            'center',
            true
          );

          // Right box: Unauthorized passerby
          drawRoundBox(
            ctx,
            W * 0.54,
            H * 0.14,
            W * 0.38,
            H * 0.38,
            14,
            S.placedInvalid ? '#fadbd8' : '#fff',
            '#c0392b',
            2.5
          );
          txt(ctx, '🚶 情境 B：无权限路人甲乱砸酒瓶', W * 0.73, H * 0.22, '#c0392b', 13, 'center', true);
          txt(
            ctx,
            S.placedInvalid ? '✗ 失误（Misfire）：违反恰当性规约，命名无效！' : '（将下方话语拖入此处测试失误）',
            W * 0.73,
            H * 0.36,
            S.placedInvalid ? '#c0392b' : '#667',
            12,
            'center',
            true
          );

          // Draggable Utterance Card
          drawRoundBox(ctx, W * S.stampX - 145, H * S.stampY - 26, 290, 52, 14, '#fff8e6', '#f3a52b', 3);
          txt(ctx, '💬 拖拽话语：「我命名此船为伊丽莎白女王号」', W * S.stampX, H * S.stampY + 5, '#1f2b38', 13, 'center', true);

          drawFooterHint(ctx, W, H, '直接将底部橙色施为话语卡片先后拖入左上“授权典礼”与右上“无权限路人”情境框中');
        }
      },
      2: {
        init() {
          S = { step: 0, v: 0.2, drag: false };
        },
        down(x, y, { W, H, hit }) {
          const s = hitSlider(x, y, W * 0.16, H * 0.78, W * 0.68);
          if (s !== null) {
            S.drag = true;
            S.v = s;
            return;
          }
          // Click on the 3 Speech Act layers
          for (let i = 0; i < 3; i++) {
            const bx = W * (0.22 + i * 0.28);
            if (Math.hypot(x - bx, y - H * 0.38) < 75) {
              S.step = i + 1;
              if (i <= 1) hit(2, 0, '以言表意（Locutionary）与以言行事（Illocutionary：警告/劝阻）！');
              if (i === 2) hit(2, 1, '以言取效（Perlocutionary）：听者在现实中被吓退并停下脚步！');
            }
          }
        },
        move(x, _y, _dx, _dy, { W, hit }) {
          if (S.drag) {
            S.v = clamp((x - W * 0.16) / (W * 0.68), 0, 1);
            if (S.v > 0.35) hit(2, 0);
            if (S.v > 0.78) hit(2, 1);
          }
        },
        up() {
          S.drag = false;
        },
        tick({ ctx, W, H }) {
          ctx.fillStyle = '#f4efe6';
          ctx.fillRect(0, 0, W, H);

          const layers = [
            ['① 以言表意 (Locution)', '发声说出：“冰很薄！”', '指称冰面厚度字面意义'],
            ['② 以言行事 (Illocution)', '施为语力：【发出警告】', '在言语中直接实施警告行为'],
            ['③ 以言取效 (Perlocution)', '现实后果：【滑冰者后退】', '在听者心理与行动上产生效果']
          ];

          layers.forEach((l, i) => {
            const bx = W * (0.22 + i * 0.28);
            const active = S.step === i + 1 || S.v > (i + 1) * 0.28;
            drawRoundBox(ctx, bx - 95, H * 0.22, 190, 110, 14, active ? '#e8f8f5' : '#fff', active ? '#27ae60' : '#3a6f99', 2.5);
            txt(ctx, l[0], bx, H * 0.29, '#1f2b38', 13, 'center', true);
            txt(ctx, l[1], bx, H * 0.38, active ? '#1e8449' : '#d35400', 12.5, 'center', true);
            txt(ctx, l[2], bx, H * 0.46, '#667', 11.5, 'center');
          });

          drawCanvasSlider(ctx, W * 0.16, H * 0.78, W * 0.68, S.v, '言语行为三层次推进度（表意 → 行事语力 → 取效后果）', '仅发出字面语音', '完成警告并劝退听者', '#27ae60');
          drawFooterHint(ctx, W, H, '直接点击上方三个言语行为层级卡片或向右拉动底部滑杆，观察从发声到现实劝退的传导');
        }
      }
    };
  }

  // ==================== #68–76 语言、解释与社会哲学交互专案 ====================
  let L: any = {};
  return {
    1: {
      init() {
        L = {
          v: 0.25,
          drag: null,
          count: 0,
          cards: [
            { x: 0.24, y: 0.36, done: false },
            { x: 0.5, y: 0.44, done: false },
            { x: 0.76, y: 0.36, done: false }
          ]
        };
      },
      down(x, y, { W, H }) {
        const s = hitSlider(x, y, W * 0.16, H * 0.8, W * 0.68);
        if (s !== null) {
          L.drag = 'slider';
          L.v = s;
          return;
        }
        for (const c of L.cards) {
          if (Math.hypot(x - W * c.x, y - H * c.y) < 48) {
            L.drag = c;
            return;
          }
        }
      },
      move(x, y, _dx, _dy, { W, H }) {
        if (L.drag === 'slider') {
          L.v = clamp((x - W * 0.16) / (W * 0.68), 0, 1);
        } else if (L.drag && typeof L.drag === 'object') {
          L.drag.x = clamp(x / W, 0.12, 0.88);
          L.drag.y = clamp(y / H, 0.18, 0.66);
        }
      },
      up({ hit }) {
        if (L.drag && typeof L.drag === 'object') {
          L.drag.done = true;
          L.count++;
          hit(1, 0);
          if (L.count >= 2) hit(1, 1);
        } else if (L.drag === 'slider') {
          if (L.v > 0.3) hit(1, 0);
          if (L.v > 0.75) hit(1, 1);
        }
        L.drag = null;
      },
      tick({ ctx, W, H, hit }) {
        ctx.fillStyle = '#f4efe6';
        ctx.fillRect(0, 0, W, H);
        const cfg1: Record<number, [string, string[], string]> = {
          68: ['塞尔：五大言语行为与“适配方向（词→世界 vs 世界→词）”', ['断言类（词拟合世界）', '指令/承诺（世界拟合词）', '宣告类（双向同时改变）'], '世界与语词的双向适配达成度'],
          69: ['格赖斯：合作原则与四大准则（量、质、关系、方式）', ['量的准则（信息适度）', '质的准则（真话有据）', '关系准则（切题关联）'], '会话合作原则契合与隐含推理度'],
          70: ['伽达默尔：合法的前见（Prejudice）与历史视域', ['解释者当下视域', '经典文本历史视域', '效果历史意识纽带'], '两个历史视域的交汇接近度'],
          71: ['利科：情节化编织（Emplotment）将杂乱事件化为叙事统一体', ['突发变故事件 A', '转折抉择事件 B', '反思和解结局 C'], '异质生活事件的叙事统一编织度'],
          72: ['索绪尔：能指（音响形象）与所指（概念）的任意性结合', ['法语 Arbre ↔ 树概念', '汉语 Shu ↔ 树概念', '英语 Tree ↔ 树概念'], '跨语种能指切换与任意性验证度'],
          73: ['皮尔士：符号载体（Representamen）、对象与解释项三元角', ['符号载体（森林浓烟）', '指涉对象（森林大火）', '心灵解释项（警报逃生）'], '三元符号意义生成闭环度'],
          74: ['德里达：延异（Différance）——差异区分与意义无限延宕', ['词项 A（指向 B）', '词项 B（指向 C）', '踪迹 C（永无终极在场）'], '沿符号踪迹链条的追踪深度'],
          75: ['布迪厄：场域（Field）位置与多维资本（经济/文化/社会资本）', ['经济资本筹码', '文化资本（品味文凭）', '社会关系网络资本'], '场域综合资本配置与位置攀升度'],
          76: ['戈夫曼：拟剧理论的前台（Front Stage）印象管理表演', ['标准礼貌仪态面具', '专业得体布景道具', '面向观众的理想化呈现'], '前台印象管理与角色投入度']
        };
        const c = cfg1[modelId] || cfg1[68];

        drawRoundBox(ctx, W * 0.13, H * 0.14, W * 0.74, H * 0.52, 16, '#fffdf8', '#3a6f99', 2);
        txt(ctx, c[0], W / 2, H * 0.21, '#1f2b38', 14, 'center', true);

        L.cards.forEach((card: any, i: number) => {
          const cx = W * card.x;
          const cy = H * card.y;
          ctx.strokeStyle = 'rgba(58,111,153,0.4)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(W / 2, H * 0.42);
          ctx.lineTo(cx, cy);
          ctx.stroke();

          drawRoundBox(ctx, cx - 78, cy - 22, 156, 44, 14, card.done ? '#e8f8f5' : '#fff8e6', card.done ? '#27ae60' : '#f3a52b', 2.5);
          txt(ctx, c[1][i], cx, cy + 5, '#1f2b38', 12, 'center', true);
        });

        if (L.v > 0.76) hit(1, 1);
        drawCanvasSlider(ctx, W * 0.16, H * 0.8, W * 0.68, L.v, `${c[2]}：${Math.round(L.v * 100)}%`, '0%', '100%', '#3a6f99');
        drawFooterHint(ctx, W, H, '直接拖动画面中的三个概念卡片进行连接操作，并将底部滑杆拉至右端');
      }
    },
    2: {
      init() {
        L = { v: 0.2, mode: 0, drag: false, count: 0 };
      },
      down(x, y, { W, H, hit }) {
        const s = hitSlider(x, y, W * 0.16, H * 0.78, W * 0.68);
        if (s !== null) {
          L.drag = true;
          L.v = s;
          return;
        }
        L.mode = (L.mode + 1) % 3;
        L.count++;
        hit(2, 0);
        if (L.count >= 2) hit(2, 1);
      },
      move(x, _y, _dx, _dy, { W, hit }) {
        if (L.drag) {
          L.v = clamp((x - W * 0.16) / (W * 0.68), 0, 1);
          if (L.v > 0.35) hit(2, 0);
          if (L.v > 0.78) hit(2, 1);
        }
      },
      up() {
        L.drag = false;
      },
      tick({ ctx, W, H }) {
        ctx.fillStyle = '#f4efe6';
        ctx.fillRect(0, 0, W, H);
        const cfg2: Record<number, [string, string, string]> = {
          68: ['② 构成性规则（“X 在情境 C 中算作 Y”）与制度性事实（货币/婚姻）', '点击切换：物理纸张 → 集体意向性赋予“法定货币”地位功能', '集体意向性与制度事实建构强度'],
          69: ['② 公然违背准则（Flouting）与会话含义（Implicature）的推导', '点击切换：推荐信仅写“字迹工整、从不迟到” → 推导出“哲学能力平庸”', '言外之意（会话含义）推导深度'],
          70: ['② 视域融合（Fusion of Horizons）与问答逻辑', '点击切换：倾听文本提出的问题 → 修正自身前见 → 达成更高视域融合', '视域重叠融合百分比'],
          71: ['② 同一性（Idem：性格惯性）vs 自我性（Ipse：跨越变化的信守承诺）', '点击切换：容貌境遇剧变 → 依然践行“我向你许诺”的自我性（Ipse）', '跨时间承诺持守与叙事身份稳定度'],
          72: ['② 语言中的纯差异价值系统（Sheep vs Mutton）与组合轴/聚合轴', '点击切换：横向句段组合关系（Syntagmatic）↔ 纵向联想聚合替换', '差异边界切分清晰度'],
          73: ['② 像似符（Icon 肖像）、指示符（Index 烟/风向标）、规约符（Symbol）与无限衍义', '点击切换：解释项转化为下一轮的新符号载体（Unlimited Semiosis）', '无限符号衍义链延展度'],
          74: ['② 逻各斯中心主义二元等级解构（言语/书写）与增补（Supplement）逻辑', '点击切换：颠覆“语音在场高于书写”的传统等级 → 揭示原初书写踪迹', '二元对立解构与中心消解度'],
          75: ['② 惯习（Habitus：被结构化又去结构化的身体图式）与符号暴力', '点击切换：社会历史内化为身体趣味倾向 → 识别隐蔽的符号暴力分类', '反思社会学对惯习与符号暴力的洞察度'],
          76: ['② 前台（礼仪面具）↔ 后台（Back Stage 卸下伪装）切换与表演崩溃挽救', '点击切换：拉开后台帷幕（放松吐槽/排练）↔ 重返前台得体迎客', '前后台边界控制与拟剧切换度']
        };
        const c = cfg2[modelId] || cfg2[68];

        drawRoundBox(ctx, W * 0.13, H * 0.14, W * 0.74, H * 0.5, 16, L.v > 0.6 || L.mode > 0 ? '#e8f8f5' : '#fff8e6', '#27ae60', 2.5);
        txt(ctx, c[0], W / 2, H * 0.23, '#1f2b38', 13.5, 'center', true);
        txt(ctx, `🔄 点击中央卡片切换情境（当前阶段 #${L.mode + 1}）：${c[1]}`, W / 2, H * 0.39, '#1e8449', 12.5, 'center', true);

        drawCanvasSlider(ctx, W * 0.16, H * 0.78, W * 0.68, L.v, `${c[2]}：${Math.round(L.v * 100)}%`, '0%', '100%', '#27ae60');
        drawFooterHint(ctx, W, H, '直接点击中央情境框切换阶段，并将底部滑杆拖动至右端以点亮全部原文');
      }
    }
  };
}
