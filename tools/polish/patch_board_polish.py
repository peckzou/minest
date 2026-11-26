"""Minest polish · board module (idempotent). Usage: patch_board_polish.py [--check] FILE...

1. tools/polish/mo-batch.js as the first script in <head>: whole-document MutationObservers run once per frame.
2. Dock: the system-bar ensure() and the Dock mount() no longer swap the first buttons back and forth forever
   (only where mount() exists; iPhoneDuo.html doesn't have it).
3. Looks fan: stays on screen when its icon has no box (opened from the pill Dock).
4. tools/polish/polish.css + polish.js: composited list shimmer, slim mini-pet hit area, Arcade Play bar above the
   Dock, one focus ring, one select style.
"""
import sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
MO = (HERE / 'mo-batch.js').read_text()
CSS = (HERE / 'polish.css').read_text()
JS = (HERE / 'polish.js').read_text()
for t in (MO, JS):
    assert '</script' not in t.lower()
assert '</style' not in CSS.lower()

MO_TAG = '<script id="mn-polish-mo">\n' + MO + '\n</script>'
BLOCK = '<style id="mn-polish-board-css">\n' + CSS + '</style>\n<script id="mn-polish-board-js">\n' + JS + '</script>\n'

ENSURE_OLD = ("    if (dock.firstElementChild !== ex) dock.insertBefore(ex, dock.firstElementChild);\n"
              "    if (ex.nextElementSibling !== back) dock.insertBefore(back, ex.nextElementSibling);")
ENSURE_NEW = ("    if (ex.parentNode !== dock) dock.insertBefore(ex, dock.querySelector(':scope > :not(.mn-sys-key):not(.mn-sys-sep)'));\n"
              "    if (back.parentNode !== dock) dock.insertBefore(back, ex.nextElementSibling);   /* polish: mount() orders the system keys */")
FAN_R = "    var r = anchor.getBoundingClientRect(), dock = anchor.closest('.mn-bdock'), d = dock.getBoundingClientRect();\n"
FAN_R_NEW = FAN_R + ("    if (!r.width || !r.height) r = d.width ? { left: d.left + d.width / 2 - 23, top: d.top, width: 46, height: d.height } : { left: innerWidth / 2 - 23, top: innerHeight - 70, width: 46, height: 46 };   /* polish: opened from the pill Dock */\n")
FAN_Y = "    var shiftY = minY < 8 ? 8 - minY : maxY > innerHeight - 8 ? innerHeight - 8 - maxY : 0;\n"
FAN_Y_NEW = FAN_Y + ("    var minX = Math.min.apply(null, pts.map(function (p) { return p.x; })) - S / 2, maxX = Math.max.apply(null, pts.map(function (p) { return p.x; })) + S / 2;\n"
                     "    var shiftX = minX < 8 ? 8 - minX : maxX > innerWidth - 8 ? innerWidth - 8 - maxX : 0;\n")
FAN_X = [("it.style.setProperty('--x', p.x + 'px');", "it.style.setProperty('--x', (p.x + shiftX) + 'px');"),
         ("it.style.setProperty('--dx', (cx - p.x) + 'px');", "it.style.setProperty('--dx', (cx - p.x - shiftX) + 'px');")]


def one(s, old, new, name, what):
    n = s.count(old)
    if n != 1:
        raise RuntimeError('%s: %s anchor found %d times' % (name, what, n))
    return s.replace(old, new, 1)


def patch(s, name):
    if 'id="mn-polish-mo"' not in s:
        s = one(s, '<head>', '<head>\n<meta charset="utf-8">\n' + MO_TAG, name, '<head>')   # charset inside the first 1 KB
    else:
        a = s.index('<script id="mn-polish-mo">'); b = s.index('</script>', a) + 9
        s = s[:a] + MO_TAG + s[b:]
    if 'mn-sk-world' in s and ENSURE_NEW not in s:
        s = one(s, ENSURE_OLD, ENSURE_NEW, name, 'dock ensure')
    a = s.index('<script id="mn-dock-looks">'); b = s.index('</script>', a)
    blk = s[a:b]
    if 'polish: opened from the pill Dock' not in blk:
        blk = one(blk, FAN_R, FAN_R_NEW, name, 'looks fan rect')
        blk = one(blk, FAN_Y, FAN_Y_NEW, name, 'looks fan shift')
        for o, n in FAN_X:
            blk = one(blk, o, n, name, 'looks fan x')
        s = s[:a] + blk + s[b:]
    if 'id="mn-polish-board-css"' in s:
        a = s.index('<style id="mn-polish-board-css">'); b = s.index('</script>', s.index('<script id="mn-polish-board-js">')) + 10
        s = s[:a] + BLOCK + s[b:]
    else:
        s = one(s, '</body>', BLOCK + '</body>', name, '</body>')
    return s


def main(argv):
    check = '--check' in argv
    files = [a for a in argv if not a.startswith('--')]
    bad = 0
    for f in files:
        p = ROOT / f
        s = p.read_text()
        t = patch(s, f)
        if check:
            ok = t == s
            print(('ok      ' if ok else 'STALE   ') + f); bad += not ok
        elif t != s:
            p.write_text(t); print('patched ' + f)
        else:
            print('already ' + f)
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
