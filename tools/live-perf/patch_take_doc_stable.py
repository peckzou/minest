#!/usr/bin/env python3
"""2026-11-12: stop the boards page flickering on every cloud poll.

takeDoc used to re-apply the cloud copy each time it ran, even when nothing had
changed: setBoards with a fresh array (whole UI re-renders), plus the cloud's
activeBoardId / viewMode / themeMode, which belong to whichever device saved
last. Now the remote boards are applied once per cloud stamp, and the view and
theme stay per device. Idempotent."""
import sys, pathlib
ROOT = pathlib.Path(__file__).resolve().parents[2]
PAGES = ['iPhoneDuo.html', 'iPhoneDuo69.html', 'iphone.html', 'iPhone53.8241.html', 'index.html', 'ipad.html',
         'ios/Minest/Minest/iPhoneDuo.html', 'ios/Minest/Minest/index.html', 'ios/Minest/Minest/ipad.html',
         'ios/Minest/Minest/iphone.html', 'ios/Minest/Minest/iphone18.0.html', 'ios/MinestProject/MyApp/iphone.html']
OLD = """                var incoming = sanitizeLoadedBoards(remoteBoards);
                isRemoteUpdateRef.current = incoming;
                setBoards(incoming);
                if (data.activeBoardId) setActiveBoardId(data.activeBoardId);
                if (['coverflow', 'board', 'drill', 'photos', 'pins'].includes(data.viewMode)) setViewMode(data.viewMode);
                if (['dark', 'white'].includes(data.themeMode)) setThemeMode(data.themeMode);
"""
NEW = """                // 2026-11-12 (anti-flicker): apply a cloud copy once per stamp; view and theme stay per device
                var takenStamp = String(rAt) + ':' + remoteBoards.length;
                if (window.__minestTakenStamp !== takenStamp) {
                  window.__minestTakenStamp = takenStamp;
                  var incoming = sanitizeLoadedBoards(remoteBoards);
                  isRemoteUpdateRef.current = incoming;
                  setBoards(incoming);
                  if (data.activeBoardId && !cloudReadyRef.current) setActiveBoardId(data.activeBoardId);
                }
"""
done = 0
for p in PAGES:
    f = ROOT / p
    if not f.exists(): print('skip (missing)', p); continue
    s = f.read_text()
    if NEW in s: print('already', p); continue
    n = s.count(OLD)
    if n != 1: print('NOT FOUND (%d)' % n, p); continue
    f.write_text(s.replace(OLD, NEW)); done += 1; print('patched', p)
print(done, 'pages patched')
