# iPhoneDuo68: Santorini integration, step 1

`iPhoneDuo68.html` = base `iPhoneDuo.html` (untouched, sha1 ed17ba0f7af2) + voxel layer 62 + Oia link 63 (door -> Dollhouse) + Alpine 64 + Admont 65 + Trinity 66, then `make68.py`.

## Audit (what already exists, from 63)
World (one-tap Santorini, 167 building pieces, `p.vox` = stable building id) -> Building (door button) -> Dollhouse (`bldOpen`, Smart Room, rooms in `p.rooms`) -> Room -> Display (Smart Display) -> Item (card refs `listId/cardId`, read live from the board). Verified earlier on 63.

## Done in step 1
- Per-block place / break / pick removed from the Santorini engine (mouse, touch tap, Q/E, wheel, held-block HUD). Saved edits from older sessions are still re-applied.
- The generic voxel layer's dock lost its block tool; Q no longer switches to break/place.

## Not done yet (planned)
1. Whole-building add / delete / move / rotate / replace in the 3D world (needs generator overrides stored per `p.vox`).
2. Stable display anchors / slots in room-local coordinates, stored with the Display.
3. Live sync between the 3D room and board edits / Smart Display.
4. Full 12-step acceptance run on 68 and performance measurements.

## Tested (headless Chromium, software GL)
All runtimes load (Oia, OiaLink, Alps, Admont, Trinity, Voxel62); one-tap Santorini opens; 167 building pieces; Dollhouse of one building opens (level 3, 2 rooms); held-block HUD hidden (control 63: shown). Touch-tap block breaking could not be reproduced even on the 63 control, so its removal is verified by code, not by behaviour.

Rebuild: `python3 make68.py stack.html iPhoneDuo68.html` where `stack.html` is the 63 -> 64 -> 65 -> 66 chain (see tools/combo67).
