"""Teaching games · Listen & Tap becomes 听音钓鱼 (fishing) · Sorting gets Blooket bins · both join the Solo map.
Applied in place to iPhone53.8241.html, then copied to iphone.html, index.html and the iOS copies.
(🔑 配对开锁 is a new game in tools/live-perf/drag3.js; this script re-injects drag3.js / drag3.css too.)

1. Listen & Tap → 听音钓鱼: a pond with six fish, each carrying a word, swimming across at their own speed. The word is read
   (Chinese voice when the device has one); tap the fish that carries it — the line drops and the fish is reeled up out of
   the water. A wrong fish wriggles and darts off. 🔊 hears it again; 文字提示 shows the meaning (counted as help).
2. Sorting: the category boxes are Blooket-coloured bins (the cards already sorted sit inside, as chips); the cards to
   sort are compact chips, three to a row.
3. Solo map: Sorting is level 12, 听音钓鱼 level 13; the drag games after them renumber themselves (14 on).
"""
from pathlib import Path
import shutil, sys

ROOT = Path('/Users/cece/Documents/minest'); HERE = ROOT / 'tools/live-perf'
SRC = ROOT / 'iPhone53.8241.html'
COPIES = ['iphone.html', 'index.html', 'ios/Minest/Minest/iphone.html', 'ios/MinestProject/MyApp/iphone.html', 'ios/Minest/Minest/iphone18.0.html', 'ipad.html', 'ios/Minest/Minest/ipad.html']
s = SRC.read_text(encoding='utf-8')
if 'fish-pond' in s:
    sys.exit('already patched')

def rep(a, b, n=1):
    global s
    c = s.count(a); assert c == n, (a[:100], c, n); s = s.replace(a, b)

a = s.index('    function listenTap(w){')
b = s.index('    function makeBingoBatches(', a)
FISH = r"""    function listenTap(w){
      // 53.832 · 听音钓鱼: six fish carry words across a pond; hear the word, tap its fish — it is reeled up out of the water.
      var choices=mix([w].concat(mix(pool.unique.filter(function(c){return c.id!==w.id;})).slice(0,5))),played=false,colors=['#ffa31e','#00b8f0','#4bc22e','#ff5a3c','#8b5cf6','#ec4899'];
      function hear(){if(options.chinese&&typeof sxSayNow==='function'&&!sxMuted())sxSayNow(w.front);else sayText(w.front,q('[data-listen-status]'));}
      frame('<div class="fish-top"><button class="tt-primary fish-play" data-listen-play>🔊 听词语</button><button class="fish-help" data-listen-text>文字提示</button></div>'
        +'<p data-listen-status class="fish-status" role="status">听到哪个词，就钓哪条鱼！</p><p data-listen-fallback class="fish-fallback" hidden>'+esc(w.back)+'</p>'
        +'<div class="fish-pond" data-fish-pond><span class="fish-line" data-fish-line aria-hidden="true"></span>'+choices.map(function(c,i){var dur=(10+Math.random()*7).toFixed(1),dir=i%2?'rtl':'ltr';
          return '<button type="button" class="fish fish-'+dir+'" data-listen-choice="'+esc(c.id)+'" disabled style="--lane:'+i+';--dur:'+dur+'s;--delay:-'+(Math.random()*dur).toFixed(1)+'s;--fc:'+colors[i%colors.length]+'" aria-label="鱼：'+esc(c.front)+'"><span class="fish-body"><b>'+esc(c.front)+'</b></span></button>';}).join('')
        +'<span class="fish-weed w1"></span><span class="fish-weed w2"></span><span class="fish-weed w3"></span></div>',
        '听读音，点那条鱼把它钓上来。读音只用于听辨；文字提示会记为辅助完成。');
      later(450,function(){var lb=q('[data-listen-play]');if(lb&&!played)lb.click();});
      bind('[data-listen-play]',function(){played=true;hear();qa('[data-listen-choice]').forEach(function(b){b.disabled=false;});});
      bind('[data-listen-text]',function(){hintUsed('听音改用文字提示');q('[data-listen-fallback]').hidden=false;played=true;qa('[data-listen-choice]').forEach(function(b){b.disabled=false;});this.disabled=true;});
      qa('[data-listen-choice]').forEach(function(b){b.onclick=function(){
        if(!played||session.counted)return;
        var good=b.dataset.listenChoice===w.id;
        if(!good){answered(false,w.front);b.classList.remove('fish-miss');void b.offsetWidth;b.classList.add('fish-miss');q('[data-listen-status]').textContent='不是这条，鱼跑了！再听一遍。';return;}
        if(answered(true,w.front)){
          // freeze the fish where it is, drop the line onto it, then reel it up
          var pond=q('[data-fish-pond]'),pr=pond.getBoundingClientRect(),br=b.getBoundingClientRect(),m=getComputedStyle(b).transform,line=q('[data-fish-line]');
          b.style.animation='none';b.style.transform=m==='none'?'':m;b.classList.add('fish-hooked');
          line.style.left=(br.left-pr.left+br.width/2)+'px';line.style.height=(br.top-pr.top+br.height/2)+'px';line.classList.add('on');
          later(380,function(){b.classList.add('fish-caught');b.style.transform=(m==='none'?'':m)+' translateY(-'+(br.top-pr.top+br.height+40)+'px) rotate(-18deg)';line.style.height='0px';});
          qa('[data-listen-choice]').forEach(function(x){x.disabled=true;});
          q('[data-listen-status]').innerHTML='🎣 钓到了：'+word(w);
        }
      };});
    }
"""
s = s[:a] + FISH + s[b:]

# the Solo map: Sorting (12) and 听音钓鱼 (13)
rep("""  ['wordwheel','🎡','Word Wheel · 生词转盘','转动转盘抽生词，点词听中文发音','转动 → 听读 → 说意思']
];""", """  ['wordwheel','🎡','Word Wheel · 生词转盘','转动转盘抽生词，点词听中文发音','转动 → 听读 → 说意思'],
  ['sorting','🗂','Sorting · 分类大挑战','把词卡拖进正确的分类箱','拖拽 / 点选归类'],
  ['listen','🎣','Fishing · 听音钓鱼','听到哪个词，就点那条鱼钓上来','听 → 找 → 钓']
];""")

# drag3 (🔑 配对开锁 + map numbering) re-injected from its sources
def swap(o, c, body):
    global s
    i = s.index(o); j = s.index(c, i); assert s.count(o) == 1
    s = s[:i + len(o)] + body + s[j:]
swap('<style id="teaching-drag3-style">', '</style>', (HERE / 'drag3.css').read_text(encoding='utf-8'))
swap('<script id="teaching-drag3">', '</script>', (HERE / 'drag3.js').read_text(encoding='utf-8'))

CSS = """<style id="teaching-fish-sort">
/* 53.832 · 听音钓鱼 */
#mn-templates .fish-top { display: flex; gap: 10px; justify-content: center; align-items: center; margin: 0 0 8px; }
#mn-templates .fish-top .fish-play { min-height: 52px; padding: 10px 22px; border-radius: 18px; border: 0; font-size: 19px; font-weight: 900; background: #fff; color: #6d28d9; box-shadow: inset 0 -5px 0 #c4b5fd; }
#mn-templates .fish-top .fish-help { min-height: 44px; padding: 8px 14px; border-radius: 14px; border: 0; font-weight: 800; background: rgba(255,255,255,.2); color: #fff; }
#mn-templates .fish-status { text-align: center; font-weight: 900; font-size: 17px; margin: 0 0 8px; }
#mn-templates .fish-fallback { text-align: center; font-weight: 800; background: #fff; color: #2e1065 !important; border-radius: 12px; padding: 6px 10px; }
#mn-templates .fish-pond { position: relative; height: 380px; margin: 0 0 14px; border-radius: 26px; overflow: hidden;
  background: radial-gradient(120% 60% at 50% -10%, rgba(255,255,255,.55) 0 30%, transparent 31%), linear-gradient(180deg, #7dd3fc 0%, #0ea5e9 45%, #0369a1 100%);
  box-shadow: inset 0 10px 0 rgba(255,255,255,.25), 0 7px 0 rgba(3,105,161,.6); }
#mn-templates .fish-pond::before { content: ''; position: absolute; left: 0; right: 0; top: 0; height: 22px; background: repeating-radial-gradient(circle at 20px -6px, rgba(255,255,255,.55) 0 14px, transparent 15px 40px); opacity: .7; }
#mn-templates .fish-pond > .fish.fish { position: absolute; left: 0; top: calc(30px + var(--lane) * 56px); margin: 0; padding: 0; min-height: 0; width: auto; border: 0 !important; background: none !important; box-shadow: none !important; cursor: pointer;
  animation: fishSwim var(--dur) linear var(--delay) infinite; will-change: transform; z-index: 2; }
#mn-templates .fish-pond > .fish.fish-rtl { animation-name: fishSwimBack; }
#mn-templates .fish-body { position: relative; display: inline-flex; align-items: center; justify-content: center; min-width: 96px; height: 46px; padding: 0 18px 0 14px; border-radius: 50% 46% 46% 50% / 60% 50% 50% 60%; background: var(--fc); box-shadow: inset 0 -5px 0 rgba(0,0,0,.18), 0 4px 10px rgba(0,0,0,.18); animation: fishBob 1.6s ease-in-out infinite; }
#mn-templates .fish-body::after { content: ''; position: absolute; right: -22px; top: 50%; margin-top: -16px; border-top: 16px solid transparent; border-bottom: 16px solid transparent; border-left: 26px solid var(--fc); }
#mn-templates .fish-body::before { content: ''; position: absolute; left: 10px; top: 13px; width: 9px; height: 9px; border-radius: 50%; background: #fff; box-shadow: inset 2px 0 0 3px #1e1b4b; }
#mn-templates .fish-rtl .fish-body { padding: 0 14px 0 18px; border-radius: 46% 50% 50% 46% / 50% 60% 60% 50%; }
#mn-templates .fish-rtl .fish-body::after { right: auto; left: -22px; border-left: 0; border-right: 26px solid var(--fc); }
#mn-templates .fish-rtl .fish-body::before { left: auto; right: 10px; }
#mn-templates .fish-body b { position: relative; z-index: 1; color: #fff; font-size: 20px; font-weight: 900; white-space: nowrap; text-shadow: 0 2px 0 rgba(0,0,0,.2); padding-left: 10px; }
#mn-templates .fish-rtl .fish-body b { padding-left: 0; padding-right: 10px; }
#mn-templates .fish-pond > .fish:disabled:not(.fish-caught) { cursor: default; }
#mn-templates .fish.fish-miss .fish-body { animation: fishMiss .5s ease; filter: grayscale(.4); }
#mn-templates .fish.fish-hooked { z-index: 5; }
#mn-templates .fish.fish-caught { transition: transform .9s cubic-bezier(.5,-0.3,.7,1); }
#mn-templates .fish.fish-caught .fish-body { animation: fishFlap .25s ease-in-out infinite; box-shadow: 0 0 0 4px #fde047, 0 6px 14px rgba(0,0,0,.25); }
#mn-templates .fish-line { position: absolute; top: 0; left: 50%; width: 3px; height: 0; background: linear-gradient(#f8fafc, #cbd5e1); z-index: 4; transition: height .38s ease-out, left 0s; pointer-events: none; }
#mn-templates .fish-line.on::after { content: '🪝'; position: absolute; bottom: -14px; left: -9px; font-size: 18px; }
#mn-templates .fish-weed { position: absolute; bottom: -10px; width: 26px; height: 90px; border-radius: 50% 50% 0 0; background: #15803d; opacity: .75; z-index: 1; transform-origin: bottom; animation: weed 3s ease-in-out infinite; }
#mn-templates .fish-weed.w1 { left: 8%; } #mn-templates .fish-weed.w2 { left: 46%; height: 70px; animation-delay: -1s; } #mn-templates .fish-weed.w3 { right: 10%; height: 110px; animation-delay: -2s; }
@keyframes fishSwim { from { transform: translateX(-140px); } to { transform: translateX(calc(100vw)); } }
@keyframes fishSwimBack { from { transform: translateX(calc(100vw)); } to { transform: translateX(-140px); } }
@keyframes fishBob { 50% { transform: translateY(-5px); } }
@keyframes fishMiss { 20% { transform: translateX(-10px) rotate(-8deg); } 50% { transform: translateX(10px) rotate(8deg); } 80% { transform: translateX(-5px); } }
@keyframes fishFlap { 50% { transform: rotate(8deg); } }
@keyframes weed { 50% { transform: rotate(6deg); } }
@media (max-width: 560px) { #mn-templates .fish-pond { height: 360px; } #mn-templates .fish-pond > .fish.fish { top: calc(26px + var(--lane) * 52px); } #mn-templates .fish-body { min-width: 84px; height: 42px; } #mn-templates .fish-body b { font-size: 18px; } }
@media (prefers-reduced-motion: reduce) { #mn-templates .fish-pond > .fish.fish { animation-duration: calc(var(--dur) * 3); } #mn-templates .fish-body, #mn-templates .fish-weed { animation: none; } }
/* 53.832 · Sorting: Blooket bins and compact chips */
#mn-templates[data-activity="sorting"] .il-zones { display: grid !important; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin: 0 0 14px; }
#mn-templates[data-activity="sorting"] .il-zones > .il-target.il-target.il-target { --bk: #ffa31e; --bkd: #c47100; min-height: 128px; padding: 12px 10px 14px !important; border: 0 !important; border-radius: 20px !important; background: var(--bk) !important; color: #fff !important;
  box-shadow: inset 0 -7px 0 var(--bkd), 0 8px 16px rgba(0,0,0,.18) !important; display: flex; flex-direction: column; align-items: center; gap: 8px; }
#mn-templates[data-activity="sorting"] .il-zones > .il-target.il-target.il-target:nth-child(4n+2) { --bk: #00b8f0; --bkd: #0078a8; }
#mn-templates[data-activity="sorting"] .il-zones > .il-target.il-target.il-target:nth-child(4n+3) { --bk: #4bc22e; --bkd: #2e8a16; }
#mn-templates[data-activity="sorting"] .il-zones > .il-target.il-target.il-target:nth-child(4n+4) { --bk: #ff5a3c; --bkd: #c22f15; }
#mn-templates[data-activity="sorting"] .il-zones > .il-target.il-target.il-target > b { font-size: 22px; font-weight: 900; color: #fff !important; text-shadow: 0 2px 0 rgba(0,0,0,.18); }
#mn-templates[data-activity="sorting"] .il-zones > .il-target.il-target.il-target > b::before { content: '🗂 '; }
#mn-templates[data-activity="sorting"] .il-zones > .il-target.il-target.il-target .il-placed { display: flex; flex-wrap: wrap; gap: 4px; justify-content: center; font-size: 14px; font-weight: 800; color: #fff; }
#mn-templates[data-activity="sorting"] .il-zones > .il-target.il-target.il-target.il-hover, #mn-templates[data-activity="sorting"] .il-zones > .il-target.il-target.il-target.is-hover, #mn-templates[data-activity="sorting"] .il-zones > .il-target.il-target.il-target:focus-visible { outline: 4px solid #fff; transform: scale(1.03); }
#mn-templates[data-activity="sorting"] .il-bank { display: grid !important; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
#mn-templates[data-activity="sorting"] .il-bank .il-source { min-height: 58px; padding: 6px 4px !important; border: 0 !important; border-radius: 14px !important; background: #fff !important; color: #2e1065 !important; font-size: 19px; font-weight: 900;
  box-shadow: inset 0 -4px 0 #c4b5fd, 0 5px 12px rgba(0,0,0,.15) !important; display: flex; flex-direction: column; align-items: center; justify-content: center; }
#mn-templates[data-activity="sorting"] .il-bank .il-source[aria-pressed="true"] { outline: 4px solid #fde047; transform: translateY(-3px); }
#mn-templates[data-activity="sorting"] .il-bank .il-source rt { font-size: 10px; color: #7c3aed; }
#mn-templates[data-activity="sorting"] .il-bank .il-source .sx-say { width: 22px; height: 22px; margin: 2px 0 0; font-size: 11px; }
#mn-templates[data-activity="sorting"] .il-zones > .il-target.il-target.il-target .il-placed > span { padding: 3px 8px; border-radius: 999px; background: rgba(255,255,255,.92); color: #2e1065; font-size: 14px; font-weight: 900; }
#mn-templates[data-activity="sorting"] .il-bank .il-source:disabled { opacity: .22; box-shadow: none !important; }
#mn-templates[data-activity="sorting"] .il-zones > .il-target.il-target.il-target { height: auto !important; min-height: 128px !important; justify-content: flex-start; }
</style>
"""
# the Blooket answer-block style no longer applies to the fish (they used to be [data-listen-choice] buttons)
import re
P = '#mn-templates.tt-sx.sx-play:not(.tt-quest824)'
n0 = s.count('[data-listen-choice]')
s = re.sub(r',\s*' + re.escape(P) + r' \[data-listen-choice\][^,{]*(?=[,{])', '', s)
assert s.count('[data-listen-choice]') < n0
rep('</head>', CSS + '</head>')

SRC.write_text(s, encoding='utf-8')
for c in COPIES:
    shutil.copyfile(SRC, ROOT / c)
print('patched fishing + sorting + unlock')
