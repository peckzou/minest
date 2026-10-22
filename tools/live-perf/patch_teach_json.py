"""Word-list editor · { } JSON 导入: agents (or teachers) can bring a whole word list — with pictures — as one JSON file.
Applied in place to iPhone53.8241.html, then copied to iphone.html, index.html and the two iOS copies.

- The editor's list bar gets「{ } JSON 导入」next to 新词表 / 从看板导入. Its panel takes pasted JSON or a .json file,
  has 📋 复制格式说明 (the prompt to give an agent) and 填入示例.
- tools/live-perf/teach_json.js does the import (window.MinestTeachingJSON): new list(s), card pictures, pinyin, English,
  categories, hints, example sentences, orders and the structure records. Format: tools/live-perf/TEACHING-JSON.md.
- After the import the editor opens the new list, the same way 新词表 does (asking first if there are unsaved edits).
"""
from pathlib import Path
import shutil, sys

ROOT = Path('/Users/cece/Documents/minest'); HERE = ROOT / 'tools/live-perf'
SRC = ROOT / 'iPhone53.8241.html'
COPIES = ['iphone.html', 'index.html', 'ios/Minest/Minest/iphone.html', 'ios/MinestProject/MyApp/iphone.html']
s = SRC.read_text(encoding='utf-8')
if 'id="teaching-json826"' in s:
    sys.exit('already patched')

def rep(a, b, n=1):
    global s
    c = s.count(a); assert c == n, (a[:100], c, n); s = s.replace(a, b)

rep("""<button data-edit-panel-open="import">↓ 从看板导入</button>'+""",
    """<button data-edit-panel-open="import">↓ 从看板导入</button><button data-edit-panel-open="json">{ } JSON 导入</button>'+""")
rep(""" function panel(k){if(k==='new')return""",
    """ function panel(k){if(k==='json')return window.MinestTeachingJSON?MinestTeachingJSON.panelHTML():'<p>JSON 导入仍在加载，请稍后再试。</p>';if(k==='new')return""")
rep(""" function bindPanel(p,k){var go=p.querySelector('[data-p-go]');""",
    """ function bindPanel(p,k){var go=p.querySelector('[data-p-go]');
  if(k==='json'){if(window.MinestTeachingJSON&&go)MinestTeachingJSON.bind(p,function(id,note){if(dirty()&&window.confirm('当前词表有未保存的修改，先保存吗？')){commit(false);if(!saved)return;}else close();edit(id,options);var st=document.querySelector('#mn-set-editor [data-edit-status]');if(st){st.textContent=note;st.className='se819-status';}});return;}""")
rep("""#mn-set-editor .se819-panel{""", """#mn-set-editor .se819-panel textarea[data-p-json]{font:13px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace;min-height:170px;resize:vertical}#mn-set-editor .se819-json-tip{margin:0;color:#6b5aa3;font-size:14px}#mn-set-editor .se819-json-row{display:flex;flex-wrap:wrap;gap:8px}#mn-set-editor .se819-json-row>*{flex:1 1 180px}
#mn-set-editor .se819-panel{""")
rep('</body>', '<script id="teaching-json826">' + (HERE / 'teach_json.js').read_text(encoding='utf-8') + '</script>\n</body>')

SRC.write_text(s, encoding='utf-8')
for c in COPIES:
    shutil.copyfile(SRC, ROOT / c)
print('patched JSON import')
