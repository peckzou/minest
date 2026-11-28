#!/usr/bin/env python3
"""Minest offline · audit (2026-11-28): what the app's page needs from the network, file by file.

The iOS app loads a page bundled in the app (ios/Minest/Minest/iphone18.0.html, from file://), but nearly everything
else — Spatial Home, the worlds, the badge pages, the anchor charts, the 3D models — comes from minest-app.vercel.app,
either as an absolute URL or through a relative path the page rewrites to Vercel when it runs from file://.

This follows those references from the page through every text file they lead to (html / js / mjs / css / json) and
writes a manifest: every file of this repository the app can reach, its size, and the references that point to
nothing in the repository.

    python3 tools/offline/audit.py                      # the iPhone app's page
    python3 tools/offline/audit.py ios/Minest/Minest/ipad.html
    python3 tools/offline/audit.py --json out.json      # also write the manifest

It only reads; it is a measuring tool, not part of any page.
"""
import json
import os
import re
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
HOST = 'https://minest-app.vercel.app/'
TEXT = {'.html', '.htm', '.js', '.mjs', '.css', '.json', '.svg', '.txt', '.md'}
ASSET = TEXT | {'.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif', '.glb', '.gltf', '.bin', '.ktx2', '.hdr', '.exr',
                '.mp3', '.wav', '.ogg', '.m4a', '.mp4', '.webm', '.wasm', '.woff', '.woff2', '.ttf', '.otf', '.usdz',
                '.obj', '.mtl', '.fbx', '.vox', '.csv', '.pdf'}
# a quoted string that looks like a path to a file with a known extension
QUOTED = re.compile(r'''["'`(]((?:https://minest-app\.vercel\.app/|\.{0,2}/)?[A-Za-z0-9_][A-Za-z0-9_./@%%+-]*\.(?:%s))(?:[?#][^"'`)\s]*)?["'`)]'''
                    % '|'.join(sorted(e[1:] for e in ASSET)), re.I)
# a quoted directory prefix the code joins with a name later ('spatial-home/clun-2/' + q) — recorded, not followed
PREFIX = re.compile(r'''["'`](?:https://minest-app\.vercel\.app/)?([a-z0-9][a-z0-9._-]*/(?:[a-z0-9._-]+/)*)["'`]''', re.I)


def resolve(ref, base_dir):
    """a reference → a path inside the repository (or None); absolute Vercel URLs map to the repository root"""
    if ref.startswith('https://minest-app.vercel.app/'):
        rel = ref[len(HOST):]
        if rel.startswith('api/'):
            return None, 'api'
        cand = ROOT / rel
    elif ref.startswith('/'):
        cand = ROOT / ref.lstrip('/')
    else:
        cand = (base_dir / ref)
        if not cand.exists():          # page-relative paths are written from the site root as often as not
            cand = ROOT / ref.lstrip('./')
    try:
        cand = cand.resolve()
    except OSError:
        return None, 'bad'
    if ROOT not in cand.parents and cand != ROOT:
        return None, 'outside'
    if cand.is_file():
        return cand, 'ok'
    # the public/ folder is served at the site root by Vercel
    alt = (ROOT / 'public' / os.path.relpath(cand, ROOT))
    if alt.is_file():
        return alt.resolve(), 'ok'
    return None, 'missing'


def crawl(start):
    seen, queue = {}, [start.resolve()]
    missing, api, prefixes = defaultdict(set), set(), defaultdict(set)
    while queue:
        f = queue.pop()
        if f in seen:
            continue
        seen[f] = f.stat().st_size
        if f.suffix.lower() not in TEXT or f.stat().st_size > 40_000_000:
            continue
        try:
            s = f.read_text(encoding='utf-8', errors='ignore')
        except OSError:
            continue
        for m in QUOTED.finditer(s):
            ref = m.group(1)
            got, why = resolve(ref, f.parent)
            if got:
                if got not in seen:
                    queue.append(got)
            elif why == 'api':
                api.add(ref)
            elif why == 'missing':
                missing[ref].add(os.path.relpath(f, ROOT))
        for m in PREFIX.finditer(s):
            d = m.group(1)
            if (ROOT / d).is_dir():
                prefixes[d.split('/')[0]].add(d)
    return seen, missing, api, prefixes


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    out = sys.argv[sys.argv.index('--json') + 1] if '--json' in sys.argv else None
    if out in args:
        args.remove(out)
    start = ROOT / (args[0] if args else 'ios/Minest/Minest/iphone18.0.html')
    seen, missing, api, prefixes = crawl(start)
    by_top = defaultdict(lambda: [0, 0])
    for f, size in seen.items():
        top = os.path.relpath(f, ROOT).split(os.sep)[0]
        by_top[top][0] += 1
        by_top[top][1] += size
    total = sum(seen.values())
    print('Minest offline audit · start: %s' % os.path.relpath(start, ROOT))
    print('reachable files: %d, %.1f MB' % (len(seen), total / 1e6))
    print('%-34s %7s %10s' % ('top folder / file', 'files', 'MB'))
    for top, (n, size) in sorted(by_top.items(), key=lambda kv: -kv[1][1]):
        print('%-34s %7d %10.1f' % (top, n, size / 1e6))
    print('\ndirectory prefixes joined with names at run time (followed only through the files above): %d folders'
          % len(prefixes))
    print('network-only (api/): %d references' % len(api))
    print('references to files not in the repository: %d' % len(missing))
    for ref in sorted(missing)[:25]:
        print('   %s  (in %s)' % (ref, ', '.join(sorted(missing[ref])[:2])))
    if out:
        Path(out).write_text(json.dumps({
            'start': os.path.relpath(start, ROOT),
            'bytes': total,
            'files': {os.path.relpath(f, ROOT): size for f, size in sorted(seen.items())},
            'byTop': {k: {'files': v[0], 'bytes': v[1]} for k, v in by_top.items()},
            'prefixes': {k: sorted(v) for k, v in prefixes.items()},
            'api': sorted(api),
            'missing': {k: sorted(v) for k, v in sorted(missing.items())},
        }, indent=1, ensure_ascii=False), encoding='utf-8')
        print('\nmanifest: %s' % out)


if __name__ == '__main__':
    main()
