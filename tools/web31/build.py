#!/usr/bin/env python3
"""Minest Web 31.0 = Web 30.0 + Minest Live (a Gimkit-style class game) + the teacher room entry.

    python3 tools/web31/build.py                  # latest iPhoneX.Y.html
    python3 tools/web31/build.py iPhone44.8.html

Writes web31.0.html (the desktop app) and web31.play.html (the student join page: the live game only).
The game code is tools/web31/minest-live.js — edit that, not the generated pages.
"""
import os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'web30'))
import build as web30   # noqa: E402

REPO = web30.REPO
once = web30.once


def live_js():
    return open(os.path.join(HERE, 'minest-live.js'), encoding='utf-8').read()


def build(iphone_path):
    out = web30.build(iphone_path)
    # top bar: 🎓 Teacher (host a live game, publish a course room) and 🎮 Join next to the web30 entries
    vo = "              item('vo', '🎙', 'Voice', 'Talk to Minest', function() { var V = window.MinestRealtimeVoice43; if (V) { V.open(); if (!V.active) V.start(); } })\n"
    out = once(out, vo, vo.rstrip('\n') + """,
              item('te', '🎓', 'Teacher', 'Teacher · host a live game (Gimkit-style) or publish a course room', function() { window.MinestLive.openTeacher(); }),
              item('jo', '🎮', 'Join', 'Join a live game with a code', function() { window.MinestLive.openJoin(''); })
""", 'top bar: Teacher + Join')
    tail = out.rindex('</body>')
    out = out[:tail] + '\n<!-- ---- web31: Minest Live (tools/web31/minest-live.js) ---- -->\n<script>\n' + live_js() + '\n</script>\n' + out[tail:]
    out = once(out, '<title>Minest Web 30.0 · Board + 3D Cover · Learning Path</title>', '<title>Minest Web 31.0 · Board + Live Class Game</title>', 'title')
    out = once(out, 'className: "studio-version w-7 h-7 flex items-center justify-center font-bold text-xs", children: "30.0" }', 'className: "studio-version w-7 h-7 flex items-center justify-center font-bold text-xs", children: "31.0" }', 'version badge')
    return out


PLAY = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#0d1020">
<title>Minest Live · Join</title>
<style>html,body{margin:0;background:#0d1020;color:#f4f6ff;min-height:100%}</style>
</head>
<body>
<script>window.__MINEST_LIVE_STANDALONE = true;</script>
<script>
%s
</script>
</body>
</html>
"""


def main():
    iphone_path = web30.resolve_iphone(sys.argv[1] if len(sys.argv) > 1 else None)
    out = build(iphone_path)
    open(os.path.join(REPO, 'web31.0.html'), 'w', encoding='utf-8').write(out)
    open(os.path.join(REPO, 'web31.play.html'), 'w', encoding='utf-8').write(PLAY.replace('%s', live_js(), 1))
    print('web31.0.html ← web30 (%s) + Minest Live (%d KB); web31.play.html' % (os.path.basename(iphone_path), len(out) // 1024))


if __name__ == '__main__':
    main()
