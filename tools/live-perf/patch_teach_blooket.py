"""Teaching games (template wall) · the question and the answers get the screen, in Blooket style.
Applied in place to iPhone53.8241.html, then copied to iphone.html, index.html and the two iOS copies.

While an activity plays (#mn-templates.sx-play):
- Out of the way until asked for: the top tool bar, 课堂工具, 教学引导, the activity title + its note + 本卡配图, the mode
  pills (判断维度 …). The HUD's ☰ shows them all again (root class sx-chrome); ✕ goes back to the game library.
- The HUD is one slim row (icon · Round · 🔥 · ⭐ · ✓ · 🔊 ⏭ ⛶ ☰ ✕).
- Blooket look: a purple stage, the question on a big white chunky card, the answers as Blooket's four colour blocks
  (orange / blue / green / red) with white text and a bottom edge; a right answer glows green, a wrong one shakes.
  Word cards in grids (Find It, Bingo, Memory, drag games) become white chunky cards with a coloured edge.
- The control row (↻ · 下一轮 → · 返回) is one compact row at the bottom.
The Solo map (tt-quest824) has its own look and is not touched.
"""
from pathlib import Path
import shutil, sys

ROOT = Path('/Users/cece/Documents/minest')
SRC = ROOT / 'iPhone53.8241.html'
COPIES = ['iphone.html', 'index.html', 'ios/Minest/Minest/iphone.html', 'ios/MinestProject/MyApp/iphone.html', 'ios/Minest/Minest/iphone18.0.html']
s = SRC.read_text(encoding='utf-8')
if 'id="teaching-blooket-play"' in s:
    sys.exit('already patched')

def rep(a, b, n=1):
    global s
    c = s.count(a); assert c == n, (a[:100], c, n); s = s.replace(a, b)

# HUD: ☰ (tools & settings) and ✕ (back to the library)
rep("""<button type="button" data-sx-auto title="答对后自动下一题">⏭</button>""",
    """<button type="button" data-sx-auto title="答对后自动下一题">⏭</button>""")
rep("""<button type="button" data-sx-big title="投屏大字">⛶</button>""",
    """<button type="button" data-sx-big title="投屏大字">⛶</button><button type="button" data-sx-menu title="工具与设置">☰</button><button type="button" data-sx-home title="返回游戏库">✕</button>""")
rep("""      bind('[data-sx-big]',function(){""",
    """      bind('[data-sx-menu]',function(){root.classList.toggle('sx-chrome');sxPaint();});
      bind('[data-sx-home]',function(){root.classList.remove('sx-chrome');library();});
      bind('[data-sx-big]',function(){""")
rep("""h.querySelector('[data-sx-auto]').classList.toggle('on',sxAutoOn());""",
    """h.querySelector('[data-sx-auto]').classList.toggle('on',sxAutoOn());h.querySelector('[data-sx-menu]').classList.toggle('on',root.classList.contains('sx-chrome'));""")

P = '#mn-templates.tt-sx.sx-play:not(.tt-quest824)'
CSS = """<style id="teaching-blooket-play">
/* ---- focus layout: tools hide while a question is on screen (☰ brings them back) ---- */
P:not(.sx-chrome) > header, P:not(.sx-chrome) > details.u-tools, P:not(.sx-chrome) .tt-wrap > details.u-guide,
P:not(.sx-chrome) .tt-wrap > .tt-panel > .tt-row:first-child, P:not(.sx-chrome) .tt-wrap > .tt-panel > p.tt-muted:nth-of-type(1),
P:not(.sx-chrome) .tt-pill-bar, P:not(.sx-chrome) [data-open-wall-spy], P:not(.sx-chrome) [data-inline-quick-img] { display: none !important; }
P > main { background: radial-gradient(120% 80% at 50% 0%, #8b5cf6 0%, #6d28d9 45%, #4c1d95 100%) !important; }
P .tt-wrap { padding-top: 8px; font-family: "Nunito", "PingFang SC", system-ui, sans-serif; }
/* ---- the HUD: one slim row ---- */
P .sx-hud { padding: 6px 10px 8px; margin-bottom: 10px; border-radius: 18px; background: rgba(30, 10, 70, .55); box-shadow: 0 4px 0 rgba(0,0,0,.25); }
P .sx-hud-top { flex-wrap: nowrap; gap: 6px; }
P .sx-mode { flex: 1 1 auto; font-size: 14px; }
P .sx-mode i { width: 28px; height: 28px; font-size: 15px; border-radius: 9px; }
P .sx-round { font-size: 12px; padding: 3px 8px; }
P .sx-stats { flex-wrap: nowrap; gap: 4px; }
P .sx-pill { font-size: 12px; padding: 3px 7px; }
P .sx-hud button { font-size: 13px; padding: 4px 7px; }
P .sx-bar { margin-top: 6px; height: 8px; }
@media (max-width: 560px) { P .sx-mode b, P .sx-round { display: none; } P .sx-stats .sx-pill:nth-child(3) { display: none; } }
/* ---- the panel is the stage, not a card ---- */
P .tt-wrap > .tt-panel { background: transparent !important; border: 0 !important; box-shadow: none !important; padding: 0 !important; color: #fff; }
P .tt-wrap > .tt-panel > h2, P .tt-wrap > .tt-panel > p, P .tt-wrap > .tt-panel label { color: #f5f3ff; }
/* ---- the question: a big white chunky card ---- */
P .tt-big, P .tt-card, P [data-flash], P .pl-spy-clue, P [data-bingo-clue], P .tt-lead, P .tt-panel > .tt-word, P .t809-sent, P .x-question {
  background: #fff !important; color: #2e1065 !important; border: 0 !important; border-radius: 22px !important; box-shadow: 0 7px 0 rgba(46,16,101,.45), 0 18px 34px rgba(0,0,0,.2) !important;
  padding: 18px 16px !important; margin: 0 0 16px !important; text-align: center; font-weight: 800; }
P .tt-big, P [data-flash] { font-size: clamp(24px, 6vw, 40px) !important; min-height: 120px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; }
P .tt-big ruby, P [data-flash] ruby, P .tt-card h2 { font-size: clamp(34px, 9vw, 56px); font-weight: 900; color: #2e1065; }
P .tt-big rt, P [data-flash] rt { font-size: .38em; color: #7c3aed; }
P .tt-big p, P .tt-big .tt-muted, P [data-flash] .tt-muted { color: #4c1d95 !important; font-size: 17px; font-weight: 700; }
P .tt-big img, P .sx-cue-img { max-height: 34vh !important; border-radius: 14px; }
P .pl-spy-clue [data-find-clue] { font-size: clamp(18px, 5vw, 26px) !important; color: #2e1065 !important; }
/* ---- answers: Blooket's four colour blocks ---- */
P .tt-options { display: grid !important; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin: 0 0 14px; }
P .tt-options > button, P [data-x-quiz-choice], P [data-class-answer], P [data-x-bool]{
  --bk: #ffa31e; --bkd: #c47100;
  min-height: 78px; padding: 12px 10px !important; border: 0 !important; border-radius: 16px !important; background: var(--bk) !important; color: #fff !important;
  font: 900 clamp(18px, 5vw, 26px)/1.15 "Nunito", "PingFang SC", system-ui, sans-serif !important; text-shadow: 0 2px 0 rgba(0,0,0,.18);
  box-shadow: inset 0 -6px 0 var(--bkd), 0 6px 14px rgba(0,0,0,.18) !important; transition: transform .12s, filter .12s; cursor: pointer; }
P .tt-options > button:nth-child(4n+2), P [data-x-quiz-choice]:nth-child(4n+2), P [data-class-answer]:nth-child(4n+2), P [data-x-bool]:nth-child(2){ --bk: #00b8f0; --bkd: #0078a8; }
P .tt-options > button:nth-child(4n+3), P [data-x-quiz-choice]:nth-child(4n+3), P [data-class-answer]:nth-child(4n+3){ --bk: #4bc22e; --bkd: #2e8a16; }
P .tt-options > button:nth-child(4n+4), P [data-x-quiz-choice]:nth-child(4n+4), P [data-class-answer]:nth-child(4n+4){ --bk: #ff5a3c; --bkd: #c22f15; }
P .tt-options > button rt{ color: rgba(255,255,255,.9); text-shadow: none; }
P .tt-options > button:not(:disabled):hover{ transform: translateY(-3px); filter: brightness(1.06); }
P .tt-options > button:not(:disabled):active { transform: translateY(2px); box-shadow: inset 0 -2px 0 var(--bkd) !important; }
P .tt-options > button.tt-correct{ --bk: #22c55e; --bkd: #15803d; outline: 4px solid #fff; animation: blkPop .35s ease; }
P .tt-options > button.tt-incorrect{ filter: grayscale(.7) brightness(.85); animation: blkShake .35s ease; }
P .tt-options > button:disabled:not(.tt-correct) { opacity: .55; }
P .tt-options .tt-mini-thumb { display: block; margin: 0 auto 6px; max-height: 56px; border-radius: 8px; }
P .tt-options .sx-say { background: rgba(255,255,255,.28); color: #fff; box-shadow: none; }
/* ---- word cards in grids: white chunky cards with a coloured edge ---- */
P .pl-spy-card, P [data-bingo], P .t809-match > button, P .tt-grid > button, P .d3-tile, P .il-chip, P .il-target, P .cl818-card, P [data-x-spot] {
  border: 0 !important; border-radius: 16px !important; background: #fff !important; color: #2e1065 !important; font-weight: 900 !important;
  box-shadow: inset 0 -5px 0 #c4b5fd, 0 6px 14px rgba(0,0,0,.16) !important; }
P .pl-spy-card:nth-child(4n+2), P [data-bingo]:nth-child(4n+2), P .tt-grid > button:nth-child(4n+2) { box-shadow: inset 0 -5px 0 #7dd3fc, 0 6px 14px rgba(0,0,0,.16) !important; }
P .pl-spy-card:nth-child(4n+3), P [data-bingo]:nth-child(4n+3), P .tt-grid > button:nth-child(4n+3) { box-shadow: inset 0 -5px 0 #86efac, 0 6px 14px rgba(0,0,0,.16) !important; }
P .pl-spy-card:nth-child(4n+4), P [data-bingo]:nth-child(4n+4), P .tt-grid > button:nth-child(4n+4) { box-shadow: inset 0 -5px 0 #fdba74, 0 6px 14px rgba(0,0,0,.16) !important; }
P .pl-spy-card.tt-correct, P .pl-spy-card.pl-found, P [data-bingo].tt-correct, P .tt-grid > button.tt-correct { background: #dcfce7 !important; box-shadow: inset 0 -5px 0 #22c55e !important; }
/* ---- feedback: a Blooket banner ---- */
P .tt-feedback:not(:empty) { margin: 0 0 12px; padding: 10px 14px; border-radius: 14px; font-weight: 900; font-size: 18px; text-align: center; color: #fff !important; }
P .tt-feedback.tt-good { background: #22c55e; box-shadow: inset 0 -4px 0 #15803d; }
P .tt-feedback.tt-bad { background: #ef4444; box-shadow: inset 0 -4px 0 #b91c1c; }
P [data-prepared-hint] { font-size: 14px; padding: 6px 12px; border-radius: 999px; border: 0; background: rgba(255,255,255,.18); color: #fff; }
/* ---- controls: one compact row ---- */
P .tt-control { display: flex !important; gap: 8px; margin-top: 10px; flex-wrap: nowrap; }
P .tt-control > button { min-height: 44px; padding: 8px 12px !important; border-radius: 14px !important; border: 0 !important; font-weight: 900; font-size: 15px; background: rgba(255,255,255,.18) !important; color: #fff !important; box-shadow: inset 0 -3px 0 rgba(0,0,0,.2) !important; }
P .tt-control > button.tt-primary { flex: 1; background: #fff !important; color: #6d28d9 !important; box-shadow: inset 0 -4px 0 #c4b5fd !important; }
P .tt-control > button.tt-primary:disabled { opacity: .45; }
P .tt-control > [data-restart] { font-size: 0 !important; width: 48px; } P .tt-control > [data-restart]::before { content: '↻'; font-size: 18px; }
P .tt-control > [data-return] { font-size: 0 !important; width: 48px; } P .tt-control > [data-return]::before { content: '✕'; font-size: 16px; }
/* the slim HUD's ☰ shows everything again */
P.sx-chrome .tt-wrap > .tt-panel > .tt-row:first-child h2 { color: #fff; }
/* notes and status lines stay readable on the purple stage */
P .tt-wrap > .tt-panel .tt-muted, P .il-instruction, P [data-find-status], P .tt-wrap > .tt-panel > p { color: rgba(255,255,255,.86) !important; font-size: 14px; font-weight: 700; }
P .tt-big .tt-muted, P .tt-card .tt-muted, P .pl-spy-clue p, P .pl-spy-clue [data-find-status] { color: #4c1d95 !important; }
@keyframes blkPop { 0% { transform: scale(.94); } 60% { transform: scale(1.05); } 100% { transform: none; } }
@keyframes blkShake { 20%, 60% { transform: translateX(-6px); } 40%, 80% { transform: translateX(6px); } }
@media (prefers-reduced-motion: reduce) { P .tt-options > button { animation: none !important; transition: none !important; } }
</style>
""".replace('P ', P + ' ').replace('P:', P + ':').replace('P.', P + '.').replace('P >', P + ' >')
rep('</head>', CSS + '</head>')

SRC.write_text(s, encoding='utf-8')
for c in COPIES:
    shutil.copyfile(SRC, ROOT / c)
print('patched Blooket play layout')
