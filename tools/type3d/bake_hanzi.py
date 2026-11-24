#!/usr/bin/env python3
"""3D Type · Chinese strokes: packs the stroke medians of hanzi-writer-data into type3d/hanzi/.

    npm pack hanzi-writer-data@2.0.1 && tar xzf hanzi-writer-data-2.0.1.tgz      # gives ./package/<字>.json
    python3 tools/type3d/bake_hanzi.py ./package

Every character is a list of strokes in writing order, every stroke the polyline that runs down its middle
(the `medians` of Make Me a Hanzi, © Arphic Technology, Arphic Public License — see type3d/hanzi/LICENSE.txt).
Two packs, so the common characters arrive first:
    a.bin   GB 2312 level 1 (the 3755 most used characters)
    b.bin   every other character of the data set
Pack layout (little endian):
    u32 count, then count × (u32 code point, u32 offset from the start of the stroke data), then the stroke data:
    per character  u8 strokes, per stroke  u8 points, per point  u8 x, u8 y
    x = 0…255 across the em square, y = 0…255 from its bottom to its top (the baseline sits at 124/1024 of the height).
Read by type3d/hanzi.js (the 3D Type pages) and tools/typing-worlds-app/src/engine/glyphs/hanzi.ts (the worlds).
"""
import json
import struct
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'type3d' / 'hanzi'


def level1(ch):
    try:
        b = ch.encode('gb2312')
    except UnicodeEncodeError:
        return False
    return len(b) == 2 and 0xB0 <= b[0] <= 0xD7


def q(v):
    return max(0, min(255, round(v / 1024 * 255)))


def pack(chars):
    index, data = [], bytearray()
    for cp, medians in sorted(chars):
        index.append((cp, len(data)))
        data.append(min(255, len(medians)))
        for stroke in medians[:255]:
            pts = []
            for x, y in stroke:
                p = (q(x), q(y + 124))
                if not pts or pts[-1] != p:
                    pts.append(p)
            if len(pts) == 1:
                pts.append(pts[0])
            pts = pts[:255]
            data.append(len(pts))
            for x, y in pts:
                data += bytes((x, y))
    head = struct.pack('<I', len(index)) + b''.join(struct.pack('<II', cp, off) for cp, off in index)
    return head + bytes(data)


def main():
    src = Path(sys.argv[1] if len(sys.argv) > 1 else 'package')
    a, b = [], []
    for f in src.glob('*.json'):
        ch = f.stem
        if len(ch) != 1:
            continue
        medians = json.loads(f.read_text(encoding='utf-8')).get('medians')
        if not medians:
            continue
        (a if level1(ch) else b).append((ord(ch), medians))
    OUT.mkdir(parents=True, exist_ok=True)
    for name, chars in (('a.bin', a), ('b.bin', b)):
        blob = pack(chars)
        (OUT / name).write_bytes(blob)
        print('%s: %d characters, %d bytes' % (name, len(chars), len(blob)))


if __name__ == '__main__':
    main()
