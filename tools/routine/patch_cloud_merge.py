from pathlib import Path
import re
r=Path(__file__).resolve().parents[2];js=(r/'tools/routine/cloud-merge.js').read_text()
files=['iphone.html','index.html','iPhone53.8241.html','iPhoneDuo.html','ipad.html','ios/Minest/Minest/iphone.html','ios/Minest/Minest/iphone18.0.html','ios/Minest/Minest/ipad.html','ios/MinestProject/MyApp/iphone.html']
for f in files:
 p=r/f;s=p.read_text()
 block='<script id="mn-routine-cloud-merge">'+js+'</script>\n'
 if 'id="mn-routine-cloud-merge"' in s:s=re.sub(r'<script id="mn-routine-cloud-merge">[\s\S]*?</script>\n',lambda _:block,s,count=1)
 else:s=s.replace('<script id="mn-routine-run">',block+'<script id="mn-routine-run">')
 a=s.index('  function merge(local, lat, rem, rat) {',s.index('<script id="mn-routine-run">'));b=s.index('  function cloud()',a)
 s=s[:a]+'''  function merge(local, lat, rem, rat) { var base=null;try{base=JSON.parse(get('liquid-routine.cloud-base.v1')||'null');}catch(e){}return window.MinestRoutineMerge(local,lat,rem,rat,base); }
'''+s[b:]
 s=s.replace("if (out !== raw) {\n      put(KEY, out);", "if (out !== raw) {\n      if(raw){try{var backups=JSON.parse(get('liquid-routine.recovery.v1')||'[]');backups.push({at:Date.now(),state:JSON.parse(raw)});put('liquid-routine.recovery.v1',JSON.stringify(backups.slice(-8)));}catch(e){}}\n      put(KEY, out);")
 s=s.replace("if (out !== JSON.stringify(remote.state)) dirty();", "put('liquid-routine.cloud-base.v1',JSON.stringify(remote.state));\n    if (out !== JSON.stringify(remote.state)) dirty();")
 s=s.replace("window.dispatchEvent(new Event('minest:cloud-dirty')); } catch (e) {} }   // Minest's cloud save picks it up", "window.dispatchEvent(new CustomEvent('minest:cloud-dirty',{detail:{immediate:true,domain:'routine'}})); } catch (e) {} }   // Routine changes enter the upload queue immediately")
 s=s.replace("var gpt = function() { if (!gptT) gptT = setTimeout(gptNow, 20000); };", "var gpt = function(e) { if(e&&e.detail&&e.detail.immediate){minestCloudDirty();kick();return;} if (!gptT) gptT = setTimeout(gptNow, 20000); };")
 p.write_text(s)
