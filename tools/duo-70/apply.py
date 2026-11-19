#!/usr/bin/env python3
"""Minest Duo 70 into the pages people actually open (2026-11-19).

build.py makes the stand-alone iPhoneDuo70.html from iphone.html. This applies the same Duo 70 work — the anchored
edits in build.EDITS (all but the title) and v70.css / v70.js before </body> — to the phone pages themselves:
the web's iphone.html and index.html, and the app bundle's iphone.html, iphone18.0.html (the page the iPhone / Duo
app loads) and index.html. iPad pages are left alone.

    python3 tools/duo-70/apply.py           # patch the pages (a page that already has Duo 70 is skipped)
    python3 tools/duo-70/apply.py --check   # exit 1 if any page still lacks it
"""
import importlib.util
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[1]
spec = importlib.util.spec_from_file_location('duo70_build', HERE / 'build.py')
B = importlib.util.module_from_spec(spec)
spec.loader.exec_module(B)

PAGES = ['iphone.html', 'index.html',
         'ios/Minest/Minest/iphone.html', 'ios/Minest/Minest/iphone18.0.html']
MARK = '<script id="mn70-js">'


def patch(html, name):
    for edit, old, new in B.EDITS:
        if edit == 'title':
            continue
        n = html.count(old)
        if n != 1:
            raise SystemExit('duo-70 apply: edit "%s" matches %d times in %s (expected 1)' % (edit, n, name))
        html = html.replace(old, new)
    css = (HERE / 'v70.css').read_text(encoding='utf-8').strip('\n')
    js = (HERE / 'v70.js').read_text(encoding='utf-8').strip('\n')
    end = html.rfind('</body>')
    if end < 0:
        raise SystemExit('duo-70 apply: no </body> in ' + name)
    return html[:end] + B.CSS_OPEN + css + B.CSS_CLOSE + B.JS_OPEN + js + B.JS_CLOSE + html[end:]


def main():
    check = '--check' in sys.argv
    missing = []
    for rel in PAGES:
        p = ROOT / rel
        if not p.exists():
            continue
        html = p.read_text(encoding='utf-8')
        if MARK in html:
            print('duo-70 apply: %s has it' % rel)
            continue
        if check:
            missing.append(rel)
            continue
        p.write_text(patch(html, rel), encoding='utf-8')
        print('duo-70 apply: patched %s' % rel)
    if check and missing:
        print('duo-70 apply: missing in ' + ', '.join(missing))
        sys.exit(1)


if __name__ == '__main__':
    main()
