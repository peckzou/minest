"""Minest polish · the remaining modules (idempotent). Usage: patch_rest_polish.py [--check] FILE...

1. Card FX key: the Light FX picker looked for any '.dock-fx-tab', which is also the Card FX tab, so the Card FX key
   opened Light FX. The selector now skips the Card FX tab (also in tools/fx-71/card-fx.js).
2. More fan: stays on screen when its ⋯ has no box (opened from the pill Dock), and keeps its labels on screen
   (also in tools/duo/patch_dock_more.py).
3. tools/polish/rest-polish.css: the pet steps aside for Wallpaper Studio, a denser Board Settings sheet and a
   matching My World island card, Activity Rings and 3D Type clear of the floating Dock.
"""
import sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
CSS = (HERE / 'rest-polish.css').read_text()
assert '</style' not in CSS.lower()
TAG = '<style id="mn-rest-polish-css">\n' + CSS + '</style>\n'
BEFORE = '<style id="mn-polish-board-css">'

FX_OLD = "'.ios-tab-item.dock-fx-tab, '"
FX_NEW = "'.ios-tab-item.dock-fx-tab:not([title^=\"Card\"]):not([aria-label^=\"Card\"]), '"

MORE_R = ("    var r = anchor.getBoundingClientRect(), dock = anchor.closest('.mn-bdock'), d = dock.getBoundingClientRect();\n"
          "    var vertical = d.height > d.width, toLeft = vertical ? d.left > innerWidth / 2 : false;\n"
          "    var dir = vertical ? (toLeft ? 'left' : 'right') : 'up', S = 46, GAP = 56;\n")
MORE_R_NEW = MORE_R.replace("    var vertical", "    if (!r.width || !r.height) r = d.width ? { left: d.right - 52, top: d.top, width: 46, height: d.height } : { left: innerWidth - 60, top: innerHeight - 70, width: 46, height: 46 };   /* rest-polish: opened from the pill Dock */\n    var vertical", 1)
MORE_END = "    document.body.appendChild(el); fan = el; anchor.setAttribute('aria-expanded', 'true');"
FAN_Y = "    var shiftY = minY < 8 ? 8 - minY : maxY > innerHeight - 8 ? innerHeight - 8 - maxY : 0;\n"
FAN_Y_NEW = FAN_Y + ("    var LW = 112, minX = Math.min.apply(null, pts.map(function (p) { return p.x; })) - S / 2 - (dir !== 'right' ? LW : 0), maxX = Math.max.apply(null, pts.map(function (p) { return p.x; })) + S / 2 + (dir === 'right' ? LW : 0);   /* rest-polish: labels on screen */\n"
                     "    var shiftX = minX < 8 ? 8 - minX : maxX > innerWidth - 8 ? innerWidth - 8 - maxX : 0;\n")
FAN_X = [("it.style.setProperty('--x', p.x + 'px');", "it.style.setProperty('--x', (p.x + shiftX) + 'px');"),
         ("it.style.setProperty('--dx', (cx - p.x) + 'px');", "it.style.setProperty('--dx', (cx - p.x - shiftX) + 'px');")]


def patch(s, name):
    out, did = s, []
    # 1. Card FX vs Light FX
    if FX_OLD in out:
        out = out.replace(FX_OLD, FX_NEW); did.append('fx')
    # 2. More fan
    if MORE_R in out:
        if out.count(MORE_R) != 1:
            raise RuntimeError('%s: More fan anchor found %d times' % (name, out.count(MORE_R)))
        i = out.index(MORE_R); j = out.index(MORE_END, i)
        body = out[i:j]
        if body.count(FAN_Y) != 1 or any(body.count(a) != 1 for a, _ in FAN_X):
            raise RuntimeError('%s: More fan body has changed' % name)
        body = body.replace(MORE_R, MORE_R_NEW).replace(FAN_Y, FAN_Y_NEW)
        for a, b in FAN_X:
            body = body.replace(a, b)
        out = out[:i] + body + out[j:]; did.append('more')
    # 3. CSS
    if name.endswith('.html'):
        if 'id="mn-rest-polish-css"' in out:
            a = out.index('<style id="mn-rest-polish-css">'); b = out.index('</style>\n', a) + len('</style>\n')
            if out[a:b] != TAG:
                out = out[:a] + TAG + out[b:]; did.append('css-update')
        else:
            if out.count(BEFORE) != 1:
                raise RuntimeError('%s: mn-polish-board-css found %d times (run patch_board_polish.py first)' % (name, out.count(BEFORE)))
            out = out.replace(BEFORE, TAG + BEFORE); did.append('css')
    return out, did


def main(argv):
    check = '--check' in argv
    files = [a for a in argv if a != '--check']
    bad = 0
    for f in files:
        p = Path(f); s = p.read_text()
        out, did = patch(s, p.name)
        if check:
            if did:
                print('%s: needs %s' % (f, ', '.join(did))); bad = 1
            else:
                print('%s: ok' % f)
        elif did:
            p.write_text(out); print('%s: %s' % (f, ', '.join(did)))
        else:
            print('%s: already done' % f)
    return bad


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
