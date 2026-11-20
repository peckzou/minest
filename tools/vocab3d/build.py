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
    # Light FX: Minest's own room-light script (FBFX), as it is in iphone.html
    src = (ROOT / 'iphone.html').read_text(encoding='utf-8'); mk = src.index('Screen effects for 3D Cover Flow'); a = src.rindex('<script>', 0, mk) + len('<script>'); b = src.index('</script>', mk)
    fbfx = src[a:b]
    for k, v in [('{{CARDFX}}', read(HERE / 'cardfx.js')), ('{{FBFX}}', fbfx), ('{{CSS}}', (HERE / 'student.css').read_text(encoding='utf-8')), ('{{CARD_STYLES}}', read(CM / 'card-styles.js')),
                 ('{{COVER}}', read(CM / 'cover-modes.js')), ('{{EXPLODE}}', read(CM / 'explode.js')), ('{{STUDENT}}', read(HERE / 'student.js'))]:
        page = page.replace(k, v)
    (ROOT / 'vocab3d.html').write_text(page, encoding='utf-8')
    print('vocab3d: wrote vocab3d.html (%d KB)' % (len(page) // 1024))
    # Knowledge Drive for students: the drive (sfx, drive, cars) and the same join / progress script
    # every Dynamic presentation (as tools/knowledge-drive/patch_knowledge_drive.py puts them in Minest, without its gallery entry)
    KD = ROOT / 'tools' / 'knowledge-drive'; RAIL = ROOT / 'tools' / 'knowledge-rail'; BAL = ROOT / 'tools' / 'knowledge-balloon'
    import subprocess, sys; subprocess.run([sys.executable, str(RAIL / 'build_common.py')], check=True, capture_output=True)
    dcss = '\n'.join((d / f).read_text(encoding='utf-8') for d, f in [(KD, 'drive.css'), (RAIL, 'rail.css'), (RAIL, 'phase3.css'), (KD, 'duo-dyn.css'), (BAL, 'balloon.css')])
    djs = '\n'.join(read(d / f) for d, f in [(KD, 'sfx.js'), (KD, 'drive.js'), (KD, 'cars.js'), (RAIL, 'rail-common.js'), (RAIL, 'train.js'), (RAIL, 'metro.js'), (RAIL, 'tower.js'),
                                             (RAIL, 'showcase-common.js'), (RAIL, 'rack.js'), (RAIL, 'library.js'), (RAIL, 'museum.js'), (RAIL, 'city.js'), (RAIL, 'galaxy.js'), (BAL, 'balloon.js')])
    page = (HERE / 'drive.html').read_text(encoding='utf-8')
    for k, v in [('{{CSS}}', (HERE / 'student.css').read_text(encoding='utf-8')), ('{{DRIVE_CSS}}', dcss),
                 ('{{DRIVE_JS}}', djs), ('{{STUDENT}}', read(HERE / 'student.js'))]:
        page = page.replace(k, v)
    (ROOT / 'vocab-drive.html').write_text(page, encoding='utf-8')
    print('vocab3d: wrote vocab-drive.html (%d KB)' % (len(page) // 1024))
    # 3D Type for students: pinyin typing (跟打 + 闯关) in a type3d world
    page = (HERE / 'type.html').read_text(encoding='utf-8')
    for k, v in [('{{CSS}}', (HERE / 'student.css').read_text(encoding='utf-8')), ('{{TYPE_CSS}}', (HERE / 'type.css').read_text(encoding='utf-8')),
                 ('{{TYPE_JS}}', read(HERE / 'type.js')), ('{{STUDENT}}', read(HERE / 'student.js'))]:
        page = page.replace(k, v)
    (ROOT / 'vocab-type.html').write_text(page, encoding='utf-8')
    print('vocab3d: wrote vocab-type.html (%d KB)' % (len(page) // 1024))


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
