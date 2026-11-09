#!/usr/bin/env python3
"""The Dock, tidied: at the top ✕ (closes the page that is open — the typewriter, Routine, a panel) and ‹ (back: one
step back — Escape, the in-page history — or, with nothing to step back from, closes what is open); at the bottom ⋯ (More), which
fans out Knowledge · Pet · Rings · Desktop · Settings · CarPlay like the Views stack. A tap on a fanned icon presses
the original Dock icon, so every behaviour stays exactly as it was. The originals stay in the page, hidden in the
Dock. Idempotent."""
import pathlib, re
ROOT = pathlib.Path(__file__).resolve().parents[2]
FILES = ["iPhoneDuo.html", "ios/Minest/Minest/iPhoneDuo.html", "ios/Minest/Minest/iphone18.0.html",
         "ios/Minest/Minest/iphone.html", "iphone.html", "ios/MinestProject/MyApp/iphone.html"]

BLOCK = r'''<style id="mn-dock-more-style">
html.mn-bd .mn-bdock .mn-bapp[aria-label="Knowledge"],html.mn-bd .mn-bdock .mn-bapp[aria-label^="Pet Raising"],
html.mn-bd .mn-bdock .mn-bapp[aria-label^="Activity Rings"],html.mn-bd .mn-bdock .mn-bapp[aria-label^="Switch between the iPhone"],
html.mn-bd .mn-bdock .mn-bapp[aria-label^="Board settings"],html.mn-bd .mn-bdock .mn-bapp[data-carflash-dock]{display:none!important}
.mn-more-fan .miv-fan-label{white-space:nowrap}
.mn-bdock .mn-sys-btn svg{width:46%!important}
</style>
<script id="mn-dock-more">
/* the Dock: ⏻ exit · ‹ back at the top, ⋯ More at the bottom (tools/duo/patch_dock_more.py) */
(function () {
  var MORE = [
    { m: function (l) { return l === 'Knowledge'; }, label: 'Knowledge 知识' },
    { m: function (l) { return /^Pet Raising/.test(l); }, label: 'Pet 宠物' },
    { m: function (l) { return /^Activity Rings/.test(l); }, label: 'Rings 成就' },
    { m: function (l, b) { return b.hasAttribute('data-carflash-dock'); }, label: 'CarPlay 车载闪卡' },
    { m: function (l) { return /^Switch between the iPhone/.test(l); }, label: 'Desktop 桌面版' },
    { m: function (l) { return /^Board settings/.test(l); }, label: 'Settings 设置' }
  ];
  var DOTS = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2.1"/><circle cx="12" cy="12" r="2.1"/><circle cx="19" cy="12" r="2.1"/></svg>';
  var CROSS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  var BACK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
  var fan = null, blockUntil = 0;
  function haptic(s) { try { if (window.MinestNative && MinestNative.haptic) MinestNative.haptic(s || 'light'); } catch (e) {} }
  function originals() {
    var all = document.querySelectorAll('.mn-bdock .mn-bapp:not(.mn-more-btn):not(.mn-sys-btn)'), out = MORE.map(function () { return null; });
    for (var i = 0; i < all.length; i++) { var l = all[i].getAttribute('aria-label') || ''; for (var k = 0; k < MORE.length; k++) if (!out[k] && MORE[k].m(l, all[i])) out[k] = all[i]; }
    return out;
  }
  function tile(cls, label, icon, on) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'mn-bapp mdk-tile ' + cls;
    b.setAttribute('aria-label', label); b.title = label; b.innerHTML = icon;
    b.addEventListener('click', function (e) { e.stopPropagation(); e.preventDefault(); on(b); });
    return b;
  }
  /* ✕ close: the page that is open on top closes (a module, then a panel with its own ✕) */
  function closeOpen() {
    haptic('light');
    try { if (window.MinestHermes && MinestHermes.isOpen && MinestHermes.isOpen()) { MinestHermes.close(); return true; } } catch (e) {}
    try { if (window.MinestRoutine && MinestRoutine.isOpen && MinestRoutine.isOpen()) { MinestRoutine.close(); return true; } } catch (e) {}
    // an open panel / sheet: its own close button (✕), the topmost one on screen
    var xs = document.querySelectorAll('[data-cf-close],[aria-label="关闭"],[aria-label="Close"],[aria-label^="Close "],button.close,.close-btn');
    for (var i = xs.length - 1; i >= 0; i--) { var r = xs[i].getBoundingClientRect(); if (r.width > 0 && r.height > 0 && getComputedStyle(xs[i]).visibility !== 'hidden') { xs[i].click(); return true; } }
    return false;
  }
  /* ‹ back: one step back (Escape for what listens to it, the in-page history); nothing to step back from: close */
  function goBack() {
    var esc = new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true, cancelable: true });
    if (!document.dispatchEvent(esc)) { haptic('light'); return; }
    if (location.hash && location.hash.length > 1) { haptic('light'); history.back(); return; }   // never off the page
    closeOpen();
  }
  function ensure() {
    var dock = document.querySelector('.mn-bdock'); if (!dock) return;
    var back = dock.querySelector('.mn-sys-back'), ex = dock.querySelector('.mn-sys-exit');
    if (!ex) ex = tile('mn-sys-btn mn-sys-exit', 'Close · 关闭', CROSS, closeOpen);
    if (!back) back = tile('mn-sys-btn mn-sys-back', 'Back · 返回', BACK, goBack);
    if (dock.firstElementChild !== ex) dock.insertBefore(ex, dock.firstElementChild);
    if (ex.nextElementSibling !== back) dock.insertBefore(back, ex.nextElementSibling);
    var o = originals(); if (!o.some(Boolean)) return;
    var more = dock.querySelector('.mn-more-btn');
    if (!more) { more = tile('mn-more-btn', 'More · 更多', DOTS, toggle); more.setAttribute('aria-haspopup', 'menu'); more.setAttribute('aria-expanded', 'false'); }
    if (dock.lastElementChild !== more) dock.appendChild(more);
  }
  function close(now) {
    var el = fan; if (!el) return; fan = null;
    document.removeEventListener('pointerdown', outside, true);
    var a = document.querySelector('.mn-more-btn'); if (a) a.setAttribute('aria-expanded', 'false');
    el.classList.remove('miv-fan-open'); el.classList.add('miv-fan-closing');
    if (now) el.remove(); else setTimeout(function () { el.remove(); }, 260);
  }
  function outside(e) {
    if (!fan || fan.contains(e.target)) return;
    var a = document.querySelector('.mn-more-btn');
    if (a && (a === e.target || a.contains(e.target))) blockUntil = Date.now() + 700;
    close();
  }
  function toggle(anchor) {
    if (Date.now() < blockUntil) { blockUntil = 0; return; }
    if (fan) { close(); return; }
    var all = originals(), o = [], labels = [];
    all.forEach(function (b, i) { if (b) { o.push(b); labels.push(MORE[i].label); } });
    if (!o.length) return;
    haptic('light');
    var r = anchor.getBoundingClientRect(), dock = anchor.closest('.mn-bdock'), d = dock.getBoundingClientRect();
    var vertical = d.height > d.width, toLeft = vertical ? d.left > innerWidth / 2 : false;
    var dir = vertical ? (toLeft ? 'left' : 'right') : 'up', S = 46, GAP = 56;
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    var el = document.createElement('div'); el.className = 'miv-fan mn-more-fan'; el.dataset.dir = dir; el.setAttribute('role', 'menu'); el.setAttribute('aria-label', 'More');
    el.classList.toggle('miv-fan-lr', dir === 'right');
    var n = o.length;
    var pts = o.map(function (b, i) {
      if (dir === 'up') return { x: cx + 2.2 * (i + 1) * (i + 1) * 0.4, y: cy - (r.height / 2 + 10 + S / 2 + i * GAP), rot: 0.8 * (i + 1) };
      var sx = dir === 'left' ? -1 : 1, j = n - 1 - i;   // from the ⋯ upward: the first item nearest the top
      return { x: cx + sx * (r.width / 2 + 14 + S / 2 + 6 * Math.sin(Math.PI * (j + .5) / n)), y: cy - j * GAP, rot: sx * (j - (n - 1) / 2) * 1.6 };
    });
    var minY = Math.min.apply(null, pts.map(function (p) { return p.y; })) - S / 2, maxY = Math.max.apply(null, pts.map(function (p) { return p.y; })) + S / 2;
    var shiftY = minY < 8 ? 8 - minY : maxY > innerHeight - 8 ? innerHeight - 8 - maxY : 0;
    o.forEach(function (orig, i) {
      var p = pts[i], it = document.createElement('button'); it.type = 'button'; it.className = 'miv-fan-item'; it.setAttribute('role', 'menuitem');
      it.title = orig.getAttribute('aria-label') || '';
      it.style.setProperty('--x', p.x + 'px'); it.style.setProperty('--y', (p.y + shiftY) + 'px'); it.style.setProperty('--r', p.rot + 'deg');
      it.style.setProperty('--dx', (cx - p.x) + 'px'); it.style.setProperty('--dy', (cy - p.y - shiftY) + 'px');
      it.style.setProperty('--d', ((n - 1 - i) * 32) + 'ms'); it.style.setProperty('--dc', (i * 20) + 'ms');
      var svg = orig.querySelector('svg'), img = orig.querySelector('img');
      var ic = svg ? svg.outerHTML.replace('<svg', '<svg class="miv-ic"') : img ? img.outerHTML : '';
      it.innerHTML = '<span class="miv-fan-ic">' + ic + '</span><span class="miv-fan-label">' + labels[i] + '</span>';
      it.addEventListener('click', function (e) { e.stopPropagation(); haptic('light'); close(); setTimeout(function () { orig.click(); }, 60); });
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
    s = re.sub(r'<style id="mn-dock-more-style">.*?</script>\n', '', s, flags=re.S)
    i = s.rfind('</body>')
    if i < 0 or 'mn-bdock' not in s: continue
    s = s[:i] + BLOCK + s[i:]
    p.write_text(s, encoding="utf-8")
    print("dock more", rel)
