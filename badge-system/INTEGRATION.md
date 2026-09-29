# Minest Badge Challenge Wall

Source: the user-provided `minest-3d-badge-system.zip` (Badge Wall and its 3D badge library).
This directory keeps the imported React/Three.js source editable. Run
`npm install` once, then `npm run build`; the same-origin output is written to
`../badge-challenge/` and embedded as the **通关模式** pane in `iphone.html` Awards.

The source catalog contains 123 actual badges. The wall preserves its 150-slot
layout, but the remaining 27 slots are clearly marked as future content and
cannot be claimed. Unrevealed badges use one generic gray hex instead of
showing their real artwork or identity.

Minest sends current focus minutes, completed checks, board-goal percentage,
and the configured daily targets via `minest:challenge-progress`. Only the next
stage can be claimed; its required metric cycles through focus, checks, and
board completion, with focus/check targets rising gradually. Claiming is a
user action after the target is met, not an automatic bulk unlock. The ordered
unlocked ID prefix is stored locally in `minest_challenge_wall_v1`.
