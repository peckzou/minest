# Knowledge Drive V1.0: standalone prototype (Phase 1 audit and Phase 2)

## Phase 1 audit
- **Data.** Board data comes from `MinestAI.boards()`, which returns board → `columns` (lists) → `cards`. A stack is stored as `card.stack[]`.
- **Card fields used:** `title`, `titleZh`, `back`, `desc`, `notes`, `cover{type,value}`, `checklistItems[{text,done}]`, `labels`.
- **Visual Library.** Pictures come from `MinestKnowledge` `pk:<cardId>` and `MinestVisualImages.url`.
- **Opening a card:** `MinestAI.openCard(id)`.
- **3D.** Uses three.js r128, which the page already loads as a global. Nothing new is added.

## The module
- `drive.js` and `drive.css` are independent: `MinestDrive.open({ source, provider })`.
  - `source` is `{type:'workspace'}`, `{type:'board',bid}` or `{type:'list',bid,col}`.
  - `provider` defaults to `MinestAI.boards()`.
- **Mapping:** List = named road, Stack = road section (with a section sign), Card = billboard. Billboards store refs only and are re-read live, so the Kanban data is never written.
- **Driving:**
  - The car drives itself.
  - Tapping a billboard makes the camera frame it while the car keeps going. Focus releases once the board is passed.
  - Tap the board again to flip it to its meaning, notes and checklist.
  - To stop, hold 🛑 Brake (or the B key), or press Stop (Space).
- **Intersections.** Each road ends at a gantry; tap ←/↑/→ to pick the next road. ↑ is the deterministic Smart Route (next road not yet driven).
- **Mini map** and next-stop panel sit on the dashboard.
- **Landscapes:** Countryside, Coastal, Forest and City. Suggest cycles through them and ↺ goes back. Content and progress are unchanged.
- **Performance:** only boards within about 340 m are live (pooled), with far/near texture LOD, an LRU texture cache, chunked instanced scenery, and a paused loop while the page is hidden.
- **Saved progress.** `localStorage` `minest.drive.v1` stores road, s, seed, style and speed for each source.
- **Prototype page.** `index.html` plus `sample-data.js`. It is served at `/drive/` from the minest-44 preview (copied into mn31/drive).

## Phase 3: integration (2026-10-30)
- `entry.js` adds a 🚗 button to My World's header, before ⋯. The button is put back after every header redraw.
- The button opens **Presentation Gallery → Dynamic → Knowledge Drive**, with these starting points:
  - the List you are in,
  - the Board you are in (or up to 6 boards when you are on My World home),
  - the Workspace.
  - Each one shows its road and stop counts, plus a ↺ Resume line when progress is saved.
- You can pick an optional starting landscape.
- My World closes while you drive, so its 3D stops. Exiting reopens My World at the same path.
- Road names drop a trailing count, so "Mathematics (28)" becomes "Mathematics Road".
- The board's back strips markdown and HTML.
- The drive sits above the Mini Pet (z-index 2147483300).
- `patch_knowledge_drive.py` injects `mn-kdrive-style` and `mn-kdrive-script` into all 9 entries, patching each one in place. Re-run it after editing the source files.
- Not deployed and not committed.

## Phases 4–6 (2026-10-30)
- **Intersections, mini map, four landscapes with Suggest/Previous, saved progress:** already built in the prototype.
- **Workspace drives.** Moving onto another board's road shows "🗺 Region · Road".
- **Duo half fold** (`html.duo-tall.duo-halfopen`): the upper screen is the windshield. The lower screen is the whole dashboard, with a big map, the next stop and large Stop/Brake buttons. It follows the hinge live: `minest:hinge` plus a class observer.
- **Texture cache:** at most 40 billboard textures.

## Phase 7: validation
- **Preview:** Mac width, iPhone 375×812 and Duo 669×951 (flat and half folded), on real boards.
  - Workspace with 2923 cards: opens in 38 ms and runs at 60 fps.
  - Kanban data is unchanged after a drive.
- **Device:** built from ~/Documents/minest-release and installed on the Duo (00008160-001805E91EC00036). The on-device check is still pending.
