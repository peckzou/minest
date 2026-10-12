#!/usr/bin/env python3
"""Minest Live on the iPhone / iPad pages.

    python3 tools/mobile/live_mobile.py iPhone46.3.html iPhone46.4.html "Minest iPhone 46.4 · Minest Live" 46.4
    python3 tools/mobile/live_mobile.py iPad45.7.html iPad45.8.html "Minest iPad 45.8 · Minest Live" 45.8

Adds to a page: the Study Arcade changes Minest Live needs (tools/web31/build.py: arcade_patches), the whole
Minest Live (tools/web31/minest-live.js: teacher + student, Solo play, the Locker, the Octo games, 💎 for the
Arcade's games), 🎓 Teacher · 🎮 Join · 👕 Locker in the Arcade's top bar, and the Arcade's top bar clear of
the status bar (on the iPad its buttons sat under it and could not be tapped).
"""
import os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
import importlib.util
_spec = importlib.util.spec_from_file_location('web31_build', os.path.join(REPO, 'tools', 'web31', 'build.py'))
web31 = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(web31)   # (web30's builder is also called build)

BUTTONS = r"""
/* Minest Live on the iPhone / iPad: 🎓 Teacher · 🎮 Join · 👕 Locker in the Study Arcade's top bar, with the
   background button, in one liquid-glass capsule; ✕ on its own at the right (not on the students' play page or in a
   student's live session) */
(function () {
  var SVG = function (d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>'; };
  var ICON = {
    te: SVG('<path d="M2.5 9.5 12 5l9.5 4.5L12 14z"/><path d="M6.5 11.6v4.2c0 1.4 2.5 2.7 5.5 2.7s5.5-1.3 5.5-2.7v-4.2"/><path d="M21.5 9.5v5"/>'),
    jo: SVG('<rect x="2.5" y="7" width="19" height="11" rx="5.5"/><path d="M7.5 10.6v3.8M5.6 12.5h3.8"/><circle cx="15.6" cy="11.4" r=".6" fill="currentColor"/><circle cx="17.8" cy="13.6" r=".6" fill="currentColor"/>'),
    lk: SVG('<path d="M8.5 3.5 12 5.2l3.5-1.7 5 3.6-2.6 3.1-1.9-1V20.5H8V9.2l-1.9 1-2.6-3.1z"/>')
  };
  function add() {
    var chips = document.querySelector('.arcade .ar-chips');
    if (!chips || chips.querySelector('.mn-ar-grp') || window.__MINEST_LIVE_STANDALONE || window.__mnNoVoice || !window.MinestLive) return;
    var bg = chips.querySelector('.ar-bgbtn'), grp = document.createElement('div'); grp.className = 'mn-ar-grp';
    [['te', 'Teacher · host a live Arcade game, or play it yourself (Solo play)', function () { window.MinestLive.openTeacher(); }],
     ['jo', 'Join a live Arcade game with a code', function () { window.MinestLive.openJoin(''); }],
     ['lk', 'Locker · your animal and outfits, unlocked with 💎 from the games', function () { if (window.MinestLive.openLocker) window.MinestLive.openLocker(); }]
    ].forEach(function (x) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'ar-btn mn-ar mn-ar-' + x[0]; b.title = x[1]; b.setAttribute('aria-label', x[1].split(' ·')[0]);
      b.innerHTML = ICON[x[0]];
      b.onclick = function (e) { e.stopPropagation(); x[2](); };
      grp.appendChild(b);
    });
    chips.insertBefore(grp, bg || chips.querySelector('.ar-end') || null);
    if (bg) grp.appendChild(bg);
  }
  new MutationObserver(function () { if (document.querySelector('.arcade .ar-chips')) add(); }).observe(document.body, { childList: true });
})();
"""
CSS = """<style id="mn-live-mobile">
/* the Arcade's top bar stays below the status bar (the iPad did not pass taps there to its buttons) */
.arcade .ar-top{padding-top:max(6px, calc(env(safe-area-inset-top, 0px) + 6px))!important}
/* nothing hidden takes room, so ✕ always fits at the right */
.arcade .ar-top-idle .ar-chip,.arcade .ar-top-idle .ar-end{display:none!important}
.arcade .ar-chips{margin-left:auto;gap:8px;min-width:0;flex:none}
/* liquid glass: one capsule for Teacher · Join · Locker · background, ✕ a glass circle of its own */
.arcade .mn-ar-grp{display:flex;align-items:center;gap:2px;padding:3px;border-radius:999px;background:linear-gradient(180deg,rgba(255,255,255,.16),rgba(255,255,255,.05));border:1px solid rgba(255,255,255,.22);box-shadow:inset 0 1px 0 rgba(255,255,255,.35),inset 0 -1px 0 rgba(255,255,255,.06),0 10px 28px rgba(0,0,0,.28);-webkit-backdrop-filter:blur(22px) saturate(180%);backdrop-filter:blur(22px) saturate(180%)}
.arcade .mn-ar-grp .ar-btn{width:36px!important;height:36px!important;min-width:0!important;min-height:0!important;padding:0!important;border-radius:999px!important;border:0!important;background:transparent!important;box-shadow:none!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;display:grid!important;place-items:center;color:rgba(255,255,255,.92)!important;font-size:0}
.arcade .mn-ar-grp .ar-btn:active{background:rgba(255,255,255,.18)!important;transform:scale(.94)}
.arcade .mn-ar-grp svg{width:19px;height:19px}
.arcade .mn-ar-grp .ar-bgbtn svg{width:18px;height:18px}
.arcade .ar-chips .ar-x{flex:none;order:99;width:38px!important;height:38px!important;min-width:0!important;min-height:0!important;padding:0!important;border-radius:999px!important;display:grid!important;place-items:center;color:#fff!important;background:linear-gradient(180deg,rgba(255,255,255,.16),rgba(255,255,255,.05))!important;border:1px solid rgba(255,255,255,.22)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 10px 28px rgba(0,0,0,.28)!important;-webkit-backdrop-filter:blur(22px) saturate(180%);backdrop-filter:blur(22px) saturate(180%)}
/* in a game the capsule steps aside for the score */
.arcade .ar-top:not(.ar-top-idle) .mn-ar-grp{display:none}
</style>
"""


def once(s, a, b, what):
    if s.count(a) != 1:
        raise SystemExit('live_mobile: %s — expected one match, found %d' % (what, s.count(a)))
    return s.replace(a, b)


def pet_patches(s):
    """Pet Raising (46.7): opens from the app bundle (tools/ios/bundle-pet.sh) instead of the website, no
    prefetch in the app, and the ✕ fades with the pet's other controls (the frame says when: 'minest-pet' / 'idle')."""
    s = once(s, "    if (location.protocol === 'file:' && /^octopus-pet-raising-v6\\//.test(path)) return 'https://minest-app.vercel.app/' + path;\n",
             "    // 46.7: the app carries its own copy (ios/Minest/BadgeResources/octopus-pet-raising-v6) — relative to this page\n", 'pet: bundled')
    s = once(s, "  function prefetchPetRaising() {\n", "  function prefetchPetRaising() {\n    if (location.protocol === 'file:') return;   // 46.7: bundled in the app\n", 'pet: no prefetch in the app')
    s = once(s, "    if (d && d.type === 'minest-pet' && d.action === 'close' && f && event.source === f.contentWindow) closePetRaising();\n",
             "    if (d && d.type === 'minest-pet' && d.action === 'close' && f && event.source === f.contentWindow) closePetRaising();\n"
             "    // 46.7: the ✕ hides and comes back with the pet's own controls\n"
             "    if (d && d.type === 'minest-pet' && d.action === 'idle' && f && event.source === f.contentWindow) { var x = document.querySelector('#' + overlayId + ' .minest-pet-x'); if (x) x.classList.toggle('idle', !!d.idle); }\n", 'pet: idle ✕')
    s = once(s, "'octopus-pet-raising-v6/index.html?motion-set=p0&v=447&pexit=1&sat='", "'octopus-pet-raising-v6/index.html?motion-set=p0&v=467&pexit=1&sat='", 'pet: version')
    s = once(s, '</head>', """<style id="mn-pet-x">
#minest-pet-raising-overlay .minest-pet-x{left:12px!important;top:calc(env(safe-area-inset-top,0px) + 8px)!important;width:46px!important;height:46px!important;font-size:20px!important;transition:opacity .35s,transform .15s!important;
  background:radial-gradient(120% 90% at 30% 0%,rgba(255,255,255,.34),rgba(255,255,255,0) 55%),linear-gradient(180deg,rgba(120,200,225,.34),rgba(14,60,88,.5))!important;border:1px solid rgba(255,255,255,.34)!important;
  -webkit-backdrop-filter:none!important;backdrop-filter:none!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.55),0 8px 20px rgba(0,20,40,.32)!important}
#minest-pet-raising-overlay .minest-pet-x.idle{opacity:0;pointer-events:none}
</style>
</head>""", 'pet: ✕ style')
    return s


def board_patches(s):
    """Board (46.7): pull down in the empty space under a list adds a card to it (as a pull inside the list
    does), and the portrait "Add another list" screen is as tall as a list, not 150 px."""
    s = once(s, """      var cardEl = e.target.closest('article.kanban-card, article.kanban-subcard');
      var colEl = e.target.closest('.kanban-column-wrapper');
      var scrollEl = colEl ? colEl.querySelector('.kanban-cards-scroll') : null;
""", """      var cardEl = e.target.closest('article.kanban-card, article.kanban-subcard');
      var colEl = e.target.closest('.kanban-column-wrapper');
      // 46.7: a pull in the empty space under a list adds to that list too
      if (!colEl && !cardEl && lane.contains(e.target) && !e.target.closest('button, a, input, textarea, select, [contenteditable], .board-add-list-btn, .mn-addlist')) {
        var laneCols = lane.querySelectorAll('.kanban-column-wrapper');
        for (var lci = 0; lci < laneCols.length; lci++) {
          var lcr = laneCols[lci].getBoundingClientRect();
          if (clientX >= lcr.left && clientX <= lcr.right && clientY >= lcr.top) { colEl = laneCols[lci]; break; }
        }
      }
      var scrollEl = colEl ? colEl.querySelector('.kanban-cards-scroll') : null;
""", 'board: pull in the empty space')
    if ".board-swimlane-scroll > .board-add-list-btn{min-height:150px;" in s:   # the iPhone's portrait add-list screen
      s = once(s, ".board-swimlane-scroll > .board-add-list-btn{min-height:150px;justify-content:center!important;",
               ".board-swimlane-scroll > .board-add-list-btn{min-height:0;height:var(--mn-list-h,100px);justify-content:center!important;", 'board: add-list height')
    return s


def main():
    src, dst, title, ver = sys.argv[1:5]
    s = open(os.path.join(REPO, src), encoding='utf-8').read()
    s = web31.arcade_patches(s)
    s = pet_patches(s)
    s = board_patches(s)
    s = re.sub(r'<title>[^<]*</title>', '<title>' + title + '</title>', s, count=1)
    old_ver = re.search(r'className: "board-version", children: "([\d.]+)" \}', s).group(1)
    s = once(s, 'className: "board-version", children: "%s" }' % old_ver, 'className: "board-version", children: "%s" }' % ver, 'version badge')
    s = once(s, '</head>', CSS + '</head>', 'css')
    tail = s.rindex('</body>')
    s = s[:tail] + '\n<!-- ---- Minest Live (tools/web31/minest-live.js) ---- -->\n<script>\n' + web31.live_js() + '\n</script>\n<script>' + BUTTONS + '</script>\n' + s[tail:]
    # 46.9: Minest Knowledge · Contents (tools/knowledge/contents.js) + its Dock icon, first in the Dock
    s = web31.knowledge_patches(s)
    s = once(s, "    { k: 'view', find: function () { return document.querySelector('.sf-mode-toggle-btn'); } },",
             "    { k: 'myworld', find: function () { return document.getElementById('mn-myworld-trigger'); } },   // 52.1 My World: its own icon, first in the Dock\n"
             "    { k: 'knowledge', find: function () { return document.getElementById('mn-knowledge-trigger'); } },   // 47.3 Knowledge: Contents · Outline · Map · Timeline · Learning Map · Wiki\n"
             "    { k: 'view', find: function () { return document.querySelector('.sf-mode-toggle-btn'); } },", 'dock: Contents')
    tail = s.rindex('</body>')
    s = s[:tail] + '<script>\n' + web31.knowledge_js() + '\n</script>\n' + s[tail:]
    # 46.8: every pop-up in the card details' glass, opening out of the button tapped (tools/mobile/sheets.js)
    tail = s.rindex('</body>')
    s = s[:tail] + '<script>\n' + open(os.path.join(HERE, 'sheets.js'), encoding='utf-8').read() + '\n</script>\n' + s[tail:]
    open(os.path.join(REPO, dst), 'w', encoding='utf-8').write(s)
    print('%s ← %s + Minest Live (%d KB)' % (dst, src, len(s) // 1024))


if __name__ == '__main__':
    main()
