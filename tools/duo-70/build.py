#!/usr/bin/env python3
"""Minest Duo 70: a new page built from iphone.html. No existing file is written to.

    python3 tools/duo-70/build.py          # writes iPhoneDuo70.html
    python3 tools/duo-70/build.py --check  # exits 1 if iPhoneDuo70.html is not what this script builds

The page is iphone.html plus
  - the anchored edits in EDITS (each must match exactly once), and
  - tools/duo-70/v70.css and v70.js, added just before </body>.
"""
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
HERE = pathlib.Path(__file__).resolve().parent
SRC = ROOT / 'iphone.html'
OUT = ROOT / 'iPhoneDuo70.html'
VERSION = '70.0'

# (name, text in iphone.html, text in iPhoneDuo70.html)
EDITS = [
    ('title',
     '<title>Minest Duo 53.85 · iPhone Fold</title>',
     '<title>Minest Duo ' + VERSION + ' · iPhone Fold</title>'),
    # board | 3D Cover: while the board is being scrolled to the Cover's card, the board does not turn the Cover back
    ('follow-card-quiet',
     'function followCard(){\n  var pane = document.querySelector(\'.sf-slot[data-sf-view="board"]\'); if (!pane) return;',
     'function followCard(){\n  if (window.__mn70Quiet > Date.now()) return;   /* duo-70 */\n'
     '  var pane = document.querySelector(\'.sf-slot[data-sf-view="board"]\'); if (!pane) return;'),
    # board -> Cover: a card scrolled out above or below its own list is not "the top visible card"
    ('follow-card-in-list',
     "r.bottom < pr.top + 30 || r.top > pr.bottom) return;\n    var y = Math.max(r.top, pr.top) - pr.top;",
     "r.bottom < pr.top + 30 || r.top > pr.bottom) return;\n"
     "    var ls = a.closest('.kanban-cards-scroll'), lr = ls && ls.getBoundingClientRect(); if (lr && (r.bottom < lr.top + 30 || r.top > lr.bottom)) return;   /* duo-70 */\n"
     "    var y = Math.max(r.top, pr.top) - pr.top;"),
    # speed: the Sync Center's 4-second look at all boards (a full re-serialise and hash, ~100 ms) waits for a quiet
    # moment instead of landing in the middle of a swipe. Same work, same cadence; see idle() in v70.js
    ('sync-scan-when-idle',
     'setInterval(function(){boot();if(!document.hidden)scan();},4000);',
     'setInterval(function(){boot();if(!document.hidden)(window.__mn70Idle||function(f){f();})(scan);},4000);'),
]
CSS_OPEN, CSS_CLOSE = '<style id="mn70-css">\n', '\n</style>\n'
JS_OPEN, JS_CLOSE = '<script id="mn70-js">\n', '\n</script>\n'


def build():
    html = SRC.read_text(encoding='utf-8')
    for name, old, new in EDITS:
        n = html.count(old)
        if n != 1:
            raise SystemExit('duo-70: edit "%s" matches %d times in %s (expected 1)' % (name, n, SRC.name))
        html = html.replace(old, new)
    css = (HERE / 'v70.css').read_text(encoding='utf-8').strip('\n')
    js = (HERE / 'v70.js').read_text(encoding='utf-8').strip('\n')
    if '</script' in js.lower() or '</style' in css.lower():
        raise SystemExit('duo-70: v70.js / v70.css must not contain a closing tag')
    end = html.rfind('</body>')
    if end < 0:
        raise SystemExit('duo-70: no </body> in ' + SRC.name)
    return html[:end] + CSS_OPEN + css + CSS_CLOSE + JS_OPEN + js + JS_CLOSE + html[end:]


def main():
    html = build()
    if '--check' in sys.argv:
        ok = OUT.exists() and OUT.read_text(encoding='utf-8') == html
        print('duo-70: %s %s' % (OUT.name, 'is up to date' if ok else 'is stale'))
        sys.exit(0 if ok else 1)
    OUT.write_text(html, encoding='utf-8')
    print('duo-70: wrote %s (%d bytes)' % (OUT.name, len(html.encode('utf-8'))))


if __name__ == '__main__':
    main()
