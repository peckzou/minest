# 梦工坊 · Dream Workshop — Phases 1 to 6

From making a thing to directing an experience. One live 3D sandbox shared by four studios:

| Studio | What it does now |
|---|---|
| 造物 Model | 14 kinds of characters, props and set pieces (林肯, 人物, 讲解员, 演讲台, 舞台, 幕布, 长椅, 座椅, 聚光灯, 路灯, 旗帜, 立柱, 树, 告示牌); name, colour, sign text, size |
| 赋能 Behavior | Bring to Life for characters: a script, language, rate and pitch (device speech synthesis), gaze follows the guest, lip sync, idle breathing; actions placed on the timeline (抬手, 转头, 点头, 张开双臂, 指向, 鞠躬, 说话) |
| 布景 Scene | drag on the table (things step onto a stage by themselves), turn, face the audience, copy, remove; mood: 剧场 / 白天 / 黄昏 / 夜晚 |
| 导演 Experience | trigger zones (enter: lights up and the show starts; leave: fade, stop, or play on), the guest route, show length, light and music clips, then ▶ 成为观众 |

The show timeline (bottom) has four tracks — 灯光, 人物动作, 演讲音频, 背景音乐 — with draggable, resizable clips,
play / pause / ±1 s / back to start, and a playhead to scrub. Everything can be undone (↶ or Cmd/Ctrl-Z).

**成为观众 (guest preview):** first person from the route's first point; WASD / arrow keys / joystick, drag to look,
or 🚶 walk the route. Entering a zone starts the show; leaving fades the voice, music and light. Music gets quieter
with distance; figures with "视线跟随观众" turn their heads to the guest.

**Template:** 林肯演讲剧场 — stage, curtain, flags, podium, two spotlights, three rows of benches, entrance lamps and
sign, an audience zone, a route from the entrance to the last row, and a 135 s show (lights up, a soft pad, the
Gettysburg Address with head turns, raised hands, open arms and a bow, a fanfare, lights down). The Gettysburg
Address (1863) is in the public domain. Also 空白小剧场.

## Phase 2

The other two validation templates, and what the engine gained for them:

- **魔法画像** — a portrait in a gilt frame (kind `portrait`) that can Bring to Life: its eyes and head follow the
  guest (and the director's camera), it blinks, and the timeline gives it expressions (微笑, 惊讶, 眨眼). Local
  interaction: in the guest preview, tap something alive within 6 m and it answers with its "观众点击时" line and action
  (set in 赋能; works for characters too).
- **微型小船游览** — 导演 → 观众路线 → 乘船游览: the route becomes a canal and the guest rides a boat along it at the set
  speed (drag to look around; ⛵ 开船 / 再坐一次). Three scenes on the banks — 风车村, 灯笼桥, 城堡终点 — each a trigger
  zone that plays only its own part of the show (演第几秒起 / 到第几秒). Spatial sound: a music clip added while a thing is
  selected comes from that thing (📍 on the clip) and gets quieter with distance; voices too.
- New models: 魔法画像, 墙面, 小船, 小屋, 风车 (turning), 拱桥, 灯笼.

## Phase 3

- **AI Imagineer** (✨ in the top bar, `dw-imagineer.js`): describe the idea in a sentence or two; Minest's AI service
  (`POST /api/minest/ai-imagineer`, `api/_minest/core.mjs`, a strict JSON schema) answers with a first plan — things on
  the table, who says what (and how they answer a tap), trigger zones (with their part of the show), the guest route
  (walk or boat) and the show timeline. Every value is checked again in the page (known kinds and actions only, inside the
  table, clips on valid tracks, voice lengths recalculated) and the plan opens as a new work to edit. It needs a signed-in
  Minest (the same token / Google sign-in as Minest's other AI); without it the panel says so and starts a local draft
  from the nearest template, the idea kept as the narrator's first line.
- **Place in World** (🎒 放进 My World): the work becomes an Experience Item in the Magical Backpack → My Creations — a
  miniature theater on a round base with its title on a plaque (`spatial-home/js/backpack.js`, kind `dw`, one of a kind).
  Set it out in a Spatial Home room, or on a My World island; tap it → ▶ 走进体验 opens the workshop's guest view of that
  work (`MinestToolkitHost.workshop(id, true)` → `dream-workshop/index.html?play=<id>`; `?open=<id>` opens it to edit).

## Phase 4

- **Props come to life** (赋能, kinds with cat `animated`): 立体故事书 (打开 / 翻页 / 合上, a paper scene stands up as it
  opens), 时光钟 (hands and pendulum run; 时光飞转 races them and lights the orb), 音乐盒 (lid opens, the little stage turns
  with two dancers), 神秘之门 (打开 / 关上). A tap can run one of these, or 从头开演 (start the show).
- **Appear / vanish** (布景 → 在演出里): any thing can appear or vanish on the timeline (a pop on the way in); something
  whose first clip is 出现 is hidden until then — at 0 s the director's desk still shows everything.
- **Lines of their own**: a voice clip can carry its own text (赋能 → 单独说一句), so one character says different things at
  different times; the clip's length follows its line.
- **Import** (造物 → 导入我的作品, inside Minest): Type Workshop works become a neon sign (霓虹字, the gas colour kept);
  things from My World collections become a picture on an easel (画框, its cover when it has one).
- **Templates**: 立体故事书 · 小狐狸找月亮, 时间机器 · 三个年代 (tap the clock: Athens, a windmill village, 1863), 音乐盒世界.
- Sync fix: an undo or an edit not yet written is never replaced by the stored copy when the store changes.

## Phase 5 — all 20 experience types

The other 15 templates of the 20, so every experience type has a starting work (plus 微型小船游览 and 空白小剧场):
一分钟思想剧场 · 微型历史舞台 (郑和下西洋) · 视角幻象 · 影子剧场 (狐狸与乌鸦) · 魔法镜子 · 思想机械仪 · 微型天气机器 · 神秘之门 ·
活的微缩世界 · 记忆房间 · 变化的房间 · 概念陀螺 · 问题迷宫 · 思想星座 · 思想花园 (`dw-templates2.js`).

What the engine gained for them:
- **Sky and weather on the light track**: 变白天 / 变黄昏 / 变夜晚 (the sky, fog and light blend over the clip), 下雨 / 下雪 /
  放晴 (falling particles over the table). The stage light level ignores these clips.
- **Spotlight shadows** (造物 → 聚光灯 → 投下影子) and how far down it aims; a plain white wall for a shadow screen.
- **Walking**: 散步 — a character walks a little loop around its spot, legs and arms swinging.
- **New living things**: 思想机械仪 (gears: 旋转), 概念陀螺 (three labelled rings: 旋转 / 打开 / 合上), 知识之星 (floats at its
  height, 连到 another star to draw a constellation line), 思想之芽 (生长 / 枯萎), 画框 can talk and answer a tap, and the
  魔法画像 can be a silver 魔镜.
- **Route points that wait**: `{ x, z, wait: seconds }` holds the walking guest there (the maze's doors, the illusion's two
  viewing spots); dragging the point keeps it.
- The AI Imagineer knows all of the above (server schema and prompt, and the page's plan check).

## Phase 6 — the Imagineer's workflow

- **Eight steps** under the top bar — 构想 Dream · 故事 Story · 造物 Model · 布景 Scene · 赋能 Behavior · 导演 Direction ·
  体验 Preview · 放入 Place — each a way in (Dream opens the Imagineer, Preview walks in, Place puts it in the backpack),
  ticked when the work has it. Nothing forces the order.
- **故事 Story studio**: the idea in a sentence, and the story's beats in time order (lines, light, things appearing),
  grouped into 开场 / 展开 / 结尾; a line or a time edited here changes the timeline.
- **The Imagineer edits the open work** (✨ → ✏️ 修改这件作品, `dw-edit.js`): "加两排观众席，把灯光调得更温暖",
  "观众三米内开始演讲，离开五米后逐渐减弱" … become fixed scene-editing operations (add, add_rows, move, turn, scale,
  remove, rename, set_text, set_color, life, tap, zone_add, zone_radius, zone_exit, audio, warmth, mood, length,
  clip_add / clip_remove / clip_move, route_add) — from Minest's AI (`POST /api/minest/ai-imagineer-edit`, a strict
  schema, given a summary of the work) or, without it, a local reader of common phrasings. Every operation is checked;
  the change is one undo step and the panel lists what was done.
- **Sound distances** (`work.audio = { near, far }`: full volume within near, a whisper at far) and **light warmth**
  (布景 → 灯光冷暖, `env.warmth` 0 cool … 1 warm, tints the spotlights and the sky light).
- **Drag & place**: drag a thing from the shelf onto the sandbox to put it exactly there; 布景 → 对齐网格 snaps moves to
  0.5 m. On wide screens the studios sit on the left as the tool shelf, the sandbox in the middle, the timeline below.

## Files

- `index.html` — the page and its styles
- `dw-models.js` — the procedural models (three.js r128 from `../vendor/three.min.js`); figures carry a rig
- `dw-templates.js`, `dw-templates2.js` — the starting works (22)
- `dw-engine.js` — the Experience Engine: scene, picking, editor camera, show player (light, actions, voice, music), guest preview, triggers
- `dw-imagineer.js` — the AI Imagineer panel (new work / edit this work), the plan check and the local draft
- `dw-edit.js` — the scene-editing operations, the local reader and the work summary for the AI
- `dw-app.js` — the four studios, the timeline, undo, works, saving, 🎒 and `?play=` / `?open=`

## Saving and sync

Each work is `sh:dw:work:<id>` in `MinestHomeStore` (`../spatial-home/js/home-store.js`), the same channel as Spatial
Home: inside Minest on the web it goes straight into Minest Knowledge (host mode); on its own page it keeps a local copy
and uploads when signed in (lite mode); offline edits wait and merge by time.

## Entrances

- My World → Overview: 🎬 梦工坊 · Dream Workshop (`tools/toolkit/host.js`, `MinestToolkitHost.workshop()`)
- 奇想主题乐园: 🎬 梦工坊 beside 🏛️ 幻想工程展馆, and in the guide's quick bar (`theme-park-island/minest-pavilion.js`);
  the workshop then shows ← 返回乐园 in its top bar.

## Not yet (later phases)

Licensed voice-over (it needs an outside voice service and its licence).
