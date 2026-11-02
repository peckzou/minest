# Admont Abbey Library · tools

A procedural 3D interior of the Admont Abbey Library (Stift Admont, Josef Hueber, 1776), built with
three.js r128 meshes (not voxels). Every texture, fresco and sculpture is generated in code, so the page
works offline and needs no third-party or paid API. Mirrors the Alpine Chalet layout (`alps/`): a
standalone page plus a My World page produced by a patch script.

## Files

- `admont.html`: the standalone page.
- `admont-world/world.js`: data model (70 x 14 x 11 m hall, dome apex 12.7 m, three wings, doors, seats, tour, spawn).
- `admont-world/textures.js`: canvas textures (rhomb marble floor, stucco, gold, painted wood, book spine, window glass, relief).
- `admont-world/frescoes.js`: the seven ceiling frescoes (procedural stand-ins, real photo drop-in).
- `admont-world/scene.js`: the meshes. Static architecture is merged per material; ~17 700 books in one InstancedMesh.
  Includes the gallery and balustrade, upper and lower bookcases, 6 vaults + dome, 16 sculpture proxies + 2 reliefs, windows, light shafts, doors.
- `admont-world/app.js`: renderer, light rig + PMREM reflections, first-person walk / fly, tour, book collecting, `window.__admont`.
- `tools/patch_admont.py`: builds `iPhoneDuo65.html` from the unmodified `iPhoneDuo.html`.
- `assets/`: drop-in folders for real public-domain / CC0 files (see `assets/README.md`).

## Rebuild

```sh
cd admont
for f in admont-world/*.js; do node --check "$f"; done
python3 tools/patch_admont.py ../iPhoneDuo.html ../iPhoneDuo65.html
```

The patch asserts that it only inserts: Santorini (`mn-oia-run`, `santoriniBuild`) is unchanged and no Alpine
layer is present. The source page is only read.

## Controls (standalone)

WASD / arrows move, mouse looks, Space jumps, Shift sprints, F toggles fly (the only way onto the gallery for
now), E or click on a spine collects / un-collects a book. Touch: left joystick, drag to look, 🚪 button = E.
`?mode=walk` starts walking, `?q=low` turns off shadows and halves fresco resolution.

## In My World (iPhoneDuo65.html)

Console → 一键生成 → 一键阿德蒙特图书馆. The island gets one landmark piece (`p.adm = 'library'`) and opens the
3D hall. The 🏠 button at the top names the wing you stand in:

- 🏠 剖面 Dollhouse: My World's building view; its 3 rooms are 北厅 / 中央穹顶厅 / 南厅 (`r.adm = wing id`).
  Smart Room, double-tap a room → Room → Display → Item. The pill 📚 回到大厅 (or leaving the building) returns
  to the same spot in the hall.
- 🚶 走进「…」房间: straight into that wing's My World room; 🌳 Outside returns to the hall.

Collected book ids are stored on the island (`d.adm.books`); the standalone page uses localStorage
`admont.books.v1`. Hooks: `window.__admBooks = { load(), save(ids) }`, `window.__admBook(evt)`.

## API

`window.__admont`: `world, player, scene, camera, S, setMode, teleport, interact, toggleDoor, sitOn, markDirty`,
`books.{count, ids(), collected(), aim(), collect(id, on), cases}`, `stats()`.

Measured in headless Chromium (desktop settings): 19–28 draw calls, ~272k scene triangles, 17 745 books.
Code ~95 KB + three.js 0.6 MB.

## Not verified against the real building

Window count, the gallery form and stair access, bookcase module size, sculpture positions, and the subject and
exact placement of each fresco. All are modelled from published overall dimensions.
