# Building a world from nothing — the tools (iPhone 53.41)

One entry point on an island: **🛠 Build** (top bar, while editing). Every tool also has its own way in.

| Tool | What it makes | Where | Code |
|---|---|---|---|
| 📦 **List builder** (the Box) | the world's content: areas, lists, things (names, pictures, notes) | 🛠 Build → Lists · the Box drawer (＋ tab = new list, ＋ New thing) · 🎒 Box (the full inventory) | 87-island-edit.js, inventory.js |
| 🏝 **Island builder** | the land and everything on it: land (＋ Ring, ×2 Double, up to 100 plots), ground, decorations, 16 block landmarks, 28 vehicles, 100 world landmarks, 48 world pieces (water, roads, rails, city, nature, street), 24 home furniture pieces, 🔍 3D models | 🛠 Build → Island (Decorate tab) | 35-land.js, 51–56 |
| 🏠 **Buildings** | Studio's 50 3D buildings and the block ones; city buildings are buildings too | 🛠 Build → Buildings (first drawer tab) | 52-buildings.js |
| 🏘 **Room / home builder** (+ 🛋 3D furnishing: indoor model categories per room, raise / lower, duplicate, to the wall) | a building's rooms on up to 3 floors — 🏠 Dollhouse, 🛠 Build (section: drag room blocks in, move rooms between floors, size them), ▦ Floor plan, ◩ Cutaway, ▤ Cards; ✦ Suggest rooms, ✦ Fill rooms with my things; 🏡 Home templates (Studio flat, Cottage, Family house, Villa, Townhouse); Outside (cottage, cabin, barn, castle, lighthouse, townhouses, flats, tall house, chapel); rooms furnished for what they are (FURNISH) | double-tap a building · 🛠 Build → Rooms | 52-buildings.js, 57-home.js, fp5341.js |
| 🏙 **City & community builder** | a road grid (joined crossings), districts per block, lake / park / cars & lights, a railway (Large) — Village, Town, City, Campus; Small / Medium / Large; ↻ another layout; take it away. City pieces are made again on a rebuild; what you moved or filled stays. | 🛠 Build → City · an empty island's guide → 🏙 Build a town | 58-city.js |
| ✦ **Arrange** | things into buildings and rooms by what they are (or onto the island, or by list) | ✦ Arrange · 🛠 Build → Arrange | 75-smart-arrange.js, 77-smart-build.js |

## From zero, in order
1. A new (blank) world: double-tap it on the sky → its island. The guide offers lists for its theme, a building, a town.
2. **Lists**: make the lists and things (or add later — any island level offers it).
3. **Island**: grow the land, put down buildings (or 🏙 a whole town), roads, water, nature, landmarks, models.
4. **Rooms**: double-tap a building → 🏡 a home template or room blocks in the section; floors, sizes, outside.
5. **Arrange**: ✦ — things go into the rooms that suit them; move anything by hand afterwards.
6. Double-tap a room → its displays; double-tap a display → opened big (＋ Add, 🎒 Box, Edit, Take off).

## Life on the island
- **People & pets** (Decorate → first section): 5 people and 6 animals that wander about where you put them. Size, turn, copy and remove them like any decoration. — `myworld/59-mobs.js`
- **Sets** (🛠 Build → 🎁 Sets): 10 homes with yards, 7 kinds of land, 8 road / rail / water / garden sets, 10 community places — a whole place in one tap. — `myworld/62-kits.js`
- **Things that go**: cars, trains, boats, planes, balloons, airships, birds, butterflies, ducks move on their own; ⏸ Stop / ▶ Go on each. — `myworld/63-movers.js`
- **Flowers**: tulips, roses, sunflowers, lavender, daisies, hydrangeas, a flower bed, pots, a rose arch, poppies (Decorate → Flowers).
