# 思维模型手册 · 第 05 类“伦理与协作”（12 张）

火柴人自制 GIF，风格：墨 `#141414`、白纸底、一个奶油黄/强调色、大量留白；中文为主、配英文模型名。

- **规格**：每张 60 帧、480×270、6 秒、10 fps；`ffprobe` 逐张数过帧，抽开头/中间/结尾 3 帧看过画面。
- **做法**：每个场景一份 `.js`（`templates/scene.js` 起手），按技能流程走完 contact sheet 看图 + `motion.mjs` 查到 "motion is clean" 才出 GIF；每张的头尾帧都对过，循环回到 idle。
- **已知小问题**：
  - Google Fonts 在这台机器上加载失败，文字用 fallback 字体渲染（中文不受影响）；画面风格本身没变。
  - 56、59 与上批 11 张里的 `11-veil-of-ignorance`、`06-prisoners-dilemma` 同题，但场景是新写的：56 是三扇关着的“?”门 + “公平”规则卡（上批是幕布升起 + 天平），59 是隔桌翻“背叛”牌、掉币、各扣 3 分、再浮现“合作：各只 -1”（上批是牢房 + 得失矩阵表）。
  - 60 结尾有个循环复位：左边的人直起身后，在最后 0.6 秒又弯回杯子旁（idle 本来就是弯着的），不是剧情本身的一部分。
  - 58 开头那帧，整橙子中间有一道切线（两个半圆在原位重合造成的），看起来像“正要切”，不影响阅读。
  - 61 第一版出 GIF 时 render 尾部 6 帧截成了空白（渲染器截图竞态，与场景无关），已重出并逐帧验过，尾帧正常。

## 索引

| 编号 | 模型 | GIF | 一句话 | 备注/小问题 |
|---|---|---|---|---|
| 51 | 理性人标准 Reasonable Person | `51-reasonable-person.gif` | 别拿事后知道的一切，去要求当时的人早就应该知道。 | 小人指“当时”的薄纸；“事后”大纸展开后被摇头否掉，小纸打勾。 |
| 52 | 中道原则 Golden Mean | `52-golden-mean.gif` | 做事讲究合适的分寸，不一定越多越好，也不一定两边各让一半。 | 天平一边“太少”一边“太多”，摆平后“刚刚好”打勾。 |
| 53 | 黄金法则 Golden Rule | `53-golden-rule.gif` | 做一件会影响别人的事之前，先想想：换成我，我愿不愿意？ | 礼物送过去又送回来，两人头顶各一颗心。初版礼物挡脸，已降到胸前。 |
| 54 | 白金法则 Platinum Rule | `54-platinum-rule.gif` | 好意想送到地方，得先知道对方需要什么，而不只看自己喜欢什么。 | 自己喜欢的咖啡被摇头，想一想换成对方要的书，对方欢呼。 |
| 55 | 绝对命令 Categorical Imperative | `55-categorical-imperative.gif` | 别只问“这样对我有没有好处”，也问“如果大家都这样做，我还认不认这条规则”。 | 一张纸扔地上没什么，三个影子人跟着扔，地上满了——改指垃圾桶，打勾。 |
| 56 | 无知之幕 Veil of Ignorance | `56-veil-of-ignorance.gif` | 制定规则时，先别知道自己会站在最有利还是最吃亏的位置。 | 三扇门都关着（门后是谁不知道），先拿起“公平”规则卡打勾。场景与上批不同。 |
| 57 | 可信度四核心 Trust Core | `57-trust-core.gif` | 让人放心，不只靠人好，也不只靠有本事。 | 四块砖一块块摞上去：诚信、能力、善意、结果，塔立住打勾。 |
| 58 | 双赢思维 Win-Win | `58-win-win.gif` | 先弄清双方真正要什么，有时就不用非得一赢一输。 | 桌上一个橙子一分为二，一人一半，两人欢呼。见“已知小问题”里的切线。 |
| 59 | 囚徒困境 Prisoner's Dilemma | `59-prisoners-dilemma.gif` | 两个人都怕自己吃亏，最后却可能一起吃亏。 | 两人都翻出“背叛”，各掉一枚币、各扣 3 分；桌上浮现“合作：各只 -1”。场景与上批不同。 |
| 60 | 汉隆剃刀 Hanlon's Razor | `60-hanlons-razor.gif` | 先别急着认定别人故意针对你，有时只是没看见、没听懂或没做好。 | 打翻杯子，先想“故意的？”，再看见脚边石头，改口“没看见？”，伸手扶一把。 |
| 61 | 激励机制 Incentives | `61-incentives.gif` | 想理解人为什么这样做，也看看规则在奖励什么。 | 表盘指“快”摇出三枚币，指“好”摇出一颗星。第一版 GIF 尾部空白已重出。 |
| 62 | 比较优势 Comparative Advantage | `62-comparative-advantage.gif` | 分工不只看谁做得快，还要看各自为此放弃了什么。 | A 拿“面包”、B 拿“捕鱼”，时钟从 6 小时变成 3 小时。 |

## 复现

```bash
cd ~/workspace/thinking-models-gifs/handbook
# 出 contact sheet（看图检查）
NODE_PATH=/tmp/stick-playwright/node_modules node ~/workspace/custom-skills/stick-scene/scripts/frames.mjs \
  --scene <id> --src <id>.js \
  --frames "idle:0,idle:2.5,s:0.8,s:1.6,s:2.4,s:3.2,s:4.0,s:4.8,s:5.6" --fw 400 --out /tmp/<id>-sheet.png
# 查动作
NODE_PATH=/tmp/stick-playwright/node_modules node ~/workspace/custom-skills/stick-scene/scripts/motion.mjs \
  --scene <id> --src <id>.js
# 出 GIF（60 帧、480×270、10fps；GIF 落在 frames-<id> 的上一级，验完删 frames-<id>）
NODE_PATH=/tmp/stick-playwright/node_modules node ~/workspace/thinking-models-gifs/stick-figure/render-gif.mjs \
  --scene <id> --src <id>.js --dur 6 --fps 10 --fw 480 --fh 270 --out frames-<id>
# 验帧数
ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames,width,height -of csv=p=0 <id>.gif
```
