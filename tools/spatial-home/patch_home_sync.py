#!/usr/bin/env python3
"""Spatial Home sync repair (2026-11-26) — reproducible, idempotent.

    python3 tools/spatial-home/patch_home_sync.py spatial-home/js/home-store.js iPhoneDuo.html [more pages …]
    python3 tools/spatial-home/patch_home_sync.py --check iPhoneDuo.html

On Minest's own page, the home store (rooms' layouts 'bp:home:<room>' and defaults 'sh:def:<room>') wrote its keys
straight to the cloud doc as a plain `knowledge` field with the Firestore SDK, outside the sync transport. On the iPhone
and the iPad that write often never arrived, and the next full save, which carries the compressed copy and deletes the
plain field, dropped keys only that plain field had. Now the keys go up with Minest's own save (host-flush.js), and a
key leaves the outbox once that save has taken it. The lite (a page of its own) and bridge (a frame inside the iOS app)
paths are unchanged.
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
NEW = (Path(__file__).resolve().parent / 'host-flush.js').read_text(encoding='utf8').rstrip('\n')
MARK = 'Spatial Home sync repair (tools/spatial-home/patch_home_sync.py)'
START = "  /* Minest's own page: the keys go up by themselves, small."
END = "\n  function flush() {"


def patch(s):
    if MARK in s:
        i = s.find('  function hostFlush(h) {'); j = s.find(END, i)
        return (s[:i] + NEW + s[j:], 'refreshed') if i >= 0 and j >= 0 else (None, 'no hostFlush')
    i = s.find(START)
    if i < 0 or s.count(START) != 1:
        return None, 'anchor found %d times' % s.count(START)
    j = s.find(END, i)
    return s[:i] + NEW + s[j:], 'patched'


def main(argv):
    check = '--check' in argv
    files = [a for a in argv if a != '--check']
    if not files:
        raise SystemExit(__doc__)
    bad = 0
    for name in files:
        p = ROOT / name; s = p.read_text(encoding='utf8')
        if check:
            ok = MARK in s; print(('ok      ' if ok else 'MISSING ') + name); bad += not ok; continue
        out, why = patch(s)
        if out is None:
            print('skipped %s: %s' % (name, why)); bad += 1; continue
        if out != s:
            p.write_text(out, encoding='utf8')
        print(why, name)
    sys.exit(1 if bad and check else 0)


if __name__ == '__main__':
    main(sys.argv[1:])
