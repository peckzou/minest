# Minest Desktop Pet (macOS)

The floating pet on the Mac desktop is **the web Mini Pet itself**. It runs the same code as the iPhone page and stays linked to the Minest page open in the browser.

## Files
- `Resources/Web/index.html` is **generated** by `sync-web.py` from the latest `iPhoneX.Y.html`. Do not edit it by hand.
  - It contains the Mini Pet core (`/* 41.377 Mini Pet P0:`) and the behaviour script (`/* 44.5 Pet rewards:`).
  - The behaviour script covers reactions, bubble menu, tips, inbox and Octo mirroring.
  - It is wrapped by `web-src/desktop-host.js`:
    - dragging moves the window;
    - asset paths point to this bundle;
    - clickable areas are reported to the native side.
  - And by `web-src/desktop-bridge.js`:
    - the bubbles' tools are stand-ins that ask the Minest page to open them;
    - messages coming from the page are received here.
- `Sources/LinkServer.swift` serves `ws://127.0.0.1:47321/minest`.
  - It listens on 127.0.0.1 only.
  - It accepts browser pages only from minest-app.vercel.app, focusboard-drab.vercel.app and localhost.
- The window is 420×440 pt and transparent. Clicks pass through everywhere except the pet and what it shows (menu bubbles, tip, inbox).

## Build and install
```bash
macos/MinestDesktopPet/build.sh install
```
- `build.sh` first runs `sync-web.py`, which regenerates `Resources/Web` from the latest `iPhoneX.Y.html`. To use a specific version, run `python3 macos/MinestDesktopPet/sync-web.py iPhone44.7.html` and then build with `SKIP_SYNC=1`.
- It then compiles the app and signs the whole bundle (ad-hoc).
- `install` copies the app to `/Applications/MinestDesktopPet.app`, quits the running pet and starts the new one.
- `Resources/Web` and `MinestDesktopPet.app` are build output and are not committed (see `.gitignore`).
- Rebuild after every change to the web Mini Pet so the two stay the same.

## The link (page side: `MinestDesktopLink` in iPhone44.6+)

Messages from the page to the desktop pet:

| Message | What it carries |
|---|---|
| `ctl` | Every call on the page's `__miniPetCtl` (play / hop / spin / burst / say / setBase, and lookAt as a share of the window). The desktop pet therefore does what the web Mini Pet does: rewards, Light FX, voice acting, Learning Path guidance, Octo mirroring. |
| `look` | Outfit (cosmetics state). |
| `badge` | The held badge. |
| `tip` | A tip or the daily study reminder, sent while Minest is in the background. |
| `hello` | Sent once on connect. |

Messages from the desktop pet to the page:

- `cmd` with one of: `study`, `build`, `analyze`, `speak`, `octo`, `talk`, `inbox`, `ptt` start/end (hold-to-talk), `act` (tip action).
- The app brings the browser forward, except for hold-to-talk.
- If no page is connected, it opens `https://minest-app.vercel.app/?desktopPet=1&pet=<cmd>`.

Use `https://minest-app.vercel.app/iphone` (the site root `/` still serves an older page). The first time the page connects, Chrome asks whether `minest-app.vercel.app` may access devices on the local network: allow it once.

Opt-in: the page connects only after it has been opened once with `?desktopPet=1`. "Open Minest" in the pet's menu does that. Without this flag, visitors who don't have the app never see the browser's local-network permission prompt.

Diagnostics:
- From the page console, `MinestDesktopLink.diag()` fills `window.__desktopPetDiag` with the desktop pet's state.
- The pet's WebView is inspectable: Safari → Develop → MinestDesktopPet.
