# Minest Learning Path 2.0: Development Spec

Version: 2.0 draft · 2026-10-09 · Based on: `iPhone44.6.html` (Learning Path 1.0 is finished). Development will happen in a new file, `iPhone44.7.html`.

> **Goal**: turn Learning Path from a fixed sequence (Flash → Quick Test → Deep → Summary) into an **independent learning engine**. It should:
> - choose a path per card based on that card's record;
> - fit the amount of study to the time available;
> - track memory, understanding and pronunciation separately;
> - let Mini Pet act as the coach, guiding at key moments and staying quiet the rest of the time.
>
> Adding Science, Social Studies, Phonics or reading comprehension later should only need a **path config**, not a new learning system.

---

## 0. Starting point (what 1.0 already has)

| Area | 1.0 now | 2.0 reuses / changes |
|---|---|---|
| Controller | `MinestLearn` is one inline script that mixes the state machine, UI, timing and the board | Split into three layers (section 1) |
| Steps | Fixed `flash → quicktest → deep → summary` | Per-card routing plus activity batching (section 2) |
| Card record | `card.learn = {seen, interval, nextReview, history}`, plus one mastery value from 1 to 5 | Upgraded to per-skill records, `card.learn.v = 2` (section 6) |
| Review | Simplified interval rule (×2.2 / ×1.3 / tomorrow) | Per-skill scheduling that uses correctness, response time and history (section 3) |
| Amount | A fixed 12 cards | A time budget of 5 / 15 / 30 minutes (section 5) |
| Activities | Drill · Study Arcade swipe (already records reaction time `rt`) · `MinestPron.learnLoop` | Unchanged; each is wrapped in an adapter. New: voice quiz (section 4) |
| Timing, records, cloud | Activity-based timing, per-device study log, Firestore `learning` | Unchanged |
| Pet | Speaks at the start and end of each step, and does an action every 7 seconds | Becomes the coach, with quiet rules (section 7) |

---

## 1. Three-layer architecture

```
┌ Interaction layer · Mini Pet Coach (MinestCoach) ──────────────────────┐
│ Choosing intent and time, voice commands (skip / continue / once more /│
│ pause), reminders, appearing only at key moments                       │
└──────────────────────────── events: minest:learn ─────────────────────┘
┌ Decision layer · Learning Path Engine (MinestLearnEngine) ─────────────┐
│ Pure logic, no DOM, unit-testable:                                     │
│ skill model · review scheduling · per-card routing · session planning  │
│ under a time budget · progress / resume · path configs                 │
└──────────────────────────── calls: activity adapters ─────────────────┘
┌ Content and feature layer · Minest (Activities + Content) ─────────────┐
│ Content: Board / List / Card (via MinestAI.boards / patchCard)         │
│ Activities: flash(Drill) · quick(Arcade swipe) · shadow(learnLoop) ·   │
│ voiceQuiz (new) · spell (later)                                        │
└────────────────────────────────────────────────────────────────────────┘
```

**Activity adapter contract**:

```js
MinestLearnActivities.register('quick', {
  skills: ['recall'],                       // skills this activity can measure
  costSec: function (card) { return 4; },   // estimated seconds per card, used by session planning
  canRun: function (card, cfg) { return true; },
  run: function (cards, ctx) { /* open the existing feature */
    // per card: ctx.result(cardId, {skill, correct, rt, score, hint})
    // at the end: ctx.done()   when interrupted: ctx.abort()
  }
});
```

Each existing feature only needs to report results through `ctx.result`. The engine does not know which UI was used.

**Path config** (one per subject, so a new subject does not need new code):

```js
MinestLearnEngine.paths = {
  vocab:   { label: 'Vocabulary', skills: ['recall', 'meaning', 'pron'], new: ['flash', 'quick'], review: ['quick'], weak: { recall: 'flash', meaning: 'voiceQuiz', pron: 'shadow' } },
  concept: { label: 'Science / Social Studies', skills: ['recall', 'meaning'], new: ['flash', 'quick'], review: ['quick', 'voiceQuiz'], weak: { recall: 'flash', meaning: 'voiceQuiz' } },
  phonics: { label: 'Phonics', skills: ['recall', 'pron'], new: ['flash', 'shadow'], review: ['shadow'], weak: { pron: 'shadow' } },
  reading: { label: 'Reading', skills: ['pron', 'meaning'], new: ['shadow'], review: ['shadow', 'voiceQuiz'], weak: {} }   // sentence scoring comes later
};
```

**Choosing the path**: the list setting wins, then the board setting, then automatic detection.
- Automatic detection: if more than 60% of card titles are a single English word, use `vocab`; otherwise use `concept`.
- The list menu gets a new item, "Learning Path type", so the user can change it.

---

## 2. Adaptive Path: per-card dynamic routing (most important)

For each card, the engine chooses the first activity based on its skill record:

| Card state | Path |
|---|---|
| New card (never studied) | Flash → Quick Test. If Quick Test fails, the card goes to the matching weak-skill activity. |
| Due for review, recall stable | Quick Test only. If it fails, the card drops back to the weak-skill activity. |
| A skill is weak (that skill's level ≤ 1, or it was forgotten last time) | Straight to that skill's activity, for example weak pronunciation goes to shadowing and weak meaning goes to the voice quiz. |
| Mastered and not yet due | Not in this session. |

- **Batching**: a session is not a mix of different activities card by card. Cards are grouped by activity into stages, in the order Flash → Quick → voiceQuiz → shadow, so each stage stays continuous.
- **Moving between stages within a session**: a card that fails Quick Test is added to the queue of a later stage.
- **Example** (12 cards):
  - 4 new cards: Flash (4) → Quick (4).
  - 6 review cards: go straight into the same Quick stage, so that stage has 10 cards in total.
  - 2 cards with weak pronunciation: shadowing.
  - Cards that fail Quick: added to the voiceQuiz or shadowing stage based on their weak skill.

---

## 3. Smart Review

One scheduling record per skill:

```js
skills.recall = { lv: 0..5, s: stabilityDays, due: 'YYYY-MM-DD', reps, lapses, rtMs: medianReactionTime, last: ts }
```

Each result is turned into a grade:

| Grade | Condition |
|---|---|
| again | Wrong or not recognised. For pronunciation: below the threshold (80). |
| hard | Correct, but reaction time > 1.6× the user's median, or answered "unsure" in the swipe. For pronunciation: 80–89. |
| good | Correct with normal reaction time. For pronunciation: 90–94. |
| easy | Correct and reaction time < 0.6× the median. For pronunciation: ≥ 95. |

Stability update (simplified FSRS / SM-2):
- again: `s = max(0.5, s × 0.3)`, `lapses++`, `lv −1`; review again later in this session and again tomorrow.
- hard: `s = s × 1.2` (at least 1 day).
- good: `s = s × (2.2 + 0.15 × lv)`. A new card gets 2 days the first time.
- easy: `s = s × (3 + 0.2 × lv)`. A new card gets 4 days the first time.
- Cards with many lapses (≥ 3) get their stability multiplied by an extra 0.8 to make up for repeated forgetting.

Due date: `due = today + round(s)`, capped at 180 days.

**Response time**:
- Arcade already records `rt` for each judgement.
- The voice quiz uses the time from the end of the prompt to the start of the answer.
- Flash does not grade.
- The median reaction time is kept per user in `minest.learn.rt.v1`, using the most recent 200 answers.

**Today's review priority**: overdue days × (1 + lapses) gives the score, and cards are taken in score order until the time budget is used up.

---

## 4. Hands-Free Learning: a voice-only path

New activity `voiceQuiz`. It reuses the `learnLoop` voice framework: playback, listening, end-of-speech detection, and the Pause / Skip / Retry buttons.

**Each question**: Pet reads out the prompt, the user answers, the system judges the answer, then plays a short feedback cue and moves on automatically.

**Three question types**, chosen by the path config and the card content:

| Type | Pet says | User answers |
|---|---|---|
| meaning | the word | the Chinese meaning or a definition |
| term | the definition | the word |
| spell | the word | the spelling, letter by letter |

**Speech recognition**: in the app, use the existing native dictation (`MinestNative.startSpeechRecognition`). On the web, use `webkitSpeechRecognition`. Recognition can switch between Chinese and English.

**Judging**:
1. **Local rules first**:
   - Normalise the answer and compare it with the card back (`desc`). If a key Chinese phrase matches, or the English edit distance is ≤ 1, it is correct.
   - For spell: compare letter by letter.
2. **If the local rules can't decide, ask AI**: new Vercel endpoint `POST /api/minest/ai/judge-answer` with `{term, expected, answer, lang}` → `{correct, partial, feedback}`.
   - It reuses the existing AI channel (`api/_minest/core.mjs`) and its existing token mechanism. No token is written into the page or the docs.
   - Results are cached in `minest.learn.judge.v1`.
3. On a network failure, fall back to local judging and mark the answer as "pending confirmation", with a manual ✓ / ✗ shown at the end.

**Feedback**: a correct answer gets a short sound plus one spoken word ("Right"); a wrong one reads out the correct answer. No pop-ups.

**Commute mode**:
- Pet can start it with "Start a voice review" or from the coach card.
- The screen can stay on with low brightness.
- **Limitation**: once the phone is locked, the WebView pauses, so true lock-screen learning would need native support. This is listed under "later" and not done in this version.

---

## 5. Smart Session: learning amount set by time

- **Choosing the time**: 5 / 15 / 30 minutes, or "Not sure", which defaults to 15.
- **Planning** (`plan(intent, minutes)`):
  1. Build the candidate set based on the intent.
     - Review: due items only.
     - New: new cards, plus a small amount of due items (at most 30%).
     - Read aloud: only cards whose path includes pronunciation.
  2. Sort by priority (section 3).
  3. Add cards one by one, accumulating the estimated time of each card's route (`costSec`), until the budget × 0.9 is reached.
  4. The output is a staged plan, for example `[{act:'flash', cards:[…]}, {act:'quick', …}, …]`, with an estimated time for each stage.
- **Running out of time**:
  - When the session has run for the budget plus 20%, Pet asks once at the next stage switch: "Time's up — finish this stage or stop here?"
  - Any unfinished cards go into the next session first.
- **Resume after interruption**: the session records each stage and the position within it. On return, Pet asks whether to continue, then resumes from that card.
- **Estimated time per card** (initial values, then calibrated from the user's actual study times):

| Activity | Seconds per card |
|---|---|
| Flash | 5 |
| Quick | 4 |
| voiceQuiz | 10 |
| shadow | 20 |

---

## 6. Mastery Tracking: real mastery

**`card.learn` v2** (already in the `sanitizeLoadedBoards` whitelist; cloud sync keeps it as before):

```js
card.learn = {
  v: 2,
  studied: { count, first, last },                 // "has studied it", separate from mastery
  skills: { recall: {...}, meaning: {...}, pron: {...}, spell?: {...} },   // section 3
  history: [{ at, act, skill, grade, rt, score }]   // up to 30 entries
}
```

**Skill levels**: lv 0 not learnt · 1 seen · 2 learning · 3 basically mastered · 4 mastered · 5 solid (still remembered after a long interval).

**The card's overall mastery (`card.mastery`, 1–5)**:
- **Derived automatically**: the lowest level among the skills required by the path, mapped to 1–5. The board stars and the "done" rule (≥ 4) stay the same.
- When the user changes the stars by hand, the change is recorded as an override and the skills are not touched.

**Migration from 1.0**:
- `learn.interval` / `nextReview` → `skills.recall`.
- `card.pron.best` → `skills.pron.lv`.
- `mastery` → initial level for any skill that has no record yet.

**What the user sees**:
- A three-bar skill indicator on the card details: 🧠 memory / 💡 understanding / 🗣 pronunciation.
- The summary page shows how much each skill improved.
- The Analyze page gets "studied but not yet mastered" as a new category.

---

## 7. Pet Coach and quiet rules

**Entry**: say "Start studying", tap 📚, or tap the reminder. The coach card (liquid glass), which replaces the 1.0 confirmation card:
1. **How do you want to study today?**: New / Review / Read aloud. The default is the coach's recommendation, for example "12 cards to review today".
2. **How much time do you have?**: 5 / 15 / 30 minutes.
3. **Suggested path**: shows the stages with card counts and minutes for each. Buttons: "Start", "Adjust".
4. Pet says one sentence, for example "12 cards to review today. Let's start with a 3-minute flash."

**Voice commands during a session** (handled while learning by the existing `routeIntent` plus the voice-ball long press):

| Command | Effect |
|---|---|
| "skip" | Skip the current card, or the current stage if said again |
| "continue" / "next" | Go to the next stage |
| "once more" / "again" | Redo the current card or stage |
| "pause" / "stop" | Pause and save |
| "how much is left" | Pet answers with the remaining cards and minutes |

**Quiet rules (enforced)**: Pet only shows a speech bubble or speaks at these key moments.

| Moment | Example |
|---|---|
| Start | "Let's start with a 3-minute flash" |
| Stage switch | The existing 3-second transition card, with one short sentence |
| Struggling | 3 wrong answers in a row, or the same card wrong twice: "Let's slow down — listen once more?" |
| Time's up | Asked once |
| Finished | Summary |

At all other times:
- No speech bubbles and no tips; the existing tip scheduler is muted for the whole session.
- Pet keeps only slow background motion, at most one quiet motion every 20 seconds, instead of every 7 seconds.
- No particles appear for each card answered correctly.

All prompts go through a single function, `coach.say(kind, text)`. That function enforces the rules: within one key moment the same kind of prompt is shown at most once, and the gap between any two prompts is at least 25 seconds, except at the start and the finish.

---

## 8. Delivery in phases

### Phase A: engine + Adaptive Path + Smart Session + coach card (the core)

**Work**
- Split out `MinestLearnEngine` (pure logic), `MinestLearnActivities` (adapters for flash, quick, shadow) and `MinestCoach` (coach card and quiet rules).
- `card.learn` v2 and the migration.
- Per-card routing and stage batching.
- Time-budget planning.
- Resuming from the position within a stage.
- Path configs: vocab, concept, phonics, plus the list setting for choosing the type.

**Acceptance**
- With the same list, choosing 5 / 15 / 30 minutes produces plans whose estimated times are within 10% of the budget.
- New cards go Flash → Quick; due reviews go straight to Quick; cards with weak pronunciation go straight to shadowing.
- After an interruption and a page refresh, the session continues from the same card.
- Over a whole session, Pet speaks only at the key moments in section 7.
- Engine unit tests pass, run with node against fixed data.

### Phase B: Smart Review + Mastery Tracking

**Work**
- Per-skill scheduling with reaction time and lapses.
- Per-user median reaction time.
- Derived `card.mastery` and manual overrides.
- Skill bars on card details, skill improvements on the summary page, and "studied but not yet mastered" on the Analyze page.

**Acceptance**
- Scheduling unit tests: the same answers with fast vs. slow reaction times give different intervals; again → review tomorrow; ≥ 3 lapses shortens the interval.
- A card with a high pronunciation score but no understanding is shown as "pronunciation mastered, understanding learning".
- Data synced to the cloud is the same on iPhone and web.

### Phase C: Hands-Free voice quiz + voice commands during a session

**Work**
- `voiceQuiz` activity with the three question types.
- Local judging plus `ai/judge-answer`.
- Voice commands during a session.
- Commute mode entry point.

**Acceptance**
- A fully voice-driven session of 10 questions needs no taps.
- Judging is correct for at least 90% of 50 standard Chinese meaning answers.
- If the network is down, it falls back to local judging and the end-of-session confirmation.
- All five voice commands work on both web and the app.

---

## 9. Things to watch
- The Mac desktop pet mirrors the web Mini Pet automatically, so the quiet rules also apply on the desktop. Coach cards are shown on the page; voice commands from the desktop pet go through its existing hold-to-talk.
- Regression: Drill, Study Arcade, and pronunciation practice used on their own (outside Learning Path) should behave as before.
- Develop on the web preview first, then port to the iPhone app (same as before).

## 10. Decisions needed from the user
1. **Judging answers in the voice quiz**: try local rules first and use AI only when unsure (recommended; costs a little per call and adds about 1 second of delay). Or local rules only (free, but less accurate for Chinese meanings).
2. **Should the board "done ✓" follow mastery?** Recommended: keep the current behaviour, where overall mastery (the lowest required skill) ≥ 4 counts as done. That means cards with only good pronunciation are no longer counted as done.
3. **Development order**: A → B → C as recommended. Or move C (voice only) to the front.

---

## 11. Phase A implementation record (2026-10-09, `iPhone44.7.html`, verified in the web preview only, not deployed)

User decisions (confirmed: "按你的来"):
- Voice quiz judging: local rules first, AI only when unsure.
- Board ✓: a card counts as done when its weakest required skill reaches Lv 4.
- Development order: A → B → C.

**Code**
- **Decision layer `MinestLearnEngine`** (inline script, pure logic, about 230 lines):
  - `norm` with 1.0 migration · `route` · `priority` · `plan` (time budget) · `grade` · `update` · `apply` · `mastery` · `nextDue` · `detectPath`
  - Path configs: vocab, concept, phonics, reading.
- **Runner + coach `MinestLearn` 2.0**, which replaces 1.0:
  - **Coach card**: how to study (✨ Recommended / 🔁 Review / 🆕 New / 🗣 Read aloud), how long (5 / 15 / 30 min), the suggested path (minutes and number of cards per stage), and the content type. Picks are remembered.
  - **Stages**: Flash (Drill), Quick Test (Arcade swipe, using reaction time), Read Aloud (`learnLoop`), Second Look.
  - **Answer recording**: every answer is written to `card.learn` v2. `card.mastery` is set to the weakest required skill.
  - **Failed Quick Test answers**: the card is added to a later stage of this round. Vocabulary goes to Read Aloud; concepts go to Second Look.
  - **Resume**: the session is saved to `minest.learn.session.v2` and resumes at the same card.
  - **Time's up**: once a round runs past 120% of the planned time, the coach asks once at the next stage switch whether to continue.
  - **Quiet rules**:
    - `coach(kind)` speaks only at the start, at a stage switch, when the learner is struggling (3 wrong in a row), at time's up and at the finish.
    - There are at least 25 s between two lines.
    - Idle pauses no longer show a speech bubble.
    - The background motion runs every 20 s, with no particles.
    - Per-card tick / pronunciation cheers are switched off during a round.
- **Until the voice quiz exists, Quick Test also stands in for meaning.** The meaning record is marked `src:'self'`, and Phase C will overwrite it with real judging.
- **Arcade judge events now include `rt`**, and the reaction-time median is stored in `minest.learn.rt.v1`.
- **Engine tests**: `node tools/learning-path/engine.test.mjs` reads the engine directly from the latest iPhone page. All 40 checks pass. They cover:
  - routing and path configs
  - plans for 5 / 15 / 30 min (90% of the budget used)
  - 5 min: reviews only
  - intents: Review / New / Read aloud
  - stage order
  - easy / good / hard grading by reaction time
  - again → tomorrow
  - shorter intervals after ≥ 3 lapses
  - solid (Lv 5)
  - "a high pronunciation score alone ≠ mastered"
  - 1.0 migration
  - path detection
- **Mac desktop pet**: regenerated from 44.7 (`sync-web.py`) and rebuilt.

**Verified (web preview)**
- **Coach card**: the plan updates when you switch intent or time; picking 5 min gives about 4 min 16 s (85%).
- **Content type detection**: the academic-terms list was detected as Science / Social Studies, so it has no pronunciation stage. After switching it to Vocabulary, Read Aloud stages appear for cards whose pronunciation has never been measured.
- **Full round**: Flash → Quick Test, with 4 missed cards moved to Second Look → summary showing per-skill gains and the review plan by date.
- **Resume**: interrupted after answering 2 of 4 Quick Test cards, refreshed, and Continue resumed with the remaining 2.
- **Read Aloud**: 11 words using a simulated microphone and scoring.
  - Scores below 80 → that word's pronunciation Lv 1, back tomorrow.
  - The card's mastery dropped to its weakest skill.
  - The summary showed "+11 🗣 Pronunciation".
- **Quiet rules**: during the round Mini Pet said only the start and finish lines. The duplicate start line (coach card plus Start) has been fixed.

**Still to check on a real device**: the Read Aloud audio flow on the phone; Live Activity.

**Next: Phase B** (Smart Review + Mastery Tracking UI)
- Three skill bars on the card details.
- Manual mastery overrides.
- "Studied but not yet mastered" on the Analyze page.
- Calibrating `costSec` from actual time spent.

## 12. 阶段 B 实现记录（2026-10-09，`iPhone44.7.html`，仅网页预览验证，未部署）

- **三项能力条（卡片详情）**：在星级下方显示 🧠 记忆、💡 理解、🗣 发音。
  - 每项显示等级条（Lv 0–5，Lv 4 及以上为绿色）、状态、下次复习日期。
  - 来自快速测试"会 / 不会"的记录会标"self-check"。
  - 底部说明：所有能力都达到 Lv 4 才算掌握，并指出最弱的一项。
  - 手动改过星级时，提示"⭐ Stars set by hand — your next answer updates them"。
- **手动覆盖**：卡片详情里改星级、3D 视图里点星级，都会写入 `card.learn.override = {m, at}`，不改技能记录。引擎的处理：
  - 覆盖值 ≥ 4：学习路径跳过这张卡（除非看板截止日期已到）。
  - 覆盖值 ≤ 2：按"弱项"重新学习。
  - 下一次真实作答会清除覆盖，回到按能力推算星级。
  - 新增 6 项引擎测试，全部通过（共 46 项）。
- **学习路径之外的作答也计入**：Drill 的 Fail / Hard / Mastered、Study Arcade 各游戏的判断（含反应时间）、发音练习（含卡片详情和 Heads Up 中的评分），都会写入对应能力，并重新推算星级。学习路径进行中由路径自己记录，不会重复计入。
- **分析页**：新增"Learning · studied is not mastered"一栏。
  - 显示学过、已掌握、学过但未掌握、该复习的数量。
  - 显示最弱能力的分布。
  - 列出学过但未掌握的卡片，点一下直接打开卡片详情。
  - 这些数据也会发给 AI 分析（`stats.learn`）。
- **每张卡用时校准**：每个阶段结束后，用"实际有效学习时间 ÷ 学了几张卡"更新这个活动的单张用时（`minest.learn.cost.v1`）。新旧值按 7:3 平均，范围限制在默认值的 0.5–3 倍，且这个阶段至少学了 3 张卡才更新。之后的计划和灵动岛剩余时间都按校准后的数值估算。
- **新接口**：
  - `MinestAI.openCard(cardId)`：直接打开卡片详情。
  - `MinestLearn.cardStatus / skillView / pathOf / costs`。
- **Mac 桌面宠物**：已从 44.7 重新生成并重新编译。

**已验证（网页预览）**
- 卡片详情的三条能力条和说明（截图确认）。
- 改成 5 星后写入 override，学习路径跳过这张卡，卡片详情显示手动提示。
- 在学习路径之外用 Drill 按 Fail：记忆记为忘记，明天复习，星级重新推算为 1，覆盖被清除。
- 分析页的学习栏和卡片标签可以点开。
- 用时校准：朗读跟读每个词约 35 秒后，计划从约 4 分钟变为约 6 分钟；过快的数据会被下限挡住。

**下一步：阶段 C**
- 纯语音问答：意思、反向提问、拼写三种题型。
- 判断方式：本地规则，拿不准时调用 AI 接口 `ai/judge-answer`。
- 学习中的语音指令：跳过、继续、再练一次、暂停、还剩多少。

## 13. Phase C implementation record (2026-10-09, `iPhone44.7.html` + server; verified in the web preview only, not deployed)

### Voice quiz: `MinestPron.voiceQuiz(items, opts)`
- **Question types**:
  - meaning: you hear the word and say what it means.
  - term: you hear the meaning and say the word.
  - spell: you hear the word and spell it letter by letter.
- **New cards**: introduced first ("term — meaning"), then asked.
- **Prompt and answer language** switch automatically: meaning questions are answered in Chinese, term and spell questions in English.
- **Spoken commands while answering**:
  - skip
  - again / repeat
  - pause
  - stop
  - how much is left (tells you the count, then asks the same question again)
- **Buttons always shown**: Repeat / Pause / Skip, plus "I was right" / "I was wrong" to correct a judgment.
- **Speech recognition**:
  - In the app: native dictation (`minestSpeechResult`).
  - On the web: `SpeechRecognition` with 3 alternative transcripts, and any one that judges correct counts.
  - About 1.3 s of silence counts as the end of an answer.
  - After 3 recognition failures it switches to self-check: "I knew it" / "I didn't".

### Judging: `MinestPron.judge`
- **Local first**:
  - Exact match, near match (edit distance), and keyword / bigram overlap.
  - Chinese answers are matched against each meaning on the card back, so "继承；遗传" accepts either "继承" or "遗传".
  - Spelling must match letter by letter.
  - "不知道" / "I don't know" counts as wrong.
- **AI when the local rules can't decide**: new endpoint `POST /api/minest/ai-judge`.
  - Batches up to 20 answers per call and uses strict JSON output.
  - Tolerates speech-recognition mistakes, synonyms and Chinese/English mixing.
- **The quiz never waits for the AI**:
  - The undecided question shows "Checking", then the quiz moves on.
  - When the AI result arrives, it is recorded and the summary updates.
  - Results are cached in `minest.learn.judge.v1`.
- **Offline**:
  - Undecided answers wait in the summary for you to confirm ✓ / ✗.
  - If you leave without confirming, they count as "almost".

### Learning Path integration
- **Voice Quiz stage**: when speech recognition is available, the meaning skill is measured by the voice quiz instead of Quick Test standing in for it.
- **Question mix**: each path config has a `quiz` field.
  - vocabulary: meaning / term, with spelling every 4th question.
  - concepts: term / meaning.
  - phonics: spelling.
  - reading: meaning.
- **"🎧 Voice only" mode**: the whole round is a single voice-quiz stage.
  - Start it from the coach card, or by saying "语音复习 / hands-free / voice review".
  - The coach card only offers it when speech recognition is available.
- **Cards with nothing to answer from** (no notes on the back, no translation in the title): meaning is not a required skill for them, so it doesn't drag down their mastery.
- **Reaction time**: voice answers keep their own median (`minest.learn.rtv.v1`), separate from Quick Test.
- **Summary**: shows the number of voice answers right, and the improvement in meaning.

### Voice commands during a round
- Added at the front of `routeIntent`, so they work through the voice orb and when holding the Mini Pet to talk:

| Say | Effect |
|---|---|
| 跳过 / skip | skip this card; say it twice within 6 s to skip the whole stage |
| 继续 / next | next stage |
| 再练一次 / again | redo this card or stage |
| 暂停 / pause | save and stop |
| 还剩多少 / how much is left | Mini Pet tells you how many cards and minutes are left |

- `MinestLearn.command(name)` provides the same commands from code.
- **Bug fix**: since phase 1, the standalone `voice-realtime-45.js` had a syntax error (duplicated code at the end of the analyze command). It is fixed, and its `routeIntent` now matches the inlined copy exactly.

### Tests (all pass)
- `node tools/learning-path/engine.test.mjs`: 51 engine checks, 5 of them added in this phase (cards without a back, voice-only mode, routing for meaning that is due).
- `node tools/learning-path/judge.test.mjs`: local judging on 50 standard answers.
  - Right answers: 33 of 35 accepted locally; the other 2 are left to the AI; none rejected.
  - Wrong answers: 0 of 15 accepted by mistake.
  - Chinese meanings accepted locally: 92% (target: at least 90%).
- `node tools/learning-path/judge-endpoint.test.mjs`: the server endpoint with a mocked model (input clean-up, batching, output shape).

### Verified in the preview (simulated speech recognition and AI)
- 6 questions covering right / AI-judged / wrong / skip / spelling / "I don't know", with the recognition language switching automatically.
- With the AI offline, the confirm step at the end works.
- A full voice-only round:
  - The "how much is left" command works mid-quiz.
  - An AI "partial" result is recorded as meaning = "hard".
  - The summary and review plan are correct.
- Commands in a round: "how much is left" → "11 cards left · about 4 min (Read Aloud now)"; two "skip"s in a row skip the whole stage.

### Still to check on a real device
- How accurate the app's native dictation is. It is fixed to zh-CN, which recognises English words reasonably well.
- That the browser's speech recognition works on desktop Chrome / Safari.
- Real AI judging latency. The relay has a fixed overhead of up to 20 s per request, which is why judging is batched and runs in the background.

### Deployment notes
- `api/_minest/core.mjs` and `api/minest/[op].mjs` gained `ai-judge`. Vercel must be redeployed before AI judging works; until then everything stays on local judging plus the end-of-round confirmation.
- The web page uses the existing `minest_ai_token` / `X-Minest-Token`. No token is written into the code.
- The Mac desktop pet has been regenerated from 44.7.

### Not done (as planned)
- Hands-free study with the screen locked: the WebView pauses on the lock screen, so this would need native support.
