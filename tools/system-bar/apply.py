#!/usr/bin/env python3
"""Minest · System buttons (2026-11-19): close, back, full screen (reading mode, one exit button), fold tools.
system-bar.css / system-bar.js go before </body> of the phone pages (the same pages as tools/dock-pill/apply.py).

    python3 tools/system-bar/apply.py           # adds them, or replaces an older copy
    python3 tools/system-bar/apply.py --check   # exit 1 if a page lacks the current blocks
"""
import pathlib
import re
import sys

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[1]
PAGES = ['iphone.html', 'index.html', 'ios/Minest/Minest/iphone.html', 'ios/Minest/Minest/iphone18.0.html']
BLOCKS = [('style', 'mn-sysbar-css', 'system-bar.css'), ('script', 'mn-sysbar-js', 'system-bar.js')]


def block():
    out = ''
    for tag, id_, f in BLOCKS:
        src = (HERE / f).read_text(encoding='utf-8').strip('\n')
        if ('</' + tag) in src.lower():
            raise SystemExit('system-bar: %s must not contain </%s' % (f, tag))
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
            print('system-bar: %s is up to date' % rel)
            continue
        if check:
            missing.append(rel)
            continue
        for tag, id_, f in BLOCKS:   # an older copy goes; the current one is added below
            html = re.sub(r'<%s id="%s">\n.*?\n</%s>\n' % (tag, id_, tag), '', html, count=1, flags=re.S)
        end = html.rfind('</body>')
        if end < 0:
            raise SystemExit('system-bar: no </body> in ' + rel)
        p.write_text(html[:end] + add + html[end:], encoding='utf-8')
        print('system-bar: patched %s' % rel)
    if missing:
        print('system-bar: missing in ' + ', '.join(missing))
        sys.exit(1)


if __name__ == '__main__':
    main()
