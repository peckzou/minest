"""Add the canonical 143-image board to app defaults; never replace an existing board."""
from pathlib import Path
import json,re,argparse
parser=argparse.ArgumentParser()
parser.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[3])
args=parser.parse_args();repo=args.root
board=json.loads((repo/'ec6_anchor_charts_143_board.json').read_text())
board.update(workspace='ec-6 framework',title='Anchor Charts · 143 张图片',titleBilingual='Anchor Charts · 143 张图片',showCovers=True,hideCovers=False,pureMode=False)
assert sum(len(c['cards']) for c in board['columns'])==143
payload=json.dumps(board,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')
block='\n/* Minest built-in Anchor Charts: add the missing image board without replacing saved cards. */\nvar MINEST_ANCHOR_CHARTS_143 = '+payload+';\nDEFAULT_SYSTEM_BOARDS = DEFAULT_SYSTEM_BOARDS.concat([MINEST_ANCHOR_CHARTS_143]);\n'
entries=['iphone.html','index.html','ipad.html','iPhoneDuo.html','iPhone53.8241.html','ios/Minest/Minest/iphone.html','ios/Minest/Minest/iphone18.0.html','ios/Minest/Minest/ipad.html']
for name in entries:
 path=repo/name;source=path.read_text()
 if 'var MINEST_ANCHOR_CHARTS_143 = ' in source:
  print('Already bundled:',name);continue
 anchor='DEFAULT_SYSTEM_BOARDS = DEFAULT_SYSTEM_BOARDS.concat(EC6_FACTORY_BOARDS);\nvar y = DEFAULT_SYSTEM_BOARDS;'
 if source.count(anchor)!=1:raise RuntimeError('Defaults changed: '+name)
 source=source.replace(anchor,'DEFAULT_SYSTEM_BOARDS = DEFAULT_SYSTEM_BOARDS.concat(EC6_FACTORY_BOARDS);'+block+'var y = DEFAULT_SYSTEM_BOARDS;')
 source,count=re.subn(r'(var existing = (?:parsed|sanitized)\.find\(function\(b\) \{ return b\.id === sb\.id; \}\);)',r'\1\n            if (existing && sb.id === "board-ec6-anchor-charts-143") return;',source)
 if count!=2:raise RuntimeError('Hydration changed: '+name)
 path.write_text(source);print('Bundled:',name)
