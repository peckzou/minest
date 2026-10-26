"""Minest Live · stars rank the class, pay the rewards and open the privileges (2026-10-26).
- The leaderboard ranks by ★ stars (each level's best result, 3 at most) — then levels cleared, score, coins.
- A NEW star on a checked level pays coins (5 × your money per question, at least 15) and 5 💎; the same stars again
  pay nothing, so replaying cannot farm; self-judged warm-ups pay no star reward.
- Five tiers by the share of this game's stars: 🌱 Rookie · 🥉 Bronze 20% · 🥈 Silver 40% · 🥇 Gold 60% · 💎 Diamond 85%.
  A tier opens chests (Wooden → Silver → Golden), how far upgrades go (Lv 2 → 4 → 6 → 8 → all) and power-ups
  (Mini → Streak Shield → Mega). The shop shows the tier, the next one and 🔒 N★ on what is still closed.
Run after patch_live_coins.py; applied to minest-live.js and every page carrying a copy."""
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
FILES = ['tools/web31/minest-live.js', 'iPhone53.8241.html', 'iphone.html', 'index.html', 'ios/Minest/Minest/iphone.html', 'ios/MinestProject/MyApp/iphone.html',
         'ios/Minest/Minest/iphone18.0.html', 'ipad.html', 'ios/Minest/Minest/ipad.html', 'iPhoneDuo.html', 'web31.0.html', 'web31.1.html', 'web31.play.html', 'web31.1.play.html']
R = [
 ("var rankBy = 'money', lbSent = '';", "var rankBy = 'stars', lbSent = '';   // ★ stars rank the class"),
 ("stars: { name: '★ Stars', cmp: function (a, b) { return b.stars - a.stars || b.cleared - a.cleared || b.sc - a.sc; },",
  "stars: { name: '★ Stars', cmp: function (a, b) { return b.stars - a.stars || b.cleared - a.cleared || b.sc - a.sc || b.m - a.m; },"),
 ("  function starsOf(c, w) { var a = c + w ? c / (c + w) : 1; return a >= 0.9 ? 3 : a >= 0.75 ? 2 : 1; }\n",
  """  function starsOf(c, w) { var a = c + w ? c / (c + w) : 1; return a >= 0.9 ? 3 : a >= 0.75 ? 2 : 1; }
  // ★ stars rank the class, pay the rewards and open the privileges. A NEW star on a checked level pays coins and 💎;
  // tiers by the share of the game's stars open chests, how far upgrades go and power-ups.
  var STAR_GEMS = 5;
  function starCoins(s) { return Math.max(15, Math.round(earnOf({ u: s.u, streak: 1, coll: s.coll }) * 5)); }
  var TIERS = [
    { f: 0, n: 'Rookie', ic: '🌱', up: 2, pw: [], pk: ['wood'] },
    { f: .2, n: 'Bronze', ic: '🥉', up: 4, pw: ['mini'], pk: ['wood'] },
    { f: .4, n: 'Silver', ic: '🥈', up: 6, pw: ['mini', 'shield'], pk: ['wood', 'silver'] },
    { f: .6, n: 'Gold', ic: '🥇', up: 8, pw: ['mini', 'shield', 'mega'], pk: ['wood', 'silver', 'gold'] },
    { f: .85, n: 'Diamond', ic: '💎', up: 9, pw: ['mini', 'shield', 'mega'], pk: ['wood', 'silver', 'gold'] }
  ];
  function tierNeed(i, max) { return Math.ceil(TIERS[i].f * max); }
  function tierAt(stars, max) { var t = 0; TIERS.forEach(function (x, i) { if (stars >= tierNeed(i, max)) t = i; }); return t; }
  function tierNews(i) {   // what tier i opens that the one before did not
    var a = TIERS[i], b = TIERS[i - 1] || { up: 0, pw: [], pk: [] }, out = [];
    a.pk.forEach(function (k) { if (b.pk.indexOf(k) < 0) out.push(PACKS[k].name); });
    a.pw.forEach(function (k) { if (b.pw.indexOf(k) < 0) out.push(POWER[k].name); });
    if (a.up > b.up) out.push(a.up >= 9 ? 'every upgrade level' : 'upgrades to Lv ' + a.up);
    return out.join(' · ');
  }
"""),
 ("""        s.lv[k] = Math.max(s.lv[k] || 0, stars);
        prize = 0;   // a cleared level gives stars, not coins: replaying a level must not farm coins""",
  """        var had = s.lv[k] || 0, fresh = Math.max(0, stars - had);
        s.lv[k] = Math.max(had, stars);
        // only NEW stars pay (coins and 💎): the same stars again pay nothing, so replaying cannot farm
        run.newStars = L.self ? 0 : fresh; prize = run.newStars * starCoins(s);
        if (prize) { s.money += prize; gems(run.newStars * STAR_GEMS); }"""),
 ("""'<br>Earned ' + money(r.earned) + (prize ? ' + level bonus ' + money(prize) : '') + '</p>' +""",
  """'<br>Earned ' + money(r.earned) + (prize ? '<br>⭐ ' + r.newStars + ' new star' + (r.newStars > 1 ? 's' : '') + ': +' + money(prize) + ' · 💎 +' + r.newStars * STAR_GEMS : '') + '</p>' +"""),
 ("""    function packPrice(k) { return Math.round(PACKS[k].price(earnOf({ u: s.u, streak: 1 }))); }""",
  """    function packPrice(k) { return Math.round(PACKS[k].price(earnOf({ u: s.u, streak: 1 }))); }
    // ★ privileges: the more stars, the more of the shop
    function myStars() { var n = 0; Object.keys(s.lv).forEach(function (x) { n += s.lv[x] || 0; }); return n; }
    function maxStars() { return Math.max(3, host.levels.length * 3); }
    function myTier() { return tierAt(myStars(), maxStars()); }
    function needFor(test) { for (var i = 0; i < TIERS.length; i++) if (test(TIERS[i])) return i <= myTier() ? 0 : tierNeed(i, maxStars()); return 0; }
    function packLock(k) { return needFor(function (t) { return t.pk.indexOf(k) >= 0; }); }
    function upLock(lv) { return needFor(function (t) { return t.up >= lv; }); }
    function pwLock(k) { return needFor(function (t) { return t.pw.indexOf(k) >= 0; }); }
    function tierHtml() {
      var st = myStars(), mx = maxStars(), ti = myTier(), T = TIERS[ti], nx = TIERS[ti + 1];
      return '<section class="mlv-card" style="display:flex;flex-direction:column;gap:4px"><div style="font-size:20px;font-weight:900">' + T.ic + ' ' + T.n + ' · ★ ' + st + ' / ' + mx + '</div>' +
        '<small>' + (nx ? 'Next: ' + nx.ic + ' ' + nx.n + ' at ★ ' + tierNeed(ti + 1, mx) + ' — opens ' + tierNews(ti + 1) : 'Every privilege is open ✓') + '</small>' +
        '<small style="opacity:.75">Each new star: +' + money(starCoins(s)) + ' and 💎 ' + STAR_GEMS + ' · the same stars again pay nothing</small></section>';
    }"""),
 ("""        var P = PACKS[k], price = packPrice(k), can = s.money >= price;""",
  """        var P = PACKS[k], price = packPrice(k), lock = packLock(k), can = !lock && s.money >= price;"""),
 ("""'>Open · ' + money(price) + '</button></div>';""",
  """'>' + (lock ? '🔒 ' + lock + '★' : 'Open · ' + money(price)) + '</button></div>';"""),
 ("""      var price = packPrice(k); if (s.money < price) return;
      s.money -= price; s.packs = (s.packs || 0) + 1;""",
  """      var price = packPrice(k); if (s.money < price || packLock(k)) return;
      s.money -= price; s.packs = (s.packs || 0) + 1;"""),
 ("""      o.body.innerHTML = hud() + lockerHtml(avatar()) + packsHtml() +""",
  """      o.body.innerHTML = hud() + tierHtml() + lockerHtml(avatar()) + packsHtml() +"""),
 ("""        var u = UPG[k], lv = s.u[k], nx = lv + 1 < u.vals.length ? lv + 1 : -1, can = nx > 0 && s.money >= u.cost[nx];""",
  """        var u = UPG[k], lv = s.u[k], nx = lv + 1 < u.vals.length ? lv + 1 : -1, lock = nx > 0 ? upLock(nx) : 0, can = nx > 0 && !lock && s.money >= u.cost[nx];"""),
 ("""'>Buy · ' + money(u.cost[nx]) + '</button>' : '') + '</div>';""",
  """'>' + (lock ? '🔒 ' + lock + '★' : 'Buy · ' + money(u.cost[nx])) + '</button>' : '') + '</div>';"""),
 ("""owned = (k === 'shield' && s.shield > 0) || (k !== 'shield' && s.bonus > 1), can = s.money >= price && !owned;""",
  """owned = (k === 'shield' && s.shield > 0) || (k !== 'shield' && s.bonus > 1), lock = pwLock(k), can = !lock && s.money >= price && !owned;"""),
 ("""(owned ? 'Ready ✓' : 'Buy · ' + money(price))""", """(owned ? 'Ready ✓' : lock ? '🔒 ' + lock + '★' : 'Buy · ' + money(price))"""),
 ("""if (s.money < u.cost[nx]) return; s.money -= u.cost[nx];""", """if (s.money < u.cost[nx] || upLock(nx)) return; s.money -= u.cost[nx];"""),
 ("""price = Math.round(POWER[k].price(earnOf({ u: s.u, streak: 1 }))); if (s.money < price) return;""",
  """price = Math.round(POWER[k].price(earnOf({ u: s.u, streak: 1 }))); if (s.money < price || pwLock(k)) return;"""),
 ("""'<div class="mlv-card mlv-hud"><span class="mlv-cash"><i class="mlv-av">' + avHtml(withWear(avatar())) + '</i>' + money(s.money) + '</span>'""",
  """'<div class="mlv-card mlv-hud"><span class="mlv-cash"><i class="mlv-av">' + avHtml(withWear(avatar())) + '</i>' + money(s.money) + '</span><span class="mlv-pill">' + TIERS[myTier()].ic + ' ★ ' + myStars() + '</span>'"""),
]
for f in FILES:
    p = ROOT / f
    if not p.exists(): print('skip (missing)', f); continue
    s = p.read_text(encoding='utf-8'); n = 0; miss = []
    for a, b in R:
        if b in s: continue
        c = s.count(a)
        if c != 1: miss.append((a.strip()[:60], c)); continue
        s = s.replace(a, b); n += 1
    p.write_text(s, encoding='utf-8'); print(f, n, 'change(s)', ('MISSING: %s' % miss) if miss else '')
