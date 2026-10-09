# Minest Learning Path 1.0 — 开发指令

版本：1.0 草案 · 2026-10-09 · 基础版本：`iPhone44.5.html`（开发时新建 `iPhone44.6.html`）

> 目标：用户对 Mini Pet 说一句"开始学习"，Mini Pet 就知道今天该学什么、从哪里开始、接下来做什么，自动计时、自动评分、自动记录，最后给出总结和复习计划。
> 原则：**复用现有功能，不重写**。新开发的核心只有一个统一的 **Learning Path Controller**（下称 LPC），负责把现有的看板、Flash、滑卡、跟读评分、Mini Pet 和学习数据连起来。

所有行号都基于 `iPhone44.5.html`，开发前请重新 grep 确认。

---

## 0. 现有能力盘点（复用清单）

| 学习步骤 | 复用的现有功能 | 位置 / 接口 | 需要的小改动 |
|---|---|---|---|
| 选择材料 | 当前看板、列表筛选 | `MinestAI.board()`；`setActiveBoardId` / `setSelectedColFilter`（只能在主组件 `Be` 内部用）；原生事件 `watchBoardSelected` / `watchListSelected`（38955，可从 JS 派发） | 在 `MinestAI` 上开放导航方法 |
| 01 Flash 快闪 | **Drill 闪卡** `FlashcardDrillView`（28555） | `window.__setViewMode('drill')`；内部 `filterScope`：'all' / 'review' / 列表 id | `selectedColFilter` 属性目前没被用上，要让它作为初始范围生效；加完成回调 |
| 02 Quick Test 滑卡 | **Study Arcade 的 Swipe Judgment 模式**（12563，← KNOW / AGAIN →） | `StudyArcade.open(board)`；内部 `play(modeKey, deck, opts)`（11890）、`buildDeck`（11381）、`judge`（11567） | 开放 `play`；结果写回 `card.mastery`（现在只写入 arcade 自己的 localStorage） |
| 03 Deep Learning 跟读 | **`MinestPron.shadow`**（23194：播标准音 → 自动聆听 → 静音结束 → 评分 → 保存）；`practice` 循环（22975，评分后 2.3 秒自动下一张） | 评分接口 `/api/pronunciation/score`；分数通过 `minestPronScore` 事件写入 `card.pron` | 新建"连续跟读"循环，复用 `shadow` 的各个步骤 |
| 04 总结 | `MinestAnalyze._snapshot(board).stats`、`StatsBanner` 的分级、`MinestRewards` | — | 新的总结面板（液态玻璃） |
| 计时 | 活动环 `focusMinutes`（打开 App 就每分钟 +1，没有空闲判断）、`minestFocusSessionCommitted` 事件 | 39157 / 39236 | LPC 自己按学习行为计时，结束时通过同一个事件汇入专注环 |
| 提醒 | `MinestTips`（idea / runAct / 消息中心）、原生 `scheduleNotification`（一次性）、Live Activity `startStudy` / `updateProgress` / `endStudy`（JS 目前都没调用） | 46361 / 6680–6740 | 新增 study 提示、每日提醒、学习时的灵动岛 |
| 语音 | 语音指令 `routeIntent`（47399） | — | 新增"开始学习"指令 |
| Mini Pet | `__miniPetCtl`（play / lookAt / say / burst）、气泡菜单 `ITEMS` | — | 新增 📚 Study 气泡和每一步的引导台词 |
| 同步 | Firestore `users/{uid}/focusboard/data`，`minestCloudPayload(boards, extra)` | 38395 | 在 `extra` 里增加学习记录字段并能读回 |

---

## 1. 先修好的数据问题（第一阶段一开始就做）

1. **统一掌握度（mastery，1–5）的含义**：
   - 1 = 不会，2 = 模糊，3 = 基本会，4 = 熟练，5 = 掌握。
   - 现在看板把 `mastery === 3` 当成"完成"（39042、39100、32371），这是错的；Drill 的 Mastered 每次 +1，所以卡片在 Lv 3 时算完成、到 Lv 4 反而不算。
   - 统一改成 **≥ 4 算掌握**，≤ 2 需要复习。所有判断集中到一个函数 `masteryBand(m)`。
2. **云同步保留新字段**：`sanitizeLoadedBoards`（38451）的卡片字段白名单要加上 `lastReviewed` 和 `learn`（见第 4 节）。否则下次加载或同步时会被删掉。
3. **Drill / Swipe 都写回卡片**：所有学习结果统一走 `updateCardMastery`（39675），开放成 `MinestAI.rateCard(cardId, level)`。
4. **Mac 桌面版（web18.0.html）的跨设备问题**：
   - iPhone 只上传压缩字段 `boardsGz` 并删掉明文 `boards`，web18 只读明文，所以读不到 iPhone 的数据；web18 保存时还会抹掉 `pron`。
   - Learning Path 的"三端共用进度"依赖解决这个问题，**需要用户决定**：修 web18，还是让 Mac 改用网页版 iPhone 页面或新的桌面版。见第 9 节。

---

## 2. Learning Path Controller（新模块）

新建一个内联脚本 `window.MinestLearn`，放在主页面的 Pet 联动脚本之后。

### 2.1 状态机
```
idle → plan → flash → quicktest → deep → summary → idle
         ↑ 每一步都可以 skip / back / pause；随时可以 exit（会保存进度）
```

### 2.2 会话对象（session）
```js
{
  id, startedAt, boardId, listId, subject /* 默认取 board.title，可手动指定 */,
  cardIds: [...],                 // 本轮学习的卡片
  step: 'flash' | 'quicktest' | 'deep' | 'summary',
  flash:     { seen: [], index },
  quicktest: { known: [], unsure: [], unknown: [] },
  deep:      { queue: [], done: [{cardId, score, tries}], retry: [] },
  time:      { activeMs, byStep: {flash, quicktest, deep}, lastActiveAt, paused },
  result:    { masteryBefore: {id: m}, masteryAfter: {...}, avgScore, reviewPlan: [...] }
}
```
- 进行中的会话保存在 localStorage `minest.learn.session.v1`。重新进入时提示"继续上次的学习？"，并从原来的步骤继续。
- 完成的会话追加到学习记录（第 4 节）。

### 2.3 接口
```js
MinestLearn.start(opts?)        // 不传参数时自动规划今天的内容（2.4）；可以传 {boardId, listId, cardIds}
MinestLearn.next() / skip() / back() / pause() / resume() / exit()
MinestLearn.state               // { step, session, plan }
MinestLearn.todayPlan()         // 只计算，不启动，供提醒和 Mini Pet 使用
MinestLearn.history(range)      // 学习记录：按天 / 列表 / 学科统计
```
事件：`minest:learn`，`detail = {type: 'start' | 'step' | 'progress' | 'pause' | 'resume' | 'finish' | 'exit', step, session}`。Mini Pet、灵动岛、提醒都只监听这个事件，不直接耦合。

### 2.4 今天学什么（`todayPlan`）
按优先级选一个列表，每轮默认 **12 张卡**，用户可以在设置里改：
1. 过期或今天到期的卡片（`card.date ≤ 今天`，且未完成）
2. 复习计划到期的卡片（`card.learn.nextReview ≤ 今天`，见 5.2）
3. 掌握度 ≤ 2 的卡片
4. 发音分数低于 80 的卡片
5. 用户设定的每日学习列表里，还没学过的卡片

最后返回 `{boardId, listId, cardIds, reason}`。`reason` 给 Mini Pet 用来说明为什么学这些，例如："今天有 5 张该复习了，还有 3 个单词发音没过关"。

---

## 3. 五个步骤的具体要求

### 01 选择学习材料
- 用户说"开始学习"或点 Mini Pet 的 📚 → Mini Pet 弹出确认卡（液态玻璃）："今天学 **〈列表名〉**，12 张 · 约 10 分钟"，按钮为 **开始** / **换一个** / **稍后**。
- "换一个"会列出看板里的各个列表供选择。
- 开始后切换到对应的看板和列表（在 `MinestAI` 上新增 `selectBoard(id)` / `selectList(id)`），然后进入 Flash。

### 02 Flash 快闪记忆
- 复用 **Drill**，以本轮的 `cardIds` 为范围打开（新增一个 `cardIds` 属性，优先级高于 `filterScope`）。
- 快闪节奏：每张卡先显示正面，约 2.5 秒后自动翻到背面，再过约 2.5 秒进入下一张。用户也可以手动翻页，手动时暂停自动播放。
- 这一步不评分，只记录每张卡看过的次数。
- 全部看完 → Mini Pet："都看过一遍啦，来测测哪些已经会了？" → 进入 Quick Test。

### 03 Quick Test 左右滑卡片
- 复用 **Study Arcade 的 Swipe Judgment**：开放 `StudyArcade.play('swipe', deck, {onDone})`，deck 只包含本轮的卡片。
- 结果写回卡片：

  | 操作 | 记为 | 掌握度 |
  |---|---|---|
  | 向左滑 KNOW | known | 至少 4 |
  | 犹豫（low） | unsure | 至多 3 |
  | 向右滑 AGAIN | unknown | 1 |

- 结束后，unsure 和 unknown 的卡片进入 Deep Learning 队列。
- 如果全部都会，Mini Pet 夸奖并直接进入总结（可以选择仍然做一轮发音练习）。
- 不是英文单词的卡片（`MinestPron.wordOf` 取不到单词）**跳过 Deep Learning**，只走 Flash 和 Quick Test。

### 04 Deep Learning 连续跟读
在 `MinestPron` 里新增 `MinestPron.learnLoop(cards, {onCard, onDone, threshold: 80, maxTries: 2})`，复用 `shadow` 和 `bindHold` 里的录音、静音检测、评分、保存逻辑。每张卡的流程：
1. 自动播放标准读音。App 内用原生朗读 `speakText`，网页用 `SpeechAssistant.speak`，语速 0.85。
2. 提示"跟我读"，自动开始聆听；检测到说完（静音约 0.8 秒）后自动提交评分。
3. **独立朗读**：再提示"你自己读一遍"，这次不播放标准音，聆听、评分，以这次的分数为准。
4. 评分结果：
   - ≥ 80：通过，进入下一张。
   - < 80：提示重试，最多 2 次；仍然不达标的卡片放进 `retry`，本轮最后再练一次。
5. 分数通过现有的 `minestPronScore` 事件写入 `card.pron`。低于 80 的卡片保留 `l-review` 标签（现有逻辑）。
6. 界面上始终保留 **重试** / **跳过** / **暂停** 三个按钮，不能完全依赖自动流程。
7. 语音识别失败或网络失败：显示"没听清，再试一次"并允许跳过。连续失败 3 次后降级为手动模式（按住说话）。

稳定性要求：录音、评分、自动跳卡**分别**做开关，开关存在 localStorage `minest.learn.flags`，出现问题时能单独关闭。

### 05 学习总结
- 液态玻璃面板，内容：
  - 学习时长（有效时长）
  - 本轮卡片数
  - 掌握度变化（例：Lv 2 → 4 的卡片 × 5）
  - 发音平均分，低分单词列表
- 复习计划：按 5.2 的间隔，列出接下来几天哪天复习哪些卡片，可以一键"加入提醒"。
- 奖励：`MinestRewards.emit('study', {minutes, cards})`。
  - 新的奖励类型，亲密度 = 每 5 分钟 +1，上限 +6。
  - Octo 和 Mini Pet 庆祝。
  - 学习时长通过 `minestFocusSessionCommitted` 计入专注环。
- Mini Pet 根据结果说一句总结，例如"今天学了 14 分钟，又掌握了 5 个词！明天再复习 3 个就好"。

---

## 4. 学习记录与跨设备同步

- **卡片级**（写在卡片上）：`card.learn = { seen, lastReviewed, nextReview, interval, history: [{at, step, result, score}]（最多保留 20 条） }`。要加入 `sanitizeLoadedBoards` 的白名单。
- **会话级**：`learning = { days: { 'YYYY-MM-DD': { activeMs, sessions, byList: {listId: ms}, bySubject: {name: ms} } }, sessions: [最近 50 次的摘要] }`。
  - 本地存在 localStorage `minest.learn.log.v1`。
  - 云端放在 `minestCloudPayload` 的 `extra.learning`（Firestore 会合并保存）。
  - `onSnapshot` 和手动拉取时**要新增读取 `learning`**；按天、按字段取较大值合并，避免多设备互相覆盖。
- **统计**：`MinestLearn.history('day' | 'week')` 返回每天、每个列表、每个学科的有效学习时长，供总结页和以后的统计页使用。
- **三端**：iPhone App、网页版共用同一份 Firestore 数据。Mac 端见 1.4 和第 9 节。

---

## 5. 计时与复习间隔

### 5.1 按学习行为计时
| 行为 | 计时 |
|---|---|
| 进入 Flash 并有操作（翻卡、换卡、自动播放进行中） | 开始 / 继续计时 |
| Quick Test 滑卡 | 持续计时 |
| 跟读：播放、聆听、评分 | 持续计时 |
| **90 秒**没有学习事件（可配置） | 自动暂停，Mini Pet 轻声提示"还在吗？" |
| 页面隐藏、App 进入后台 | 立即暂停 |
| 退出学习模式 | 保存并停止 |
| 重新进入 | 恢复会话，继续计时 |

实现方式：
- 每一步在用户有操作时调用 `MinestLearn.tick(kind)`，每秒累加到 `activeMs`，同时按步骤分别累计。
- **不要**沿用活动环那种"打开 App 就算时间"的计法。

### 5.2 复习间隔（简化版间隔重复）
- 每张卡记录 `interval`（天）。
- 结果为 known 或评分 ≥ 90：`interval = max(1, interval × 2.2)`。
- unsure 或 80–89 分：`interval = max(1, interval × 1.3)`。
- unknown 或 < 80 分：`interval = 1`。
- `nextReview = 今天 + interval`。`todayPlan` 会优先挑出到期的卡片。

---

## 6. 提醒与 Mini Pet 引导

1. **每日学习提醒**：设置项包括提醒时间（默认 19:00）、学习列表（默认自动）、每轮卡片数。
   - 网页端：到点后由 Mini Pet 发出提示。
   - App 端：用原生 `scheduleNotification` 预约下一次提醒。它只支持一次性提醒，所以每次打开 App 和每次学完都要重新预约下一天。
2. **新增 study 提示**（`MinestTips.ideas` 里加一条，`runAct` 加 `study` 动作）：例如"今天还有 5 张要复习 · 开始学习 ›"。点提示直接 `MinestLearn.start()`。提示上增加 **"打开列表"** 按钮，跳转到对应的看板和列表。
3. **Mini Pet 气泡菜单**新增 📚 Study；语音指令 `routeIntent` 新增：
   - 识别："开始学习 / 学习 / 复习 / 背单词 / start studying / study time"
   - 动作：`MinestLearn.start()`
   - 位置：放在"发音"分支之前，避免"学习发音"被当成发音指令。
4. **每一步的引导**：Mini Pet 监听 `minest:learn`，在每一步开始和结束时说一句引导（说话气泡；语音球开着时也会朗读），并配合动作：Flash 时思考，滑卡时点头，跟读时看着你，完成时庆祝。
5. **灵动岛 / Live Activity（App）**：开始时 `startStudy({boardTitle, totalCards, ...})`，每张卡调用 `updateProgress`，结束时 `endStudy()`。这些原生接口已经有了，JS 目前还没调用过。

---

## 7. 分阶段交付与验收

### 第一阶段：提醒跳转 + 学习路径框架 + 自动计时
- 第 1 节的数据修正（掌握度统一、字段白名单、写回卡片）
- `MinestLearn` 状态机、会话保存与恢复、`todayPlan`
- 第 5.1 节的计时（空闲暂停、后台暂停、恢复）
- 入口：📚 气泡、"开始学习"语音指令、study 提示（带"打开列表"跳转）
- 步骤先用最简单的衔接：选择 → 打开现有 Drill → 手动"下一步" → 打开现有 Swipe → 手动"下一步" → 现有 `practice` 跟读 → 总结（只含时长和张数）

**验收：**
- 说"开始学习"后，30 秒内进入正确的看板、列表和卡片。
- 空闲 90 秒后计时暂停，有操作后恢复；退出再进入可以继续。
- 刷新页面后会话不丢失。
- 学习时长计入专注环。

### 第二阶段：Flash / Quick Test / Deep Learning 自动衔接
- Drill 支持 `cardIds` 范围和自动播放，结束回调
- 开放 Swipe 的 `play`，结果写回掌握度并决定 Deep Learning 队列
- 每一步自动进入下一步，配 Mini Pet 引导台词；灵动岛进度

**验收：**
- 一轮 12 张卡，从 Flash 到总结**不需要手动切换模式**。
- Quick Test 的结果正确反映到卡片掌握度上。

### 第三阶段：自动跟读评分 + 学习统计 + 跨设备同步
- `MinestPron.learnLoop`：标准音 → 跟读 → 独立朗读 → 自动评分 → 达标跳卡 / 不达标重试
- 复习间隔 `card.learn`，总结里的复习计划
- 学习记录（按天、列表、学科）和 Firestore 同步合并；每日原生提醒

**验收：**
- 跟读全程无需点击（保留手动重试和跳过）。
- 评分、识别、跳卡三项分别测试，各跑 50 张以上不出错。
- iPhone 和网页上的学习时长、记录一致。

---

## 8. 测试要点
- 每个阶段先在网页预览上开发、验证，再移植到 iPhone。
- 麦克风相关（跟读、语音指令）必须在真机上测；App 用原生听写和原生朗读，网页用 Web Speech。
- 测试数据用单独的测试看板，不要改用户的真实看板。
- 回归：Drill、Study Arcade、Heads Up、发音练习单独使用时的行为不变。

## 9. 需要用户决定的事项
1. **Mac 桌面端** → 已决定（2026-10-09）：Mac 用网页版 iPhone 页面（桌面默认全窗口，Desktop 按钮切换全窗口 / 手机框，不再跳 web18）；**Mac 桌面宠物**（`macos/MinestDesktopPet`）要和网页端 Mini Pet 保持一致，方案为"同一份代码 + 本机连接"，见第 13 节。
2. **掌握度标准**：是否同意改成"≥ 4 算掌握"？这会改变现有看板上的"完成"判断。
3. **默认值**：每轮卡片数（建议 12）、空闲暂停时间（建议 90 秒）、提醒时间（建议 19:00）、发音达标线（建议 80）。
4. **非单词卡片**（句子、概念）：是否需要 Deep Learning？句子朗读评分要用另一个评分接口（现在的接口只支持单个英文单词）。

---

## 10. 第一阶段实现记录（2026-10-09，iPhone44.6.html，仅网页预览验证，未部署）

用户已确认：掌握度 ≥ 4 算掌握；默认值 12 张 / 90 秒 / 19:00 / 80 分；非单词卡片不做跟读；Mac 端问题留到第三阶段处理。

**改动**
- 掌握度：4 处 `mastery === 3` 改为 `>= 4`（手表 / 小组件完成状态、看板完成下沉）。分享进来的卡片默认 Lv 1（原来是 3）。
- `sanitizeLoadedBoards` 保留卡片的 `lastReviewed` 和 `learn`。
- `MinestAI` 新增：`boards`、`listFilter`、`viewMode`、`selectBoard(id, listId)`、`selectList`、`setViewMode`、`showList(boardId, listId)`、`patchCard(id, patch)`、`rateCard(id, level)`。
- Drill：`window.__drillLearnIds` 存在时以本轮卡片为范围（scope `learn`）；否则使用当前列表。翻卡、评分时发出 `minest:study-activity`，看完一轮时发出 `minest:drill-done`。
- Study Arcade：开放 `window.StudyArcade.learn(board, ids, 'swipe')` 和 `isOpen()`。每次判断发出 `minest:study-activity`，结束时发出 `minest:arcade-done`。
- `MinestPron.practice(title, cards, {onClose, quiet})`：关闭时回调结果；录音和评分时发出 `minest:study-activity`。
- 新脚本 `window.MinestLearn`，放在页面末尾：
  - 状态机 flash → quicktest → deep → summary；`todayPlan`；
  - 会话保存与恢复（刷新后提示继续）；
  - 按行为计时：空闲 90 秒或后台时暂停，每满 1 分钟计入专注环。学习进行中时，专注环原有的"打开就计时"暂停，避免重复计算；
  - 学习记录 `minest.learn.log.v1`，按天 / 列表 / 学科统计；
  - 顶部液态玻璃进度条（Next / ✕），开始卡、选列表卡、继续卡、总结卡；
  - 每日 19:00 后显示 study 提示；App 端在第一次学完后用原生通知预约下一次提醒。
- 入口：Mini Pet 气泡菜单 📚 Study（第一个）；语音"开始学习 / 复习吧 / 今天该学什么 / let's study"（"学习发音"仍然走发音）；study 提示带 **Open list** 按钮。
- 奖励：`MinestRewards.emit('study', {xp: 每 5 分钟 1，最多 6})`。Pet Raising `reward-v1.js?v=446` 显示 📚×n。
- `voice-realtime-45.js` 和内联版本同步更新。

**已验证（网页预览）**
- 完整一轮：开始 → Flash 12 张 → Quick Test（知道 → Lv 4，再来 → Lv 1）→ 跟读队列只包含不会的 4 张 → 总结。
- 计时：空闲暂停和恢复正常；学习时长写入专注环和学习记录。
- 中途退出后刷新，可以从 Quick Test 继续。
- 提示上的 Open list 能跳转到列表并高亮；语音指令匹配 11 个用例全部正确。

**还需真机验证**
- 语音"开始学习"；App 内的跟读；原生通知权限和预约。

**部署注意**
- 新文件：`iPhone44.6.html`。
- 改动：`voice-realtime-45.js`、`octopus-pet-raising-v6/reward-v1.js` 与 `index.html`（版本号 v=446）。
- 其它规则沿用 HANDOFF_44.5_PET.md。

## 11. 第二阶段实现记录（2026-10-09，iPhone44.6.html，仅网页预览验证，未部署）

**改动**
- **Flash 自动播放**（Drill 的 `learn` 范围）：
  - 先显示正面约 2.8 秒，翻到背面约 2.5 秒，然后进入下一张；时长由设置 `flashSec` 控制。
  - 手动翻卡或评分会暂停自动播放；进度条旁有 ⏸/▶ Auto 按钮可以切换。
  - 每张看过的卡记录在 `session.flash.seen`。
- **步骤自动衔接**：每一步结束后弹出液态玻璃过渡卡，3 秒倒计时后自动进入下一步。
  - 按钮为 **Wait**（停在这里，用顶栏的 Next 继续）/ **Go now**。
  - 设置 `auto: false` 可以关闭自动衔接。
  - Flash 看完 → 过渡 → Quick Test。
  - Quick Test 完成后，先让 Study Arcade 的结果显示约 3.8 秒，再自动关闭 → 过渡 → Deep Learning。没有需要跟读的卡片时直接进入总结。
  - Deep Learning 练完后，发音练习自己的分数页显示约 4.2 秒，再自动关闭 → 总结。如果点了 "Practice these"，会留在练习里继续。
  - 中途手动关闭 Study Arcade 或发音练习：不自动跳转，Mini Pet 提示"Paused — tap Next"。
- **`MinestPron.practice` 新增选项**：`opts.onFinish(results)`；`onClose(results, {finished})`。
- **Mini Pet 引导**：
  - 每一步开始和结束时说一句引导；
  - 学习进行中每 7 秒做一个动作：Flash 时思考 / 看 / 📖，Quick Test 时点头 / 弹跳，跟读时看着你 / 点头；
  - 自己正在说话或有提示框时不打断。
- **灵动岛（App）**：
  - 开始或继续时调用 `startStudy`；
  - 换步骤和卡片进度变化时调用 `updateProgress`，最少间隔 15 秒（每次更新原生端会响一下）；
  - 空闲时发送 `studyPaused`；
  - 完成时调用 `endStudy`；中途退出调用 `endIsland`。

**已验证（网页预览）**
- 8 张卡的一轮：Flash 自动播放 → 自动进入 Quick Test → 模拟滑卡 → 自动进入 Deep Learning（队列为 3 张不会的）→ 跳过 → 自动进入总结。全程没有手动切换模式。
- 模拟原生桥接时，`studyStarted` → `progressUpdated` ×3 → `studyFinished` 的调用顺序正确。
- Wait 会停止倒计时，之后可以用顶栏 Next 手动继续。

**还需真机验证**
- 灵动岛显示；跟读麦克风；自动关闭发音练习的时机。

## 12. 第三阶段实现记录（2026-10-09，iPhone44.6.html，仅网页预览验证，未部署）

**连续跟读 `MinestPron.learnLoop(cards, opts)`**（Deep Learning 默认使用它；没有时退回 `practice`）
- 每个单词的流程：
  1. 🔊 播放标准音（Web Speech，en-US，语速 0.85；没有 Web Speech 时用原生 `speakText`）。
  2. 🗣 跟我读：自动聆听，安静 0.85 秒视为说完，然后评分。这一步只作练习，不保存。
  3. 🎤 独立朗读：自动聆听并评分，**以这次的分数为准**，通过 `minestPronScore` 写入 `card.pron`。
- 评分结果：
  - ≥ 80：通过，自动进入下一张。
  - < 80："Almost — listen once more"，重新播放标准音后再独立朗读，最多 2 次。
  - 仍然不达标：放进本轮最后的 "One more round" 再练一次；还不行就留到下次复习。
- 每次录完都关闭麦克风，避免 iOS 录音时把下一次播放的声音压低。
- 界面上始终有 ↺ Retry / ⏸ Pause / Skip ⏭；页面切到后台会自动暂停。
- 连续失败 3 次（麦克风、没有声音、评分接口无响应）后，改为 ✋ 按住说话。
- 开关存放在 `minest.learn.flags`，可以分别关闭：`{record, score, autoNext}`。
- 音频解锁：iOS 和浏览器要求用户点一下才能播放声音、打开录音。
  - Learning Path 的卡片上任何一次点击（Start / Continue / Go now 等）都会调用 `MinestPron.unlockAudio()`。
  - 如果没有解锁过，跟读开始前会显示一个 Start 按钮。

**复习间隔 `card.learn`**（已加入 `sanitizeLoadedBoards` 白名单）
- 字段：`{ seen, lastReviewed, interval, nextReview: 'YYYY-MM-DD', history: [{at, g, q, s}] (最多 20 条) }`。
- 等级取 **Quick Test 结果和独立朗读分数中较差的一个**：
  - good（会 / ≥ 90）：间隔 × 2.2，第一次为 3 天。
  - ok（犹豫 / 80–89）：间隔 × 1.3，第一次为 2 天。
  - again（不会 / < 80）：明天复习。
  - 只在 Flash 里看过：间隔不变，至少 1 天。
- 犹豫或没测的卡片，如果独立朗读达标，掌握度至少提升到 Lv 3；"不会"的卡片不因为读得好而提升。
- `todayPlan`：没到复习日的卡片不会被选中（已过截止日期的除外）。
- 总结里的复习计划按实际日期分组列出，例如"Tomorrow · 10-10 = 1 card"。

**学习记录与云同步**
- `minest.learn.log.v1` 升级为按设备记录：`{ v: 2, devs: { <deviceId>: { days: { 'YYYY-MM-DD': {activeMs, sessions, byList, bySubject} } } }, sessions: [...50] }`。旧格式会自动迁移。
- 设备 id 存在 `minest.learn.device`。统计（`history`）时把所有设备相加，所以多台设备不会互相覆盖。
- 上传：`minestCloudPayload` 每次保存时附带 `learning`（约 1 KB）。
- 下载：`onSnapshot` 和手动拉取时调用 `MinestLearn._mergeCloud(data.learning)`。同一设备同一天取较大的记录；会话按 id 合并。
- 已验证：两台设备的时长相加；重复合并不会重复计算；较旧的数据不会覆盖较新的。
- 学完以后卡片的 `learn` 会变化，从而触发保存，学习记录就跟着上传了。

**每日提醒**
- 总结页新增 "🔔 Remind me daily" 按钮。
  - App：开启原生通知，每次学完都重新预约下一次。
  - 网页 / Mac：浏览器通知，只在页面处于后台时发送；页面在前台时由 Mini Pet 显示提示。
- 原生通知改为：只有在学过一次之后，或者用户点了这个按钮，才申请通知权限。

**Mac 用网页版 iPhone 页面（保留）**
- 桌面浏览器默认全窗口，选择存在 `minest.web.sim`（`?sim=1` 强制手机框）。
- 顶栏 Desktop 按钮改为切换全窗口 / 手机框，不再跳到 `web18.0.html`；全窗口时左下角有半透明的 "📱 Phone frame"。
- 不要再用 web18 打开同一账号：它会写入明文 `boards`，并丢掉 `pron` 和 `learn`。

**已验证（网页预览，用模拟麦克风和模拟评分接口）**
- 连续跟读：3 个单词全程无需点击，每个约 6.5 秒；重试 → 本轮末尾再练 → "下次复习"的分支正确。
- 麦克风失败 3 次后改为按住说话；Pause / Skip 正常。
- 完整一轮：会 → 3 天后复习、Lv 4；不会且发音 92 → 明天复习、仍是 Lv 1。
- 云端数据：上传包里有 `learning`；合并规则正确。

**还需真机验证**
- 真实麦克风下"安静 0.85 秒算说完"的灵敏度（阈值 `mic.level > 0.05`）。
- App 内 Web Speech 播放后马上录音时，播放声音是否会被录进去。
- 原生通知；两台真实设备之间的云同步。

**部署注意（给部署 agent）**
- `iPhone44.6.html` 复制为 `iphone.html` 和 iOS 包内的文件（按 release pipeline）。
- 第一阶段已改动：`voice-realtime-45.js`、`octopus-pet-raising-v6/reward-v1.js` 与 `index.html`（v=446）。

## 13. Mac 桌面宠物与网页 Mini Pet 保持一致（2026-10-09，iPhone44.6 + macos/MinestDesktopPet）

**做法：同一份代码 + 本机连接**（详见 `macos/MinestDesktopPet/README.md`）

**同一份代码**
- 桌面宠物的网页部分由 `sync-web.py` 从 iPhone 页面直接复制 Mini Pet 的核心脚本和行为脚本生成，原来单独写的那份已经替换。
- 因此外观、灯光、动作、换装、手持徽章、点按弹出气泡菜单（📚 Study / Talk / Build / Analyze / Speak / Octo / Inbox）、长按说话、提示和消息中心都和网页版一样。
- 网页核心为此新增 `window.__miniPetHost` 钩子：桌面宠物用它把拖动交给原生窗口；网页上没有这个钩子，行为不变。

**本机连接**
- 桌面宠物 App 在 `127.0.0.1:47321` 提供 WebSocket，并且只接受 Minest 的网站来源。
- 网页端的 `MinestDesktopLink` 要先用 `?desktopPet=1` 打开过一次才会连接。连接后：
  - 网页 Mini Pet 的每个动作、每句话、每个特效都同步到桌面宠物；
  - 换装和手持徽章实时同步；
  - Minest 在后台时，提示和 19:00 的学习提醒由桌面宠物弹出；
  - 桌面宠物的气泡、提示按钮和长按说话会在网页上执行，并把浏览器切到前台；网页没打开时会自动打开 Minest 并执行。
- 菜单栏显示连接状态：🔗 Linked / ○ Not linked。

**原生改动**
- 窗口 420×440，透明区域可以点穿到桌面；
- WebView 改为持久存储，换装、消息中心重启后不丢；
- 新增 `LinkServer.swift`；
- 菜单栏的 Talk 和 Pet Mode 改为交给网页执行。

**已验证（真实运行 App + 预览网页）**
- 网页连续打勾 3 次，桌面宠物同步说出 "Nice! ×3" 并出现特效；
- 换皮肤后，桌面宠物同步，改回也同步；
- 桌面宠物的 Study / Build 气泡在网页上执行；
- 提示和手持徽章能显示；
- 其他网站来源被拒绝；端口只监听 127.0.0.1；App 重启后网页约 3 秒内自动重连。

**还需用户实际试用**
- 点穿的手感；拖动窗口；
- Chrome 第一次连接时会问"允许访问本地网络"，点允许即可；
- Safari 从 https 页面连 `ws://127.0.0.1` 是否被拦截还没验证；
- 网页在后台时，长按说话能否打开麦克风。

**部署注意**
- 网页端的改动在 iPhone44.6.html 里：桌面链接脚本、`__miniPetHost` 钩子、`MinestTips.present/act`。
- 桌面宠物 App 只需要在本机运行 `build.sh`。
- 每次改了网页 Mini Pet，都要重新运行 `sync-web.py` 和 `build.sh`。
