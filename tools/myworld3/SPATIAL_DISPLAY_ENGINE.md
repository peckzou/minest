# Universal Spatial Display Engine V1.0 — Phase 1: audit and plan

Status: **V1 implemented and verified in the preview** (build/5350 → `iPhone53.5.html`). The stable `iPhone53.4.html` / `53.41` are not touched; nothing is committed, merged or deployed. Decisions taken: the octopus uses Pet Raising's glb; one card may have many displays; development in an isolated copy.

## 1. What exists today (audit)

| Area | What is there | Where |
|---|---|---|
| Scenes | Island, Room (inside buildings, nested in the island record), Museum (`V.d.scene`), building section/plan/dollhouse | `myworld/52-buildings.js`, `70-island-ui.js` (`SCN`) |
| Renderer | **SVG isometric block renderer**, not a live Three.js scene. 3D models (Studio, Poly Haven, glTF) are rendered *offscreen* by Three.js into sprites at 4 quarter-turns, cached in IndexedDB, then drawn as image parts | `55-renderer-draw.js`, `tools/myworld3/assets3d.ts` (`thumb`, `glbThumb`) |
| Display of Items | A piece holds `it: [ref]`; `ref = "<listId>/<stackId>"` points at the Card (no copy). Things stand on displays (shelves, walls, museum cases) or alone on a stone plate (`k: 'item'`, solo) | `50-display-builders.js`, `30-layout-storage.js` |
| Item visuals | Card cover image (`picOf`) as a flat billboard; no image → a coloured gem with no title. No 3D model per Item, no text sign, no per-Item appearance choice | `00-core.js`, `55-renderer-draw.js` |
| Editing | Select, drag (screen → floor), Move-then-tap, 90° turn, size .4–3×, raise/lower, copy, remove, tap-to-place with sticky hold, collision (`fits`), 0.5-block grid | `80-drag-drop.js`, `86-hud.js` |
| Explore vs Arrange | A look-only view exists (`mn-41-view`, ✏ to edit) but is not an explicit, always-available state | `89-guide.js` (`editOn`) |
| Undo | **None**, except one Undo in the toast after Remove / Remove set | — |
| Persistence | One record per island: `dsp:<boardId>` in MinestKnowledge (rooms nested inside buildings). Writes are debounced 350 ms, and a drag writes only on release. No retry or error message on failure | `30-layout-storage.js` |
| Universal Add | `MinestCapture`, `MinestPicker`, Visual Library providers (`/api/library/*`), Box "＋ New thing" | page scripts, `87-island-edit.js` |
| Studio assets | 120 objects + buildings + islands in `tools/myworld3/studio/data/*.ts`, bundled to `dist/assets3d.js` | — |

Findings that matter for V1:

1. **A save regression.** `save()` writes only `v, scene, rot, pc, ground, land, share, code`. Fields set elsewhere (`cat` from Smart arrange's learning, and any new field) are dropped on the next save.
2. **One display per Item per island.** `placed()` treats an Item as either "out" or "in the Box", across the island and its rooms. So "Duplicate Display" and the same Item in two rooms are not possible yet.
3. **No octopus in Studio.** The 120 Studio objects include `object_15_seashell`, but no octopus. The repo does have a real octopus glTF: Pet Raising's `octopus-pet-raising-v6/models/avatar_web_rigged_v23j.glb` (2.8 MB, rigged cartoon octopus). `glbThumb` can render it.
4. **Rotation is in 90° steps.** The isometric renderer and the 4-angle sprites support quarter turns only. Free-angle rotation would need a live Three.js scene, which is out of V1 scope.

## 2. Data contract (adapted to the existing storage)

| Spec identity | Minest V1 |
|---|---|
| Item ID | `ref = "<listId>/<stackId>"`, the existing Card reference (unchanged) |
| Display Instance ID | the piece `id` of a display piece (`k: 'item'`), one Item each |
| Scene ID | `<boardId>` for the island; `<boardId>:<buildingId>:<roomId>` for a room (stored nested, as today) |
| Visual Asset ID | `vis.asset` on the instance (`m3d:<id>`, `glb:<key>`, `bld:<id>`, `img`, `text`) |
| Transform | `x, y` (blocks, world space), `z` (raise), `f` (quarter turns), `s` (uniform scale .4–3) |
| Placement surface | `surf: 'ground'` (V1), or the holding piece's id for shelves and walls (existing slots) |

A display instance in the layout:

```js
{ id: 'p…', k: 'item', it: ['<listId>/<stackId>'], x: 2.5, y: 4, z: 0, f: 1, s: 1.2,
  vis: { type: 'model' | 'image' | 'text', asset: 'glb:octopus', by: 'user' | 'auto' }, surf: 'ground' }
```

Rules:
- Card content is never copied.
- Removing an instance only drops that piece.
- Editing the Card updates every instance on the next draw, because the title and image are read from the Card each time.
- `vis` only records the chosen look; it never changes the Card or its list.
- Older layouts without `vis` resolve automatically.

## 3. Plan (phases 2–8)

Work in an isolated copy, `build/5350/` → **`iPhone53.5.html`**. The stable `iPhone53.4.html` / `53.41` are not touched. No commits and no merge into main.

1. **Visual Resolver** (`myworld/61-resolver.js`). Order:
   1. The user's choice.
   2. An asset id on the Card.
   3. An exact mapping table (Studio objects, the octopus glb, world pieces).
   4. Entity type and context: a film, book, artwork or person shows its image, never a generic model.
   5. Category fallback: offered in the picker only, labelled "symbolic", never applied on its own.

   Then the cover image, shown as a voxel-style framed panel (pixelated texture, real aspect ratio, thin block frame). Then a readable text sign (wrapped title + short note). It returns `{type, asset, url, why, options[]}`.
2. **DisplayObject.** One builder for the `item` instance that draws model / image panel / text sign. Every type shares the same select / move / turn / size / copy / remove / open / change-look. When an asset is missing it falls back model → image → text and keeps the instance.
3. **Persistence.**
   - `save()` keeps every field (fixes the regression).
   - On a failed write: retry, then a toast.
   - The layout is still written once per finished operation, never per pointer move.
   - A failed asset never removes an instance.
4. **Direct manipulation.**
   - Placement preview: the first tap shows a ghost footprint with ✓ Place / ✕.
   - Grid snap toggle: 1 block / ½ block.
   - Stay within bounds and on the ground.
   - **Undo / Redo** per scene: a history of layout snapshots for place, move, turn, size, remove and change-look; ↶ ↷ on the HUD.
5. **Scenes.** Island, Room and Museum all use the same instance and editing (ground placement). Existing walls, shelves and museum cases keep working.
6. **Universal Add.** After Capture / Picker / Box saves an Item, add a "Display in scene" step that opens the scene holding that Item for tap-to-place. Already-saved Items stay placeable from the Box. Saving never forces placement.
7. **Touch.**
   - Explicit 👁 Explore / ✋ Arrange states on the HUD.
   - Explore: tap opens the Card, drag moves the camera, nothing moves by accident.
   - Arrange: tap selects, drag moves, buttons turn and size.
   - Desktop: wheel zoom, arrow keys move the selected piece, R turns, +/− sizes, Delete removes, Ctrl/⌘+Z undoes.
   - Models load on demand; sprites are cached; nothing from the Studio library loads up front.
8. **Light suggestions** (local rules, applied only after you confirm): offer a matching model, a gallery row of related Items, or a place next to similar Items.
9. **My Ocean acceptance scenario.**
   - Real Cards are created through the existing list API in a "My Ocean" list: an Octopus (the octopus glb), an Ocean photograph (voxel image panel) and a Note (text sign).
   - All three go into one real scene and are run through the 10 required steps in the preview.
   - Any test data is removed afterwards.

## 4. Known limits (V1)

- **Rotation:** quarter turns only. **Placement:** ground, plus the existing shelf and wall slots. No physics.
- **Octopus model:** the Pet Raising octopus, not a Studio low-poly asset. Studio has no octopus, and none is invented.
- **Voxel style:** a pixelated image panel, not a volumetric voxel model.
- **Movement:** "raycasting" is the existing screen → floor projection of the isometric view.


## 5. What was built (V1)

| Deliverable | Where | Notes |
|---|---|---|
| Visual Resolver | `myworld/61-spatial.js` (`sdOptions`, `resolveVisual`) | The user's choice → an asset on the Card → an exact model by name (block pieces: landmarks, animals, trees, vehicles…; 20 Studio objects as `obj:<id>`; `m3d:octopus` = the Pet Raising glb). Film, book, art and person entity types (from the Visual Library side record `pk:<stackId>` → `ki:cap:entity:…`) never get a name-matched model. Then the voxel picture, then the text sign. Symbolic models are offered only, labelled "(symbol)", picked by the item's own title, then its list, then its area. |
| Unified DisplayObject | `BUILD.item` in `61-spatial.js` | One piece kind for all three looks. Model = the model's builder or sprite. Picture = a framed easel panel whose image is drawn on the panel face in perspective; it is pixelated through a canvas where the image server allows cross-origin reads, otherwise the image is shown with a block grid over it. Sign = a wooden sign with the wrapped title and a line of the note, drawn on its face. New part types `pic` / `txt` in the builder (`50`), sizing (`51`) and drawing (`55`). |
| Placement controller | `86-hud.js`, `80-drag-drop.js` | Tap-to-place with a **preview ghost** (green or red footprint; tap again or ✓ Place to confirm). Drag to move. Move → tap the spot. Turn (90°). Size 0.4–3× in 0.2 steps. Raise / lower. Remove only the instance. ➕ Again adds another display of the same card. Grid snap ½ / 1 block. Arrow keys, R, + / −, Delete, ⌘/Ctrl+Z, ⇧⌘Z on desktop. |
| Undo / Redo | `61-spatial.js` (`HIST`), `30-layout-storage.js` | Every saved change of the scene is one step (snapshots of the island record, last 60). Covers place, move, turn, size, remove, look and scene. Works inside rooms too (the room is re-found after the step). |
| Persistence | `30-layout-storage.js` | Still one write per finished operation (350 ms debounce, never per pointer move). **Fixed:** the record is saved whole, so `cat`, `sortMode`, `gname`… are no longer dropped. A failed write retries once, then shows a toast. A missing model, picture or card never removes an instance: it falls back to picture → sign, or "⚠ Missing card". |
| Appearance picker | 🎨 Look on the selection bar (`sdLookHtml`) | Only the options that exist, plus the sign. Says when no 3D model matches. Choosing one keeps the place and never touches the Card (`p.vis = {type, asset, by:'user'}`). |
| Explore / Arrange | 👁 / ✋ on the HUD | Explore: a tap opens the card itself (piece view → its details), drag pans, pinch zooms, nothing moves. Arrange: tap picks, drag moves, buttons turn and size. |
| Universal Add | `bulb.js` (card sheet), `MinestDisplay.display(ref)` | A card's quick-edit sheet has "🏝 Display in scene": it opens that card's world and waits for a tap (preview → place). Saving and displaying stay separate. |
| Hit testing fix | `52-buildings.js` `drawImg` | Model sprites no longer catch taps on their transparent corners; each model is tapped through its block outline. Before, Studio buildings blocked things standing behind them. |

Modified files (all under `build/5350/`):
- `myworld/61-spatial.js` (new)
- `10-display-catalog.js`, `30-layout-storage.js`, `50-display-builders.js`, `51-vehicles.js`, `52-buildings.js`, `55-renderer-draw.js`, `56-models.js`, `65-scene-view.js`, `70-island-ui.js`, `80-drag-drop.js`, `86-hud.js`, `99-entry.js`
- `bulb.js`, `hud.css`, `make.py` (output → `iPhone53.5.html`)

API: `MinestDisplay.resolve(ref, vis)`, `.display(ref)`, `.undo()`, `.redo()`, `.explore(on)`.

## 6. Acceptance: My Ocean (preview, real data)

The data is real: a list "My Ocean" in My Travel World, created with `MinestBuildBar.addList` / `addThing`.
- Octopus: no picture.
- Ocean Photograph: Wikimedia Commons, "Sunset at Ocean Beach in San Francisco", CC BY-SA 3.0.
- Note to self: title and note.

The scene is the real `dsp:lw-my-travel-world-vm2f` record.

| # | Step | Result |
|---|---|---|
| 1 | All three in one scene | ✅ octopus → 3D model (glb), photo → voxel picture, note → text sign |
| 2 | Placed independently | ✅ each through preview + confirm |
| 3 | Move, turn, resize each | ✅ turn f 0→1, size 1→1.2 on all three; moved by arrow key or Move → tap |
| 4 | Save | ✅ the stored record equals the edited state |
| 5–6 | Leave and reopen | ✅ identical positions, turns, sizes and looks |
| 7 | Tap opens the original card | ✅ Explore: each opens its own card's details |
| 8 | Remove a display, card kept | ✅ "Removed this display — 'Ocean Photograph' stays in its list" |
| 9 | Undo | ✅ the removed display returns at the same transform; redo becomes available |
| 10 | Change look, data kept | ✅ octopus → text sign (place kept, card unchanged), then undone back to the model |

Also verified:
- One card, two displays (via Display in scene), then one removed: the card and the other display stay.
- A display whose card is gone is drawn as "⚠ Missing card" and kept across a save.
- Museum mode shows the same displays.
- The new layout has no console errors.

Bugs found and fixed during testing:
1. Resizing pushed the card off its own display: capacity is now always 1 for an instance.
2. A second tap did not confirm a ghost that had been nudged to a free spot.
3. Studio sprites blocked taps on things behind them.
4. The symbol suggestion used the area name before the item's name.

Not verified end-to-end in V1: placing a display inside a **room** (same code path as the island, but not run in the preview) and real iPhone / iPad hardware.

## 7. Known limitations

- **Rotation:** quarter turns only (isometric renderer with 4-angle sprites); no free-angle rotation or orbit camera.
- **Placement:** ground only for the new displays. The existing shelf, wall and museum-case slots still hold cards as before; wall-mounted panels come later. No physics.
- **Octopus:**
  - It is Pet Raising's cartoon octopus (2.8 MB, loaded on first use, then cached as sprites); Studio has no octopus.
  - It is loaded by a path relative to the page. That works on the web build when `octopus-pet-raising-v6/models/` is deployed.
  - The iOS bundle path is not checked yet. When it fails there, the display falls back to the picture or the sign.
- **Voxel look:** a pixelated image panel, not a volumetric voxel model. It only pixelates when the image server allows cross-origin reads (Wikimedia, TMDB and Open Library do). Otherwise the image gets a block grid overlay.
- **Missing-card sign:** it cannot show the old title, because the card's content is never copied into the display.
- **Undo history:** per island, kept in memory only; it is cleared when the island is closed.
- **Broken covers:** `image.pollinations.ai` now answers 402 (payment required). Existing cards whose covers come from it show the sign instead of a picture. Worth knowing for the whole app.
