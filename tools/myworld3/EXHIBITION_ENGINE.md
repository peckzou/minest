# Spatial Exhibition Engine V1 (iPhone 53.7)

Isolated build: `build/5370/` → `iPhone53.7.html`. The stable 53.4 / 53.41 / 53.5 / 53.6 are untouched. Nothing is committed, merged or deployed.

## 1. Audit — what existed, what was added

| Capability | Before 53.7 | 53.7 |
|---|---|---|
| Display furniture with slots | ✅ wall, grid, shelf, bookshelf, museum case, gallery, desk, themed zone, memory timeline, 18 theme pieces (aquarium, record wall, world map, winners' podium, crates…) | reused as fixtures |
| Things in slots | ✅ card refs in `p.it`, pictures as billboards / covers | + drawn by their look: model on a shelf or table, picture in its own-shape frame, plaque |
| Smart arrange (list → furniture) | ✅ `75-smart-arrange.js` | kept |
| Glass cabinet, treasure chest, pedestal, model table, timeline path, habitat diorama, gallery wall (grid / salon) | ❌ | ✅ new fixtures (`64-exhibit.js`) |
| Drop on a fixture | appended at the end | **snaps to the slot under the finger**, with a marker (slot n / full / no picture) |
| Exhibitions as objects | ❌ | ✅ `R.ex` records, presets, Rearrange / Change / Take down |
| Curator | ❌ | ✅ local rules → 2–3 suggestions with reasons |
| Undo / redo | ✅ (53.5) | now covers exhibitions too |

## 2. Fixtures (8 surfaces)

| Surface | Fixtures | Holds |
|---|---|---|
| wall | Gallery wall (`framewall`, grid or salon), Gallery, Display wall, World map, Record wall | pictures in frames of their own shape (never cropped); things without a picture get a plaque |
| shelf | Bookshelf, Shelf, Grid display, Market crates, Themed area | covers / things face out |
| cabinet | Glass cabinet (3 shelves × width) | 3D models (Studio objects, glb), pictures, plaques — behind glass |
| container | Treasure chest (24) | shows the first three on top; tap it to open and see everything |
| habitat | Habitat diorama (`env`: ocean / forest / desert / snow), Aquarium | models standing (or floating in water) in their setting |
| pedestal | Pedestal (1, lit), Museum case, Winners' podium | one special thing each |
| table | Model table (width × 2 grid), Desktop, Dining table | models on a tabletop |
| path | Timeline path (milestones with years), Memory timeline | in date order |

Taps pass through glass, so things inside cabinets and tanks can be picked and dragged.

## 3. Exhibition data (stored on the scene: the island record, or a room's `d`)

```json
{
  "ex": {
    "x…": {
      "id": "x…",
      "preset": "gallery_wall",
      "lists": ["<listId>"],
      "theme": "gallery",
      "layout": "grid",
      "sort": "list | title | date | type | shuffle",
      "fixtures": ["<piece id>", "…"],
      "v": 1,
      "at": 1792270000000
    }
  },
  "pc": [
    { "id": "<piece id>", "k": "framewall", "x": 4.5, "y": 2, "f": 0, "s": 1,
      "ex": "x…", "theme": "gallery", "layout": "grid",
      "it": ["<listId>/<cardId>", "…"] }
  ]
}
```

Rules:
- `it` holds card references only; cards are never copied.
- Taking a thing out, removing a fixture or taking down an exhibition never changes a list or a card.
- Edited cards update everywhere, because they are read live.
- Exhibitions whose fixtures are all gone are dropped on the next save.

## 4. Presets

**Implemented (15):** Gallery Wall, Salon Wall, Interactive Bookshelf, Record Store, Curiosity Cabinet, Glass Showcase, Habitat Diorama, Aquarium, Timeline Path, Model Table, Pedestal Gallery, Ranking Podium, Map Exhibition, Treasure Chest Collection, Treasure Room.

**Listed as "coming later", not tappable (21 of the 36-entry catalogue):** Open Storage, Story Rooms, Constellation, Family Tree, Comparison Table, Tournament Arena, Rotating Exhibition, Floating Collection, Garden Exhibition, Interactive Laboratory, Personal Museum, Item Frame Wall, Equipment Stand, Miniature Zoo, Collectible Shelves, Dollhouse Display, Modular Showcase, Floating Showcase, Secret Collection Room.

**Themes:** Museum, Gallery, Cozy room, Natural habitat, Fantasy, Technology. A theme only changes the fixtures' materials.

## 5. How to use it

- 🏛 on the island's left column, or 🏛 Display on any list in the Box.
- Choose a list. **Curate for me** offers 2–3 ways with the reason; **every way** lists all presets; pick a theme; optionally include things already out (they move here).
- One tap builds it in a free spot, growing the island if needed. The bar then offers ✓ Keep / Try another / ↶ Undo.
- Under **Here**, each exhibition has Show, **Rearrange** (list order, A–Z, by date, models first, shuffle), **Change** (another preset where it stood, same things), and Take down.
- Drag a thing near a fixture and the slot under your finger lights up ("Slot 2 · Bookshelf", or red with the reason). Let go and it goes exactly there; the others move along.
- Tap-to-place works the same way: the first tap on a fixture marks the slot, the second puts the thing there.

## 6. Demo: "My Personal Museum" (preview, real data)

The scene is My Art World, in Museum mode. Five real lists were made through the list API:

| List | Source of the content | Exhibition |
|---|---|---|
| My Favorite Movies | 4 public-domain posters from Wikimedia Commons | Gallery Wall (changed to Salon Wall in the test) |
| My Books | 6 Open Library covers | Interactive Bookshelf |
| My Collectibles | globe, compass, trophy, camera, hourglass, crystal | Curiosity Cabinet (Studio 3D models behind glass) |
| My Ocean Life | octopus (glb), seashell (Studio), clownfish (PD photo), green sea turtle (CC BY-SA photo) | Aquarium |
| My Favorites | 5 keepsakes | Treasure Chest |

| Requirement | Result |
|---|---|
| Choose from existing lists | ✅ |
| One-tap Auto Fill | ✅ 5 exhibitions, 25 things, fitted on a 9-plot island |
| Drag by hand + snap | ✅ Frankenstein from the cabinet to the bookshelf: marker "Slot 2 · Bookshelf", landed in slot 2 |
| Turn and size | ✅ cabinet f 0→1, s 1→1.2, its 6 things kept |
| Tap opens the original card | ✅ poster → "Metropolis 1927 · Fritz Lang"; chest → its 5 things |
| Save and re-enter | ✅ identical fixtures, positions and slots |
| Restore the layout | ✅ via undo, and by reopening |
| Undo / redo | ✅ "↶ Undone / ↷ Redone", order restored exactly |
| Change preset without losing data | ✅ Gallery → Salon: same 4 posters; all 5 lists still have 25 cards |

Also checked:
- All 15 presets build without errors, and undoing each returns exactly the previous layout.
- The Treasure Room renders pedestals, a cabinet and a chest in the Fantasy theme.

Bugs found and fixed:
1. Glass fronts swallowed taps on things inside.
2. Empty slots could not be found for snapping.
3. Undo left orphan exhibition records.
4. A click after a drag could be eaten. This was mostly a test artefact, and the timing guard is tightened.
5. The first-visit card stayed over a filled island.
6. "Ocean **Life**" was matched to the life-story timeline.
7. The aquarium was an opaque block of water.

## 7. Known limitations

- **Placement:** wall placement is on wall fixtures (no free-standing room walls); no shelves on room walls yet. Rotation is in quarter turns (isometric renderer).
- **3D in slots:** block-built models (e.g. a block dog) appear in fixtures as their picture or plaque. Only Studio objects and glb / Poly Haven models stand as 3D in slots.
- **Paging:** large collections grow more fixtures in a row. There are no separate "pages", and nothing is ever hidden; overflow is reported.
- **Container contents:** opening a chest uses the existing piece view.
- **Presets:** 21 catalogue entries wait (see §4). Curator suggestions are rule-based (no AI).
- **Not verified on device:** real iPhone / iPad touch is untested (preview only, landscape 844×390).

## 8. Modified / new files (`build/5370/`)

- `myworld/64-exhibit.js` (new)
- `50-display-builders.js`, `51-vehicles.js`, `52-buildings.js`, `55-renderer-draw.js`, `61-spatial.js`, `30-layout-storage.js`, `70-island-ui.js`, `80-drag-drop.js`, `86-hud.js`
- `hud.css`, `make.py` (→ `iPhone53.7.html`)

## 9. Indoors stays indoors · one style everywhere (53.7, `66-indoor.js`)

- Inside a room, and in the Room and Museum scenes, outdoor pieces are hidden. They are not deleted, and they come back in the Island view. A toast says how many are waiting outside. The outdoor pieces are:
  - trees and ground plants
  - cars, planes, balloons, airships, boats
  - roads, rails, water, land
  - farm animals and wild birds
  - all buildings (Studio, block, houses, community) and world landmarks
- What stays indoors: furniture, display fixtures and exhibitions, 3D models, card displays, people and pets, flower pots, lamps, benches, crystals, portals.
- Hidden pieces don't block placement or walking. The Build picker and Decorate offer only indoor things. The Buildings tab is hidden indoors. Smart arrange never puts up buildings indoors. The guide counts only what is visible.
- The Build picker and the island HUD (level, resource bars, big buttons) now use the same blocky Poly Craft panels as the rest of My World; the earlier cream "store" look and rounded gradients are gone.
- Not explained: once, the demo's curiosity cabinet and its record went missing between two preview sessions. A build → undo → close → reload test later kept everything, and I could not reproduce the loss. It was rebuilt.
- Gestures instead of camera buttons (53.7). Verified with simulated touches: twist 0→1, pinch 0.93→1.40, double-tap fit back to 0.93.
  - Pinch to zoom.
  - Two-finger twist turns the view a quarter at a time.
  - Double-tap empty ground zooms in; when already zoomed in, it shows the whole island again.
  - On a computer: the wheel zooms, Q / E turn.
  - The ⟲ ⟳ − + ⤢ row is gone, and the 🚶 / 🔨 corner buttons are smaller (62 px, 54 px in landscape).
- **Minecraft UI style for all of My World** (53.7, `build/5370/minecraft.css`, loaded last).
  - The shared Poly Craft colour variables are remapped for every My World screen: island HUD, picker, sheets, guide, edit bar, Box drawer, and the world pages.
  - Buttons are grey stone with a pixel-noise texture, light top/left and dark bottom/right bevels, and a 2 px black outline. Panels are dark stone; "picked" is gold; Remove is red stone.
  - Text uses the "Pixelify Sans" pixel font (Google Fonts, OFL) with a 2 px grey shadow. The level number is green like Minecraft's XP level, and the island background is a sky gradient.
  - The font loads from Google Fonts. Without a network (e.g. the app offline) it falls back to a monospace font; bundling it into the app is a later step.
- **Auto-hiding toolbars** (53.7):
  - On an island only ✕ (top left) and ≡ (top right) stay.
  - ≡ (lit gold while open) shows the title and level, resource bars, the tool column, ↶ ↷ ½, and 🚶 / 🔨.
  - They fold away when you touch the island, or after 8 s without use. They stay while a sheet, the picker, a placement, a selection, the guide or the classic menu is open.
  - The classic top bar (scenes, Share, Classic layout) moved to ⋯ in the tool column.
  - Verified with real clicks in the preview: rest → only ✕ ≡; ≡ → all; touch island → hidden; 8 s → hidden; Box open → kept.

## 10. Rooms are built in the dollhouse · museum showrooms (53.7)

- A building's rooms open in **🏠 Build in 3D** (the dollhouse; Floor plan, Cutaway and Cards stay as other views). The old form under it is hidden there.
- **Hotbar** at the bottom: tap a room type, then tap a floor (or a room, to go before it); or drag the type onto the house. Drag a room to another place or floor. The see-through **＋ Floor** slab above the top floor takes taps and drops only where it shows (rooms under it come first).
- **Room bar** for the picked room: name, type, floor and wall materials, floor, ◀ ▶, − ＋, Go in, Remove. It follows every pick.
- **Home templates** ask first ("✓ Use it / ✕"): empty rooms are replaced, rooms with your things stay. Fixed: the "with your things stayed" count was wrong.
- **🏛 Museum showrooms** (`myworld/67-showrooms.js`), at the front of the hotbar, plus the whole **Museum (6 showrooms)** template:

| Showroom | Design |
|---|---|
| 🖼 Art Gallery | salon wall on the back wall, grid frame wall on the left, three lit pedestals, bench, plant, lamp |
| 🦕 Natural History | aquarium + forest diorama along the back, glass cabinet on the left, bench, crystal |
| 🗄 Cabinet of Curiosities | two glass cabinets, two pedestals, treasure chest, rug, lamp, crystal |
| 📚 Library & Archive | two bookshelves, record wall, reading path in date order, armchair + lamp on a rug |
| 🏆 Hall of Fame | winners' podium between two pedestals of honour, frame wall, bench |
| 🗺 Travel & Maps | world-map wall, model table, journey path, bench |

  - Each group is a real exhibition record (`d.ex`, with `room: <showroom id>`). It is filled from your lists by the Curator's rules: first the best match (score ≥ 3), then a list that suits the nearest kind (salon ↔ gallery wall, pedestals → cabinet…).
  - Only things not already out anywhere are used, and cards are referenced, never copied. A group with no fitting list keeps its empty frames and cases.
  - Checked in the preview (My Life cottage, restored afterwards): the whole museum built 6 rooms on 2 floors, and the Art Gallery took 10 things from 2 lists. All six rooms render without overlaps.
