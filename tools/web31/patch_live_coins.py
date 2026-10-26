"""Minest Live · coins only for right answers (2026-10-26, a hole students used in class).
Before: self-judged warm-up cards paid on every swipe ("mastered" full, "again" half) — swiping fast farmed coins with
no answer checked — and every cleared level paid a level bonus (money per question × 10 × stars first time, × 3 on every
replay, raised again by the cards' "level bonus" perk), so replaying a level farmed it too.
Now: warm-ups pay nothing (✓ / ↺ only, they still unlock the games); clearing a level still gives its stars, no coins.
Coins come only from right answers in the checked levels (money per question + streak bonus, multiplier, card perks).
Applied to tools/web31/minest-live.js and every page that carries a copy of it."""
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
FILES = ['tools/web31/minest-live.js', 'iPhone53.8241.html', 'iphone.html', 'index.html', 'ios/Minest/Minest/iphone.html', 'ios/MinestProject/MyApp/iphone.html',
         'ios/Minest/Minest/iphone18.0.html', 'ipad.html', 'ios/Minest/Minest/ipad.html', 'iPhoneDuo.html', 'web31.0.html', 'web31.1.html', 'web31.play.html', 'web31.1.play.html']
R = [("""        // warm-ups are self-judged: a flat pay per card, an honest "again" costs nothing
        gain = UPG.mpq.vals[s.u.mpq] * UPG.mult.vals[s.u.mult] * (d.result === 'mastered' ? 1 : 0.5) * run.bonus * (1 + perksOf(s).cash / 100);
        s.money += gain; run.earned += gain; pop('+' + money(gain), true);""",
      """        // warm-ups are self-judged: nobody checks them, so they pay nothing (coins are for right answers only)
        pop(d.result === 'mastered' ? '✓' : '↺', true);"""),
     ("""        prize = Math.round(earnOf({ u: s.u, streak: 1, coll: s.coll }) * (first ? 10 : 3) * stars * (1 + perksOf(s).bonus / 100));
        s.money += prize;""",
      """        prize = 0;   // a cleared level gives stars, not coins: replaying a level must not farm coins""")]
for f in FILES:
    p = ROOT / f
    if not p.exists(): print('skip (missing)', f); continue
    s = p.read_text(encoding='utf-8'); n = 0
    for a, b in R:
        if b in s: continue
        c = s.count(a)
        if c == 0: print('  anchor not found in', f, '·', a.strip()[:50]); continue
        s = s.replace(a, b); n += c
    p.write_text(s, encoding='utf-8'); print(f, n, 'change(s)')
