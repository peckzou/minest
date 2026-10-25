"""Teaching games · the answer becomes a toy (template wall + Solo map, same engine).
Applied in place to iPhone53.8241.html, then copied to iphone.html, index.html and the iOS copies.
(搭桥 and 拼火车 are in tools/live-perf/drag3.js / drag3.css, re-injected here.)

1. Matching → 拼图配对 (Drag Matching): the targets are jigsaw pieces with a socket, the word cards are pieces with a tab;
   a right drop locks the two together, a wrong one springs back (the engine's own check).
2. Sorting → 喂怪兽: every category box is a monster with eyes and a mouth full of teeth; a right card is chewed (nom),
   a wrong one is spat out with a head shake.
5. Word Search → 寻宝 (I Spy 词海): the heap lies on a treasure map; each word found digs up loot (💰 🔑 🎁 💎 👑) where it
   lay, and every three finds unlock the next region (椰林海滩 → 火山洞穴 → 骷髅岛 → 宝藏神殿).
6. Memory → 开门记忆 (Memory Flip): the tiles are doors; tap two and they swing open on the word / picture behind them;
   a pair stays open, a wrong pair closes again by itself.
"""
from pathlib import Path
import shutil, sys

ROOT = Path('/Users/cece/Documents/minest'); HERE = ROOT / 'tools/live-perf'
SRC = ROOT / 'iPhone53.8241.html'
COPIES = ['iphone.html', 'index.html', 'ios/Minest/Minest/iphone.html', 'ios/MinestProject/MyApp/iphone.html', 'ios/Minest/Minest/iphone18.0.html', 'ipad.html', 'ios/Minest/Minest/ipad.html']
s = SRC.read_text(encoding='utf-8')
if 'function sxMonster(' in s:
    sys.exit('already patched')

def rep(a, b, n=1):
    global s
    c = s.count(a); assert c == n, (a[:100], c, n); s = s.replace(a, b)

# ---- 6. 开门记忆: the Memory Flip tiles are doors --------------------------------------------------------------------------
a = s.index('    function matchPairs(){')
b = s.index('    function listenTap(w){', a)
DOORS = r"""    function matchPairs(){
      // 53.833 · 开门记忆: every tile is a door; two taps open two doors; a pair stays open, a wrong pair closes by itself.
      var cards=session.queue.slice(session.round*6,session.round*6+6);if(cards.length===1)cards=cards.concat(session.queue.filter(function(c){return c.id!==cards[0].id;}).slice(0,1));var tiles=mix(cards.flatMap(function(w,i){return [{i:i,side:'front',text:w.front},{i:i,side:'back',text:w.back}];})), open=[], matched=new Set(), busy=false;
      frame('<p data-match-count>0 / '+cards.length+' 对已找到</p><div class="tt-grid t809-match door-grid">'+tiles.map(function(t,i){return '<button data-tile="'+i+'" class="door" aria-label="打开第 '+(i+1)+' 扇门"><span class="door-in"></span><span class="door-leaf"><i>'+(i+1)+'</i></span></button>';}).join('')+'</div><button data-match-reset hidden>关上这两扇门，再试一次</button>','打开两扇门，找出同一个词的两面：中文和它的图片 / 英文。配错的门会自己关上。');
      function inner(t){return options.chinese?'<small>'+(t.side==='front'?'中文':cards[t.i].cueKind==='image'?'图片':cards[t.i].cueKind==='en'?'English':'拼音')+'</small>'+(t.side==='front'?word(cards[t.i]):cue(cards[t.i])):'<small>'+(t.side==='front'?'词语':'释义')+'</small>'+esc(t.text);}
      function close(){open.forEach(function(n){var d=qa('[data-tile]')[n];d.classList.remove('door-open');d.setAttribute('aria-label','打开第 '+(n+1)+' 扇门');later(450,function(){if(!d.classList.contains('door-open'))d.querySelector('.door-in').innerHTML='';});});open=[];busy=false;q('[data-match-reset]').hidden=true;}
      qa('[data-tile]').forEach(function(b){b.onclick=function(){var i=+b.dataset.tile,t=tiles[i];if(busy||open.includes(i)||matched.has(t.i))return;
        b.querySelector('.door-in').innerHTML=inner(t);b.classList.add('door-open');b.setAttribute('aria-label',t.text);sxSfx('whoosh');open.push(i);if(open.length<2)return;
        var a=tiles[open[0]],z=tiles[open[1]];
        if(a.i===z.i&&a.side!==z.side){matched.add(a.i);sxSay(cards[a.i]);xEvent(cards[a.i],'correct',session.missed);open.forEach(function(n){qa('[data-tile]')[n].disabled=true;qa('[data-tile]')[n].classList.add('tt-correct');});open=[];q('[data-match-count]').textContent=matched.size+' / '+cards.length+' 对已找到';if(matched.size===cards.length)answered(true,'配对完成');}
        else{busy=true;session.missed=true;xEvent([cards[a.i],cards[z.i]],'error');needPractice([cards[a.i],cards[z.i]],'配对需要巩固');feedback('两扇门后面不是一对，记住位置，门马上关上。',false);q('[data-match-reset]').hidden=false;later(1500,close);}};});
      bind('[data-match-reset]',close);
    }
"""
s = s[:a] + DOORS + s[b:]

# ---- 2. 喂怪兽: the sorting boxes chew --------------------------------------------------------------------------------------
rep("""    function sxCoin(text){""", """    /* 53.833 · 喂怪兽: a sorting box that just got a card chews (or spits it out) */
    function sxMonster(tid,good){if(mode!=='sorting')return;setTimeout(function(){var t=qa('[data-il-target]').filter(function(x){return x.dataset.ilTarget===tid;})[0];if(!t)return;var c=good?'chomp':'yuck';t.classList.remove('chomp','yuck');void t.offsetWidth;t.classList.add(c);setTimeout(function(){t.classList.remove(c);},950);},0);if(good)sxSfx('nom');}
    function sxCoin(text){""")
rep("""paint();if(placed.size===required())finish();""", """paint();sxMonster(tid,true);if(placed.size===required())finish();""")
rep("""info('还不对应，卡片已返回。再观察目标，或点提示。',false);""", """sxMonster(tid,false);info('还不对应，卡片已返回。再观察目标，或点提示。',false);""")

# ---- 5. 寻宝: the I Spy heap on a treasure map -------------------------------------------------------------------------------
rep("""      var P=session.findPile;
      return '<div class="spy-pile" style="--rows:'+P.rows+'" aria-label="I Spy 词海：在一堆词里找到它">'""",
    """      var P=session.findPile,REG=['🌴 椰林海滩','🌋 火山洞穴','🏴‍☠️ 骷髅岛','👑 宝藏神殿'],got=session.found.size,ri=Math.min(REG.length-1,Math.floor(got/3));
      var bar='<div class="spy-regions" aria-label="寻宝地图区域">'+REG.map(function(r,i){return '<span class="'+(i<ri?'done':i===ri?'now':'lock')+'">'+(i>ri?'🔒 ':'')+r+(i===ri?' · '+(got%3)+'/3':'')+'</span>';}).join('')+'</div>';
      return bar+'<div class="spy-pile spy-map" style="--rows:'+P.rows+'" aria-label="寻宝地图：在一堆词里找到它">'""")
rep("""          qa('[data-find-card]').forEach(function(x){ if (x.dataset.findCard === w.id) x.classList.add('pl-found'); });""",
    """          qa('[data-find-card]').forEach(function(x){ if (x.dataset.findCard === w.id) x.classList.add('pl-found'); });
          var pile = q('.spy-pile'); if (pile && b.classList.contains('spy-word')) { var loot = document.createElement('span'); loot.className = 'spy-loot'; loot.textContent = ['💰', '🔑', '🎁', '💎', '👑'][(session.found.size - 1) % 5]; loot.style.left = b.style.left; loot.style.top = b.style.top; pile.appendChild(loot); sxSfx('streak');
            if (session.found.size % 3 === 0 && session.found.size < session.total) { var REG = ['🌴 椰林海滩', '🌋 火山洞穴', '🏴‍☠️ 骷髅岛', '👑 宝藏神殿']; var nx = REG[Math.min(REG.length - 1, session.found.size / 3)]; pile.insertAdjacentHTML('beforeend', '<div class="spy-unlock">🗺 新区域解锁：' + nx + '</div>'); } }""")

# ---- drag3 (搭桥 / 拼火车) re-injected from its sources -----------------------------------------------------------------------
def swap(o, c, body):
    global s
    i = s.index(o); j = s.index(c, i); assert s.count(o) == 1
    s = s[:i + len(o)] + body + s[j:]
swap('<style id="teaching-drag3-style">', '</style>', (HERE / 'drag3.css').read_text(encoding='utf-8'))
swap('<script id="teaching-drag3">', '</script>', (HERE / 'drag3.js').read_text(encoding='utf-8'))

CSS = """<style id="teaching-toys">
/* ---- 6. 开门记忆 ---- */
#mn-templates .door-grid { perspective: 900px; }
#mn-templates .t809-match.door-grid > button.door { position: relative; min-height: 112px; padding: 0 !important; overflow: visible; background: #fef3c7 !important; border: 0 !important; border-radius: 12px !important; box-shadow: inset 0 0 0 6px #92400e, 0 6px 14px rgba(0,0,0,.18) !important; }
#mn-templates .door-in { position: absolute; inset: 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; color: #2e1065; font-weight: 900; font-size: 20px; text-align: center; }
#mn-templates .door-in small { font-size: 11px; color: #7c3aed; }
#mn-templates .door-in .sx-cue-img { max-height: 70px; margin: 0; }
#mn-templates .door-leaf { position: absolute; inset: 0; border-radius: 12px; transform-origin: left center; transition: transform .55s cubic-bezier(.3,1.2,.5,1); backface-visibility: hidden; z-index: 2;
  background: linear-gradient(90deg, rgba(0,0,0,.08), transparent 30%), repeating-linear-gradient(90deg, #b45309 0 18px, #a1440a 18px 20px); box-shadow: inset 0 0 0 4px #78350f, inset 0 -5px 0 rgba(0,0,0,.25); }
#mn-templates .door-leaf::before { content: ''; position: absolute; left: 14%; right: 14%; top: 12%; height: 30%; border: 3px solid rgba(120,53,15,.65); border-radius: 6px; }
#mn-templates .door-leaf::after { content: ''; position: absolute; right: 12px; top: 54%; width: 11px; height: 11px; border-radius: 50%; background: #fde047; box-shadow: 0 2px 0 #a16207; }
#mn-templates .door-leaf i { position: absolute; left: 0; right: 0; bottom: 14%; text-align: center; font-style: normal; font-weight: 900; font-size: 18px; color: #fde68a; text-shadow: 0 2px 0 rgba(0,0,0,.3); }
#mn-templates .door.door-open .door-leaf { transform: rotateY(-112deg); }
#mn-templates .door.tt-correct { box-shadow: inset 0 0 0 6px #16a34a, 0 0 0 3px #bbf7d0, 0 6px 14px rgba(0,0,0,.18) !important; background: #dcfce7 !important; }
#mn-templates .t809-match.door-grid .door-in .sx-cue-img.sx-cue-img, #mn-templates .t809-match.door-grid .door-in img { max-height: 62px !important; max-width: 88% !important; margin: 0 auto !important; border-width: 0 !important; }
/* ---- 2. 喂怪兽 ---- */
#mn-templates[data-activity="sorting"] .il-zones > .il-target.il-target.il-target { position: relative; padding-top: 86px !important; overflow: visible; border-radius: 28px 28px 20px 20px !important; }
#mn-templates[data-activity="sorting"] .il-zones > .il-target.il-target.il-target::before { content: ''; position: absolute; top: 12px; left: 50%; width: 72px; height: 26px; margin-left: -36px;
  background: radial-gradient(circle at 25% 50%, #1e1b4b 0 5px, #fff 6px 12px, transparent 13px), radial-gradient(circle at 75% 50%, #1e1b4b 0 5px, #fff 6px 12px, transparent 13px); transition: transform .2s; }
#mn-templates[data-activity="sorting"] .il-zones > .il-target.il-target.il-target::after { content: ''; position: absolute; top: 44px; left: 50%; width: 78px; height: 30px; margin-left: -39px; border-radius: 8px 8px 40px 40px;
  background: repeating-linear-gradient(90deg, #fff 0 9px, transparent 9px 13px) top / 100% 8px no-repeat, #3b0764; transform-origin: top center; }
#mn-templates[data-activity="sorting"] .il-target.chomp::after { animation: monChomp .9s ease; }
#mn-templates[data-activity="sorting"] .il-target.chomp { animation: monHappy .9s ease; }
#mn-templates[data-activity="sorting"] .il-target.yuck { animation: monShake .6s ease; }
#mn-templates[data-activity="sorting"] .il-target.yuck::after { height: 8px; border-radius: 6px; background: #3b0764; }
#mn-templates[data-activity="sorting"] .il-target.yuck::before { transform: scaleY(.4); }
@keyframes monChomp { 0%, 100% { transform: scaleY(1); } 15%, 45%, 75% { transform: scaleY(.15); } 30%, 60% { transform: scaleY(1.1); } }
@keyframes monHappy { 0%, 100% { transform: none; } 40% { transform: scale(1.06) rotate(-2deg); } 70% { transform: scale(1.03) rotate(2deg); } }
@keyframes monShake { 20%, 60% { transform: rotate(-6deg); } 40%, 80% { transform: rotate(6deg); } }
/* ---- 1. 拼图配对 ---- */
#mn-templates[data-activity="dragmatching"] [data-il-stage] .il-target.il-target { position: relative; border-radius: 14px !important; background: #fff !important;
  -webkit-mask: radial-gradient(circle at 0 50%, transparent 15px, #000 16px); mask: radial-gradient(circle at 0 50%, transparent 15px, #000 16px); padding-left: 20px !important; }
#mn-templates[data-activity="dragmatching"] .il-bank .il-source { position: relative; overflow: visible; margin-right: 16px; border: 0 !important; border-radius: 14px !important; background: #fde68a !important; color: #78350f !important; box-shadow: inset 0 -4px 0 #d97706 !important; }
#mn-templates[data-activity="dragmatching"] .il-bank .il-source::after { content: ''; position: absolute; right: -14px; top: 50%; width: 28px; height: 28px; margin-top: -14px; border-radius: 50%; background: #fde68a; box-shadow: inset -3px -3px 0 #d97706; }
#mn-templates[data-activity="dragmatching"] [data-il-stage] .il-target.il-target .tt-good { display: inline-block; margin-top: 6px; padding: 4px 10px 4px 22px; border-radius: 10px; background: #fde68a; color: #78350f; position: relative; animation: pzSnap .4s cubic-bezier(.3,1.6,.5,1); }
#mn-templates[data-activity="dragmatching"] [data-il-stage] .il-target.il-target .tt-good::before { content: '🧩'; position: absolute; left: 4px; }
@keyframes pzSnap { 0% { transform: translateX(-30px) scale(.8); } 100% { transform: none; } }
/* ---- 5. 寻宝 ---- */
#mn-templates .spy-regions { display: flex; flex-wrap: wrap; gap: 6px; margin: 0 0 8px; }
#mn-templates .spy-regions span { padding: 5px 10px; border-radius: 999px; font-size: 13px; font-weight: 900; background: rgba(255,255,255,.18); color: #fff; }
#mn-templates .spy-regions span.now { background: #fde047; color: #713f12; box-shadow: 0 3px 0 #a16207; }
#mn-templates .spy-regions span.done { background: #22c55e; }
#mn-templates .spy-regions span.lock { opacity: .6; }
#mn-templates .spy-pile.spy-map { background:
    radial-gradient(circle at 12% 18%, rgba(34,197,94,.35) 0 9%, transparent 10%), radial-gradient(circle at 88% 82%, rgba(14,165,233,.35) 0 12%, transparent 13%),
    radial-gradient(circle at 80% 14%, rgba(120,53,15,.18) 0 6%, transparent 7%),
    linear-gradient(135deg, transparent 47%, rgba(185,28,28,.45) 47% 53%, transparent 53%) 85% 80% / 26px 26px no-repeat, linear-gradient(45deg, transparent 47%, rgba(185,28,28,.45) 47% 53%, transparent 53%) 85% 80% / 26px 26px no-repeat,
    radial-gradient(ellipse at center, #fde9b8 0%, #f5d38a 70%, #e3b866 100%) !important;
  box-shadow: inset 0 0 0 4px #fff7e0, inset 0 0 40px rgba(120,53,15,.35), 0 7px 0 rgba(120,53,15,.45) !important; }
#mn-templates .spy-loot { position: absolute; z-index: 20; transform: translate(-50%, -50%); font-size: 30px; pointer-events: none; animation: lootPop 1.1s cubic-bezier(.2,1.5,.4,1) forwards; }
#mn-templates .spy-unlock { position: absolute; left: 50%; top: 50%; z-index: 30; transform: translate(-50%, -50%); padding: 10px 18px; border-radius: 16px; background: #fde047; color: #713f12; font-weight: 900; font-size: 18px; box-shadow: 0 5px 0 #a16207; white-space: nowrap; animation: unlockPop 1.8s ease forwards; pointer-events: none; }
@keyframes lootPop { 0% { transform: translate(-50%, -20%) scale(.2); opacity: 0; } 40% { transform: translate(-50%, -110%) scale(1.3); opacity: 1; } 100% { transform: translate(-50%, -90%) scale(1); opacity: 1; } }
@keyframes unlockPop { 0% { transform: translate(-50%, -50%) scale(.6); opacity: 0; } 15%, 80% { transform: translate(-50%, -50%) scale(1); opacity: 1; } 100% { opacity: 0; } }
@media (prefers-reduced-motion: reduce) { #mn-templates .door-leaf { transition: none; } #mn-templates .spy-loot, #mn-templates .spy-unlock, #mn-templates[data-activity="sorting"] .il-target { animation: none !important; } }
</style>
"""
rep('</head>', CSS + '</head>')

SRC.write_text(s, encoding='utf-8')
for c in COPIES:
    shutil.copyfile(SRC, ROOT / c)
print('patched toys: doors, monsters, puzzle, treasure (+ drag3 re-injected)')
