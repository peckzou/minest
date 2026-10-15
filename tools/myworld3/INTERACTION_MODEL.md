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
