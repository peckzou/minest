# Archipelago (iPhone 53.8)

Isolated build: `build/5380/` → `iPhone53.8.html`. 53.7 (live) is untouched. Not committed or deployed.

## What it does
A world's template becomes a group of floating islands. Any world works, because the layout is read from its board:

- **Hub:** the world's own island stays in the middle, with a flag carrying the world's name. Pieces you placed there stay.
- **Area islands:** each area (board column, a template's domain) gets its own island with its own ground (grass, sand, snow, moss, quartz, andesite).
- **Sections:** each section is a row starting with a signpost that carries its name.
- **Lists:** each list is a display named after it. The kind comes from the list's name (books → bookshelf, games → arcade, places → map wall …). Names that suggest nothing get one display kind per section, so sections look different. The list's things that are not out elsewhere go onto it.
- **Bridges:** wooden bridges join islands that sit one plot apart.
- **Names on screen:** area and world names stay visible when zoomed out, drawn large. Section and list names show when you zoom in.

## Entry points
- **Choose My World (template gallery):** every template card has a **🏝 Islands** chip. One tap makes the world, or uses the one already made from that template, goes into it and builds the islands.
- **Island toolbar:** a 🏝 button builds or rebuilds the islands from the world's current areas.
  - Only pieces it made (`p.arch`) and their land (`d.archLand`) are replaced.
  - It works in the Island view only.

## Data (on the island layout `dsp:<bid>`)
- `pc[].arch`: the card id for a list display; `sec:<id>`, `dom:<columnId>`, `hub`, `bridge` or `deco` for the other pieces.
- `pg`: per-plot ground `{ "i,j": [top, side] }`.
- `archLand`: the plots it made.
- `arch`: `{ v, at, areas }`.
- Undo snapshots include `pg`, `arch` and `archLand`; one build is one undo step.
- The plot limit was raised from 100 to 400.

## Checked (preview, test data removed afterwards)
- **Kant "My Critical World":** 7 area islands, 23 lists, bridges, varied displays. Double-tapping a display opens it ("My Sources").
- **Dewey "Library Shelves":** 10 islands on 103 plots, a full render in 112 ms, undo → 9 plots, redo → identical.
- **My Travel World (has content):** the 8 existing pieces stayed, 4 islands and 7 displays were added, and undo restored the stored layout byte for byte.

## Files
- New: `myworld/68-archipelago.js`.
- Changed: `35-land.js`, `55-renderer-draw.js`, `60-scene-ground.js`, `61-spatial.js`, `80-drag-drop.js`, `86-hud.js`, `minecraft.css`, `make.py`.
- Fixed in passing: the `tag()` scale wrapper (operator precedence).

## Tile mode ⇄ Main view (53.8, second round)
A world, and the home, each have two views:

- **World:**
  - **Main view** is the world's own island as it always was.
  - **Tile mode** is the archipelago.
  - **Switching:** ▦ (top-right, beside ≡) switches to Tile mode, building the islands the first time; ◉ (gold, same place) switches back. Each switch is one undo step.
  - **Storage:** switching only hides or shows the archipelago's pieces (`p.arch`) and its land (`archLand`) and sets `d.view = 'main' | 'tile'`. Nothing is removed. Hidden pieces don't count as "out" (`placed()`) and are not drawn or walked (`shownHere`).
  - ↻ in the tool column lays the islands out again from the current areas.
  - The world's page (the main screen of a world) has a ▦ button too, next to Reading mode.
- **Home:**
  - **The ▦ button:** in the home's top bar, beside Reading mode. It opens the home in Tile mode: City of God in the middle, its worlds round it, and Main island 2–6 joined to the group, each with its own landmark and its worlds.
  - **Bridges:** wooden bridges join the islands.
  - **Tap an island** to go to that world or main island, the same way the home does. ◉ goes back to the home as it was.
  - **Always fresh:** the scene `tile:home` is a pseudo-board, made anew from the home every time it opens.
- **Checked in the preview:** 6 main islands, 8 worlds and 13 bridges. Tapping My Food World opened its page. On My Food World: Tile 55 plots → Main 9 plots (its own island only) → Tile 55 plots. Test data restored afterwards.
- **Known:** when the islands had to go left of or behind the hub, the whole layout was moved so every plot sits at 0 or more. The main view then looks the same, but its coordinates are shifted.

## A world's main-island view (53.8, third round)
- ◉ in a world's Tile mode now opens the **main-island view**, the way the home shows worlds: the world's own island art big in the middle and its areas as small low-poly islands floating round it, each with its name and number of lists.
  - Art: `MinestAssets3D.thumb`; the skin comes from the area's name (LOOK_BY_NAME), otherwise a set of world skins in turn.
- **Tap the middle:** the world's own island (Main view, single island).
- **Tap an area:** Tile mode, centred on that area's island.
- **▦:** Tile mode. ✕ closes.
- Checked on the Kant world: 8 areas; every move between the three views works. The user's layout was restored afterwards.
- Code: `mvOpen` in `68-archipelago.js`, `.mn-mv` styles in `minecraft.css` (z-index above the island screen).

## Double-tap opens, all the way down (53.8, fourth round)
island → building (dollhouse) → room (go in) → display (its things) → thing (details), in every view:
- **Home in Tile mode:** one tap names the island; double-tap lands on that world (or main island).
- **World main-island view:** one tap picks and highlights an island, and the hint says what a double-tap does; double-tap lands.
- **World Tile mode:**
  - Double-tap an island's ground, flag, bridge or decoration to land on it: the camera fits that island (`archIsle` and `fitPlots`) and the selection is cleared.
  - A building or a display opens as before.
  - A tree or lamp in front of a building does not block it: `dblBehind` picks the building or display behind.
- **Double-tap timing:** judged by the finger's own clock (`e.timeStamp`, 400 ms), not the clock after a slow redraw.
  - In a big archipelago the redraw after the first tap took about 420 ms, so double-taps were being lost.
  - Same fix for rooms in the dollhouse (`fp5341.js`).
- **Piece view:** the second tap of a double-tap on a thing no longer closes the details it just opened.
- **Inside a building or room:** ◉ and ▦ are hidden.
- **Checked with real double-clicks in the preview:**
  - home Tile → My Life island
  - Tile → My Relationships island (fitted)
  - cottage (behind a tree) → dollhouse → Living room
  - My Art World bookshelf → Moby Dick details
  - main-island view → My Questions island
  - All test layouts were restored afterwards.
