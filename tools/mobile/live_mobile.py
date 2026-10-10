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
/* Minest Live on the iPhone / iPad: 🎓 Teacher · 🎮 Join · 👕 Locker in the Study Arcade's top bar
   (not on the students' play page or in a student's live session) */
(function () {
  function add() {
    var chips = document.querySelector('.arcade .ar-chips');
    if (!chips || chips.querySelector('.mn-ar-te') || window.__MINEST_LIVE_STANDALONE || window.__mnNoVoice || !window.MinestLive) return;
    var ref = chips.querySelector('.ar-bgbtn') || chips.firstChild;
    [['mn-ar-te', '🎓', 'Teacher', 'Host a live Arcade game, or play it yourself (Solo play)', function () { window.MinestLive.openTeacher(); }],
     ['mn-ar-jo', '🎮', 'Join', 'Join a live Arcade game with a code', function () { window.MinestLive.openJoin(''); }],
     ['mn-ar-lk', '👕', 'Locker', 'Your animal and outfits — unlock them with 💎 from the games', function () { if (window.MinestLive.openLocker) window.MinestLive.openLocker(); }]
    ].forEach(function (x) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'ar-btn mn-ar ' + x[0]; b.title = x[3];
      b.innerHTML = '<span class="ic">' + x[1] + '</span><span class="tx"> ' + x[2] + '</span>';
      b.onclick = function (e) { e.stopPropagation(); x[4](); };
      chips.insertBefore(b, ref);
    });
  }
  new MutationObserver(function () { if (document.querySelector('.arcade .ar-chips')) add(); }).observe(document.body, { childList: true });
})();
"""
CSS = """<style id="mn-live-mobile">
/* the Arcade's top bar stays below the status bar (the iPad did not pass taps there to its buttons) */
.arcade .ar-top{padding-top:max(6px, calc(env(safe-area-inset-top, 0px) + 6px))!important}
.mn-ar{white-space:nowrap;font-weight:800}
@media (max-width:700px){.mn-ar .tx{display:none}.mn-ar{padding-left:10px!important;padding-right:10px!important}}
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
