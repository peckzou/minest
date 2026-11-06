"""Minest Live 74 — on the student side (iphone.html?play=1 = /play, and every page that carries Minest Live):

1. Octo shows in the waiting games again. Student mode pins the Mini Pet to the bottom-left corner with !important
   (so it never covers a button); Octo Dive, Flappy Octo and Energy Rush move Octo — the player — with plain inline
   styles, so it stayed in the corner under the game. tools/live/live-octo.js lets the game place it while a .mlv-of
   game is open; the pin is back when it closes.
2. The ten teaching games (MinestTeachingTen: Drag Matching … Reveal) are levels of a live game too. They are added to
   LEVELS (off by default — the teacher switches each one on in the Levels chips); a student's level opens the teaching
   game on the live game's cards (tools/live/live-teach.js) and its result is reported as Live's own (stars, coins,
   unlocks).
Safe to re-run."""
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
FILES = ['iphone.html', 'iPhone53.8241.html', 'index.html', 'ipad.html', 'iPhoneDuo.html', 'iPhoneDuo69.html',
         'ios/Minest/Minest/iphone.html', 'ios/Minest/Minest/iphone18.0.html', 'ios/Minest/Minest/ipad.html',
         'ios/Minest/Minest/index.html', 'ios/Minest/Minest/iPhoneDuo.html']
TEN = [('dragmatching', '🧲', 'Drag Matching', '拖拽配对'), ('missing', '🫥', "What's Missing · 教学版", '哪张消失了'),
       ('disappear', '🌙', 'Disappearing', '逐张消失'), ('memorygrid', '🧠', 'Memory Grid', '记忆网格'),
       ('scramble', '🔤', 'Word Scramble', '拖拽拼词'), ('tf', '⚡', 'True or False', '滑动对决'),
       ('match', '🧩', 'Memory Match', '翻牌对决'), ('find', '🔎', 'Find It', '寻词探险'),
       ('bingo', '🎯', 'Vocabulary Bingo', '词义 Bingo'), ('reveal', '🎁', 'Reveal', '揭格猜词')]
LV = ''.join(",\n    { k: 'tt-%s', name: %s, icon: '%s', tag: '教学游戏 · %s', teach: '%s' }" % (k, repr(n), i, t, k) for k, i, n, t in TEN)
EDITS = [
    ("    { k: 'smash', name: 'Smash It', icon: '💎', tag: 'Boss level · smash the answer' }\n  ];",
     "    { k: 'smash', name: 'Smash It', icon: '💎', tag: 'Boss level · smash the answer' }" + LV + "   /* 74: the ten teaching games */\n  ];"),
    ("levels: LEVELS.map(function (l) { return l.k; }), pace:",
     "levels: LEVELS.filter(function (l) { return !l.teach; }).map(function (l) { return l.k; }), pace:"),   # teaching games: off until the teacher picks them
    ("      var TO = window.MinestArcadeToon; if (TO) TO.on(k);   // Blooket style",
     "      var TO = levelInfo(k).teach ? null : window.MinestArcadeToon; if (TO) TO.on(k);   // Blooket style"),
    ("      var ok = SA.level ? SA.level(host.board, k, opts) : false;",
     "      var ok = levelInfo(k).teach ? !!(window.MinestLiveTeach && MinestLiveTeach.start(host.board, levelInfo(k).teach, k)) : SA.level ? SA.level(host.board, k, opts) : false;   // 74: a teaching game"),
    ("      if (d.mode && d.mode !== k) return;\n      var passed",
     "      if (d.mode && d.mode !== k) return;\n      if (L.teach && d.c != null) { run.c = d.c; run.w = d.w || 0; run.seen = d.c + run.w; }   // 74: the teaching game counted its own answers\n      var passed"),
    ("      if (r && SA && SA.isOpen && SA.isOpen()) SA.close(true);",
     "      if (r && SA && SA.isOpen && SA.isOpen()) SA.close(true);\n      if (r && levelInfo(r.k).teach && window.MinestLiveTeach) { MinestLiveTeach.stop(); if (window.MinestTemplates && MinestTemplates.isOpen()) MinestTemplates.close(); }   // 74"),
    ("LEVELS.map(function (l, i) { return '<button type=\"button\" class=\"mlv-chip'",
     "LEVELS.map(function (l, i) { return (l.teach && !LEVELS[i - 1].teach ? '<span class=\"mlv-chip-sep\">🎓 教学游戏 · 点一下放进学生端</span>' : '') + '<button type=\"button\" class=\"mlv-chip'"),   # 74: the teaching games, their own group
    ("options=Object.assign({},options||{});try{board=Sets.read();}catch(e){alert(e.message);return;}",
     "options=Object.assign({},options||{});try{if(!options.liveBoard)board=Sets.read();}catch(e){alert(e.message);return;}"),   # 74: a live game's own cards stay its own
]
BLOCK = '<script id="mn-live-74">\n' + (HERE / 'live-octo.js').read_text(encoding='utf-8') + '\n' + (HERE / 'live-teach.js').read_text(encoding='utf-8') + '</script>\n'
assert BLOCK.lower().count('</script') == 1

for f in FILES:
    p = ROOT / f
    if not p.exists():
        continue
    s = p.read_text(encoding='utf-8')
    if "{ k: 'flinger', name: 'Card Flinger'" not in s:
        continue
    for a, b in EDITS:
        if b in s:
            continue
        assert s.count(a) == 1, (f, a[:60], s.count(a))
        s = s.replace(a, b)
    s = re.sub(r'<script id="mn-live-74">.*?</script>\n', '', s, flags=re.S)
    i = s.rindex('</body>')
    s = s[:i] + BLOCK + s[i:]
    p.write_text(s, encoding='utf-8')
    print('patched', f)
