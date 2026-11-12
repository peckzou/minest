# CarPlay native release check

The 2026-11-02 Duo package was built from duo-v1. Its native bridge and WidgetBundle did not include CarFlash although the embedded HTML already offered playback. The built debug dylibs confirm the bridge actions and widget kind were missing. Updating a website cannot add them to an installed native binary.

This repair reuses the existing CarFlash implementation from fb0f7ca without changing App Group, widget kind, playlist key, bundle IDs, or user data. It restores Live Activity state, timer preservation, native actions, widget registration and Siri actions in the Duo source tree.

Run from this worktree:
- python3 tools/carplay/test_playlist.py — shared app/widget JSON compatibility and playback math; no real user data written.
- node tools/carplay/test_web_bridge.cjs — acknowledgement, missing bridge warning, browser fallback and rejected sends.
- Build ios/Minest/Minest.xcodeproj, Minest scheme, for iOS.
- python3 tools/carplay/check_bundle.py /absolute/path/Minest.app before EVERY install. The broken old Duo artifact is rejected.
- Install the complete signed app including PlugIns/MinestWidget.appex with the same bundle ID. Do not uninstall it.

An actual car dashboard is not available to local automation. After installing, start a real list from 车载闪卡 on the phone, confirm the car widget displays the same word, then test Next and Pause.

The adapters in ui/ are embedded in canonical HTML; they delegate to existing My World actions and store no duplicate business data. Hobbiton uses its existing player/camera and render loop. The previous touch handler referenced nonexistent window.me; the adapter now uses the published camera. The voxel entry is in the original .wf .wf-acts console, and its floating button is hidden without removing its action.
