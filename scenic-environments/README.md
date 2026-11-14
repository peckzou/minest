# Minest Scenic World — Professional Immersive Environment Production (Collection 001)

Museum-grade, photorealistic, fixed-viewpoint 3D spatial environments built for the **Minest Scenic Environment Engine**, inspired by **Apple Vision Pro Environments**.

## 1. Architecture & Directory Structure

```text
scenic-environments/
├── index.html                  # Unified WebGL2 / Three.js 7-Scene Previewer
├── manifest.json               # Collection 001 root manifest
├── README.md                   # Architecture, performance & licensing report
├── golden-oaks/                # Scene 01 — Golden Oaks (American Oak Savanna)
├── highland-railway/           # Scene 02 — Highland Railway (Glenfinnan Viaduct, Scotland)
├── lost-city/                  # Scene 03 — Lost City (Machu Picchu, Peru)
├── alpine-valley/              # Scene 04 — Alpine Valley (Lauterbrunnen, Switzerland)
├── whitehaven-paradise/        # Scene 05 — Whitehaven Paradise (Hill Inlet, Australia)
├── alpine-meadow/              # Scene 06 — The Hills Are Alive (Mehlweg Alpine Meadow)
└── little-venice/              # Scene 07 — Little Venice (La Petite Venise, Colmar, France)
```

Each scene directory follows the unified asset contract:
- `manifest.json` — Scene metadata, quality tiers (`desktop` / `mobile`), and asset paths
- `README.md` — Scene-specific technical breakdown
- `preview.webp` — Real-time WebGL rendered Hero View screenshot
- `comparison.webp` — Side-by-side comparison (Reference Photo vs Real-Time WebGL 3D Render)
- `geometry/spatial_scene.glb` — 32,000-triangle frustum-calibrated metric 3D spatial mesh (`D ∈ [7.5m, 115m]`) with overscan skirt to prevent disocclusion gaps during parallax
- `geometry/foreground_props.glb` — Scene-specific 3D foreground/animated props (including the 3D steam locomotive + 4 carriages for `highland-railway` and 3D grass tufts for meadow scenes)
- `textures/` — `albedo.png`, `normal.png`, `roughness.png`, `depth.png`, and `anim_mask.png`
- `environment/lighting.json` — Color temperature, fog, and tone-mapping parameters
- `animations/config.json` — Living Environment shader and particle layer definitions
- `audio/ambient.mp3` — Tailored stereo spatial natural soundscape (zero background music)
- `cameras/presets.json` — Calibrated Hero Viewpoint + parallax bounds (`±1.6m` lateral, `FOV 28°–50°`) + secondary vantage presets
- `licenses/sources.md` — Provenance and usage rights documentation
