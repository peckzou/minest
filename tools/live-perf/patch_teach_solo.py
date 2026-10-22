"""Teaching V1 (teacher side) · every classic activity plays like Solo.
Applied in place to iPhone53.8241.html, then copied to iphone.html, index.html and the two iOS copies.

The ten Solo levels (53.8241) had the arcade layer: HUD, XP, streak, sounds, a star result. The other ~45 classic
activities opened from the teacher's template wall did not. This patch adds the same layer to all of them, inside the
templates engine (the activities keep their own rules and counting):

- HUD on top of every round: activity, Round n / total, a progress bar, 🔥 streak, ⭐ XP, ✓ correct, 🔊 mute (shared with
  the Solo map) and ⛶ projector mode (whole activity at 125 % for the classroom screen).
- answered() / manualDone() feed it: +10 XP for a first-try answer, +5 after a correction, a streak chime every third in a
  row, a floating coin. A wrong try (any feedback(…, false)) plays the Solo "wrong" sound, shakes the panel and resets the
  streak. The SoundEngine click is replaced by the Solo sounds, so nothing plays twice.
- The summary gets a Solo result: ★ stars (first-try rate ≥ 85 % → 3, ≥ 60 % → 2, else 1), XP, best streak, confetti.
  The best stars per board + list + activity are kept in localStorage 'minest.teaching.solo.best'.
- The template wall shows each activity's best stars and a "lit / total ★" bar.
The Solo map (options.quest824/quest8241) keeps its own layer; nothing here runs there.
"""
from pathlib import Path
import shutil, sys

ROOT = Path('/Users/cece/Documents/minest')
SRC = ROOT / 'iPhone53.8241.html'
COPIES = ['iphone.html', 'index.html', 'ios/Minest/Minest/iphone.html', 'ios/MinestProject/MyApp/iphone.html']
s = SRC.read_text(encoding='utf-8')
if 'minest.teaching.solo.best' in s:
    sys.exit('already patched')

def rep(a, b, n=1):
    global s
    c = s.count(a); assert c == n, (a[:100], c, n); s = s.replace(a, b)

JS = r"""    /* 53.826 · Solo layer for the classic activities: HUD, XP, streak, sounds, star result (not in the Solo map) */
    var SX_BEST='minest.teaching.solo.best',sxSnap=0;
    function sxOn(){return !(options.quest824||options.quest8241);}
    function sxMuted(){try{return localStorage.getItem('minest.teaching.ten.muted')==='1';}catch(e){return false;}}
    function sxSfx(t){if(sxMuted())return;try{if(window.MinestTeachingTen&&MinestTeachingTen.playSfx){MinestTeachingTen.playSfx(t);return;}if(window.SoundEngine&&SoundEngine.play)SoundEngine.play(t==='wrong'?'click':'success');}catch(e){}}
    function sxInfo(){return session&&catalog.find(function(t){return t[0]===mode;});}
    function sxScore(){var s=session||{},done=s.sxDone||0,ok=Math.min(done,s.sxOk||0),total=Math.max(done,s.total||0),ratio=done?ok/done:0;return {done:done,ok:ok,total:total,stars:total&&done>=total?(ratio>=.85?3:ratio>=.6?2:1):0,xp:ok*10+(done-ok)*5+Math.min(50,(s.sxBest||0)*5),best:s.sxBest||0};}
    function sxKey(k){return JSON.stringify([String(board.id),String(col),k||mode]);}
    function sxBest(){try{return JSON.parse(localStorage.getItem(SX_BEST)||'{}')||{};}catch(e){return {};}}
    function sxStars(n){return [1,2,3].map(function(i){return i<=n?'★':'☆';}).join('');}
    function sxBig(on){try{if(on!=null)localStorage.setItem('minest.teaching.solo.big',on?'1':'0');return localStorage.getItem('minest.teaching.solo.big')==='1';}catch(e){return !!on;}}
    function sxPaint(){var h=q('[data-sx-hud]');if(!h||!session)return;var v=sxScore(),total=session.total||1,now=Math.min(total,(session.round||0)+(session.counted?1:0));
      h.querySelector('[data-sx-round]').textContent='Round '+Math.min(total,(session.round||0)+1)+' / '+total;h.querySelector('[data-sx-bar]').style.width=Math.round(100*now/total)+'%';
      h.querySelector('[data-sx-streak]').textContent=session.sxStreak||0;h.querySelector('[data-sx-xp]').textContent=v.xp;h.querySelector('[data-sx-ok]').textContent=v.ok;h.querySelector('.sx-fire').classList.toggle('on',(session.sxStreak||0)>=3);
      h.querySelector('[data-sx-mute]').textContent=sxMuted()?'🔇':'🔊';h.querySelector('[data-sx-big]').classList.toggle('on',root.classList.contains('sx-big'));}
    function sxAfterShow(){if(!sxOn())return;root.classList.add('tt-sx');root.classList.toggle('sx-big',sxBig());var info=sxInfo();root.classList.toggle('sx-play',!!info);if(!info)return;
      if(!q('[data-sx-hud]'))body.insertAdjacentHTML('afterbegin','<div class="sx-hud" data-sx-hud><div class="sx-hud-top"><span class="sx-mode"><i>'+esc(info[1])+'</i><b>'+esc(info[2])+'</b></span><span class="sx-round" data-sx-round></span><span class="sx-stats"><span class="sx-pill sx-fire">🔥 <b data-sx-streak>0</b></span><span class="sx-pill">⭐ <b data-sx-xp>0</b> XP</span><span class="sx-pill">✓ <b data-sx-ok>0</b></span><button type="button" data-sx-mute title="音效开关"></button><button type="button" data-sx-big title="投屏大字">⛶</button></span></div><div class="sx-bar"><i data-sx-bar></i></div></div>');
      bind('[data-sx-mute]',function(){try{localStorage.setItem('minest.teaching.ten.muted',sxMuted()?'0':'1');}catch(e){}sxSfx('click');sxPaint();});
      bind('[data-sx-big]',function(){root.classList.toggle('sx-big',sxBig(!sxBig()));sxPaint();});sxPaint();}
    function sxCoin(text){var c=document.createElement('div');c.className='sx-coin';c.textContent=text;var f=q('[data-feedback]'),r=f&&f.getBoundingClientRect();c.style.left=(r&&r.width?r.left+r.width/2:innerWidth/2)+'px';c.style.top=(r&&r.width?r.top:innerHeight/2)+'px';document.body.appendChild(c);setTimeout(function(){c.remove();},1200);}
    function sxFx(){var s=session;if(!s||!sxOn())return;clearTimeout(sxSnap);s.sxDone=(s.sxDone||0)+1;
      if(!s.missed){s.sxOk=(s.sxOk||0)+1;s.sxStreak=(s.sxStreak||0)+1;if(s.sxStreak>(s.sxBest||0))s.sxBest=s.sxStreak;}else s.sxStreak=0;s.sxAt=Date.now();
      sxSfx(s.sxStreak&&s.sxStreak%3===0?'streak':'correct');sxCoin('+'+(s.missed?5:10)+' XP'+(s.sxStreak>=3?' · 🔥'+s.sxStreak:''));sxPaint();}
    function sxFeedback(good){if(!sxOn()||!session||!sxInfo())return;clearTimeout(sxSnap);
      if(good){if(Date.now()-(session.sxAt||0)>80)sxSnap=setTimeout(function(){sxSfx('snap');},0);return;}
      session.sxStreak=0;sxSfx('wrong');var p=q('.tt-panel');if(p){p.classList.remove('sx-shake');void p.offsetWidth;p.classList.add('sx-shake');}sxPaint();}
    function sxResult(){var info=sxInfo(),panel=q('.tt-panel');if(!info||!panel)return;var v=sxScore(),all=sxBest(),k=sxKey(),old=all[k]||{};
      if(v.stars){all[k]={stars:Math.max(old.stars||0,v.stars),xp:Math.max(old.xp||0,v.xp),at:Date.now()};try{localStorage.setItem(SX_BEST,JSON.stringify(all));}catch(e){}}
      var box=document.createElement('div');box.className='sx-win';box.innerHTML='<div class="sx-confetti">'+Array.from({length:26},function(_,i){return '<i style="--x:'+(Math.random()*100).toFixed(1)+'%;--d:'+(Math.random()*.9).toFixed(2)+'s;--h:'+(i*37%360)+'"></i>';}).join('')+'</div>'
        +'<div class="sx-win-icon">'+esc(info[1])+'</div><h2>'+(v.stars?'CLASS CLEARED · 本轮通关！':'本轮结束 · 继续加油')+'</h2>'
        +'<div class="sx-win-stars">'+[1,2,3].map(function(i){return '<span class="'+(i<=v.stars?'on':'')+'" style="animation-delay:'+(.15+i*.18)+'s">'+(i<=v.stars?'★':'☆')+'</span>';}).join('')+'</div>'
        +'<p class="sx-win-xp">✨ +'+v.xp+' XP · 独立答对 '+v.ok+' / '+v.done+(v.best>=2?' · 🔥 最高连胜 '+v.best:'')+'</p>'
        +'<p class="sx-win-best">🏅 本组最佳 '+sxStars(Math.max(old.stars||0,v.stars))+(v.stars>(old.stars||0)&&old.stars?' · 新纪录！':'')+'</p>';
      panel.prepend(box);sxSfx('win');}
    function sxLib(){var all=sxBest(),lit=0,stars=0,btns=qa('button[data-template]');
      btns.forEach(function(b){if(b.disabled)return;lit++;var r=all[sxKey(b.dataset.template)]||{},n=r.stars||0;stars+=n;b.insertAdjacentHTML('beforeend','<small class="sx-stars'+(n?' on':'')+'">'+sxStars(n)+'</small>');});
      var cat=q('.tt-catalog');if(cat)cat.insertAdjacentHTML('beforebegin','<div class="sx-libbar"><span>🎮 已点亮 <b>'+lit+'</b> / '+btns.length+' 个课堂游戏</span><span>⭐ 本组星星 <b>'+stars+'</b> / '+lit*3+'</span><span class="sx-libbar-tip">每个游戏都带 XP · 连胜 · 音效 · 星级结算，⛶ 可切投屏大字</span></div>');}

    function frame(content, note, headerToolsHTML){"""

rep("""    function frame(content, note, headerToolsHTML){""", JS)

# show(): the HUD goes on top of every activity screen (and leaves with it)
rep("""    function show(html){
      body.innerHTML = html;""", """    function show(html){
      body.innerHTML = html;try{sxAfterShow();}catch(e){}""")

# feedback(): Solo sounds instead of the SoundEngine click; wrong answers shake and reset the streak
rep("""      try {
        if (window.SoundEngine && SoundEngine.play) SoundEngine.play(good ? 'success' : 'click');""",
    """      try {
        if (sxOn() && sxInfo()) sxFeedback(good); else
        if (window.SoundEngine && SoundEngine.play) SoundEngine.play(good ? 'success' : 'click');""")

# answered() / manualDone(): one finished round = XP, streak, coin
rep("""    function answered(good, answer){
      if (session.counted) return false;""",
    """    function answered(good, answer){
      var was = !session || session.counted, r = answered0(good, answer);
      if (!was && session && session.counted) sxFx();
      return r;
    }
    function answered0(good, answer){
      if (session.counted) return false;""")
rep("""    function manualDone(){
      if (session.counted) { ready(); return; }""",
    """    function manualDone(){
      var was = !session || session.counted;
      manualDone0();
      if (!was && session && session.counted) sxFx();
    }
    function manualDone0(){
      if (session.counted) { ready(); return; }""")

# template wall: one tap builds the full sample list (tools/live-perf/teach_sample.js) and opens it
rep("""        + '<button class="tt-primary light-main" data-illuminate>✨ 先补本地资料，点亮教学模式</button>'""",
    """        + '<button class="tt-primary light-main" data-illuminate>✨ 先补本地资料，点亮教学模式</button>'
        + (sxOn() ? '<button class="sx-sample" data-sx-sample>🌧 一键生成「水循环 · 全功能示例」词表（全部游戏点亮）</button>' : '')""")
rep("""      bind('[data-illuminate]',function(){xIlluminate();});""",
    """      bind('[data-illuminate]',function(){xIlluminate();});bind('[data-sx-sample]',function(){try{var r=MinestTeachingSample.create();close();MinestTeachingSets.open(r,{chinese:true,audience:audience});}catch(e){alert(e.message);}});""")

# summary + template wall
rep("""if(options.quest824 || options.quest8241)window.MinestTeachingTen.result(root);""",
    """if(options.quest824 || options.quest8241)window.MinestTeachingTen.result(root);else sxResult();""")
rep("""      qa('[data-template]').forEach(function(b){ b.onclick = function(){ start(b.dataset.template); }; });""",
    """      qa('[data-template]').forEach(function(b){ b.onclick = function(){ sxSfx('click'); start(b.dataset.template); }; });if(sxOn())sxLib();""")

CSS = """<style id="teaching-solo-classic">
#mn-templates.tt-sx .sx-hud{position:sticky;top:0;z-index:6;margin:0 0 14px;padding:10px 14px 12px;border-radius:20px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;box-shadow:0 5px 0 #3b2a8f,0 14px 30px rgba(76,29,149,.22);font-weight:800}
#mn-templates.tt-sx .sx-hud-top{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between}
#mn-templates.tt-sx .sx-mode{display:flex;align-items:center;gap:8px;font-size:17px;min-width:0;flex:1 1 180px}
#mn-templates.tt-sx .sx-mode i{flex:none;font-style:normal;width:34px;height:34px;display:grid;place-items:center;border-radius:12px;background:#fff;color:#6d28d9;font-size:18px;box-shadow:0 3px 0 rgba(0,0,0,.15)}
#mn-templates.tt-sx .sx-mode b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#mn-templates.tt-sx .sx-round{padding:4px 12px;border-radius:999px;background:rgba(255,255,255,.2);font-size:14px;white-space:nowrap}
#mn-templates.tt-sx .sx-stats{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
#mn-templates.tt-sx .sx-pill{padding:4px 11px;border-radius:999px;background:#fff;color:#2e1065;font-size:14px;box-shadow:0 3px 0 rgba(0,0,0,.18);white-space:nowrap}
#mn-templates.tt-sx .sx-fire.on{background:#ffedd5;color:#c2410c;animation:sxPulse .6s ease}
#mn-templates.tt-sx .sx-hud button{min-height:0;min-width:0;padding:5px 10px;border-radius:999px;border:0;background:rgba(255,255,255,.2);color:#fff;font:inherit;font-size:14px;cursor:pointer;box-shadow:none}
#mn-templates.tt-sx .sx-hud button.on{background:#fde047;color:#713f12}
#mn-templates.tt-sx .sx-bar{margin-top:10px;height:12px;border-radius:999px;background:rgba(255,255,255,.22);overflow:hidden}
#mn-templates.tt-sx .sx-bar i{display:block;width:0;height:100%;border-radius:inherit;background:linear-gradient(90deg,#fde047,#4ade80);transition:width .45s cubic-bezier(.2,.9,.3,1.2)}
#mn-templates.sx-play .tt-wrap>.tt-progress,#mn-templates.sx-play .tt-wrap>progress{display:none}
#mn-templates.sx-big .tt-wrap{zoom:1.25}
#mn-templates.tt-sx .tt-panel.sx-shake{animation:sxShake .4s ease}
#mn-templates.tt-sx .tt-feedback.tt-good{animation:sxPop .35s ease}
.sx-coin{position:fixed;z-index:2147483647;transform:translate(-50%,0);padding:6px 14px;border-radius:999px;background:#fde047;color:#854d0e;border:3px solid #fff;font-weight:900;font-size:17px;box-shadow:0 6px 16px rgba(0,0,0,.2);pointer-events:none;animation:sxCoin 1.15s ease-out forwards}
#mn-templates.tt-sx .sx-win{position:relative;overflow:hidden;text-align:center;margin:0 0 16px;padding:22px 16px 18px;border-radius:24px;background:linear-gradient(180deg,#fef9c3,#fff 70%);border:3px solid #fde047;box-shadow:0 6px 0 #facc15}
#mn-templates.tt-sx .sx-win h2{margin:6px 0 4px;color:#4c1d95;font-size:24px;font-weight:900}
#mn-templates.tt-sx .sx-win-icon{font-size:54px;line-height:1.1;animation:sxBob 2s ease-in-out infinite}
#mn-templates.tt-sx .sx-win-stars{font-size:46px;letter-spacing:6px;color:#d6d3d1}
#mn-templates.tt-sx .sx-win-stars span{display:inline-block;animation:sxStar .5s cubic-bezier(.2,1.6,.4,1) both}
#mn-templates.tt-sx .sx-win-stars span.on{color:#f59e0b;text-shadow:0 3px 0 #b45309}
#mn-templates.tt-sx .sx-win-xp{margin:8px 0 2px;font-size:20px;font-weight:900;color:#2e1065}
#mn-templates.tt-sx .sx-win-best{margin:0;color:#7c2d12;font-weight:800}
#mn-templates.tt-sx .sx-confetti{position:absolute;inset:0;pointer-events:none}
#mn-templates.tt-sx .sx-confetti i{position:absolute;top:-12px;left:var(--x);width:8px;height:14px;border-radius:2px;background:hsl(var(--h) 90% 60%);animation:sxFall 1.8s var(--d) ease-in forwards}
#mn-templates.tt-sx .sx-sample{display:block;width:100%;margin:8px 0 4px;padding:12px 16px;border:0;border-radius:16px;background:linear-gradient(135deg,#0ea5e9,#22c55e);color:#fff;font:inherit;font-weight:900;font-size:15px;box-shadow:0 4px 0 #0f766e;cursor:pointer}
#mn-templates.tt-sx .sx-libbar{display:flex;flex-wrap:wrap;gap:8px 16px;align-items:center;margin:4px 0 12px;padding:10px 14px;border-radius:16px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;font-weight:800}
#mn-templates.tt-sx .sx-libbar b{color:#fde047}
#mn-templates.tt-sx .sx-libbar-tip{font-size:12px;opacity:.85;font-weight:700}
#mn-templates.tt-sx .tt-template .sx-stars{color:#d6d3d1;font-size:15px;letter-spacing:2px}
#mn-templates.tt-sx .tt-template .sx-stars.on{color:#f59e0b}
@keyframes sxPulse{50%{transform:scale(1.18)}}
@keyframes sxShake{20%,60%{transform:translateX(-7px)}40%,80%{transform:translateX(7px)}}
@keyframes sxPop{0%{transform:scale(.92)}60%{transform:scale(1.04)}}
@keyframes sxCoin{0%{opacity:0;transform:translate(-50%,10px) scale(.7)}15%{opacity:1;transform:translate(-50%,0) scale(1.08)}100%{opacity:0;transform:translate(-50%,-70px) scale(1)}}
@keyframes sxBob{50%{transform:translateY(-8px)}}
@keyframes sxStar{0%{transform:scale(0) rotate(-40deg);opacity:0}100%{transform:none;opacity:1}}
@keyframes sxFall{0%{transform:translateY(0) rotate(0)}100%{transform:translateY(420px) rotate(540deg);opacity:0}}
@media (prefers-reduced-motion:reduce){#mn-templates.tt-sx *,.sx-coin{animation:none!important;transition:none!important}}
@media (max-width:560px){#mn-templates.tt-sx .sx-mode{font-size:15px}#mn-templates.tt-sx .sx-pill,#mn-templates.tt-sx .sx-hud button{font-size:13px;padding:4px 8px}}
</style>
"""
rep('</head>', CSS + '</head>')
rep('</body>', '<script id="teaching-sample826">' + (ROOT / 'tools/live-perf/teach_sample.js').read_text(encoding='utf-8') + '</script>\n</body>')

SRC.write_text(s, encoding='utf-8')
for c in COPIES:
    shutil.copyfile(SRC, ROOT / c)
print('patched teaching solo layer')
