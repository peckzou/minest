/* Pet Raising — one liquid-glass look for every control (44.5)
   The controls came from several versions (dark blue pills, white cards, solid violet buttons, black
   panels, teal gradients). They now all use the Minest board's liquid glass: a frosted clear body
   (blur 22 px, saturate 190 %), a bright rim on top, a thin white edge and a soft shadow; selected /
   primary items are a violet glass. Text is white.
   The pop-ups of the top-right buttons (wardrobe, render settings) open at the top right, next to
   their buttons, and a tap anywhere outside closes them. */
(function () {
  'use strict';
  if (window.__octoGlass) return;
  window.__octoGlass = true;
  var q = new URLSearchParams(location.search);
  var T = 'max(env(safe-area-inset-top,0px),' + Math.max(0, +q.get('sat') || 0) + 'px)';
  var BG = 'background:linear-gradient(180deg,rgba(255,255,255,.26) 0%,rgba(255,255,255,.08) 46%,rgba(255,255,255,.12) 100%)!important;';
  var EDGE = 'border:1px solid rgba(255,255,255,.32)!important;-webkit-backdrop-filter:blur(22px) saturate(190%)!important;backdrop-filter:blur(22px) saturate(190%)!important;color:#fff!important;';
  var SH = 'box-shadow:inset 0 1px 0 rgba(255,255,255,.6),inset 0 -1px 1px rgba(255,255,255,.14),inset 0 0 12px rgba(255,255,255,.06),0 10px 24px rgba(0,0,0,.28)!important;';
  var GLASS = BG + EDGE + SH;
  var PANEL = 'background:linear-gradient(180deg,rgba(255,255,255,.22) 0%,rgba(255,255,255,.07) 40%,rgba(255,255,255,.1) 100%)!important;' + EDGE +
    'box-shadow:inset 0 1px 0 rgba(255,255,255,.55),inset 0 -1px 1px rgba(255,255,255,.12),0 18px 44px rgba(0,0,0,.34)!important;';
  var ACTIVE = 'background:linear-gradient(180deg,rgba(190,160,255,.62) 0%,rgba(130,100,240,.42) 55%,rgba(150,120,255,.5) 100%)!important;border-color:rgba(230,215,255,.6)!important;color:#fff!important;';
  var INNER = 'background:rgba(255,255,255,.1)!important;border:1px solid rgba(255,255,255,.2)!important;color:#fff!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.25)!important;';
  var css = [
    // round / pill controls
    '.ui-exit,.ui-voice,#octo-cc-btn,.wd-btn,[data-v4-render-toggle],[data-v4-mini-toggle],[data-v4-crown-toggle],.oc2-btn,.oc2-handle,.oc2-needs,.utility-toggle,.octo-house-label{' + GLASS + '}',
    '.ui-voice{border-radius:50%!important}',
    '.ui-voice svg{filter:drop-shadow(0 1px 3px rgba(0,0,0,.3))}',
    '#octo-cc-btn[data-on="true"],.utility-toggle[aria-pressed="true"],.utility-toggle.active,[data-v4-mini-toggle][aria-pressed="true"]{' + ACTIVE + '}',
    '.oc2-done,.wd-tab.on,.wd-reset{' + ACTIVE + SH + '}',
    // panels, sheets, bubbles, toasts
    '.oc2-hud,.oc2-toast,.wd-toast,.oc2-tray,.oc2-thought,#octo-cc-panel,[data-v4-render-panel],.avatar-control-panel,.wd-sheet{' + PANEL + '}',
    '.oc2-thought:after{background:rgba(255,255,255,.18)!important}',
    '.oc2-toast,.wd-toast{color:#fff!important;text-shadow:0 1px 3px rgba(0,0,0,.25)}',
    '#octo-cc-status{background:rgba(255,255,255,.12)!important;border-radius:10px}',
    // contents of panels: light-on-glass
    '.oc2-snack{' + INNER + '}',
    '.oc2-bar{background:rgba(255,255,255,.18)!important}',
    '.wd-sheet *{color:#fff}',
    '.wd-head .lv,.wd-x,.wd-tab{' + INNER + '}',
    '.wd-next,.wd-group,.wd-card .st{color:rgba(255,255,255,.72)!important}',
    '.wd-card{' + INNER + 'border-width:1.5px!important}',
    '.wd-card.on{' + ACTIVE + '}',
    '.wd-card.on .st{color:#fff!important}',
    '.wd-card.locked .st{color:#ffd58a!important}',
    '.wd-card .try{background:rgba(255,213,138,.28)!important;color:#ffe7b8!important;border:1px solid rgba(255,213,138,.5)}',
    '.animation-toggle,.apc-search,.apc-dev-toggle,.avatar-control-panel .debug-grid button,.avatar-control-panel [data-v6-eye-row] button,[data-v6-eye-toggle]{' + INNER + '}',
    '.avatar-control-panel [data-v6-eye-row] button[data-active="true"],.avatar-control-panel .debug-grid button[data-active="true"],.avatar-control-panel .debug-grid button.active{' + ACTIVE + '}',
    '.animation-toggle input:checked+.animation-toggle-track{background:linear-gradient(135deg,#a98cff,#7b5cf0)!important}',
    '[data-v4-render-panel] input[type=range]{accent-color:#b59cff}',
    // top-right pop-ups: open at the top right, next to their buttons (they were bottom sheets)
    '.wd-sheet{left:auto!important;right:62px!important;top:calc(' + T + ' + 12px)!important;bottom:auto!important;width:min(340px,calc(100vw - 80px))!important;max-height:min(70vh,560px)!important;border-radius:22px!important;transform-origin:top right!important;' +
      'transform:translate(10px,-10px) scale(.9)!important;opacity:0;transition:transform .28s cubic-bezier(.2,1.2,.4,1),opacity .2s,visibility 0s .28s!important}',
    '.wd-sheet.open{transform:none!important;opacity:1;transition:transform .32s cubic-bezier(.2,1.2,.4,1),opacity .2s!important}',
    '[data-v4-render-panel]{right:62px!important;left:auto!important;top:calc(' + T + ' + 60px)!important;bottom:auto!important;border-radius:20px!important;transform-origin:top right}',
    '[data-v4-render-panel]:not([hidden]){animation:glassPop .28s cubic-bezier(.2,1.2,.4,1)}',
    '@keyframes glassPop{from{opacity:0;transform:translate(10px,-8px) scale(.9)}}'
  ].join('\n');
  var st = document.createElement('style'); st.id = 'octo-glass-v1'; st.textContent = css;
  // last in <head> so it wins over the modules' own styles (some modules add theirs later: re-append)
  function place() { (document.head || document.documentElement).appendChild(st); }
  place();
  new MutationObserver(function () { var h = document.head; if (h && h.lastElementChild !== st && st.parentNode) { var after = st.nextElementSibling; while (after) { if (after.tagName === 'STYLE' || after.tagName === 'LINK') { place(); break; } after = after.nextElementSibling; } } }).observe(document.head || document.documentElement, { childList: true });

  // a tap outside a top-right pop-up closes it
  document.addEventListener('pointerdown', function (e) {
    var t = e.target; if (!t || !t.closest) return;
    var sheet = document.querySelector('.wd-sheet.open');
    if (sheet && !t.closest('.wd-sheet, .wd-btn, .wd-toast')) { var W = window.__octoWardrobe; if (W && W.close) W.close(); else sheet.classList.remove('open'); }
    var rp = document.querySelector('[data-v4-render-panel]:not([hidden])');
    if (rp && !t.closest('[data-v4-render-panel], [data-v4-render-toggle]')) {
      var tg = document.querySelector('[data-v4-render-toggle]');
      if (tg) tg.click(); else rp.hidden = true;
    }
  }, true);
})();
