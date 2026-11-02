# iPhoneDuo68: Santorini <-> My World integration

`iPhoneDuo68.html` = base `iPhoneDuo.html` (untouched, sha1 ed17ba0f7af2) + voxel layer 62 + Oia link 63 (door -> Dollhouse) + Alpine 64 + Admont 65 + Trinity 66, then `make68.py` (this folder) adds the Santorini integration below. No other world is changed.

## What was already there (63) and is reused as is
World (one-tap Santorini; 167 building pieces, `p.vox` = stable building id) -> Building (door button, chooser) -> Dollhouse (`bldOpen`, Smart Room, rooms in `p.rooms`) -> Room -> Display (Smart Display) -> Item (card refs `listId/cardId`, read live from the board). Nothing of this was rewritten.
"Smart View" does not exist as a feature in My World; Smart Room, Smart Display and Smart Fill do.

## Added in 68
1. **Per-block tools removed** from the Santorini UI: place / break / pick (mouse, touch tap, Q/E, wheel, held-block HUD) and the block tool of the generic voxel layer. Edits saved by older sessions are still re-applied.
2. **Whole-building editing** (`oiabld68.js`, button "🏗 建筑" or key B): select the house in front of you, move 1 block, rotate 90 degrees, replace by another house type, delete (two taps) and restore, add a new house. Stored per island in `vox.bld = {m:{id:{dx,dz,rot,as,gone}}, a:[{id,src,x,z,rot}], n}`, replayed on the generated world every time it is applied. Building ids are stable, so rooms, displays and items (kept under `p.vox`) follow the building; a deleted building keeps its data. `world.buildings` follows, so the door button and the Dollhouse link work at the new place. Checks before a change is kept: bounds, distance to other buildings and landmarks, water, slope. Landmarks (blue-domed church, castle, windmills) are not movable.
3. **Anchors** (`window.__mnAnchors()`, read only): for the open room, building id, room id, every display with its room-local position, rotation, size, capacity, the item refs in it and the room-local coordinates of each item slot (taken from the display's own builder), plus a bounds / overlap check.
4. **Live sync** of the 3D room: while you walk a room, changes to the board (titles, covers), to the displays or to the room are picked up within about a second and the room is rebuilt where you stand (`window.__mnSig`).

## Tested (headless Chromium, software GL, real board "EC-6 ART")
- World: one-tap Santorini opens, 168 buildings, 60 fps in the HUD.
- Building: door button at a house, chooser, Dollhouse (level 3, 7 rooms).
- Smart Room: proposal, next option, Confirm -> 4 rooms (Gallery wing).
- Room: double tap -> level 4, anchors with no problems.
- Smart Display: Confirm -> "Walnut Block Shelf" with 16 real words of "Art Media & Techniques".
- Item: double tap a block -> level 6, "Drawing" (the board card); "Open card" is there.
- Save / restore: after a page reload the building, 4 rooms, the shelf and its 16 items are back (same ids and coordinates).
- 3D room: items stand on the shelf slots; the crosshair label shows the title, tap opens the display view. A card title changed in the board while walking showed in 3D within 4 s.
- Building edits: move, rotate (rotation only if the footprint fits), replace (cell count 114 -> 232), add (u1), delete (b4), restore (388 cells back), all survive a reload.
- Return: the pill brings you back to the doorstep in Santorini, door button and walk mode work.
- Memory: 5 enter/leave cycles of the 3D room: geometries 29 and textures 16 every time, 26 draw calls, JS heap flat (88-108 MB, garbage collected).

## Not verified / known limits
- No real device, no GPU; fps numbers come from software rendering.
- Moving a house onto a steep terrace builds a plinth under it; it looks blocky at cliff edges.
- Landmark buildings cannot be edited.
- Moving a display inside a room was not re-tested for the sync (only a board change was); the signature includes display positions.
- Touch-tap block breaking could not be reproduced on the 63 control either, so its removal is verified in code and by the hidden HUD, not by behaviour.
- Selecting a building is "the house in front of you", not a ray pick of the building under the crosshair.

Rebuild: stack 63 -> 64 -> 65 -> 66 as in tools/combo67, then `python3 make68.py stack.html iPhoneDuo68.html`. Test scripts are in `tests/`.
