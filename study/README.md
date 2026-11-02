# The Study · 英式古典私人藏书室

A quiet English private library you can live and read in, the opposite of Admont's showpiece hall.
Stand-alone page: `study/study.html`. In My World: `iPhoneDuo69.html` (= `iPhoneDuo68.html` + `tools/patch_study.py`; no existing file is changed).

## The room
8 x 6.4 x 3.9 m: dark wood shelves on every wall with a carved cornice, dentils and corbels; a wide carved desk with a green leather top,
banker's lamp, inkwell, candlesticks and an open book in front of the north window (damask curtains, sheers); a brass chandelier,
coffered ceiling, herringbone parquet, a Persian carpet; desk chair, visitor's chair, wing armchair, side table, globe, floor lamp.
A brass rail runs along the east shelves with a rolling library ladder on it. All textures are painted in code (no files, nothing to attribute).
Sizes are chosen for a country-house study, not measured from a real room.

## What you can do
| Action | Desktop | Touch |
|---|---|---|
| Push the ladder along the rail | walk into its side | joystick |
| Take hold of the ladder and walk it along | G (again to let go) | 🪜 |
| Climb it | E at its foot, then W/S; A/D slide it while you stand on it; E or S at the bottom to step off | ✋ then joystick |
| Take a book | aim at the spine, E or click: it slides half out and its card opens (title, author/list, text) | tap |
| Put it back | E again, or 放回书架 | button |
| Sit | E near the desk chair or the armchair | ✋ |
| Read | R (sits you at the desk and opens the book's text) | 📖 |
| Add a book | B or ＋ 放一本书 | button |

## In My World (iPhoneDuo69.html)
- 一键英式藏书室 makes the island a small garden with one house (`p.st = 'house'`). Its room `私人藏书室 The Study` (`r.st = 'study'`) is the 3D study.
- The user's books on the shelves ARE the things in that room's displays (card refs `listId/cardId`, read live from the board; nothing copied).
  They get there with My World's own tools (Smart Fill, Smart Display, drag from the Box) or with ＋ 放一本书 in 3D, which lists the board's cards and puts the chosen one in the room's bookshelf display.
- A book's title is the card title (+ its Chinese title), the author line is its list, the excerpt is the card's text. 打开原卡片 opens the card in My World's display view; a pill brings you back to where you stood.
- 🏠 剖面 Dollhouse opens the house's building view (Smart Room, rooms); 🚶 Walk in on the island or in the study room opens the 3D study.

## Tested (headless Chromium, software GL)
- Stand-alone: 20-25 draw calls, ~54k triangles, 9 textures, 3523 spines (one InstancedMesh + one merged mesh for the user's books).
- Push: walking into the ladder moved it 0.9 -> 1.69 m. Grab: it followed 1.40 -> 0.76 m. Climb: on, up, slide 0.74 -> 1.07 m, down.
- Take from the floor and from the top of the ladder (top east shelf, y 3.05 m): book slides out, card shows. Sit at the desk, read, stand.
- Add a book in the stand-alone page: it appears and survives a reload.
- My World, clean storage, real board "EC-6 ART": one-tap opens the study; the picker lists the board's cards; 6 added -> 6 titled spines;
  the room's Bookshelf display holds the 6 refs; take -> card with the real title, list and text; 打开原卡片 -> level 5, crumbs
  The Study › 私人藏书室 › Bookshelf; pill back -> study; Dollhouse -> level 3; double tap -> level 4 (anchors: books 6/9, no problems);
  Walk in -> 3D study; Smart Fill in the room -> 12 books in 3D; reload -> 3D button there, 6 books back. Other worlds' runtimes still load.

## Not verified / limits
- No real device, no GPU (frame times are software rendering; walking tests are measured by position).
- In the test the double tap into the room needed a short gap between taps (a test timing issue; a real double tap works the same as for other buildings).
- The ladder snaps you to it when you climb; there is no animation of hands/feet. You cannot walk on top of the shelves.
- Books taken out are not remembered after leaving (they go back on the shelf). Shelf position of a book follows its order in the displays.
- The visitor chair is not a seat; only the desk chair and the armchair are.
