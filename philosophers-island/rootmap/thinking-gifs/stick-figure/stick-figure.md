# 思维模型 GIF 集 · 火柴人自制版（11 张）

补《思维模型 GIF 集》第二节“仍缺清单”里的 11 个思想。这 11 个在网上找不到独立的免费真动图，所以用火柴人技能（nilbuild/stick-scene，MIT）自己画了动画，再逐帧拼成 GIF。

- **风格**：墨 `#141414`、白纸底、一个奶油黄/强调色、大量留白；火柴人是主角，每图只放几个词，中文为主、配英文思想名。
- **规格**：每张 60 帧、480×270、6 秒、10 fps。
- **做法**：每个场景一份 `.js`（`templates/scene.js` 起手），按技能流程走完 contact sheet 看图 + `motion.mjs` 查到 "motion is clean" 才出 GIF；每张都抽开头/中间/结尾 3 帧看过画面，确认讲的就是这个思想、无裁切遮挡、首尾回到 idle。
- **已知小问题**：
  - Google Fonts 在这台机器上加载失败，文字用 fallback 字体渲染（中文不受影响）；画面风格本身没变。
  - `03-experience-machine.gif` 结尾回程最后 2 帧（60fps 下 0.03 秒，10fps 的 GIF 里不到一帧）有轻微脚步滑动，motion 未能全 clean，肉眼看不出来，留着。
  - `10-zombie.gif` 欢呼拍里左边人物的手臂会碰到头顶的星光光晕，不影响阅读。
  - `07-brain-in-vat.gif` 的脑子画得比较抽象（圆圈加波浪线），放在缸 + 电线的语境里能认出来。
  - 为首尾衔接做的循环复位（01 的人走回洞里重新上锁、04 的方块淡回原堆）不是剧情本身的一部分。

## 索引

| # | 思想 | GIF | 一句话 | 场景源码 |
|---|---|---|---|---|
| 01 | 洞穴寓言 Plato's Cave | `01-cave.gif` | 被锁的人只看影子，以为影子就是真实；走出洞口才看见太阳。 | `01-cave.js` |
| 02 | 中文房间 Chinese Room | `02-chinese-room.gif` | 屋里人按规则书回卡片，答得全对，却一个字也不懂。 | `02-chinese-room.js` |
| 03 | 经验机器 Experience Machine | `03-experience-machine.gif` | 拉杆接上快乐机器，奖杯、太阳、爱心全来了——但这是真的快乐吗？ | `03-experience-machine.js` |
| 04 | 效用怪物 Utility Monster | `04-utility-monster.gif` | 天平一边的小人不断进贡快乐，怪物全吃掉还越长越大。 | `04-utility-monster.js` |
| 05 | 堆垛悖论 Sorites Paradox | `05-sorites.gif` | 谷粒一粒粒拿走，10→1，什么时候起它不再是“一堆”？ | `05-sorites.js` |
| 06 | 囚徒困境 Prisoner's Dilemma | `06-prisoners-dilemma.gif` | 两人都怕吃亏选了背叛，结果一起输；合作本可以各只输一点。 | `06-prisoners-dilemma.js` |
| 07 | 缸中之脑 Brain in a Vat | `07-brain-in-vat.gif` | 缸里的脑子连着屏幕，屏幕里阳光公园有人散步——你看到的，真的吗？ | `07-brain-in-vat.js` |
| 08 | 孪生地球 Twin Earth | `08-twin-earth.gif` | 两边都叫“水”，一边是 H₂O，另一边是 XYZ。 | `08-twin-earth.js` |
| 09 | 玛丽房间 Mary's Room | `09-mary-room.gif` | 玛丽从书里知道关于红色的一切，直到第一次亲眼看见红苹果。 | `09-mary-room.js` |
| 10 | 僵尸论证 Zombie Argument | `10-zombie.gif` | 两个人行动一模一样，一个有感受，一个没有——感受是干什么用的？ | `10-zombie.js` |
| 11 | 无知之幕 Veil of Ignorance | `11-veil-of-ignorance.gif` | 不知道自己会是谁，再来定规则；天平摆平，打勾。 | `11-veil-of-ignorance.js` |

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
NODE_PATH=/tmp/stick-playwright/node_modules node render-gif.mjs \
  --scene <id> --src <id>.js --dur 6 --fps 10 --fw 480 --fh 270 --out frames-<id>
```

`render-gif.mjs`（本目录）是自写的拼 GIF 脚本：用 playwright 沿 `s:0.0–5.9` 每 0.1 秒取一帧，再用 ffmpeg 拼成循环 GIF。Playwright 装在 `/tmp/stick-playwright`（`playwright@1.56.1` + Chromium Headless Shell）。
