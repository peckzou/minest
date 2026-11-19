# Minest Duo 70

A new page, `iPhoneDuo70.html`, built from `iphone.html`. No existing file is edited.

    python3 tools/duo-70/build.py          # writes iPhoneDuo70.html
    python3 tools/duo-70/build.py --check  # is the page what the script builds?
    node tests/duo-70/duo70.test.cjs

Open it with `python3 -m http.server 3005` → `http://localhost:3005/iPhoneDuo70.html`
(`?clun=0&home=0` goes straight to the board).

What is new (`v70.js`, `v70.css`, and five anchored edits in `build.py`):

- **board | 3D Cover, both ways.** Swiping the Cover marks its front card on the board and scrolls the list to it
  when it is out of view. A card inside a closed stack marks the stack's top card. While the board is being
  scrolled this way it does not turn the Cover back (`followCard` stays quiet), and a finger on the board
  always leads.
- **Board scroll → Cover.** The Cover follows the top card that is visible in its list; a card scrolled out above
  the list no longer counts (it did in `iphone.html`).
- **Switching boards with the split open.** The Cover used to stay empty until the board was scrolled; it now
  shows the new board's list at once, with its card marked.
- **Motion and detail.** Lists rise in one after another when a board opens; the two panes of the split arrive
  together; cards sink under the finger and list buttons when pressed; the hinge line fades towards its ends; the Cover's
  position bar keeps clear of the pane edges; thin list scrollbar; keyboard focus ring; even title wrapping;
  steady digits. All of it respects `prefers-reduced-motion`.
- **Changing view.** Going between the board and the 3D Cover fades the new view up instead of snapping. The
  Views menu gets a soft shade behind it, so its labels read over the board's text. Dock icons and Spatial
  Home's buttons respond to a press.
- **Outer screen.** On the Glance the Mini Pet's default spot was on top of the "start studying" button; it now
  rests in the free corner below the cards, and goes back when the full app or the inner screen is shown. A
  pet the user has dragged is left where it is.
- **Pet screen.** Its ✕ went fully invisible, and took no taps, once the pet had been left alone for 4 seconds,
  so the full-screen pet showed no way out until something was touched. It now only dims and can be tapped.
- **Spatial Home's album.** It opened the My World overview only; `spatial-home/README.md` notes that the
  inventory was never wired because it wants a world to show. The album now opens My World as before with the
  inventory (`MinestInventory`) on top, for the board in use, or the first board that has a list. The inventory's
  own × leaves My World open; My World's close goes back to the room, as before. `v70.js` does this by wrapping
  the album's entry in the room's feature table (`SpatialBridge.FEATURES.lists`) when the page starts.
- **Speed.** The Sync Center's look at all boards every 4 seconds (a full re-serialise and hash, about 80 ms on
  the demo data) waits for a quiet moment instead of landing in the middle of a swipe, and no longer hashes data
  whose JSON is the same as at the last look (91 ms → 7 ms per look when nothing changed; a change is still seen
  at the next look, as before).
  CSS animations pause while the app is in the background; pictures decode off the main thread.
