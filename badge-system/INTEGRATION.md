# Minest Badge Challenge Wall

Source: the user-provided `minest-3d-badge-system.zip` (Badge Wall and its 3D badge library).
This directory keeps the imported React/Three.js source editable. Run
`npm install` once, then `npm run build`; the same-origin output is written to
`../badge-challenge/` and embedded as the **Badge Wall** and **Collection** panes in `iphone.html` Awards.

The source catalog contains 123 actual badges. The wall preserves its 150-slot
layout, but the remaining 27 slots are clearly marked as future content and
cannot be claimed. Unrevealed badges use one generic gray hex instead of
showing their real artwork or identity.

Minest sends live focus minutes, completed checks, board-goal percentage,
configured daily targets, the local calendar date, and qualified date history
via `minest:challenge-progress`. Any one ring closing records that date once in
`minest_qualified_ring_days_v1`; the total never resets if a day is skipped.
The 3/7/14/30/40/50/60/80/90/100-day thresholds enqueue their ten dedicated
Strike badges once each. Closing all three rings on a local calendar day
auto-opens the Rings 4.0 celebration and queues one random non-Strike badge
that has not already been collected or reserved. Tapping the spinning rings
decelerates them and opens the wall. A pending badge has no visible identity;
clicking it starts assembly, reveals the real 3D badge, and flies the same
badge to its actual wall slot. Only that final return marks it collected.

The single reward ledger lives in `minest_reward_system_v2`; legacy
`minest_challenge_wall_v1` unlocks are imported as existing collection items,
except old Strike unlocks without the required qualified-day count. The old
storage remains untouched for recovery; no qualifying dates are invented.
Collection reads this same ledger, while
the separate catalog preview remains a non-reward demo. Use
`npx tsx --test src/rewardEngine.test.ts` to run the idempotency and milestone
tests. Browser smoke tests use an isolated origin so they cannot alter real
reward progress.
