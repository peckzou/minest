# Minest Duo Holographic Portal（独立原型）

iPhone Duo 半折叠全息显示 Demo。完全独立于 Minest 主应用：只引用仓库已有的 `vendor/three.min.js`（r128），
没有改动 `index.html`、`iPhoneDuo.html`、`ios/`、`ui/`、`tools/` 中的任何文件。未提交、未推送。

## 运行

```bash
cd /Users/cece/Documents/minest-duo && python3 -m http.server 8151
```

打开 `http://localhost:8151/hologram/`（`?mode=2` / `?mode=3` 可直接进入对应模式）。
摄像头只在 localhost 或 HTTPS 下可用；要在真机上测，需要用 HTTPS 提供这个目录。

| 文件 | 内容 |
|---|---|
| `index.html` / `style.css` | 页面、背景层（摄像头 / Demo / 投影台）、控制条和面板 |
| `js/models.js` | 三个程序化模型：字母 M、科幻飞船、圣托里尼体素小屋 |
| `js/materials.js` | 原创 GLSL：全息主体、底座光环、光束、粒子、投影台网格 |
| `js/app.js` | 模式、摄像头、Duo 离轴投影、手势、面板、动态分辨率 |

操作：单指拖动旋转 · 双指（或滚轮）缩放 · 轻点切换展品 · 长按（或 ⚙）打开面板。键盘：`1/2/3` 模式，空格下一个，`r` 重置，`p` 面板。

## 许可证检查

- `chrismaldona2/threejs-imperial-transmission`：GitHub API 返回 `license: null`，仓库里没有 LICENSE 文件，
  README 和 `package.json` 也没有许可声明。没有许可证 = 默认保留所有权利，并且其模型是第三方素材（Vader 等）。
  **结论：没有复制它的任何源码、Shader、模型、贴图或音频**，只参考了视觉语言（菲涅尔边缘光、扫描线、闪烁、点击切换）。
  本目录的 Shader 和模型全部是为这个原型新写的。
- three.js r128：MIT（仓库 `vendor/` 中已有）。

## 参考视频

- Brian Hertzog 的推文视频：**看到了**。在内置浏览器里未登录播放了 17 秒视频，按低分辨率截了 4 帧。
  确认的画面：设备横向笔记本姿态；上屏是真实背景；下屏深色带网格，折痕附近有同心圆环；发光模型从圆环升起并跨到上屏；
  圆环在没有模型时仍然保留；下屏底边有一排小按钮。**没看清的**：模型细节、头部追踪时的视差变化幅度、他用的投影算法。
- Imperial Transmission 的线上 Demo：没有打开运行，只读了它的 README 和文件清单。

## 实现状态

**已实现（在桌面预览浏览器里实际操作并截图核对过）**
- 三个模式共用同一场景、模型、材质：Hologram（黑底）/ Passthrough / Duo Portal，可随时切换。
- 全息材质：青/电光蓝、Fresnel 边缘光、水平扫描线 + 上行亮带、随机闪烁、整行错位的信号干扰、加色半透明。没有用 Bloom 后期。
- 底座能量光环、光束、上升粒子；模型自下而上逐行生成；切换时信号解体（方块噪声 + 行撕裂）。
- 三个程序化模型及切换、旋转、缩放；面板的三个开关、三个滑块、重置视角、重新生成。
- 摄像头流程：`getUserMedia({ video: { facingMode: { ideal: 'environment' } } })`；请求中 / 拒绝 / 无摄像头 / 被占用 / 非安全上下文各有状态提示；
  失败时显示带水印的程序生成 Demo 背景（不是静态图片冒充）；离开模式、切后台、关闭页面时停止轨道。
- Duo 布局：上屏摄像头背景 + 全息，下屏投影台；折痕位置、折叠角度、观看仰角手动校准并保存；
  有 Viewport Segments 时用系统分区，Device Posture 仅显示。
- 竖屏、横屏、窗口尺寸变化时重新布局，没有黑屏或白边。
- 按帧时间调渲染分辨率（50%–100%）。预览里稳定 60 FPS、100%。

**近似实现**
- 跨折痕连续：每半屏按"固定假设视点"（约 40 cm 外、仰角可调）做离轴投影，模型在折痕处数学上连续。
  但视点是假设的、不追踪，所以只有眼睛大致在假设位置时才对得上；偏离后上下屏会错位。
- Passthrough：后置摄像头画面铺满背景（`object-fit: cover`），略微压暗以保证全息可读。
  摄像头视角和人眼透过屏幕看到的并不一致，是"像透明"而不是真正对齐的透视。
- 体积感：靠加色混合、背面保留和光束模拟，不是真正的体渲染。

**未实现**
- 头部 / 眼部追踪（按要求不做）。
- 左右分屏（书本姿态）的 Portal 布局：只会提示转成上下姿态。
- 声音、展品的实际 Minest 内容接入。

**未测试**
- 真实摄像头画面：预览浏览器禁止摄像头，实际走到的是"拒绝 → Demo 背景"；"无摄像头"和"实时画面"两条路径
  是在控制台里替换 `getUserMedia`（抛 `NotFoundError` / 返回 canvas 模拟流）验证的，轨道停止也是用模拟流确认的。
- 任何真机：真实 Duo、iPhone Safari、iPad、Android 都没有跑过。
- Viewport Segments / Device Posture 分支：预览环境里没有双分区，这段代码没有被执行过。
- 触摸手势用的是脚本派发的 PointerEvent 和鼠标，没有用真实手指。
- 低端设备上的降分辨率路径（预览里始终 60 FPS，没有触发过）。

## 真机上还要验证的

1. iPhone Safari 的权限弹窗、后置摄像头是否被选中、横竖屏切换时视频方向和裁切。
2. 真实 Duo 半折叠时折痕的实际位置（默认 50%）、合适的折叠角度和仰角默认值、假设视距是否合理。
3. 明亮背景下全息的可读性（加色混合在亮背景上会发白）。
4. 帧率和发热，尤其是摄像头 + WebGL 同时运行时。
5. 安全区、灵动岛、底部横条与控制条的遮挡；长按是否与系统手势冲突。

## 已知限制

- 屏幕不会向空气里投出任何东西。**真实能做到的**是：屏幕上的一幅画面，上屏叠在摄像头画面上，下屏画投影台。
  **空间错觉**来自三点：半折叠的两块屏互相垂直、离轴投影让模型在折痕处接续、摄像头背景让上屏"像玻璃"。
  错觉只在假设视点附近成立；没有追踪就没有运动视差。
- 在平放的显示器上看 Duo 模式，模型会在折痕处"折一下"，这是为半折叠姿态算的画面，属于正常现象；把折叠角度调到 180° 可看到未折的投影。
- 横屏且高度很小时，舞台会缩得比较小，模式 1/2 下光环下沿会被控制条压住一点。
- 模型旋转时信号干扰的错位方向跟着模型转，而不是始终水平于屏幕。

## 装进 Minest App（Duo 测试入口）

- `python3 hologram/build_native.py` 把本目录打成单个 `ios/Minest/Minest/hologram.html`（App 包是扁平的，CSS/JS 内联，只引用包里的 `three.min.js`）。改了 `hologram/` 之后要重跑。
- 入口按钮由原生层注入（`MinestWebView.swift` 的 `holoSource`）：右上角"◈ 全息"，只在 iPhone Duo 硬件（`iPhone19,4`）或页面处于 `html.duo` 时出现，点了进 `hologram.html?mode=3`；页面里"‹ Minest"返回。没有改任何生成的 HTML 页面。
- 摄像头：`Minest-Info.plist` 加了 `NSCameraUsageDescription`；`requestMediaCapturePermissionFor` 对自带的 `file://` 页面放行摄像头。
- 构建安装：`xcodebuild -project ios/Minest/Minest.xcodeproj -scheme Minest -configuration Debug -destination 'id=<Duo UDID>' -derivedDataPath ios/Minest/build_device build`，再 `xcrun devicectl device install app`。

真机情况（PeckiPhone Duo，2026-11-11）：外屏横向时截到过一张图——按钮可进入、后置摄像头实时画面、Duo 模式渲染正常。
内屏（展开 / 半折叠）的画面没有截到：`devicectl` 只截主显示器（外屏），所以折痕对位、折叠角度默认值、帧率仍未验证。
设备信息显示内屏竖向时为 4.37 × 6.21 英寸、外屏 3.04 × 4.42 英寸，据此推断内屏竖向时铰链是水平的、在 50% 高度（推断，未实测）。

## 第二轮：Vader 展品、原生透视、头部追踪（2026-11-12）

- **Vader 展品**（第四个）：`js/exhibit_vader.js`，由参考仓库的 `highpoly_vader.glb` 量化而来，用本原型自己的全息 Shader 渲染。
  **这是第三方素材**（credits 注明来自 CGTrader，原仓库声明仅限非商业/个人使用，角色形象属于其权利人），
  只用于本机测试；发布前删掉这个文件和 `index.html` 里对应的一行即可。App 里的入口默认打开它（`?ex=3`）。
- **原生后置透视**：`ios/Minest/Minest/HoloCaptureService.swift`。后置摄像头画面由原生预览层画在网页下面（网页透明），
  不再走 `getUserMedia`。面板里"透视缩放"可以放大背景，让它和屏幕后面的真实景物大小接近。
- **头部追踪**：同一个 `AVCaptureMultiCamSession` 里同时开前置摄像头，Vision 找人脸和瞳孔，
  把头的位置（角度 + 由脸宽估的距离）发给网页；网页把它当成视点，每帧重算两块屏的离轴投影。模式 1/2 下是小幅环绕视差。
  面板：头部追踪开关、左右反向、上下反向、追踪强度、头部校准（把当前位置当正中）。
- 旧版 App 或桌面浏览器里没有原生层：自动退回 `getUserMedia`，没有头部追踪。

验证情况：
- 桌面预览：Vader 展品显示正常；用控制台模拟头部事件，视点和投影跟着变（`HOLO.debug().head`）。
- 真机：**只验证到编译通过并安装成功**。原生摄像头层、双摄同开、头部追踪的方向和强度、内屏上的画面方向都没有在真机上看过。
  最可能要调的：头部左右/上下方向反了（面板里有反向开关）、内屏上背景画面方向不对、这台设备不支持前后摄像头同开（那样只有透视没有追踪，面板会写明）。
