# Studio library 6 integration

Source: `minest-—-world-island-library-6.zip` (Studio export).
Only procedural model builders, data and types are vendored in `studio-lib6/`.
The original `studio-lib4/` and its bundle are retained.

## Assets

- 12 My World scenes (`MW-MYWORLD-01`–`12`).
- 120 buildings (`BD-121`–`BD-240`): 20 residences, 10 castles, 10 cathedrals, 50 landmarks, 30 designer villas.
- 132 interiors (`diorama_dollhouse_01`–`132`).
- All 782 previous IDs and the `mn3d-v1` thumbnail cache namespace are preserved.

Build with `node tools/myworld3/bundle-lib6.mjs`. The resulting bundle is embedded in
`mn-assets3d-src` in the current iPhone, iPad, index and Duo pages. Updating a bundle
requires replacing only that script payload, preserving later page-specific changes.
`tools/live-perf/world_lib4.js` bridges both library versions into the Build picker:
five new building groups and Studio interiors, with the original indoor/outdoor rules.

Validation: all 264 additions instantiate nonempty Three.js models with finite geometry
and bounds. Picker checks cover all 240 buildings without duplicates and 132 new interiors,
inside and outside; seven embedded bundles match and introduce no JavaScript parse errors.
Browser interaction and visual rendering still require a browser smoke check.

The iOS app bundles its own pages (ios/Minest/Minest/*.html). After updating the web pages, copy the library into
them with `python3 tools/myworld3/sync_ios_pages.py` (`--check` reports pages that are behind).
