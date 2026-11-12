# Knowledge Balloon: a hot-air balloon over your cards

A new Dynamic presentation for My World. The balloon drifts down one long valley; every **List** is a flight corridor
along that valley and every **Card** is a floating island with the card's picture on a frame above it. Tap an island and
the balloon glides over and hovers beside it; tap it again to pull the card out and read it (the shared reader from
`showcase-common.js`: pull out → fly to you → tap to flip to the meaning → tap outside to put it back).

Nothing is copied and Kanban is never written: the cards are read live through the provider, exactly like the Drive.

## The files

- **`balloon.js`** (`window.MinestBalloon`) — the whole mode. It reads the cards through `KRail` (the data layer cut from
  the Knowledge Drive) and draws them with `KShow` (the shared stage, HUD, reader and carriers).
- **`balloon.css`** — the balloon's own skin: the route map, the corridor list, the hold-to-climb buttons.
- **`balloon.html`** — a standalone prototype page. Serve it next to `tools/knowledge-rail/` and open it; the sample boards
  are the Knowledge Drive's own (`kd-b1` Biology, `kd-b2` 中文词汇). Add `?fresh` to ignore the saved progress.

## The flight

- **The route.** One continuous curve through every corridor. The balloon's position is an arc length along it, so the
  corridor it is in, the map and the exhibits' positions all agree.
- **The land.** The terrain is a deterministic function of the world position (smooth hills, a river that meanders along
  the route). It is built in chunks and only the chunks near the balloon exist; trees and rocks are instanced. The
  festival camps are built and dropped the same way, one every 260 units of route.
- **The exhibits.** A floating island (a rock, a grass cap, a halo in the list's colour) with the card's frame above it.
  Islands are built when they come into range and dropped when they go out of it.
- **The balloon.** A low-poly teardrop envelope cut into **gores** (vertical panels of colour, each with a dark load tape
  down its seam and the fabric bulging between the tapes), a crown and a vent on top, a skirt below the mouth, a wicker
  basket with leather rim and base, eight rigging ropes, a brass burner that flares when you climb, and a passenger in a
  red hat sitting in the corner of the basket.
- **The festival.** You never fly alone. **Four escorts keep station beside you** — just off your wing, at your height,
  bobbing and swaying — and **ten more drift along the route ahead**, each with its own gores, its own drift speed and
  its own altitude, so at any moment roughly ten balloons are in the sky around you. Their burners flare now and then.
  On the ground, every so often the route passes a **festival camp**: striped tents, flags, a bonfire with a real light,
  and lines of bunting strung between poles.
- **The confetti.** The festival leaves coloured paper in the air; it drifts and falls around you as you fly.
- **Two views.** 🎥 Chase (the balloon from behind and above) and 🎈 From the basket (you lean over the rim and look out).

## The controls

| | |
|---|---|
| Drag | steer the balloon sideways and change its height |
| Wheel / pinch | the height |
| ⬆ / ⬇ (hold) | climb / descend |
| ⏸ / ▶ | cruise on or off (the balloon drifts on its own) |
| ⏮ / ⏭ | fly to the previous / next exhibit |
| 🗺 | the route map: the route, the river, the exhibits, the festival's balloons and where you are; tap a corridor to jump to it |
| 🎨 | the sky: Dawn, Midday, Golden Hour, Starlit Night |
| 🎥 | chase view / from the basket |
| Tap an island | fly over it |
| Tap it again | pull the card out and read it |

Keys: `Space` cruise, `Enter` read, `M` map, `V` view, `↑ ↓` height, `← →` sideways, `Esc` back / close.

## Saved progress

`localStorage` `minest.balloon.v1`, per source: the position along the route, the height, the speed, the sky, the view and
whether it was cruising. Never in Kanban.

## In My World

- The 🚗 button in My World's header opens **Presentation Gallery → Dynamic → Knowledge Balloon**.
- The starting points are the same as the other modes: this List, this Board, the Workspace.
- The gallery's style row is the balloon's **Sky**.
- `tools/knowledge-drive/patch_knowledge_drive.py` injects `balloon.css` + `balloon.js` into all nine page copies and
  re-runs after every edit.
- `tools/knowledge-drive/duo-dyn.js` gives the balloon a console on the Duo's lower screen (previous / cruise / next on
  the left, route / view / sky on the right).
