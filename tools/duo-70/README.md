# Minest Duo 70

A new page, `iPhoneDuo70.html`, built from `iphone.html`. No existing file is edited.

    python3 tools/duo-70/build.py          # writes iPhoneDuo70.html
    python3 tools/duo-70/build.py --check  # is the page what the script builds?
    node tests/duo-70/duo70.test.cjs

Open it with `python3 -m http.server 3005` → `http://localhost:3005/iPhoneDuo70.html`
(`?clun=0&home=0` goes straight to the board).

What is new (`v70.js`, `v70.css`, and four anchored edits in `build.py`):

- **board | 3D Cover, both ways.** Swiping the Cover marks its front card on the board and scrolls the list to it
  when it is out of view. A card inside a closed stack marks the stack's top card. While the board is being
  scrolled this way it does not turn the Cover back (`followCard` stays quiet), and a finger on the board
  always leads.
- **Board scroll → Cover.** The Cover follows the top card that is visible in its list; a card scrolled out above
  the list no longer counts (it did in `iphone.html`).
- **Switching boards with the split open.** The Cover used to stay empty until the board was scrolled; it now
  shows the new board's list at once, with its card marked.
- **Motion and detail.** Lists rise in one after another when a board opens; the two panes of the split arrive
  together; cards and list buttons sink under the finger; the hinge line fades towards its ends; the Cover's
  position bar keeps clear of the pane edges; thin list scrollbar; keyboard focus ring; even title wrapping;
  steady digits. All of it respects `prefers-reduced-motion`.
- **Speed.** The Sync Center's look at all boards every 4 seconds (a full re-serialise and hash, about 80 ms on
  the demo data) waits for a quiet moment instead of landing in the middle of a swipe: same work, same cadence.
  CSS animations pause while the app is in the background; pictures decode off the main thread.
