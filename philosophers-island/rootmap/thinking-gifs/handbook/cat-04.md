# 思维模型手册 · 第 04 类“沟通与影响”（8 张）

火柴人自制 GIF，风格：墨 `#141414`、白纸底、一个奶油黄/强调色、大量留白；每张 60 帧、480×270、6 秒、10 fps。场景源码与 GIF 同名，放在 `~/workspace/thinking-models-gifs/handbook/`。

- **做法**：每个场景一份 `.js`（`templates/scene.js` 起手），按技能流程走完 contact sheet 看图 + `motion.mjs` 查动作才出 GIF；每张都抽开头/中间/结尾 3 帧看过画面，确认讲的就是这个模型、无裁切遮挡、首尾回到 idle。
- **已知小问题**：
  - Google Fonts 在这台机器上加载失败，文字用 fallback 字体渲染（中文不受影响）；画面风格本身没变。
  - 43、44、47、49 在回程/行走末尾有轻微脚步滑动（motion 报告 skate，-3.3～-5.3/帧，10fps 的 GIF 里不到一帧），肉眼看不出来，留着。
  - 44 专家指过去的手够不着目标（motion 报告 reach-short 13）：指向姿势，视觉上手指着缺失的那级台阶，是对的。
  - 49 的小人只爬到第三级横档（结论），顶级“认定”只点亮不站人——梯子再高头就顶到标题了；人物用了 0.8 缩放。
  - 为首尾衔接做的循环复位（43 的植物缩回小苗、44 的台阶变回虚线、46 的圆点熄灭、47 的水变回灰色、50 的帘子重新盖上）不是剧情本身的一部分。

## 索引

| 编号 | 模型名 | GIF | 一句话 | 备注/小问题 |
|---|---|---|---|---|
| 43 | 神奇比例 Magic Ratio | `43-magic-ratio.gif` | 小人一滴一滴浇水，植物一点点长高、开花，爱心出现。 | 回程末尾轻微脚滑（5.23–5.27s） |
| 44 | 知识的诅咒 Curse of Knowledge | `44-curse-of-knowledge.gif` | 专家站在书堆上，指着缺了一级的台阶；缺的那级补上后，学习者走上台阶。 | 指过去的手够不着目标（指向姿势）；学习者回程末尾轻微脚滑 |
| 45 | 金字塔原理 Pyramid Principle | `45-pyramid-principle.gif` | “结论”先落到最上面，再一层层叠上“论点”“论据”，成金字塔，打勾。 | motion clean |
| 46 | 影响力六原则 Influence Principles | `46-influence-principles.gif` | 两个人之间六个圆点逐个变黄点亮，爱心出现，两人点头。 | motion clean |
| 47 | 框架效应 Framing Effect | `47-framing-effect.gif` | 同一杯半杯水，牌子从“只剩一半”翻成“还有一半”，水变黄、太阳出来。 | 回程末尾轻微脚滑（5.22–5.23s） |
| 48 | 非暴力沟通 Nonviolent Communication | `48-nonviolent-communication.gif` | 两个人之间依次落下“事实、感受、需要、请求”四张卡，爱心升起，两人靠近。 | motion clean |
| 49 | 推论阶梯 Ladder of Inference | `49-ladder-of-inference.gif` | 小人爬梯子：观察→解释→结论，顶上“认定”亮起一个“？”，再爬回第一级，眼睛亮起、打勾。 | 只爬到第三级（见上）；回程轻微脚滑 |
| 50 | 乔哈里视窗 Johari Window | `50-johari-window.gif` | 四格窗：“公开”本来就亮；对方指向“盲点”格，帘子升起露出小镜子人，那格也亮了，打勾。 | motion clean；绿勾放在窗下，不压标题 |
