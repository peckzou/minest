"""Incrementally add the shared vocabulary library; preserve every existing host feature."""
from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[2]
FILES=['iphone.html','index.html','iPhone53.8241.html','iPhoneDuo.html','ipad.html','ios/Minest/Minest/iphone.html','ios/Minest/Minest/iphone18.0.html','ios/Minest/Minest/ipad.html','ios/MinestProject/MyApp/iphone.html']
HERE=ROOT/'tools/live-perf'
store=(HERE/'teaching_store.js').read_text()
js=(HERE/'wordlist_manager.js').read_text()
css=(HERE/'wordlist_manager.css').read_text()+'\n'+(HERE/'teacher_library.css').read_text()
teacher=(HERE/'teacher_library.js').read_text()
keyflow=(ROOT/'tools/keyflow/host.js').read_text()
jsonjs=(HERE/'teach_json.js').read_text()
assert all('</script' not in x.lower() for x in [store,js,jsonjs])
for name in FILES:
 p=ROOT/name
 if not p.exists():continue
 s=p.read_text()
 for ident,content in [('minest-teaching-storage-v1',store),('minest-wordlist-manager-v1',js)]:
  block='<script id="'+ident+'">\n'+content+'\n</script>'
  if 'id="'+ident+'"' in s:s=re.sub(r'<script id="'+ident+r'">[\s\S]*?</script>',lambda _:block,s,count=1)
  elif ident=='minest-teaching-storage-v1':s=s.replace('</head>',block+'\n</head>',1)
  else:s=s.replace('</body>',block+'\n</body>',1)
 block='<style id="minest-wordlist-manager-css">'+css+'</style>'
 if 'id="minest-wordlist-manager-css"' in s:s=re.sub(r'<style id="minest-wordlist-manager-css">[\s\S]*?</style>',lambda _:block,s,count=1)
 else:s=s.replace('</head>',block+'\n</head>',1)
 # Route only the four Teaching stores through the existing quota-resilient database.
 def patch_store(m):
  block=m.group(0)
  if not any(key in block for key in ["var KEY='minest.teaching.wordsets.v1'","var KEY='minest.teaching-assets.v1'","var KEY='minest.teaching-data.v1'","var storage='minest.teaching.structures.v1'"]):return block
  block=block.replace('localStorage.getItem(KEY)','window.MinestTeachingStorage.getItem(KEY)').replace('localStorage.setItem(KEY,','window.MinestTeachingStorage.setItem(KEY,')
  block=block.replace('localStorage.getItem(storage)','window.MinestTeachingStorage.getItem(storage)').replace('localStorage.setItem(storage,','window.MinestTeachingStorage.setItem(storage,')
  if "var KEY='minest.teaching.wordsets.v1'" in block:
   block=block.replace("b.columns.forEach(function(c){var row=", "b.columns.filter(function(c){return !c.teachingListArchived;}).forEach(function(c){var row=")
   block=block.replace("b.columns.map(function(c){return '<option", "b.columns.filter(function(c){return !c.teachingListArchived;}).map(function(c){return '<option")
   needle='<h2>我的词卡 Sets</h2>'
   if '<button class="mlv-btn alt" data-wordlists-open>词表管理</button>' not in block:block=block.replace(needle,needle+'<button class="mlv-btn alt" data-wordlists-open>词表管理</button>')
  return block
 s=re.sub(r'<script(?:\s[^>]*)?>[\s\S]*?</script>',patch_store,s)
 s=s.replace('/* Teaching home: list actions stay beside the list, sharing the library\'s storage. */\n','')
 start=s.index('function teacher(body){')
 end=s.index('window.MinestTeachingSets=',start)
 s=s[:start]+teacher+'\n'+s[end:]
 s=re.sub(r'<script id="mn-keyflow-host">[\s\S]*?</script>',lambda _:'<script id="mn-keyflow-host">'+keyflow+'</script>',s,count=1)
 s=s.replace("b.columns.map(function(col){\n               var isActive", "b.columns.filter(function(col){return !col.teachingListArchived;}).map(function(col){\n               var isActive")
 needle='<h2>📖 教师端 · 词表管理与账号同步</h2>'
 if 'data-wordlists-open>管理 / 导入 JSON' not in s:s=s.replace(needle,needle+'<button type="button" class="teacher-btn teacher-btn-alt" data-wordlists-open>管理 / 导入 JSON</button>')
 assert 'id="teaching-json826"' in s,name
 s=re.sub(r'<script id="teaching-json826">[\s\S]*?</script>',lambda _:'<script id="teaching-json826">'+jsonjs+'</script>',s,count=1)
 p.write_text(s)
 print(name)
