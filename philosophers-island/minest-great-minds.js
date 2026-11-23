/* 思想家小岛 Great Minds Island (great-minds/index.html, a self-contained page: visit 5 thinkers, talk, works, thought models)
 * inside the Philosophers' Island. Minest's own add-on, not part of Antigravity's island: when the island folder is
 * copied in again from /Users/cece/Documents/minest/philosophers-island, keep great-minds/, this file and its <script>
 * line in philosophers.html. Entrances: a button under the title card and one in the compass's quick row. It opens
 * over the island in a full-screen frame;「← 返回哲学小岛」or Esc brings the island back. */
(function () {
  'use strict';
  var ov = null;
  function open() {
    if (ov) return;
    try { if (document.pointerLockElement && document.exitPointerLock) document.exitPointerLock(); } catch (e) {}
    var x = document.getElementById('pi-m-close-btn'); if (x) x.click();
    ov = document.createElement('div'); ov.id = 'mn-gm';
    ov.innerHTML = '<iframe src="great-minds/index.html" title="思想家小岛 Great Minds Island"></iframe>' +
      '<button type="button" id="mn-gm-back">← 返回哲学小岛</button>';
    document.body.appendChild(ov);
    ov.querySelector('#mn-gm-back').onclick = close;
    var f = ov.querySelector('iframe'); f.addEventListener('load', function () {
      try { f.contentWindow.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !e.defaultPrevented) close(); }); } catch (e) {}
      try {   /* room under the page's last line for the back button */
        var st = f.contentDocument.createElement('style'); st.textContent = 'body{padding-bottom:calc(env(safe-area-inset-bottom,0px) + 64px)}';
        f.contentDocument.head.appendChild(st);
      } catch (e) {}
      try { f.contentWindow.focus(); } catch (e) {}
    });
  }
  function close() { if (!ov) return; ov.remove(); ov = null; try { window.focus(); } catch (e) {} }
  document.addEventListener('keydown', function (e) { if (ov && e.key === 'Escape') { e.stopPropagation(); close(); } }, true);

  var css = document.createElement('style');
  css.textContent = '#mn-gm{position:fixed;inset:0;z-index:200;background:#faf9f6}' +
    '#mn-gm iframe{position:absolute;inset:0;width:100%;height:100%;border:0;display:block}' +
    '#mn-gm-back{position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 14px);transform:translateX(-50%);z-index:2;padding:9px 16px;border-radius:999px;border:1px solid #334f48;background:#334f48;color:#fff;font:650 13px/1 -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.25);cursor:pointer;white-space:nowrap}' +
    '#title{display:flex;flex-direction:column;align-items:flex-start;gap:6px}' +
    '#mn-gm-btn{pointer-events:auto;padding:6px 13px;border-radius:999px;border:1px solid rgba(255,255,255,.2);background:linear-gradient(135deg,#334f48,#5b8a7d);color:#fff;font:800 12px/1.2 -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif;box-shadow:0 2px 10px rgba(0,0,0,.35);cursor:pointer}';
  document.head.appendChild(css);

  function addEntries() {
    var card = document.getElementById('title-card');
    if (card && !document.getElementById('mn-gm-btn')) {
      var b = document.createElement('button'); b.type = 'button'; b.id = 'mn-gm-btn'; b.textContent = '◈ 思想家小岛 · 拜访与对谈';
      b.onclick = function (e) { e.stopPropagation(); open(); };
      card.parentNode.insertBefore(b, card.nextSibling);
    }
    var q = document.getElementById('pi-quick-cave'), row = q && q.parentNode;
    if (row && !row.querySelector('[data-mn-gm]')) {
      var c = document.createElement('button'); c.type = 'button'; c.className = 'pi-act-btn'; c.setAttribute('data-mn-gm', ''); c.textContent = '◈ 思想家小岛：拜访五位思想家';
      c.onclick = function (e) { e.stopPropagation(); open(); };
      row.appendChild(c);
    }
  }
  addEntries();
  new MutationObserver(addEntries).observe(document.body, { childList: true, subtree: true });
  window.MinestGreatMinds = { open: open, close: close, isOpen: function () { return !!ov; } };
})();
