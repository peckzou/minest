# Shelved 2026-10-30: My World 3D Vocabulary & Concept Display (53.88)

This is a snapshot of `tools/live-perf` at the moment the user shelved the project to start Knowledge Drive V1.0.

## Status
- `world_vocab.js` / `world_vocab.css` are partial. They contain:
  - 8 displays: wlib, wwall, wcab, wtable (meant to be finished first), plus wtree, wblocks, wgallery, wgarden.
  - 12 forms.
  - Pull Out & Flip.
- `world_fold.js` already calls into `VOCAB`: the Form tab, the Vocabulary room, wdisp/wform in Smart.
- Everything passes `node --check`. It was **never verified in the preview, never installed and never deployed**.
- The agent that wrote it stopped on a rate limit.
- The last build installed on the Duo was the fold console with the Smart Room fix, the round back button, the hidden floor guide, the 3D-top Cover with scroll sync, and patch_duo_orient. That build had no vocab.

## Resume
1. Copy these files back to `tools/live-perf` if they have drifted.
2. Run `python3 patch_world_fold.py`. It assembles `world_blocks.py`, including world_vocab.js.
3. Verify in the minest-44 preview.
4. The spec is in the session transcript (3D Vocabulary & Concept Display).
