#!/usr/bin/env python3
"""3D Type — the 3D typing worlds (the classic pages + the Typing Worlds worlds, one picker: type3d/picker.js)
— seven 3D typing worlds (type3d/: Filament · Firework · Topiary · Saber · Quill · Neon · Book) as a Minest
module: a full-screen overlay with the pages in an iframe. Its Dock tile lives under ⋯ More (tools/duo/patch_dock_more.py
lists it). On the web the pages are served next to the Minest page; inside the iOS app (a file page) they are loaded
from the deployed site, so the app needs a connection for this module. Idempotent."""
import pathlib, re
ROOT = pathlib.Path(__file__).resolve().parents[2]
FILES = ["iPhoneDuo.html", "ios/Minest/Minest/iPhoneDuo.html", "ios/Minest/Minest/iphone18.0.html",
         "ios/Minest/Minest/iphone.html", "iphone.html", "ios/MinestProject/MyApp/iphone.html"]

BLOCK = r'''<style id="mn-type3d-style">
.mn-type3d{position:fixed;inset:0;z-index:2147483560;background:#000}
.mn-type3d[hidden]{display:none}
.mn-type3d iframe{position:absolute;inset:0;width:100%;height:100%;border:0;display:block}
.mn-type3d-x{position:absolute;right:calc(env(safe-area-inset-right,0px) + 16px);bottom:calc(env(safe-area-inset-bottom,0px) + 16px);width:42px;height:42px;border-radius:50%;border:0;padding:11px;
  color:#fff;background:rgba(255,255,255,.14);-webkit-backdrop-filter:blur(14px) saturate(1.4);backdrop-filter:blur(14px) saturate(1.4);box-shadow:inset 0 0 0 1px rgba(255,255,255,.24),0 4px 12px rgba(0,0,0,.4);cursor:pointer}
.mn-type3d-x svg{width:100%;height:100%;display:block}
html.mn-type3d-on #minest-mini-pet-p0{visibility:hidden!important}
</style>
<script id="mn-type3d-run">
/* 3D Type — seven 3D typing worlds as a Minest module (tools/type3d/patch_type3d.py) */
(function () {
  if (window.MinestType3D) return;
  var ov = null, SITE = 'https://minest-app.vercel.app/';
  function src(pick) { var q = pick ? '?pick=1' : ''; return (/^https?:$/.test(location.protocol) ? new URL('type3d/index.html', location.href).href : SITE + 'type3d/index.html') + q; }
  function open(how) {
    if (!ov) {
      ov = document.createElement('div'); ov.className = 'mn-type3d'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', '3D Type');
      var fr = document.createElement('iframe'); fr.title = '3D Type'; fr.setAttribute('allow', 'autoplay; fullscreen'); fr.src = src(how === 'pick');
      var x = document.createElement('button'); x.type = 'button'; x.className = 'mn-type3d-x'; x.setAttribute('aria-label', 'Close · 关闭'); x.title = '关闭';
      x.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
      x.addEventListener('click', function (e) { e.stopPropagation(); close(); });
      ov.appendChild(fr); ov.appendChild(x); document.body.appendChild(ov);
      ['pointerdown', 'touchstart', 'wheel', 'keydown', 'click'].forEach(function (t) { ov.addEventListener(t, function (e) { e.stopPropagation(); }, { passive: true }); });
    }
    else if (how === 'pick') { try { var w = ov.querySelector('iframe').contentWindow; if (w.T3DPicker) w.T3DPicker.open(); } catch (e) {} }
    ov.hidden = false; document.documentElement.classList.add('mn-type3d-on');
    try { ov.querySelector('iframe').focus(); } catch (e) {}
  }
  function close() { if (!ov || ov.hidden) return; ov.hidden = true; document.documentElement.classList.remove('mn-type3d-on');
    try { var fr = ov.querySelector('iframe'); fr.src = 'about:blank'; ov.remove(); ov = null; } catch (e) {} }   // the worlds stop rendering when closed
  var ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12L4 7.5M12 12v9"/><path d="M9.2 9.6h5.6M12 9.6v5.2" stroke-width="1.5"/></svg>';
  function entry() {
    var dock = document.querySelector('.mn-bdock'); if (!dock || dock.querySelector('[data-type3d-dock]')) return;
    var t = document.createElement('button'); t.type = 'button'; t.className = 'mn-bapp mdk-tile'; t.setAttribute('data-type3d-dock', '');
    t.title = '3D Type · 立体打字'; t.setAttribute('aria-label', '3D Type · 立体打字'); t.innerHTML = ICON;
    t.addEventListener('click', function (e) { e.stopPropagation(); open(); });
    dock.appendChild(t);
  }
  var q = 0;
  new MutationObserver(function () { if (q) return; q = requestAnimationFrame(function () { q = 0; entry(); }); }).observe(document.documentElement, { childList: true, subtree: true });
  entry();
  window.MinestType3D = { open: open, close: close, isOpen: function () { return !!(ov && !ov.hidden); }, version: '1.0.0' };
})();
</script>
'''

for rel in FILES:
    p = ROOT / rel
    if not p.exists(): continue
    s = p.read_text(encoding="utf-8")
    s = re.sub(r'<style id="mn-type3d-style">.*?<script id="mn-type3d-run">.*?</script>\n', '', s, flags=re.S)
    i = s.rfind('</body>')
    if i < 0 or 'mn-bdock' not in s: continue
    s = s[:i] + BLOCK + s[i:]
    p.write_text(s, encoding="utf-8")
    print("type3d", rel)
