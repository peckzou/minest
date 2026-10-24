"""🚗 车载闪卡 (CarPlay flashcards) + 🎓 GPT Study (tools/live-perf/gptstudy.js) · the iPhone page side.
Applied in place to iPhone53.8241.html, then copied to iphone.html, index.html and the two iOS copies.
tools/live-perf/carflash.js + carflash.css: pick a list, an interval and the order, then Start. The iOS app
(ios/Minest/Minest/CarFlashController.swift) puts the current word into Minest's Live Activity; CarPlay's Dashboard
shows its small layout (MinestWidget/MinestLiveActivity.swift): one big English word and ⏸ Pause / ▶ Resume.
Entries: a 🚗 tab in the bottom dock (iOS app only; ?carflash shows it in a browser) and 「🚗 车载闪卡」 in the
word-list editor. In a browser the panel plays the words by itself (no Live Activity there).
"""
from pathlib import Path
import shutil, sys

ROOT = Path('/Users/cece/Documents/minest'); HERE = ROOT / 'tools/live-perf'
SRC = ROOT / 'iPhone53.8241.html'
COPIES = ['iphone.html', 'index.html', 'ios/Minest/Minest/iphone.html', 'ios/MinestProject/MyApp/iphone.html']
s = SRC.read_text(encoding='utf-8')
COPIES = COPIES + ['ios/Minest/Minest/iphone18.0.html']
def swap(open_tag, body):   # re-running replaces each block with the current file
    global s
    a = s.index(open_tag) + len(open_tag); b = s.index('</s' + ('tyle>' if open_tag.startswith('<style') else 'cript>'), a); s = s[:a] + body + s[b:]
if 'id="minest-carflash"' in s:
    swap('<style id="minest-carflash-style">', (HERE / 'carflash.css').read_text(encoding='utf-8'))
    swap('<script id="minest-gptstudy">', (HERE / 'gptstudy.js').read_text(encoding='utf-8'))
    swap('<script id="minest-carflash">', (HERE / 'carflash.js').read_text(encoding='utf-8'))
else:
    assert s.count('</body>') == 1
    s = s.replace('</body>', '<style id="minest-carflash-style">' + (HERE / 'carflash.css').read_text(encoding='utf-8') + '</style>\n<script id="minest-gptstudy">' + (HERE / 'gptstudy.js').read_text(encoding='utf-8') + '</script>\n<script id="minest-carflash">' + (HERE / 'carflash.js').read_text(encoding='utf-8') + '</script>\n</body>')
SRC.write_text(s, encoding='utf-8')
for c in COPIES:
    shutil.copyfile(SRC, ROOT / c)
print('patched car flashcards + GPT Study')
