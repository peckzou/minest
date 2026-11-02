# Admont Abbey Library · tools

A high-quality procedural 3D interior reconstruction of the Admont Abbey Library
(Stift Admont), built with Option D: three.js code-modelled MESH (not voxel),
with CC0-equivalent procedural placeholder textures and public-domain fresco stubs.

Mirrors the Alpine Chalet precedent (`alps/`): a standalone page plus a My World
integration produced by a Python patch tool.

## Layout

- `admont.html` - the standalone page (open directly in a browser).
- `admont-world/world.js` - the non-voxel data model (hall at published proportions,
  the three wings, doors, seats, landmarks, tour path, spawn). THREE-independent.
- `admont-world/textures.js` - procedural canvas placeholder textures (marble floor,
  white stucco, gold trim, carved bookcase, leather book spines). Each is marked in a
  top comment with the exact `assets/textures/<file>` path for a real CC0 drop-in.
- `admont-world/scene.js` - three.js mesh builders: the architecture shell (marble
  floor, long side walls with window openings, flat side ceilings, central dome drum)
  and ONE finished two-storey white+gold bookcase with INSTANCED book spines.
- `admont-world/app.js` - the runtime: renderer, natural-light rig, first-person
  free-walk controller (WASD + mouse / joystick + drag, pointer-lock, shell collision),
  idle tour mode, loading sequence. Exposes `window.__admont`.
- `vendor/three.min.js` - three.js r128 (copied from `work/`). A same-dir copy sits at
  `admont/three.min.js` as a fallback (as `alpine.html` does).
- `assets/textures/` and `assets/frescoes/` - drop-in dirs for real PD/CC0 assets.

## Published proportions

About 70 m long x 14 m wide x 11 m high, three sections, central dome apex ~12.7 m.
Coordinates are in metres; x runs along the 70 m length; the hall is centred on the origin.

## Rebuild / verify

```sh
# syntax check every world script
node --check admont/admont-world/world.js
node --check admont/admont-world/textures.js
node --check admont/admont-world/scene.js
node --check admont/admont-world/app.js

# render check: open admont/admont.html in a browser (or the playwright power)
#   file:///projects/sandbox/admont/admont.html
# window.__admont is defined after load; world.buildings has three wings.
```

## Assets drop-in (CC0 / public domain only)

Textures: save real CC0 textures under `assets/textures/` at the paths named in the
top comment of `admont-world/textures.js`, then have `scene.js` load them to override
the procedural placeholders. Frescoes (FEAT-002): public-domain Altomonte ceiling
images under `assets/frescoes/`. No CC BY-SA, no paid API, no attribution page required.

## Scope notes

FEAT-001 (this slice): the hall shell at published proportions, ONE finished bookcase
section, free-walk first-person camera with shell collision, tour mode, loading overlay,
white+gold theme. The richer content (7 frescoes, 16 sculptures, marble shader, windows,
collect-books hook) is FEAT-002. The My World integration (`patch_admont.py`) is FEAT-003.
