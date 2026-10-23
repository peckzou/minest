"""Teaching (teacher side + Solo map) · Chinese questions are about "how do you say it in Chinese".
Applied in place to iPhone53.8241.html, then copied to iphone.html, index.html and the two iOS copies.

The rule, for Chinese word lists (options.chinese):
- The answer side is always the Chinese word with its pinyin. Pinyin stands for the sound, so when this device has a
  Chinese voice, a 🔊 sits next to the pinyin (tap: hear it; it never picks the answer). After a correct answer, the word
  is read aloud once (the 🔊 mute in the HUD also silences this).
- The question side (the cue) depends on the card:
  · a real picture → the picture (picture ↔ pinyin / sound);
  · no picture → the English translation (card.en, or an English back with its "(pinyin)" stripped);
  · neither → the pinyin with its 🔊.
  A Chinese explanation the teacher wrote as the back stays as it is.
- Games that had a picture / meaning switch now start on the cue that fits the card: Find It (picture clue, cards
  show words only), True or False (word × picture), Quick Flash (flash the picture, else the English).
  Drag Matching targets, Memory Flip back tiles, Bingo calls and Spotlight show the cue; Sprint shows the picture when
  both cards have one.
- Every correct drop (drag games), Memory Flip pair and Bingo cell reads its word aloud.
Lists that are not Chinese keep the old behaviour.
"""
from pathlib import Path
import shutil, sys

ROOT = Path('/Users/cece/Documents/minest')
SRC = ROOT / 'iPhone53.8241.html'
COPIES = ['iphone.html', 'index.html', 'ios/Minest/Minest/iphone.html', 'ios/MinestProject/MyApp/iphone.html']
s = SRC.read_text(encoding='utf-8')
if 'function sxChineseCue(' in s:
    sys.exit('already patched')
if 'minest.teaching.solo.best' not in s:
    sys.exit('run patch_teach_solo.py first')

def rep(a, b, n=1):
    global s
    c = s.count(a); assert c == n, (a[:100], c, n); s = s.replace(a, b)

HELPERS = r"""    /* 53.827 · Chinese cue rule: picture → pinyin/sound, else English → Chinese; 🔊 wherever pinyin is shown */
    var SX_TONE=/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/i,SX_HAN=/[㐀-鿿]/;
    function sxZhVoice(){if(!window.speechSynthesis||!window.SpeechSynthesisUtterance||window.__mnNoVoice)return false;var v=[];try{v=speechSynthesis.getVoices()||[];}catch(e){}
      if(!v.length)return /iPhone|iPad|Macintosh/.test(navigator.userAgent);   /* Apple web views can list no voices yet still speak zh-CN */
      return v.filter(function(x){return /^(zh|cmn)/i.test(x.lang||'');}).sort(function(a,b){return (/CN|Hans/i.test(b.lang)?1:0)-(/CN|Hans/i.test(a.lang)?1:0);})[0]||false;}
    function sxSayNow(text){var v=sxZhVoice();if(!v||!text)return;try{speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(String(text).slice(0,60));u.lang='zh-CN';if(v!==true)u.voice=v;u.rate=.8;speechSynthesis.speak(u);}catch(e){}}
    function sxSay(w,delay){if(!options.chinese||!w||!SX_HAN.test(w.front||'')||sxMuted())return;setTimeout(function(){if(root.isConnected)sxSayNow(w.front);},delay==null?280:delay);}
    function sxSayBtn(w){return options.chinese&&w&&SX_HAN.test(w.front||'')&&sxZhVoice()?'<span class="sx-say" role="button" tabindex="0" data-sx-say="'+esc(w.front)+'" aria-label="听「'+esc(w.front)+'」怎么读" title="听读音"></span>':'';}
    function sxSayBind(){if(root.__sxSay)return;root.__sxSay=1;
      ['pointerdown','mousedown','touchstart','click'].forEach(function(t){root.addEventListener(t,function(ev){var b=ev.target&&ev.target.closest&&ev.target.closest('[data-sx-say]');if(!b)return;ev.stopPropagation();if(t==='click'){ev.preventDefault();sxSayNow(b.dataset.sxSay);b.classList.remove('on');void b.offsetWidth;b.classList.add('on');}},true);});
      root.addEventListener('keydown',function(ev){var b=ev.target.closest&&ev.target.closest('[data-sx-say]');if(b&&(ev.key==='Enter'||ev.key===' ')){ev.preventDefault();ev.stopPropagation();sxSayNow(b.dataset.sxSay);}},true);}
    function sxChineseCue(){if(!options.chinese)return;var cards=Object.create(null);(board.columns||[]).forEach(function(c){(c.cards||[]).forEach(function k(x){if(!x)return;cards[x.id]=x;(x.stack||[]).forEach(k);});});
      items.forEach(function(w){var c=cards[w.id]||{},b=String(w.back||'').replace(/\s*[（(][^（）()]*[）)]\s*$/,function(m){return SX_TONE.test(m)?'':m;}).trim(),en=String(c.en||'').trim();
        if(!en&&b&&!SX_HAN.test(b)&&!SX_TONE.test(b)&&key(b)!==key(w.py))en=b;
        if(en){w.en=en;if(!SX_HAN.test(w.back||'')){w.back=en;w.backMode='text';}}
        w.cueKind=w.hasCustomImage&&w.image?'image':en?'en':'py';});}
    function cue(w){if(!w)return '';if(w.hasCustomImage&&w.image)return '<img class="sx-cue-img" src="'+esc(w.image)+'" alt="看图说中文" draggable="false">';if(w.en)return '<span class="sx-cue-en" lang="en">'+esc(w.en)+'</span>';return '<span class="sx-cue-py">'+esc(w.py||w.back)+'</span>'+sxSayBtn(w);}
    function cueOr(w){return options.chinese?cue(w):esc(w.back);}

"""

# helpers sit next to the Solo layer
rep("""    /* 53.826 · Solo layer for the classic activities""", HELPERS + """    /* 53.826 · Solo layer for the classic activities""")
rep("""      body.innerHTML = html;try{sxAfterShow();}catch(e){}""", """      body.innerHTML = html;try{sxSayBind();sxAfterShow();}catch(e){}""")

# the back side of a Chinese card is its English (when there is one), decided before the pools are built
rep("""      pool = pools(items);
      storageError = '';""", """      sxChineseCue();
      pool = pools(items);
      storageError = '';""")

# word(): pinyin = sound, so the pinyin gets a 🔊
rep("""      if (py && help !== false && w.py && p.length === chars.length) {
        return '<ruby>' + chars.map(function(c, i){ return esc(c) + '<rt>' + esc(p[i]) + '</rt>'; }).join('') + '</ruby>';
      }
      if (py && help !== false && w.py) {
        return '<ruby>' + esc(w.front) + '<rt>' + esc(w.py) + '</rt></ruby>';
      }""", """      if (py && help !== false && w.py && p.length === chars.length) {
        return '<ruby>' + chars.map(function(c, i){ return esc(c) + '<rt>' + esc(p[i]) + '</rt>'; }).join('') + '</ruby>' + sxSayBtn(w);
      }
      if (py && help !== false && w.py) {
        return '<ruby>' + esc(w.front) + '<rt>' + esc(w.py) + '</rt></ruby>' + sxSayBtn(w);
      }""")

# a correct single-target round reads its word
rep("""      var was = !session || session.counted, r = answered0(good, answer);
      if (!was && session && session.counted) sxFx();""", """      var was = !session || session.counted, r = answered0(good, answer);
      if (!was && session && session.counted) { sxFx(); if (['match','bingo','picturepair','picturememory','dragmatching','memorygrid','reconstruction','missing','disappear','sorting','diagram','buildsequence','sequencing'].indexOf(mode) < 0) sxSay(session.current); }""")

# drag games: each correct drop
rep("""placed.add(sid);ilRecord(owner(c),'correct',hinted.has(sid)||faults.has(sid));""",
    """placed.add(sid);sxSay(owner(c),120);ilRecord(owner(c),'correct',hinted.has(sid)||faults.has(sid));""")
rep("""'</small><span>'+esc(c.back)+'</span>'+(placed.has(c.id)""", """'</small><span>'+cueOr(c)+'</span>'+(placed.has(c.id)""")

# Memory Flip: word tile + cue tile; a found pair is read aloud
rep("""{i:i,side:'back',text:w.back}""", """{i:i,side:'back',text:w.back}""")
rep("""b.innerHTML='<small>'+ (t.side==='front'?'词语':'释义')+'</small><br>'+esc(t.text);""",
    """b.innerHTML=options.chinese?'<small>'+(t.side==='front'?'中文':cards[t.i].cueKind==='image'?'图片':cards[t.i].cueKind==='en'?'English':'拼音')+'</small><br>'+(t.side==='front'?word(cards[t.i]):cue(cards[t.i])):'<small>'+ (t.side==='front'?'词语':'释义')+'</small><br>'+esc(t.text);""")
rep("""if(a.i===z.i&&a.side!==z.side){matched.add(a.i);""", """if(a.i===z.i&&a.side!==z.side){matched.add(a.i);sxSay(cards[a.i]);""")

# Bingo: the call is the cue
rep("""q('[data-bingo-clue]').textContent=at<calls.length?'找一找：'+calls[at].back:'整盘完成';""",
    """q('[data-bingo-clue]').innerHTML=at<calls.length?'找一找：'+cueOr(calls[at]):'整盘完成';""")
rep("""xEvent(w,'correct',session.missed);marks.add(w.id);""", """xEvent(w,'correct',session.missed);marks.add(w.id);sxSay(w);""")

# Find It: a card with a picture starts on the picture clue, and the cards show words only
rep("""      var findView = session.findView || 'both';
      var clueMode = session.findClueMode || 'meaning';""",
    """      var clueMode = session.findClueMode || (options.chinese && w.hasCustomImage ? 'visual' : 'meaning');
      var findView = session.findView || (options.chinese && clueMode === 'visual' ? 'text' : 'both');""")
rep("""'<span>看图 + 线索：' + esc(plain) + '</span></div>';""",
    """(options.chinese && w.hasCustomImage ? '<span>看图，找出它的中文，读一读拼音</span>' : '<span>看图 + 线索：' + esc(plain) + '</span>') + '</div>';""")

# True or False / Quick Flash start on the cue that fits the card
rep("""var tfMode = session.tfMode || 'meaning';""",
    """var tfMode = session.tfMode || (options.chinese && w.hasCustomImage && pool.pairs.some(function(c){ return c.id !== w.id && c.hasCustomImage && c.image !== w.image; }) ? 'image' : 'meaning');""")
rep("""var flashWhat = session.quickWhat || 'word';""",
    """var flashWhat = session.quickWhat || (options.chinese ? (w.hasCustomImage ? 'image' : 'meaning') : 'word');""")

# Spotlight / Sprint
rep("""'<p class="tt-lead">寻找：'+esc(w.back)+'</p>""", """'<p class="tt-lead">寻找：'+cueOr(w)+'</p>""")
rep("""'<div class="tt-card"><h2>'+word(w,false)+'</h2><p>'+esc(shown.back)+'</p></div>""",
    """'<div class="tt-card"><h2>'+word(w,false)+'</h2><p>'+(options.chinese&&w.hasCustomImage&&shown.hasCustomImage?cue(shown):esc(shown.back))+'</p></div>""")

# the template wall says what the questions train
rep("""        + '<span class="tt-pill" style="cursor:default">📇 共 ' + items.length + ' 张词卡</span>'""",
    """        + (options.chinese ? '<span class="tt-pill sx-rule" style="cursor:default">🗣 出题：有图 → 看图说中文（拼音' + (sxZhVoice() ? ' + 🔊 发音' : '') + '）；无图 → 英文 → 中文</span>' : '')
        + '<span class="tt-pill" style="cursor:default">📇 共 ' + items.length + ' 张词卡</span>'""")

CSS = """<style id="teaching-cue827">
#mn-templates .sx-say{display:inline-grid;place-items:center;width:30px;height:30px;margin-left:6px;vertical-align:middle;border-radius:999px;background:#ede9fe;color:#6d28d9;font-size:15px;line-height:1;cursor:pointer;box-shadow:0 2px 0 #c4b5fd;flex:none;-webkit-tap-highlight-color:transparent}
#mn-templates .sx-say::before{content:'🔊'}
#mn-templates .sx-say:hover{background:#ddd6fe}
#mn-templates .sx-say.on{animation:sxSay .5s ease}
#mn-templates .sx-say:focus-visible{outline:3px solid #f59e0b;outline-offset:2px}
#mn-templates .sx-cue-img{display:block;max-width:min(100%,220px);max-height:150px;margin:6px auto;object-fit:contain;border-radius:14px;background:#fff;border:2px solid #e2e8f0}
#mn-templates .t809-match .sx-cue-img{max-height:96px;max-width:100%}
#mn-templates .il-target span:has(>.sx-cue-img){height:auto;max-height:none;width:auto;overflow:visible}
#mn-templates .il-target .sx-cue-img{width:auto;height:84px;max-width:none;max-height:none;margin:4px auto}
#mn-templates [data-bingo-clue] .sx-cue-img{display:inline-block;max-height:110px;vertical-align:middle}
#mn-templates .sx-cue-en{font-weight:800;color:#1e3a8a}
#mn-templates .sx-cue-py{font-weight:800;color:#7c3aed}
#mn-templates .sx-rule{background:#ecfdf5;color:#065f46;border-color:#a7f3d0}
@keyframes sxSay{40%{transform:scale(1.25);background:#c4b5fd}}
</style>
"""
rep('</head>', CSS + '</head>')

SRC.write_text(s, encoding='utf-8')
for c in COPIES:
    shutil.copyfile(SRC, ROOT / c)
print('patched Chinese cue rule')
