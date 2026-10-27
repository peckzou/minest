# Minest Stand Mode V1.0: Octo Clock and My Collection Showcase

This is the implementation report. Work is on branch `stand-v1`, in the worktree `~/Documents/minest-stand`. It is not merged or deployed.

## Phase 1: Audit

| Question | Finding |
|---|---|
| Web/PWA only? | No. Minest is a single-file web app (`iPhone53.8241.html` and its copies) that also runs inside a native SwiftUI app (`ios/Minest`, a WKWebView). |
| Native iOS target? | Yes: `Minest` (app), `MinestWidget` (widget extension), `MinestShare`, `MinestWatch`. The Xcode project uses synchronized folders, so new Swift files join their folder's target automatically. |
| WidgetKit extension? | Yes: `MinestWidgetBundle`. It holds the Live Activity, the static widget, the CarPlay flashcard widget and Control widgets. Deployment target is iOS 17. |
| App Group? | `group.com.zouminmin.minest` is set on both the app and the widget, and is already used by CarFlash and `MinestWidgetDataStore`. |
| Octo state | The Octo is a rigged GLB (`octopus-pet-raising-v6/models/avatar_web_rigged_v23j.glb`, bundled in the app). The outfit comes from `MinestCosmetics` (shared localStorage), and the Mini Pet's resting state from `minest.octo.mirror.v1`. There is no 2D Octo artwork. |
| Saved items and thumbnails | Board cards use `card.cover` (`{type:'image', value/url}`). Visual Library records are `MinestKnowledge` `ki:cap:entity:*`, linked to stacked cards through `pk:<cardId>`. Local uploads are resolved by `MinestVisualImages.url()` from the IDB `minest-visual-assets`. 3D asset thumbnails come from `MinestAssets3D.thumb()` (IDB `minest-assets3d`). |
| Widget snapshot generator? | None existed. One was added (see below). |

**Verdict:** native StandBy widgets are feasible in this project, and both layers were built.

## What was built

### Layer A: Web Stand Mode
Files: `tools/live-perf/stand.js`, `tools/live-perf/stand.css` and `patch_stand.py`. The patch injects them into the live page and all of its copies.

**Ways to open it**
- `MinestStand.open()`
- The location hash `#stand`
- **Settings Studio ▸ 🕰 Stand**
- `minest://stand`, which StandBy widget taps use

**Octo Clock**
- Three styles: **Minimal**, **Aquarium** (low-poly tank) and **Cozy Desk** (lamp, desk and a little clock).
- Time format can be 12 h, 24 h or the locale's default, through `Intl.DateTimeFormat`. It needs no time API. The clock redraws on each minute boundary and never runs a per-second timer.
- Below the time it can show a greeting, the next study word (read from GPT Study / CarFlash), or nothing.
- Octo poses: Happy, Sleeping, Curious and Relaxing. They are chosen by time of day, or Sleeping when the Mini Pet is resting.
  - Each pose is a single still frame rendered from the same model and outfit as the Mini Pet, then cached in IDB `minest-stand`.
  - There is no continuous WebGL.

**My Collection Showcase**
- Four styles: **Museum**, **Collectible Shelf**, **Gallery Wall** and **Miniature Display**.
  - Miniature Display uses the piece's My World low-poly asset thumbnail when one exists. Otherwise it shows the piece's picture under a glass dome.
- Five sources: **Recent**, **Favorites**, **List**, **Board** and **Pick** (manual, up to 12).
- Text-only cards render as typeset cards. Pictures that fail to load turn into the typeset card instead of a broken image.
- Tapping a piece opens that card (`MinestAI.openCard`), or falls back to its list.

**Display, comfort and privacy**
- Three display choices: Clock only, Collection only, or Clock + Collection. The two sit side by side in landscape and stacked in portrait. The Duo outer screen and an upright half-fold get the stacked layout.
- Comfort: a Dim slider, Dark / Light / System appearance, controls that fade after 4 s, and a slideshow interval (off, 15 s, 30 s, 1 min, 5 min). Timers stop while the page is hidden.
- Privacy:
  - Personal pieces reach the system widget only after the **System StandBy** box is ticked.
  - On sign-out or an account change (watched through `firebase.auth().onAuthStateChanged`), the manual picks, the StandBy permission and the snapshot are cleared.

### Layer B: Native StandBy widgets (WidgetKit + SwiftUI)
- `MinestWidget/MinestStandWidgets.swift` contains:
  - `MinestOctoClockWidget`: style, time format and the line below the time are configurable.
  - `MinestCollectionWidget`: showcase style and rotation are configurable.
  - Both are `.systemSmall` and use `AppIntentConfiguration`, with removable `containerBackground` and deep links.
- `MinestStandStore.swift` (in both targets) holds the snapshot reader and the pose schedule. `Minest/StandController.swift` writes the page's snapshot into the App Group (`Stand/meta.json` and the image files), then reloads both widget kinds.
- Time:
  - iOS 18+: live system text (`Text(.currentDate, format:)`). The timeline only changes Octo's pose 4 times a day.
  - iOS 17: one entry a minute for an hour.
- Collection: one entry, or with rotation 18 entries 20 minutes apart.
- Nothing in the widgets fetches from the network, uses WebGL or reads Firebase.

## Known limitations
- **Favorites.** Minest cards have no favourite flag. "Favorites" means the pieces in lists named *My Favorites* (quick lists, Visual Library presets) or titled 收藏 / 最爱.
- **Whole-scene snapshots.** My World caches per-asset thumbnails only. Miniature Display therefore shows one object, not a rendered island scene.
- **Widget images.** These come from the last snapshot the app sent. They are small (360 px JPEG) and are refreshed whenever Stand Mode or its settings change in the app.
  - A cross-origin poster whose host sends no CORS header cannot be redrawn by the page. That piece shows its title card in the widget.
- **Two one-line native edits are not committed.** The widget registration in `MinestWidgetBundle.swift` and the `StandController.handle` hook in `MinestBridge.swift` sit in files that also hold other sessions' uncommitted work. They exist in this worktree's build and must be added by hand when merging:
  - In `MinestWidgetBundle.swift`: `MinestOctoClockWidget()` and `MinestCollectionWidget()`.
  - In `MinestBridge.handleAction`, at the top: `if StandController.handle(action, data: data) { return }`.
- **Widget layout.** A third-party widget cannot take over the whole StandBy screen. The person adds the two small widgets themselves in StandBy's widget gallery.
- **Always-on.** Always-on dimming is the system's; Dim only affects the web page.

## Phase 5: Device testing (iPhone Duo)
See the session notes for the results on the Duo. To add the widgets:
1. Put the phone on its side while it charges, so StandBy opens.
2. Long-press the left or right widget stack, then tap **+** and choose **Minest ▸ Octo Clock** or **My Collection**.
