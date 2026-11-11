"""Incremental, reproducible insertion; preserve all existing sync and Routine code."""
from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[2]
FILES=['iphone.html','index.html','iPhone53.8241.html','iPhoneDuo.html','ipad.html','web31.0.html','web31.1.html','ios/Minest/Minest/iphone.html','ios/Minest/Minest/iphone18.0.html','ios/Minest/Minest/ipad.html','ios/MinestProject/MyApp/iphone.html']
CSS=(ROOT/'tools/sync-management/management.css').read_text()
JS=(ROOT/'tools/storage/save-indicator.js').read_text()+'\n'+(ROOT/'tools/storage/durable.js').read_text()+'\n'+(ROOT/'tools/routine/envelope.js').read_text()+'\n'+(ROOT/'tools/routine/host-store.js').read_text()+'\n'+(ROOT/'tools/cloud-transport/board-merge.js').read_text()+'\n'+(ROOT/'tools/routine/cloud-merge.js').read_text()+'\n'+(ROOT/'tools/cloud-transport/reconcile.js').read_text()+'\n'+(ROOT/'tools/cloud-transport/transport.js').read_text()+'\n'+(ROOT/'tools/sync-management/core.js').read_text()+'\n'+(ROOT/'tools/sync-management/management.js').read_text()
assert '</script' not in JS.lower()
BLOCK='<style id="minest-sync-management-css">'+CSS+'</style>\n<script id="minest-sync-management-v1">\n'+JS+'\n</script>'
for name in FILES:
 p=ROOT/name
 if not p.exists():continue
 s=p.read_text()
 if 'id="minest-sync-management-v1"' in s:
  s=re.sub(r'<style id="minest-sync-management-css">[\s\S]*?</script>',lambda _:BLOCK,s,count=1)
 else:
  # Only wrap references to the two existing data documents. Journal is separate.
  pattern=r"(?:window\.)?(?:fb\.firestore\(\)|firebase\.firestore\(\)|fb\.db|db)\.collection\(['\"]users['\"]\)\.doc\((?:user|firebaseUser)\.uid\)\.collection\(['\"]focusboard['\"]\)\.doc\(['\"](?:data|teaching)['\"]\)"
  n=[0]
  def wrap(m):
   n[0]+=1;r=m.group(0);return '(window.MinestSyncManagement ? window.MinestSyncManagement.ref('+r+') : '+r+')'
  s=re.sub(pattern,wrap,s)
  if n[0]<2:raise RuntimeError(name+': no cloud adapters found')
  # Keep original account modal intact, launch it from the new manager's account button.
  old='function() { setIsCloudModalOpen(true); }'
  s=s.replace(old,"function() { window.MinestSyncManagement.open({ account: function() { setIsCloudModalOpen(true); } }); }")
  s=s.replace('        var takeDoc = function(doc) {','        var takeDoc = function(doc) {\n          if(window.MinestSyncManagement)window.MinestSyncManagement.observe(doc,user.uid);')
  s=s.replace('<head>','<head>\n'+BLOCK,1)
 s=s.replace("window.MinestSyncManagement.observe(doc);","window.MinestSyncManagement.observe(doc,user.uid);")
 s=s.replace("(signed ? 'Cloud Sync' : 'Sign in · Sync')", "'数据同步'")
 s=s.replace("      db.enablePersistence({ synchronizeTabs: true })", "      if (!(window.MinestCloudTransport && window.MinestCloudTransport.mac)) db.enablePersistence({ synchronizeTabs: true })")
 if 'function minestCloudBaseGet()' in s and 'window.MinestBoardBase =' not in s:s=s.replace('function minestCloudBaseGet() {','window.MinestBoardBase = minestCloudBaseGet;\nfunction minestCloudBaseGet() {')
 p.write_text(s)
 print(name)
