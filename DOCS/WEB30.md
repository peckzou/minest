# Minest Web 30.0

The desktop web app. It keeps web18.0's **board (Kanban / list) mode exactly as it was**. The **3D Cover mode and everything around it** comes from the iPhone build:

- AI board builder and AI Analyze
- realtime voice
- Pet Raising and the Mini Pet (rewards, tips, inbox)
- read-aloud and pronunciation scoring
- Learning Path 2.0, including the voice quiz
- Study Arcade with the Learning Path hooks
- the link to the Mac desktop pet

## Build (generated — do not edit web30.0.html by hand)

```bash
python3 tools/web30/build.py              # uses the latest iPhoneX.Y.html
python3 tools/web30/build.py iPhone44.8.html
```

Both files come from the same React codebase: the vendor prelude is identical, and every app symbol is a top-level global. The script moves whole blocks by name and stops if any edit doesn't match exactly once.

| Step | What |
|---|---|
| 1 | The iPhone's `Oe` (3D Cover), `PhysicalCardModeOverlay` and `FlashcardDrillView` replace web18's `Oe` and Drill. Also added: AI builder, `MinestAnalyze`, `MinestPron` with its preview, and the icons. The iPhone's `StudyArcade` replaces web18's. The compressed cloud helpers (`minestCloudPayload` / `minestCloudBoards`) are added. |
| 2 | Cards keep `pron`, `learn` and `lastReviewed` (web18 used to strip them). Boards keep `layoutMode`. |
| 3 | Root component `Be`: AI builder and pronunciation states and renders, the AI functions, `window.MinestAI`, `__setViewMode`, the 3D Cover props, and tick rewards for cards and checklist items. |
| 4 | Cloud: reads compressed boards (`boardsGz`, written by the phone) and the study log. Writes the same compressed format with `merge: true`, so a web save no longer wipes the phone's data. |
| 5 | Top bar: next to Arcade, new buttons for ✨ AI Build, 🔍 Analyze, 📚 Learn, 🗣 Speak, 🐙 Octo and 🎙 Voice. The labels show on wide windows. |
| 6 | Scripts after the app: the iPhone's FBFX (adds the Neon light mode and the events the Mini Pet reacts to), Pet Raising, the three.js loaders, the Mini Pet (starts bottom-left), rewards and tips, voice, the Learning Path engine and runner, and the desktop-pet link. iPhone-only scripts are left out: frame fit, Clear heat map, lane snap, ≡ dock. |
| 7 | CSS: only the rules for classes the ported components use and web18 doesn't define at all (`mai-*`, `minest-pronunciation-*`, 3D Cover sheen, physical card, Heads Up), with their `@media` and `@keyframes`. Board CSS is not touched. |

## Notes

- web30.0.html must sit next to `octopus-pet-raising-v6/` (Pet Raising and the Mini Pet model). The three.js files fall back to the CDN.
- The data is the same as the phone's: same localStorage keys, IndexedDB `focusboard_idb_v1` and Firestore doc. AI, voice and pronunciation use `minest-app.vercel.app` with the `minest_ai_token`.
- **Rebuild web30 after every iPhone release** to stay in step.
