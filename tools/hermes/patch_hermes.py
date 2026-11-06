"""Hermes 3000 typewriter (~/Documents/体素世界cur/typewriter-fold.html) inside Minest, entered like Liquid Routine.

- tools/hermes/hermes-3000.html is a copy of that page (copy it again here after it changes, then re-run).
  It rides in the page as inert base64 text (<script type="text/plain" id="mn-hermes-src">) and becomes an
  iframe (srcdoc) on the first open: the typewriter keeps its own globals, styles and keyboard handling.
- window.MinestHermes = { open, close, isOpen }: full screen over Minest, left by a small ✕ (top right).
  Closing only hides it, so the sheet in the machine stays as it was typed until the app is closed.
- The ways in: an icon in the Dock (after Liquid Routine) and a tab in the bottom tab bar.
Patched into every copy; safe to re-run (each block is replaced with its current text)."""
import base64, re
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
FILES = ['iPhone53.8241.html', 'iphone.html', 'index.html', 'ipad.html', 'iPhoneDuo.html', 'ios/Minest/Minest/iphone.html',
         'ios/Minest/Minest/iphone18.0.html', 'ios/Minest/Minest/ipad.html', 'ios/MinestProject/MyApp/iphone.html']
PAGE = (HERE / 'hermes-3000.html').read_text(encoding='utf-8')
B64 = base64.b64encode(PAGE.encode('utf-8')).decode('ascii')

CSS = """<style id="mn-hermes-style">
.mn-hermes { position:fixed; inset:0; z-index:2147483561; background:#b8c8c1; }
.mn-hermes[hidden] { display:none; }
.mn-hermes iframe { position:absolute; inset:0; width:100%; height:100%; border:0; display:block; }
.mn-hermes-x { position:absolute; z-index:2; right:max(10px, env(safe-area-inset-right, 0px)); top:calc(env(safe-area-inset-top, 0px) + 46px);
  width:34px; height:34px; border-radius:50%; border:1px solid rgba(255,255,255,.6); color:#24332c; font:600 16px/1 -apple-system, system-ui, sans-serif;
  background:linear-gradient(180deg,rgba(255,255,255,.75),rgba(225,235,230,.55)); -webkit-backdrop-filter:blur(14px); backdrop-filter:blur(14px);
  box-shadow:0 4px 12px rgba(0,0,0,.22), inset 0 1px 0 #fff; display:grid; place-items:center; padding:0; -webkit-tap-highlight-color:transparent; }
.mn-hermes-x:active { transform:scale(.92); }
html.mn-hermes-on #minest-mini-pet-p0 { visibility:hidden !important; }
</style>
"""

RUN = r"""<script id="mn-hermes-run">
/* ⌨️ MinestHermes — the Hermes 3000 typewriter as a Minest module (tools/hermes/patch_hermes.py) */
(function () {
  if (window.MinestHermes) return;
  var ov = null;
  function page() {
    var t = document.getElementById('mn-hermes-src'); if (!t) return '';
    var bin = atob(t.textContent.trim()), u = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return new TextDecoder('utf-8').decode(u);
  }
  function open() {
    if (!ov) {
      ov = document.createElement('div'); ov.className = 'mn-hermes'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'Hermes 3000');
      var fr = document.createElement('iframe'); fr.title = 'Hermes 3000'; fr.setAttribute('allow', 'autoplay'); fr.srcdoc = page();
      var x = document.createElement('button'); x.type = 'button'; x.className = 'mn-hermes-x'; x.setAttribute('aria-label', '关闭打字机'); x.textContent = '✕';
      x.addEventListener('click', close);
      ov.append(fr, x); document.body.appendChild(ov);
      ['pointerdown', 'touchstart', 'wheel', 'keydown', 'click'].forEach(function (t) { ov.addEventListener(t, function (e) { e.stopPropagation(); }, { passive: true }); });
    }
    ov.hidden = false; document.documentElement.classList.add('mn-hermes-on');
    try { ov.querySelector('iframe').focus(); } catch (e) {}
  }
  function close() { if (!ov || ov.hidden) return; ov.hidden = true; document.documentElement.classList.remove('mn-hermes-on'); }
  var ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 9V3.5h10V9"/><path d="M9.5 6h5"/><rect x="3" y="9" width="18" height="11" rx="2.5"/><path d="M7 13h.01M10 13h.01M14 13h.01M17 13h.01M8 16.5h8"/></svg>';
  function entries() {
    if (!document.getElementById('mn-hermes-trigger')) {   // a hidden button the Dock presses (like Routine's)
      var t = document.createElement('button'); t.type = 'button'; t.id = 'mn-hermes-trigger'; t.title = 'Hermes 3000'; t.setAttribute('aria-label', 'Hermes 3000 · 打字机');
      t.style.display = 'none'; t.innerHTML = ICON; t.addEventListener('click', function () { if (ov && !ov.hidden) close(); else open(); }); document.body.appendChild(t);
    }
    var dock = document.querySelector('nav.ios-bottom-tab-bar');
    if (dock && !dock.querySelector('[data-hermes-dock]')) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'ios-tab-item'; b.setAttribute('data-hermes-dock', ''); b.title = 'Hermes 3000 · 打字机';
      b.innerHTML = '<span class="ios-tab-icon" aria-hidden="true">⌨️</span><span class="ios-tab-label">打字机</span>'; b.onclick = open; dock.appendChild(b);
    }
  }
  var queued = false;
  new MutationObserver(function () { if (queued) return; queued = true; requestAnimationFrame(function () { queued = false; entries(); }); }).observe(document.body, { childList: true, subtree: true });
  entries();
  window.MinestHermes = { open: open, close: close, isOpen: function () { return !!(ov && !ov.hidden); }, version: '1.0.0' };
})();
</script>
"""

ROUTINE_ITEM = "    { k: 'routine', find: function () { return document.getElementById('mn-routine-trigger'); } },   /* Liquid Routine */"
HERMES_ITEM = "\n    { k: 'hermes', find: function () { return document.getElementById('mn-hermes-trigger'); } },   /* Hermes 3000 typewriter */"

SRC = '<script type="text/plain" id="mn-hermes-src">\n' + B64 + '\n</script>\n'
for f in FILES:
    p = ROOT / f
    s = p.read_text(encoding='utf-8')
    for pat in [r'<style id="mn-hermes-style">.*?</style>\n', r'<script type="text/plain" id="mn-hermes-src">.*?</script>\n', r'<script id="mn-hermes-run">.*?</script>\n']:
        s = re.sub(pat, '', s, flags=re.S)
    s = s.replace('</head>', CSS + '</head>', 1)
    i = s.rindex('</body>'); s = s[:i] + SRC + RUN + s[i:]
    if HERMES_ITEM not in s:
        assert s.count(ROUTINE_ITEM) == 1, (f, 'dock item')
        s = s.replace(ROUTINE_ITEM, ROUTINE_ITEM + HERMES_ITEM)
    p.write_text(s, encoding='utf-8')
    print('patched', f)
