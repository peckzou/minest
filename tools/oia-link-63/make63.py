"""Build iPhoneDuo63.html: iPhoneDuo.html (My World, unchanged) + the 体素世界 62 layer + the 63 Oia link layer,
each as its own <script> just before </body>. The source page is never written to; the copy is checked to be the
source plus exactly these blocks."""
import hashlib
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
src = Path(sys.argv[1]) if len(sys.argv) > 1 else HERE / 'base.html'
out = Path(sys.argv[2]) if len(sys.argv) > 2 else HERE / 'iPhoneDuo63.html'
LAYERS = [('mn-voxel-62', 'vx62.js', 'minest-voxel-62'), ('mn-oia-link-63', 'oialink63.js', 'minest-oia-link-63')]

page = src.read_bytes()
assert page.count(b'</body>') == 1, 'expected one </body>'
blocks = b''
for sid, fname, mark in LAYERS:
    assert mark.encode() not in page, 'source already has ' + mark
    js = (HERE / fname).read_text(encoding='utf-8')
    blocks += ('<script id="' + sid + '">\n' + js.replace('</script', '<\\/script') + '\n</script>\n').encode('utf-8')
new = page.replace(b'</body>', blocks + b'</body>')
out.write_bytes(new)
assert new.replace(blocks, b'') == page
print(out.name, len(new), 'bytes; source sha1', hashlib.sha1(page).hexdigest()[:12])
