"""Duo (2026-10-30): My World turns a phone sideways (53.6: setOrientation 'landscape'), but a folding iPhone has room
in any posture — forcing landscape there broke the upright half-fold (half the screen black, the fold console never
came up). Skip the request on the Duo / any screen whose short side is 600 pt or more. Re-runnable, edits entries in place."""
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
ENTRIES = ['iPhone53.8241.html', 'iPhoneDuo.html', 'iphone.html', 'index.html', 'ipad.html', 'ios/Minest/Minest/iphone.html',
           'ios/Minest/Minest/iphone18.0.html', 'ios/Minest/Minest/ipad.html', 'ios/MinestProject/MyApp/iphone.html']
OLD = "try { if (window.MinestNative) MinestNative.send('setOrientation', { orientation: 'landscape' }); } catch (e) {}"
NEW = ("try { if (window.MinestNative && !(window.__MINEST_DUO__ || document.documentElement.classList.contains('duo') || "
       "Math.min(screen.width, screen.height) >= 600)) MinestNative.send('setOrientation', { orientation: 'landscape' }); } catch (e) {}   // not on a foldable / big screen")
for name in ENTRIES:
    p = ROOT / name
    if not p.exists(): continue
    s = p.read_text(encoding='utf-8')
    if NEW in s: print('unchanged', name); continue
    n = s.count(OLD)
    if n == 0: print('no landscape request in', name); continue
    p.write_text(s.replace(OLD, NEW), encoding='utf-8'); print('patched', name, n)
