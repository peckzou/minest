"""Embed only the isolated word-list preview; leave every existing block intact."""
from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[2]
css=(ROOT/'tools/wordlist-preview/preview.css').read_text().strip()
js=(ROOT/'tools/wordlist-preview/preview.min.js').read_text().strip()
assert '</script' not in js.lower()
block='<style id="minest-wordlist-preview-style">\n'+css+'\n</style>\n<script id="minest-wordlist-preview-script">\n'+js+'\n</script>\n'
for name in ['iphone.html','index.html','ipad.html','iPhone53.8241.html','iPhoneDuo.html','iPhoneDuo69.html','iPhoneDuo70.html']:
    p=ROOT/name
    html=p.read_text()
    html=re.sub(r'<style id="minest-wordlist-preview-style">[\s\S]*?</style>\n<script id="minest-wordlist-preview-script">[\s\S]*?</script>\n','',html)
    assert html.count('</body>')==1,name
    p.write_text(html.replace('</body>',block+'</body>'))
