#!/usr/bin/env python3
"""Minest · Liquid-glass pill Dock and button motion (2026-11-19, from Antigravity's work in ~/Documents/minest).

Antigravity added to iphone.html (uncommitted, on an older checkout) two self-contained blocks:
  - dock-pill.css / dock-pill.js — a capsule Dock in the reference's liquid-glass style (dark glass and light frosted
    glass, following the app's light / dark mode); the selected app opens into a glass lens with its label. A
    "胶囊玻璃 Dock / 经典方块 Dock" item in the Dock's Looks fan switches between it and the classic Dock
    (localStorage 'mn_dock_pill_v1'); window.MinestPillDock.{isOn,set,toggle}.
  - btn-motion.css / btn-motion.js — press springs, a light sweep and a small per-icon motion on buttons
    (respects prefers-reduced-motion in its CSS).
This puts them, as they are, before </body> of the phone pages (the same pages as tools/duo-70/apply.py).

    python3 tools/dock-pill/apply.py           # a page that already has them is skipped
    python3 tools/dock-pill/apply.py --check   # exit 1 if a page lacks them
"""
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[1]
PAGES = ['iphone.html', 'index.html', 'ios/Minest/Minest/iphone.html', 'ios/Minest/Minest/iphone18.0.html']
BLOCKS = [('style', 'mn-dock-pill-style', 'dock-pill.css'), ('script', 'mn-dock-pill-js', 'dock-pill.js'),
          ('style', 'mn-btn-motion-css', 'btn-motion.css'), ('script', 'mn-btn-motion-js', 'btn-motion.js')]


def block():
    out = ''
    for tag, id_, f in BLOCKS:
        src = (HERE / f).read_text(encoding='utf-8').strip('\n')
        if ('</' + tag) in src.lower():
            raise SystemExit('dock-pill: %s must not contain </%s' % (f, tag))
        out += '<%s id="%s">\n%s\n</%s>\n' % (tag, id_, src, tag)
    return out


def main():
    check = '--check' in sys.argv
    missing, add = [], block()
    for rel in PAGES:
        p = ROOT / rel
        if not p.exists():
            continue
        html = p.read_text(encoding='utf-8')
        if 'id="mn-dock-pill-js"' in html:
            print('dock-pill: %s has it' % rel)
            continue
        if check:
            missing.append(rel)
            continue
        end = html.rfind('</body>')
        if end < 0:
            raise SystemExit('dock-pill: no </body> in ' + rel)
        p.write_text(html[:end] + add + html[end:], encoding='utf-8')
        print('dock-pill: patched %s' % rel)
    if missing:
        print('dock-pill: missing in ' + ', '.join(missing))
        sys.exit(1)


if __name__ == '__main__':
    main()
