#!/usr/bin/env python3
"""把 hologram/ 打成单个自包含页面，放进 iOS App 包。

App 包是扁平的（three.min.js 在包根目录），所以把 CSS / JS 内联，
只留一个对 three.min.js 的相对引用。用法：python3 hologram/build_native.py
"""
import pathlib, re
root = pathlib.Path(__file__).resolve().parent
out = root.parent / 'ios' / 'Minest' / 'Minest' / 'hologram.html'
html = (root / 'index.html').read_text(encoding='utf-8')
css = (root / 'style.css').read_text(encoding='utf-8')
html = html.replace('<link rel="stylesheet" href="style.css">', '<style>\n' + css + '</style>')
html = html.replace('<script src="../vendor/three.min.js"></script>', '<script src="three.min.js"></script>')
def inline(m):
    return '<script>\n' + (root / m.group(1)).read_text(encoding='utf-8').replace('</script', '<\\/script') + '</script>'
html, n = re.subn(r'<script src="(js/[a-z_]+\.js)"></script>', inline, html)
assert n == 4 and 'style.css' not in html and '../vendor' not in html
out.write_text(html, encoding='utf-8')
print('wrote', out, len(html), 'bytes')
