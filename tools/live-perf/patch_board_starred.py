from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
FILES=['iPhone53.8241.html','iphone.html','index.html','iPhoneDuo.html','ipad.html','ios/Minest/Minest/iphone.html','ios/Minest/Minest/iphone18.0.html','ios/Minest/Minest/ipad.html','ios/MinestProject/MyApp/iphone.html']
for name in FILES:
 p=ROOT/name;s=p.read_text();old='        workspace: ws,\n        archived: !!b.archived,'
 new='        workspace: ws,\n        starred: !!b.starred,\n        archived: !!b.archived,'
 if new in s:continue
 assert s.count(old)==1,name
 p.write_text(s.replace(old,new))
