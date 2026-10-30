"""2026-10-30 Board switcher + Board Center page, and one Dock on the Duo. Re-runnable (replaces its own blocks).

- board_nav.js goes into the app script just before Me (the board picker); Me delegates to MinestBoardNav.Root with its
  own props, so all existing callbacks / data are reused. board_nav.css goes in <style id="mn-board-nav-css">.
- The board picker's outside-click handler ignores the new panel, GlassUI dialogs, and a pinned (docked) switcher.
- The bottom-left "▦ Boards" launcher (<script id="mn-board-center-launcher">) is removed.
- Duo: the DUO_ONE_DOCK rules go into each entry's <style id="mn-duo-style"> block directly (patch_duo.py would copy
  iPhone53.8241.html over copies that carry their own work, so it is not re-run here); duo.css carries the same rules.
"""
from pathlib import Path
import re

HERE = Path(__file__).resolve().parent; ROOT = HERE.parents[1]
FILES = ['iPhone53.8241.html', 'iphone.html', 'index.html', 'iPhoneDuo.html', 'ipad.html', 'ios/Minest/Minest/iphone.html',
         'ios/Minest/Minest/iphone18.0.html', 'ios/Minest/Minest/ipad.html', 'ios/MinestProject/MyApp/iphone.html']
JS = (HERE / 'board_nav.js').read_text(encoding='utf-8').strip()
CSS = '<style id="mn-board-nav-css">\n' + (HERE / 'board_nav.css').read_text(encoding='utf-8').strip() + '\n</style>'
DUO = (HERE / 'duo.css').read_text(encoding='utf-8')
DUO_RULES = DUO[DUO.index('/* MN-DUO-ONE-DOCK'):DUO.index('/* /MN-DUO-ONE-DOCK */') + len('/* /MN-DUO-ONE-DOCK */')]
DELEGATE = "  if (typeof MinestBoardNav !== 'undefined') return (0, P.jsx)(MinestBoardNav.Root, props);   // MN-BOARD-NAV: switcher + Board Center\n"
OLD_OUT = "e.target.closest('.mn-board-hub'))) {"
NEW_OUT = "e.target.closest('.mn-board-hub,.mn-bn-root,.lg-dialog,.lg-toast-host')) && !window.__mnBoardNavPinned) {"

for name in FILES:
    p = ROOT / name; t = p.read_text(encoding='utf-8'); was = t
    if 'var Me = function(props) {' not in t:
        print('skip (no board picker):', name); continue
    # 1. the module, just before Me
    if '/* MN-BOARD-NAV:BEGIN' in t:
        a = t.index('/* MN-BOARD-NAV:BEGIN'); b = t.index('/* MN-BOARD-NAV:END */', a) + len('/* MN-BOARD-NAV:END */')
        t = t[:a] + JS + t[b:]
    else:
        assert t.count('var Me = function(props) {') == 1, name
        t = t.replace('var Me = function(props) {', JS + '\n\nvar Me = function(props) {', 1)
    # 2. Me delegates (before its first hook, so the hook order never changes)
    if 'MN-BOARD-NAV: switcher + Board Center' not in t:
        t = t.replace('var Me = function(props) {\n', 'var Me = function(props) {\n' + DELEGATE, 1)
    # 3. outside clicks
    if NEW_OUT not in t:
        assert t.count(OLD_OUT) == 1, name + ': board picker outside-click handler changed'
        t = t.replace(OLD_OUT, NEW_OUT)
    # 4. css
    if '<style id="mn-board-nav-css">' in t:
        t = re.sub(r'<style id="mn-board-nav-css">[\s\S]*?</style>', lambda _: CSS, t, count=1)
    else:
        k = t.rindex('</body>'); t = t[:k] + CSS + '\n' + t[k:]
    # 5. no bottom-left launcher
    t = re.sub(r'<script id="mn-board-center-launcher">[\s\S]*?</script>\n?', '', t)
    # 6. Duo: one Dock
    if '<style id="mn-duo-style">' in t:
        a = t.index('<style id="mn-duo-style">'); b = t.index('</style>', a)
        blk = t[a:b]
        if '/* MN-DUO-ONE-DOCK' in blk:
            blk = re.sub(r'/\* MN-DUO-ONE-DOCK[\s\S]*?/\* /MN-DUO-ONE-DOCK \*/', lambda _: DUO_RULES, blk, count=1)
        else:
            blk = blk.rstrip('\n') + '\n' + DUO_RULES + '\n'
        t = t[:a] + blk + t[b:]
    if t != was:
        p.write_text(t, encoding='utf-8'); print('patched:', name)
    else:
        print('unchanged:', name)
