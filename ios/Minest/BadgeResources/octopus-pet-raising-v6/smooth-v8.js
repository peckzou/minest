/* Pet Raising — smoothness + one tidy set of buttons (46.7)
   Smoothness: on the iPhone the frame time went to the GPU, not to scripts (≈2.7 ms of JS a frame on a
   desktop). Every frame it re-blurred the backdrop of 23 glass buttons / panels over a moving scene,
   blended two full-screen animated layers (mix-blend-mode: screen) and re-filtered three animated light
   rays and the depth mist (blur). Here: no backdrop blur (the glass is drawn with gradients instead),
   normal blending, no blur on those layers (they are soft gradients already) — the same look, a fraction
   of the work. The 3D octopus draws at ≤1.25× pixel density (perf-v7.js), the sea-life / house / chest
   canvases at ≤1.25× / 1× (their own files).
   Buttons: one look (46 px round glass, white icons at 20 px) and two neat columns — left: ✕ (the Minest
   page's), 💜; right: 👗 🎨 🙈 — with 🎭 above ≋ at the bottom right and the voice button at the bottom
   left; the hint line sits between them. The Minest page's ✕ fades with the other controls: this frame
   tells it when the controls hide (postMessage 'minest-pet' / 'idle'). */
(function () {
  'use strict';
  if (window.__octoSmooth) return;
  window.__octoSmooth = true;
  var q = new URLSearchParams(location.search);
  var T = 'max(env(safe-area-inset-top,0px),' + Math.max(0, +q.get('sat') || 0) + 'px)';
  var B = 'max(env(safe-area-inset-bottom,0px),' + Math.max(0, +q.get('sab') || 0) + 'px)';
  var S = 46, GAP = 8, STEP = S + GAP;
  var GLASS = 'background:radial-gradient(120% 90% at 30% 0%,rgba(255,255,255,.34),rgba(255,255,255,0) 55%),linear-gradient(180deg,rgba(120,200,225,.34),rgba(14,60,88,.5))!important;' +
    'border:1px solid rgba(255,255,255,.34)!important;color:#fff!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;' +
    'box-shadow:inset 0 1px 0 rgba(255,255,255,.55),inset 0 -1px 1px rgba(255,255,255,.12),0 8px 20px rgba(0,20,40,.32)!important;';
  var PANEL = 'background:linear-gradient(180deg,rgba(40,110,140,.94),rgba(10,44,68,.95))!important;border:1px solid rgba(255,255,255,.28)!important;' +
    '-webkit-backdrop-filter:none!important;backdrop-filter:none!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.4),0 18px 44px rgba(0,0,0,.38)!important;';
  var ROUND = 'width:' + S + 'px!important;height:' + S + 'px!important;min-width:0!important;min-height:0!important;padding:0!important;border-radius:50%!important;' +
    'display:flex!important;align-items:center!important;justify-content:center!important;font-size:20px!important;line-height:1!important;';
  var css = [
    // ---- no live blur anywhere in the frame; cheap blending on the big animated layers
    '*{-webkit-backdrop-filter:none!important;backdrop-filter:none!important}',
    '.water-haze,.ocean-backdrop:before{mix-blend-mode:normal!important}',
    '.water-haze{opacity:.45!important}',
    '.light-ray,.depth-mist{filter:none!important}',
    '.light-ray{opacity:.35}',
    // ---- one glass look
    '.wd-btn,[data-v4-render-toggle],[data-v4-mini-toggle],#octo-cc-btn,.oc2-needs,.oc2-handle,.oc2-btn,.utility-toggle,.ui-voice,.octo-house-label{' + GLASS + '}',
    '.oc2-hud,.oc2-toast,.wd-toast,.oc2-tray,.oc2-thought,#octo-cc-panel,[data-v4-render-panel],.avatar-control-panel,.wd-sheet,.care-dock,.control-panel{' + PANEL + '}',
    '#octo-cc-btn[data-on="true"],.utility-toggle[aria-pressed="true"],.utility-toggle[aria-expanded="true"],[data-v4-mini-toggle][aria-pressed="true"]{background:linear-gradient(180deg,rgba(190,160,255,.75),rgba(120,90,230,.7))!important;border-color:rgba(230,215,255,.7)!important}',
    // ---- round buttons, all the same size
    '.wd-btn,[data-v4-render-toggle],[data-v4-mini-toggle],#octo-cc-btn,.oc2-needs:not(.open),.utility-toggle-bar .utility-toggle{' + ROUND + '}',
    '[data-v4-render-toggle],[data-v4-mini-toggle]{font-size:0!important;color:transparent!important}',
    '[data-v4-render-toggle]:before,[data-v4-mini-toggle]:before,.oc2-needs .hrt{font-size:20px!important;color:#fff}',
    '.utility-toggle-bar .utility-toggle svg{width:20px!important;height:20px!important}',
    // left column: (the Minest ✕ at T+8), 💜
    '.oc2-needs{left:12px!important;top:calc(' + T + ' + ' + (8 + STEP) + 'px)!important}',
    // right column: 👗 🎨 🙈
    '.wd-btn{right:12px!important;left:auto!important;top:calc(' + T + ' + 8px)!important}',
    '[data-v4-render-toggle]{right:12px!important;top:calc(' + T + ' + ' + (8 + STEP) + 'px)!important}',
    '[data-v4-mini-toggle]{right:12px!important;top:calc(' + T + ' + ' + (8 + 2 * STEP) + 'px)!important}',
    // bottom right: ≋, 🎭 above it
    '.utility-toggle-bar{right:12px!important;bottom:calc(' + B + ' + 12px)!important;opacity:1!important;gap:0!important;padding:0!important;background:none!important;border:0!important;box-shadow:none!important}',
    '#octo-cc-btn{right:12px!important;left:auto!important;bottom:calc(' + B + ' + ' + (12 + STEP) + 'px)!important}',
    '#octo-cc-panel{bottom:calc(' + B + ' + ' + (12 + 2 * STEP) + 'px)!important}',
    // bottom left: voice, a little larger
    '.ui-voice{left:12px!important;bottom:calc(' + B + ' + 12px)!important;width:56px!important;height:56px!important}',
    '.ui-voice svg{width:24px!important;height:24px!important}',
    // the hint line between voice and ≋, one line
    '.conversation-overlay{left:80px!important;right:70px!important;bottom:calc(' + B + ' + 22px)!important;align-items:stretch!important}',
    '.conversation-overlay p{max-width:100%!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:8px 12px!important;border-radius:999px!important;font-size:12px!important;' + PANEL.replace(/box-shadow:[^;]*;/, 'box-shadow:none!important;') + '}',
    // the 💜 tab on the left edge: same glass, tidy
    '.oc2-handle{width:24px!important;height:58px!important;border-left:0!important;border-radius:0 16px 16px 0!important}',
    // tap feedback, the same everywhere
    '.wd-btn:active,[data-v4-render-toggle]:active,[data-v4-mini-toggle]:active,#octo-cc-btn:active,.oc2-needs:active,.utility-toggle:active,.ui-voice:active{transform:scale(.92)!important}'
  ].join('\n');
  var st = document.createElement('style'); st.id = 'pet-smooth-v8'; st.textContent = css;
  // after every other style (several files add theirs late)
  var place = function () { (document.body || document.head || document.documentElement).appendChild(st); };
  place();
  window.addEventListener('load', function () { place(); setTimeout(place, 1500); setTimeout(place, 4000); });

  // ---- the Minest page's ✕ hides with the controls
  if (window.parent && window.parent !== window) {
    var was = null;
    var tell = function () {
      var idle = document.documentElement.classList.contains('ui-idle');
      if (idle === was) return; was = idle;
      try { window.parent.postMessage({ type: 'minest-pet', action: 'idle', idle: idle }, '*'); } catch (e) {}
    };
    new MutationObserver(tell).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  }
})();
