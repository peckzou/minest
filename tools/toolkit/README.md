# Cognitive Toolkit: five-card lab (Stage 1)

Open `/tools/toolkit/index.html` from a static server at the repo root. The preview config for this is `knowledge-world-lab` on port 4371. The page lives on branch `lab/knowledge-world`. It is not linked from the app, it is not deployed, and it changes no API.

Tests: `node tests/toolkit/toolkit.test.cjs` and `node tests/compass/compass.test.cjs`.

One input becomes one KnowledgeObject. All five cards read and write that object through `store.js` (`MinestKS`):

| Card | File | What it does |
|---|---|---|
| 01 Thought Compass 思想罗盘 | `cards/compass.js` | Three draggable rings with inertia and snapping:<ul><li>outer: domains</li><li>middle: thinking angles</li><li>inner: the object's concepts</li></ul>It shows the suggested placement and why. You confirm or change it, and can add several places. A correction feeds back into the local engine as `cn:fix`. |
| 02 Framework Card 知识框架卡 | `cards/framework.js` | An outline editor:<ul><li>Enter / Tab / Backspace, drag to move, ↑↓→←, cross-references</li><li>four views: Outline, Tree, Levels, Cards</li><li>7 templates (`data/templates.json`), plus starter content (`data/seeds.json`, review pending)</li></ul>Items are shared concepts. Their position in the outline sets a typed relation. |
| 03 Thinking Models 思维模型卡 | `cards/models.js` | 6 step-by-step models (`data/models.json`). Inputs can be text, list, multi-select, choice, signed links (with loop detection), a matrix, or test cases. The result is built only from what you enter, plus rules. Runs can be saved and compared. |
| 04 Thinking Lab 思维实验室 | `cards/lab.js` | Runs micro-interactions:<ul><li>Before ≠ Because (Kant)</li><li>The Locked Room (Locke / Berlin, `labs/`)</li></ul>Notes, questions and cases from a run go back into the object. Plato, Aristotle and Hegel are listed as planned and are not built. |
| 05 Knowledge Graph 知识图谱卡 | `cards/graph.js` | A canvas you can pan, zoom (including pinch) and drag nodes on. Each link shows its source and provenance. You can connect, retype, reverse, annotate or delete links, add concepts, filter by type or by who made a link, pull in links from your other objects, and export. |

## The data

| Record | Holds |
|---|---|
| `ko:` | knowledge object |
| `cc:` | concept, one per name; Chinese and English labels and aliases merge |
| `kr:` | typed relation, with `provenance` and `source_ref` |
| `fwi:` | framework instance |
| `mr:` | model run |
| `mi:run:` | lab run |

- **Relation types:** belongs-to (shown the other way as contains), related, supports, refutes, influences, applies-to, illustrates, and leads-to, which is used only for the user's own judgment.
- **Who made it:** "by the user" is a provenance value, not a relation type. The values are user, rule, ai-suggested, ai-accepted and library.
- **Storage:** everything is saved in this browser only (localStorage `minest.lab.kw.*`) and nothing is synced. Export and import use `minest.knowledge-object/1`.

## Hooks for later hosts

A host such as a Philosophers' Island scene can open the toolkit in two ways:

- by calling `MinestToolkit.open(card, { objectId | input | conceptId, model, lab })`;
- by linking to `index.html#ko=<id>&card=lab&lab=locke-room`.

Everything works in Level 1 (manual mode). The local engine only adds suggestions.
