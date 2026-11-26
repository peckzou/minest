#!/usr/bin/env python3
"""Minest · 3D Cover display modes (Wall, Fan, Helix, Stack, Spiral, Orbit, Sphere, Wave) and the card styles.
cover-modes.js / card-styles.js go before </body> of the phone pages (the same pages as tools/dock-pill/apply.py).

    python3 tools/cover-modes/apply.py           # adds them, or replaces an older copy
    python3 tools/cover-modes/apply.py --check   # exit 1 if a page lacks the current blocks
"""
import pathlib
import re
import sys

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[1]
PAGES = ['iphone.html', 'index.html', 'ios/Minest/Minest/iphone.html', 'ios/Minest/Minest/iphone18.0.html',
         'ipad.html', 'ios/Minest/Minest/ipad.html']   # the iPad pages follow the phone page from iPad v2.1
BLOCKS = [('script', 'mn-rolodex-js', 'rolodex.js'), ('script', 'mn-glass-widgets-js', 'glass-widgets.js'), ('script', 'mn-cover-modes-js', 'cover-modes.js'), ('script', 'mn-card-styles-js', 'card-styles.js'), ('script', 'mn-explode-js', 'explode.js')]


def block():
    out = ''
    for tag, id_, f in BLOCKS:
        src = (HERE / f).read_text(encoding='utf-8').strip('\n')
        if ('</' + tag) in src.lower():
            raise SystemExit('cover-modes: %s must not contain </%s' % (f, tag))
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
            print('cover-modes: %s is up to date' % rel)
            continue
        if check:
            missing.append(rel)
            continue
        for tag, id_, f in BLOCKS:   # an older copy goes; the current one is added below
            html = re.sub(r'<%s id="%s">\n.*?\n</%s>\n' % (tag, id_, tag), '', html, count=1, flags=re.S)
        end = html.rfind('</body>')
        if end < 0:
            raise SystemExit('cover-modes: no </body> in ' + rel)
        p.write_text(html[:end] + add + html[end:], encoding='utf-8')
        print('cover-modes: patched %s' % rel)
    if missing:
        print('cover-modes: missing in ' + ', '.join(missing))
        sys.exit(1)


if __name__ == '__main__':
    main()
