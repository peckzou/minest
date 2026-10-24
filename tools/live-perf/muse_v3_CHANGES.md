# My World v3 改动说明：大刀阔斧版

> 基线：v1 升级版 `~/workspace/your_files/minest-my-world-v2/iphone.html`（136,026 行，md5 `c06ad42a…`）。
> 本版本只改了本目录下的副本 `iphone.html`（合并后 136,083 行）。**GitHub 仓库未做任何改动；v1 副本与原始基线（`iphone.orig.html`，md5 `86387def…`）原封不动。**
> 设计依据：同目录 `DESIGN.md`。v1 的 P0 改动全部保留（合并后逐项复查标记仍在）。
> 三项排除项（工具栏入口可发现性、宠物菜单、AI 搜索）全程未碰；未尝试 artifact 发布。

## A. 第一次打开与空态（一打开就知道干什么）

- **0 世界主角（A1）**：My World 首页 0 世界时只剩一个主角——输入框 + 大按钮「✦ Build my first world」，输入主题后直通向导生成步（主题会带过去）；下面只有两行小字「Start empty」「Choose from templates」；旧的起始卡片原样收进「More…」。
- **向导 Start empty 归一（合并修正）**：主角区的「Start empty」原先走了另一条 Builder 流程，现已改为直通向导的 Start-empty 步（`MinestNewWorld.open('empty')`），创建入口真正只剩向导这一扇门。
- **「第一步」清单卡（A2）**：新世界建好后，岛屿详情页顶部出现可关闭的清单卡：① 加一件东西（直达 Capture 并聚焦输入框）② 换个样子（直达换肤）③ 把东西摆上岛（直达建造视图）。世界有了第一件东西、或点「Got it」后不再出现（按世界单独记忆）。
- **空态都有按钮（A3）**：Outline 视图 0 世界时加「Build a world」；空列表加「Add your first thing」；空收件箱加「Drop something」（聚焦输入框）；搜索无结果加「Create it as a list」（用搜索词当列表名新建）。

## B. 创建流程（向导 4 步，每步都知道自己在哪）

- **向导进度条（B1）**：实测向导是 4 步（主题 → 区域 → 列表 → 检查），每步顶上写清「Step X of 4」+ 一句话标题。
- **第 2 步不再空着（B1）**：模板区域默认全部勾选，用户只取消不要的；模板和名字都给不出建议时，用一组兜底区域（My Favorites / Wishlist / Ideas / Notes），第 2 步永远不会停在「0 areas」。
- **＋ 表单只剩三行（B2）**：「✦ Make a world」「＋ Add something」「＋ Make a list」；空白岛、主岛、从 board 建、总览、模板库全部收进「More…」，原有处理一个没删。注意：为满足「正好三行」，「Make a world」现在在每个 Add 表单都出现（以前 Assistant 只在首页出现）。
- **预览卡统一（B3）**：模板预览与向导生成列表本来已共用预览卡；补上了生成列表无卡片时的兜底（同样显示一句话 + 数量 + 大按钮）；向导检查步补了一句话简介。模板生成逻辑本身没动。

## C. 建造模式（只有放 / 移 / 删，改动立刻看得见）

- **一个主按钮（C1）**：岛屿详情页的「Display on the island」升级为醒目的主按钮「🧱 Build」，处理逻辑不变；Inventory 按钮视觉上降级（功能不变）。因两个按钮由各自的注入器绝对定位，未做 DOM 重排，靠改名 + 样式提升达成主次。
- **动词栏（C2）**：建造视图（抽屉、HUD、娃娃屋工具栏）的工具按「Place / Move / Remove / More」分组贴了标签，处理逻辑全部不变；Tile 模式共用同一套抽屉与选择栏，故同样覆盖。
- **换肤换岛不关页（C3）**：中心岛与换肤选择器选完不再关闭父面板，画面即时刷新、面板留在原地，另有明确的「Done」回到上一层。注意：选择本身仍会原地重渲染一次选择器（这是面板栈的机制），但不再丢位置。

## D. 导航与层级（返回可预期，弹窗不再卡死）

- **Inbox 返回回原处（D1a）**：从设置进收件箱时记下来源，点返回会回到设置（180ms 后重开设置页）；从总览进则照旧回总览。未用 v1 面板栈——收件箱不是 .uv 面板，调用方在打开前已关面板，栈里无从恢复，故用时间戳标记实现。
- **灵感编辑器成层（D1b）**：Guide 面板里点 Answer 不再整页重渲染导致面板关闭，改为在 Guide 面板之上弹一层编辑器（提示词、输入框、Inbox 复选框、Save/Cancel/×/点暗处关闭），关编辑器就回到原样不动的 Guide 面板；Another 改为点自己的 Inspiration 标签重绘，不再重渲染整页。
- **z-index 阶梯修正（D2，v1 残留）**：Wiki Portal（.wk）、.sk、.lw 从 2147482000/2001 抬到 **2147482003**，位于 My World 面板（.uv，2147482002）之上、总览（.mw，2147482004）之下；其余面板、拖拽层（2147483640）、Visual Library（2147483647，仍最高）全部不动。查过 JS 里没有运行时改这几个面板 z-index 的代码，故只改 CSS。三者共用 2147482003（.uv 与 .mw 之间只有一个整数位），它们是互斥的全屏面板，同一时间只开一个，故无可见冲突。

## E. 搜索、计数、文案、触摸（数字说实话，话说人话）

- **搜索找得到区域（E1）**：`findRows` 补上区域层，区域名命中时以 Area 结果排在列表之前，路径指向该区域；列表/东西逻辑不动；无结果标题改为 "No matching areas, lists or things"。
- **计数诚实（E2）**：总览统计改为 4 格：Worlds / Main islands / Lists / Things（单复数处理）；主岛数取 `MinestHubs.hubs()`（取不到则按 1 个中心岛计）；只有中心岛时不再读作空。
- **中心岛图标跟皮肤走（E3）**：总览的中心岛行图标不再写死 🏰，按皮肤 id 映射（Castle 🏰、Knowledge 📚、Cozy 🏡、Tree of Life 🌳、Modern City 🌆、Zen ⛩️、Cosmic 🪐、Nature 🏔️，未知 ✦）。
- **文案缩短 + 不截断（E4）**：10 处最长的 My World 辅助文案缩短（原意不变）；My World 面板内的辅助文字加换行规则，不再 clip 掉一半；Tile 提示复数修正（"1 main island"）；Wiki Portal "thingin" 改为字面空格。
- **触摸与标签（E5）**：换装色板全部补 aria-label + title（组 + 序号 + 色值），触摸热区扩到 44px（视觉色板仍 18px）；My World 面板内的小图标按钮同法扩到 44px。
- **长按提示（E6）**：第一次进可整理列表视图时轻提示一次「Long-press a thing to tidy it」，之后不再出现；长按行为本身没动。
- **Night 文案诚实（E7）**：Look 设置改为 "Page light or dark / Every My World page and Knowledge view — the sky stays as it is"。主题引擎没动。

## 合并说明

- 5 个批次各在独立副本上改动，以 unified diff 依次合并进 v3（A → B → C → D → E）；其中 E 的 2 处 hunks 因与 A（emptyList 按钮）、C（选择器 Done 按钮）上下文重叠未能自动应用，已按原 diff 内容手工补上并逐一验过锚点唯一，且完整保留了 A、C 的改动。
- 合并后与基线共 54 处 hunks、199 行改动，外加合并修正 1 处（A1 Start-empty 路由）。另对 DESIGN.md 做了一处订正：向导实为 4 步，原文写 3 步已改。

## 刻意没做的事

- 三项排除项原样不动；分享流程不动（不在前 2 分钟主线上，且宽度规则未定位）；审计未覆盖的角落不下结论。
- 未重写 Tile/娃娃屋引擎，未新增工具、模式、房间、数据字段；B 的画廊瓷砖未改成预览卡（它们是浏览入口，点开后本来就走共享预览卡）；A3 的 My World 2.0 搜索/列表空态未加按钮（前者缺 board 上下文，后者已有 Add 按钮）；C 的 HUD 左侧导航栏、"Back to box" 等导航类控件未动；D 的 `mnh-uvs` 规则与 Wiki 子元素层级未动；E 的文字按钮（pills/seg/chips）未扩到 44px（会改变面板布局）。

## 已做的验证

- 全部 5 批标记在合并文件中 grep 到；v1 的 8 个关键标记（sheetStack、landingToast、submitNewList、wc:inbox-pending、previewCard、placedBy、data-mn-rename、destructive）数量与基线一致，无回归。
- 页面骨架完整；全部 88 个内联 `<script>` 块通过 `node --check`（合并后复查两次，0 失败；合并修正后亦复查通过）。
- 与基线的 diff 逐行扫过：无任何一处改动涉及排除项（dock、宠物菜单、AI 搜索相关字符串零命中）。
- v1 副本与原始基线 md5 合并前后一致，未被改动；未对 GitHub 仓库做任何操作；未尝试 artifact 发布。

## 仍需真机/浏览器实测（子代理无浏览器权限，未验证）

1. 0 世界主角：输入主题 → 向导生成步是否带上主题；「Start empty」是否直达向导空步；「More…」里旧卡片是否完好。
2. 「第一步」清单卡的三次跳转（Capture 聚焦 timing、换肤、建造视图）与关闭记忆。
3. ＋ 表单三行 + More…；向导第 2 步全选状态与取消；预览卡数量与创建。
4. 「🧱 Build」主按钮、动词标签位置、换肤/换岛即时生效与 Done 返回。
5. 从设置进 Inbox 再返回；Guide 里 Answer 编辑器层与关闭回 Guide；Wiki Portal 在 My World 之上打开、Esc 逐层关闭。
6. 搜索区域结果排序与跳转；总览主岛计数；各皮肤下的中心岛图标；长按提示只出现一次；Night 文案。
7. 完整走一遍「零 → 一句话生成第一版 → 手动改」并确认 2 分钟内不用思考。
