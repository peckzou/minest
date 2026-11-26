#!/usr/bin/env python3
"""Minest · System buttons (2026-11-19): close, back, full screen (reading mode, one exit button), fold tools;
the Duo's pages in the Dock (duo-pages.css / duo-pages.js, 2026-11-26) and their motion (duo-motion.js).
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
BLOCKS = [('style', 'mn-sysbar-css', 'system-bar.css'), ('script', 'mn-sysbar-js', 'system-bar.js'),
          ('style', 'mn-duo-pages-css', 'duo-pages.css'), ('script', 'mn-duo-pages-js', 'duo-pages.js'),
          ('script', 'mn-duo-motion-js', 'duo-motion.js')]   # the Duo's pages (2026-11-26)


def one(tag, id_, f):
    src = (HERE / f).read_text(encoding='utf-8').strip('\n')
    if ('</' + tag) in src.lower():
        raise SystemExit('system-bar: %s must not contain </%s' % (f, tag))
    return '<%s id="%s">\n%s\n</%s>\n' % (tag, id_, src, tag)


def block():
    return ''.join(one(*b) for b in BLOCKS)


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
        # each block is replaced where it stands (2026-11-26: moving it to the end changed the order of the styles after it);
        # a block the page lacks goes right after the one before it, or before </body>
        after = None
        for tag, id_, f in BLOCKS:
            new = one(tag, id_, f)
            pat = re.compile(r'<%s id="%s">\n.*?\n</%s>\n' % (tag, id_, tag), re.S)
            m = pat.search(html)
            if m:
                html = html[:m.start()] + new + html[m.end():]
                after = m.start() + len(new)
            else:
                at = after if after is not None else html.rfind('</body>')
                if at < 0:
                    raise SystemExit('system-bar: no </body> in ' + rel)
                html = html[:at] + new + html[at:]
                after = at + len(new)
        p.write_text(html, encoding='utf-8')
        print('system-bar: patched %s' % rel)
    if missing:
        print('system-bar: missing in ' + ', '.join(missing))
        sys.exit(1)


if __name__ == '__main__':
    main()
