"""Build iPhoneDuo60.html: a byte-for-byte copy of iPhoneDuo.html (My World, latest main) with the
体素世界 60 layer (vx60.js) appended just before </body>. The source pages are never written to."""
import hashlib
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
src = Path(sys.argv[1]) if len(sys.argv) > 1 else HERE / 'base.html'
out = Path(sys.argv[2]) if len(sys.argv) > 2 else HERE / 'iPhoneDuo60.html'

page = src.read_bytes()
layer = (HERE / 'vx60.js').read_text(encoding='utf-8')
assert page.count(b'</body>') == 1, 'expected one </body>'
assert b'minest-voxel-60' not in page, 'source already has the layer'
block = ('<script id="mn-voxel-60">\n' + layer.replace('</script', '<\\/script') + '\n</script>\n').encode('utf-8')
new = page.replace(b'</body>', block + b'</body>')
out.write_bytes(new)

# the copy is the source plus one block, nothing else
assert new.replace(block, b'') == page
print(out.name, len(new), 'bytes; source sha1', hashlib.sha1(page).hexdigest()[:12])
