#!/usr/bin/env python3
"""Minest · page versions (from 2026-11-25).

Each kind of page has its own line and version, kept in tools/versions/versions.json:
    desktop    the web and the Mac            index.html                                   snapshots desktop-v2.0.html, desktop-v2.1.html …
    mobile     iPhone (web and the app)       iphone.html, ios/Minest/Minest/iphone18.0.html, ios/Minest/Minest/iphone.html
                                                                                           snapshots mobile-v2.0.html …
    iPhoneDuo  the iPhone Duo                 iPhoneDuo.html, ios/Minest/Minest/iPhoneDuo.html   snapshots iPhoneDuo-v2.0.html …
    iPad       the iPad                       ipad.html, ios/Minest/Minest/ipad.html       snapshots iPad-v2.0.html …
The live files keep their names (the web and the app open them); each carries its version in
<script id="mn-build"> (window.MINEST_BUILD, shown in Settings) and in its <title>.

    python3 tools/versions/release.py                  # stamp every live page with its current version (changes nothing else)
    python3 tools/versions/release.py snapshot mobile  # save the current mobile page as mobile-v<current>.html
    python3 tools/versions/release.py bump mobile      # next version (2.0 → 2.1), stamp, and save its snapshot
"""
import json, re, shutil, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
VFILE = ROOT / 'tools/versions/versions.json'
LINES = {
    'desktop':   {'live': ['index.html'], 'src': 'index.html', 'snap': 'desktop-v{}.html', 'label': 'Web · Mac'},
    'mobile':    {'live': ['iphone.html', 'ios/Minest/Minest/iphone18.0.html', 'ios/Minest/Minest/iphone.html'], 'src': 'iphone.html', 'snap': 'mobile-v{}.html', 'label': 'iPhone'},
    'iPhoneDuo': {'live': ['iPhoneDuo.html', 'ios/Minest/Minest/iPhoneDuo.html'], 'src': 'iPhoneDuo.html', 'snap': 'iPhoneDuo-v{}.html', 'label': 'iPhone Duo'},
    'iPad':      {'live': ['ipad.html', 'ios/Minest/Minest/ipad.html'], 'src': 'ipad.html', 'snap': 'iPad-v{}.html', 'label': 'iPad'},
}
BLOCK = re.compile(r'<script id="mn-build">.*?</script>\n?', re.S)


def versions():
    return json.loads(VFILE.read_text(encoding='utf-8')) if VFILE.exists() else {k: '2.0' for k in LINES}


def stamp(line, v):
    L = LINES[line]
    build = {'line': line, 'version': v, 'name': line + ' v' + v, 'device': L['label'], 'snapshot': L['snap'].format(v)}
    tag = '<script id="mn-build">window.MINEST_BUILD = ' + json.dumps(build, ensure_ascii=False) + ';</script>\n'
    for name in L['live']:
        p = ROOT / name
        if not p.exists():
            continue
        s = BLOCK.sub('', p.read_text(encoding='utf-8'))
        i = s.find('<head>')
        if i < 0:
            raise SystemExit(name + ': no <head>')
        i += len('<head>')
        s = s[:i] + '\n' + tag + s[i:].lstrip('\n')
        s = re.sub(r'<title>[^<]*</title>', '<title>Minest · ' + build['name'] + '</title>', s, count=1)
        p.write_text(s, encoding='utf-8')
        print('stamped', name, build['name'])


def snapshot(line, v):
    L = LINES[line]
    dst = ROOT / L['snap'].format(v)
    shutil.copyfile(ROOT / L['src'], dst)
    print('saved', dst.name)


def main(a):
    V = versions()
    if not a:
        for k in LINES: stamp(k, V[k])
    elif a[0] in ('snapshot', 'bump') and len(a) == 2 and a[1] in LINES:
        k = a[1]
        if a[0] == 'bump':
            major, minor = V[k].split('.')
            V[k] = major + '.' + str(int(minor) + 1)
        stamp(k, V[k]); snapshot(k, V[k])
    else:
        raise SystemExit(__doc__)
    VFILE.write_text(json.dumps(V, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main(sys.argv[1:])
