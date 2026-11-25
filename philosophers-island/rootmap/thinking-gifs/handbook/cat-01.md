# 思维模型手册 · 第 01 类“认知与推理”（17 个）

火柴人自制 GIF，风格：墨 `#141414`、白纸底、一个奶油黄/强调色、大量留白；每图只放几个词，中文为主、配英文模型名。规格：每张 60 帧、480×270、6 秒、10 fps。每张都走过 contact sheet 看图 + `motion.mjs` 检查，并抽开头/中间/结尾 3 帧看过 GIF，确认讲的就是这个模型、无裁切遮挡、首尾回到 idle。

已知小问题（全类通用）：Google Fonts 在这台机器上加载失败，文字用 fallback 字体渲染（中文不受影响）；画面风格本身没变。

| 编号 | 模型 | GIF | 一句话 | 备注/小问题 |
|---|---|---|---|---|
| 01 | 启发式法则 Heuristic | `01-heuristic.gif` | 给小事设几条靠谱的经验规则，就不用每次都从头想。 | 人物伸手指向规则板，中间卡片“先问一句”亮起打勾。motion 只有 reach-short（指向姿势，手够不着远处的板，画面上是指向）。 |
| 02 | 矛盾律 Non-contradiction | `02-non-contradiction.gif` | 说一件事时，前后别自己打架；先确认大家说的是同一回事。 | 两张卡“今天下雨 / 今天没下雨”，中间 ≠，下面那张打叉、上面打勾。motion 只有 reach-short。 |
| 03 | 第一性原理 First Principles | `03-first-principles.gif` | 先弄清最基本的事实，再想办法，不急着照搬别人。 | “想当然 / 一直这样 / 别人说的”三块逐个飘走，只剩奶油黄的“最底层”发光打勾。motion 只有 reach-short。 |
| 04 | 马斯洛之锤 Maslow's Hammer | `04-maslows-hammer.gif` | 别因为手里只有一把锤子，就把所有问题都当成钉子。 | 锤子敲钉子打勾、敲螺丝打叉，换螺丝刀后螺丝打勾。锤子画得比较小，像个小拍子；结尾锤子淡回原位是循环复位。motion 只有 reach-short（三段敲击）。 |
| 05 | 批判性思维 Critical Thinking | `05-critical-thinking.gif` | 听到一个说法，先别急着点头，也别急着抬杠。 | 气泡“大家都说好”，放大镜（透明镜片，字透出来）罩上去，旁边弹出红色 ? 和打勾。motion 只有 reach-short。 |
| 06 | 非黑即白思维 Black-and-White Thinking | `06-black-and-white.gif` | 一次没做好，不等于你整个人都不行。 | 黑白两端条形中间长出灰色带，“全不行 / 全都行”各在两端，打勾。motion 只有 reach-short。 |
| 07 | 苏格拉底式提问法 Socratic Questioning | `07-socratic-questioning.gif` | 多问几句好问题，常常比急着给答案更有用。 | 一人问“为什么？”，两个 ? 飘向另一人，他头顶灯泡亮起，两人欢呼。motion clean。 |
| 08 | 原型理论 Prototype Theory | `08-prototype-theory.gif` | 我们认识一类东西时，往往先想到一个“典型样子”。 | 三只鸟站一排，中间典型的大鸟亮起奶油黄光晕打勾，旁边两只保持灰色。鸟画得比较抽象（圆身 + 尖嘴），在“鸟”标签语境里能认出来。motion 只有 reach-short。 |
| 09 | 奥卡姆剃刀 Occam's Razor | `09-occams-razor.gif` | 先检查简单、常见、说得通的原因，别急着编一个大故事。 | 左边“大故事”乱线团变淡，右边“简单的”一条直线亮起打勾。motion 只有 reach-short。 |
| 10 | 幸存者偏差 Survivorship Bias | `10-survivorship-bias.gif` | 成功的人很显眼，没成功的人却常常不在画面里。 | 舞台上三个成功者打光，右边幕布拉开露出三个灰色小人；结尾幕布拉回是循环复位。motion 只有 reach-short。 |
| 11 | 权威偏差 Authority Bias | `11-authority-bias.gif` | 头衔能告诉你他擅长什么，却不能让他说的每句话都自动正确。 | 戴帽子的“专家”说“都听我的”，放大镜罩上去打叉，左上角出现“再想想 ✓”。motion 只有 reach-short。 |
| 12 | 可得性启发式 Availability Heuristic | `12-availability-heuristic.gif` | 你越容易想起来的事，越容易被你当成经常发生的事。 | 气泡里大新闻纸飞机慢慢变小，下面“实际发生”柱子长高打勾。纸飞机是 `plane()` 画的，会在气泡里轻轻漂移。motion 只有 reach-short。 |
| 13 | 负面偏差 Negativity Bias | `13-negativity-bias.gif` | 一句难听的话，可能在脑子里比十句好话待得更久。 | 圆圈里十个奶油黄小点（好话 ×10），中间一个黑点（坏话 ×1）先胀大、再被按小，打勾。motion 只有 reach-short。 |
| 14 | 确认偏误 Confirmation Bias | `14-confirmation-bias.gif` | 我们很容易只看见那些能证明“我早就说对了”的信息。 | 人物先朝右只看 ✓ 卡，转身后看到左边暗着的 ✗ 卡也亮起来，头顶打勾。motion clean。 |
| 15 | 虚假两难 False Dilemma | `15-false-dilemma.gif` | 听到“不是这样，就是那样”，先看看有没有被藏起来的第三条路。 | A、B 两条路中间画出第三条虚线，人走过去再走回来，打勾移到路旁不挡字。motion clean（修过一次：走回段改成倒步走，消掉了 3.2 秒处的跳帧）。 |
| 16 | 锚定效应 Anchoring | `16-anchoring.gif` | 最先看到的数字，可能悄悄拉住后面的判断。 | 大大的 ¥999 带着锚钩淡出飘走，价签从“¥ ?”落到“¥99”打勾。锚钩画得比较简略，像个小钩子。motion 只有 reach-short。 |
| 17 | 能力圈 Circle of Competence | `17-circle-of-competence.gif` | 知道自己真正懂什么，也知道哪些地方还需要求助。 | 圈里“会做的 / 懂的”打勾，圈外的“?”卡片递给圈外助手，助手接住打勾。“懂的”标签有一半被主角的腿挡住。motion 只有 reach-short（修过两次：助手接卡的姿势从反手改成正手，消掉了穿脸和肘部外翻）。 |

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
ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames,width,height,r_frame_rate -of csv=p=0 <id>.gif
```

注意：`handbook/` 目录是各类别并行共用的，出 sheet / 出 GIF 时不要用 `*.js` 通配循环，只写自己这 17 个的显式名单，否则会跑到别人的场景上去。
