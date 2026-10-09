/* Minest Desktop Pet · host (runs before the Mini Pet code taken from the iPhone build)
   The pet code is the web Mini Pet itself; this file only tells it where it lives:
   - window.__miniPetHost: dragging the pet moves the native window (the pet stays put inside it),
     the pet's own tip scheduler stays off (tips come from the Minest page over the link);
   - asset paths point at this bundle (models/, cosmetics-v1.js);
   - the transparent window lets clicks through everywhere except the pet and what it shows
     (menu bubbles, tip, inbox): the rectangles are reported to the native side. */
(function () {
  'use strict';
  function post(m) { try { window.webkit.messageHandlers.desktopPet.postMessage(m); } catch (e) {} }
  window.__desktopPost = post;

  window.__miniPetHost = {
    mode: 'desktop',
    drag: function (phase, sx, sy) { post({ type: phase === 'start' ? 'dragStart' : 'dragEnd', screenX: sx || 0, screenY: sy || 0 }); }
  };
  window.minestPetAsset = function (path) {
    return String(path).replace(/^octopus-pet-raising-v6\//, '').replace(/\?.*$/, '');
  };

  var css = document.createElement('style');
  css.textContent =
    'html,body{margin:0;width:100%;height:100%;overflow:hidden;background:transparent!important;-webkit-user-select:none;user-select:none}' +
    '#minest-mini-pet-p0{left:calc(50% - 80px)!important;top:calc(58% - 80px)!important;width:160px!important;height:160px!important;cursor:grab}' +
    '#minest-mini-pet-p0 canvas{filter:drop-shadow(0 10px 16px rgba(0,0,0,.28))}';
  document.head.appendChild(css);

  // right click → the native menu
  document.addEventListener('contextmenu', function (e) { e.preventDefault(); post({ type: 'rightClick' }); });

  // clickable areas → native (everything else lets the click through to the desktop)
  var SEL = '#minest-mini-pet-p0, .mpet-menu button, .mpet-tip, .mpet-inbox, .mn-desk-card';
  var last = '';
  function report() {
    var out = [];
    document.querySelectorAll(SEL).forEach(function (el) {
      if (el.classList.contains('is-hidden')) return;
      var r = el.getBoundingClientRect();
      if (r.width > 2 && r.height > 2) out.push([Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]);
    });
    var j = JSON.stringify(out);
    if (j !== last) { last = j; post({ type: 'hit', rects: out }); }
  }
  new MutationObserver(function () { setTimeout(report, 30); }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
  setInterval(report, 500);
  window.addEventListener('resize', report);
})();
