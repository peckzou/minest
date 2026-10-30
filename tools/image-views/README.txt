Minest Image Views integration

Baseline: 29630bb (latest fetched cloud-workspace-sync HTML).
Main checkout remains on its existing branch with reviewable working changes.

source/image-views.js and source/image-views.css are the feature source.
source/build.py integrates the source into a raw Minest HTML baseline using guarded anchors.
--app-entry preserves the product title and emits only the requested app entry.
Do not run it on an already-integrated entry; the anchor guards intentionally reject duplicate integration.

The original .sf-mode-toggle-btn and its existing Dock proxy now open the four-view menu.
There is no additional floating view button. Student-mode game navigation is retained.
Photos supports grid density, pinch and Ctrl/Cmd-wheel zoom, List/Stack albums and local custom albums.
Cards and the existing Cover Flow engine are shared. Custom album references and photo size remain device-local.

Tests need Node, Playwright and Chrome. Start a static server serving the repository at 127.0.0.1:8765.
node tools/image-views/tests/state.cjs
MINEST_ENTRY_URL=http://127.0.0.1:8765/iphone.html MINEST_DUO_URL=http://127.0.0.1:8765/iPhoneDuo.html node tools/image-views/tests/browser.cjs
MINEST_ENTRY_URL=http://127.0.0.1:8765/iphone.html node tools/image-views/tests/photos-upgrade.cjs

No server API, production deployment, native Swift changes or signing is part of this integration.

After building raw app entries, run source/bundle-anchor-charts.py to include the canonical 143-image board. Existing user cards are retained.
