# Thought Compass Lab: Knowledge World v0.1

This is a standalone lab page for testing one closed loop:

> natural-language input → cognitive placement → framework match → micro-interaction → user feedback → knowledge record

It is not linked from the app: no Dock entry and no `iphone.html` injection. It does not change any API, and it is not deployed. It lives on branch `lab/knowledge-world`.

To run it, start a static server at the repo root and open `/tools/compass/lab.html`. The preview config for this is `knowledge-world-lab` on port 4371.

To test it, run `node tests/compass/compass.test.cjs`, which prints `compass: ok`. The suite covers:

- a 30-input classifier set;
- protocol integrity checks;
- a headless run of the state machine;
- correction memory.

## Two engines, one protocol

| | Track A: `compass.js` (`MinestCompass`) | Track B: `micro.js` (`MinestMicro`) |
|---|---|---|
| Input | text | `interaction_id` and an optional context `{ query_id, text }` |
| Output | ids only: taxonomy node, framework ids, interaction ids, plus reasons | a result in the definition's `result_schema` |
| Knows about the other | no | no |

- **Taxonomy:** `taxonomy.json` (`minest.taxonomy/1`) has 37 nodes. The top level is the library's 7 collections. Nodes carry matching cues in Chinese and English, plus `see_also` links. Some nodes also have Wikidata and LCC cross-references.
- **Frameworks:**
  - The Golden Framework Library (`tools/knowledge/frameworks/*.json`) is read only and never edited.
  - The sidecar `frameworks-ext.json` adds the protocol fields: `taxonomy_path`, `core_principles`, `applicable_scenarios`, `interaction_ids`, and `kind`, which is one of philosophical, method, model or classification.
  - `causal-inference` is a lab-only framework.
- **Micro-interactions:**
  - Each one is a `minest.micro/1` definition (schema in `schema/`): steps, initial state, user actions, transitions, feedback rules, completion criteria and result schema.
  - Scenes only draw, then call `act(action, value)`.
  - `micro/kant-causality.json` and `micro/kant-scenes.js` implement "Before ≠ Because".
- **Placement is local first:**
  - Rules: matching cues, framework names and concepts, and see-also links.
  - Past corrections: stored as `cn:fix`, and they steer similar inputs.
- **AI is an optional second opinion:**
  - It goes through the existing `/api/minest/ai-chat`, using the app's own token and endpoint keys.
  - It may only pick from the ids sent to it, and it never overrides the local result until the user fills it in and confirms.
  - Without a token on the device, it says so.

## Records

The page stores its records in this browser only, under the localStorage prefix `minest.lab.kw.`. Nothing is synced. The store has the same `get`/`set`/`keys` shape as `MinestKnowledge`.

| Key | Holds |
|---|---|
| `cn:q:<id>` | a query, its result, and the confirmed place and framework |
| `cn:fix:<id>` | a correction: cues → node and framework |
| `mi:run:<id>` | the result of an interaction run |
| `rel:lab-<id>` | a relationship the user stated, in the same shape as `philo.js` `rel:`, with `userJudgment: true` |

## Content rules for the Kant case

- The interaction is a teaching analogy. It never claims to test Kant.
- **Layers:**
  - The lamps teach layer ② (Hume, and intervention and confounding in modern causal inference).
  - The house and the ship are Kant's own example from the Second Analogy, and they teach layer ③.
- **Labels:**
  - Every framework card shows its kind. A philosophical position is labelled "not a scientific fact".
- **Pending:**
  - The page citations have to be checked against an edition before release.
