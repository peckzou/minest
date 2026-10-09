# Minest 44.5 交接：Pet 联动、Mini Pet AI 入口、海底世界

更新：2026-10-08 · 状态：**已在网页预览中验证，尚未部署，尚未在手机上实测**

部署流程看 `DOCS/HANDOFF_44.4_DEPLOY.md` 第 2 节（标准发布步骤）和第 6 节（禁止提交的文件）。本文档说明 44.5 做了什么、代码在哪、怎么部署和验证。

---

## 1. 功能总览

### 1.1 奖励联动（主页面 → Pet）
- **打勾**（卡片或清单项完成）：
  - Mini Pet 小跳一下，看向那张卡，冒出 ✓💜。
  - 20 秒内连续打勾会越来越兴奋：第 3 个挥手，第 5 个以上翻滚。
- **单环闭合**（专注 / 打勾 / 目标，每个环每天一次）：螺旋上升，冒出该环颜色的爱心。
- **三环全闭合**：大转圈加彩纸。Pet Raising 里的**宝箱得到一把钥匙**（见 1.6）。
- **领取勋章**：挥手，冒出 🏅。
- **发音评测 ≥ 85 分**：鼓掌。
- **亲密度**：以上奖励都会变成 Octo 的亲密度经验，先进队列，打开 Pet Raising 时一次领取，有飞入爱心和提示。数值如下：

  | 奖励 | 亲密度 |
  |---|---|
  | 打勾 | +0.5 |
  | 单环闭合 | +3 |
  | 三环全闭合 | +6 |
  | 勋章 | +10 |
  | 发音高分 | +1 |

  每 20 点升一级，升级沿用原有的庆祝动画和衣柜解锁。勋章送小皇冠，连胜勋章送围巾，三环全闭合送珍珠粉皮肤。

### 1.2 Light FX 联动
- **烟花**：每颗烟花炸开时，Mini Pet 都会转头抬头看过去，大烟花时转圈。
- **激光**：跟着节奏摇摆。
- **聚光灯**：看向舞台。
- **开场特效**：气球时伸手，爱心时冒出 💖。

### 1.3 Mini Pet ⇄ Octo 同步
- **外观**：以 Pet Raising 里 Octo 的穿着为准。在 App 里（主页面是本地文件、Pet Raising 在 https，跨域）会整套导入；网页同源时两边共用存储，自动一致。
- **动作**：Pet Raising 开着且 Mini Pet 显示时，Octo 的动作、转圈、照顾、回小屋都会映射到 Mini Pet。
- **基础状态**：Octo 在小屋睡觉，Mini Pet 就漂浮打盹，关掉 Pet Raising 后仍保持。
- **外界干扰**：点 Mini Pet、奖励、烟花、你在打字时会临时打断同步，结束后回到基础状态。

### 1.4 学习活动陪伴（Mini Pet）
- **打字**（任何输入框）：打字 / 敲键盘的动作，看向输入的位置。
- **快速编辑卡片**：张望。
- **翻卡**：思考，冒出 📖。
- **自评**：Struggled 挠头，Hesitated 思考，Mastered 开心。
- **AI 建板 / 分析进行中**：思考、挠头。

### 1.5 Mini Pet 作为 AI 入口
- **单击**：弹出 6 个液态玻璃气泡：🎙 Talk / 🧱 Build / 🔍 Analyze / 🗣 Speak / 🐙 Octo / 💬 Inbox（带未读数）。
- **长按**（0.45 秒）：对讲机模式，按住时只收集文字，松手立即发送。
- **双击**：进入 Pet Raising。
- **语音指令**：先在本地判断意图，命中就直接打开对应功能并简短语音回应：
  - 建板："帮我建一个…看板" / build a board
  - 分析："分析一下我的看板" / 今天该做什么
  - 发音："…的发音"，自动取出英文单词
  - "放烟花"
  - "去看看小章鱼"

  没命中的照常聊天。
- **跟着 AI 状态表演**：聆听时张望，思考时挠头，说话时点头；建板 / 分析完成时庆祝。
- **主动小提示**：只用本地数据，内容包括过期卡、今天到期、差几个勾闭合环、发音练习、复习、想念 Octo、建板。
  - 打开页面 90 秒后才可能出现，间隔 ≥ 15 分钟，每天最多 6 条。
  - 打字、语音、有弹窗时不出现；连续 3 条被忽略或关闭，当天不再提示。
  - **20 秒没点就收进消息中心**（Mini Pet 上出现红色未读数）。点提示执行，点 ✕ 关闭。

### 1.6 Pet Raising 里的新东西
- **液态玻璃**：所有控件统一成主页面菜单按钮的玻璃样式（`glass-v1.js`）。衣柜和渲染设置从右上角弹出，点框外关闭。
- **全屏**：没有顶栏，外层页面左上角的 ✕ 负责关闭；安全区高度由外层通过 URL 传入；左下角是 60 px 的语音按钮。
- **手持勋章**：衣柜 → Hand → Badge in Hand。触手举着你最新的勋章（用勋章墙的渲染图做成 3D 勋章），会自转、翻面、抛接。领到新勋章会立刻换成新的。
- **宝箱**：海底左侧一个浅灰蓝木箱，金色包边。
  - 三环全闭合得到钥匙后，宝箱发光并显示"🔑 Tap to open"，**只有点宝箱才会打开**。
  - 打开时 Octo 游过去开箱，金光涌出，一枚新勋章飞到它手上。宝箱里共 9 枚收藏，第一次开箱额外送海盗帽。
- **10 件新物品**：

  | 物品 | 解锁 |
  |---|---|
  | 泡泡棒 | Lv 2 |
  | 棒棒糖 | Lv 3 |
  | 派对帽 | Lv 3 |
  | 墨镜 | Lv 4 |
  | 铅笔 | Lv 4 |
  | 放大镜 | Lv 5 |
  | 花环 | Lv 5 |
  | 沙滩球 | Lv 6 |
  | 尤克里里 | Lv 7 |
  | 海盗帽 | 第一次开宝箱 |

  手持玩具都有各自的玩法动画。另外给 Pet Raising 的精简版 three.js 补了球体生成器，旧配饰里的"球"也变圆了。
- **房子**：
  - 默认改成**贝壳屋**：矮扇贝立在后面、开口朝前，薄荷绿蛋形屋身，珍珠舷窗，厚波浪贝壳屋檐，十字圆窗，拱门。
  - 原珊瑚小屋改为 Lv 3 解锁；衣柜新增 **Home** 标签页可切换。
- **海底**：
  - 黄色蝴蝶鱼换成**鮟鱇鱼**（发光诱饵、尖牙、会张嘴）和**寄居蟹**（会缩壳）。
  - 鱼身加了立体光影（受光、腹部暗部、边缘暗化、高光、轮廓光、投影）。
- **互动**：
  - **按住拖动引诱 Octo 游动**：手指处出现发光诱饵，Octo 带惯性追过去。原来的单击游过去已取消。
  - **单击海底的东西**：只有被点的那个做小动作并冒泡泡，Octo 看过去并做出相应表情。

---

## 2. 改动的文件

### 主页面
- **`iPhone44.5.html`**（新版本，基于 44.4）：
  - 奖励总线、Mini Pet 控制接口和反应、Light FX 事件、AI 入口（气泡菜单、长按对讲）、主动提示和消息中心、液态玻璃样式、`window.MinestAI`。
  - 语音脚本内嵌位置的标记：`/* voice-realtime-45.js (inlined so the iOS app bundle has it too) */`
- **`voice-realtime-45.js`**（语音源文件，新）：在 44 的基础上增加语音状态广播、对讲（`ptt`）、语音指令路由。改源文件后要重新内嵌进 `iPhone44.5.html`。

### Pet Raising（`octopus-pet-raising-v6/`，App 和网页都从 Vercel 加载）

| 文件 | 状态 | 内容 | 版本 |
|---|---|---|---|
| `reward-v1.js` | 新 | 领取奖励队列、亲密度、礼物、宝箱钥匙、最新勋章 | 4452 |
| `sync-v1.js` | 新 | 向主页面同步外观、动作、小屋状态、最新勋章 | 4452 |
| `glass-v1.js` | 新 | 统一液态玻璃；右上弹框点外关闭 | 445 |
| `chest-v1.js` | 新 | 宝箱 | 4457 |
| `care-v2.js` | 改 | `__octoCare.reward / fx / toast / celebrate / octo` | 445 |
| `cosmetics-v1.js` | 改 | 手持勋章与玩具、10 件新物品、球体生成器；新旧 three.js 的着色器兼容 | 4452 |
| `wardrobe-v1.js` | 改 | Hand 分组、新物品名称、Home 标签页 | 4455 |
| `house-v1.js` | 改 | 房屋风格（shell / cottage）、贝壳屋 | 4461 |
| `ocean-life-v3.js` | 改 | 鮟鱇鱼、寄居蟹、鱼的立体光影、单击只戳被点中的物体 | 4454 |
| `interact-v1.js` | 改 | 拖动诱导游动、对 `ocean-tap` 做出反应 | 445 |
| `index.html` | 改 | 加载顺序和以上缓存参数 | — |

另外：
- 主页面里 iframe 的地址是 `octopus-pet-raising-v6/index.html?motion-set=p0&v=445&pexit=1&sat=…&sab=…`。
- Mini Pet 加载的 cosmetics 是 `?v=4452`。

**不要一起提交**：
- `octopus-pet-raising-v6/archive/`
- `octopus-pet-raising-v6/libs/ort-wasm*`（未提交的大型 wasm 文件，不属于 44.5）

`DOCS/` 下的交接文档（44.4、44.5）还没提交，可以随本次发布一起提交。

### 依赖的线上资源（已在线，无需改动）
- `badge-index/thumbs/<勋章id>.webp`：手持勋章和宝箱用。
- 连胜勋章 `strike-N-days` 对应 `strike-N.webp`。
- 服务器允许跨域，App 里能加载。

---

## 3. 接口和数据（以后开发参考）

**主页面**
- `window.MinestRewards`：
  - `emit(kind, detail)`：广播 `minest:reward`，同时计入亲密度队列。
  - `rings(state, day)`：按天去重，判断各环首次闭合。
  - `setLatestBadge(id)`：设置最新勋章。
- `window.__miniPetCtl`：`play(name)` / `lookAt(x, y, ms)` / `hop()` / `spin(dir)` / `burst(glyphs, n, opts)` / `say(text, ms)` / `setBase(name)` / `center()` / `visible` / `idle`。
- `window.MinestAI`：`openBuilder(prompt)` / `openPronunciation(word)` / `analyze()` / `board()`。
- `window.MinestTips`：`show(id)` / `ideas()` / `inbox()`。
- `window.MinestRealtimeVoice43`：在 44 的基础上增加 `ptt('start' | 'end')`、`state`、`active`。

**事件**

| 事件 | 来源 / 内容 |
|---|---|
| `minest:reward` | 奖励 |
| `fbfx:burst {x, y, type, big}` | Light FX 烟花炸开 |
| `fbfx:mode` | Light FX 切换模式 |
| `fbfx:intro` | Light FX 开场特效 |
| `minest:minipet-tap {double}` | Mini Pet 单击 / 双击 |
| `minest:minipet-hold {phase}` | Mini Pet 长按开始 / 结束 |
| `minest:voice-state {state}` | 语音状态 |
| `minest:ai {what: built \| analyzed \| command}` | AI 完成或命中指令 |
| `minest-latest-badge` | 最新勋章变化 |
| `ocean-tap {kind, x, y}` | Pet Raising 里单击海底物体 |

**iframe 消息**

| 消息 | 方向 | 用途 |
|---|---|---|
| `{type: 'minest-reward', action: hello / batch / ack / badge}` | 双向 | 奖励队列交接和最新勋章 |
| `{type: 'minest-pet-sync', cosmetics / motion / spin / house / care / hello / latestBadge}` | Pet Raising → 主页面 | 外观和动作同步 |

**Pet Raising 里的全局对象**
- `__octoChest`：`open()` / `addKey(n)` / `keys` / `collection`
- `__octoHouse`：`styles` / `style` / `setStyle(id)` / `goHome()` / `wake()`
- `__octoCare.reward(xp)`
- `__octoWorld.goTo(x, y)`
- `__oceanLifeV3.things`

**本地存储**

| 页面 | 键 | 内容 |
|---|---|---|
| 主页面 | `minest.octo.rewardQueue.v1` | 奖励队列 |
| 主页面 | `minest.rewards.day.v1` | 当天各环是否已奖励 |
| 主页面 | `minest.rewards.badges.v1` | 已奖励过的勋章 |
| 主页面 | `minest.octo.mirror.v1` | Mini Pet 基础状态 |
| 主页面 | `minest.octo.lookSynced` | 外观是否同步过 |
| 主页面 | `minest.octo.lastVisit` | 上次打开 Pet Raising 的时间 |
| 主页面 | `minest.octo.latestBadge` | 最新勋章 |
| 主页面 | `minest.tips.v1` | 提示的当天记录 |
| 主页面 | `minest.inbox.v1` | 消息中心 |
| Pet Raising | `minest.octo.rewardsSeen.v1` | 已领取的奖励 |
| Pet Raising | `minest.octo.latestBadge` | 最新勋章 |
| Pet Raising | `minest.octo.chestKeys` | 宝箱钥匙 |
| Pet Raising | `minest.octo.treasure.v1` | 宝箱开出的收藏 |
| Pet Raising | `minest.octo.house.style` | 房子风格（shell / cottage） |
| Pet Raising | `minest.octo.care.v2` | 亲密度（原有） |
| Pet Raising | `minest.cosmetics.v1` | 外观（原有，新增 `hand` 部位） |

---

## 4. 部署步骤（给部署 agent）
1. 按 44.4 交接文档第 2 节：
   - `cp iPhone44.5.html iphone.html`
   - 再复制到 `ios/Minest/Minest/iphone.html` 和 `iphone18.0.html`
   - `.vercelignore` 末尾加 `!iPhone44.5.html`
2. 暂存：`iPhone44.5.html`、三个入口文件、`.vercelignore`、`voice-realtime-45.js`，以及第 2 节表里的 Pet Raising 文件。
3. 提交前检查 token：用 `MinestWebView.swift` 里 token 的前几位 grep 暂存区，结果必须是 0；不要把 token 或它的片段写进任何文件。
4. 推送，确认线上 `/iphone.html` 含 `44.5`，`/octopus-pet-raising-v6/chest-v1.js` 返回 200。
5. iOS 编译并安装（App 用本地工作区编译，44.4 原生朗读用的 Swift 文件仍是本地未提交状态，见 44.4 文档第 6 节）。

## 5. 上线后验证清单（手机）
- [ ] 打勾：Mini Pet 有反应；打开 Pet Raising 后提示领取了亲密度。
- [ ] 模拟三环全闭合（或真实闭合）：宝箱发光并显示"Tap to open"；点宝箱后 Octo 去开箱，新勋章飞到手上。
- [ ] 衣柜：Hand、Home 标签页正常；10 件新物品能穿戴，玩具会玩。
- [ ] 单击 Mini Pet 弹出气泡菜单；**长按对讲**；**语音指令**（这两项在预览里测不了真麦克风）。
- [ ] Pet Raising 里**按住拖动引诱 Octo**；单击海底生物有反应。
- [ ] App 里外观同步：在 Pet Raising 换皮肤或配饰后关掉，Mini Pet 一致；彩色皮肤下 Mini Pet 的身体正常显示。
- [ ] 主动提示出现后，20 秒自动收进消息中心，未读数正确。

## 6. 已知问题 / 可以继续做的
- 鮟鱇鱼和寄居蟹是 2D 程序绘制，风格与其他鱼一致，但比不上 3D 的 Octo。
- 手持物品用的是简单几何体；尤克里里、放大镜等细节可以继续加。
- 宝箱目前只有 9 枚可开的勋章，全部开完后随机重复。
- 主动提示的文案和频率可以按使用反馈调整。
- 房子目前只有两种风格；`house-v1.js` 的 `STYLES` 可以继续扩展（需要新增对应的绘制函数和 `geo()` 分支）。
