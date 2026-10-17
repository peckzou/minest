# My World — content model and interaction model (iPhone 53.4; started as 53.33)

## Content: five levels, one name each

| Level | Name in the UI | Data (unchanged) | What you see |
|---|---|---|---|
| 0 | **My World** | all boards that are worlds | the sky: the centre island + your world islands |
| 1 | **World** | a board (`bid`) | the world island; its areas as grass-capped tiles |
| 2 | **Area** | a board column (`col`); section headings group lists | a scene; its lists as plank-capped tiles |
| 3 | **List** | a card in the column (`card`) | an object; its things as List / Gallery |
| 4 | **Thing** | an item in the card's `stack` | the existing details page |

The **Inbox** holds things that are not placed yet.

**Looks are kept apart from data.** These keys live in MinestKnowledge:

- `uv:skin:w:<bid>`, `uv:skin:c:<bid>:<col>` and `uv:skin:l:<card>` hold the chosen island, scene and object;
- `uv:hide:<bid>` marks a world hidden from the sky;
- `uv:center` holds the centre style.

Changing a look never moves or renames anything.

"My Universe" is gone. The crumb, Home button and wide-screen sidebar all say **My World**.

## Interaction: the same places on every level

| Where | What |
|---|---|
| Top left | ✕ on My World, ‹ Back below it. A left-edge swipe also goes back. |
| Crumb | The path you took. Tap any step to go back to it. |
| Top right | ⌂ My World home · ☰ Outline (the same place as a tree) · 💡 daily inspiration · ⋯ |
| Bottom | **+ Add to My World**. It is on every level now, including the sky, and is aware of where you are. |
| Tiles / islands | **Tap = go in.** |

**On the home sky**

- Tap a world island and you are inside it in one step; the old version opened a menu first.
- Hold it (or right-click) to get its actions: Enter, Build, Add, Look.
- The centre island is the hub. Tap it for Overview, New world, Add and Templates.
- Every gem has a label under it.

**Add sheet: two groups by intent**

- **Add things**: Capture (text, photo, link) and Visual Library (movies, books, music…). These go into the list you are in; from higher up they go to the Inbox.
- **Make a place**: New List, Templates, Build a world, Customize my world.

**⋯ sheet: this place first, then tools by purpose**

- **This world / area / list**:
  - Change the look;
  - Look closer in 3D;
  - Hide from the sky (worlds only);
  - Open as a Kanban board (lists only; this leaves My World).
- **Collect**: Inbox, Activity.
- **Explore & reflect**: Discover, Frameworks, Inspiration Library, Grow.
- **Build & look**: Worldview Templates, Visual Assets.
- **Other views**: My World 2.0.

The hero card only says what a place is (name and counts). Its old tool pills now live under ⋯.

## Where it is implemented

`build/5333/make.py` builds iPhone53.33.html from Codex's iPhone53.32.html, which stays read-only.

- `island.js`:
  - the home stage layout;
  - tap / hold on islands;
  - the gem menu;
  - Add and ⋯ grouping.
- The ⋯ rows click the place's own original buttons, so every write and undo path is still the original one.
- `poly.tpl.css`: the Poly Craft look, plus hiding the hero tool pills.
- make.py string patches: the "My World" naming and the ⋯ subtitle.

Nothing in the data, saving, undo or sync changed.

## Icons

The emoji in My World's own chrome are replaced by one set of square-cap line icons on cut gems. `island.js`
`IC` / `EMO` hold the drawings and the emoji they replace.

Each meaning keeps one gem colour wherever it appears (`gen.py` `ICO`). For example, Inbox is always red and Capture
always cyan.

Only Minest's icon slots, tabs and buttons are changed; anything a person wrote keeps its emoji.

## Frameworks and templates inside Build

`build/5333/craft-build.js` (MinestWays) turns every buildable framework into a world template. Buildable means 2–16
top-level parts; the Periodic Table or the 102 Great Ideas stay lenses.

- Template id: `fw-<id>`, family "Ways of Seeing".
- The framework's parts become areas, and their sub-parts become lists.
- If the framework already has a related template, that template is used instead.

The one template preview (`MinestMyWorld.template`) does all the building:

- switch parts off;
- choose "A new world" or "Add to <world>";
- undo.

"Shape with a way of seeing" sits where you build:

- the world page (the old "See … through a framework" hint now shapes the world itself);
- Add → Make a place;
- the Builder's first screen ("Or start from a way of seeing");
- the Builder's "Build next";
- a framework's own page ("Build a world with this").

Suggestions match words in the world's name and areas, then fall back to sensible defaults.

## Discover is a game

`build/5333/play.js` (MinestPlay) makes a game card start the game straight away.

**Choosing the deck**

1. One of your own lists with pictures.
2. If there is none, a built-in picture deck: Movies, Foods, Artists or Books.
3. Desert Island and What Matters use their own built-in decks.

**While playing**

- Each game uses its default settings.
- Quick Play picks a random game and deck.
- "Deck ⇄" changes the deck and "Shuffle" picks another.

**Game feel**

- block progress;
- a streak counter;
- gems on every pick and a shower of gems at the end.

It drives Discover's own steps (source → start). Sessions, results, "Add to My World" and undo are still Discover's own.

## Test run: building "My Travel World" from scratch (fixed)

`build/5333/travel.mjs` replays the whole run headlessly.

- **Builder forms.**
  - The New list / New area forms now offer names from every template's vocabulary that fit the area. Places I've Been
    → My Important Places / My Favorite Places; Dream Destinations → My Want to Visit / My Travel Wishlist.
  - The form's preview follows what you type.
  - The forms use the craft look.
- **Seed subtitle.** "Start from Scratch" drops the seed's subtitle once the world gets its own name.
- **Open my world.** From the Builder it goes to the world in My World, not the older starter page.
- **Capture note.** For a list without fields of its own, the Note is now kept as the thing's text. It used to be lost.
- **Add another.** After adding a thing you get "＋ Add another" (several countries in a row).
- **One feedback per add.** You see "Saved … → list · Open · Change · Undo" once, not twice.
- **Items without pictures** show their first letter on a gem instead of an empty frame.
- **List hint.** "Play This or That with <list>" starts that game with that list.
- **Discover card labels.** Status labels no longer jump to the top-left. The cause was a `.st` class collision with
  the Capture page.
- **Grow suggestions.**
  - The world's Grow suggestions mix templates and frameworks, matched on words (with travel / food / … synonyms).
    For a travel world, My Places World comes first.
  - When adding into a world, areas you already have (same name, with or without "My") start switched off.
  - Afterwards you return to the world.

## Scenes, pictures, reading mode

**Scenes**

- Every area of a world gets its own scene.
- The order of choice: the best unused match for the area's name, then that match's neighbours (e.g. travel → city,
  ocean, forest), then the world's theme, then the rest.
- A lone "dream" no longer turns a travel area into a lab.
- Patched into the universe's `catSkin` by make.py.

**Pictures (`build/5333/pics.js`)**

- Things without a picture get one from Wikipedia: the page of that name, else the best search hit with the list's name.
  No account is needed, and only names are sent.
- The picture becomes the thing's cover.
- **Automatic**: once per thing, about a second after you are back on the list, not while you are still adding.
  Per device under ⋯ → This list → Auto pictures.
- **"Find pictures (n)"** on the list page asks again.
- One board update per fill, with Undo, which removes only the covers it added.

**Reading mode (`build/5333/read.js`)**

- The 📖 block in the header, on a world, area or list (also ⋯ → This … → Reading mode), opens the world as its Kanban
  board.
- A craft bar switches between Kanban, Contents, Outline, Map, Timeline, Portal and Learning Map, all reading the same
  board.
- "‹ My World" returns to the exact place you left. The old "Open as a Kanban board" row is folded into it.

## 53.4

- The build output is now `iPhone53.4.html`. The other session's pixel "Block World" 53.4 was kept, renamed to
  `iPhone53.4-block-world.html`.
- **Reading mode is visible on every place.** Right under the world / area / list card there is a "Read this … as"
  row: Kanban (gold), Contents, Outline, Map, Timeline, Portal, Learning. One tap opens that view directly. The header
  📖 and ⋯ entries stay.
- **Pictures are visible too.** While a list has things without a picture, a banner under its card says "N things have
  no picture" with a green "Add pictures" button and its progress. It disappears when all have one.
- **Reading mode is one button.** A gold "Reading mode" button sits in the place's card and opens the world as its
  Kanban board, with nothing added at the bottom. The app's own Knowledge entry shows Contents, Outline, Map, Timeline
  and Portal on it, and My World reopens where you left it.
  - The "Read this … as" row, the header 📖, the ⋯ row and the reading bar were removed on request.
- **Pictures for the whole page.** The banner works on every page with things: a list, an area (all its lists) or a
  world (all its lists). "Add all pictures" fills everything missing there, with one Undo. The automatic fill stays on
  lists.
- **Hidden worlds always come back.**
  - While any world is hidden, a "N hidden worlds" chip sits on the sky and ⋯ has a "Hidden worlds" section. Tap either
    to show a world again in its old place.
  - Before, the only way back was deep inside the centre island's Overview, and the hint pointed to the wrong place.
- **Reading mode** is a gold "Read" button at the top right of the header, on a world, area or list.
- **Discover finds new things.** Each game is played on new things like a list's own (`build/5333/more.js`, Wikidata):
  - It looks at the class the list's things share (country, city, film, dish, person) and the values they share
    (continent, genre, director, cuisine…).
  - It suggests the best-known matches, each with a picture, none you already have.
  - The result screen offers "Add N to <list>", with Open / Undo.
  - The Discover home shows "More like <list>" with Change.
  - The list hint reads "Discover more like <list>".
  - Built-in decks are only for exploring when no list has things yet.
- **Build bar** (`build/5333/buildbar.js`). Inside a world, area or list, the box under the card builds instead of
  searching. Search stays one tap away (🔍).
  - **World**: "Add a list… / Area". The chips are list names, each placed in the area it fits best, plus new areas.
  - **Area**: "Add a list to <area>…". The chips are names that fit that area.
  - **List**: "Add a thing to <list>…". The chips are new things like the ones there, with pictures.
  - Tap a chip to build it, or type and press Enter / ＋. Each add has Undo.
  - Names you already have (with or without "My") are never suggested.

## New world: one door, three ways (`build/5333/newworld.js`)

The door is "New world". It is reached from:

- the centre island's "New world" gem (its "Generate" gem goes straight to Generate);
- Add → Make a place (at home);
- anything that used to call `MinestBuilder.start`.

**The three ways**

1. **Step by step**: what it's about (topic chips, or type your own; the name follows) → its areas (suggested from the
   best template and the template vocabulary, plus your own) → their lists (suggested per area, never repeating an area
   or another area's lists) → check → Create.
2. **Generate it for me**: a topic → ready templates and frameworks → the template preview (switch off what you don't
   want) → Use This Template.
3. **Start empty**: a name and a first area → Create.

Step by step and Start empty build a small template and hand it to `MinestWorld.generate`, so the result is a real,
registered world with Undo.

**Every way ends inside the new world** in My World, where the build bar takes over: Add a list… / Area, with
suggestions.

**Other changes**

- Mix & Match stays as a small link on the first screen.
- The Add sheet is cleaned up:
  - At home: Capture, New List, New world.
  - In a world: Capture, New List, Grow with a template, Customize this world.
  - "Templates", "Build a world" and the Visual Library are gone from it.
- **The Visual Library is a profile tool.** It now lives in ⋯ → Profile. Its "Find … in the Visual Library" hints and
  the "Browse Visual Library" buttons in Add are gone.

## Header and settings (`build/5333/settings.js`)

**Whose world.** The top level is named after its owner: "<Name>’s World" (default "Peck’s World"). The name is set in
Settings → Profile and synced as `uv:profile`. It appears in the title, the first crumb and "Add to …".

**Header, right side**

- ▥ The board button (Reading mode) stands where the outline (list) button was.
- 💡 Daily inspiration.
- ⋯ Settings.

**⋯ opens Settings**

- **Profile**: whose world it is; My favourites (Visual Library).
- **Defaults**:
  - Lists open as Auto / List / Gallery (`minest.uv.defview`);
  - Auto pictures;
  - Build suggestions on / off.
- **Reading mode**: which view the board button opens — Kanban, Contents, Outline, Map, Timeline or Portal
  (`minest.read.view`).
- **Look**: Auto / Day / Night; the centre island style (at home).
- **This world / area / list**: change the look, look closer in 3D, hide.
- **Hidden worlds.**
- **More tools**: Inbox, Discover, Frameworks, Inspiration, Grow, Template gallery, Visual Assets, Activity,
  My World 2.0. Each runs through My World's own handlers.

## Quick edit and better "more like"

- **Quick edit** (`build/5333/quickedit.js`). Tapping a thing in a list opens a quick sheet, not a page:
  - its picture, with "↻ Another picture" (cycles Wikipedia search hits for its name and the list's name) and
    "Remove picture";
  - its name and note, edited in place and saved as you type;
  - "All details ›" for the full page.
- **"More like" reads the list's own name first** (`MinestMore`). When the name is a class ("My Furniture" → furniture,
  "My Countries" → country), its members or kinds come first: chair, table, bed… Things you already have are
  ignored for this step. The seeds' shared class is the fallback. This applies to both the build-bar chips and
  Discover.
- Empty title lookups are not cached.

## Cartoon pictures (53.4)

**Client: `build/5333/cartoon.js` (MinestCartoon)**

- Three styles: Minecraft (voxel cubes), Low-poly (like My World) and Cartoon.
- Two generators:
  - **Minest AI** — the new server op `/api/minest/ai-image` in `api/_minest/core.mjs`. It uses OpenAI images
    (`OPENAI_IMAGE_MODEL`, default `gpt-image-1`) with the server's own key. It needs the device token or the Google
    sign-in, and is limited to 12 per minute per caller. The PNG is shrunk on the device to a 384 px WebP.
  - **Free public** — Pollinations (`image.pollinations.ai`). There is no key and the result is a stable link. The
    thing's name is sent there, and the free tier adds a small mark. When it is busy, the request is tried again
    twice.
- Auto (the default) uses Minest AI when the device is authorized, else the free one.

**Where it appears**

- **Quick edit**: "Draw it: Minecraft · Low-poly · Cartoon". Each tap draws a new one.
- **Pictures banner**: Photos / Minecraft / Low-poly / Cartoon, for "Add pictures".
- **Settings → Defaults**:
  - Picture style, which also drives the automatic fill;
  - Cartoon generator: Auto / Minest AI / Free public.

**The server op needs deploying** before Minest AI pictures work. It was unit-tested with a mocked OpenAI response.

## Instant cartoon icons: the default picture

- Built by `build/5333/gen_icons.py` from open data:
  - emojilib keywords (MIT);
  - unicode-emoji-json names (MIT);
  - the Iconify icon lists for Microsoft Fluent Emoji (MIT) and Twemoji (CC BY 4.0, used for flags).
- The result is a local index of about 3,000 keywords → about 1,300 icons, roughly 80 KB, inlined into `cartoon.js` by
  make.py.
- Common words get a nudge: car → automobile, sofa → couch and lamp, rice → cooked rice. Countries get their flag.
- Looking up is local, about 0.5 ms. The picture is a small SVG from the Iconify CDN.
- Words the index lacks ask Iconify's search (one quick request); after that the fallback is a Wikipedia photo.

**Picture style is now:** Icons (default) · Photos · Minecraft · Low-poly · Cartoon.

- Used by auto pictures, the banner and Settings.
- In quick edit, "↻ Another picture" goes through icons first, then photos. "Draw it" stays as the slower,
  generated choice.
- The cover title names the source ("Icon · Fluent Emoji / Twemoji"), which also serves as Twemoji's attribution.

## Editing a list in place (`build/5333/arrange.js`) and live suggestions

**Editing**

- **Rename in place.** Tapping a thing's name turns it into a text box right there. Enter or tapping away saves; Esc
  cancels. Tapping the picture still opens quick edit.
- **Arrange.** "Arrange" sits next to List / Gallery; a long press on a thing also starts it.
  - The things jiggle and each shows a red ✕. ✕ removes it, and Undo puts it back in the same place.
  - Drag a thing to move it. The drop place is chosen by position, so toasts never get in the way.
  - "Done" ends it.
  - One board update per change.

**Suggestion chips under "Add a thing…" follow what you do**

- They never show what is already in the list. A thing you add drops out and the next one fills in.
- After each add, the first few are things like the one you just added; the list's own kind follows. For example,
  My Furniture → chair, table, bed…
- **Typing** filters instantly:
  - first, this list's pool (about 40 candidates of its kind);
  - then names from the icon vocabulary, each with its icon (e.g. "la" → Lazy Susan, Display case, Ladder, Laptop).

## Box view

- Lists now have three views: List · Gallery · **Box**.
- **Box** is an inventory of square slots, pictures only, like a game inventory. A thing without a picture shows its
  first letter on a gem.
- **Names** appear on hover (and on keyboard focus) as a small tooltip. On a phone, a tap opens quick edit.
- **Arrange works in Box too**: ✕ removes, and you drag to move.
- **Settings → Defaults → Lists open as** now also offers Box.
- Rendering is patched into the universe's `listHtml` by make.py (`.uv-box` / `.uv-bi[data-tip]`).

## Box = a Minecraft-style inventory (`build/5333/inventory.js`)

The Box view is built as an inventory.

**Layout**

- Square slots, all one size (`--slot`, from the panel's width so ten fit), in rows of 9.
- Empty slots fill out the last rows (at least 3); tap one to add a thing (it focuses "Add a thing…").
- **Top 9** is a separate hotbar at the bottom: the list's first nine things.
- The **bin** slot sits beside the hotbar.
- **Tabs**: the other lists of the same area, on the left (on top on a phone).

**Hands, as in the game**

- Click a thing to pick it up; it follows the pointer and its slot dims.
- Click a slot to put it down:
  - on a thing, the two swap and you now hold the other one;
  - on an empty slot, it goes to the end.
- Esc puts it back. Clicking outside the inventory lets go.
- Shift-click moves a thing between the hotbar and the rest.
- Hover + 1…9 swaps a thing into that hotbar slot.
- Holding a thing + a tab moves it to that list.
- The bin removes it, with Undo (it comes back in the same place).
- Right-click (long-press on a phone) opens quick edit.
- The name shows on hover.

Holding changes nothing; each put-down is one board update. Arrange is hidden in Box, because these hands replace it.

## The inventory screen, the character, and All items

**Opening and staying.** The inventory now opens from a "•••" slot at the right end of a list's card (like the ••• in
the game's hotbar). The Box button is gone from List / Gallery. Everything happens on the inventory screen over My World:

- tabs show the other lists right here;
- an empty slot takes a new thing in place (a small box: Enter adds, and the next empty slot opens);
- Esc lets go, and a second Esc closes;
- ✕ closes.

**My character** (`build/5333/avatar.js`). A Minecraft-style blocky figure is set in Settings → Profile:

- skin, hair (short / long / cap / none), hair colour, shirt, trousers, shoes and glasses;
- synced as `uv:avatar`;
- it stands at the left of the inventory, as in the game.

**All items** (the second mode of the inventory, like the creative inventory)

- **Tabs**: "For <list>" (new things of its kind; Wikidata, with adult terms filtered out), then Food & Drink,
  Animals & Nature, Objects, Travel & Places, Activities and Flags.
- **Search** over every icon name and keyword.
- **Picking from the library**:
  - pick an item, then click a Top 9 slot: a new thing is added there, with its picture, and the library keeps its
    copy;
  - Shift-click adds it at the end;
  - holding one of your own things and clicking the library throws it away (Undo).

**Icons arrive in batches.** They come through Iconify's JSON API (one request for up to 60) and are drawn as local
data URLs. Many single SVG requests at once can be refused. Any icon `<img>` that fails to load is mended the same way.
Stored covers keep the short link.

**Size.** Slot size comes from the screen width, not the panel, so the inventory always fits a phone.
- **The inventory works on every world.** The ••• is on the card of a world, an area and a list.
  - On a world: the tabs are all its lists, and it opens on the first list with things.
  - On an area: the tabs are that area's lists.
  - On a list: as before.
  - Tabs switch in place. The title shows the world when opened from a world.
- **The board button on the top level** opens the whole world's board (`MinestRead.worldBoard`), for example
  "Peck’s World · Board".
  - One column per world: its name and counts, plus "Board ▸" for that world's own Kanban (Reading mode).
  - One card per area, with its lists as plank chips.
  - Tap an area or a list to go there in My World.
  - It changes nothing. Inside a world, area or list, the button opens that world's Kanban as before.

## Display — Box things set out on the island (53.4, `build/5333/myworld/` — see its README)

My World is a personal visual world to arrange, show and explore — not a building game. Each world gets a display
scene, opened by the island button next to ••• on a world's, area's or list's card.

- **Item ≠ display.** A display only points at things (`<list id>/<thing id>`); the Box (lists and their things) is never
  changed. One thing is out in one place at a time — putting it somewhere else moves it. Saved per world in the synced
  side data `dsp:<board id>` = `{scene, rot, pc:[{id, k, x, y, f, s, it:[refs], label}]}`.
- **Scene (Sims-like):** Island / Room / Museum, fixed isometric corner view; ⟲ ⟳ quarter turns (Q / E); drag the ground
  to look around, pinch / wheel / − + to zoom, ⤢ to see it all. Room and Museum draw the two far walls (cut-away).
- **Minecraft blocks:** every piece is built from blocks with 16×16 pixel textures generated at runtime (oak / spruce /
  dark oak planks, bookshelf, glass, quartz, blackstone, wool, concrete, lanterns with a glow, grass and dirt), drawn as
  SVG patterns on each block face; parts are depth-sorted by the isometric rule only where they overlap on screen.
- **The eight displays:** Display wall (item frames on a warm wall, lanterns), Grid display (oak cubbies, one thing a
  cell), Shelf (open spruce shelves, things standing), Bookshelf (bookshelf blocks, things face-out), Museum display
  (blackstone pedestal, gold rim, glass case, the thing floats in light), Gallery (white wall, big paintings, hanging
  lanterns, a bench), Desktop (oak desk on fence legs, lantern lamp), Themed area (wool walls with frames, carpet,
  flowers). Plus Memory timeline (gravel path, posts with frames and years), Item stand, Oak tree. Bigger (+) adds
  width (more slots). Furniture facing away shows "⟲ n facing away"; name tags show up close (🔍 / double tap).
- **Moving things:** drag from the Box drawer (or tap, then tap the spot) onto a piece or the ground; drag a thing
  between pieces, or back onto the drawer; drag furniture from the Furniture tab; drag pieces to move (half-cell snap,
  red when it does not fit — it settles in the nearest free place).
- **Selected piece:** Turn (R), − / +, Change ▾ (another kind, its things stay), Fill (from a list), Remove (Undo; its
  things go back to the box). **Selected thing:** Edit (quick edit), − / + on a standee, Back to box.
- **Arrange for me:** each list on the furniture that suits its name (then its area's): books / films / music →
  Bookshelf, photos / art → Gallery, achievements → Display wall, treasures → Museum stands, memories / growth →
  Memory timeline, personal → Desk, hobbies → Theme area, countries / places → Grid wall, otherwise Shelf.
- Next (phase 2): abstract content — knowledge tree, memory hall, thought star map, concept network.

## Visit & Clone — serverless prototype (53.4, `build/5333/myworld/90-sharing.js`)

- **Share** (top bar of your own island): Private / View only / View & Clone, saved with the layout (`dsp:<bid>.share`).
  Not private → a link `…/iphone#isle=<code>`: the snapshot `{o owner, t world, perm, sc, r, pc:[{k,x,y,f,s,l,i}], it:[{t,l,p}]}`
  deflate-raw + base64url. Only things on display go in (name, list name, https picture); notes, drawings (data: URLs)
  and everything still in the box stay out. Copy / native Share.
- **Visit**: opening the link shows the island read-only over any page, no account — turn, zoom, pan, tap for names;
  nothing can be moved; the address is tidied when you close it.
- **Clone** (View & Clone only): pick one of your worlds → its furniture, places, scene and view come over empty
  (Undo restores the old layout); then your lists fill them — a list whose name matches the piece's name, else one that
  suits the piece, else the next unused list. Other people's things never come along.
- **Limits until there is a server:** a link is a copy, so a link already sent keeps working after you switch to
  Private, and permissions are not enforced beyond the UI; no short access codes. Next: store snapshots server-side
  (short code + revocable permission), then the module split (Island / Scene / Display / Renderer / Drag & Drop /
  Layout Storage / Sharing).

### Island service (server-backed codes)

- `api/islands/[code].mjs` on the private Vercel Blob store **minest-islands** (`BLOB_READ_WRITE_TOKEN`, all environments).
  `POST /api/islands/new` {snap, perm} → {code}; `PUT /api/islands/<code>` (owner only) {perm, snap?};
  `GET /api/islands/<code>` → {perm, snap, mine} or 403 private / 404. Records `islands/<code>.json = {code, owner, perm, snap, at}`;
  Private stores no snapshot, so the code and links stop at once. Codes: 6 of `23456789ABCDEFGHJKMNPQRSTUVWXYZ`, shown `ISL 7K2-Q9M`.
- Owner: the app token or a Google account on MINEST_AI_EMAILS = the site owner (same on every device); other Google
  sign-ins = their uid (hashed). 30 writes / min / IP, 96 KB per island, snapshots validated (https pictures only).
- Client: Share publishes and shows the code + short link `…#isle=@CODE`; layout changes re-publish after 4 s;
  signed out / offline → the long self-contained link as before. Visit with a code: Share panel, or Settings → Islands.
  `localStorage['minest.islands.api'] = 'http://localhost:<port>'` points a local build at a local test server.

## Public page — @name (myworld/95-people.js, api/people/[handle].mjs)

- Settings → Islands → My public page: pick a name (3–20, first come), switch the page on / off. The page shows your
  name, your character and every island you share (View / View & Clone); private ones never show. It updates itself
  whenever you publish or change an island. Off keeps the name but shows nothing. One name per owner.
- `…/iphone#@peck` (or typing `@peck` where you enter a code): a sky of floating Minecraft islands with their names
  and a few things on each; tap one to visit it; closing the visit goes back to the page. Visits from a code show
  "@peck’s islands" to reach the page.
- Blob records: `people/<name>.json = {handle, owner, public, name, avatar, islands:[{code,title,perm,n,pics,scene}]}`,
  `owners/<owner>.json = {handle}`; owner ids shared with islands (`api/_minest/owner.mjs`).

## The inner world — thoughts, memories, knowledge (display kinds, Furniture tab → "Thoughts, memories & knowledge")

- **Knowledge tree** (notes, learning): a big oak; each note hangs around the crown as glowing fruit, sub-notes
  (outline parents) next to their note. **Memory hall** (memories, moments): quartz hall, red runner, frames in date
  order with years, arched beam with hanging lanterns. **Thought constellation** (thoughts, ideas, beliefs, values):
  pixel stars on a golden-angle spiral over a blackstone stage, joined by dashed starlight. **Concept network**
  (concepts, frameworks): a beacon at the heart, concepts around it, each joined to its parent concept or to the
  heart; names up close. **Growth stairs** (goals, habits, skills): each step higher, oldest first, with years.
- "Arrange for me" picks them from list names (memories → hall, goals → stairs, thoughts → constellation,
  concepts → network, notes / learning → tree).

## Decorate — make each island your own (drawer → Decorate tab)

- Ground: Grass · Snow · Sand · Moss (saved with the layout, shared with visitors and clones).
- 18 decorations in blocks: oak, birch, cherry and spruce trees, bush, flower bed, big mushroom, boulder, pond,
  fountain, lamp post, bench, fence, path, cottage, well, pumpkins & hay, campfire. Drag on, turn, + / − size, remove.

## Bigger islands — land in 3 × 3 plots (myworld/35-land.js)

- An island is a set of 3 × 3-block plots (`land: ["i,j", …]`, first island = 3 × 3 plots = 9 × 9 blocks, up to 64 plots).
  Decorate → Land → "＋ Expand the island": dashed + squares on every empty plot next to the land (tap to add),
  − on empty edge plots (tap to take away). Any shape; pieces only stand on land.
- The view turns about the middle of the land; the camera fits the land; Room / Museum walls follow its far edges.
  Saved with the layout, shared with visitors (`ld`) and carried by a clone.

## The home is the public page (myworld/95-people.js)

- The home sky (name, centre castle, world islands on their rings) is each person's main screen and their page.
  A Share button on the home (next to ⋯) opens "Share Peck's World": the page name, on / off, its link, and every
  world with Private / View / View & Clone. Sharing a world from here publishes its island (setting one out first if
  it has none) — no need to open it.
- Visitors (`#@peck`) see the same sky: the same 3D island pictures (Studio assets, same rings), the owner's name on
  the centre, only the shared worlds — tap one to visit; closing returns to the page. Block islands if the 3D art
  cannot load. The page record now carries `center` and per island `skin`, `slot`, `lists`.

## Open a display — flat and big, with each thing's details (myworld/85-piece-view.js)

- "⤢ Open" on a selected piece, a double tap on it, or (for visitors) a single tap opens the piece flat and big, in
  its own blocks: the memory hall as a long hall to scroll along (beam, quartz pillars, lanterns, frames in date
  order with years, stone base, red runner); the timeline as posts over a gravel path; display walls / themed areas
  as a wall of item frames; the gallery with big paintings and a bench; shelves, bookshelves and grid displays as
  readable shelves; the desk; the museum as glass cases on pedestals; growth stairs rising; the knowledge tree as a
  crown with each note and its sub-notes; the constellation and the concept network as skies with their lines.
- Tap a thing (or "Details" on a selected thing): picture, list, date, note (owners only), its outline parent and
  sub-notes, ‹ › (arrow keys) through the piece, Edit (quick edit) and "Show in its list". Esc closes.
- Snapshots now carry each thing's year, so visitors see the years too (notes still stay private).

## A new island starts as the world looks on the home (myworld/10-display-catalog.js WORLD_LOOK)

- Each home island (Studio asset `world_01…24`, recorded from the home as `uv:artmap`, else guessed from the world's
  name) maps to a landmark built in blocks — pyramid, domed hall, red barn, cottage, bell-tower school, temple,
  ancient ruins, observatory, dream castle, lighthouse, log cabin, studio, pagoda, stage, library, market stall —
  set in the middle of a new island, with its trees / things around and its ground (sand for history and oceans,
  moss for inner and technology, snow for cosmos). Travel World (leisure & play) → the pyramid in the centre.
- The 16 landmarks are also in Decorate → Landmarks, for islands that already exist.

## Displays for every theme, and more decorations

- 18 themed displays (Furniture → "For every theme"; "For this world" shows the ones that suit the world first):
  Kitchen counter (fridge, furnace stove) · Dining table (things on plates, chairs) · Market crates · Easels · Cinema
  (a screen showing the first, posters under it, red seats) · Record wall (+ jukebox) · World map (things pinned on a
  map) · Signpost (a place on each arrow) · Garden beds · Aquarium (things float in a tank) · Winners' podium
  (gold / silver / copper) · Clothes rack · Arcade (things on the screens) · Cork board (pinned cards, red string) ·
  Planet orbit (a sun, two rings) · Dream balloons (things in the baskets) · Lab bench (glass domes, flasks) ·
  Stone tablets (things carved, in grey). Each has its own flat view when opened.
- "Arrange for me": the list's name decides first (films → cinema, albums → record wall, recipes → kitchen, fruit →
  crates, countries → world map, plants → garden, fish → aquarium, sports → podium, clothes → rack, games → arcade,
  friends → cork board, planets → orbit, wishes → balloons, experiments → lab bench, quotes → stone tablets,
  paintings → easels…); a name it cannot read falls back to the world's theme (THEME_FOR by the home island), and
  pieces keep a block of air between them when there is room.
- 14 more decorations: palm tree, bamboo, cactus, amethyst, tent, windmill, beehive, scarecrow, snowman, torii gate,
  boat, beach umbrella, rocket, portal (32 in all, plus 16 landmarks).

## The home: add from the centre island, blank islands (build/5333/blankisle.js, island.js)

- The long "Add to Peck's World" bar is now a block "+" in the bottom-right corner (on every My World page).
- The centre island keeps its ring of quick actions (Overview · New world · Add · Generate); **New world** there makes
  a blank island at once. Add (or the "+") opens the Add sheet; at home it has, besides Capture and New list:
  **Assistant** (the guided New world: step by step / generated / empty), **New blank island**, and **Overview**.
- New blank island: an empty world ("New Island", "New Island 2"…) appears on the sky at once, greyed, with a
  dashed sign and "✦ Tap to set up". Tapping it opens "Set up this island": its name, its theme (19 themes, each a
  home island look — Travel → pyramid, Music → stage…, previewed), and Start: Empty (keeps the island, names it,
  sets its look, goes in) or From a template (templates that fit the theme first, or all 50; the template's world
  takes the blank island's place on the sky and its look; the empty blank island is removed).
- Flags: `uv:blank:<board id>` (KN). Looks: `uv:skin:w:<board id>` = the Studio asset of the chosen theme.

## A Kanban board becomes an island (build/5333/blankisle.js)

- Any board can join the islands as it is — nothing is copied: its lists are the island's areas, its cards the
  lists, the cards stacked in them the things; edits in the Kanban and on the island are the same edits.
- From the Kanban: Board settings opens with a "🏝 My World island" card on top — "Make it an island", or for a board
  that is one: "Open its island" and (if it was made from this board) "Take it off the sky". From My World:
  + → "From a board" lists the boards that are not islands.
- Both open "An island from your board": its name (renaming renames the board), its theme (guessed from the name,
  sets its look on the sky). "Add to my islands" registers it (`lom:world:<board id>` = { created, templates: {}, from: 'board' })
  and shows it on the sky. To take it off the sky: Hide (the island's own menu) — the board stays a board.

## Main islands and their islands (hubs.js, island.js layout)

- Only castle-like islands are main islands: the one in the middle of the home, plus any made with + → **New main
  island**. Every world is an island beside one of them — beside the middle one unless docked elsewhere
  (`uv:parent:<board id>` = a hub id). A world's ring has **Dock into…** (pick a main island).
- **Gather in / Spread out** — one tap (the block button above "+", or the middle island's ring): gathered, every
  island sits close round its main island on a small even ring, small (about 38% of a world island) and without its sign (no bridges), lower ones in front of it; the main island grows, and the
  other main islands move to the outer edge with their groups; spread, the worlds of the middle one go back to the
  big ring (`uv:tight`). Main island titles are set into the island: just the words (white, dark outline), no sign, always shown.
- **Customize** a main island (the middle one's ring → Customize; tap any other main island): its title (shown on a
  yellow sign), style (8 centre islands + 24 world islands = 32), colour (Natural, Warm, Sunset, Rose, Violet, Ocean,
  Mint, Night, Gold, Snow — a tint on its picture) and elements (up to six block decorations round its edge: trees,
  windmill, lighthouse, rocket, torii, balloons…). Other main islands also have "＋ Island beside it" and Remove
  (their islands go back to the middle one).
- Data: `uv:main:center` = { title, hue, deco } (its style stays `uv:center`), `uv:hubs` = [{ id, title, skin, hue, deco }].
- **Double-tap a main island** (the middle one or any other) → its group up close: the main island big in the middle
  with its title set into it, its islands round it bigger and with their names; tap one to go in (a blank one opens
  its set-up); Customize and "＋ Island beside" on top; ‹ or Esc goes back to the sky. One tap stays as it was (the
  middle one's ring, another main island's sheet) — a tap waits 0.3 s to tell the two apart.
- **Rename in place**: tap an island's title — a world's sign on the sky, a main island's title set into it, or
  either one up close — and it becomes a text box right there (Enter or tapping away saves, Esc cancels; an empty
  main-island title goes back to the default). Tapping the island's picture still goes in / opens its ring.
  Hidden signs (gathered satellites) are not editable; the tap goes to the island.
- **Names for a main island**: under its title (the inline box and the Customize sheet) a few literary, mythical,
  dreamlike names to pick — City of God, Castle in the Sky, Laputa, Avalon, Shangri-La, Xanadu, The Library of Babel,
  Invisible Cities, Peach Blossom Land, Penglai, Cloud Cuckoo Land… (48 in all; ↻ shows others). One tap uses it.
- **The title's own look** (Customize → Title): font (Rounded, Storybook, Fairy tale, Handwritten, Chalk, Medieval,
  Classic, Pixel — system fonts with fallbacks), size (S M L XL), colour (white, gold, sky, rose, mint, lavender,
  ember, ink) and style (Outline, Glow, Shadow, Engraved, Rainbow, Ribbon). Shown live on the sheet's preview, on the
  sky and up close. Data: `tt` = { font, size, color, fx } in the main island's record.
- **On the horizon** (island.js `horizon()`): gathered islands sit round their main island on a flat ellipse round its
  base (not round the old hexagon, which is gone) — the back ones behind it and a little smaller, the front ones in
  front, low enough to leave its title clear. Up close the same, taller and roomier for the names.

### Titles stuck on the islands (group view)
- Up close (double-tap a main island), every name sits on its island as text. Drag a name to move it; the white corner square (or the mouse wheel) sizes it. A plain tap still renames it in place.
- Saved as a share of the island's box: main islands in `tt.x / tt.y / tt.sc` (the home sky uses them too), worlds in `uv:tpos:<bid>` = {x, y, sc}.
- Gather in / Spread out lives on the middle island's ring; the gather button above the + is gone. Every main island stays on the home sky either way.
- Minecraft title styles (Customize → Title → Style): **⛏ Oak sign** (oak planks on a log post) and **⛏ Stone plaque** (stone bricks on a stone ledge), drawn with the island's own block textures (`MinestDisplay.tex`). The sign stands on the island like an element; drag it up close.
- On the home sky the whole island floats as one (`mn-isle-bob` on `.uv-isle`, using `translate`), so the picture, the title and the elements never drift apart; up close the main island floats the same way.

### Smart arrange (island displays)
- **✦ Arrange for me** now opens *Sort & set out*: every thing not on a piece you placed yourself is sorted into one of 29 groups (Books, Films, Music, Food, Places, People, Memories, Knowledge, Ideas…) from its own name first (×4), then its list (×2) and area (×1), with the world's theme breaking ties. A thing sorted only by its list's name joins where the rest of its list went.
- The sheet: rename a group, pick its display, switch it off, tap a thing to move it to another group; *By list* keeps the old one-list-per-piece way.
- *Set out*: groups go onto the island in a related order, pieces of one group side by side; the island grows when full. Smart arrange's own pieces (`auto`) are made again next time; a piece you drag becomes yours and stays.
- Learning: `dsp:<bid>.cat[ref]` (your moves, and things you drop on a sorted piece), `gname`, `gkind`, `goff`, `sortMode`. An AI sorter will write `cat` the same way.

### Make things on the island
- Box drawer: **＋** tab = new list (pick its area), then straight on to its first thing; **＋ New thing** in a list tab — the new thing is held, tap the island to set it down.
- A piece opened big: **＋ Add** → a new thing straight onto this piece (in a list you pick) or things from the Box not out yet; a full piece grows a size. A thing's sheet: Edit · Take off · Show in its list.

### Buildings → rooms → displays
- A fresh island says *Start with a building*. The Box drawer's first tab is **Buildings**: Studio's 50 3D buildings first (drawn on the island from their cached 3D picture, on a stone plinth; + / − size them), then the 16 block buildings.
- Tap a building → **🚪 Rooms** (or double-tap it): its rooms sheet — suggested rooms for that building (a house: Living room, Kitchen, Study, Bedroom, Garage, Stairs & photo wall; a gym: Trophy room, Main hall, Storeroom…) and 21 kinds in all. Rename the building there.
- Tap a room to go in: a room scene with its own floor and walls, furnished for what it is (Stairs & photo wall: growth stairs, a display wall, a gallery). Everything works inside (Box, furniture, Smart arrange — in a room only the groups that suit it start switched on, things in other rooms stay put). ‹ goes back to the island.
- Saved inside the island's layout: piece.rooms = [{ id, k, n, d: { scene: 'room', pc, land, floor, wall } }].
- Land: Decorate → **＋ Ring** (every plot round the edge) and **×2 Double**; an island can have up to 100 plots.
- **Levels, by double-tap** (2026-10-16): island → double-tap a building → the building: every room drawn small, as it is (furniture and things), plus *Add a room* → double-tap a room → the room, its whole display → double-tap a display → opened flat and big. ‹ goes one level out each time (room → its building → the island). One tap on a room selects it (rename, Go in ›, Remove). The rooms sheet is gone; 🚪 Rooms on a selected building opens the same building level.

### 53.41 · island view by double-tap, floor plans (folded into the build 2026-10-16)
- Source: `build/5333/fp5341.js` + `fp5341.css` (first written straight into iPhone53.41.html; `make.py` now injects them and writes both iPhone53.4.html and iPhone53.41.html, identical but for the title).
- Double-tap a world island (home sky or group up close) → its island view, look only (no Box, no tools) with **✎ Edit**. One tap still opens the world's page; blank islands still set up on a tap.
- Double-tap a building → its rooms as **▦ Floor plan** (outer walls, windows, doors, the front entrance, furniture marked), **◩ Cutaway** (each room drawn open in its place) or **▤ Cards** (remembered per device, `minest.fp.mode`). Tap a room to pick it (yellow frame, Go in › / Remove), double-tap to go in, ‹ back to the plan.
- A building opened for the first time gets the rooms a building like it has (a house: living room, kitchen, study, bedroom, garage, stairs & photo wall), so its plan shows at once (`roomsInit`).
- Switching Island / Room / Museum frames the scene again.
- Look-only island view hides the Island / Room / Museum switch too (nothing changes until ✎ Edit).
- Every step in the island's blocks: the floor plan sits on grass, walls are stone bricks, windows glass blocks, doors spruce, the front door opens onto a path, each room's floor is its own block (oak, quartz, andesite…) with a light tint, names on little oak signs, N on a sign; the Floor plan / Cutaway / Cards switch and ✎ Edit are the island's block buttons.
- **🎒 Box** (the ••• inventory) opens right on the island (top bar, while editing) and on a display opened big (beside ＋ Add) — for the display's own list, or the list you are on; close it and the island / display shows what changed.
- Double-tap is reliable now: a double-tap on a world's **name** also opens its island (one tap on the name still renames it, a moment later); taps up to 400 ms apart count, and the browser's own double-click is a fallback.
- A **blank island**: one tap still opens its setup (theme, template); a double-tap makes it as it is and goes in.
- **Never an empty level** (`myworld/89-guide.js`): an island or room with nothing set out shows a block card — a new island suggests lists for its theme (Recipes, Places to eat, Groceries…) and buildings; lists that are still empty are offered to add a first thing to; things waiting in the Box get ✦ Arrange / 🏠 Buildings / 🎒 Box; an empty room says what it holds, offers your lists that fit it (or new ones), ✦ Set out the N that fit, ＋ New thing. An empty display opened big offers ＋ Add things / 🎒 Box. In the look-only view each of these switches editing on. ✕ hides it for this visit.

### Main islands can be gone up onto (2026-10-16)
- Up close (double-tap a main island on the home), double-tap the main island (or its name) → its own island view, like a world's: buildings, rooms, displays. Its layout is `dsp:hub:<id>` (`hub:center` for the middle one); a new one starts with a Dream castle, cherry, fountain, lamp.
- Its Box is every list of the worlds in its group, read in place (`board('hub:<id>')` is a virtual board, areas named "World · Area"); edits, new lists / things and the Box write to the world they belong to (`realBid`).
- A main island's picture answers taps only on its body (`.mn-g-hit` up close, `.mn-c-hit` on the sky), so the islands behind it (e.g. My Travel World above the castle) can be tapped and double-tapped.

### Arrange for me, island level = buildings & rooms (77-smart-build.js)
- On an island the sheet starts in **🏠 Buildings & rooms** (also ✦ On the island, By list; in a room ✦ Smart groups / By list). Each group gets a room (books/notes/quotes/ideas → Study, films/things → Living room, music → Music room, games → Game room, food/groceries → Kitchen, places to eat → Dining room, photos/people/goals → Stairs & photo wall, memories → Memory hall, art/treasures → Gallery hall, wins/sports → Trophy room, plants/animals → Garden room, places/plans → Travel room, projects → Workshop, space → Dream room, dreams/clothes/keepsakes → Bedroom, other → Storeroom) — change it per group in the sheet (`d.groom`).
- Rooms go into buildings: the island's own house-like building (house, cottage, castle…) or a block house; Studio's 3D buildings for the rest (Design Exhibition Pavilion, Fitness Club, Vertical Farm, Bus Terminal, Robotics Research Center). Missing buildings are put down (the island grows), missing rooms added, each group set out inside. Run again: its own pieces are made again, nothing doubles.
- **Rooms by hand** (building level, a room picked): rename · Room (change what it is — its plain name, floor and walls follow) · Floor · Walls · Place ◀ ▶ (order in the plan; `roomOrder` keeps your order instead of the house zones) · Size − / ＋ (`r.sz`, the plan gives it more or less space) · Move to another building (with everything in it). In the floor plan or cutaway, drag a room onto another to swap them (on a phone: pick it first, then drag). ＋ Add a room adds any of the 21 kinds.
- **Floors** (up to 3): a building has `floors` and each room `fl` (1 = ground). The floor plan has 1F / 2F / 3F, **＋ Floor** and **− Top floor** (only when it is empty); the ground floor sits on grass with the front door, upper floors on a stone slab, each labelled on an oak sign. Cutaway stacks the floors, top one on top. An empty floor shows ＋ Add a room on nF. New rooms go on the floor you are looking at (`viewFl`); a picked room has a Floor menu (moving it up to a new floor adds that floor). Cards show the floor. Smart arrange puts bedrooms and the study on 2F when a house would have more than five rooms.
- **🏠 Dollhouse** (the first view of a building's rooms, `dollSVG` in 52-buildings.js): the whole building in 3D like a home app's house model — on a lawn, each floor lifted apart (1F, 2F, 3F, each on a sign), front walls off, outer back/left walls full height, low partitions between rooms, each room's own floor and walls, and its furniture and things drawn as they are (the room's scene made small). Names on oak signs; tap a room to pick it, double-tap to go in. The rooms sit where the floor plan puts them, so moving / resizing rooms or floors shows here too.
- **🛠 Build** (the section tool): the building cut through from the front — a block roof, its floors top to bottom (stone-brick outer walls, each floor on a sign), rooms side by side in each floor (their wall block above, floor block below, name sign, furniture), a lawn under 1F. Room blocks (all 21 kinds) below: drag one into a floor to build that room at that place, or tap it to add it to the floor you are on (＋ at a floor's end picks that floor). Drag a room to move it along its floor or to another floor; drag the spruce line between two rooms to share the width between them (`sz`). Tap to pick (the room bar: name, kind, floor / walls, floor number, place, size, building), double-tap to go in. **✦ Suggest rooms** adds the rooms a building like it has (bedrooms and the study upstairs when it is big); **✦ Fill rooms with my things** runs Smart arrange for this building only — the rooms your things need are added, the displays set out in them. Order lives in `rooms` (`placeIn`), so the dollhouse, plan and cutaway follow.
- **Vehicles** (`myworld/51-vehicles.js`, Decorate tab): 28 block decorations from four builders — Sports cars (red supercar, yellow racer, blue convertible, orange GT, green track car), Classic cars (black sedan with running boards, cream roadster, woody wagon, 50s convertible with fins, red farm truck with hay), Electric cars (sedan with a glass roof, SUV, angular pickup — generic, no brand names), Planes (red prop, passenger jet, yellow biplane, seaplane on floats, blue jet), Hot-air balloons (5 colourways, tethered to a stake) and Airships (silver, white blimp, red striped, golden zeppelin, one moored to a mast). Also offered to main islands' Elements via `decoKinds`.
- **100 world landmarks** (`myworld/53-landmarks.js`, Decorate → World landmarks · Europe 30 / Asia 30 / Americas 22 / Africa & the Middle East 10 / Oceania 8): ~30 shape builders (lattice & needle towers, skyscrapers, clock towers, domes, pyramids, arches, bridges, statues, colonnades, pagodas, palace halls, castles, cathedrals, wheels, sails, stone circles, walls, mountains, terraces, stupas…) with each landmark's own parameters. Note: module-level names share one closure — `LSH` (not `S`, which is the picture helper).
- **Build the world** (`myworld/54-world.js`, 48 pieces): Water (pond, lake, river, bend, beach, creek with a stone bridge), Boats (sailboat, rowboat, ferry, yacht, cargo ship), Roads (2 × 2 tiles that join: road, corner, T, crossroads, zebra, roundabout, parking lot), Railway (track, curve, station platform, steam train, bullet train, tram), City (apartment, office, glass skyscraper, shop row, café, townhouses, hospital, school, fire / police station, gas station, supermarket, hotel, church, factory), Nature (pine / oak / birch / jungle forest, orchard, wheat field, flower meadow, hill, cliff), Street (traffic light, bus stop, playground, billboard). Ground pieces are `flat`: anything may stand on them (cars on roads, boats on lakes, trains on rails); two flat pieces never overlap (`fits`).
- **🔍 3D models** (`myworld/56-models.js` + `api/models/[op].mjs`, Decorate tab top): search Poly Pizza's free low-poly library (CC0 / CC-BY) — a box, word chips (tree, house, car, castle…), popular models when empty. Tap a result to hold it, tap the island (or drag). The GLB comes through `/api/models/file` (Poly Pizza hosts only), is drawn once as an isometric picture by `MinestAssets3D.glbThumb` (GLTFLoader, cached in IndexedDB) and stands on the island like a Studio building; + / − size it. The piece keeps `m = { id, title, creator, licence, glb, thumb }`; picking it shows "3D model · by … · licence". Needs `POLY_PIZZA_KEY` (free account → poly.pizza/settings/api) in Vercel; without it the panel says search is not switched on yet. Rate limit 40 searches / 120 files per minute per caller.
- `api/islands` now accepts piece kinds up to 64 characters (Studio buildings, models and world pieces have long ones).
- 3D models work without a key now: when `/api/models` (Poly Pizza) is not deployed or has no key, search goes to **Poly Haven** straight from the browser (`api.polyhaven.com`, ~520 CC0 models with textures; glTF 1k with its files mapped through the loader). The credit line names the library in use; picking a model shows its maker and CC0.
- Every decoration sizes and turns: + / − now go from 0.4× to 3× (the fixed-size vehicles, landmarks and world pieces are scaled as a whole by `sized()` in 51-vehicles.js); ⟳ Turn turns them, and 3D pictures (library models, Studio buildings) are drawn again from the side the piece faces (`thumb(id, variant, rot)`, `glbThumb(key, url, rot, files)`, cached per side). Drag still moves anything.
- **Furnishing a room with 3D models**: inside a room, Decorate opens with 🛋 *Furnish the <room> — 3D models*: category chips in the order that suits the room (living room: Seating, Tables, Lighting, Electronics, Plants & vases, Wall decor; kitchen: Appliances, Dishes & food, Tables, Shelves; bedroom: Beds, Lighting, Shelves…; then the rest), and search kept to indoor categories (Poly Haven furniture, seating, table, shelves, lighting, electronics, appliances, dishes, food, potted plants, vases, wall decoration, decorative, instrument, books, office). A model set down in a room starts room-sized (×0.5).
- **Placing**: a picked decoration / model also has ⬆ / ⬇ (raise in ¼ steps up to 3.5 — a raised piece sits on others: a lamp on a table, a picture on a wall), ⧉ (another one beside it) and, in a room, ⇱ Wall (against the nearer of the back / left wall). `p.z` lifts every part (`build()`); `fits()` lets raised pieces overlap.
- Fix: a pointer whose pointerup got lost no longer turns every later tap into a pinch (a primary press clears them).
- **People & pets that wander** (myworld/59-mobs.js): Decorate opens with *People & pets* — Explorer, Gardener, Villager, Chef, Kid, Dog, Cat, Sheep, Cow, Chicken, Fox, all block-built. Put one down and it walks about where it was put (1–4 blocks out), round buildings and other standing pieces, pauses, walks on, legs and arms swinging and turning the way it goes. Dragging it moves its home; picking it makes it stand still. Only the drawing moves (a layer after the scene, a transform per mob) — nothing about the walk is saved, so layouts stay as placed. They work in rooms too; reduced motion keeps them still. They draw over the scene, so one walking behind a house shows in front of it.
- **Sets** (myworld/62-kits.js): 🛠 Build → 🎁 Sets, or the green 🎁 Sets button at the top of Decorate. Four shelves, 35 sets: 🏡 Homes (pool villa, home with a tree house, farmhouse, beach house on stilts, mountain chalet, Victorian, Japanese, Mediterranean villa, modern house with garage and EV, lakeside cabin), ⛰ Land (mountains, rolling hills, wetland, forest, beach, desert, snowfield), 🛣 Roads & rails (ring road, crossroads, main street, railway loop with station, railway line, tram line, harbour, flower garden), 🏫 Community (school, corner store, gas station, library, church, hospital, fire & police, post office & bank, town hall square, park). A set goes down whole in the first place it all fits (its ground pieces — pool, garden, marsh — only on empty ground); if nothing fits the island grows on the right. Pieces carry `kit` (the head also `kitHead`): dragging the head moves the whole set (all or nothing: if any piece would not fit, the set goes back and says so); dragging another piece takes it out of the set; 🎁 Remove set (selection bar) takes the set away, with Undo. New pieces: 9 block houses (`h_*`, buildings with rooms), 15 yard things (`y_*`), 10 terrain pieces (`g_*`), 4 community buildings (`k_*`), 10 flowers (`fl_*`). Dev checks: `MinestDisplay.kitTest()` places every set on an empty island and names any clash.
- **Things that go** (myworld/63-movers.js): cars drive the roads (right-hand lane, straight on at crossings more often than not, round corners, back at dead ends; off a road they run to and fro), trains run the rails (station track included; back at the end of a line), boats and ducks sail inside the water they sit on, planes circle overhead, balloons drift in a slow loop, airships go to and fro, birds/robins/gulls wheel round and butterflies flit. Only the drawing moves (ground movers under people, flyers over them). Tap one and it waits at home; ⏸ Stop parks it (`p.still`), ▶ Go starts it again. In the air the planes lose their wheels and balloons/airships their tether (`p.free` → `c.free`). Birds and butterflies are `air` pieces: they may go over anything. Dev: `MinestDisplay.movers()`.
- **💡 the bulb** (build/5333/bulb.js + bulb.css, island part myworld/88-bulb.js): the header bulb and a 💡 in the island's top bar open one panel with two tabs. 🧭 Guide: where you are (sky of worlds, world, area, list, island, building, room), what it is for, the steps with the done ones ticked and the next one marked, ✦ "build it for me" buttons (make a world, build its island, grow from a template, Arrange, a set, a town, suggest / fill rooms, furnish a room) and ✋ "build it myself" buttons (step by step, add an area / list / thing, Buildings, Build menu, Decorate, Box, section tool, floor plan, dollhouse, Furniture, 3D models). 💡 Inspiration: the day's prompt and 📚 Open the Inspiration Library. The last tab used opens next time (minest.bulb.tab). `MinestDisplay.guide()` / `guideDo(id)`.
- **The island view (HUD)** (myworld/86-hud.js + build/5333/hud.css): landed on an island you see only the island — ✕/⬅ and the place's name top left, 💡 and ≡ top right, a hotbar at the bottom (🛠 Build, 🎒 Box, ✦ Arrange, 🎁 Sets). ≡ shows the full top bar for a moment (with "Classic layout" to go back to the old layout; "🏝 Island view" returns; minest.hud). Touching the island folds menus away. 🛠 Build / 🎒 Box slide up a half sheet: one category at a time as chips (search 🔍 across all), pieces in two rows that scroll sideways. Tap a piece → the sheet steps aside and a banner says "Tap the island to put … there"; each tap puts one more (a list's things come one after another); ✓ Done ends it. A picked piece shows a name tag and big buttons like a village builder: Move (drag, or Move then tap the spot — a set's main piece brings its set), Turn, Bigger, Smaller, Rooms / Open, Stop / Go, Copy, Remove, ⋯ More (Raise, Lower, To wall, Closer, Change, Fill, Remove set). A building's sheet sits between the HUD corners and the hotbar; Sets hides inside buildings.
- **53.6 · village-builder island + 🚶 Walk in** (isolated build/5360 → iPhone53.6.html; Studio runtime copy assets3d-536.ts → dist/assets3d-536.js also exposes `three`, `GLTFLoader`, `object(id)`).
  - **HUD** (86-hud.js, hud.css): profile badge (level = buildings + things/5) and title top-left; resource bars top-right (things out / all, buildings, rooms, decorations); a tool column on the left (💡, 👁/✋, 🎁, ✦, 🎒, ≡); big 🚶 Walk in bottom-left and 🔨 Build bottom-right; ↶ ↷ ½ above Build; the camera row bottom centre.
  - **Build picker** (92-picker.js): a full-screen picker, not a shop — no prices.
    - Icon tabs: Buildings (Studio / houses / community / block), Decorations, Land & water, Landmarks, Vehicles, People & animals, Furniture, 3D models, Sets.
    - Each tab has group chips and a "Find anything" search; big cards with picture, name and how many are out scroll sideways. Studio pictures fill in as they render.
    - Tap a card → tap-to-place with the preview.
  - **Landscape**: on landing on an island the app turns sideways and turns back on leaving.
    - The page sends `MinestNative.send('setOrientation', {orientation: 'landscape' | 'auto'})`.
    - Native side: `MinestOrientation` in MinestApp.swift (app-delegate mask + `requestGeometryUpdate`) and a `setOrientation` case in MinestBridge.swift.
    - Browsers cannot be turned; there the layout simply fits landscape when the window is wide.
  - **🚶 Walk in** (93-walk.js): the scene rebuilt in Three.js.
    - Blocks become textured cubes merged per texture, so there are few draw calls. Studio buildings come in as real 3D objects and glb models load into their place. Picture panels and sign panels stand in the world, and things stand as billboards. Birds and butterflies fly above.
    - Controls: joystick, drag to look, ⬆ jump / up, ⬇ down, ✈ fly, ⏩ run; WASD, Space, Shift and Esc on a computer.
    - You collide with blocks and models (step-up 0.6). You start on a clear patch near the front, facing the middle.
    - The crosshair shows the name of what you look at; a tap opens its card. Nothing is saved; ✕ goes back to the island.
