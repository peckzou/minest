# Web20 教师后台与学习内容交接

更新：2026-10-09  
状态：**已部署到 Vercel，教师端卡片/题目管理可用**

本文承接 Web20 学生端、教师游戏房间和 Study Arcade 的后续开发。iPhone/Pet 的部署流程仍以 `DOCS/HANDOFF_44.4_DEPLOY.md` 与 `DOCS/HANDOFF_44.5_PET.md` 为准。

## 1. 线上入口

| 用途 | 地址 |
|---|---|
| 教师后台 | https://minest1.vercel.app/web20.teacher.html |
| 学生端（示例房间） | https://minest1.vercel.app/web20.0.html?code=CPA2G4 |
| Study Arcade（示例房间） | https://minest1.vercel.app/web20.student-arcade.html?code=CPA2G4 |
| 房间配置 API | https://minest1.vercel.app/api/rooms/CPA2G4 |
| Vercel 项目 | `minest1`，生产域名 `https://minest1.vercel.app` |

最近一次生产部署已返回 HTTP 200。房间 `CPA2G4` 没有被测试数据覆盖，API 当前为空配置时，页面会回退到默认看板 JSON。

## 2. 本轮实现

教师后台 `web20.teacher.html` 现在可以：

- 选择默认学习看板、生成或手动输入游戏码。
- 打开/关闭房间并复制学生链接。
- 新增和删除学习列。
- 新增、编辑和删除卡片。
- 编辑卡片的中文标题、拼音、答案/释义和例句。
- 为当前卡片新增、编辑和删除选择题；每题至少需要题干、正确答案和两个选项。
- 将编辑后的完整 board 快照发布到房间。

学生页 `web20.0.html` 和原版 Arcade 页 `web20.student-arcade.html` 会优先读取房间 API 返回的 `board` 快照；没有快照时读取 `data` 指向的静态看板文件。学生端仍按学习列逐关解锁，Study Arcade 顺序为：

`Card Flinger → Swipe Judgment → Glass Fruit → Glass Blast → Whack-a-Term → What's Missing? → Smash It`

## 3. 代码位置

- [教师后台](/Users/cece/Documents/minest/web20.teacher.html)
- [学生端](/Users/cece/Documents/minest/web20.0.html)
- [Study Arcade](/Users/cece/Documents/minest/web20.student-arcade.html)
- [房间 API](/Users/cece/Documents/minest/api/rooms/[code].mjs)
- [默认看板](/Users/cece/Documents/minest/student-board-data/minest-cpa-chinese-grade-4-cycle-2.json)

教师端的主要函数位于内嵌脚本中：`renderContent`、`saveCardEdits`、`addCard`、`deleteCard`、`addColumn`、`editQuestion` 和 `saveRoom`。

## 4. 发布数据链路

点击 **Publish content to room** 或 **Save assignment** 时，教师端组装以下房间快照：

```js
{
  code: "CPA2G4",
  title: "Assigned board title",
  data: "./student-board-data/minest-cpa-chinese-grade-4-cycle-2.json",
  board: { /* 教师编辑后的看板快照 */ },
  open: true,
  updated:  timestamp
}
```

流程是：

1. 先写教师浏览器的 `localStorage`：`minest-room-config-{CODE}`。
2. `PUT /api/rooms/{CODE}`。
3. API 将数据写入 Firebase Realtime Database 的 `/minest-rooms/{CODE}.json`。
4. 学生页/Arcade 用 `GET /api/rooms/{CODE}` 读取 `board`，再渲染学习内容。

卡片的编辑字段会编码回兼容原看板格式的 `desc`：

```text
拼音 · 答案/释义
例句 Example: example text
```

题目保存在卡片的 `questions` 数组中，结构为：

```js
{
  id: "q-...",
  prompt: "题干",
  choices: ["选项 A", "选项 B"],
  answer: "选项 A"
}
```

## 5. 接手后的验证

建议用一个临时游戏码完成以下验证，不要直接改生产课堂的内容：

1. 打开教师后台，输入或生成游戏码。
2. 新增一张卡片，填写标题、拼音、答案和例句，保存并发布。
3. 新增一题，确认正确答案包含在选项中，然后再次发布。
4. 用学生链接打开 `web20.0.html?code=CODE`，确认卡片内容更新且学生不能编辑。
5. 进入对应学习关卡，确认教师题目能出现并且答对后才能继续。
6. 打开 `web20.student-arcade.html?code=CODE`，确认卡片内容可用、七个模式按顺序解锁。
7. 在教师端关闭房间，确认学生重新加入时看到房间关闭提示；重新打开后再验证。
8. 用 `GET /api/rooms/CODE` 检查 `board`、`open` 和 `updated` 是否正确。

基础检查命令：

```bash
cd /Users/cece/Documents/minest
curl -I https://minest1.vercel.app/web20.teacher.html
curl -I 'https://minest1.vercel.app/web20.0.html?code=CPA2G4'
curl -I 'https://minest1.vercel.app/web20.student-arcade.html?code=CPA2G4'
curl -s https://minest1.vercel.app/api/rooms/CPA2G4
```

内嵌 HTML 脚本的语法检查可用：

```bash
node -e "const fs=require('fs'); for (const f of ['web20.teacher.html','web20.0.html','web20.student-arcade.html']) { const s=fs.readFileSync(f,'utf8'); const js=[...s.matchAll(/<script(?:\\s[^>]*)?>([\\s\\S]*?)<\\/script>/gi)].map(m=>m[1]).join('\\n'); fs.writeFileSync('/tmp/'+f+'.js',js); }"
node --check /tmp/web20.teacher.html.js
node --check /tmp/web20.0.html.js
node --check /tmp/web20.student-arcade.html.js
node --check 'api/rooms/[code].mjs'
```

## 6. 已知限制与后续工作

- `PUT /api/rooms/{CODE}` 当前按游戏码公开写入，没有教师认证或管理密钥。任何知道游戏码的人都可能覆盖房间内容；正式课堂使用前应增加 Firebase Auth、教师 token 或服务端签名校验。
- 教师端排行榜目前读取 `localStorage` 的 `minest-room-leaderboard-{CODE}`，因此只在同一浏览器配置文件内共享；它还不是跨设备的实时排行榜。若要公网课堂使用，需要新增排行榜读写 API，并在学生端定期同步。
- 学生页顶部的 `Game questions` 统计目前显示卡片数量，实际自定义题目仍会正常用于关卡；若需要精确统计，应改为汇总每张卡片的 `questions.length`。
- 房间 API 使用 Firebase Realtime Database 默认项目地址；如更换 Firebase 项目，应设置 Vercel 环境变量 `FIREBASE_DATABASE_URL` 并重新部署。
- 每次修改教师端、学生端、Arcade 或 API 后，需要重新执行 `npx --yes vercel --prod --yes`，并重新验证三个页面和房间 API。
- 当前工作区有大量其他版本和未跟踪文件。后续提交时只选择本任务相关文件，避免把 iOS token、临时资源或大型模型文件提交进仓库。

## 7. 交接重点

继续开发时优先保持 `board` 快照格式兼容默认 JSON，保证旧房间仍能通过 `data` 回退加载。任何新增卡片字段都应同时考虑教师编辑器、学生卡片解析、学习关卡题目和 Study Arcade 的数据入口；发布前先用临时房间码验证，再更新生产房间。
