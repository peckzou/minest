"""Teaching games · 生词转盘 spins for real · I Spy becomes 词海寻宝 (find it in a heap of words) · the wheel joins the Solo map.
Applied in place to iPhone53.8241.html, then copied to iphone.html, index.html and the iOS copies.

1. 生词转盘 (wordwheel): an SVG wheel, up to 10 words a page, one Blooket-coloured wedge each with its word along the radius.
   Tap 转动 (or the wheel): ~5 turns in 3.6 s, easing out, a tick at every wedge, stopping on the drawn word (still no
   repeats). The word it stops on is read aloud in Chinese; tap the big word (or its wedge) to hear it again.
2. I Spy (find): new default view 词海寻宝 — the list's words lie in a heap (each 1–3 times, big and small, tilted, in
   colours, overlapping a little); find the one the clue means. Every copy of the right word counts. The heap stays put for
   the session; found words turn green. The card views (图文词卡 / 只看文字 / 只看配图) are still in the view menu.
3. Solo map: 生词转盘 is level 11 (after Reveal); the drag games after it are numbered 12–15.
"""
from pathlib import Path
import shutil, sys

ROOT = Path('/Users/cece/Documents/minest'); HERE = ROOT / 'tools/live-perf'
SRC = ROOT / 'iPhone53.8241.html'
COPIES = ['iphone.html', 'index.html', 'ios/Minest/Minest/iphone.html', 'ios/MinestProject/MyApp/iphone.html', 'ios/Minest/Minest/iphone18.0.html', 'ipad.html', 'ios/Minest/Minest/ipad.html']
s = SRC.read_text(encoding='utf-8')
if 'function spyPile(' in s:
    sys.exit('already patched')

def rep(a, b, n=1):
    global s
    c = s.count(a); assert c == n, (a[:100], c, n); s = s.replace(a, b)

# ---- 1. the wheel -------------------------------------------------------------------------------------------------------
a = s.index('    function classroomWheel(w){')
b = s.index('    function newRound(){', a)
old = s[a:b]
assert old.count('function classroomWheel(') == 1
WHEEL = r"""    function classroomWheel(w){
      // 53.831: a wheel that really spins (SVG). Up to 10 words a page; it eases to a stop on the drawn word (no repeats),
      // ticking at every wedge; the word is read aloud in Chinese, and tapping it (or its wedge) reads it again.
      var per=10,pageStart=Math.floor(session.round/per)*per,cards=session.queue.slice(pageStart,pageStart+per),index=cards.indexOf(w);
      if(index<0){cards=[w].concat(cards.filter(function(c){return c.id!==w.id;}).slice(0,per-1));index=0;}
      var n=cards.length,step=360/n,R=150,C=160,spinning=false,landed=false,raf=0,
          colors=['#ffa31e','#00b8f0','#4bc22e','#ff5a3c','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#3b82f6','#ef4444'];
      function pt(a,r){var t=(a-90)*Math.PI/180;return [C+r*Math.cos(t),C+r*Math.sin(t)];}
      function say(){if(options.chinese&&typeof sxSayNow==='function'&&!sxMuted())sxSayNow(w.front);else sayText(w.front,q('[data-class-winner]'));}
      var disc='<svg class="wh-disc" data-wheel-disc viewBox="0 0 320 320" role="img" aria-label="生词转盘">'+cards.map(function(c,i){
          var a0=i*step,a1=(i+1)*step,p0=pt(a0,R),p1=pt(a1,R),mid=(i+.5)*step,lp=pt(mid,R*.6),len=Array.from(c.front).length,
              fs=Math.max(11,Math.min(26,Math.floor((n>6?118:140)/Math.max(2.2,len*(/[㐀-鿿]/.test(c.front)?1:.62))))),rot=mid>180?mid+90:mid-90;
          var path=n===1?'M'+C+' '+(C-R)+' A'+R+' '+R+' 0 1 1 '+(C-.01)+' '+(C-R)+' Z':'M'+C+' '+C+' L'+p0[0].toFixed(1)+' '+p0[1].toFixed(1)+' A'+R+' '+R+' 0 '+(step>180?1:0)+' 1 '+p1[0].toFixed(1)+' '+p1[1].toFixed(1)+' Z';
          return '<g data-wheel-i="'+i+'"><path d="'+path+'" fill="'+colors[i%colors.length]+'"/><text x="'+lp[0].toFixed(1)+'" y="'+lp[1].toFixed(1)+'" font-size="'+fs+'" text-anchor="middle" dominant-baseline="central" transform="rotate('+rot.toFixed(1)+' '+lp[0].toFixed(1)+' '+lp[1].toFixed(1)+')">'+esc(c.front)+'</text></g>';
        }).join('')+'<circle cx="'+C+'" cy="'+C+'" r="'+R+'" fill="none" stroke="#fff" stroke-width="7"/></svg>';
      frame('<p class="wh-note">本页 '+n+' 个词 · 不重复抽取 · 第 '+(session.round+1)+' / '+session.total+' 次</p><div class="wh-wrap"><span class="wh-pointer" aria-hidden="true"></span>'+disc+'<button type="button" class="wh-spin" data-class-spin aria-label="转动生词转盘">转动</button></div>'
        +'<div data-class-winner class="cl818-winner" role="status">点「转动」，看看抽到哪个生词。</div>'
        +'<div data-class-task hidden><div class="tt-row"><button data-class-speak>🔊 再听一遍</button><button data-class-check>先说词义，再翻面核对</button></div><p>跟读 → 自己说出意思 → 用这个词说一句话或做动作。</p><div data-class-wheel-review></div></div>','转盘停在哪个词，就学哪个词：点它听中文发音，跟读，再说出意思。');
      var svg=q('[data-wheel-disc]'),angle=session.wheelAngle&&session.wheelPage===pageStart?session.wheelAngle:0;session.wheelPage=pageStart;svg.style.transform='rotate('+angle+'deg)';
      function spin(){
        if(spinning||landed)return;spinning=true;q('[data-class-spin]').disabled=true;
        var mid=(index+.5)*step,base=((-mid-angle)%360+360)%360,target=angle+5*360+base+(Math.random()-.5)*step*.5,from=angle,
            dur=matchMedia('(prefers-reduced-motion: reduce)').matches?0:3600,t0=performance.now(),lastTick=Math.floor((from+step/2)/step),lastSound=0;
        function frameStep(now){
          var p=dur?Math.min(1,(now-t0)/dur):1,e=1-Math.pow(1-p,4);angle=from+(target-from)*e;svg.style.transform='rotate('+angle+'deg)';
          var tick=Math.floor((angle+step/2)/step);if(tick!==lastTick&&now-lastSound>45){lastTick=tick;lastSound=now;sxSfx('click');}
          if(p<1){raf=requestAnimationFrame(frameStep);return;}
          spinning=false;landed=true;session.wheelAngle=angle%360;
          var g=svg.querySelector('[data-wheel-i="'+index+'"]');if(g)g.classList.add('win');
          q('[data-class-winner]').innerHTML='<button type="button" class="wh-winner" data-wheel-say aria-label="听「'+esc(w.front)+'」的中文发音">'+word(w,true)+'<small>🔊 点我听中文</small></button>';
          q('[data-class-task]').hidden=false;sxSfx('correct');say();
          bind('[data-wheel-say]',function(){say();this.classList.remove('hop');void this.offsetWidth;this.classList.add('hop');});
        }
        raf=requestAnimationFrame(frameStep);
      }
      bind('[data-class-spin]',spin);
      svg.onclick=function(ev){if(!landed){spin();return;}var g=ev.target.closest&&ev.target.closest('[data-wheel-i]');if(g&&+g.getAttribute('data-wheel-i')===index)say();};
      bind('[data-class-speak]',function(){say();});bind('[data-class-check]',function(){this.disabled=true;var out=q('[data-class-wheel-review]');out.innerHTML='<p>'+word(w)+(w.back?' · '+esc(w.back):'（本卡暂无释义，可先练习朗读。）')+'</p>';selfCheck(w,out);});
    }
"""
s = s[:a] + WHEEL + s[b:]

# ---- 2. I Spy: the heap of words ------------------------------------------------------------------------------------
SPY = r"""    /* 53.831 · I Spy 词海寻宝: the words lie in a heap — each one to three times, big and small, tilted, in colours,
       overlapping a little — and the learner finds the one the clue means. The heap stays put for the session. */
    function spyPile(layout){
      var key=layout.map(function(c){return c.id;}).join('|');
      if(!session.findPile||session.findPile.key!==key){
        var copies=layout.length<=6?3:layout.length<=14?2:1,list=[];
        layout.forEach(function(c){for(var k=0;k<copies;k++)list.push(c);});list=mix(list);
        var n=list.length,cols=Math.max(3,Math.round(Math.sqrt(n*1.25))),rows=Math.ceil(n/cols),cells=mix(Array.from({length:cols*rows},function(_,i){return i;})).slice(0,n),
            palette=['#7c3aed','#0891b2','#16a34a','#ea580c','#db2777','#2563eb','#b45309','#dc2626'],sizes=[17,21,25,30,36];
        session.findPile={key:key,rows:rows,items:list.map(function(c,i){var cell=cells[i],cx=cell%cols,cy=Math.floor(cell/cols),len=Array.from(c.front).length,big=sizes[Math.floor(Math.random()*sizes.length)];
          return {id:c.id,front:c.front,x:12+(cx+.5+(Math.random()-.5)*.5)/cols*76,y:9+(cy+.5+(Math.random()-.5)*.45)/rows*82,rot:Math.round((Math.random()-.5)*44),
            size:Math.round(big*(len>6?.62:len>4?.8:1)),color:palette[Math.floor(Math.random()*palette.length)],z:1+Math.floor(Math.random()*4)};})};
      }
      var P=session.findPile;
      return '<div class="spy-pile" style="--rows:'+P.rows+'" aria-label="I Spy 词海：在一堆词里找到它">'+P.items.map(function(it){var found=session.found.has(it.id);
        return '<button type="button" class="spy-word'+(found?' pl-found':'')+'" data-find-card="'+esc(it.id)+'" style="left:'+it.x.toFixed(1)+'%;top:'+it.y.toFixed(1)+'%;--rot:'+it.rot+'deg;font-size:'+it.size+'px;--c:'+it.color+';z-index:'+it.z+'"'+(found?' disabled':'')+'>'+esc(it.front)+'</button>';}).join('')+'</div>';
    }

    function findIt(w){"""
rep("""    function findIt(w){""", SPY)
rep("""var findView = session.findView || (options.chinese && clueMode === 'visual' ? 'text' : 'both');""",
    """var findView = session.findView || 'pile';   /* 53.831: a heap of words by default */""")
rep("""+ '<option value="both"' + (findView === 'both' ? ' selected' : '') + '>图文词卡</option>'""",
    """+ '<option value="pile"' + (findView === 'pile' ? ' selected' : '') + '>词海寻宝</option>'
        + '<option value="both"' + (findView === 'both' ? ' selected' : '') + '>图文词卡</option>'""")
rep("""+ '<div class="pl-spy-field pl-spy-' + findView + '" aria-label="I Spy 整片词卡">'""",
    """+ (findView === 'pile' ? spyPile(layout) : '<div class="pl-spy-field pl-spy-' + findView + '" aria-label="I Spy 整片词卡">'""")
rep("""          }).join('')
        + '</div>'
        + '<div data-find-association></div>',""", """          }).join('')
        + '</div>')
        + '<div data-find-association></div>',""")
rep("""从下面 ' + layout.length + ' 张词卡里找到目标（剩余 ' + (layout.length - session.found.size) + ' 张未找）。</p>'""",
    """' + (findView === 'pile' ? '在下面的词海里找到它（还剩 ' + (layout.length - session.found.size) + ' 个词没找）。' : '从下面 ' + layout.length + ' 张词卡里找到目标（剩余 ' + (layout.length - session.found.size) + ' 张未找）。') + '</p>'""")
# every copy of the right word lights up; the Chinese reading comes from the cue layer (no double reading)
rep("""          answered(true, w.front);
          sayText(w.front);
          session.found.add(w.id);""", """          answered(true, w.front);
          if (!options.chinese) sayText(w.front);
          session.found.add(w.id);
          qa('[data-find-card]').forEach(function(x){ if (x.dataset.findCard === w.id) x.classList.add('pl-found'); });""")

# ---- 3. the Solo map: the wheel is level 11 ------------------------------------------------------------------------------
rep("""  ['reveal','🎁','Reveal · 揭格猜词','逐格拆开神秘礼盒，尽早猜出答案','揭格 → 回忆 → 核对']
];""", """  ['reveal','🎁','Reveal · 揭格猜词','逐格拆开神秘礼盒，尽早猜出答案','揭格 → 回忆 → 核对'],
  ['wordwheel','🎡','Word Wheel · 生词转盘','转动转盘抽生词，点词听中文发音','转动 → 听读 → 说意思']
];""")
rep("""(11 + i) + '. '""", """(12 + i) + '. '""")

CSS = """<style id="teaching-wheel-spy">
/* 53.831 · 生词转盘 */
#mn-templates .wh-note { text-align: center; margin: 0 0 4px; }
#mn-templates .wh-wrap { position: relative; width: min(100%, 380px); margin: 18px auto 6px; aspect-ratio: 1; }
#mn-templates .wh-disc { width: 100%; height: 100%; display: block; border-radius: 50%; cursor: pointer; touch-action: manipulation; filter: drop-shadow(0 8px 0 rgba(46,16,101,.35)) drop-shadow(0 16px 24px rgba(0,0,0,.18)); will-change: transform; }
#mn-templates .wh-disc path { stroke: #fff; stroke-width: 2.5; }
#mn-templates .wh-disc text { fill: #fff; font-weight: 900; font-family: "Nunito", "PingFang SC", system-ui, sans-serif; paint-order: stroke; stroke: rgba(0,0,0,.22); stroke-width: 3px; pointer-events: none; }
#mn-templates .wh-disc g.win path { stroke: #fde047; stroke-width: 7; }
#mn-templates .wh-pointer { position: absolute; top: -14px; left: 50%; transform: translateX(-50%); z-index: 3; width: 0; height: 0; border-left: 17px solid transparent; border-right: 17px solid transparent; border-top: 34px solid #fde047; filter: drop-shadow(0 3px 0 rgba(0,0,0,.3)); pointer-events: none; }
#mn-templates .wh-spin { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 2; width: 78px; height: 78px; min-height: 0; padding: 0; border-radius: 50%; border: 5px solid #fff; background: #6d28d9; color: #fff; font: 900 17px/1 "Nunito", "PingFang SC", system-ui, sans-serif; box-shadow: 0 5px 0 #3b0764; cursor: pointer; }
#mn-templates .wh-spin:disabled { opacity: 1; background: #a78bfa; }
#mn-templates .wh-winner { display: inline-flex; flex-direction: column; align-items: center; gap: 2px; margin: 4px auto; padding: 12px 28px 10px; border: 0; border-radius: 22px; background: #fff; color: #2e1065; font-size: clamp(32px, 9vw, 54px); font-weight: 900; box-shadow: 0 6px 0 rgba(46,16,101,.4); cursor: pointer; animation: whPop .45s cubic-bezier(.2,1.5,.4,1); }
#mn-templates .wh-winner small { font-size: 14px; color: #7c3aed; font-weight: 800; }
#mn-templates .wh-winner rt { font-size: .36em; color: #7c3aed; }
#mn-templates .wh-winner.hop { animation: whPop .4s ease; }
#mn-templates [data-class-winner] { text-align: center; }
#mn-templates .wh-wrap > .wh-spin.wh-spin { left: calc(50% - 39px) !important; top: calc(50% - 39px) !important; transform: none !important; margin: 0 !important; }
#mn-templates [data-class-winner] .wh-winner.wh-winner { font-size: clamp(34px, 10vw, 56px) !important; line-height: 1.1 !important; padding: 12px 30px 10px !important; min-width: 60%; }
#mn-templates .wh-winner ruby { font-size: 1em; }
#mn-templates .wh-winner .sx-say { width: 30px; height: 30px; }
#mn-templates .wh-wrap > .wh-spin.wh-spin { width: 78px !important; height: 78px !important; border-radius: 50% !important; border: 5px solid #fff !important; background: #6d28d9 !important; color: #fff !important; opacity: 1 !important; box-shadow: 0 5px 0 #3b0764 !important; padding: 0 !important; }
#mn-templates .wh-wrap > .wh-spin.wh-spin:disabled { background: #a78bfa !important; }
@keyframes whPop { 0% { transform: scale(.7); } 70% { transform: scale(1.06); } 100% { transform: none; } }
/* 53.831 · I Spy 词海寻宝 */
#mn-templates .spy-pile { position: relative; height: calc(var(--rows) * 60px + 50px); min-height: 280px; margin: 0 0 14px; border-radius: 22px; overflow: hidden;
  background: radial-gradient(circle at 20% 15%, #fff7d6 0 18%, transparent 19%), radial-gradient(circle at 85% 80%, #e0f2fe 0 22%, transparent 23%), repeating-linear-gradient(35deg, #fffdf6 0 14px, #fff8e6 14px 28px);
  box-shadow: inset 0 0 0 4px #fff, 0 7px 0 rgba(46,16,101,.35); }
#mn-templates .spy-word { position: absolute; transform: translate(-50%, -50%) rotate(var(--rot)); margin: 0; padding: 2px 6px; min-height: 0; border: 0; border-radius: 10px; background: transparent; color: var(--c); font-family: "Nunito", "PingFang SC", system-ui, sans-serif; font-weight: 900; line-height: 1.05; white-space: nowrap; cursor: pointer; box-shadow: none;
  text-shadow: 0 2px 0 #fff, 2px 0 0 #fff, -2px 0 0 #fff, 0 -2px 0 #fff; transition: transform .15s; }
#mn-templates .spy-word:hover:not(:disabled) { transform: translate(-50%, -50%) rotate(var(--rot)) scale(1.15); z-index: 9 !important; }
#mn-templates .spy-word.pl-miss { animation: spyMiss .45s ease; color: #ef4444; }
#mn-templates .spy-word.pl-found { background: #22c55e; color: #fff; text-shadow: none; z-index: 10 !important; box-shadow: 0 4px 0 #15803d; transform: translate(-50%, -50%) rotate(0deg) scale(1.12); }
#mn-templates .spy-word:disabled:not(.pl-found) { opacity: .55; cursor: default; }
#mn-templates .spy-pile > .spy-word.spy-word { background: transparent !important; border: 0 !important; box-shadow: none !important; padding: 2px 6px !important; min-height: 0 !important; width: auto !important; color: var(--c) !important; border-radius: 10px !important; }
#mn-templates .spy-pile > .spy-word.spy-word.pl-found { background: #22c55e !important; color: #fff !important; box-shadow: 0 4px 0 #15803d !important; }
#mn-templates .spy-pile > .spy-word.spy-word.pl-miss { color: #ef4444 !important; }
@keyframes spyMiss { 20%, 60% { transform: translate(-56%, -50%) rotate(var(--rot)); } 40%, 80% { transform: translate(-44%, -50%) rotate(var(--rot)); } }
@media (prefers-reduced-motion: reduce) { #mn-templates .wh-winner, #mn-templates .spy-word { animation: none !important; transition: none !important; } }
</style>
"""
rep('</head>', CSS + '</head>')
rep('</head>', '''<style id="teaching-solo-focus">
/* 53.831 · Solo map games: the activity's own title, note, 批量配图 / 本卡配图 and mode pills stay out of the way */
#mn-templates.tt-quest824[data-ten-view="game"] .tt-panel > .tt-row:first-child,
#mn-templates.tt-quest824[data-ten-view="game"] .tt-panel > p.tt-muted:nth-of-type(1),
#mn-templates.tt-quest824[data-ten-view="game"] .tt-pill-bar,
#mn-templates.tt-quest824[data-ten-view="game"] [data-open-wall-spy],
#mn-templates.tt-quest824[data-ten-view="game"] [data-inline-quick-img] { display: none !important; }
</style>
''' + '</head>')

SRC.write_text(s, encoding='utf-8')
for c in COPIES:
    shutil.copyfile(SRC, ROOT / c)
d3 = HERE / 'drag3.js'
t = d3.read_text(encoding='utf-8')
if "(11 + i) + '. '" in t:
    d3.write_text(t.replace("(11 + i) + '. '", "(12 + i) + '. '"), encoding='utf-8')
print('patched wheel + I Spy heap + Solo map level 11')
