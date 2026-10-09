# Minest 44.4 部署交接（iPhone 版 + Web 版）

更新：2026-10-08 · 最新提交 `a48dac0`（main，已推送）

## 1. 现在线上是什么

| 平台 | 内容 | 来源 |
|---|---|---|
| Web 手机版 | `https://minest-app.vercel.app/iphone`（= `/`）→ `iphone.html` = **iPhone44.4.html** | GitHub `peckzou/minest` main，Vercel 自动部署 |
| Web 桌面版 | `https://minest-app.vercel.app/web18.0.html`（44.4 菜单里的 Desktop 按钮打开它） | 同上 |
| iOS App | 本地包 `ios/Minest/Minest/iphone18.0.html`（App 优先加载）和 `iphone.html`，都 = iPhone44.4.html | 已装到 iPhone 00008130-00010CC63AE8001C |
| Apple Watch | MinestWatch.app | 已装到 Watch 00008301-588770962E2A402E |
| Pet Raising | `octopus-pet-raising-v6/`，App 和网页都**从 Vercel 加载**（推送即更新 App 里的 Pet Raising） | 同 Web |

同一个仓库也服务 `focusboard-drab.vercel.app`。

## 2. 一次发布的标准步骤

1. **以上一版为基础新建版本文件**：`iPhoneX.Y.html`，更新 `<title>` 和 `board-version` 标签。
2. **复制成三个入口**：
   ```bash
   cp iPhoneX.Y.html iphone.html
   cp iPhoneX.Y.html ios/Minest/Minest/iphone.html
   cp iPhoneX.Y.html ios/Minest/Minest/iphone18.0.html
   ```
3. **`.vercelignore`**：在文件**末尾**的保留规则里加 `!iPhoneX.Y.html`。Vercel 匹配忽略规则时不分大小写，所以保留规则必须放在最后。`/` 和 `/iphone` 已经指向 `iphone.html`，`vercel.json` 一般不用改。
4. **改过的 Pet Raising 文件要更新 `octopus-pet-raising-v6/index.html` 里的 `?v=` 缓存参数**。WKWebView 和浏览器都会缓存这些文件。主页面里 iframe 的地址带 `v=4441`，改了 Pet Raising 的入口页也要一起更新。
5. **只提交本次发布的文件**（见第 6 节的禁止提交清单）。提交前用 `MinestWebView.swift` 里那个 token 的前几位 grep 一遍暂存区（`git diff --cached | grep -c <前几位>`），结果必须是 0。不要把 token 或它的任何片段写进仓库，包括文档。
6. **推送**：`git push origin main` 会触发 Vercel 部署，约 1–2 分钟。确认是否上线：
   ```bash
   curl -s https://minest-app.vercel.app/iphone.html | grep -c "<本次新加的特征字符串>"
   ```
7. **iOS 编译、安装**：
   ```bash
   cd ios/Minest
   xcodebuild -scheme Minest -configuration Debug -destination 'generic/platform=iOS' -allowProvisioningUpdates build
   APP=$(ls -dt ~/Library/Developer/Xcode/DerivedData/*/Build/Products/Debug-iphoneos/Minest.app | head -1)
   xcrun devicectl device install app --device 00008130-00010CC63AE8001C "$APP"
   xcrun devicectl device process launch --device 00008130-00010CC63AE8001C com.zouminmin.minest
   ```
   - 成功时会输出 "App installed"。
   - 报 CoreDeviceError 4016，或设备显示 "available (paired)"，说明手机锁屏或不在同一网络，循环重试即可。
   - Watch 安装：`Debug-watchos/MinestWatch.app` 装到 00008301-588770962E2A402E。
   - **App 用的是本地工作区编译的**，包括下面第 6 节里那些没提交的 Swift 文件。
8. **手机上验证**：用调试通道（App 必须在前台）。
   ```bash
   echo "eval:<js>" > minest_command.txt
   xcrun devicectl device copy to --device <D> --domain-type appDataContainer \
     --domain-identifier com.zouminmin.minest --source minest_command.txt --destination Documents/minest_command.txt
   # 几秒后读回结果
   xcrun devicectl device copy from ... --source Documents/debug_eval_res.txt --destination res.txt
   ```
   不要随便截手机屏幕：只在刚启动 Minest 之后截。

## 3. 语音（44.4 的重点）

- **代码**：`voice-realtime-44.js` 是源文件。它**内嵌**在 `iPhone44.4.html` 里，位置以 `/* voice-realtime-44.js (inlined so the iOS app bundle has it too) */` 开头。改了源文件后要重新内嵌：把这行注释到下一个 `</script>` 之间的内容替换成新源文件。App 的本地包里没有外部 js，所以必须内嵌。
- **默认路线：流式语音**
  - 听写：App 里用 iOS 原生听写，浏览器里用 Web Speech。
  - 识别结果交给 `/api/minest/ai-chat-stream`（模型 `gpt-6-sol`，走 `OPENAI_BASE_URL` 中转）。
  - 一边收回复一边朗读。App 里用原生 AVSpeechSynthesizer，浏览器里用 `speechSynthesis`。
- **Realtime（OpenAI WebRTC）默认关闭**：只有 `localStorage.minest_voice_mode = 'realtime'` 时才会尝试，而且需要 OpenAI 官方 key（Vercel 上现有的 key 是给中转服务用的，OpenAI 官方不认）。用户决定**不用付费 key**，所以 Realtime 先搁置。服务器路由 `api/realtime/session.mjs` 保留，已修好读取 SDP 的问题，并接受 `?voice=` 指定音色。
- **token**
  - App 会自动注入 `localStorage.minest_ai_token`。
  - 浏览器没有 token 时，语音球会出现输入框，存一次即可，只存在当前浏览器。
  - **源码里不写 token。**
- **App 原生桥接**
  - 听写结果通过 `minestNativeEvent`（`{event:'minestSpeechResult', payload}`）传给页面。
  - 朗读用 `MinestNative.send('speakText', {text, lang, rate, id})` 和 `stopSpeaking`，回传事件是 `minestTTSStart`、`minestTTSBoundary`、`minestTTSEnd`。
  - 只有存在 `window.webkit.messageHandlers.minestBridge` 时才走原生路线。网页上的 `MinestNative` 是页面自己做的替身，不能用来判断是否在 App 里。
- **避免抢答**：`endOfTurnDelay()` 根据句尾决定等多久。问句或句号结尾 0.45–0.7 秒；"然后/因为/和/的/and/but" 等结尾或只说了一两个字等 1.6 秒；其他 0.8–1.1 秒。AI 思考和说话期间忽略迟到的识别结果。
- **人设**：服务器 `api/_minest/core.mjs` 里语音模式的系统提示固定为 "Octo，Minest 里的小章鱼学习伙伴"，1–2 句口语化回答。
- **模型名**：`localStorage.minest_ai_model` 可能是 AI 建板留下的 `chatgpt` 之类标签。语音遇到不像模型 id 的值，一律用 `gpt-6-sol`。
- **实测延迟**：AI 首字 1.6–3.5 秒（中转服务决定）；收到首字后 0.16 秒开口；句子之间几乎无停顿。

## 4. Pet Raising（44.4 的改动）

- **全屏**：主页面的遮罩没有顶栏，左上角是主页面自己的 ✕。在 App 里点 iframe 内部的 ✕ 传不到主页面，所以由外层负责关闭。
- **iframe 地址**：`octopus-pet-raising-v6/index.html?motion-set=p0&v=4441&pexit=1&sat=<上安全区>&sab=<下安全区>`。iframe 里 `env(safe-area-inset-*)` 是 0，所以安全区由外层测量后传入，`ui-v1.js` 读取后调整贴边按钮的位置。`pexit=1` 时隐藏 iframe 里的 ✕。
- **语音按钮**：iframe 左下角 60 px 的大按钮（`.ui-voice`），跟其他按钮一起自动隐藏。点击后 postMessage `{type:'minest-voice', action:'open'}`，打开主页面的语音球。
- **模型**：`models/avatar_web_rigged_v23j.glb`，贴图转成 JPEG，6.6 MB → 2.9 MB。旧的 `avatar_web_rigged_v23.glb` 仍保留。主程序 `assets/index-B9POu3Sx.js` 和主页面的 Mini Pet 都改用新文件。
- **预加载**：主页面加载约 4 秒后，空闲时读取 Pet Raising 的入口页，把里面列出的 js/css 和新模型用 `<link rel=prefetch>` 放进缓存。
- **界面英文**：UI 全部英文，包括 care / wardrobe / panel / copycat / house 和主程序里的开发面板。

## 5. 其他 44.4 内容

- **菜单**：所有屏幕都只在右侧排一列；屏幕矮时向左换列。Settings 在竖屏也显示。边缘滑动打开菜单时，按钮位置按数量计算（rAF + 100 ms 定时器兜底），不会乱序。
- **标签显示**：列表 "⋯" 菜单里有 Show/Hide Labels，按列表记忆，存在 `localStorage minest.hiddenLabels`。
- **Desktop 按钮**：打开 `web18.0.html`。

## 6. 禁止提交 / 需要注意的文件

- **`ios/Minest/Minest/MinestWebView.swift`：绝对不提交**，里面写死了 AI token。
- 另一个会话还没提交的改动，**不要顺手提交**：
  - `MinestBridge.swift`（44.4 在里面加了 `speakText` / `stopSpeaking`，音频模式改成 `.default`）
  - `NativeSpeechRecognitionManager.swift`（新文件，音频模式改成 `.default`）
  - `NativeARFaceTrackingManager.swift`（新文件）
  - `Minest-Info.plist`
  - badge-challenge/*、BadgeWall.tsx、iPhone18.0.html、根目录 index.html、downloaded-octopus/*
  - `ios/MinestProject/MyApp/iphone.html`
  - `vercel.json` 里的 41.372 改写规则
- **`NativeSpeechSynthesisManager.swift`（44.4 新增，原生朗读）也还没提交**：它依赖 `MinestBridge.swift` 里的改动，单独提交会让仓库里的版本编译不过。以后要和 `MinestBridge.swift` 一起处理，而且在那之前要先把 `MinestWebView.swift` 里的 token 移走。
- **`vercel.json` 只想提交部分改动时**：从 HEAD 生成干净副本加上要的改动，用 `git hash-object -w` + `git update-index --cacheinfo` 放进暂存区，工作区的文件不动。

## 7. 已知问题 / 下一步

- **嘈杂环境**：听写很灵敏，旁边的人声可能被当成提问。可以考虑过滤太短或不像完整句子的识别结果。
- **延迟**：剩下的主要是中转模型的首字时间。可以测一下中转服务有没有更快的小模型，给语音模式用。
- **Safari**：网页语音理论上可用（需要另存 token、允许麦克风和语音识别、打开系统听写），但还没实测。
- **Pet Raising 新界面**：全屏、外层 ✕、安全区、左下语音按钮还没在手机上目测确认；预览里已验证。
- **Realtime**：如果以后有官方 key，在 Vercel 加 `OPENAI_REALTIME_API_KEY`，`session.mjs` 改成优先用它（这一步还没做）；再把 `minest_voice_mode` 设为 `realtime`。

## 8. 待部署：44.5（Pet 联动 + Mini Pet AI 入口）

在网页预览里已验证，还没部署，也没在手机上测。

- **新版本**：`iPhone44.5.html`。按第 2 节复制成三个入口文件；`.vercelignore` 末尾加 `!iPhone44.5.html`。
- **Pet Raising 文件**：
  - 新增：`octopus-pet-raising-v6/reward-v1.js`、`octopus-pet-raising-v6/sync-v1.js`、`octopus-pet-raising-v6/glass-v1.js`（全部控件统一液态玻璃；衣柜和渲染设置从右上角弹出，点框外关闭）、`octopus-pet-raising-v6/chest-v1.js`（海底宝箱：三环全闭合得钥匙，Octo 开箱拿到新勋章，第一次开箱送海盗帽）
  - 修改：`care-v2.js`（`__octoCare.reward/fx/toast`）、`cosmetics-v1.js`（彩色皮肤兼容 three r128，修好 Mini Pet 身体消失的问题）、`index.html`
  - 缓存参数：以 `octopus-pet-raising-v6/index.html` 里的 `?v=` 为准（这一轮改动较多，部署时按当前文件原样发布即可）。主页面里 iframe 的地址是 `v=445`，Mini Pet 加载的 cosmetics 是 `?v=4452`。
  - 本轮还改了：`ocean-life-v3.js`（黄色蝴蝶鱼换成鮟鱇鱼和寄居蟹；鱼身加了立体光影；点击只让被点的东西做反应并冒泡泡）、`interact-v1.js`（按住拖动诱导 Octo 游动，代替单击游过去；Octo 会对被点的东西做出反应）、`house-v1.js`（新增默认的贝壳屋，原来的珊瑚小屋改为 Lv 3 解锁，衣柜新增 Home 标签页）、`chest-v1.js`（贝壳风格宝箱；三环闭合后只发光，点宝箱才会打开）。
  - `cosmetics-v1.js` 新增 10 件物品：泡泡棒、棒棒糖、派对帽、墨镜、铅笔、放大镜、花环、沙滩球、尤克里里、海盗帽。另外给 Pet Raising 的精简版 three.js 补了球体生成器，旧配饰里的球也变圆了。
  - 手持勋章的图片来自 `badge-index/thumbs/<勋章id>.webp`（连胜勋章 `strike-N-days` 对应 `strike-N.webp`），这些图已经在线上；App 里从 Vercel 跨域加载，服务器已允许跨域。
- **语音**：源文件改为 `voice-realtime-45.js`。内嵌位置的标记是 `/* voice-realtime-45.js (inlined so the iOS app bundle has it too) */`。
- **新的页面接口（给以后开发参考）**：
  - `window.MinestRewards`：奖励事件，广播 `minest:reward`。
  - `window.__miniPetCtl`：Mini Pet 控制，`play` / `lookAt` / `hop` / `spin` / `burst` / `say` / `setBase`。
  - `window.MinestAI`：`openBuilder` / `openPronunciation` / `analyze` / `board`。
  - `window.MinestTips`：主动提示。
  - 事件：
    - Light FX：`fbfx:burst` / `fbfx:mode` / `fbfx:intro`
    - Mini Pet 手势：`minest:minipet-tap` / `minest:minipet-hold`
    - 语音状态：`minest:voice-state`
    - AI 完成：`minest:ai`
  - iframe 消息：`minest-reward`（hello / batch / ack）、`minest-pet-sync`（cosmetics / motion / spin / house / care）。
- **本地存储的键**：
  - `minest.octo.rewardQueue.v1`
  - `minest.rewards.day.v1`
  - `minest.rewards.badges.v1`
  - `minest.octo.mirror.v1`
  - `minest.octo.lookSynced`
  - `minest.octo.lastVisit`
  - `minest.tips.v1`
  - `minest.inbox.v1`（消息中心）
  - `minest.octo.latestBadge`（最新勋章，Octo 手里拿的就是它；iframe 里也存一份）
  - iframe 里：`minest.octo.chestKeys`（宝箱钥匙）、`minest.octo.treasure.v1`（宝箱开出的勋章收藏）、`minest.octo.house.style`（房子风格：shell / cottage）
  - iframe 里：`minest.octo.rewardsSeen.v1`
