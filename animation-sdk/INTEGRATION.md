# Minest animation integration

Source: [peckzou/-](https://github.com/peckzou/-), commit `530162d` (2026-09-28), with Minest continuity and Rings 4.0 interaction adjustments.
The 3-in-1 unlock phase uses the staggered six-bracket 24K pending badge sequence
from the user-provided `badge-anim-optimizer.zip`; inspection and wall return stay unified.
The upstream React/Three.js SDK is kept here as editable source. Vite builds the
same-origin static app into `../badge-animations/`, which `iphone.html` embeds
inside Awards. Minest remains usable from a plain static HTTP server.

Build from this directory after editing the SDK:

```sh
pnpm install
node node_modules/vite/bin/vite.js build
```

`?embed=1&tab=rings|unified|summon|pending|reveal|inspector|badgewall|watchos4`
opens a focused animation. The Rings view accepts `focus`, `checks`, and `goal`
percentages from the current Minest session. Other views are interactive
previews. They do not grant awards, alter unlock rules, or write collection
state. The standalone SDK still opens without `embed=1`.

Native iOS bundle copies of `iphone12.8.html` are not changed by this web
integration. Bundling these assets in the native target is a separate step.
