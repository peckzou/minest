#!/usr/bin/env python3
"""Cognitive Toolkit → the Minest app: injects tools/toolkit/host.js (My World entry, full-screen frame, postMessage
host for My World items, Quick Capture and cloud read/write) into every page that has My World. Idempotent: the block
between the markers is replaced on each run."""
import os, re
HERE = os.path.dirname(os.path.abspath(__file__)); REPO = os.path.dirname(os.path.dirname(HERE))
PAGES = ['iphone.html', 'iPhoneDuo.html', 'index.html', 'ipad.html'] + ['ios/Minest/Minest/' + f for f in ('iphone.html', 'iPhoneDuo.html', 'index.html', 'ipad.html', 'iphone18.0.html')]
A, B = '<!-- mn-toolkit-host:start -->', '<!-- mn-toolkit-host:end -->'

def main():
    js = open(os.path.join(HERE, 'host.js'), encoding='utf-8').read()
    block = A + '\n<script>\n' + js + '\n</script>\n' + B
    for name in PAGES:
        p = os.path.join(REPO, name)
        if not os.path.exists(p): print('skip (missing)', name); continue
        s = open(p, encoding='utf-8').read()
        if 'window.MinestMyWorld' not in s: print('skip (no My World)', name); continue
        if A in s: s = re.sub(re.escape(A) + r'[\s\S]*?' + re.escape(B), lambda m: block, s, count=1)
        else: i = s.rindex('</body>'); s = s[:i] + block + '\n' + s[i:]
        open(p, 'w', encoding='utf-8').write(s); print('toolkit host →', name)

if __name__ == '__main__':
    main()
