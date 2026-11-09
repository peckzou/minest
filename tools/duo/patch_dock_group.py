#!/usr/bin/env python3
"""The Dock's three look buttons — Light FX, Card FX and the light / dark switch — share one Dock icon ("Looks").
A tap on it fans them out like the Views stack (round glass icons, a label beside each, springing out of the icon and
folding back); a tap on one presses the original button, so every behaviour stays exactly as it was.
The originals stay in the page (hidden in the Dock), so nothing that looks them up breaks. Idempotent."""
import pathlib, re
ROOT = pathlib.Path(__file__).resolve().parents[2]
FILES = ["iPhoneDuo.html", "ios/Minest/Minest/iPhoneDuo.html", "ios/Minest/Minest/iphone18.0.html",
         "ios/Minest/Minest/iphone.html", "iphone.html", "ios/MinestProject/MyApp/iphone.html"]

BLOCK = r'''<style id="mn-dock-looks-style">
html.mn-bd .mn-bdock .mn-bapp[aria-label^="Light FX"],html.mn-bd .mn-bdock .mn-bapp[aria-label^="Card FX"],
html.mn-bd .mn-bdock .mn-bapp[aria-label^="Switch to light"],html.mn-bd .mn-bdock .mn-bapp[aria-label^="Switch to dark"]{display:none!important}
.mn-looks-fan .miv-fan-label{white-space:nowrap}
</style>
<script id="mn-dock-looks">
/* the Dock's look buttons (Light FX · Card FX · light / dark) under one icon that fans them out (tools/duo/patch_dock_group.py) */
(function () {
  var MATCH = [/^Light FX/, /^Card FX/, /^Switch to (light|dark)/];
  var LABEL = function (i, b) { return i === 0 ? 'Light FX' : i === 1 ? 'Card FX' : (/dark/.test(b.getAttribute('aria-label') || '') ? 'Dark mode' : 'Light mode'); };
  var ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 19L15 9"/><path d="M14 6l1-2 1 2 2 1-2 1-1 2-1-2-2-1z"/><path d="M19 13l.6-1.2L21 11l-1.4-.6L19 9l-.6 1.4L17 11l1.4.8z"/><path d="M7 4l.5-1 .5 1 1 .5-1 .5-.5 1-.5-1-1-.5z"/></svg>';
  var fan = null, blockUntil = 0;
  function originals() {
    var all = document.querySelectorAll('.mn-bdock .mn-bapp:not(.mn-looks-btn)'), out = [null, null, null];
    for (var i = 0; i < all.length; i++) { var l = all[i].getAttribute('aria-label') || ''; for (var k = 0; k < 3; k++) if (MATCH[k].test(l)) out[k] = all[i]; }
    return out;
  }
  function ensure() {
    var dock = document.querySelector('.mn-bdock'); if (!dock) return;
    var o = originals(), first = null;
    for (var k = 0; k < 3; k++) if (o[k] && (!first || (o[k].compareDocumentPosition(first) & Node.DOCUMENT_POSITION_FOLLOWING))) first = o[k];
    if (!first) return;
    var b = dock.querySelector('.mn-looks-btn');
    if (!b) {
      b = document.createElement('button'); b.type = 'button'; b.className = 'mn-bapp mn-looks-btn';
      b.setAttribute('aria-label', 'Looks · 外观与特效'); b.setAttribute('aria-haspopup', 'menu'); b.setAttribute('aria-expanded', 'false'); b.title = 'Looks';
      b.innerHTML = ICON;
      b.addEventListener('click', function (e) { e.stopPropagation(); e.preventDefault(); toggle(b); });
    }
    if (b.nextElementSibling !== first) dock.insertBefore(b, first);
  }
  function haptic() { try { if (window.MinestNative && MinestNative.haptic) MinestNative.haptic('light'); } catch (e) {} }
  function close(now) {
    var el = fan; if (!el) return; fan = null;
    document.removeEventListener('pointerdown', outside, true);
    var a = document.querySelector('.mn-looks-btn'); if (a) a.setAttribute('aria-expanded', 'false');
    el.classList.remove('miv-fan-open'); el.classList.add('miv-fan-closing');
    if (now) el.remove(); else setTimeout(function () { el.remove(); }, 260);
  }
  function outside(e) {
    if (!fan || fan.contains(e.target)) return;
    var a = document.querySelector('.mn-looks-btn');
    if (a && (a === e.target || a.contains(e.target))) blockUntil = Date.now() + 700;   // the icon folds it; its click must not reopen
    close();
  }
  function toggle(anchor) {
    if (Date.now() < blockUntil) { blockUntil = 0; return; }
    if (fan) { close(); return; }
    var o = originals().filter(Boolean); if (!o.length) return;
    haptic();
    var r = anchor.getBoundingClientRect(), dock = anchor.closest('.mn-bdock'), d = dock.getBoundingClientRect();
    var vertical = d.height > d.width, toLeft = vertical ? d.left > innerWidth / 2 : false;
    var dir = vertical ? (toLeft ? 'left' : 'right') : 'up', S = 46, GAP = 58;
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2, mid = (o.length - 1) / 2;
    var el = document.createElement('div'); el.className = 'miv-fan mn-looks-fan'; el.dataset.dir = dir; el.setAttribute('role', 'menu'); el.setAttribute('aria-label', 'Looks');
    el.classList.toggle('miv-fan-lr', dir === 'right');
    var pts = o.map(function (b, i) {
      if (dir === 'up') return { x: cx + 2.6 * (i + 1) * (i + 1), y: cy - (r.height / 2 + 10 + S / 2 + i * GAP), rot: 1.2 * (i + 1) };
      var sx = dir === 'left' ? -1 : 1;
      return { x: cx + sx * (r.width / 2 + 14 + S / 2 + 10 * (1 - Math.pow((i - mid) / (mid + .5), 2))), y: cy + (i - mid) * GAP, rot: sx * (i - mid) * 2.2 };
    });
    var minY = Math.min.apply(null, pts.map(function (p) { return p.y; })) - S / 2, maxY = Math.max.apply(null, pts.map(function (p) { return p.y; })) + S / 2;
    var shiftY = minY < 8 ? 8 - minY : maxY > innerHeight - 8 ? innerHeight - 8 - maxY : 0;
    o.forEach(function (orig, i) {
      var p = pts[i], it = document.createElement('button'); it.type = 'button'; it.className = 'miv-fan-item'; it.setAttribute('role', 'menuitem');
      it.title = orig.getAttribute('aria-label') || '';
      it.style.setProperty('--x', p.x + 'px'); it.style.setProperty('--y', (p.y + shiftY) + 'px'); it.style.setProperty('--r', p.rot + 'deg');
      it.style.setProperty('--dx', (cx - p.x) + 'px'); it.style.setProperty('--dy', (cy - p.y - shiftY) + 'px');
      it.style.setProperty('--d', (i * 38) + 'ms'); it.style.setProperty('--dc', ((o.length - 1 - i) * 22) + 'ms');
      var svg = orig.querySelector('svg'), lab = LABEL(MATCH.findIndex(function (m) { return m.test(orig.getAttribute('aria-label') || ''); }), orig);
      it.innerHTML = '<span class="miv-fan-ic">' + (svg ? svg.outerHTML.replace('<svg', '<svg class="miv-ic"') : '') + '</span><span class="miv-fan-label">' + lab + '</span>';
      it.addEventListener('click', function (e) { e.stopPropagation(); haptic(); close(); setTimeout(function () { orig.click(); }, 60); });
      el.appendChild(it);
    });
    document.body.appendChild(el); fan = el; anchor.setAttribute('aria-expanded', 'true');
    void el.offsetWidth; el.classList.add('miv-fan-open');
    document.addEventListener('pointerdown', outside, true);
  }
  var q = 0;
  new MutationObserver(function () { if (q) return; q = requestAnimationFrame(function () { q = 0; ensure(); }); }).observe(document.documentElement, { childList: true, subtree: true });
  addEventListener('resize', function () { close(true); });
  ensure();
})();
</script>
'''

for rel in FILES:
    p = ROOT / rel
    if not p.exists(): continue
    s = p.read_text(encoding="utf-8")
    s = re.sub(r'<style id="mn-dock-looks-style">.*?</script>\n', '', s, flags=re.S)
    i = s.rfind('</body>')
    if i < 0 or 'mn-bdock' not in s: continue
    s = s[:i] + BLOCK + s[i:]
    p.write_text(s, encoding="utf-8")
    print("looks group", rel)
