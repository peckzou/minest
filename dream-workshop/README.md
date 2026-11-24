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

## Phase 8 — the world library, and learning while you play

- **World & History library** (`dw-models-world.js`, 33 more things on the shelf): 15 landmarks (金字塔, 狮身人面像, 长城烽火台,
  中国宝塔, 埃菲尔铁塔, 大本钟, 罗马斗兽场, 帕特农神庙, 泰姬陵, 鸟居, 自由女神像, 复活节岛石像, 冰屋, 巨石阵, 玛雅金字塔), 7 people
  from history (孔子, 郑和, 埃及女王, 达·芬奇, 莫扎特, 居里夫人, 爱因斯坦 — the figure, dressed, so they talk and act), 6 animals
  with the figure's rig (大熊猫, 大象, 骆驼, 狮子, 长颈鹿, 企鹅) and 5 ways to travel (郑和宝船, 蒸汽火车, 热气球, 双翼飞机, 地球仪;
  the last four move: rig `prop: 'motion'` with `spins` and `bob`, see `poseProp` in the engine).
- **Knowledge cards**: a kind's `fact = { where, text, q: [question, answers, right index] }` (39 kinds have one, six of
  them older kinds: 林肯, 大风车, 星际火箭, 宇航员, 小恐龙, 石拱桥); `say` is what a character answers when tapped. The builder
  can write a card of their own on any thing (`o.fact`, in the easy panel's card for the selected thing).
- **Builder**: shelf categories 世界地标 / 历史人物 / 动物朋友 / 交通探索, a search box (name, kind, or where it is from),
  a 📖 mark on things that carry a card, and **scene kits** (`DWKits.list`, 8 of them: 古埃及一角, 古代中国一角, 海上丝绸之路,
  欧洲名城, 希腊与罗马, 非洲大草原, 发明与探索, 美洲之旅) — a corner of the world set out in one tap where the table has room
  (never on the guest's path), one undo step.
- **Learning** (`dw-learn.js`): in the guest view a tap on a thing with a card shows it (and reads it aloud when the thing
  has no line of its own) and stamps the **passport** (📔 in the top bar and the guest view; `localStorage` `dw.passport`,
  this device only). The passport lists every card by category and, with three or more collected, runs a five-question
  **quiz** on the cards already found (stars in `dw.stars`). Finding every card in a world sets off fireworks.
- **Apprentice missions** at the top of the easy panel: six steps from the first landmark to three collected cards.
- Not yet: the AI Imagineer's server schema (`api/_minest/core.mjs`, `DW_KINDS`) does not list the Phase 8 kinds, so AI
  plans do not use them; the passport does not sync between devices.

## Phase 9 — 造梦基地: the workshop inside the WED studio (first stage)

梦工坊 and the WED 工作坊 become one place, built on the studio (`tools/wed-studio`, React + three 0.187, deployed to
`wed-studio/`). The studio no longer rebuilds a work as voxels: it runs this folder's own engine on its model table.

- **One engine, two pages.** `tools/wed-studio/src/dream/dreamHost.ts` loads `dw-models.js`, `dw-models-world.js`, the
  templates and `dw-engine.js` on the studio's three.js (through a THREE that keeps r128's light and canvas-texture
  behaviour) and starts the engine in **host mode** (`E.init(canvas, { light })`, then `E.frame(dt)`, `E.scene()`,
  `E.useCamera(cam)`): the host owns the renderer and the frame. The engine's scene is drawn as a second pass through
  the studio camera moved into the table's space (the table's scale goes into the projection — three ignores a
  camera's scale), so the miniature is the real work: same models, same show, same picking, hidden by the room where
  the room is in front. `index.html` here still runs the engine on its own, unchanged.
- **Hands, not buttons.** Drag a thing on the miniature to move it; carry it off the disc to put it away. Two stepped
  **toy racks** on the table hold one miniature of every kind (79, grouped by family): press one and carry it onto the
  disc to add it — it comes alive the way the shelf's things do. Edits are saved to the same `sh:dw:work:<id>`.
- **Shrinking in.** Tap the glowing gate at the start of the guest's route (or ▶ in the works panel): the camera dives
  to the gate, and the same scene becomes the full-size world — walking, the boat ride, taps, knowledge cards and the
  passport (the same `dw.passport`). The way out rises back to where the camera was over the table.
- Build: `cd tools/wed-studio && npm install --legacy-peer-deps && npm run deploy` (builds and copies into
  `dream-workshop/wed-studio/`). The page needs `../dw-*.js` beside it, so open the deployed copy, not `vite dev`.
- **The control desk** on the front of the table (`controlDesk.ts`): a weather dial, a day-and-night clock, a light
  lever (cool to warm), a music box (each turn of the crank is the next tune), a fireworks cord, a walk-or-boat rail and
  a rewind key (undo). Each can be dragged or tapped; they write what 梦工坊's "加魔法" page writes, and weather and
  music play a few seconds of the show on the miniature so the change is seen and heard.
- **The blueprint board** behind the table (`worksBoard.ts`) replaces the works panel: the newest six works as
  blueprint sheets (tap one to put it on the table), the theme worlds as seeds of new works, and three round tokens —
  📔 the Passport Hall, 🏰 into the park, 🎬 梦工坊's full director's desk.
- **The note card** of the selected thing (`ThingCard.tsx`): its name, what it says, how it answers a tap, its own
  knowledge card, and icons to turn, resize, recolour, hear and put it away. **Undo** (the rewind key, the ↶ icon,
  ⌘/Ctrl-Z) takes back every change made in the studio, one step at a time.
- **The Passport Hall** (`passportHall.ts`, the base's second room): a rotunda with a pedestal for each of the 39
  knowledge cards — found ones in colour, the rest grey; tap a found one for its card, and the quiz is here too.
- The top bar and the view bar are icons only. The old works panel shows only where the engine could not load.
- **Drawing on the table** (the pencil cup on the desk, `dreamHost.ts`): take the yellow pencil and draw a line — it
  becomes the guest's route (and the canal, on a boat ride); the green pencil rings a trigger zone (a dot on a zone rubs
  it out, a dot elsewhere leaves one of the usual size); a stroke with the pink pencil that starts on a character opens
  its note card on its line. One stroke per pencil; each is one undo step. The route and zones show on the miniature.
- **The departments** of the WED workshop, as the Imagineers had them, each under a hanging sign in the room
  (`DEPARTMENTS` in `App.tsx`): 模型车间 Model Shop, 绘图室 Drafting, 故事部 Story Dept., 蓝图墙 Master Plans, 机械角色室
  Audio-Animatronics, 机械车间 Machine Shop, 灵感办公室 Walt's Office. Tap a sign to walk over.
- **What each department is for** (`DeptPanel.tsx`, shown when the camera has walked over): 灵感办公室 — one sentence
  (typed or spoken) becomes a new work on the table (`dw-imagineer.js`'s `createFromIdea`: Minest's AI when signed in,
  else its local draft); 故事部 — the show's lines as storyboard cards, dragged into a new order and rewritten in place
  (the lines are packed one after another, and what a speaker does during its line moves with it); 机械角色室 — pick a
  character and switch on what it does in the show; 机械车间 — the boat's speed, and which rides run through the show.
  绘图室 and 蓝图墙 are still places to look at.
- **The Minest Imagineer Building** (`building.ts`) is the way in: the building with its front open like a doll's
  house — eight rooms on two floors (the seven departments and the Passport Hall), each with its things and its little
  Imagineers at work. Tap a room and the camera goes in; the studio opens at that department (the hall at the hall).
  The building icon in the studio's top bar goes back out. `?work=<id>` skips the building and goes to the table.
- **Eight rooms of their own** (`rooms.ts`): each department is now its own room in the building's look, with its
  Imagineers at work and a door (🏢, on the right wall) back out — 灵感办公室, 故事部 (the open work's lines hang on the
  wall as storyboard cards), 绘图室 (the open work's plan: things, route and trigger zones), 蓝图室 (every work as a
  blueprint sheet: tap one to open it and go to the model table), 机械角色室, 机械车间, 护照馆 (the hall), and 模型车间 —
  the room around the model table, drawn under the engine's miniature. The old WED studio scene is still built, but it
  is only shown until (or where) 梦工坊's engine has loaded; its artifacts and department signs are no longer on show.
- **The building, walked into** (`walkBuilding.ts`) is now the way in: the guest stands on the plaza, the doors open as
  they come near, and a corridor runs the length of the building with the eight rooms open on both sides (the same
  rooms the doll's house shows — `roomBay` in `building.ts` builds both). WASD / arrows / the joystick walk, drag
  looks, a tap on a room walks there; stepping over a room's threshold goes in. Coming back out of a room puts the
  guest in the corridor in front of it. The doll's house stays as the overview: the grid button, or the picture at the
  far end of the corridor.
- **Behind the doors is the WED studio itself, at its real size** (`studioWalk.ts`): walking through the building's
  doors puts the guest on the floor of the 26 × 22 m studio (`three/buildImagineerWorkshop.ts`) in first person —
  WASD / arrows / the joystick, drag to look, walls and furniture stop the guest (a ray against the studio's meshes).
  梦工坊's little Imagineers work at each department; near a department its work bar shows (`DeptPanel`). Walking up
  to the model table switches to the table view, where the hands take over; the footprints icon steps back from the
  table to walk again. A room tapped in the doll's house puts the guest in front of that department. The small
  cartoon rooms of `rooms.ts` and the corridor in `walkBuilding.ts` are no longer on the way in (only the hall is).
- **1401 Flower Street** (`flowerStreet.ts`) is now what is behind the building's doors: a 44 × 28 m floor to walk,
  laid out after public descriptions of WED / Walt Disney Imagineering's Glendale headquarters — the lobby; the
  Monorail Hallway (the monorail's stripe and windows on one wall, the timeline 1952–1986 on the other); the Model Shop
  (two storeys high, skylights, massing models in neutral grey on 4 ft tables, a silver sphere, the carpentry corner,
  and the big table where the engine draws the miniature); the Blaine Gibson Sculpture Studio (glass cabinets of heads
  and maquettes, busts on stands, Snow White and the seven dwarfs); MAPO (a figure on its stand, the tape console,
  drill press and lathe); the Show Designers' studio (easels, paintings, the storyboard); the sound studio; the library
  and its flat files. Sources: Disney's own "Our Story" timeline (sites.disney.com/waltdisneyimagineering/our-story),
  Alastair Dallas's "West of WEDWay" (laughingplace.com, 2000), Doug Lefler's "The Road to Disney" (douglefler.com),
  and the published tours by LAist (2019), Designing Disney (2014), Mickey Visit and WDW Radio (2025).
  It is a likeness, not a survey: the rooms and what is in them follow those accounts; the floor plan is ours, and
  MAPO and the library — separate buildings on the real campus — are under the one roof here.
  The work bars moved with it: 灵感 and 故事板 are in the Show Designers' studio, 机械角色 and 机械车间 in MAPO.
- **The inside, finished a step further**: the pictures on the walls are paintings (`wallArt.ts`: a castle at night
  with fireworks, a great silver sphere and a monorail, a ship of pirates, a jungle river, a snowy mountain, a rocket,
  an old house on a hill, a main street, a park's first plan — our own pictures, in gilt frames with picture lights,
  no words); the hallway's monorail windows each show one, and the timeline is a painting per year with the year on a
  small brass plate; walls have baseboards and framed doorways; the hallway has a wainscot, a runner, benches and
  plants; the Imagineers differ (height, hair, glasses, caps, shop aprons) and hold the tool of their trade.
- **The building stands in the park** (`theme-park-island/minest-imagineer-building.js`): on the lawn east of the
  entrance walk (x 306, z 545), a path leading to its porch. The doors open as the guest comes near; walking through
  them (or E / the prompt at the doors, or 🏢 造梦大楼 in the park's top bar to be taken to the path) opens
  `wed-studio/index.html?from=park&enter=1` over the park, already inside the lobby. The way out (the building icon,
  🏰, or Esc) puts the guest back on the path outside the doors.
- **The park and the workshop, joined**: the building in the park has its lobby hollowed out behind the doors, so the
  inside is seen the moment they open (the overlay starts two steps in). The model table is never bare (the newest
  work goes onto it, or a first one is made). From inside the park's building, the 🏰 token on the blueprint board
  steps out of the building with the open work in the hand, and it is set down in the park **at its real size**
  (`full` items in `minest-imagineer-park.js`: every thing where its maker put it, on a 32 m plaza) instead of as a
  small portal. The park's model drawer now offers all 79 kinds (it loads `dw-models-world.js`).
- **Works in the park are alive, and follow the workshop**: a full-size work plays its show on a loop while a guest is
  within 24 m (`animFull` in `minest-imagineer-park.js`: figures breathe, look at the guest, act and say their lines;
  rides and props turn); each thing with a tap line or a knowledge card is one of the park's own interactables (E / the
  prompt): it answers, and its card goes into the same `dw.passport`. When a work is changed in the workshop, what
  stands in the park is rebuilt from it (on leaving the building or the workshop, and on a store change).
- **Building the park itself** (`minest-park-builder.js`, 🛠 造乐园): ground brushes in 2 m tiles — 小路, 广场砖, 水道,
  花圃, 沙地, an eraser — laid under the guest's feet as they walk (1 or 3 tiles wide) or painted by dragging on the
  ground with the pointer free; ↶ takes back a stroke; 🪧 stands a sign that names a new land. Kept in `sh:tp:tiles`.
- **梦工坊 is inside the building**: Minest's entrance (`tools/toolkit/host.js`) and the park's (`minest-pavilion.js`:
  `workshop`, `editWorld`, `playWorld`) open the building; `?work=<id>` goes to the model table with that work, and
  `&play=1` dives in. `dream-workshop/index.html` is still there but nothing leads to it (the 🎬 token is gone).
- **The departments work through things in their rooms** (`stations.ts`; `DeptPanel` is deleted): the glowing bulb on
  the designers' desk takes a spoken (or typed) dream and makes a work; the storyboard cards on the wall are the open
  work's lines (tap one to move it earlier); in MAPO the work's characters stand on the bench (tap to choose) and the
  cams on the rail are what the chosen one does; the lever is the boat's speed; the little rides run when turning.
- **In the park**: a canal you laid is a ride (⛵ 上船 beside the water: the boat follows the longest run of water
  tiles), and 🗺 in the builder's bar joins what you placed with a path and walks the guest from one to the next.
- **The AI Imagineer's server** (`api/_minest/core.mjs`) knows all 79 kinds, with a line on how to use landmarks,
  people from history, animals and rides. Not run against the live model here.
- Not yet: 梦工坊's own page and Minest's entrances (`tools/toolkit/host.js`, the theme park's pavilion) still open
  `dream-workshop/index.html`, not the building; and 绘图室 and 蓝图室 have no work of their own yet.

## Files

- `dw-models-world.js` — Phase 8's models, their knowledge cards, and the scene kits
- `dw-learn.js` — knowledge cards in the guest view, the passport and quiz, the apprentice missions

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
