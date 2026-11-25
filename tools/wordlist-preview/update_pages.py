"""Embed only the isolated word-list preview; leave every existing block intact."""
from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[2]
css=(ROOT/'tools/wordlist-preview/preview.css').read_text(encoding='utf-8').strip()
js=(ROOT/'tools/wordlist-preview/preview.min.js').read_text(encoding='utf-8').strip()
assert '</script' not in js.lower()
block='<style id="minest-wordlist-preview-style">\n'+css+'\n</style>\n<script id="minest-wordlist-preview-script">\n'+js+'\n</script>\n'
# the web's entry pages, and the app's own copies (the iPhone app opens ios/Minest/Minest/iphone18.0.html)
for name in ['iphone.html','index.html','ipad.html','iPhone53.8241.html','iPhoneDuo.html','iPhoneDuo69.html','iPhoneDuo70.html',
             'ios/Minest/Minest/iphone18.0.html','ios/Minest/Minest/iphone.html','ios/Minest/Minest/ipad.html','ios/Minest/Minest/iPhoneDuo.html','ios/Minest/Minest/index.html']:
    p=ROOT/name
    html=p.read_text(encoding='utf-8')
    html=re.sub(r'<style id="minest-wordlist-preview-style">[\s\S]*?</style>\n<script id="minest-wordlist-preview-script">[\s\S]*?</script>\n','',html)
    assert html.count('</body>')==1,name
    p.write_text(html.replace('</body>',block+'</body>'),encoding='utf-8')
