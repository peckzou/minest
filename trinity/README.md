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
- `trinity-world/scene.js`: the meshes. Static geometry is merged per material; windows and crenellations are instanced.
- `trinity-world/hall.js`: the Great Hall INTERIOR (step 2), built in world space and dropped into the scene.
- `trinity-world/app.js`: adapted from Admont's app.js (renderer, walk / fly, collision, tour, `window.__trinity`).

## Step 2: the Great Hall interior

100 x 40 x 50 ft = 30.5 x 12.2 x 15.2 m (documented size). Built: oak linenfold panelling + gilt frieze; the
hammerbeam roof (tie beams, hammer beams on braces, arch braces, king posts, purlins, ridge, a louvre); the raised
dais with High Table at the north end; long tables and benches down the body; the oak screen with the minstrels'
gallery over the screens passage; the great oriel bay; clerestory windows; and portraits in gilt frames, with
Elizabeth I over High Table. You walk in from the court through the east-wall doorway (verified: court -> hall).

The portraits are procedural PLACEHOLDERS. Real public-domain images (the sitters are long dead; use PD-Art files from
Wikimedia Commons, NOT CC BY-SA photos) go in `trinity/assets/portraits/<id>.jpg` and load over http(s). ids:
elizabeth_i, henry_viii, newton, bacon, byron, tennyson, macaulay, whewell, thompson, barrow.

Not verified against the real hall: which sitters hang where and how many, the exact screen and gallery design, the
oriel's position and tracery, the roof truss spacing, panelling height, the dais size. Modelled from the documented
overall size and typical Tudor hall layout.

## Step 3: Nevile's Court + the Wren Library

- `trinity-world/nevile.js`: Nevile's Court, 228 x 143 ft = 69.5 x 43.6 m (documented; shortened to ~52 m long here to
  keep the Library in the view budget). Cloister arcades (Doric columns, round arches) on three sides, two upper
  storeys of windows, a central lawn; the Library closes the west end.
- `trinity-world/wren.js`: the Wren Library interior (Christopher Wren, 1695). A single first-floor room over an open
  colonnade, reached by a stair. Built: 15 bays each side with oak presses perpendicular to the walls, pale carved
  limewood ends + plaster busts on top; the black-and-white marble floor laid DIAGONALLY; 28 round-arched windows
  (5.03 x 2.44 m documented); a coved ceiling; reader tables; Thorvaldsen's Byron statue (proxy) at the south end;
  ~3,000 book spines in one InstancedMesh.

Measured with all three spaces: 67 draw calls, ~96k triangles (window panes and cloister glazing are instanced).

Not verified: the Library's exact interior length/width/height (ESTIMATE ~45 x 12 x 12 m), the bay and press module
sizes, the bust identities, the Byron statue form (a proxy), the ceiling profile, and the ground-level route that
links the Great Hall's screens passage to Nevile's Court (here the two interiors are reachable in fly mode but the
walking link through the colonnade is not finished). To refine, use the RCHME 1959 survey or college plans.

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

## Step 4: My World integration (iPhoneDuo66.html) + the Hall<->Nevile walking link

`tools/patch_trinity.py` builds `iPhoneDuo66.html` from the UNMODIFIED `iPhoneDuo.html` by appending (never editing):
the engine sources (trinity-world/*.js) as inert `<script type=text/plain>` run on first open with ids prefixed `tr-`
and CSS scoped to `#tr-root`; the runtime `MinestTrinity` (open/close/isOpen/world/bind/linked/back); and the one-tap
`一键三一学院` on the console. Mirrors patch_admont.py / patch_alps.py exactly; asserts prove Santorini (`mn-oia-run`,
`santoriniBuild`) is untouched and no Alpine/Admont layer is present. base.html stays sha1 ed17ba0f7af2.

In My World: Console → 一键生成 → 一键三一学院. The island becomes Trinity with one campus piece (`p.tr = 'campus'`)
and opens the 3D campus. The 🏠 button names the space you stand in (Great Court / Great Hall / Wren Library). It asks:
- 🏠 剖面 Dollhouse: the building's three rooms (大礼堂 / 雷恩图书馆 / 大庭院, keyed `r.tr`), Smart Room, then
  Room → Display → Item. The pill 🎓 回到校园 (or leaving) returns to the same spot in 3D.
- 🚶 走进「…」房间: straight into that space's My World room; 🌳 Outside returns.

Also fixed in step 4: a walking doorway now links the Great Hall's west wall to Nevile's Court, so Great Court →
Great Hall → Nevile's Court is continuous on foot (verified).

Rebuild: `python3 tools/patch_trinity.py ../work/base.html iPhoneDuo66.html` (or `../iPhoneDuo.html` in the repo).

Verified in headless Chromium: one-tap opens the 3D campus (67 draw calls), the chooser names the Great Hall,
Dollhouse shows 3 rooms at level 3, the return pill comes back to 3D, walk-into-room works, and the one-tap entry
persists after reload. Not tested: real phones; GitHub Pages online URL.

Phase 1 is complete. Future (phase 2, structure is reserved): the River Cam and the Backs, student rooms and
staircases, study interactions (reuse the collect-books hook). Each is a new place entry + a build() module; nothing
already built needs changing.