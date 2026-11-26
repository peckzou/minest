"""Minest polish · My World + Spatial Home (idempotent). Usage: patch_myworld_home.py [--check] FILE...

Needs the board polish first (tools/polish/patch_board_polish.py): it provides --mn-dock-clear and the slim pet hit area.
1. My World on a phone: the header keys keep one row, the title gets its own line (it was 0px wide).
2. My World: a never-dragged mini pet moves off the islands while My World is open.
3. Spatial Home: walk hint and room key row above the floating Dock; asset credit at the top.
"""
import sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
CSS = (HERE / 'myworld-home.css').read_text()
JS = (HERE / 'myworld-home.js').read_text()
assert '</script' not in JS.lower() and '</style' not in CSS.lower()
BLOCK = '<style id="mn-polish-mwh-css">\n' + CSS + '</style>\n<script id="mn-polish-mwh-js">\n' + JS + '</script>\n'


def patch(s, name):
    if 'id="mn-polish-board-js"' not in s:
        raise RuntimeError(name + ': board polish missing (run patch_board_polish.py first)')
    for need in ('.uv-head', '#sh-hint', '#sh-credit'):
        if need not in s:
            raise RuntimeError(name + ': ' + need + ' not found')
    if 'id="mn-polish-mwh-css"' in s:
        a = s.index('<style id="mn-polish-mwh-css">'); b = s.index('</script>', s.index('<script id="mn-polish-mwh-js">')) + 10
        return s[:a] + BLOCK + s[b:]
    if s.count('</body>') != 1:
        raise RuntimeError(name + ': </body> not unique')
    return s.replace('</body>', BLOCK + '</body>', 1)


def main(argv):
    check = '--check' in argv
    bad = 0
    for f in [a for a in argv if not a.startswith('--')]:
        p = ROOT / f; s = p.read_text(); t = patch(s, f)
        if check:
            print(('ok      ' if t == s else 'STALE   ') + f); bad += t != s
        elif t != s:
            p.write_text(t); print('patched ' + f)
        else:
            print('already ' + f)
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
