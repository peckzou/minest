#!/usr/bin/env python3
"""Minest · Liquid-glass pill Dock and button motion (2026-11-19, from Antigravity's work in ~/Documents/minest).

Antigravity added to iphone.html (uncommitted, on an older checkout) two self-contained blocks:
  - dock-pill.css / dock-pill.js — a capsule Dock (restyled 2026-11-19 after the user's "GO Club" reference: pale
    lavender glass, big black icons, the app in use in an inset lens with its name running up beside the icon;
    close / back / more stay small and never become "in use"). A
    "胶囊玻璃 Dock / 经典方块 Dock" item in the Dock's Looks fan switches between it and the classic Dock
    (localStorage 'mn_dock_pill_v1'); window.MinestPillDock.{isOn,set,toggle}.
  - btn-motion.css / btn-motion.js — press springs, a light sweep and a small per-icon motion on buttons
    (respects prefers-reduced-motion in its CSS).
This puts them before </body> of the phone pages (the same pages as tools/duo-70/apply.py).

    python3 tools/dock-pill/apply.py           # adds them, or replaces an older copy
    python3 tools/dock-pill/apply.py --check   # exit 1 if a page lacks the current blocks
"""
import pathlib
import re
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
        if add in html:
            print('dock-pill: %s is up to date' % rel)
            continue
        if check:
            missing.append(rel)
            continue
        for tag, id_, f in BLOCKS:   # an older copy of a block goes; the current one is added below
            html = re.sub(r'<%s id="%s">\n.*?\n</%s>\n' % (tag, id_, tag), '', html, count=1, flags=re.S)
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
