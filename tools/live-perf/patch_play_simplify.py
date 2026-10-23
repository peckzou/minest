"""Games · fewer taps, a harder Smash It by default, and points for right answers (not for fast taps).
Applied in place to iPhone53.8241.html, then copied to iphone.html, index.html and the two iOS copies.

Teaching games (template wall and the Solo map, same engine):
- Auto-advance: a finished round moves on by itself (1.2 s; 1.7 s after a whole board such as Memory Flip or Bingo),
  so there is no "下一轮 →" tap per question. The HUD's ⏭ turns it off (localStorage 'minest.teaching.solo.auto').
- Quick Flash, Missing, Reveal, Hidden Picture show their answer choices straight away (no "需要候选词提示" tap,
  no hint penalty for it).
- Quick Flash starts flashing by itself; Listen & Tap plays the word by itself.

Study Arcade / Minest Live:
- Score: a right answer is worth 100 × the streak multiplier (×1…×5). Reaction time no longer adds points (it added
  up to +100 per answer), Smash It's QUICK bonus is gone, and shooting barriers or bonus crystals in Smash It no
  longer scores (they still give balls). More right answers, longer streaks → more points.
- Smash It in a live game / Solo play starts one step harder: Normal (Fast when the class pace is Fast) instead of
  Easy on the default slow pace. It is always a 20-prompt run there.
- The Arcade lobby: a saved "Endless" Smash run goes back to 20 prompts once (choosing Endless again is kept).
"""
from pathlib import Path
import shutil, sys

ROOT = Path('/Users/cece/Documents/minest')
SRC = ROOT / 'iPhone53.8241.html'
COPIES = ['iphone.html', 'index.html', 'ios/Minest/Minest/iphone.html', 'ios/MinestProject/MyApp/iphone.html']
s = SRC.read_text(encoding='utf-8')
if 'minest.teaching.solo.auto' in s:
    sys.exit('already patched')

def rep(a, b, n=1):
    global s
    c = s.count(a); assert c == n, (a[:100], c, n); s = s.replace(a, b)

# ---- scoring ------------------------------------------------------------------------------------------------------
rep("var pts = Math.round((100 + clamp(3000 - rt, 0, 3000) / 30) * Math.min(5, S.combo));",
    "var pts = 100 * Math.min(5, S.combo);   // right answers and streaks score; reaction time does not")
rep("""          // a quick, clean answer earns a little extra
          if (first && q.readT && performance.now() - q.readT < 1800) {
            var qb = 50 * multOf(api.combo()); api.addScore(qb); pts += qb;
            words.push({ text: 'QUICK!', sub: '+' + qb, x: c.x, y: floorY() - c.top - 0.9, z: Math.max(1.4, c.z), px: 20, life: 0, max: 0.7, gold: true });
          }
""", "")
rep("api.addScore(20 * multOf(api.combo()));", "")
rep("floatAt(root, W - 62, H - 42, '+' + 20 * multOf(api.combo()), 'k');", "")
rep("api.addScore(25 * multOf(api.combo()));", "")

# ---- Smash It: harder by default, never endless by accident -------------------------------------------------------
rep("var opts = { level: (k === 'slice' || k === 'whack') ? pace : (slowPace ? 'easy' : pace),",
    "var opts = { level: (k === 'slice' || k === 'whack') ? pace : k === 'smash' ? (pace === 'fast' ? 'fast' : 'normal') : (slowPace ? 'easy' : pace),")
rep("if (!P.smashRun) P.smashRun = 'short';",
    "if (!P.smashRun || (P.smashRun === 'endless' && !P.smashRun20)) { P.smashRun = 'short'; P.smashRun20 = 1; savePrefs(); }")

# ---- Teaching: auto-advance ---------------------------------------------------------------------------------------
rep("""    function sxCoin(text){""", """    function sxAutoOn(){try{return localStorage.getItem('minest.teaching.solo.auto')!=='0';}catch(e){return true;}}
    function sxAuto(){if(!sxAutoOn()||!session)return;var s0=session,r0=session.round,m0=mode,d=['match','bingo','picturepair','picturememory','dragmatching','memorygrid','reconstruction','missing','disappear','sorting','diagram','buildsequence','sequencing','find','odd'].indexOf(mode)>=0?1700:1200;
      setTimeout(function(){if(session===s0&&session.round===r0&&s0.counted&&mode===m0&&root.isConnected&&!s0.sxNext){s0.sxNext=1;next();}},d);}
    function sxCoin(text){""")
rep("""      if (!was && session && session.counted) { sxFx();""", """      if (!was && session && session.counted) { session.sxNext = 0; sxAuto(); sxFx();""")
rep("""      manualDone0();
      if (!was && session && session.counted) sxFx();""", """      manualDone0();
      if (!was && session && session.counted) { session.sxNext = 0; sxAuto(); sxFx(); }""")
rep("""<button type="button" data-sx-big title="投屏大字">⛶</button>""",
    """<button type="button" data-sx-auto title="答对后自动下一题">⏭</button><button type="button" data-sx-big title="投屏大字">⛶</button>""")
rep("""h.querySelector('[data-sx-mute]').textContent=sxMuted()?'🔇':'🔊';""",
    """h.querySelector('[data-sx-mute]').textContent=sxMuted()?'🔇':'🔊';h.querySelector('[data-sx-auto]').classList.toggle('on',sxAutoOn());""")
rep("""      bind('[data-sx-big]',function(){""", """      bind('[data-sx-auto]',function(){try{localStorage.setItem('minest.teaching.solo.auto',sxAutoOn()?'0':'1');}catch(e){}sxPaint();if(sxAutoOn()&&session&&session.counted){session.sxNext=0;sxAuto();}});
      bind('[data-sx-big]',function(){""")
# every round's next() clears the guard (new session objects start without it)
rep("""    function next(){
      cancel();
      session.round++;""", """    function next(){
      cancel();
      session.sxNext = 1;
      session.round++;""")

# ---- Teaching: answer choices visible at once; Quick Flash and Listen start by themselves -----------------------------
rep("""if(['quick','missing','reveal','picture'].indexOf(mode)>=0){""", """if(false&&['quick','missing','reveal','picture'].indexOf(mode)>=0){   /* 53.828: choices show at once (fewer taps) */""")
rep("""      bind('[data-start-flash]', function(){ startFlash(false); });""",
    """      bind('[data-start-flash]', function(){ startFlash(false); });
      later(500, function(){ var sb = q('[data-start-flash]'); if (sb && !sb.hidden && !sb.disabled && !session.counted) startFlash(false); });""")
rep("""      bind('[data-listen-play]',function(){played=true;""",
    """      later(450,function(){var lb=q('[data-listen-play]');if(lb&&!played)lb.click();});
      bind('[data-listen-play]',function(){played=true;""")

SRC.write_text(s, encoding='utf-8')
for c in COPIES:
    shutil.copyfile(SRC, ROOT / c)
print('patched: simpler games, harder Smash It, answer-based score')
