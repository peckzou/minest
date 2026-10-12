# Golden Framework Library — architecture (V1.0, first deliverable)

My Lists — What I Have · My Frameworks — How I Understand · My World — How Everything Connects.

## Audit: what is reused (nothing rebuilt)

| Need | Reused from |
|---|---|
| World templates (Simple / Standard / Complete) | `world.js` — `plan` / `generate` / `ghosts` / `grow`, format `minest.world/1` |
| Template preview → create | `myworld.js` preview (now `MinestMyWorld.template(id)`) |
| Philosophy | the 5 `philosophy-*` templates and their 5 Discover tools (`philo.js`), linked by `relatedTemplates` / `discoveryTool` |
| Knowledge templates | `britannica`, `encyclopedie`, `dewey`, `bacon` |
| Cards / items | the boards — frameworks only **link** (`fx:link:`), never copy |
| "Add to My Knowledge" | the My World Inbox (`MinestCapture.organize`, `to: []`) |
| Synced user data | `MinestKnowledge` side tables (cloud-merged like every other `x` key) |
| Navigation | edge swipe-back (`edgeback.js` layer `.fw`) |

## Three layers

1. **Original Framework** — `frameworks/<collection>.json` (`minest.framework-collection/1`, each item `minest.framework/1`,
   schema in `schema/minest.framework.schema.json`). Bundled read-only as `window.__MINEST_FRAMEWORKS`. Stable ids, version, source.
2. **My Interpretation** — `MinestKnowledge` keys:
   - `fx:saved:<fw>` `{at}` — My Saved Frameworks (saving never creates a world)
   - `fx:my:<fw>` `{notes, examples, questions, adaptations, at}`
   - `fx:recent` `[fw…]`
   - `fx:link:<fw>:<concept>` `[{bid, id, title, list, at}]` — links to existing cards / stacked cards
   - `fx:ses:<id>` `{id, fw, title, steps | ratings, notes, history, at, updatedAt}` — OODA / Design Thinking / GTD sessions, well-being check-ins
3. **Apply to My World** — linking from any concept (picker + "Maybe from your lists" suggestions); the Apply tab lists every link.
   Bulk suggested mapping with preview / undo is Phase 8.

## Structure engine (eight types, `frameworks.js`)

hierarchy (fold, search, link) · network (focus + neighbours, index) · matrix (grid; periodic table layout) · nested (rings) ·
cycle (wheel + sessions) · timeline · levels (bottom-up) · dimensions (tiles + optional private check-ins with comparison).

## Library (37)

- Philosophy 13 · Knowledge 4 · Nature 4 · Psychology 4 · Society 4 · Systems 4 · Life 4.
- Reference (interactive): Britannica Propædia, Syntopicon, Periodic Table, Bronfenbrenner, OODA Loop, OECD Well-being.

New world templates (`templates/society-*.json`, family `society`, gallery group “Life & Society”):

- `society-culture-leisure` (UNESCO FCS)
- `society-industries` (NAICS)
- `society-activities` (WHO ICF A&P)
- `society-wellbeing` (OECD)

## Content rules

- Summaries are Minest's own.
- Only standard names and structures are used. No Syntopicon essays or index, no Propædia section text, and only the Dewey main classes.
- Psychology and well-being models carry their limits. Ratings are optional and private, and nothing is scored or diagnosed.
