# Minest Keyflow input

Input-only adaptation of the user-provided Keyflow archive. Retains the original kinetic glyph renderer and local Web Audio feedback; omits the demo, statistics dashboard, waveform, vault panel and external APIs. No fonts or API credentials are fetched.

Build with `npm ci --ignore-scripts` and `npm run build` in this directory, then run `python3 tools/keyflow/patch.py` at the repository root. React/CSS are bundled into inert scripts and mounted on demand in a shadow root. Closing unmounts all animation loops.

Entry: Dock → More → 律动录入. The toolbar hides after 2.4 seconds and can be restored by pointer movement, keyboard focus, or the small ellipsis button. Empty state shows only “editing”. IME composition, paste and multi-line input use a native textarea. Enter submits; Shift+Enter inserts a newline.

Drafts use `minest.keyflow.draft.v1`. Submitted records use independent `keyflow:entry:<uuid>` keys in the existing Minest Knowledge metadata store and share its compressed sync pipeline. Submission checks the local persisted record before clearing input. “已保存到 Minest” means local persistence, not a server acknowledgement.
