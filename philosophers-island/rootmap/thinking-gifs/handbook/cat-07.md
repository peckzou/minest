# 第 07 类 · 系统与规律（73–83）

《思维模型手册》第 07 类，11 个模型，火柴人自制 GIF。风格与上批 11 张思想实验 GIF 一致：墨 `#141414`、白纸底、一个奶油黄/强调色、大量留白；每图只放几个词，中文为主、配英文模型名。

- **规格**：每张 60 帧、480×270、6 秒、10 fps，ffprobe 验证过。
- **做法**：每个场景一份 `.js`（`templates/scene.js` 起手），按技能流程走完 contact sheet 看图 + `motion.mjs` 查到 "motion is clean" 才出 GIF；每张都抽开头/中间/结尾 3 帧看过，确认讲的就是这个模型、无裁切遮挡、首尾回到 idle。
- **已知小问题**：
  - Google Fonts 在这台机器上加载失败，文字用 fallback 字体渲染（中文不受影响）；画面风格本身没变。
  - `78-diminishing-returns`：第二轮 contact sheet 的 `idle:0` 首格曾出现标题缺失，是 frames.mjs 首帧渲染抖动，GIF 第 0 帧标题正常，已验证。
  - `80-bottleneck`：结尾箱子在最后 0.5 秒快速滑回起点（循环复位，不是剧情本身的一部分）。
  - `82-leverage-points`：右上角对勾在最后 0.45 秒淡出（循环复位）。
  - `77-feedback-loop`：只表现了“越滚越大、慢慢稳下来”的前半段，稳下来只体现在生长速度放缓（E.soft 收尾），没有单独画一个稳定态。
  - `75-tipping-point` / `82-leverage-points` 初版各有一次 reach-short（手差 11–12 单位够不着目标），已修好：75 把人往骨牌旁挪近、82 把杠杆支点抬高、把人往左挪，复查后 motion 全 clean。

## 索引

| 编号 | 模型名 | GIF | 一句话 | 备注/小问题 |
|---|---|---|---|---|
| 73 | 熵与热力学第二定律 Entropy | `73-entropy.gif` | 整理一次只能好一阵子；想一直好用，就得有人持续照看。 | 书架上的三本书自己歪倒，人扶正后打勾；结尾回到整齐。 |
| 74 | 供给与需求 Supply & Demand | `74-supply-and-demand.gif` | 想买的人变多，能提供的东西变少，价格常常就会动起来。 | 买家 1→3 人、货 3→1 个、价格 ¥10→¥30，带红色上升箭头。 |
| 75 | 临界规模与引爆点 Tipping Point | `75-tipping-point.gif` | 有些事情，前面加一点没什么动静，到了某个程度却会突然不一样。 | 5 张骨牌逐个倒下，最后一张大的撞起黄旗。 |
| 76 | 墨菲定律 Murphy's Law | `76-murphys-law.gif` | 别指望每次都刚好顺利，给重要环节留条能走的备用路。 | 主路灯先绿后红“坏了”，拉黄色备用杆恢复绿灯、打勾；“备用”标签在机器框内。 |
| 77 | 反馈回路 Feedback Loop | `77-feedback-loop.gif` | 有些结果会反过来推动原因，于是事情越滚越大，或慢慢稳下来。 | 盆栽在圆形回路箭头里越长越大、最后长出黄花；见上“稳下来”备注。 |
| 78 | 收益递减规律 Diminishing Returns | `78-diminishing-returns.gif` | 同一件事继续加力，后面每多一点投入，可能换回的越来越少。 | 三滴水先后落下，植物分别长“+很多 / +一点 / +一点点”；初版的云画得像眼镜，已删掉，水滴直接从画面上方落下。 |
| 79 | 创新扩散曲线 Diffusion of Innovations | `79-diffusion-of-innovations.gif` | 爱尝鲜的人先来，不代表其他人会因为同样的理由跟着来。 | 奶油黄小人（尝鲜者）先头顶亮点，其他人逐个跟上，最后一人先冒“?”再加入；右上角计数 0→5 人。 |
| 80 | 瓶颈理论 Bottleneck | `80-bottleneck.gif` | 整条队伍走多快，往往取决于最卡的那个环节。 | 三个箱子在窄门前堵住（“堵了”），门变宽后通过（“通了”）；门是白底描边，见结尾复位备注。 |
| 81 | 古德哈特定律 Goodhart's Law | `81-goodharts-law.gif` | 只盯着把数字做好，可能把真正想做的事带偏。 | 指标板 50→100 时人欢呼，旁边标着“目标”的植物同时枯萎弯倒。 |
| 82 | 系统杠杆点 Leverage Points | `82-leverage-points.gif` | 别只忙着处理后果，也看看改哪里能让事情少出问题。 | 人压下一根小杠杆，整台机器的三盏红灯逐个变绿、打勾。 |
| 83 | 网络效应 Network Effect | `83-network-effect.gif` | 有些工具的价值，会随着相关的人一起加入而改变。 | 一个人先拿着亮起的手机，其他人逐个加入、手机连线，计数 1→5 人；连线在胸口高度，穿过身体后方，不碰脸。 |

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
NODE_PATH=/tmp/stick-playwright/node_modules node ../stick-figure/render-gif.mjs \
  --scene <id> --src <id>.js --dur 6 --fps 10 --fw 480 --fh 270 --out frames-<id>
# 验证后删 frames-<id>
```

场景源码与 GIF 都在 `~/workspace/thinking-models-gifs/handbook/`，与本索引同目录。
