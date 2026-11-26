#!/usr/bin/env python3
"""Minest · motion polish (2026-11-26): sticky hover on touch screens, "transition: all" narrowed, the pet badge's
scale(0) — motion-polish.css / motion-polish.js before </body> of the phone pages (the same pages as tools/system-bar).

    python3 tools/motion-polish/apply.py           # adds them, or replaces an older copy in place
    python3 tools/motion-polish/apply.py --check   # exit 1 if a page lacks the current blocks
"""
import pathlib
import re
import sys

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[1]
PAGES = ['iphone.html', 'index.html', 'ios/Minest/Minest/iphone.html', 'ios/Minest/Minest/iphone18.0.html']
BLOCKS = [('style', 'mn-motion-polish-css', 'motion-polish.css'), ('script', 'mn-motion-polish-js', 'motion-polish.js')]


def one(tag, id_, f):
    src = (HERE / f).read_text(encoding='utf-8').strip('\n')
    if ('</' + tag) in src.lower():
        raise SystemExit('motion-polish: %s must not contain </%s' % (f, tag))
    return '<%s id="%s">\n%s\n</%s>\n' % (tag, id_, src, tag)


def main():
    check = '--check' in sys.argv
    add = ''.join(one(*b) for b in BLOCKS)
    missing = []
    for rel in PAGES:
        p = ROOT / rel
        if not p.exists():
            continue
        html = p.read_text(encoding='utf-8')
        if add in html:
            print('motion-polish: %s is up to date' % rel)
            continue
        if check:
            missing.append(rel)
            continue
        after = None
        for tag, id_, f in BLOCKS:
            new = one(tag, id_, f)
            m = re.compile(r'<%s id="%s">\n.*?\n</%s>\n' % (tag, id_, tag), re.S).search(html)
            if m:
                html = html[:m.start()] + new + html[m.end():]
                after = m.start() + len(new)
            else:
                at = after if after is not None else html.rfind('</body>')
                if at < 0:
                    raise SystemExit('motion-polish: no </body> in ' + rel)
                html = html[:at] + new + html[at:]
                after = at + len(new)
        p.write_text(html, encoding='utf-8')
        print('motion-polish: patched %s' % rel)
    if missing:
        print('motion-polish: missing in ' + ', '.join(missing))
        sys.exit(1)


if __name__ == '__main__':
    main()
