"""Update the inert Routine bundle only. Do not rewrite the host bridge, cloud sync, or settings."""
from pathlib import Path
import re
root=Path(__file__).resolve().parents[2]
bundle=(root/'tools/routine/minest-routine.js').read_text()
assert '</script' not in bundle.lower()
files=['iphone.html','index.html','iPhone53.8241.html','iPhoneDuo.html','ipad.html','ios/Minest/Minest/iphone.html','ios/Minest/Minest/iphone18.0.html','ios/Minest/Minest/ipad.html','ios/MinestProject/MyApp/iphone.html']
for name in files:
 p=root/name;s=p.read_text()
 s,n=re.subn(r'(<script\b[^>]*id=[\"\']mn-routine-src[\"\'][^>]*>)[\s\S]*?(</script>)',lambda m:m[1]+'\n'+bundle+'\n'+m[2],s,count=1)
 if n!=1:raise RuntimeError(name+': Routine bundle missing')
 p.write_text(s)
 print(name)
