# Minest Duo 63 · 圣托里尼 3D ↔ 智能建造层级

`iPhoneDuo63.html` = `iPhoneDuo.html`（53.85，原样不动）+ 体素世界 62 层（`mn-voxel-62`）+ 本次新增的 `mn-oia-link-63`。没有修改任何旧文件，也没有改动 Oia 引擎和 My World 的代码。

## 原有实现与缺口

| 层级 | 原来已有 | 原来缺少 |
|---|---|---|
| World | 一键圣托里尼。Oia 体素世界的 167 座建筑，每座在岛上都有对应的 piece（`p.vox = 建筑 id`），房间存在 `p.rooms` | — |
| Building | 在 Oia 里走到墙边，出现 🚪 按钮 | 🚪 直接进入第一个房间的 🚶 Walk，跳过了 Dollhouse |
| Dollhouse（项目里的实际命名，即 `bldOpen` / `.mn-bv` / 第 3 层「Dollhouse」） | My World 的楼层剖面，以及控制台的 ✨ Smart Room、Suggest、Room Gallery、＋ 加房间、移动、大小、删除 | 从 Oia 进不来 |
| Room | 双击房间进入；控制台的 🛋 Room tools 和 🗄 Display tools（✨ Smart Display） | — |
| Display / Item | 双击展位打开（第 5 层）；点 Item 看卡片（第 6 层）；从 Box 拖卡片上展位；Smart Fill；Walk in 3D 里点 Item 打开卡片 | — |

结论：只缺一个连接点，就是 Oia 的那扇门。房间、展位、展品都存在岛自己的记录里，由 My World 保存和同步。展品引用的是看板上的卡片 ref，内容实时读取，不会复制一份。

## 63 的改动（适配层，约 250 行）

- **🚪 门口的选择**：在 Oia 里走到建筑门口，会显示这座建筑现有的「N 个房间 · N 个展位 · N 件展品」，以及两个入口：
  - **🏠 剖面 Dollhouse**：关掉 Oia，用控制台自己的入口（`data-wfbld`）打开这座建筑的 Dollhouse。之后的 Smart Room → 确认 → Refine → 双击房间 → Smart Display → 放展品 → 看卡片，全部走 My World 原有流程。
  - **🚶 走进去**：保留原来的行为，直接走进第一个房间；🌳 Outside 回到门口。
- **回到圣托里尼**：在 Dollhouse、Room、Display、Item 各层，底部都有「🇬🇷 位置 · 🚶 3D · 回到门口」小条。
  - 🚶 3D 调用 My World 自己的 Walk in，用 3D 看这个房间，里面的展品可以点开。
  - 「回到门口」直接回到 Oia，站在这座建筑的门口。
  - 用 ‹ 从建筑退出时，也会自动回到 Oia 门口。
- 实现方式：包住 `MinestOia.bind` 的 `enter` 钩子，原来的 `enter` 留给「🚶 走进去」使用。没有新增任何存储。

## 已验证的流程（无头 Chromium，1180×820）

1. 一键圣托里尼，Oia 正常启动（167 座建筑）。
2. 走到小酒馆（b1）门口 → 🚪 → 🏠 剖面 Dollhouse，进入第 3 层「Café」。
3. ✨ Smart Room → 翻到下一个方案（Gallery wing：4 个房间、2 层）→ ✓ Confirm。房间变成 Gallery hall、East gallery、Memory hall、Trophy room，并自动配好家具。
4. 双击 Gallery hall，进入第 4 层。切到 🗄 Display tools → ✨ Smart Display → ✓ Confirm，生成一个唱片架，放了 17 件真实展品（看板上「Music Notation & Reading」的卡片）。
5. 从 Box 把卡片「Pitch」拖到 Gallery 展位上；打开展位（第 5 层），再点开展品（第 6 层，显示卡片 Pitch）。
6. 🚶 3D 走进房间，看到展位和展品；✕ 退出 → 回到门口，回到 Oia 小酒馆门口。门口显示「4 个房间 · 2 个展位 · 18 件展品」。
7. 重新加载页面，再进圣托里尼：房间、展位、展品全部恢复（`Gallery hall: gallery×1, museum, easel, xrecords×17` 等）。
8. 换一座洞穴屋：同样进入 Dollhouse，有 7 个房间，Smart Room 可用。在 Dollhouse 按 ‹ 会自动回到洞穴屋门口。「🚶 走进去」这条旧路径也正常。

## 重新生成

```
python3 tools/oia-link-63/make63.py path/to/iPhoneDuo.html iPhoneDuo63.html
```
（`make63.py` 需要同一目录里有 `vx62.js` 和 `oialink63.js`。）
