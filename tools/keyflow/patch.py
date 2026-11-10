from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[2]
HERE=Path(__file__).resolve().parent
bundle=(HERE/'minest-keyflow.js').read_text()
assert '</script' not in bundle.lower()
block='<script type="text/plain" id="mn-keyflow-src">'+bundle+'</script>\n<script id="mn-keyflow-host">'+(HERE/'host.js').read_text()+'</script>'
files=['iphone.html','index.html','iPhone53.8241.html','iPhoneDuo.html','ipad.html','ios/Minest/Minest/iphone.html','ios/Minest/Minest/iphone18.0.html','ios/Minest/Minest/ipad.html','ios/MinestProject/MyApp/iphone.html']
for name in files:
 p=ROOT/name;s=p.read_text()
 s=re.sub(r'<script type="text/plain" id="mn-keyflow-src">[\s\S]*?</script>\s*<script id="mn-keyflow-host">[\s\S]*?</script>','',s)
 marker='<script id="mn-dock-more">'
 if marker not in s:
  s=s.replace('</body>',block+'\n</body>');p.write_text(s);print(name+': module loaded, legacy menu');continue
 a=s.index(marker);b=s.index('</script>',a);menu=s[a:b]
 if "label: '律动录入'" not in menu:
  menu=menu.replace('var MORE = [',"var MORE = [\n    { m:function(){return false;}, label: '律动录入' },")
  menu=menu.replace('    return out;',"    out[0]=document.getElementById('mn-keyflow-trigger');\n    return out;")
  menu=menu.replace("    haptic('light');\n    try", "    haptic('light');\n    if(window.MinestKeyflow&&MinestKeyflow.isOpen()){MinestKeyflow.close();return true;}\n    try",1)
 s=s[:a]+menu+s[b:]
 s=s.replace('</body>',block+'\n</body>')
 p.write_text(s)
 print(name)
