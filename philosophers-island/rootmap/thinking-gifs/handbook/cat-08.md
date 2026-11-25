# 思维模型手册 · 第 08 类“行为与成长”（17 个）

火柴人自制 GIF，风格：墨 `#141414`、白纸底、一个奶油黄/强调色、大量留白；每图只放几个词，中文为主、配英文模型名。规格：每张 60 帧、480×270、6 秒、10 fps。每张都走过 contact sheet 看图 + `motion.mjs` 检查，并抽开头/中间/结尾 3 帧看过 GIF，确认讲的就是这个模型、无裁切遮挡、首尾回到 idle。

已知小问题（全类通用）：Google Fonts 在这台机器上加载失败，文字用 fallback 字体渲染（中文不受影响）；画面风格本身没变。

| 编号 | 模型 | GIF | 一句话 | 备注/小问题 |
|---|---|---|---|---|
| 84 | 控制圈 Circle of Control | `84-circle-of-control.gif` | 先做自己能做的那一步，别让所有担心一起抢走精力。 | 左边灰色“担心 ?”云微微变淡，右边奶油黄圈里“第一步”滑入打勾。motion clean（修过一次：伸手改成指向姿势，消掉了 reach-short）。 |
| 85 | 复利效应 Compound Interest | `85-compound-interest.gif` | 让已经积累的东西，继续帮你积累下一份成果。 | 硬币投进存钱罐，罐里硬币 1 枚长到 6 枚，旁边向上箭头和 +1 飘起。motion clean。 |
| 86 | 正强化与负强化 Reinforcement | `86-reinforcement.gif` | 奖励可能让行为变多，拿掉不舒服的东西，也可能让行为变多。 | 左边星星奖励出现，人物举旗再做一次；右边灰色重担升起搬走，人物又做一次。motion clean。第一版出 GIF 时 55/60 帧是空白（并行渲染抢 CPU 的 transient 失败），已单独重渲并重新抽帧验证通过。 |
| 87 | 内在动机 Intrinsic Motivation | `87-intrinsic-motivation.gif` | 有些事情你愿意做，是因为做的过程本身就让你开心。 | 人物在画板上画出太阳和爱心，左边“奖金”硬币慢慢变淡、不被理会。motion clean。 |
| 88 | 霍桑效应 Hawthorne Effect | `88-hawthorne-effect.gif` | 知道有人在看时，我们的表现可能会变；这不一定是新方法的功劳。 | 大眼睛一出现，右边产量柱子就长高；眼睛一走，柱子落回。motion clean（修过一次：人物从笔记本后面挪到桌子旁边，删掉了被柱子压住的“没人看 / 有人看”标签）。 |
| 89 | 遗忘曲线 Forgetting Curve | `89-forgetting-curve.gif` | 刚看完觉得会了，不代表过几天还能自己说出来。 | “今天”满格、“3 天后”矮下去、“复习后”奶油黄长回并打勾。motion clean。 |
| 90 | 现金流象限 Cashflow Quadrant | `90-cashflow-quadrant.gif` | 看看钱从哪里来、需要你做什么，比只盯着职业名称更清楚。 | 硬币沿着四象限左缘从 E（打工）走到 B（企业），箭头跟上。motion clean（修过一次：硬币和箭头改走左缘，不再压住 E、B 字母）。 |
| 91 | 马斯洛需求层次理论 Maslow's Hierarchy | `91-maslows-hierarchy.gif` | 人的需要不只有钱和成绩，也有安全感、关系、尊重和成长。 | 五层金字塔自下而上逐层变奶油黄，塔顶落一颗星。motion clean（修过一次：`star()` 只画路径不填充，补了填充和描边；星星上移到 -162，不压“成长”二字）。 |
| 92 | 盖洛普 Q12 Gallup Q12 | `92-gallup-q12.gif` | 想知道一个团队为什么没劲，别只问“大家满不满意”。 | 12 个小格逐个打勾，右上角升起一颗爱心。motion clean（修过一次：爱心贝塞尔画扁了，重画成正常心形）。 |
| 93 | 心流 Flow | `93-flow.gif` | 难度刚好够你伸手去够，又知道下一步做什么时，人更容易投入进去。 | “太难 / 刚好 / 太容易”三条横杆，中间奶油黄那条左端的圆环被抓住变橙发光。motion clean（修过一次：横杆左移、圆环移到杆左端，手能真正够到；标签不再被杆边压住）。 |
| 94 | 优势思维 Strengths Thinking | `94-strengths-thinking.gif` | 别把全部精力都放在“我哪里不行”，也看看自己怎样更容易做出贡献。 | 左边“短板”小苗一直那么小，右边“优势”浇水后长高开花。motion clean。 |
| 95 | 认知失调 Cognitive Dissonance | `95-cognitive-dissonance.gif` | 当做法和自我认识对不上时，我们常会先替自己找个解释。 | 头顶“想省钱”气泡和购物袋对峙，袋子缩小，旁边弹出“就这一次”。motion clean（修过一次：借口纸条从人物身上挪到右边，不再被身体挡住）。 |
| 96 | 智商与情商 IQ & EQ | `96-iq-eq.gif` | 想得清楚和处理好情绪，是不同能力，都可以具体练。 | 左边脑子（智商）和右边爱心（情商）两根竖条先后从底部涨满，各打一个勾。motion clean（修过一次：填充条改成从底部往上长，不再盖住“智商 IQ / 情商 EQ”标签）。 |
| 97 | 大五人格 Big Five | `97-big-five.gif` | 人不像五种固定款式，更像在几条性格刻度上各有位置。 | 开放、尽责、外向、宜人、情绪五条滑杆，圆点各在不同位置，尽责和情绪两个点轻轻滑动一下。motion clean。 |
| 98 | DISC 行为风格模型 DISC Model | `98-disc-model.gif` | 可以借四种风格聊沟通，但别用四个字母给一个人定型。 | D、I、S、C 四格逐个变奶油黄，下面一行小字“聊沟通的工具，不是人的标签”。motion clean。 |
| 99 | 主动回忆 Active Recall | `99-active-recall.gif` | 合上书，试着自己说出来，再看看漏了什么。 | 书合上变奶油黄封面，气泡“我来说说看…”，书再打开，右上角打勾。motion clean（修过一次：书架加了一根横档，合上的书不再悬空）。 |
| 100 | 现时偏差 Present Bias | `100-present-bias.gif` | 计划时愿意等，真到眼前，却更难拒绝马上舒服一点。 | 左边“现在 · 小”蛋糕亮起，右边钟表下“以后 · 大”蛋糕变淡，人物伸手拿了眼前小的。motion clean。 |

## 复现

```bash
# 出 contact sheet（看图检查）
NODE_PATH=/tmp/stick-playwright/node_modules node ~/workspace/custom-skills/stick-scene/scripts/frames.mjs \
  --scene <id> --src <id>.js \
  --frames "idle:0,idle:2.5,s:0.8,s:1.6,s:2.4,s:3.2,s:4.0,s:4.8,s:5.6" --fw 400 --out /tmp/<id>-sheet.png
# 查动作
NODE_PATH=/tmp/stick-playwright/node_modules node ~/workspace/custom-skills/stick-scene/scripts/motion.mjs \
  --scene <id> --src <id>.js
# 出 GIF（60 帧、480×270、10fps；GIF 落在 frames-<id> 的上一级）
NODE_PATH=/tmp/stick-playwright/node_modules node ~/workspace/thinking-models-gifs/stick-figure/render-gif.mjs \
  --scene <id> --src <id>.js --dur 6 --fps 10 --fw 480 --fh 270 --out frames-<id>
# 验证（帧数 + 抽帧）
ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 <id>.gif
ffmpeg -v error -y -i <id>.gif -vf "select='eq(n\,0)+eq(n\,30)+eq(n\,59)',tile=3x1" -frames:v 1 /tmp/<id>-check.png
# 验证通过后删掉 frames-<id> 临时目录
```

注意：`handbook/` 目录是各类别并行共用的，出 sheet / 出 GIF / 删临时目录时不要用 `*.js` 通配循环，只写自己这 17 个的显式名单，否则会跑到别人的场景上去。并行渲染时 CPU 会抢，`render-gif.mjs` 可能卡住或出空白帧——遇到就杀掉重跑单个，一般几秒就好。
