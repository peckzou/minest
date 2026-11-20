#!/usr/bin/env python3
"""Minest · 3D 词卡 (2026-11-20): the student page vocab3d.html (only the assigned words as 3D cards — no Dock, no
other entries) and the teacher module (teacher.js, before </body> of the phone pages, like tools/system-bar/apply.py).

    python3 tools/vocab3d/build.py
"""
import pathlib
import re

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[1]
CM = ROOT / 'tools' / 'cover-modes'
PAGES = ['iphone.html', 'index.html', 'ios/Minest/Minest/iphone.html', 'ios/Minest/Minest/iphone18.0.html']


def read(p):
    s = p.read_text(encoding='utf-8')
    if '</script' in s.lower():
        raise SystemExit('vocab3d: %s must not contain </script' % p.name)
    return s


def student():
    page = (HERE / 'student.html').read_text(encoding='utf-8')
    for k, v in [('{{CSS}}', (HERE / 'student.css').read_text(encoding='utf-8')), ('{{CARD_STYLES}}', read(CM / 'card-styles.js')),
                 ('{{COVER}}', read(CM / 'cover-modes.js')), ('{{EXPLODE}}', read(CM / 'explode.js')), ('{{STUDENT}}', read(HERE / 'student.js'))]:
        page = page.replace(k, v)
    (ROOT / 'vocab3d.html').write_text(page, encoding='utf-8')
    print('vocab3d: wrote vocab3d.html (%d KB)' % (len(page) // 1024))


def teacher():
    add = '<script id="mn-vocab3d-js">\n%s\n</script>\n' % read(HERE / 'teacher.js').strip('\n')
    for rel in PAGES:
        p = ROOT / rel
        if not p.exists():
            continue
        html = p.read_text(encoding='utf-8')
        if add in html:
            continue
        html = re.sub(r'<script id="mn-vocab3d-js">\n.*?\n</script>\n', '', html, count=1, flags=re.S)
        end = html.rfind('</body>')
        p.write_text(html[:end] + add + html[end:], encoding='utf-8')
        print('vocab3d: patched ' + rel)


if __name__ == '__main__':
    student()
    teacher()
