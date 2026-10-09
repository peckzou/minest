/* Pet Raising — minimal UI (44.3)
   - Icons only: Copy Cat, wardrobe, render, mini-pet and the bottom bar lose their labels; the needs
     panel becomes a small 💜 badge with the bond level (tap it to see the bars).
   - Auto-hide: those controls fade out after 4 s without touches and come back on any touch / mouse
     move (they stay while a panel, the wardrobe or a care activity is open).
   - Exit: an always-visible ✕ (top left, below the status bar) asks the Minest page to close Pet Raising.
   - The closed wardrobe sheet no longer sits invisibly over the screen (it blocked the render
     settings and the Copy Cat button).
   - No placeholder octopus: the built-in procedural one that showed while the real model downloaded
     is hidden; the 3D view fades in once the real octopus is ready. */
(function () {
  'use strict';
  if (window.__octoUI) return;
  window.__octoUI = true;
  var inFrame = window.parent && window.parent !== window;
  var css = [
    // wardrobe sheet: fully out of the way when closed
    '.wd-sheet:not(.open){visibility:hidden;pointer-events:none;transition:transform .32s cubic-bezier(.2,.9,.25,1),visibility 0s .32s}',
    // icon-only controls
    '#octo-cc-btn{width:44px;height:44px;padding:0!important;justify-content:center;border-radius:50%!important;font-size:20px!important}',
    '#octo-cc-btn span:last-child{display:none!important}',
    '.wd-btn{width:40px;height:40px;padding:0!important;border-radius:50%!important;font-size:18px!important;display:flex;align-items:center;justify-content:center}',
    '[data-v4-render-toggle],[data-v4-mini-toggle]{width:40px!important;height:40px!important;padding:0!important;border-radius:50%!important;font-size:0!important;display:flex!important;align-items:center;justify-content:center;right:14px!important}',
    '[data-v4-render-toggle]{top:calc(62px + env(safe-area-inset-top,0px))!important}',
    '[data-v4-mini-toggle]{top:calc(110px + env(safe-area-inset-top,0px))!important}',
    '[data-v4-render-toggle]:before{content:"🎨";font-size:18px}',
    '[data-v4-mini-toggle]:before{content:"🐙";font-size:18px}',
    '[data-v4-mini-toggle][aria-pressed="false"]:before{content:"🙈"}',
    '.utility-toggle-label{display:none!important}',
    // needs → a small 💜 badge (tap for the bars)
    '.oc2-needs{pointer-events:auto!important;cursor:pointer;top:calc(env(safe-area-inset-top,0px) + 62px)!important;transition:opacity .35s}',
    '.oc2-needs .lvn{display:none;font:800 11px -apple-system,system-ui;margin-left:1px}',
    '.oc2-needs:not(.open){min-width:0!important;width:44px;height:44px;padding:0!important;border-radius:50%!important;display:flex!important;align-items:center;justify-content:center;position:fixed}',
    '.oc2-needs:not(.open) > :not(.lv),.oc2-needs:not(.open) .pct,.oc2-needs:not(.open) .lvt{display:none!important}',
    '.oc2-needs:not(.open) .lv{display:flex!important;align-items:center;justify-content:center}',
    '.oc2-needs:not(.open) .lvn{display:inline;position:absolute;right:3px;bottom:2px;background:#8f6bff;color:#fff;border-radius:999px;padding:0 4px;font-size:9px;line-height:14px}',
    '.oc2-needs .hrt{font-style:normal;font-size:18px}',
    '.oc2-needs.open .hrt{font-size:12px}',
    // exit
    '.ui-exit{position:fixed;left:10px;top:calc(env(safe-area-inset-top,0px) + 10px);z-index:75;width:44px;height:44px;border-radius:50%;border:1px solid rgba(255,255,255,.3);background:rgba(10,26,43,.6);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);color:#fff;font:600 20px/1 system-ui;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 16px rgba(0,0,0,.25);cursor:pointer}',
    // auto-hide
    'html.ui-idle #octo-cc-btn,html.ui-idle .wd-btn,html.ui-idle [data-v4-render-toggle],html.ui-idle [data-v4-mini-toggle],html.ui-idle .oc2-needs:not(.open),html.ui-idle .utility-toggle-bar,html.ui-idle .oc2-handle{opacity:0!important;pointer-events:none!important}',
    '#octo-cc-btn,.wd-btn,[data-v4-render-toggle],[data-v4-mini-toggle],.utility-toggle-bar,.oc2-handle{transition:opacity .35s!important}',
    // the 3D view waits for the real octopus
    '.avatar-canvas canvas{transition:opacity .45s}',
    'html.ui-loading .avatar-canvas canvas{opacity:0!important}'
  ].join('\n');
  var st = document.createElement('style'); st.textContent = css; (document.head || document.documentElement).appendChild(st);

  // ---- 44.4 full screen inside Minest -------------------------------------------------------------
  // env(safe-area-inset-*) is 0 inside an iframe, so the Minest page passes the real insets in the URL
  // (?sat=&sab=) and draws its own ✕ (&pexit=1): a tap on the frame's ✕ didn't reach the app's page.
  var q = new URLSearchParams(location.search);
  var SAT = Math.max(0, +q.get('sat') || 0), SAB = Math.max(0, +q.get('sab') || 0), PEXIT = q.get('pexit') === '1';
  var T = 'max(env(safe-area-inset-top,0px),' + SAT + 'px)', B = 'max(env(safe-area-inset-bottom,0px),' + SAB + 'px)';
  var css2 = [
    PEXIT ? '.ui-exit{display:none!important}' : '.ui-exit{top:calc(' + T + ' + 10px)!important}',
    '.oc2-needs{top:calc(' + T + ' + 62px)!important}',
    '.oc2-hud{top:calc(' + T + ' + 12px)!important}',
    '.oc2-done{top:calc(' + T + ' + 54px)!important}',
    '.wd-btn{top:calc(' + T + ' + 14px)!important}',
    '[data-v4-render-toggle]{top:calc(' + T + ' + 62px)!important}',
    '[data-v4-mini-toggle]{top:calc(' + T + ' + 110px)!important}',
    '[data-v4-crown-toggle]{top:calc(' + T + ' + 14px)!important}',
    '.oc2-tray{bottom:calc(' + B + ' + 14px)!important}',
    '#octo-cc-btn{bottom:calc(' + B + ' + 92px)!important}',
    '#octo-cc-panel{bottom:calc(' + B + ' + 140px)!important}',
    '[data-v4-render-panel]{bottom:calc(' + B + ' + 58px)!important}',
    '.utility-toggle-bar{bottom:calc(' + B + ' + 10px)!important}',
    // the old small voice button in the bottom bar → one big voice button at the bottom left
    '.utility-toggle-bar button[aria-label="Live voice"]{display:none!important}',
    '.ui-voice{position:fixed;left:14px;bottom:calc(' + B + ' + 14px);z-index:62;width:60px;height:60px;border-radius:50%;border:1px solid rgba(255,255,255,.35);background:radial-gradient(circle at 35% 30%,rgba(255,255,255,.45),rgba(255,255,255,0) 45%),linear-gradient(135deg,#3fd9c8,#6f7cff 60%,#b26bff);box-shadow:0 10px 26px rgba(40,60,160,.45),inset 0 1px 0 rgba(255,255,255,.5);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:opacity .35s,transform .15s;-webkit-tap-highlight-color:transparent}',
    '.ui-voice:active{transform:scale(.92)}',
    '.ui-voice svg{width:26px;height:26px}',
    'html.ui-idle .ui-voice{opacity:0!important;pointer-events:none!important}'
  ].join('\n');
  var st2 = document.createElement('style'); st2.textContent = css2; (document.head || document.documentElement).appendChild(st2);
  function addVoice() {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'ui-voice'; b.setAttribute('aria-label', 'Voice');
    b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';
    b.addEventListener('pointerdown', function (e) { e.stopPropagation(); }, true);
    b.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      if (inFrame) { try { window.parent.postMessage({ type: 'minest-voice', action: 'open' }, '*'); } catch (err) {} }
    });
    document.body.appendChild(b);
  }

  // ---- no placeholder octopus ---------------------------------------------------------------------
  document.documentElement.classList.add('ui-loading');
  (function waitModel(n) {
    var av = window.__octopusAvatar;
    if (av && av.character && av.character.group && !av.importedModel) av.character.group.visible = false;
    if (av && av.importedModel) { setTimeout(function () { document.documentElement.classList.remove('ui-loading'); }, 250); return; }
    if (n < 600) setTimeout(function () { waitModel(n + 1); }, 50);
    else document.documentElement.classList.remove('ui-loading');
  })(0);

  // ---- exit ---------------------------------------------------------------------------------------
  function addExit() {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'ui-exit'; b.textContent = '✕'; b.setAttribute('aria-label', 'Exit Pet Raising');
    b.addEventListener('pointerdown', function (e) { e.stopPropagation(); }, true);
    b.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      if (inFrame) { try { window.parent.postMessage({ type: 'minest-pet', action: 'close' }, '*'); } catch (err) {} }
      else if (history.length > 1) history.back();
    });
    document.body.appendChild(b);
  }

  // ---- needs badge: tap to open the bars --------------------------------------------------------------
  var needsTimer = 0;
  document.addEventListener('click', function (e) {
    var n = e.target && e.target.closest ? e.target.closest('.oc2-needs') : null;
    if (!n) return;
    e.stopPropagation();
    n.classList.toggle('open');
    clearTimeout(needsTimer);
    if (n.classList.contains('open')) needsTimer = setTimeout(function () { n.classList.remove('open'); }, 5000);
  }, true);
  document.addEventListener('pointerdown', function (e) { if (e.target && e.target.closest && e.target.closest('.oc2-needs')) e.stopPropagation(); }, true);

  // ---- auto-hide --------------------------------------------------------------------------------
  var idleTimer = 0;
  function busy() {
    var d = document.documentElement;
    return !!(document.querySelector('.avatar-control-panel') || document.querySelector('.wd-sheet.open') || d.classList.contains('oc2-active') ||
      (window.__octoCopyCat && window.__octoCopyCat.on) || document.querySelector('[data-v4-render-panel]:not([hidden])'));
  }
  function wake() {
    document.documentElement.classList.remove('ui-idle');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function sleep() { if (busy()) { idleTimer = setTimeout(sleep, 1500); return; } document.documentElement.classList.add('ui-idle'); }, 4000);
  }
  ['pointerdown', 'touchstart', 'keydown'].forEach(function (ev) { window.addEventListener(ev, wake, { capture: true, passive: true }); });
  window.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse') wake(); }, { passive: true });

  function boot() { if (!document.body) return setTimeout(boot, 50); addExit(); if (inFrame) addVoice(); wake(); }
  boot();
})();
