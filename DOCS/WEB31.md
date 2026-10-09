# Minest Web 31.0

Web 31.0 is Web 30.0 plus **Minest Live**, a Gimkit-style class game, plus the teacher room entry. It is generated; do not edit the pages by hand.

```bash
python3 tools/web31/build.py              # uses the latest iPhoneX.Y.html; also rebuilds web30's text
python3 tools/web31/build.py iPhone44.8.html
```

The build writes two pages:

- **`web31.0.html`**: the web30 build with two more top-bar buttons, 🎓 Teacher and 🎮 Join, and `tools/web31/minest-live.js` appended.
- **`web31.play.html`**: the student join page. It contains only the game, so it loads fast on phones and Chromebooks.

The game code lives in `tools/web31/minest-live.js` (`window.MinestLive`).

## The game: Study Arcade levels with a Gimkit economy (31.1)

Minest Live is **not** a Kahoot-style quiz. Students climb through the Study Arcade, the same games and engine as the app's Arcade, as a **level map**:

1. 🃏 Card Flinger (warm-up)
2. 👆 Swipe Judgment (warm-up)
3. 🍉 Glass Fruit
4. 🚀 Glass Blast
5. 🔨 Whack-a-Term
6. 🧩 What's Missing?
7. 💎 Smash It 👑 (boss)

The teacher picks which levels are in the game and the pace. A level unlocks when the one before it is cleared.

**Money comes from the Arcade's own judging.** `StudyArcade` emits `minest:study-activity` (`source:'arcade', type:'judge', cardId, result`) for every card.

- **Answer games** (levels 3–7):
  - Right: `(money per question + streak bonus × streak) × multiplier`.
  - Wrong: you lose one money-per-question × multiplier, less insurance, and the streak resets. Streak Shield protects the streak through 3 misses.
- **Warm-ups** (levels 1–2) are self-judged, so they pay a flat amount per card: the full amount for "know", half for "again". Nobody gains by lying, and an honest "again" costs nothing.

**Clearing a level.** The Arcade reports the end of a game with `minest:arcade-done`. The level is cleared when the game reports it cleared and the student got at least 60% right (warm-ups just need to be played through).
- Stars: ★★★ for 90% or more, ★★ for 75% or more, ★ otherwise.
- Level bonus: earn rate × 10 × stars the first time, × 3 on a replay.
- After every level a result card offers **Next level** or **Map & shop**.
- When every level is cleared, any level can be replayed for money and better stars.

**🛒 Shop** (on the map, between levels):
- Upgrades: Money per Question, Streak Bonus, Multiplier, Insurance (10 levels each, Gimkit Classic values).
- Power-ups:
  - Mini Bonus: ×2 on every right answer in the next level.
  - Mega Bonus: ×5 on every right answer in the next level.
  - Streak Shield: keeps the streak through 3 misses.

**Goals:**
- 🏰 first to clear every level (default)
- ⏱ 5 / 10 / 15 / 20 min
- 🏁 first to $10K / $100K / $1M

During a level, the money and streak sit in the Arcade's own top bar, with +$ / −$ pops.

**Arcade hooks added by the build** (to the shared `StudyArcade` block):
- `StudyArcade.level(board, modeKey, {level, run, dir, speed})` opens one game straight away on the whole deck.
- `close()` dispatches `minest:arcade-closed`, so the Arcade's ✕ returns to the level map.

## 31.3: chests, badges, Octo, sign-in, question sets, 3D Cover study room

**Unlocking.** The learning levels (Card Flinger → Swipe Judgment) are played in order. Once both are cleared, every game is open and students choose freely.

**Scores and leaderboard.**
- Each level stores the Arcade's own score and best combo. `minest:arcade-done` now carries `score` and `combo`.
- The teacher ranks by 💰 Money, ⭐ Score, ★ Stars or 🎯 Accuracy. Rows slide to their new places.
- A 📣 live feed shows level clears and Epic-or-better badges.
- The host publishes `host/lb` (top 5 plus every player's rank). Students see 🏅 #rank and a Top 5 card on the map.

**🎁 Treasure chests (replace card packs).**
- The chest is the Pet Raising one (`octopus-pet-raising-v6/chest-v1.js`), drawn on a canvas in three woods: Wooden, Silver and Golden.
- Tap it and it shakes, the lid opens, light and sparks pour out, and a badge rises.
- The badges are the 3D badge library's pre-rendered images (`badge-index/thumbs`, and `thumbs/hd` for strikes): 19 badges, Common to Mythic. Each gives a perk (money, level bonus, insurance, starting streak). Duplicates level a badge up to Lv 5.
- A badge can be the player's avatar; the teacher sees it.
- The album (`minest.live.album.v1`) keeps every badge the browser has opened, across games.

**While you wait** (join screen, lobby):
- 🫧 Bubble Pop: 30 s, tap rising bubbles. 💎 = +1, 🌟 = +5, 💣 = −3, combos add extra.
- 🎁 a Wooden Chest for 60 💎 (`minest.live.gems.v1`).
- 🏅 My badges.

**Octo.** The player's character is the Mini Pet (same code as the app and the Mac desktop pet). The play page now loads three.js and the Mini Pet core. Octo:
- stands beside the Live screens;
- moves to the corner during a level;
- hops on right answers and cheers streaks, level clears, chests and the end of the game.

**Student sign-in.** "Sign in with Google" uses the page's own Firebase project; the play page loads the SDK on first use.
- A signed-in student's player id is `g<uid>`, so they are the same player on any device, and their game state is restored from `players/<pid>/st`.
- Only the display name and photo are stored, never the e-mail address.
- Guests just type a name.

**Teacher question sets** (🎓 → Cards to play):
- 📥 Upload JSON reads:
  - a Minest / Focusboard board, or `{boards:[…]}`
  - a Web 20 room (`{board}`)
  - a Trello export
  - `[{term, meaning}]`
  - `{title, items|cards|words}`
  - `{lists:[{title, items}]}`
  - `{questions:[{prompt, answer}]}`
  - `{"word": "meaning"}`
  - item strings like `"apple - 苹果"`
  - and the fields `pinyin` and `example`.
- ✏️ Edit cards & questions: a table of front/back rows per list, with add/delete cards and lists, and 📋 Paste many (`word ⇥ meaning` from Excel/Sheets, `word - meaning`, `word: meaning`).
- ⬇ Export JSON and 📄 Template.
- Sets are kept in this browser (`minest.live.kits.v1`). Editing one of your boards saves a separate set; the board itself is not changed.
- Closing the teacher panel doesn't end a game: 🎓 Teacher resumes it (`minest.live.hosting`).

**📖 3D Cover study room** (always available to students: map / shop / badges / waiting screens):
- `web31.0.html?learn=CODE` mounts only the 3D Cover (the iPhone build's `Oe`) on the live game's cards. The board app (`Be`) never starts, so nothing in the student's own storage or sync changes.
- The top bar has only the two effect buttons: ✦ Light FX (FBFX's own button) and 🧊 Glass (`FBGlass`, off at the start because thick glass pauses tap / flip / record), plus ✕.
- On a card, students can only flip it (double-tap). Read aloud, record & score, open card, AI Tutor, Complete, mastery and New Card are hidden.

**No voice for students** (`window.__mnNoVoice`): the play page, the study room and a student's live session turn off card read-aloud and recording: the Arcade's auto read-aloud button (Card Flinger, Swipe Judgment), and the 3D Cover's tap-to-read and hold-to-record. The teacher's own app is unchanged.
- The play page shows it in a full-screen iframe. ✕ returns to the game (`postMessage minest-live:cover-close`).

## Teacher (🎓)

**Host a live Arcade game:**
1. Pick a board, the lists (the deck), the levels, the pace (Easy / Normal / Fast) and the goal.
2. The lobby shows the code and the link (`/play?code=CODE`).
3. ▶ Start.

The live board shows, for each student:
- money;
- a level trail: ★ for cleared levels and a highlighted icon for the level being played, with "▶ Glass Blast", "🛒 shopping" or "🗺 map";
- accuracy.

At the end:
- a podium;
- a students table: money, levels, stars, accuracy;
- **Cards to reteach**: per-card accuracy from the answer games;
- a CSV download.

Done or Play again deletes the game's data.

**Course room (Web 20):** unchanged. It publishes the board to `/api/rooms/CODE`, and "Open teacher editor" opens `web20.teacher.html?code=CODE`.

## Student

You can join in three ways:
- `/play?code=CODE` (`web31.play.html`, about 460 KB: the Arcade's code and CSS from web31 plus Minest Live, no board app);
- 🎮 Join in web31;
- `web31.0.html?play=CODE`.

Enter the code and a name, and wait for the teacher to start; the level map appears when the game starts. A reload rejoins as the same player with the same progress (`sessionStorage`).

## Data

Data is stored in the Firebase Realtime Database at `/minest-live/{CODE}`:

- `host`: `{ v:2, title, board (the chosen lists: id/title/desc/checklist/stack only), levels:[modeKey…], pace, goal:{type:levels|time|money,…}, state: lobby|live|ended, created, startedAt, endedAt }`
- `players/{pid}`: `{ name, money, correct, wrong, streak, best, lv:{modeKey:stars}, now: modeKey|map|shop, cards:{cardKey:{c,w}}, joined, last, doneAt }`. During a level, writes are batched to one every 1.2 s.

Both sides stream with `EventSource` on the REST URL and fall back to polling every 1.5 s. Clocks use server timestamps (`{".sv":"timestamp"}`). The host decides when the game ends (time up, or the goal reached).

## Limits

- The database rules are open, just like `/minest-rooms`: anyone with a code can write. Scoring runs on the student's device. This is fine for a classroom game, but not for anything with stakes. Before wider use, add rules or auth (see HANDOFF_WEB20_TEACHER_CONTENT.md §6).
- A game nobody closes with Done stays in the database. A cleanup by `created` age would be the next step.
- The course-room links point to `minest1.vercel.app` when the page isn't served from a vercel.app host. On minest-app they are relative, so `web20.*.html`, `api/rooms/` and `student-board-data/` must be deployed with it.
