from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
helper = (ROOT / 'tools/live-perf/cloud_server_read.js').read_text()
files = ['iPhone53.8241.html','iphone.html','index.html','iPhoneDuo.html','ipad.html','ios/Minest/Minest/iphone.html','ios/Minest/Minest/iphone18.0.html','ios/Minest/Minest/ipad.html','ios/MinestProject/MyApp/iphone.html']
for name in files:
 p=ROOT/name; s=p.read_text()
 if 'function minestCloudServerRead(' in s: continue
 assert s.count('function minestCloudWait(')==1
 s=s.replace('function minestCloudWait(',helper+'\nfunction minestCloudWait(',1)
 old="minestCloudWait(docRef.get({ source: 'server' })).then(acceptDoc)"
 assert s.count(old)==1
 s=s.replace(old,"minestCloudServerRead(docRef, user, firebaseConfig.projectId).then(acceptDoc)")
 s=s.replace('if (doc.metadata && doc.metadata.fromCache) { setSyncStatus("connecting"); return Promise.resolve(); }','if (doc.metadata && doc.metadata.fromCache) { if (!cloudReadyRef.current) setSyncStatus("connecting"); return Promise.resolve(); }')
 p.write_text(s)
 print(name)
