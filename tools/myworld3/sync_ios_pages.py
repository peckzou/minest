#!/usr/bin/env python3
"""Minest · bring the iOS app's pages up to the web pages' My World 3D library.

Studio library 6 (STUDIO_LIBRARY_6.md) was embedded in the web pages (iphone.html, ipad.html, index.html, the Duo
pages) but not in the pages the iOS app bundles (ios/Minest/Minest/*.html), so the app still had library 4. This copies
the three blocks that carry the library from iphone.html into each iOS page:

    <script id="mn-assets3d-src">          the bundled 3D library (tools/myworld3/dist/assets3d-lib6.js)
    <script> My World 3.0 (MinestUniverse)  the library link
    <script id="mn-display-script">        the Build picker's bridge (tools/live-perf/world_lib4.js)

A page's block is replaced only when it is missing the library (no `lib6:{worlds`) or already equals the web page's;
anything else is reported and left alone, so page-specific edits are never overwritten.

    python3 tools/myworld3/sync_ios_pages.py           # update
    python3 tools/myworld3/sync_ios_pages.py --check   # only report; exits 1 when a page is behind
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'iphone.html'
PAGES = ['ios/Minest/Minest/' + f for f in ('iphone18.0.html', 'iphone.html', 'iPhoneDuo.html', 'index.html', 'ipad.html')]
SCRIPT = re.compile(r'<script\b[^>]*>[\s\S]*?</script>')


def blocks(text):
    out = {}
    for m in SCRIPT.finditer(text):
        t = m.group(0)
        if 'id="mn-assets3d-src"' in t[:80]:
            out['assets'] = (m.start(), m.end(), t)
        elif 'id="mn-display-script"' in t[:80]:
            out['display'] = (m.start(), m.end(), t)
        elif 'Minest · My World 3.0 — Spatial Personal World' in t[:200]:
            out['universe'] = (m.start(), m.end(), t)
    return out


def main():
    check = '--check' in sys.argv
    src = blocks(SOURCE.read_text(encoding='utf-8'))
    if 'lib6:{worlds' not in src.get('assets', (0, 0, ''))[2]:
        sys.exit('iphone.html has no library 6 to copy')
    behind = 0
    for name in PAGES:
        p = ROOT / name
        text = p.read_text(encoding='utf-8')
        have = blocks(text)
        edits = []
        for key, (_, _, want) in src.items():
            if key not in have:
                print(f'  {name}: no {key} block — skipped'); continue
            a, b, cur = have[key]
            if cur == want:
                continue
            if key == 'assets' and 'lib6:{worlds' in cur:
                print(f'  {name}: its own library 6 build — left alone'); continue
            if key != 'assets' and 'lib6' in cur:
                print(f'  {name}: {key} already edited for library 6 — left alone'); continue
            edits.append((a, b, want, key))
        if not edits:
            print(f'ok        {name}'); continue
        behind += 1
        if check:
            print(f'BEHIND    {name}: ' + ', '.join(e[3] for e in edits)); continue
        for a, b, want, _ in sorted(edits, reverse=True):
            text = text[:a] + want + text[b:]
        p.write_text(text, encoding='utf-8')
        print(f'updated   {name}: ' + ', '.join(e[3] for e in edits))
    if check and behind:
        sys.exit(1)


if __name__ == '__main__':
    main()
