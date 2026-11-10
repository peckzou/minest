from pathlib import Path
import re
root=Path(__file__).resolve().parents[2]
files=['iphone.html','index.html','iPhone53.8241.html','iPhoneDuo.html','ipad.html','ios/Minest/Minest/iphone.html','ios/Minest/Minest/iphone18.0.html','ios/Minest/Minest/ipad.html']
levels=""",
    { k: 'tt-ttt3', name: 'Tic-Tac-Toe · 井字棋', icon: '⭕', tag: '教学游戏 · 答题落子', teach: 'ttt3' },
    { k: 'tt-snake3', name: 'Snakes & Ladders · 蛇形棋', icon: '🐍', tag: '教学游戏 · 答题掷骰', teach: 'snake3' },
    { k: 'tt-cloze3', name: 'Build a Bridge · 过桥', icon: '🌉', tag: '教学游戏 · 句子填空', teach: 'cloze3' },
    { k: 'tt-cloud3', name: 'Listen & Order · 云朵', icon: '☁️', tag: '教学游戏 · 听力排序', teach: 'cloud3' },
    { k: 'tt-lock3', name: 'Unlock · 开锁', icon: '🔑', tag: '教学游戏 · 拼音配对', teach: 'lock3' }"""
drag=(root/'tools/live-perf/drag3.js').read_text()
if 'info: liveInfo' not in drag:
 drag=drag.replace("var cx = context(), r = root(); if (!cx || !r) return; if (why(g, cx)) return;", "var cx = context(), r = root(); G = null; if (!cx || !r || !GAMES.some(function(x){return x[0]===g;})) return false; if (why(g, cx)) return false;")
 drag=drag.replace("r.dataset.tenView = 'd3'; next();", "r.dataset.tenView = 'd3'; next(); return true;")
 drag=drag.replace("G = null; sfx('click'); try { T().home(r); } catch(x){} return;", "G = null; sfx('click'); if(r.classList.contains('mlv-teach-level')){try{MinestTemplates.close();}catch(x){}return;} try { T().home(r); } catch(x){} return;")
 drag=drag.replace('window.MinestDrag3 = {', "function liveInfo(){if(!G)return null;var board=G.g==='ttt3'||G.g==='snake3';return {mode:G.g,done:!!G.done,total:board?(G.asked||0):G.rounds.length,correct:board?(G.right||0):G.first,completed:G.done?(board?(G.asked||0):G.rounds.length):G.i,xp:G.xp||0};}\nwindow.MinestDrag3 = { info: liveInfo,")
 (root/'tools/live-perf/drag3.js').write_text(drag)
for f in files:
 p=root/f;s=p.read_text()
 if "k: 'tt-ttt3'" not in s:
  needle="   /* 74: the ten teaching games */";assert s.count(needle)==1,f;s=s.replace(needle,levels+"   /* teaching games assigned through room levels */")
  s=s.replace("var T = window.MinestTemplates, TT = window.MinestTeachingTen;\n    if (!T || !TT || TT.modes.indexOf(mode) < 0) return false;", "var T = window.MinestTemplates, TT = window.MinestTeachingTen, DD = window.MinestDrag3;\n    var dragMode = ['ttt3','snake3','cloze3','cloud3','lock3'].indexOf(mode)>=0;\n    if (!T || !TT || (dragMode ? !DD : TT.modes.indexOf(mode)<0)) return false;")
  s=s.replace('    api.start(mode);\n    root.classList.add',"    if(dragMode){if(!DD.start(mode)){try{T.close();}catch(e){}return false;}}else api.start(mode);\n    root.classList.add")
  s=s.replace('var a = r.__teaching824, info = a && a.info();', 'var a = r.__teaching824, info = dragMode ? DD.info() : a && a.info();')
  s=s.replace("info.mode === mode && r.dataset.tenView === 'result'", "info.mode === mode && (dragMode ? info.done : r.dataset.tenView === 'result')")
  s=s.replace('var v = TT.score ? TT.score(info)', 'var v = dragMode ? info : TT.score ? TT.score(info)')
 s,n=re.subn(r'(<script id="teaching-drag3">)[\s\S]*?(</script>)',lambda m:m[1]+drag+m[2],s,count=1);assert n==1,f
 s=s.replace("if (!ok) { run = null; toast('No cards here can be asked this way — level skipped.');","if (!ok && levelInfo(k).teach) { run = null; toast('这项游戏当前缺少可用词卡或语音，请选择其它已开放关卡。'); draw(); return; }\n      if (!ok) { run = null; toast('No cards here can be asked this way — level skipped.');") if "if (!ok && levelInfo(k).teach)" not in s else s
 p.write_text(s)
 print(f)
