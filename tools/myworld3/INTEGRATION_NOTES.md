# My World 3.0 — Spatial UI · integration notes (53.1 = Phase 1 audit + Phase 2 prototype)

## Build

`python3 tools/myworld3/build_53_1.py` → `iPhone53.1.html` (repo root, dev copy — production untouched).

- Base: Codex's `outputs/53.02/iPhone53.02.html` (53.0 + Visual Library), used read-only. Codex's modules
  (picker, capture, visual-library, myworld patch) are not edited.
- Adds two scripts before `</body>`:
  - `#mn-assets3d-src` — `text/plain`, the Studio runtime, parsed only on first use;
  - `universe.js` — My World 3.0.
- One patch to the base: the edge swipe-back layers list gets `.uv`.
- The bundle is built by `node tools/myworld3/bundle.mjs` (esbuild + three 0.186.1 from `downloaded-octopus/node_modules`).

## Audit (what exists, what is reused)

| Area | State | Used as |
|---|---|---|
| World / Category / List / Item | world board → columns (areas) → list cards (section headings between) → stacked cards | Levels 1–4 read straight from the board |
| List / Gallery / Kanban / Outline / Contents / Portal | done (2.0) | Level 3 shows List / Gallery; Kanban = the board; Outline = in-place tree |
| Card details | `MinestStarter.openItem` (stacked) | Level 4, opened on top; Universe stays underneath |
| Capture / Inbox / Smart Organize | done | Add → Capture (in a list: `MinestStarter.addTo`) |
| Visual Library | done by Codex (53.02) | Add → Visual Library, category preselected from the list / area |
| Templates | done (Simple / Standard / Complete, Mix) | Add → Templates (`MinestMyWorld.gallery`) |
| Discover, Frameworks, Activity, 2.0 page | done | ⋯ sheet + one contextual hint per place |

- **Studio package.** It is not exported assets: there is no PNG, no GLB and no manifest. It is the React / three.js
  source of 24 islands, 20 dioramas, 28 object builders (20 catalogued), 8 centre styles, a snapshot renderer and a layout.
- **How it is used.** The data and builders are vendored unchanged (`studio/`) and turned into cached static thumbnails on
  the device (IndexedDB `minest-assets3d`). A live model is built only for Inspect 3D.

## Data ↔ skin separation (MinestKnowledge, synced)

| Key | Meaning |
|---|---|
| `uv:center` | centre style id (default `center_castle`) |
| `uv:slot:<bid>` | a world's fixed archipelago slot (never reshuffled; a new world takes the first free one) |
| `uv:skin:w:<bid>` | chosen island for a world (else: template map, title keywords, stable hash) |
| `uv:skin:c:<bid>:<col>` | chosen diorama for an area |
| `uv:skin:l:<card>` | chosen object for a list |
| `uv:hide:<bid>` | hidden from the archipelago (data untouched) |
| `uv:nohint:<place>` | a skipped suggestion |

On this device: `minest.uv.v1` holds the path, the Spatial / Outline mode and, per level, scroll, query, view and selected item.

## Navigation

- Tap to enter (zoom in from the tapped tile, about 320 ms). Back zooms out; you can interrupt it, and Reduced Motion
  gives a fade instead.
- The breadcrumb is the actual path taken. Home goes to My Universe. Edge swipe = Back.
- Returning restores scroll, query, view and the selected item, and lights the tile you came from.

## Phases 3–5 (done in 53.1)
- **Universal Add feedback:** every tool opened from My World (Capture, Visual Library, starter forms, Templates) is
  diffed on return. What arrived gets one "Saved → list · Open · Change · Undo".
  - Change moves those same cards to another list of the world.
  - Undo uses the Capture log when there is one; otherwise it removes only the new cards.
- **Assets:**
  - Visual Assets library (all 72, by level, inspectable).
  - Skin pickers with search and "Suggested for <title>" (keyword match on name / subcategories / theme).
  - Hide / unhide a world (`uv:hide:`; its slot is kept).
  - Explore in 3D: a live archipelago (`MinestAssets3D.archipelago`), drag to turn, wheel to zoom, tap an island to
    enter; built only on request and disposed on leave. If WebGL is not available, it falls back to the map.
- **Responsive:**
  - At ≥1100 px: a sidebar with the world tree and the explorer beside it, hover previews (tile titles list a list's
    things), keyboard (arrows, Enter, Esc / Backspace / Alt+← back, H home, O outline, A add).
  - At ≥900 px: Add moves to the top right.
  - iPhone: Add stays at the bottom.

Phase 6 (full validation) was dropped at the user's request; each phase got a basic build-and-function check.

## Library 2 (Minest World 4.0 expansion, 2026-10-16)

- Vendored into `studio/` unchanged: 10 major worlds (`world_25…34`), 30 sub-islands (`subisland_01…30`), 50 buildings (`building_01…50`), 100 objects (`object_21…120`).
- `assets3d.ts` builds them with the expansion's own detailed builders (`expansionIslandMeshBuilders`, `buildingMeshBuilders`, `expansionObjectMeshBuilders`); Studio's dispatcher is only the fallback (it draws every new object as the same book). Catalogue gains `subisland` and `building`.
- `build/5333/make.py` now re-embeds `dist/assets3d.js` into `#mn-assets3d-src` (run `node tools/myworld3/bundle.mjs` first).
- Used in 53.4: world skin picker also offers the sub-islands; Visual Assets has Small islands and Buildings tabs; main-island Style has the 10 new worlds; main-island Elements adds the 50 buildings and 120 objects (3D thumbnails, cached in IndexedDB).

## Library 3 (World 4.3, 2026-10-16)

- Vendored: `expansionMajorWorlds43Data.ts` (MW-11…40), `expansionSubIslands43Data.ts` (SI-31…60), `expansion43MeshBuilders.ts`, and the updated `allAssetsData.ts` / `expansionMeshBuilders.ts`.
- `assets3d.ts` routes `MW-*` → `build43MajorWorldScene`, `SI-*` → `build43SubIslandScene`; `kindOf('SI-…')` = subisland. Catalogue: 64 worlds, 60 sub-islands, 50 buildings, 120 objects, 20 dioramas, 8 centres.
- Main-island Style shows the 30 new worlds too (72 styles, tiles titled with the asset's name).
