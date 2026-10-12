# Discovery & Inspiration Engine V1.0 — delivery notes (iPhone 53.2, dev copy)

Inspire → Discover → Collect → Suggest → Explore → Grow. One engine (`MinestDiscovery`), several ways in (`MinestInspire`).

## Build

`python3 tools/myworld3/build.py 53.2 "Minest iPhone 53.2 · Discovery & Inspiration"` → `iPhone53.2.html`.
Base: Codex's 53.02 (read-only). Production is not touched.

## Changed / added files

| File | What |
|---|---|
| `tools/discovery/discovery.js` | engine (suggest · inspiration · grow) + UI (Daily card, Library / Grow overlay `.ins`, Visual Library panel, Discover row) |
| `tools/discovery/inspirations.json` | 80 prompts, 8 categories (stable ids, follow-up, action, Discover tool, content types, depth) |
| `api/library/related.mjs` | **new** server endpoint: TMDB recommendations · person credits (same guard as `/api/library/tmdb`) |
| `tools/myworld3/universe.js` | Daily Inspiration on the home page; ⋯ → Inspiration Library, Grow My World; `MinestUniverse.refresh()` |
| `tools/myworld3/build.py` | general build (replaces `build_53_1.py` for new versions) |

The Visual Library sources are not edited. The build makes four explicit string patches to the bundled copy:

- a `minest:vl-select` event;
- a `minest:vl-render` event;
- `selectEntity(x, on)`, `previewEntity(x)` and `selected()`;
- an `ui.extra` lookup, so suggested entities join the same multi-select and save.

## Providers (audited)

| Domain | Groups | Source | Status |
|---|---|---|---|
| Music (iTunes entities) | Similar artists · Albums · Popular songs / Songs on album | ListenBrainz similar-artists (via MusicBrainz id) + iTunes lookup, called from the browser (CORS) | **verified live** (Taylor Swift → Ed Sheeran, Katy Perry…) |
| Books (Open Library / Google Books) | Similar subject · Same author | Open Library work / search / subjects (browser) | **verified live** (Dune → Frank Herbert's books; Science fiction) |
| Movies / TV (TMDB) | Similar · Same director · More with lead actor | `/api/library/related` (server, TMDB token) | unit-tested with mocks; **not live-verified** (no TMDB token / Minest auth locally); needs deploying with `api/library` |
| People, History, Nature, Sports, Places, Food, Brands, Games, Art, Images | — | no reliable relation source yet | groups hidden, never padded |

- Deezer remains disabled (terms pending).
- The engine keeps a polite gap per host, and stale requests are aborted. Results are cached per entity id (memory plus
  sessionStorage), and only the latest pick is used, after 450 ms.
- Only public ids and names are sent out. Answers and notes never leave Minest.

## Data (MinestKnowledge, synced)

| Key | Meaning |
|---|---|
| `ins:day` | `{date, id, ctx, skipped, seen}`: one stable prompt per local day; Another / Skip are per day |
| `ins:ans:<prompt>` | `[{at, text, inbox}]`: the Inspiration Response (copied to the Inbox only when ticked) |
| `ins:fav:<prompt>` | Save for later (≠ an answer) |
| `ins:log` | light activity |
| `ins:growoff` | Grow ideas dismissed |

Suggested entities are never written until the user adds them and saves through the Visual Library.

## Grow (explainable · preview · confirm · undo)

| Suggestion | When it appears | What it does |
|---|---|---|
| Move N things into <list> | Inbox things whose first Smart Organize match is the same list | moves the same cards; Undo puts them back |
| Create My Favorite Artists / Movies / Books | 3 or more collected entities of that kind and no such list | Capture organize; Undo via its log |
| Rank <list> with a Tier List | a list with 8 or more things | opens Discover on that list; nothing is changed |

## Not yet verified

- TMDB suggestions live (needs `api/library/related.mjs` deployed with `TMDB_READ_ACCESS_TOKEN` and Minest auth).
- The "Create My Favorite …" grow flow with real Visual Library saves (logic present; the providers need auth locally).
- iPhone / iPad device runs; the Discover "Inspired for you" row with a list preset on device.

## 53.3 — Building Assist (Smart Suggestions correction)

`tools/discovery/assist.js` (MinestAssist) puts suggestions where you build; it is not a page you visit.

**Inline**

- Attaches itself to these fields:
  - My World 3.0 New List;
  - World Builder world name, and its New area / category / list sheets;
  - Visual Library search and new-list name;
  - Quick Capture.
- Sources: your history (`as:hist:<kind>`), template vocabulary, your own worlds (an "Already have … · Use it" note
  instead of a duplicate), and the local catalogues.
- Debounced and local only. Arrows / Enter pick, Esc or × ignore.

**Choice**

- The Visual Library related row is compact: one group at a time, with tabs.

**Decision**

- Visual Library "Add to My World": "Suggested for …" with up to 3 lists and reasons (name fits, already holds similar,
  where you put this kind before — learned only on Save, `as:dest`). Tapping ticks the existing checkbox.
- "Ask AI" uses the existing ai-chat endpoint, only on tap and only with names.
- My World New List: up to 3 areas with reasons (shared words, similar sibling lists, the same kind of place).

Nothing is created, saved or moved by a suggestion. The existing save and undo flows decide.

Not verified: Ask AI (needs Minest AI authorization); the World Builder sheets (wired, not exercised in this preview).
