# Minest My World 3D — Phase 1 prototype

Run: `python3 -m http.server 8000` here, open http://localhost:8000. No build step; three.js is vendored.

Flow: type DISCOVER, Craft (skippable layer-stack animation), drag the block to a Smart Shelf slot (green ghost = valid, red = rejected), reload (layout restored from localStorage), double-click/Open for Read mode.

Extension points in main.js: CRAFT_KITS, ITEM_TEMPLATES, DISPLAY_TEMPLATES. Not done: other kits, cross-device sync (localStorage only), iPhone touch testing.

Phase 2: Letterpress kit -> Flashcard ("front | back") on a Wall Display; bulk cards, Flip, editable via Read mode.

Phase 3: Glassworks (Memory Orb, Crystal Award) -> Glass Cabinet; Stone Atelier (Rune Slab) -> Stone Pedestal. Add ?lowfx=1 for the alpha-glass fallback (auto on phones).

Phase 4: Thread Studio (Stitch Sampler -> Sewing Rack), Botanical Studio (Pressed Flower -> Herbarium Board), Ceramic Studio (Ceramic Vase -> Ceramic Shelf). Glass Tube added to Glassworks/Glass Cabinet.
Phase 5: Archive Desk (File Folder -> Cabinet of Knowledge), Retail Packaging (Product Box -> Retail Rack), Signworks (Billboard Panel -> Knowledge Drive Billboard).
Phase 6: Cube Lab (World in a Cube -> Cube Plinth): a rotating voxel terrain seeded from the text.
Displays for a kit are created automatically on first craft.

Extras: Neon Sign (Glassworks -> Neon Wall), Letterpress drop / Woodcraft chip animations, Export/Import JSON for moving a world between devices, window.__app.perf (fps) and renderer.info for profiling. Pointer events + touch-action:none cover touch (use Open button instead of double-click). Still not done: real-device iPhone test, Phase 0 audit of the real Minest repo.

Host hand-off: open voxel-factory/index.html?kit=glassworks:memory-orb&items=Line1%0ALine2 to craft and auto-place items. Uses its own localStorage key (minest3d.world.v1); does not touch the main app.
