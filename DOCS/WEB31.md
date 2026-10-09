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

## Teacher (🎓)

**Host a live game:**
1. Pick a board and the lists to include.
2. Pick a goal: ⏱ 3–15 min, or 🏁 first to $10K / $100K / $1M.
3. Create the game. The lobby shows a big code and the join link `web31.play.html?code=CODE`, and the players appear as they join.
4. ▶ Start. During the game you see the time left, the class accuracy and the live leaderboard. You can end the game early.
5. At the end you get a podium, a table of students and the hardest questions. You can download a CSV. Done or Play again deletes the game's data.

**Course room (Web 20):** publishes the board as a snapshot to `/api/rooms/CODE`, which the Web 20 student page and Study Arcade read. "Open teacher editor" opens `web20.teacher.html?code=CODE`, the full editor for cards and multiple-choice questions.

## Questions

Questions are built from cards by `MinestLive.buildKit(board, colIds)`:

1. The card's own `questions`, multiple choice, written in the teacher editor.
2. Word → meaning, and every other card meaning → word. The answer comes from the `desc` (`pinyin · meaning` / notes) or from `word (meaning)` in the title. Wrong choices come from other cards.
3. Cards with nothing on the back get "Which list is X in?" when the board has 2 or more lists.

## Student (🎮 / `web31.play.html?code=CODE` / `web31.0.html?play=CODE`)

1. Enter the code and a name.
2. Wait in the lobby.
3. Answer questions. They are shuffled and repeat in cycles.

Correct answer: `(money per question + streak bonus × streak) × multiplier`.
Wrong answer: you lose one money-per-question, less insurance, and the streak resets.

**🛒 Shop:**
- 10-level upgrades, using Gimkit Classic values: Money per Question, Streak Bonus, Multiplier, Insurance.
- Power-ups:
  - Mini Bonus: ×2 on the next correct answer.
  - Mega Bonus: ×5 on the next correct answer.
  - Streak Shield: keeps the streak through one wrong answer.

A student's state lives in `sessionStorage`, so a reload rejoins as the same player.

## Data

Data is stored in the Firebase Realtime Database at `/minest-live/{CODE}`:

- `host`: `{ title, q:[{p,c,a,k}], goal, state: lobby|live|ended, created, startedAt, endedAt }`
- `players/{pid}`: `{ name, money, correct, wrong, streak, best, joined, last, qs:{qIdx:{c,w}} }`

Both sides stream with `EventSource` on the REST URL and fall back to polling every 1.5 s. Clocks use server timestamps (`{".sv":"timestamp"}`). The host decides when the game ends (time up, or the goal reached).

## Limits

- The database rules are open, just like `/minest-rooms`: anyone with a code can write. Scoring runs on the student's device. This is fine for a classroom game, but not for anything with stakes. Before wider use, add rules or auth (see HANDOFF_WEB20_TEACHER_CONTENT.md §6).
- A game nobody closes with Done stays in the database. A cleanup by `created` age would be the next step.
- The course-room links point to `minest1.vercel.app` when the page isn't served from a vercel.app host. On minest-app they are relative, so `web20.*.html`, `api/rooms/` and `student-board-data/` must be deployed with it.
