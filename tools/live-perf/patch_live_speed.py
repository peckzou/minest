"""Student side (Minest Live / Study Arcade) · speed you can set + smoother play with a full class.
Applied in place to iPhone53.8241.html (the page anti keeps editing), then copied to iphone.html, index.html and the two
iOS copies, as their commits do. Each anchor must occur the expected number of times, or nothing is written.

Speed
- Glass Fruit (切水果) and Whack-a-Term (打地鼠) get two slower levels: 'veryslow' and 'slow'.
- Both games get an in-game speed control (🐢 slower · 🐇 faster). It changes the next fruit / mole at once and is
  remembered per device and game. In a live game the teacher's pace is the start, and the teacher can turn the control off.
- Teacher's Live setup: Pace = Very slow · Slow · Easy · Normal · Fast (default Slow), plus "Students can change speed".
  Games that have no slower levels (Blast, Smash, Missing) play 'easy' when the pace is slow or very slow.
- The Study Arcade's own Pace choice lists the two slower levels too.

Smoother with 20 players
- Teacher screen: the class feed redraws at most every 0.35 s, not once per incoming answer. The class ranking
  (host/lb, streamed to every student) is published at most every 3 s, not every second.
- Canvas games: in Minest Live (flat cartoon art) and on low-end devices (≤4 cores or ≤4 GB) they start one quality
  tier down (1.5× pixels, no blur glow). They step down after ~40 slow frames instead of ~90.
"""
from pathlib import Path
import hashlib, shutil, sys

ROOT = Path('/Users/cece/Documents/minest')
SRC = ROOT / 'iPhone53.8241.html'
COPIES = ['iphone.html', 'index.html', 'ios/Minest/Minest/iphone.html', 'ios/MinestProject/MyApp/iphone.html']
s = SRC.read_text(encoding='utf-8')
if 'minest.arcade.speed.' in s and 'o.__setOpen' in s:
    sys.exit('already patched')
PART2 = 'minest.arcade.speed.' in s   # the first part is in already: only what is new

def rep(a, b, n=1):
    global s
    c = s.count(a)
    assert c == n, (a[:90], c, n)
    s = s.replace(a, b)

# ---- 1. slower levels -------------------------------------------------------------------------------------------
rep("""      easy: { n: 3, g: 0.40, R: 66, lead: 820, rot: 0.7 },""",
    """      veryslow: { n: 3, g: 0.22, R: 72, lead: 1250, rot: 0.35 },
      slow: { n: 3, g: 0.30, R: 70, lead: 1020, rot: 0.5 },
      easy: { n: 3, g: 0.40, R: 66, lead: 820, rot: 0.7 },""")
rep("""      easy: { interval: 1150, up: 2150, maxUp: 2, lead: 950 },""",
    """      veryslow: { interval: 1900, up: 3800, maxUp: 2, lead: 1350 },
      slow: { interval: 1500, up: 2900, maxUp: 2, lead: 1150 },
      easy: { interval: 1150, up: 2150, maxUp: 2, lead: 950 },""")

# ---- 2. the in-game speed control (both games: right after their cfg) -------------------------------------------
def speed_ui(mode):
    return ("""    var cfg = LV[opts.level] || LV.normal;
    /* speed you can set while playing (🐢 / 🐇): the next %(what)s follows at once; kept per device */
    var SPD = ['veryslow', 'slow', 'easy', 'normal', 'fast'], SPN = { veryslow: '很慢', slow: '慢', easy: '较慢', normal: '正常', fast: '快' }, spKey = 'minest.arcade.speed.%(mode)s';
    var spLv = LV[opts.level] ? opts.level : 'normal';
    if (opts.allowSpeed !== false) { try { var spSaved = localStorage.getItem(spKey); if (spSaved && LV[spSaved]) { spLv = spSaved; cfg = LV[spLv]; } } catch (e) {} }
    if (opts.allowSpeed !== false) {
      var spBox = el('div', 'ar-spd', hudB), spDn = el('button', '', spBox, '🐢'), spLb = el('span', '', spBox, ''), spUp = el('button', '', spBox, '🐇');
      spDn.type = spUp.type = 'button'; spDn.title = '慢一点'; spUp.title = '快一点';
      var spPaint = function() { spLb.textContent = '速度 · ' + SPN[spLv]; spDn.disabled = spLv === SPD[0]; spUp.disabled = spLv === SPD[SPD.length - 1]; };
      var spSet = function(d) { var i = SPD.indexOf(spLv) + d; if (i < 0 || i >= SPD.length) return; spLv = SPD[i]; cfg = LV[spLv]; try { localStorage.setItem(spKey, spLv); } catch (e) {} spPaint(); };
      ['pointerdown', 'pointerup', 'touchstart', 'mousedown'].forEach(function(ev) { spBox.addEventListener(ev, function(e) { e.stopPropagation(); }, { passive: true }); });
      spDn.onclick = function(e) { e.stopPropagation(); spSet(-1); }; spUp.onclick = function(e) { e.stopPropagation(); spSet(1); };
      spPaint();
    }""" % {'mode': mode, 'what': 'fruit' if mode == 'slice' else 'mole'})
# the two cfg lines are identical text; replace them one at a time, in page order (slice comes first, then whack)
anchor = "    var cfg = LV[opts.level] || LV.normal;\n"
i_slice = s.find("      veryslow: { n: 3, g: 0.22")
i_whack = s.find("      veryslow: { interval: 1900")
assert 0 < i_slice < i_whack
a1 = s.find(anchor, i_slice); a2 = s.find(anchor, i_whack)
assert a1 > 0 and a2 > a1 and a1 - i_slice < 600 and a2 - i_whack < 600
s = s[:a2] + speed_ui('whack') + '\n' + s[a2 + len(anchor):]
s = s[:a1] + speed_ui('slice') + '\n' + s[a1 + len(anchor):]

# does el() take text as its 4th argument? (el(tag, cls, parent, text))
assert "var el = function(tag, cls, parent, text)" in s or "function el(tag, cls, parent, text)" in s, 'el() signature'

# the control's look (in the arcade's own style block, next to .ar-sx-hud)
rep(""".ar-sx-hud { position: absolute; left: 16px; right: 16px; bottom: 14px; z-index: 6; display: flex;""",
    """.ar-spd { pointer-events: auto; display: inline-flex; align-items: center; gap: 4px; padding: 3px; border-radius: 999px; background: rgba(15,23,42,.55); border: 1px solid rgba(255,255,255,.18); color: #fff; font: 800 12.5px/1 system-ui, sans-serif; backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
.ar-spd span { padding: 0 6px; white-space: nowrap; }
.ar-spd button { width: 34px; height: 34px; border-radius: 50%; border: 0; background: rgba(255,255,255,.16); color: #fff; font-size: 17px; cursor: pointer; touch-action: manipulation; }
.ar-spd button:disabled { opacity: .35; cursor: default; }
.ar-toon .ar-spd { background: #fff; border: 2px solid #2e1065; color: #2e1065; box-shadow: 0 3px 0 #2e1065; font-family: 'Nunito', system-ui, sans-serif; }
.ar-toon .ar-spd button { background: #ede9fe; color: #2e1065; }
.ar-sx-hud { position: absolute; left: 16px; right: 16px; bottom: 14px; z-index: 6; display: flex;""")

# ---- 3. the Study Arcade's own Pace choices ------------------------------------------------------------------------
rep("""seg(opts, 'Pace', [{ t: 'Easy · slower, up to 2 moles', v: 'easy' },""",
    """seg(opts, 'Pace', [{ t: 'Very slow 🐢', v: 'veryslow' }, { t: 'Slow', v: 'slow' }, { t: 'Easy · slower, up to 2 moles', v: 'easy' },""")
rep("""seg(opts, 'Pace', [{ t: 'Easy · 3 big fruits, slow', v: 'easy' },""",
    """seg(opts, 'Pace', [{ t: 'Very slow 🐢', v: 'veryslow' }, { t: 'Slow', v: 'slow' }, { t: 'Easy · 3 big fruits', v: 'easy' },""")

# ---- 4. Minest Live: the teacher's pace, the speed switch, and what each game gets --------------------------------
rep("""[['easy', 'Easy'], ['normal', 'Normal'], ['fast', 'Fast']].map(function (p) { return '<button type="button" class="mlv-chip' + (st.pace === p[0] ? ' on' : '') + '" data-pace="' + p[0] + '">' + p[1] + '</button>'; }).join('') + '</div>' +""",
    """[['veryslow', 'Very slow 🐢'], ['slow', 'Slow'], ['easy', 'Easy'], ['normal', 'Normal'], ['fast', 'Fast']].map(function (p) { return '<button type="button" class="mlv-chip' + (st.pace === p[0] ? ' on' : '') + '" data-pace="' + p[0] + '">' + p[1] + '</button>'; }).join('') + '</div>' +
        '<div class="mlv-chips"><button type="button" class="mlv-chip' + (st.spd !== false ? ' on' : '') + '" data-spd>' + (st.spd !== false ? '✓' : '✕') + ' Students can change speed (🐢 / 🐇 in Glass Fruit &amp; Whack-a-Term)</button></div>' +""")
rep("""$$(o.body, '[data-pace]').forEach(function (btn) { btn.onclick = function () { st.pace = btn.getAttribute('data-pace'); render(); }; });""",
    """$$(o.body, '[data-pace]').forEach(function (btn) { btn.onclick = function () { st.pace = btn.getAttribute('data-pace'); render(); }; });
      var spdB = $(o.body, '[data-spd]'); if (spdB) spdB.onclick = function () { st.spd = st.spd === false; render(); };""")
rep("""pace: 'normal', goal: 'levels'""", """pace: 'slow', spd: true, goal: 'levels'""")
rep("""pace: st.pace,""", """pace: st.pace, spd: st.spd !== false,""", 2)
rep("""      var opts = { level: host.pace || 'normal', run: 'short', dir: 'mix', speed: host.pace === 'fast' ? 0.8 : host.pace === 'easy' ? 3 : 1.5 };""",
    """      var pace = host.pace || 'normal', slowPace = pace === 'slow' || pace === 'veryslow';
      var opts = { level: (k === 'slice' || k === 'whack') ? pace : (slowPace ? 'easy' : pace), allowSpeed: host.spd !== false, run: 'short', dir: 'mix', speed: pace === 'fast' ? 0.8 : (pace === 'easy' || slowPace) ? 3 : 1.5 };   /* only Glass Fruit and Whack-a-Term have the slower levels */""")

# ---- 5. smoother with a full class ----------------------------------------------------------------------------------
rep("""var tier = reduce ? 2 : 0, dtAvg = 0.016, slow = 0;""",
    """var tier = reduce ? 2 : ((window.__arToon || (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4) ? 1 : 0), dtAvg = 0.016, slow = 0;""", 4)
rep("""if (++slow > 90)""", """if (++slow > 40)""", 4)
rep("""stateNow = hostData.state;
        draw();
      });""",
    """stateNow = hostData.state;
        drawSoon();   /* 20 players answering: one redraw per 0.35 s, not one per answer */
      });
      var drawT = 0, drawLast = 0;
      function drawSoon() { if (drawT) return; drawT = setTimeout(function () { drawT = 0; drawLast = Date.now(); draw(); }, Math.max(0, 350 - (Date.now() - drawLast))); }
      o.cleanup.push(function () { clearTimeout(drawT); });
      var lbAt = 0;""")
rep("""if (stateNow === 'live') { draw(); checkEnd(); publishLb(); }""",
    """if (stateNow === 'live') { draw(); checkEnd(); if (Date.now() - lbAt > 3000) { lbAt = Date.now(); publishLb(); } }   /* the ranking every student receives: at most every 3 s */""")

# the settings fold stays open while the teacher clicks through its options (it used to close on every click)
rep("""details.innerHTML='<summary>关卡、节奏与目标设置</summary>';settings.before(details);""",
    """details.innerHTML='<summary>关卡、节奏与目标设置</summary>';if(o.__setOpen)details.open=true;details.addEventListener('toggle',function(){o.__setOpen=details.open;});settings.before(details);""")

SRC.write_text(s, encoding='utf-8')
for c in COPIES:
    shutil.copyfile(SRC, ROOT / c)
print('patched', SRC.name, 'and', len(COPIES), 'copies ·', hashlib.sha1(s.encode()).hexdigest()[:10])
