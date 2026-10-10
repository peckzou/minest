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


def main():
    src, dst, title, ver = sys.argv[1:5]
    s = open(os.path.join(REPO, src), encoding='utf-8').read()
    s = web31.arcade_patches(s)
    s = re.sub(r'<title>[^<]*</title>', '<title>' + title + '</title>', s, count=1)
    old_ver = re.search(r'className: "board-version", children: "([\d.]+)" \}', s).group(1)
    s = once(s, 'className: "board-version", children: "%s" }' % old_ver, 'className: "board-version", children: "%s" }' % ver, 'version badge')
    s = once(s, '</head>', CSS + '</head>', 'css')
    tail = s.rindex('</body>')
    s = s[:tail] + '\n<!-- ---- Minest Live (tools/web31/minest-live.js) ---- -->\n<script>\n' + web31.live_js() + '\n</script>\n<script>' + BUTTONS + '</script>\n' + s[tail:]
    open(os.path.join(REPO, dst), 'w', encoding='utf-8').write(s)
    print('%s ← %s + Minest Live (%d KB)' % (dst, src, len(s) // 1024))


if __name__ == '__main__':
    main()
