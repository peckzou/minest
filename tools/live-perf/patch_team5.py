"""👥 Team Games (teacher side only): tools/live-perf/team5.js + team5.css injected before </body>.
Applied in place to iPhone53.8241.html, then copied to iphone.html, index.html and the iOS copies.
Re-running replaces the injected blocks with the current team5.js / team5.css.
"""
from pathlib import Path
import shutil

ROOT = Path('/Users/cece/Documents/minest'); HERE = ROOT / 'tools/live-perf'
SRC = ROOT / 'iPhone53.8241.html'
COPIES = ['iphone.html', 'index.html', 'ios/Minest/Minest/iphone.html', 'ios/MinestProject/MyApp/iphone.html', 'ios/Minest/Minest/iphone18.0.html']
s = SRC.read_text(encoding='utf-8')
css, js = (HERE / 'team5.css').read_text(encoding='utf-8'), (HERE / 'team5.js').read_text(encoding='utf-8')
def swap(open_tag, close_tag, body):
    global s
    a = s.index(open_tag) + len(open_tag); b = s.index(close_tag, a); s = s[:a] + body + s[b:]
if 'id="teaching-team5"' in s:
    swap('<style id="teaching-team5-style">', '</style>', css)
    swap('<script id="teaching-team5">', '</script>', js)
else:
    assert s.count('</body>') == 1
    s = s.replace('</body>', '<style id="teaching-team5-style">' + css + '</style>\n<script id="teaching-team5">' + js + '</script>\n</body>')
SRC.write_text(s, encoding='utf-8')
for c in COPIES:
    shutil.copyfile(SRC, ROOT / c)
print('patched Team Games')
