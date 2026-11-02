# Trinity College, Cambridge · phase 1, step 1: Great Court block-out

A standalone 3D page (`trinity.html`) of Great Court: the four ranges, the Great Gate and Queen's Gate (both walkable),
the Chapel, the Great Hall with its louvre, the Master's Lodge, King Edward's Tower with its clock, the octagonal
fountain, lawns and flagstone paths, and Trinity Street outside. three.js r128 meshes built in code, no third-party
or paid API, no network needed. It reuses the free-walk controller, light rig and collision from the Admont page
(`admont/admont-world/app.js`, copied and adapted). No existing page or world is modified.

Not in this step: the Great Hall interior, the Wren Library, Nevile's Court, the My World page (`iPhoneDuo66.html`).

## Run

Open `trinity/trinity.html` over http(s). `?mode=walk` starts walking, `?q=low` turns shadows off.
WASD / arrows move, mouse looks, Space jumps, Shift sprints, F toggles fly. Touch: left joystick, drag to look.

## Files

- `trinity-world/world.js`: data model and the size constants. Every number is tagged known or ESTIMATE.
- `trinity-world/textures.js`: canvas placeholder textures (limestone ashlar, lawn, flagstone, slate, road).
  Real CC0 files can go in `assets/textures/` (names in the file header).
- `trinity-world/scene.js`: the meshes. Static geometry is merged per material; windows (316) and crenellations are instanced.
- `trinity-world/app.js`: adapted from Admont's app.js (renderer, walk / fly, collision, tour, `window.__trinity`).

## Sources and what is estimated

Documented: the court's circuit is 1,202 ft (366 m) in a 19th-century survey; Great Gate in the east range;
Queen's Gate centres the south range; Hall and Master's Lodge in the west range; Chapel on the north side, 62.5 m long;
octagonal fountain in the centre; a passage beside the Hall leads to Nevile's Court.

ESTIMATE until checked against a survey plan (RCHME 1959 *City of Cambridge*, or OS / LiDAR data):

- the court's 98 x 85 m size (chosen to give the 366 m circuit), the depth of each range, storey and roof heights, window spacing
- the Hall's length (34 m) and depth, the Lodge's extent
- the position of the Chapel and of King Edward's Tower along the north range (NOT verified)
- the Great Gate and Queen's Gate sit on the centre lines here; in the real court the Great Gate is not centred
- the shape of the roofs (plain gables here; the real ones differ), the gatehouse turrets, the statue niches

OpenStreetMap and LiDAR were not used: the sandbox cannot reach those services. No OSM or OGL data is in this build,
so no attribution page is needed yet.

## Measured (headless Chromium, software rendering)

21 draw calls, 17k triangles, 316 windows. Walk from Trinity Street through the Great Gate passage into the court works.
Not tested: real phones.
