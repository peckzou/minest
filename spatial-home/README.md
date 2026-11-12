# Minest · Spatial Home V1.0（Phase 1 + 2，独立原型）

> The Room Is the Interface. Objects Are the Apps.

一间圣托里尼风格的体素办公室（Santorini Atelier），房间里的物件就是 Minest 现有功能的入口。
独立目录，只引用仓库已有的 `vendor/three.min.js`（r128）。已经用 `tools/spatial-home/patch_spatial_home.py` 注入主应用（见下面一节）。未提交。

## 运行

```bash
cd /Users/cece/Documents/minest-duo && python3 -m http.server 8163
```

打开 `http://localhost:8163/spatial-home/`。
- `?app=<同源路径>` 指定要接的 Minest 构建（默认 `../index.html`，即 duo-v1 构建）。只接受同源地址。
- 例：在 `~/Documents` 起服务，`/minest-duo/spatial-home/?app=/minest/index.html` 接 main 分支的构建（有打字机和 Routine）。

| 文件 | 内容 |
|---|---|
| `index.html` / `home.css` | 页面、顶栏（Explore / Desk、人称、设置）、入口条、卡片、功能层 |
| `js/voxel.js` | 体素工具：盒子合并成一个几何体、面向明暗、16×16 像素颗粒贴图；调色板取自 `ui/world-displays.js` 的 aegean 主题 |
| `js/room.js` | 房间、家具、窗外村落与海、灯光；导出锚点、Desk 机位、碰撞盒 |
| `js/objects.js` | 七个物件：模型、反馈动画 `set(k)`、待机动画、点击盒、近景机位、功能绑定 |
| `js/bridge.js` | 连到现有功能（见下表） |
| `js/app.js` | 两种模式、行走、拾取、转场、设置、持久化；`MinestSpatialHome` 接口、主应用里的 Dock 入口和启动选项 |
| `../tools/spatial-home/patch_spatial_home.py` | 把上面这些注入主应用 |
| `../tools/spatial-home/port_main_modules.py` | 把 main 构建里的 Hermes / Keyflow / Typing Worlds / Liquid Routine 原样搬进 duo-v1 的页面 |

操作：拖动环顾 · WASD / 方向键行走（Q/E 转身）· 点地面走过去 · 点物件或标签进入 · `1`/`2` 切模式 · `V` 第一/第三人称 ·
触屏有左下摇杆 · Desk 模式双击回正 · 任何转场中点一下 / Esc 可跳过。

## 怎么接到现有功能

Minest 应用（同一个 `index.html`）在后台 iframe 里载入一次并一直保留；点物件时调用应用自己的入口函数，再把 iframe 显示出来。
回房间只是把 iframe 藏起来，所以功能里的状态（打开的看板、Routine、打字内容）不会丢。
回房间的方式：顶部 `⌂ Home`，或者功能自己的关闭按钮（桥接每 250ms 查一次 `isOpen()`，关了就自动回）。

| 物件 | 入口（从代码里找到的，不是猜的） | duo-v1 构建 | main 构建 |
|---|---|---|---|
| ⌨️ 打字机 | `MinestHermes.open()` / `MinestKeyflow.open()` / `MinestTypingWorlds.open()`，弹出选择（开着的那个排第一，标「继续」） | 有（从 main 移植） | 有 |
| 📘 日程本 | `MinestRoutine.open()`（Liquid Routine） | 有（从 main 移植，**只存在本机**） | 有 |
| 🎣 鱼竿 | `MinestPetRaising.open()`（`octopus-pet-raising-v6/`） | 有 | 有 |
| 📌 布告栏 | Kanban 就是应用本体 `#root`：关掉其他浮层后直接显示 | 有 | 有 |
| 📔 收藏册 | `MinestUniverse.open()`（My World 清单总览） | 有 | 有 |
| 🔮 全息投影仪 | 独立原型 `../hologram/index.html`（单独 iframe） | 有 | 有 |
| 🌀 魔法摆件 | `MinestOpenWorldsModal()`，或 `../worlds.html` | 有 | 有 |

没接的：
- **Type Workshop**：仓库里没有叫这个名字的功能。打字相关的是上面三个（只在 main），以及 duo-v1 未提交的「文字制作工坊」`MinestTextCraft`——它要先进入圣托里尼世界（依赖 `MinestVoxelDisplays` 的场景上下文 `U.ctx()`），没有可以从外面直接调的入口，所以没接，没做假入口。
- **Lists / Archive**：没有独立的“归档”功能（只有卡片上的 Archive 操作）。收藏册接的是 My World 清单总览；`MinestInventory.open(n)` 需要具体的 board/list 参数，没接。

## 状态

### 已实测（预览浏览器里实际操作，截图核对）
- 房间能打开、渲染，控制台无报错（只有一个 favicon 404）。
- Explore：点地面走过去、WASD 前进后退、方向键转身、碰撞（被墙和家具挡住）、第三人称（贴墙时镜头自动拉近）。
- Desk：一键切到桌前视角，拖动看两侧；下方入口条；进入 Desk 总是先面对桌子。
- 设置：默认进入模式（上次 / Explore / Desk）、减少动画、后台预载、每个物件接上了什么的列表。
- 布告栏 → Kanban：镜头靠近 → 卡片从一列移到下一列 → 进入看板 → `⌂ Home` 回到原视角（相机坐标回到进入前的值）。
- 鱼竿 → 宠物养成：鱼竿抖动、章鱼从桶里冒出 → 进入 → 回房间。
- 收藏册 → My World：册子从书架抽出、封面翻开 → 进入 → **点 My World 自己的 ✕ 自动回到房间**。
- 全息投影仪 → hologram 原型：光束和全息模型升起 → 进入 → 回房间。
- 魔法摆件 → 主题世界弹窗（桌面宽度和 375×812 两种尺寸都进入了）。
- 日程本 → Liquid Routine、打字机 → Hermes 3000：**用 main 构建**（`?app=/minest/index.html`）实测进入，日程本翻开动画正常，Routine 回房间后再进别的功能时会被关掉。
- duo-v1 构建下点打字机 / 日程本：弹出“还没有接上”并说明原因。
- 转场中点击可跳过，跳过后仍正确进入功能并能返回。

### 近似 / 有问题
- 宠物养成自带的 ✕：在预览里用鼠标点不动——**单独打开 `index.html` 也一样**，不是 Spatial Home 造成的（按钮当时带 `idle` 类，`pointer-events: none`）。用程序点它能关闭，并且 Spatial Home 会自动回房间。所以宠物页面暂时只能用 `⌂ Home` 回来。
- 窄屏下 duo-v1 构建会先盖一层 Duo 速览页（`.duo-gl`）；桥接在进入功能前替你点它自己的“完整 App ›”。
- 主题世界：从弹窗进入某个世界后，回房间只能用 `⌂ Home`（世界不会自己报告“已关闭”）。
- 回到房间时恢复的是**相机视角和模式**；物件动画回到静止状态（这是有意的：物件状态 Phase 3 才有持久化）。
- “不丢工作进度”靠的是 iframe 一直不卸载：同一次会话内成立；刷新页面后取决于各功能自己的存储。

### 未测试
- 真机 iPhone Duo（触屏摇杆、性能、阴影开销）。只在桌面预览和 375×812 模拟尺寸里看过。
- 打字机里实际打字（点了 Hermes 键盘两下，纸上看不出字，没深究）。Keyflow / Typing Worlds 里没有提交词——提交会写进 My World 的真实数据。
- 在 duo 构建里改 Routine 后刷新是否保留（用的是 main 的同一套本机存储代码，但没在 duo 里实测）。
- worlds.html 选项、减少动画选项的实际观感。
- iOS App 里加载（WKWebView 的 file:// 下 iframe 同源访问未验证）。

## 已接进主应用（duo-v1 的 index.html 及 8 个镜像）

```bash
python3 tools/spatial-home/patch_spatial_home.py            # 改了 spatial-home/ 之后重新注入
python3 tools/spatial-home/patch_spatial_home.py --check    # 只看状态
python3 tools/spatial-home/patch_spatial_home.py --remove   # 整个拿掉
```

- 做法和 `tools/santorini-69/patch_displays70.py` 相同：在 `index.html` 里原地放两个可替换的块
  （`<style id="mn-spatial-home-css">`、`<script id="mn-spatial-home">`，放在 `</body>` 前），再复制到改之前就和
  `index.html` 一模一样的镜像（`iPhoneDuo*.html`、`iphone.html`、`ios/Minest/Minest/` 下 5 个）。两个脚本谁先谁后都不会抹掉对方。
  没改页面里其他任何东西。
- 在主应用里，房间**直接跑在这个页面里**，不再另外载入一份应用：点物件就调用本页的入口函数，房间隐藏在功能上面，
  `⌂ Home` 再把房间叫回来。全息投影仪和 worlds.html 用一个 iframe（网页上走 `hologram/index.html`，iOS 扁平包里走 `hologram.html`）。
- **打开 Minest 默认先进入房间**（2026-11-12 起）。在房间设置里取消「打开 Minest 时先进入这间房间」就恢复成直接进看板；地址带 `?home=0` 这一次不进。房间不打开时不建 3D 场景，没有 WebGL 开销。
- 入口：
  - 玻璃 Dock（`.mn-bdock`）最左边一个拱门图标；另外在 `nav.ios-bottom-tab-bar` 里也加了「🏛 房间」（跟 CarFlash、Hermes 加入口的做法一样）；
  - 隐藏按钮 `#mn-spatial-home-trigger`（原生侧可以点）；
  - `window.MinestSpatialHome.open() / close() / isOpen()`；
  - 地址带 `?home=1`（即使关掉了启动进入，也会打开）。
- 房间右上角 ✕ =「进入完整的 Minest」：把从房间打开的功能用它们自己的 close 收起来（那些模块只是隐藏，不丢状态），落到看板。
- 学生模式（`isStudentMode()`，如 `?student=1`、`?play`）下不会自动进入房间（已实测）。

在主应用里实测过（预览浏览器，`http://localhost:8163/index.html`）：
- 新用户（没有保存过设置）启动直接进入房间，设置里的勾选框是勾上的；`?home=0` 不进、不建场景；学生链接不进。Dock 上的入口能打开房间，没有报错。
- 鱼竿→宠物养成、收藏册→My World（用它自己的 close 后自动回房间）、全息投影仪→`hologram/index.html`、
  布告栏→看板、魔法摆件→主题世界弹窗：都能进，`⌂ Home` 都能回到原来的 Desk 视角。
- 在功能里时再点 Dock 入口 = 回房间。✕ 退出后落在看板，没有残留的浮层。
- 取消勾选后启动直接进看板；`?home=1` 仍然会打开房间。
- 打字机和日程本：duo-v1 的构建里还是没有这两个功能，所以还是「还没有接上」。等 duo-v1 合并了 main 的 Hermes / Routine，不用改代码，会自动接上（入口按名字检测）。

主应用里还没验证：iOS App（file:// 下的 hologram.html / worlds.html 路径、WKWebView 的性能）、真机 Duo 的触屏。
`⌂ Home` 胶囊在看板上会稍微压住第一列标题的中间。

## 七个物件在 duo-v1 构建里全部接上（port_main_modules.py）

```bash
python3 tools/spatial-home/port_main_modules.py            # 默认从 ../minest/index.html（main 的构建）复制
python3 tools/spatial-home/port_main_modules.py --check
python3 tools/spatial-home/port_main_modules.py --remove
```

- 从 main 的构建页面里按 id **原样**复制这些块，放进 duo 的 `index.html`，再复制到 8 个镜像（和另外两个脚本同一套规则）：
  `mn-hermes-*`、`mn-keyflow-*`、`mn-typingworlds-*`、`mn-routine-style / src / cloud-merge / run`。页面从 16.2 MB 变成 18.7 MB。
- Routine 需要的两个本机存储工具（`MinestRoutineEnvelope`、`MinestRoutineHostStore`）在 main 里放在同步管理大块
  `minest-sync-management-v1` 里。**只剪出这两个纯函数**作为 `mn-routine-store`；main 的同步管理、云端传输都没有搬。
  结果：**duo 构建里的 Routine 只存在本机**，不上云。存储键和格式与 main 相同（`liquid-routine.envelope.v2` + `liquid-routine.v1`），以后这台设备换回 main 构建时，main 会按它自己的合并规则把这些数据带上云。
- 对复制过来的代码改了三处（每处都校验只匹配一次，main 变了脚本会停下来）：
  - Keyflow、Typing Worlds 各自往 Dock 加「•••」的旧入口关掉了（main 里因为有 `.mn-more-btn` 本来也不会出现；duo 没有这个按钮，不关就会多出两个 ••• 图块）。现在从房间里的打字机进入。Hermes 自己的底部标签入口保留。
  - Routine 在 iOS App 里「启动先开 Day Flow」的那一步：如果这次启动先进房间（`MinestSpatialHome.bootsFirst()`），它就让开，不会两个一起开。
- 在主应用里实测（预览浏览器，duo 的 `index.html`）：七个入口都检测到；
  日程本翻开 → Liquid Routine，**点 Routine 自己的 ✕ 自动回房间**；打字机弹出三个选项 → Hermes 3000、Keyflow 都能进（Keyflow 的 ✕ 第一下没反应、第二下关闭并回房间，原因没查）、Typing Worlds 的 3D 世界能渲染，**它自己的 ✕ 回房间**；Dock 上没有多出 ••• 图块；控制台无报错。
- 顶部 `⌂ Home` 进入功能 2.5 秒后缩成一个 30px 的小圆 ⌂（鼠标移上去展开），减少挡住功能自己顶栏的面积（之前在 Typing Worlds 里挡住了一个下拉框）。

## Phase 3–5 计划（本次未做）

**Phase 3 自由布置**
- 物件记录 `{ id, feature, env, anchor | p, ry, s }` 存 `localStorage`（之后跟随现有云同步）。现在的锚点表就是默认布局。
- 背包：列出所有可放物件（含未放置的），拖到场景里。放置面分类：桌面 / 墙面 / 地面 / 家具顶面 / 书架格，每个物件声明允许的面（布告栏只能上墙、打字机只能上桌面或家具顶……），用射线 + 面法线判定，网格吸附 1/8 格，90° 旋转，碰撞检测，✓/✕ 确认（沿用 Duo Phase 4 的手感）。
- 收回：放回背包，功能绑定不丢。

**Phase 4 环境切换**
- `room.js` 抽象成环境接口：`build()` 返回同名锚点集合 + 放置面 + Desk 机位。新增 Skyline Studio、Ocean Retreat、Forest Cabin。
- 切换时物件按“锚点名 → 新环境同名锚点”迁移；自由放置的按相对房间尺寸缩放坐标，放不下（碰撞或没有对应面）的落到最近的合法面，再不行进背包并提示。

**Phase 5 打磨**
- 转场：镜头路径避开家具；进入功能时用物件本身的颜色做揭幕。
- 光照：按本地时间的昼夜（太阳角度、窗外天色、夜里台灯和吊灯亮）。
- 材质：环境光遮蔽烘焙进顶点色；窗玻璃反光。
- 相机与移动端：双指缩放、Duo 内外屏不同 FOV、性能分级（关阴影、降像素比）。
- 认真读写文字一律进完整功能界面，不在倾斜的 3D 纸面上编辑。

## 入口物件更新（2026-11-12，第二个会话接手）

新文件 `js/entries.js`（`patch_spatial_home.py` 的 JS 列表和 `index.html` 都已加上；独立页另外载入 `../vendor/GLTFLoader.js`）。鱼竿已删除，由水族缸代替。

| 物件 | 位置 | 接到 | 动画 |
|---|---|---|---|
| ⌨️ 打字机 | 桌面左 | 只接 `MinestHermes`（经典打字机），不再弹出 3D Type 选项 | 按键、纸张推进、镜头靠近 |
| 🐙 Octo 水族缸 | 窗边角落（原鱼竿处） | `MinestPetRaising` | 载入真实 Octo 模型 `octopus-pet-raising-v6/models/avatar_web_rigged_v23j.glb`（与宠物养成、Aquarium 同一个），在缸里游动、转向，播放模型自带动画；载入失败时显示体素章鱼（触手摆动） |
| 🪶 羽毛笔 | 桌面左前 | 3D Type：构建里有 `window.MinestType3D` 就调用它；没有（duo-v1 现在没有）就打开同站 `type3d/index.html`，再没有就打开线上 `https://minest-app.vercel.app/type3d/index.html`（iOS 包里同样走线上）。七个世界：Filament（西部世界机器）、Firework、Topiary、Saber、Quill、Neon、Book。不接 Typing Worlds | 羽毛笔升起，在空中写出发光的 “3D Type” |
| 🫧 Mochi | 日程本右边 | 点击显示 Liquid Routine 当前任务卡（读 `liquid-routine.v1`，只读），卡上可再进完整 Routine | 在桌角走动、跳、休息、眨眼；外形按 Routine 里 Mochi 的颜色（乳白玻璃、浅蓝边、深蓝眼睛和高光） |
| 🔑 车钥匙 | 桌面前中 | `MinestDrive.open({ source: { type: 'workspace' } })`（Knowledge Drive） | 拿起钥匙 → 闪两下解锁 → 起身 → 切到车库：车灯闪、卷帘门升起 → 走向车辆、车门打开 → 坐进驾驶座、仪表亮 → 进入 |
| 🏅 勋章盒 / 勋章板 | 侧柜右 / 右墙（设置里切换） | 页面自己的 “Activity Rings & Badges” 按钮（`.minest-activity-modal-shell`） | 盒盖打开、三个环升起；环亮不亮按今天 `minest.rewards.day.v1` 的真实记录 |
| 📖 知识书架 | 日程本后面 | `MinestKnowledgeHub` | 翻页、台灯亮、镜头靠近 |
| 🚘 老爷车 | 侧柜左 | `MinestCarFlash`（车载闪卡 · CarPlay） | 车灯亮、仪表启动、镜头推进驾驶舱 |

- 所有转场都有右下角「跳过动画 ›」（或 Esc / 空格），跳过后直接进入功能。
- 实测（预览浏览器，独立页和主应用 `index.html?home=1`）：8 个入口都进入了正确的功能，并能回到房间；车载闪卡用它自己的 ✕ 会自动回房间；车钥匙跳过动画约 0.1 秒进入 Knowledge Drive；勋章盒和勋章板可以来回切换；控制台无报错。Mochi 的任务卡用临时测试数据验证过（测完已还原）。
- 车钥匙和车库是原创造型，没有使用任何品牌标志。
- 没做 / 没测：真机 Duo；物件拖放仍是 Phase 3（新物件已有锚点，和原有物件一样）；3D Type 页面（线上和仓库里的 `type3d/index.html` 一样）目前没有 Word List 按钮；Copilot 之后更新的版本一旦部署到线上 `type3d/`，羽毛笔打开的就是新版，不用改这里。

## 环境切换（Phase 4）+ 背包与自由摆放（Phase 3）+ 落基山列车（2026-11-12）

新文件：`js/env-manhattan.js`、`js/env-alpine.js`、`js/env-train.js`（`index.html` 和 `patch_spatial_home.py` 的 JS 列表都已加上）。
改动：`js/room.js`（环境注册表、家具按环境材质重建、`timeOfDay`、构建失败自动退回圣托里尼）、`js/app.js`（🌐 环境选择器、🎒 背包、摆放模式、每个环境各自的视角和布局、可走区域、列车轻微晃动）、`js/entries.js`（列车版车库转场）、`home.css`。

- 环境（🌐）：Santorini Atelier · Manhattan Skyline Studio · Alpine Meadow Chalet · Rocky Mountain Express · Banff。Ocean Retreat / Forest Cabin 从未做过，没有列出。
  - 曼哈顿：约 240 m 高的顶层工作室；窗外按曼哈顿网格生成三层楼群（近处楼高低于工作室，能越过屋顶和水塔看到天际线），帝国大厦（退台、塔尖、夜间顶灯）、哈德逊河、车流（一个 InstancedMesh）、云、窗灯随昼夜。
  - 阿尔卑斯：原木墙、梁、石壁炉（火光闪动）、加宽的横向观景窗；屋外近景草甸（草在顶点着色器里摆动）、野花、栅栏、谷仓，中景松林山坡，远景仿艾格 / 僧侣 / 少女峰的雪山；可以从门走到露台（`areas`）。Desk 视角略抬高以看到雪峰。
  - 列车：12 × 3.2 m 车厢（休息区 / 办公区 / 收藏区 / 玻璃顶观景），两侧车窗。窗外按 300 m 一段生成（森林 / 翡翠河 / 高山湖 / 峡谷高桥 / 隧道，由段号决定，永不循环），地面是一条连续高度函数所以段与段无缝；远处雪山 2 km 一段。车厢本身不动（物件不会漂移），世界向后滑动，相机只有极小的晃动；隧道里车厢灯自动变亮；行程距离存本机，刷新后接着走。实测约 57 fps（Mac 预览）。
  - 切换环境时物件按同名锚点放到新环境对应位置（列车里家具按区域整体平移 / 旋转，锚点跟着变换）；每个环境的视角、布局分别保存，互不覆盖。
- 光线（设置里）：跟随本地时间 / 白天 / 黄昏 / 夜晚。
- 背包（🎒）：
  - 功能物件：移动、收回、取出摆放；收回后功能仍可从下方入口进入。每个物件的近景机位改为相对物件本身，移到哪里镜头都对得上。
  - 陈列架：展示台（地面）、墙面置物架（墙面）、玻璃展柜（桌面 / 柜面）。
  - 我的物品：读取主应用看板（`MinestAI.boards()`）里的东西，用相框 + 小画架展示封面或名字；布局里只存 board / card / thing 的 id 和标题，不复制内容。
  - 摆放：点 / 拖到表面上（桌面、柜面、地面、墙面按物件类型限制），⟲ 旋转，✓ 放好，取消，🎒 收回；「恢复这个环境的默认摆放」。
  - 存储：`minest.spatialHome.v1` 里的 `layouts[env]`（本机）。还没有接云同步。
- 实测：四个环境里 13 个入口都能进入并返回（列车上全部 13 个逐一测过）；摆放后刷新仍在；圣托里尼的布局不影响阿尔卑斯；列车行驶约 2.8 km 后 Mochi 仍在原位；主应用 `index.html?home=1` 四个环境切换无报错；375 宽的手机尺寸顶栏不溢出。测试改动的布局都已恢复默认。
- 没做 / 没测：真机 iPhone / Duo；背包布局的云同步；“3D 作品”只有相框形式（duo 构建里没有 Type Workshop / 霓虹字作品，`MinestAssets3D` 用的是另一份 three.js 不能混进房间场景）；动态陈列装置（`ui/world-machines.js`）还没接进背包。

## 合并到 main（2026-11-12，1ba52c9）+ Magical Backpack V1（255909e）

- main 上的注入：`python3 tools/spatial-home/patch_spatial_home.py --pages main --boot-default on`（12 个页面逐页注入）；陈列引擎 `python3 tools/santorini-69/patch_displays70.py --pages main`。duo-v1 的 12 个已提交 Codex 改动和原生 Swift 改动没有合进来。
- `js/backpack.js` = `window.MinestBackpack`：分类 / 搜索 / 最近 / 收藏 + 快捷栏 / 真实模型缩略图（每帧几张）/ 可拖动旋转的 3D 预览 / 装载 List。内容全部来自现有模块（Type Workshop 作品 `mtw:item:*` + `MinestNeonWord`、`MinestMachines` 四种装置、陈列家具模板、房间功能物件、My World 收藏）。
- Quick Place：半透明预览、吸附面（地面 / 桌面 / 墙面 / 货架 / 展台 / 室外）、绿红反馈和原因、和家具 / 物件的碰撞、R / 方向键 / Enter / Esc。
- 模板可放多个、可复制；实体作品只有一件（再放 = 移动，跨环境也是移过来）；收回不改原作品和 List。
- 布局存 `MinestKnowledge` 的 `bp:home:<env>`（随账户同步），偏好 `bp:pref`。
- 入口物件不再有文字标签，改为小星光闪烁。
- 验收（预览浏览器，main 的 iPhoneDuo.html）：A 旋转明信片架放置并转动 ✓；B 装载 16 张卡的 List，抽出一张、放回原槽 ✓；C DREAM 霓虹字装到桌面并点亮 ✓；D 收回后作品记录不变 ✓；E 再放不复制（按钮变「移动」，始终 1 件）✓；F 打字机从背包移动后仍进入 Hermes ✓；G 刷新后展架（含 List）和作品位置都在 ✓；H 与 My World / 圣托里尼共用背包 ✗ 未做。
- 未做：H；其余 7 种装置（陈列引擎里本来就没做）；云同步只验证到写入 MinestKnowledge，没有用登录账户跨设备验证；真机只安装了 Duo，没有在设备上逐项操作。
