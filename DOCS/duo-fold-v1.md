# Minest Duo (iPhone Fold) · V1.0 — audit and progress

Branch `duo-v1` (worktree `~/Documents/minest-duo`), on top of release 49e133b. Not merged into main, not deployed.
Build: `python3 tools/live-perf/patch_duo.py` (assembles the My World blocks incl. `world_duo.js`, injects `duo.css` /
`duo.js` into every page copy, writes `iPhoneDuo.html` with Duo always on).

## Phase 1 — Audit (done)

**Device capabilities.** WebKit has safe-area insets, `visualViewport`, orientation / resize events. Viewport Segments
(`(horizontal-viewport-segments: 2)`, `window.viewport.segments`) and the Device Posture API exist in Chromium only.
`duo.js` treats both as hints when present (two segments → inner screen; posture `folded` → `html.duo-halfopen`).
Otherwise it is responsive: the shorter side ≥ 600 pt and long / short < 1.5 → inner screen, anything else → outer.
No iPhone Fold size is hard-coded.

**Who switches on.** Duo only runs on `iPhoneDuo.html` (`window.__MINEST_DUO__`), or on an iPhone that has once shown an
inner-screen size, which no other iPhone can (remembered in `minest.duo.fold`). iPads, desktop browsers and normal
iPhones never see any Duo UI (checked).

**Modules, as they are today:**

| Module | Root / entry | Fits a pane? | Notes for Duo |
|---|---|---|---|
| Kanban | React `#root`, cards `[data-card-id]` | yes | `MinestAI.selectBoard / showList / openCard / patchCard` |
| My World overview | `.uv` (fixed) | yes, by CSS | `MinestUniverse.open({path})` |
| Island / room | `.mn-dsp` (fixed), `V` state, `MinestDisplay` | yes, by CSS | **resize called `fit()` and reset the camera** (fixed, see below) |
| Discover games | `.dv` (fixed), `MinestDiscover._x.ui` | not as is | renders into `ui.body`; no container argument |
| Visual Library | `.pk.vl` (fixed) | not as is | `selected()` Map; saving via `MinestCapture.organize`; no direct "to display" path |
| Flashcards / GPT Study | `.cf-ov` (fixed), `MinestGPTStudy.act/get` | yes, by CSS | record in `minest.gptstudy.v1` survives reloads; no meaning / example fields in the play view |

Card ↔ island references: a placed piece lists the cards it shows in `p.it` as `"<list id>/<card id>"` (a plain card
lives in its Kanban column's list; a card with sub-cards is a list of its own). That is what the split uses.

## Phase 2 — Fold / unfold continuity (done)

- Folding keeps the task: no Glance page is pushed over it. Glance is shown only when the app starts folded, or from
  the ⌂ button.
- Unfolding with split on opens My World on the board in view.
- **Camera:** `world_duo.js` wraps `fit()`. A resize keeps the scene point in the middle of the view and scales the
  zoom; a camera the user never moved is fitted again. When the split changes the pane size without a window resize,
  `duo.js` fires one resize on the next frame.
  - Measured in the preview: a selected item stayed at 0.80 → 0.81 → 0.80 of the pane width across fold and unfold.
- Selection, the room you are in, a piece being moved (`V.hold`), list filters and scroll all stay, because nothing
  is remounted.
- This also changes desktop: resizing a desktop window no longer resets the island camera.

## Phase 3 — Kanban × Island (done, sample)

- **Split layout.** ▥ (bottom left) puts the board in the left half (`#root` 50vw, `transform` keeps its sheets
  inside) and My World in the right half. Fixed bars inside My World are contained in the right half too.
- **Card → island.** A tap on a card finds its display instance and selects it:
  - goes into the room it is in, centres it and pulses it;
  - if the card is shown in several places, a chooser lists them;
  - if it is not on the island, a "🧱 Place it" button opens the existing Universal Add flow.

  A tap on the same card again does what a card tap always does. The card's own buttons are never intercepted.
- **Island → card.** Selecting a thing or a display on the island scrolls the board to its card (or to its stack /
  column) and outlines it. The event is `minest:duo-world-sel`.
- **Content authority.** Only references travel between the panes. Neither side writes the other's data.
- **Right pane with My World closed.** It shows "🏝 打开 My World" instead of an empty half.
- **Outer screen Glance** (from 53.84): the flashcard on show, today's cards and Quick add.

## Next phases (not started)

4. Build & Arrange: library on the left, one-tap placement with ✓ near the object on the right (reuse
   `MinestDisplay.display` / hold + ghost; ✓ chip exists as BQ81).
5. Study Desk: two-pane / top-bottom layout around `MinestGPTStudy` (needs meaning / example fields from the card).
6. Discover: `.dv` dual-page CSS for This or That / Tournament (`.dv-pick` pairs side by side) and Tier List / Desert
   Island (pool left, tiers / slots right).
7. Visual Library: `.pk.vl` on the left, island on the right; a "to display" path from `selected()` into
   `MinestDisplay.display` (needs entity → card first via `saveEntities`).
8. Device validation on a real iPhone Fold. Preview widths are not proof.
