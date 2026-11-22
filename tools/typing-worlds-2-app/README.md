# 3D Type 2.0 (Typing Worlds 2.0)

The page at `/type3d-2/`. It stages the 23 worlds of 1.0 (`tools/typing-worlds-app`, served at
`/typing-worlds/`) without editing them: the world modules, text input, layout, glyphs, audio and
word list are imported from `../typing-worlds-app/src` through the `@v1` alias.

What this project adds:

- `src/engine/renderer2.ts` — the picture pipeline (MSAA target, bloom, grade) and the `view` camera.
- `src/stage/director.ts` — one per world: camera rig, keystroke effects, finale, fog into the backdrop.
- `src/stage/kit.ts`, `src/stage/sets.ts` — backdrop, motes, light shafts, pools of light, desk, skyline.
- `src/stage/specs.ts` — the staging of each world, keyed by the 1.0 world id.
- `src/ui/app2.ts`, `src/v2.css` — the HUD: world dock, theme swatches, demo tour, snapshot, word list.
- `public/thumbs/` — the dock's pictures of each world.

```
npm install
npm run dev      # http://localhost:5189
npm run build    # type-checks, then writes ../../type3d-2/ (the deployed folder; commit it)
node ../../tests/type3d-2/type3d2.test.cjs   # from the repo root
```

URL options: `?world=<id>`, `?theme=<id>`, `?demo=1` (auto tour), `?q=0|1|2` (quality), `?hud=0` (picture only).
