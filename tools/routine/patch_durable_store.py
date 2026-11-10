from pathlib import Path
import re
r=Path(__file__).resolve().parents[2]
files=['iphone.html','index.html','iPhone53.8241.html','iPhoneDuo.html','ipad.html','ios/Minest/Minest/iphone.html','ios/Minest/Minest/iphone18.0.html','ios/Minest/Minest/ipad.html','ios/MinestProject/MyApp/iphone.html']
for f in files:
 p=r/f;s=p.read_text();a=s.index('<script id="mn-routine-run">');b=s.index('</script>',a);host=s[a:b]
 if 'var durable = ' not in host:
  host=re.sub(r'  var store = \{ get: function[\s\S]*?\n  function boot\(\)', '''  var actor;try{actor=localStorage.getItem('minest.sync-device.v1');if(!actor){actor=crypto.randomUUID();localStorage.setItem('minest.sync-device.v1',actor);}}catch(e){actor='session-'+Date.now()+'-'+Math.random();}
  var durable = window.MinestRoutineHostStore({envelope:window.MinestRoutineEnvelope,storage:{getItem:function(k){return localStorage.getItem(k);},setItem:function(k,v){localStorage.setItem(k,v);}},actor:actor,notify:dirty,apply:function(raw){last=raw;if(ov&&!ov.hidden&&window.MinestRoutineApp)MinestRoutineApp.applyExternal(raw);}});
  var store = {get:durable.get,set:durable.set};
  function boot()''',host,count=1)
  c=host.index('  function cloud()');d=host.index('  // ---- the ways in:',c)
  host=host[:c]+'''  function cloud() { return durable.cloud(); }
  function mergeCloud(remote) { return durable.mergeCloud(remote); }
'''+host[d:]
  host=host.replace('_cloud: cloud, _mergeCloud: mergeCloud,','_cloud: cloud, _mergeCloud: mergeCloud, pending:durable.pending, confirm:durable.mergeCloud,')
 s=s[:a]+host+s[b:]
 s=s.replace('return minestCloudBoardsDirty() || window.MinestWorkspaceCloud.pending();', 'return minestCloudBoardsDirty() || window.MinestWorkspaceCloud.pending() || !!(window.MinestRoutine&&window.MinestRoutine.pending&&window.MinestRoutine.pending());')
 p.write_text(s)
