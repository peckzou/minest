# Neuschwanstein Castle · 新天鹅堡 (voxel world)

Stand-alone page: `neuschwanstein/neuschwanstein.html`. It is a separate scene: no other world and no My World page is changed.
It reuses the Alpine Chalet voxel engine (chunked mesher with face culling and baked AO, sky and day/night, walk / fly / tour, doors, seats, visitors).
1 voxel = 1 m. Everything is built from whole modules in `ns-world/world.js` (terrain, walls, floors, rooms, towers, roofs). The per-block place / break tools of the Alpine engine are removed.

## What is there
**Outside**
- The castle rock above the Pöllat gorge, with the river, the Pöllat waterfall and Marienbrücke (iron truss) across the gorge.
- The castle from west to east:
  - the Palas: 5 storeys of white limestone, a steep slate roof, gilded finials, west corner turrets, oriels, dormers, a balcony over the gorge;
  - the tall stair tower;
  - the upper courtyard, between the Knights' House and the Bower;
  - the Square Tower;
  - the lower courtyard, with the outline of the chapel that was never built;
  - the red Gatehouse with its towers.
- The road from the east, Hohenschwangau below, and the Alpsee.
- Far away: the Alps as a low-poly ring with snow, and the Forggensee to the north.
- Bavarian blue-and-white flags.

**Inside**
- **Throne Hall:** two storeys, red porphyry columns below and lapis-blue columns above, gilded capitals and an upper gallery. The apse has marble steps, a gold-mosaic wall with figures and a starry half dome. There is a big mosaic floor, a blue vault with gold stars and the gilded crown chandelier with 96 candles. As in reality, there is no throne.
- **Singers' Hall:** coffered ceiling, an arcade to its gallery, the stage with a forest backdrop, benches, candelabra, chandeliers and murals.
- **Royal rooms:**
  - the bedroom with a carved oak canopy bed;
  - the dining room with a gilded centrepiece;
  - the living room with a swan;
  - the grotto (tuff, moss, a little waterfall, blue light);
  - the study with bookcases;
  - a vaulted corridor.
- **Ground floor and stair:** the lower vestibule with columns, the kitchen with stove and hearth, and the spiral main staircase in the tower (courtyard to F3 to F4).
- **Doors:** 15 doors, all of which open and close with E. The courtyard door to the stair tower opens onto the stair.

**Light**
- Day and night cycle (T, Y, slider).
- Lanterns light up at night; windows glow at night.
- Six point lights follow you. Chandeliers and candles inside burn day and night.
- Indoors the fill light turns warm, so the halls read at night too.

## Controls
WASD move, mouse look, Space jump, Shift run, F or double Space to fly, E door / seat, T time, 📍 landmarks (Throne Hall, Singers' Hall, stair, royal rooms, grotto, kitchen, courtyards, Gatehouse, balcony, Marienbrücke, waterfall, Hohenschwangau). Touch: joystick plus buttons.

## Real and estimated
- The layout and order of the buildings follow the real castle, as do the room list, the colours and materials (white limestone, slate, red Gatehouse, porphyry / lapis columns, gold, the starry vault, the mosaic floor, the crown chandelier) and the lack of a throne.
- Sizes are rounded and estimated, not surveyed:
  - The Throne Hall is about 20 x 21 x 13 m (the documented hall is about 20 x 12 x 13 m; here the aisles are part of it).
  - The Singers' Hall is 28 m long.
  - The Palas is 56 x 24 m.
  - The gorge is narrower and the bridge much closer to the castle than in reality, so that it fits in the 256 x 224 m map.
  - The stair tower is shorter than the real one (about 65 m).
- The murals, the apse mosaic and the floor are **stylised paintings made in code**. They are not copies of the real works.
- No textures or models from outside are used. Nothing needs attribution.

## Tested (headless Chromium, software GL)
- **Loading:** about 1.3 s here, no errors.
- **Rendering:** 38 to 54 draw calls, 220k to 280k triangles, 26 textures, JS heap about 74 MB. Props: 38 meshes, 243 candles (2 instanced meshes), 26 murals, 7 chandeliers.
- **Reachability** (`tools/bfs.js`, a walker that steps up 1 m, falls, and passes through doors): from the spawn it reaches every hall and room listed above, plus the balcony, the stage, the Marienbrücke and both courtyards. The upper gallery of the Throne Hall is reached through the Singers' Hall door. Hohenschwangau is scenery only.
- **In the browser:** the Palas door and the stair tower door open with E, sitting on a Singers' Hall bench works, and moving stands you up. Day and night views of the outside, the Throne Hall and the Singers' Hall were checked by screenshot.

## Not verified / limits
- No real device and no GPU. Frame rates come from software rendering, which runs at a few fps here, so walking was measured by position. Holding W moves the player, but slowly in this environment.
- At 1 m voxels, round towers and the cone roofs are stepped, and fine carving is suggested by textures.
- The spiral stair is narrow (about 2 m wide), as in a real tower.
- The Hohenschwangau castle is a small stand-in you cannot enter.

## Files
- `ns-world/world.js`: generator (terrain, castle, rooms, props list).
- `ns-world/textures.js`: 32 px pixel atlas.
- `ns-world/mesher.js`: chunk mesher.
- `ns-world/props.js`: chandeliers, murals, apse, mosaic floor, far Alps.
- `ns-world/app.js`: the app.
- `tools/bfs.js`: reachability check (`node tools/bfs.js`).
- `tests/`: Playwright scripts used for the checks.
