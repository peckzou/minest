# Minest

> **iPhone 40.7** · 学习看板 + Clear 手势列表 + Apple Wallet 卡片 + Heads Up 单卡复习 + Apple Fitness 风格勋章系统。
> 网页版：<https://focusboard-drab.vercel.app/iphone> · iOS App 与 Apple Watch 同步。

---

## 功能一览（40.7）

### 一、看板与卡片
- **多看板**：新建、切换、复制、归档、删除；列表可重命名、置顶、按列表筛选、显示/隐藏卡片数
- **三种视图**：Kanban 看板、3D 卡片视图（Cover Flow，和看板之间有折叠过渡动画）、Active Recall 复习模式（Drill）
- **卡片编辑**：快速编辑（E 键）、完整详情、标签、日期、颜色、封面（粘贴 YouTube / Vimeo 链接自动生成）、清单（checklist）、成员、优先级
- **卡片操作**：复制、移到下一个列表、归档、删除；可在卡片之间或顶部插入新卡
- 一次输入多行即生成多张卡片
- 打勾的卡片在看板里自动沉到底部
- 卡片折叠成组（粉色母卡），可展开、收起、拆回列表
- 熟练度 1–5 级、朗读卡片（Read aloud）、打乱顺序
- 横屏 / 竖屏自适应，Zen 专注模式

### 二、Clear 模式（全屏手势列表）
- 左右滑一张卡进入；颜色按位置从红渐变到黄，完成的卡变黑
- **单击编辑**：手指点哪个字，光标就落在哪，原地修改
- **下拉新建**：像 Clear 一样“翻折”出新的一行
- **点空白自动保存**：新卡或修改后的标题都会保存
- **长按母卡折叠**：一只手长按约 0.4 秒，其他行开始晃动；另一只手连续点要折叠进去的行；松开长按的手，折叠完成
- 双指张开可展开折叠组
- Mail 式左右滑：右滑“完成 / 归档”，左滑“高 / 中 / 低”优先级

### 三、Wallet
- **卡片 wallet**：Apple Wallet 风格层叠卡片，轻点展开；滑动即滚动；按住约 0.2 秒拿起排序，拖到屏幕边缘自动滚动，20+ 张卡也流畅
- **列表 wallet**：整个看板的列表以 wallet 形式展示，可拖动给列表排序
- 两种 wallet 里排好的顺序都会同步回看板

### 四、Heads Up 单卡模式
- 全屏单卡，右上角显示“2/42”式计数，卡片浮在主题背景上
- 陀螺仪手势，每次触发都有震动：

  | 手势 | 含义 | 效果 |
  | :--- | :--- | :--- |
  | ⬇️ 下翻（扣下手机） | Correct | 打勾消除 |
  | ⬆️ 上翻 | 不确定 | 留着再学 |
  | ⬅️ 左翻 | 看详情 | 卡片翻到背面 |
  | ➡️ 右翻 | Pass | 下一张 |

- 也支持触摸：轻点翻面、甩动操作

### 五、学习、游戏与特效
- AI 学习助手：Gemini（需自行配置 API Key），回答可朗读
- Study Arcade 学习小游戏：Glass Blast、Glass City、Glass Fruit、Glass Tunnel、Smash It 等
- Ripple Explore（涟漪探索）
- Card FX（卡片特效）、Light FX（光效）
- 多套主题（深色、白色、多种渐变玻璃配色）

### 六、Summary（Apple Fitness 风格）
- 三环，记录每日完成情况
- **Awards 勋章**：Badge Wall 勋章墙（灰色未解锁 → 领取后变彩色，点开有 3D 旋转 5 圈）；Awards 精选轮播和 Index 图鉴
- **三环闭合庆祝**：三环闭合后，先播庆祝动画，再领取神秘勋章
- **Strike 连续天数勋章**：达到 3、7、14 等天数时，对应勋章浮现在勋章墙上，领取后吸回墙上
- 下滑时标题栏自动隐藏

### 七、同步与数据
- Google 登录
- 云同步，压缩存储（看板很大也不会超过 Firestore 单文档 1MB 的限制）
- 导入 Trello 的 JSON 导出文件
- 导出整个看板的 JSON 备份
- 本地 IndexedDB 存储

### 八、iPhone 系统整合
- 主屏长按 App 图标的快捷入口：开始计时、新建卡片
- 桌面小组件：显示手机上最后停留的那个列表；在小组件里打勾会写回看板，已打勾的隐藏，下一张补上
- 灵动岛 / 实时活动：显示计时和学习进度，跟随当前列表
- Spotlight 搜索卡片、通知提醒、分享

### 九、Apple Watch
- 三环，圆环中央显示 strike 天数
- 右下角入口进入勋章墙，点开有 5 圈旋转
- 三环闭合庆祝和勋章领取动画
- 显示和手机同一个列表，可以打勾

---

## 文件结构

| 路径 | 说明 |
| :--- | :--- |
| `iPhone40.7.html` | 当前 iPhone 版本（单文件 React 应用） |
| `iphone.html` | 当前版本的副本，网页 `/iphone` 入口 |
| `iPhoneXX.X.html` | 各历史版本存档 |
| `ios/Minest/` | iOS App（WKWebView 外壳 + 小组件、灵动岛、快捷入口）与 Apple Watch App |
| `badge-index/` | Badge Wall 勋章墙与 Index 图鉴页面 |
| `badge-challenge-31.5/` | 勋章领取动画 |
| `badge-animations-31.5-ceremony/` | 三环闭合庆祝动画 |
| `badge-animations-v31.5/` | Strike 勋章墙 |
| `auth-bridge.html` | iOS App 的 Google 登录桥接页 |
| `vercel.json` | Vercel 路由（`/iphone` 指向当前版本） |

---

## 本地运行

纯前端，无需构建：

```bash
cd ~/Documents/minest
python3 -m http.server 3005
```

然后在浏览器打开 `http://localhost:3005/iphone.html`。
