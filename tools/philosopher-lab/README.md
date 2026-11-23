# Philosopher's Lab import

Source: `philosopher's-lab.zip`. Retains the supplied model IDs 1–136,
source mappings, interactive engines, categories and visual design.

Minest already serves the first 46 models. Their pages and Thinking Lab entries
remain unchanged. Models 47–136 add 90 `minest_*.html` routes; the existing host
allowlist and full-screen overlay open these routes without host changes.
The main catalogue is `philosophy/models/index.html` (all 136 models).
`lab.html` defaults to the latest 50-model collection; `?model=87` opens one model.

Only the exported application source is vendored here. No API keys, AI SDK,
server, archive environment configuration or package lifecycle scripts are used.
The production runtime contains React and the procedural Canvas engines in
`philosophy/models/lab.min.js`, with a compiled local Tailwind stylesheet.
Legacy iframe paths point at Minest's existing pages.

Integration adaptations:
- Standalone model pages select the matching model by `data-model`.
- Progress keys use `minest_philosopher_lab_progress_<id>`.
- Engine callbacks ignore quote slots absent from the supplied stage mappings;
  several source visual engines emit generic slot 2 even for two-quote stages.
- JSX compilation uses the automatic runtime, matching the export's Vite build.

Build: `node tools/philosopher-lab/build.mjs`.
Set `MINEST_BUILD_NODE_MODULES` to an installed node_modules directory containing
esbuild, react, react-dom, tailwindcss, @tailwindcss/node and @tailwindcss/oxide.
The fallback uses this machine's existing Minest build dependencies.

Validation covers 136 catalogue entries and accepted host paths, unchanged
contents of all 46 old model pages, server rendering of all 92 imported React
model views, and real Canvas drawing and pointer callbacks for all 90 additions
at desktop and mobile dimensions (442 model/stage/size runs).

The built browser bundle also passed DOM-emulation bootstrap checks for the full
136-card catalogue and 12 representative model pages, including real Canvas
rendering, pointer events and returning to the directory. This is not a browser
visual or accessibility audit.
