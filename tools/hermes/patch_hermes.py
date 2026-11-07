"""Hermes 3000 typewriter (~/Documents/体素世界cur/typewriter-fold.html) inside Minest, entered like Liquid Routine.

- tools/hermes/hermes-3000.html is a copy of that page (copy it again here after it changes, then re-run).
  It rides in the page as inert base64 text (<script type="text/plain" id="mn-hermes-src">) and becomes an
  iframe (srcdoc) on the first open: the typewriter keeps its own globals, styles and keyboard handling.
- window.MinestHermes = { open, close, isOpen }: full screen over Minest, left by the typewriter's own case latch (the chrome spool in the middle of the top bar):
  the lid swings down and the typewriter posts 'hermes:closed'; opening posts 'hermes:open' and the lid swings up.
  The hinge state is forwarded ('hermes:hinge') so a half-folded phone gets the half-folded typewriter. Closing only hides it, so the sheet in the machine stays as it was typed until the app is closed.
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
  // 开箱 / 关箱都在打字机里：右上角的卷轴扣关箱，盖好后发 'hermes:closed' 回来；打开时发 'hermes:open' 让它翻开
  function post(m) { try { var w = ov && ov.querySelector('iframe').contentWindow; if (w) w.postMessage(m, '*'); } catch (e) {} }
  function hinge() { if (window.__minestHinge) post({ type: 'hermes:hinge', hinge: window.__minestHinge }); }
  var loaded = false;
  function open() {
    if (!ov) {
      ov = document.createElement('div'); ov.className = 'mn-hermes'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'Hermes 3000');
      var fr = document.createElement('iframe'); fr.title = 'Hermes 3000'; fr.setAttribute('allow', 'autoplay');
      fr.addEventListener('load', function () { loaded = true; hinge(); if (!ov.hidden) post({ type: 'hermes:open' }); });
      fr.srcdoc = page();
      ov.appendChild(fr); document.body.appendChild(ov);
      ['pointerdown', 'touchstart', 'wheel', 'keydown', 'click'].forEach(function (t) { ov.addEventListener(t, function (e) { e.stopPropagation(); }, { passive: true }); });
    }
    ov.hidden = false; document.documentElement.classList.add('mn-hermes-on');
    lockTurn(true);
    if (loaded) { hinge(); post({ type: 'hermes:open' }); }
    try { ov.querySelector('iframe').focus(); } catch (e) {}
  }
  function close() { if (!ov || ov.hidden) return; ov.hidden = true; document.documentElement.classList.remove('mn-hermes-on'); lockTurn(false); }
  // while the typewriter is open (its case and its typing view) the screen holds still, as with the system's
  // orientation lock: the app's own setOrientation (portrait); back to the usual turns when it closes
  function lockTurn(on) { try { if (window.MinestNative && MinestNative.send) MinestNative.send('setOrientation', { orientation: on ? 'portrait' : 'auto' }); } catch (e) {} }
  window.addEventListener('message', function (e) {
    var fr = ov && ov.querySelector('iframe');
    if (fr && e.source === fr.contentWindow && e.data && e.data.type === 'hermes:closed') close();
  });
  window.addEventListener('minest:hinge', function () { if (ov && !ov.hidden) hinge(); });
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
  window.MinestHermes = { open: open, close: close, isOpen: function () { return !!(ov && !ov.hidden); }, version: '1.23.0' };
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
