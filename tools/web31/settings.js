/* Minest · Board Settings Studio, refined (iPhone 46.1 / iPad 45.4 / web31): one sheet of liquid glass with no
   outlines anywhere — soft glass cards, a segmented tab bar with a raised glass pill for the open tab, glass
   buttons — and Cloud Sync lives here now (top right of the sheet), not in the Dock / menu bar. */
(function () {
  'use strict';
  if (window.__mnSettingsStudio) return;
  window.__mnSettingsStudio = true;
  // (html body … lifts these rules over the app's older glass-button rules on every build)
  var M = 'html body .board-settings-modal', L = 'html:has(.theme-white) body .board-settings-modal';
  var css = document.createElement('style'); css.id = 'mn-settings-css';
  css.textContent = [
    // the sheet
    M + '{border:0!important;border-radius:34px!important;background:linear-gradient(180deg,rgba(44,52,70,.80) 0%,rgba(22,28,40,.90) 100%)!important;',
    '-webkit-backdrop-filter:blur(40px) saturate(180%)!important;backdrop-filter:blur(40px) saturate(180%)!important;',
    'box-shadow:inset 0 1px 0 rgba(255,255,255,.16),inset 0 0 0 .5px rgba(255,255,255,.06),0 30px 80px rgba(0,0,0,.5)!important;overflow:hidden}',
    // no outlines anywhere inside
    M + ' *{border-color:transparent!important}',
    M + ' :is(.border-b,.border-t){border-width:0!important}',
    // header
    M + ' > :first-child{padding:18px 18px 10px 20px!important;background:transparent!important}',
    M + ' > :first-child h3{font-size:17px!important;letter-spacing:-.01em}',
    M + ' > :first-child > :first-child > :first-child{border-radius:12px!important;background:linear-gradient(160deg,rgba(52,211,153,.32),rgba(16,185,129,.14))!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.25)}',
    // the tab bar: a segmented control, the open tab a raised glass pill
    M + ' > :nth-child(2){background:transparent!important;padding:4px 14px 10px!important}',
    M + ' > :nth-child(2) > div{background:rgba(255,255,255,.06)!important;border-radius:20px!important;padding:5px!important;gap:4px!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;box-shadow:inset 0 1px 2px rgba(0,0,0,.25)}',
    M + ' > :nth-child(2) button{border-radius:15px!important;font-size:13px!important;min-height:38px;transition:background .2s,box-shadow .2s,opacity .2s}',
    M + ' > :nth-child(2) button:not([class*="opacity-"]){background:linear-gradient(180deg,rgba(255,255,255,.26),rgba(255,255,255,.12))!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.4),0 4px 12px rgba(0,0,0,.25)!important}',
    // section cards: soft glass, no frame
    M + ' .rounded-2xl:not(button){border-radius:22px!important}',
    M + ' :is(.p-4.rounded-2xl,.p-3.rounded-2xl):not(button){background:rgba(255,255,255,.055)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.07)!important}',
    // inner segmented choices (All Tasks / Active / Completed, priorities…)
    M + ' :is(.bg-black\\/30,[class*="bg-black/30"]){background:rgba(0,0,0,.22)!important;border-radius:16px!important;box-shadow:inset 0 1px 2px rgba(0,0,0,.25)}',
    M + ' :is(.bg-black\\/30,[class*="bg-black/30"]) button{border-radius:12px!important}',
    M + ' :is(.bg-black\\/30,[class*="bg-black/30"]) button:not([class*="opacity-"]){background:linear-gradient(180deg,rgba(255,255,255,.24),rgba(255,255,255,.1))!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 3px 10px rgba(0,0,0,.22)!important}',
    // the choices that are not picked: flat, no glass (the app's older glass button style would fill them)
    M + ' > :nth-child(2) button[class*="opacity-"],' + M + ' :is(.bg-black\\/30,[class*="bg-black/30"]) button[class*="opacity-"]{background:transparent!important;box-shadow:none!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important}',
    // option rows / chips
    M + ' button.rounded-2xl,' + M + ' button.rounded-xl{box-shadow:inset 0 1px 0 rgba(255,255,255,.12)}',
    M + ' button.rounded-2xl:not([class*="bg-emerald"]){background:rgba(255,255,255,.05)!important}',
    M + ' button.rounded-xl.text-white[style*="background"],' + M + ' button.rounded-xl.text-white[class*="bg-"]{border-radius:14px!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.3),0 6px 16px rgba(0,0,0,.22)!important}',
    // footer
    M + ' > :last-child{background:transparent!important;padding:12px 16px 16px!important}',
    M + ' > :last-child button{border-radius:16px!important;min-height:40px;padding-left:18px!important;padding-right:18px!important}',
    M + ' > :last-child button:not([class*="bg-emerald"]){background:rgba(255,255,255,.1)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.18)}',
    M + ' > :last-child button[class*="bg-emerald"]{background:linear-gradient(180deg,#34d399,#059669)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 8px 22px rgba(16,185,129,.35)!important}',
    // light theme
    L + '{background:linear-gradient(180deg,rgba(255,255,255,.86),rgba(241,245,249,.92))!important;box-shadow:inset 0 1px 0 #fff,0 30px 80px rgba(15,23,42,.22)!important}',
    L + ' > :nth-child(2) > div,html:has(.theme-white) ' + M + ' :is(.bg-black\\/30,[class*="bg-black/30"]){background:rgba(15,23,42,.06)!important;box-shadow:inset 0 1px 2px rgba(15,23,42,.08)}',
    L + ' :is(.p-4.rounded-2xl,.p-3.rounded-2xl):not(button),html:has(.theme-white) ' + M + ' button.rounded-2xl:not([class*="bg-emerald"]){background:rgba(15,23,42,.045)!important;box-shadow:none!important}',
    L + ' > :nth-child(2) button:not([class*="opacity-"]){background:#fff!important;box-shadow:0 2px 8px rgba(15,23,42,.14)!important}',
    L + ' > :last-child button:not([class*="bg-emerald"]){background:rgba(15,23,42,.06)!important;box-shadow:none}',
    // Cloud Sync in the sheet's header
    M + ' > .mn-set-head{position:relative!important}' + M + ' > .mn-set-head > :first-child{margin-right:150px}',
    '@media (max-width:520px){' + M + ' > .mn-set-head > :first-child{margin-right:48px}.mn-set-cloud span{display:none}.mn-set-cloud{padding:0 5px!important}}',
    'html body .mn-set-cloud{position:absolute!important;right:58px!important;top:50%!important;transform:translateY(-50%);margin:0!important;display:inline-flex;align-items:center;gap:7px;height:34px;padding:0 13px 0 6px;border:0;border-radius:17px;color:inherit;font:600 12.5px -apple-system,BlinkMacSystemFont,"SF Pro Text",Inter,system-ui,sans-serif;cursor:pointer;',
    'background:linear-gradient(180deg,rgba(255,255,255,.2),rgba(255,255,255,.08));box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 4px 12px rgba(0,0,0,.2);-webkit-tap-highlight-color:transparent}',
    '.mn-set-cloud i{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:rgba(56,189,248,.22);color:#7dd3fc;overflow:hidden}',
    '.mn-set-cloud i img{width:100%;height:100%;object-fit:cover}.mn-set-cloud i svg{width:15px;height:15px}',
    '.mn-set-cloud.on i{box-shadow:0 0 0 1.5px #34d399}',
    '.mn-set-cloud:active{transform:translateY(-50%) scale(.96)}',
    'html:has(.theme-white) .mn-set-cloud{background:rgba(15,23,42,.06);box-shadow:none}'
  ].join('\n');
  (document.head || document.documentElement).appendChild(css);

  var CLOUD_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>';
  // the app's own Cloud button (it stays in the page, out of sight)
  function cloudBtn() {
    var c = document.querySelector('[data-mn=cloud]');
    if (c) return c.matches('button') ? c : c.querySelector('button');
    var all = document.querySelectorAll('header button');
    for (var i = 0; i < all.length; i++) if (/^(Cloud sync|Cloud Sync|Signed in)/i.test(all[i].getAttribute('aria-label') || all[i].title || '')) return all[i];
    return null;
  }
  function decorate(m) {
    var head = m.firstElementChild, close = head && head.lastElementChild;
    if (!close || head.querySelector('.mn-set-cloud')) return;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'mn-set-cloud';
    var o = cloudBtn(), img = o && o.querySelector('img'), signed = /^Signed in/i.test(o ? (o.getAttribute('aria-label') || o.title || '') : '') || !!img;
    b.innerHTML = '<i>' + (img ? '<img alt="" src="' + img.getAttribute('src') + '">' : CLOUD_SVG) + '</i><span>' + (signed ? 'Cloud Sync' : 'Sign in · Sync') + '</span>';
    b.classList.toggle('on', signed);
    b.title = o ? (o.getAttribute('aria-label') || o.title || 'Cloud Sync') : 'Cloud Sync';
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      var btn = cloudBtn(); if (!btn) return;
      close.click();                                  // the settings sheet steps aside for the Cloud sheet
      setTimeout(function () { btn.click(); }, 180);
    });
    // React owns the header's own children: the button is only added, never moves them
    head.classList.add('mn-set-head'); head.appendChild(b);
  }
  new MutationObserver(function () {
    var m = document.querySelector('.board-settings-modal'); if (m) decorate(m);
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
