"""Add local vocabulary downloads without changing persistence or cloud sync."""
from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[2]
FILES=['iphone.html','index.html','iPhone53.8241.html','iPhoneDuo.html','ipad.html','web31.0.html','web31.1.html','ios/Minest/Minest/iphone.html','ios/Minest/Minest/iphone18.0.html','ios/Minest/Minest/ipad.html','ios/MinestProject/MyApp/iphone.html']
js=(ROOT/'tools/live-perf/teach_export.js').read_text()
assert '</script' not in js.lower()
block='<script id="minest-teaching-export-v1">\n'+js+'\n</script>'
for name in FILES:
 p=ROOT/name
 if not p.exists():continue
 s=p.read_text()
 if 'function teacher(body)' not in s:continue
 if 'id="minest-teaching-export-v1"' in s:
  s=re.sub(r'<script id="minest-teaching-export-v1">[\s\S]*?</script>',lambda _:block,s,count=1)
 else:
  old='<h2>我的词卡 Sets</h2>'
  assert s.count(old)==1,name
  s=s.replace(old,old+'<button class="mlv-btn alt" data-teaching-export="">↓ 导出全部词表</button>')
  old='row.append(label,add,teach,load);'
  new="var exp=document.createElement('button');exp.className='mlv-btn alt';exp.textContent='↓ 导出';exp.setAttribute('data-teaching-export',c.id);row.append(label,add,exp,teach,load);"
  assert s.count(old)==1,name
  s=s.replace(old,new)
  assert '</body>' in s,name
  s=s.replace('</body>',block+'\n</body>',1)
 p.write_text(s)
 print(name)
