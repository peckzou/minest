/* 幻想工程展馆 Imagineering Pavilion (pavilion/index.html, a self-contained three.js page) inside the theme park.
 * Minest's own add-on, not part of Antigravity's theme park: when the park folder is copied in again from
 * /Users/cece/Documents/minest/theme-park-island, keep pavilion/, this file and its <script> line in theme-park.html.
 * Entrances: a button beside「导览与设施」and one more in the guide's quick bar. The pavilion opens over the park
 * in a full-screen frame; 「← 返回乐园」or Esc brings the park back. */
(function () {
  'use strict';
  var ov = null;
  function open() {
    if (ov) return;
    try { if (document.pointerLockElement && document.exitPointerLock) document.exitPointerLock(); } catch (e) {}
    var x = document.getElementById('tp-close-guide'); if (x) x.click();
    ov = document.createElement('div'); ov.id = 'mn-pav';
    ov.innerHTML = '<iframe src="pavilion/index.html" title="幻想工程展馆 Imagineering Pavilion" allow="autoplay; fullscreen"></iframe>' +
      '<button type="button" id="mn-pav-back">← 返回乐园</button>';
    document.body.appendChild(ov);
    ov.querySelector('#mn-pav-back').onclick = close;
    var f = ov.querySelector('iframe'); f.addEventListener('load', function () {
      try { f.contentWindow.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !e.defaultPrevented) close(); }); } catch (e) {}
      try { f.contentWindow.focus(); } catch (e) {}
    });
  }
  function close() { if (!ov) return; ov.remove(); ov = null; try { window.focus(); } catch (e) {} }
  document.addEventListener('keydown', function (e) { if (ov && e.key === 'Escape') { e.stopPropagation(); close(); } }, true);

  var css = document.createElement('style');
  css.textContent = '#mn-pav{position:fixed;inset:0;z-index:200;background:#131c33}' +
    '#mn-pav iframe{position:absolute;inset:0;width:100%;height:100%;border:0;display:block}' +
    '#mn-pav-back{position:absolute;left:50%;top:calc(env(safe-area-inset-top,0px) + 12px);transform:translateX(-50%);z-index:2;padding:8px 14px;border-radius:999px;border:1px solid rgba(227,180,85,.5);background:rgba(19,28,51,.92);color:#f4ecd8;font:700 13px/1 -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif;cursor:pointer;white-space:nowrap}' +
    '@media (max-width:620px){#title{flex-direction:column;align-items:flex-start;gap:6px}}' +
    '#mn-pav-btn{box-shadow:0 2px 10px rgba(0,0,0,.35);padding:5px 12px;border-radius:999px;background:linear-gradient(135deg,#e3b455,#ea6a52);color:#fff;font-weight:900;font-size:11.5px;border:none;cursor:pointer}';
  document.head.appendChild(css);

  function addEntries() {
    var g = document.getElementById('guide-top-btn'), card = document.getElementById('title-card');
    if (g && card && !document.getElementById('mn-pav-btn')) {
      var b = document.createElement('button'); b.type = 'button'; b.id = 'mn-pav-btn'; b.textContent = '🏛️ 幻想工程展馆';
      b.onclick = function (e) { e.stopPropagation(); open(); };
      card.parentNode.insertBefore(b, card.nextSibling);   /* beside the title card; below it on a narrow screen, clear of the minimap */
    }
    var q = document.querySelector('.tp-quick-bar');
    if (q && !q.querySelector('[data-mn-pav]')) {
      var c = document.createElement('button'); c.type = 'button'; c.className = 'tp-btn pink'; c.setAttribute('data-mn-pav', ''); c.textContent = '🏛️ 幻想工程展馆';
      c.onclick = function (e) { e.stopPropagation(); open(); };
      q.appendChild(c);
    }
  }
  addEntries();
  new MutationObserver(function () { addEntries(); }).observe(document.body, { childList: true, subtree: true });
  window.MinestPavilion = { open: open, close: close, isOpen: function () { return !!ov; } };
})();
